// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { createServiceClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe/client';
import { getPlanByStripePriceId } from '@/lib/stripe/plans';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

/**
 * Helper: load the company row that this Stripe customer belongs to. Since
 * `stripe_customer_id` is unique at the DB layer (see migration 00006), this
 * returns at most one row.
 */
async function findCompanyByCustomer(
  serviceClient: ReturnType<typeof createServiceClient>,
  customerId: string
) {
  const { data } = await serviceClient
    .from('companies')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();
  return data;
}

/**
 * Helper: idempotency check. Stripe retries webhooks on 5xx responses, so we
 * record every event id we've already processed in a dedicated table. If the
 * table write fails with a unique-constraint violation, we short-circuit.
 *
 * Returns `true` if this event is NEW and should be processed, `false` if we
 * have already handled it.
 */
async function markEventProcessed(
  serviceClient: ReturnType<typeof createServiceClient>,
  event: Stripe.Event
): Promise<boolean> {
  const { error } = await serviceClient
    .from('stripe_webhook_events')
    .insert({
      event_id: event.id,
      event_type: event.type,
    });

  if (error) {
    // 23505 = unique_violation in Postgres. That means Stripe retried an
    // event we've already recorded — acknowledge but do nothing else.
    if ((error as { code?: string }).code === '23505') return false;
    // Any other DB error is a real problem — surface it by throwing.
    throw error;
  }
  return true;
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    // Never log the signature or raw payload in error paths.
    console.error(
      '[stripe-webhook] signature verification failed:',
      err instanceof Error ? err.message : 'unknown'
    );
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const serviceClient = createServiceClient();

  // ---------------------------------------------------------------------
  // Idempotency: de-duplicate retried deliveries of the same event id.
  // ---------------------------------------------------------------------
  try {
    const isNew = await markEventProcessed(serviceClient, event);
    if (!isNew) {
      return NextResponse.json({ received: true, duplicate: true });
    }
  } catch (err) {
    console.error(
      '[stripe-webhook] idempotency record failed:',
      err instanceof Error ? err.message : 'unknown'
    );
    // Fail closed: if we can't record the event, better to let Stripe retry
    // than to double-process a payment mutation.
    return NextResponse.json(
      { error: 'Idempotency store unavailable' },
      { status: 500 }
    );
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const subscriptionId = session.subscription as string | null;
        if (!subscriptionId) break;

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0]?.price?.id ?? null;
        const plan = priceId ? getPlanByStripePriceId(priceId) : null;
        if (!plan) break;

        const customerId = subscription.customer as string;

        // Resolution du target company en suivant cet ordre de confiance
        // (du plus a moins fiable) :
        //   1. Le customer Stripe a ete cree par /api/stripe/checkout avec
        //      metadata.company_id. On retrieve et on relit cette metadata
        //      directement aupres de Stripe : c'est la source de verite
        //      authentifiee.
        //   2. companies.stripe_customer_id deja persiste = la customer
        //      a deja ete liee a une company chez nous. Match exact requis.
        //
        // On rejette tout fallback session.metadata / client_reference_id
        // qui pourrait etre forge si quelqu'un cree une checkout en dehors
        // de /api/stripe/checkout (Payment Links, integration externe).
        let resolvedCompanyId: string | null = null;
        try {
          const customer = await stripe.customers.retrieve(customerId);
          if (
            customer &&
            !('deleted' in customer && customer.deleted) &&
            customer.metadata?.company_id
          ) {
            resolvedCompanyId = customer.metadata.company_id;
          }
        } catch {
          /* customer fetch failed — fall through to DB lookup */
        }

        if (!resolvedCompanyId) {
          const { data: byCustomer } = await serviceClient
            .from('companies')
            .select('id')
            .eq('stripe_customer_id', customerId)
            .maybeSingle();
          resolvedCompanyId = byCustomer?.id ?? null;
        }

        if (!resolvedCompanyId) {
          console.error('[stripe-webhook] cannot resolve company for customer', customerId);
          break;
        }

        // Defense in depth : si la company a deja un stripe_customer_id, il
        // doit matcher. Empeche un attaquant de forcer un upgrade en
        // re-attachant un customer a une autre company via une checkout
        // externe.
        const { data: company } = await serviceClient
          .from('companies')
          .select('id, stripe_customer_id')
          .eq('id', resolvedCompanyId)
          .single();
        if (!company) break;
        if (
          company.stripe_customer_id &&
          company.stripe_customer_id !== customerId
        ) {
          console.error(
            '[stripe-webhook] customer mismatch for company',
            resolvedCompanyId,
          );
          break;
        }

        await serviceClient
          .from('companies')
          .update({
            plan: plan.id,
            plan_user_limit: plan.userLimit,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            subscription_status: 'active',
          })
          .eq('id', resolvedCompanyId);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const priceId = subscription.items.data[0]?.price?.id ?? null;

        const company = await findCompanyByCustomer(serviceClient, customerId);
        if (!company) break;

        const plan = priceId ? getPlanByStripePriceId(priceId) : null;
        const updateData: Record<string, unknown> = {
          subscription_status: subscription.status,
        };
        if (plan) {
          updateData.plan = plan.id;
          updateData.plan_user_limit = plan.userLimit;
        }
        await serviceClient
          .from('companies')
          .update(updateData)
          .eq('id', company.id);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const company = await findCompanyByCustomer(serviceClient, customerId);
        if (!company) break;
        await serviceClient
          .from('companies')
          .update({
            plan: 'free',
            plan_user_limit: 3,
            subscription_status: 'canceled',
          })
          .eq('id', company.id);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        const company = await findCompanyByCustomer(serviceClient, customerId);
        if (!company) break;
        await serviceClient
          .from('companies')
          .update({ subscription_status: 'past_due' })
          .eq('id', company.id);
        break;
      }

      default:
        // Unhandled event type — acknowledge silently.
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error(
      '[stripe-webhook] handler error:',
      error instanceof Error ? error.message : 'unknown'
    );
    // Return 500 so Stripe will retry. Because we store idempotency marker
    // before processing, we need to clean up to allow retries to re-process
    // the mutation safely.
    await serviceClient
      .from('stripe_webhook_events')
      .delete()
      .eq('event_id', event.id);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
