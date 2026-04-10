// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe/client';
import { getPlanByStripePriceId } from '@/lib/stripe/plans';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const serviceClient = createServiceClient();

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const companyId = session.metadata?.company_id;

        if (!companyId) {
          console.error('No company_id in checkout session metadata');
          break;
        }

        const subscriptionId = session.subscription as string;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0]?.price?.id;

        if (!priceId) {
          console.error('No price ID found in subscription');
          break;
        }

        const plan = getPlanByStripePriceId(priceId);

        if (!plan) {
          console.error('Unknown price ID:', priceId);
          break;
        }

        await serviceClient
          .from('companies')
          .update({
            plan: plan.id,
            plan_user_limit: plan.userLimit,
            stripe_subscription_id: subscriptionId,
            subscription_status: 'active',
          })
          .eq('id', companyId);

        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const customerId = subscription.customer as string;
        const priceId = subscription.items.data[0]?.price?.id;

        const { data: company } = await serviceClient
          .from('companies')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (!company) {
          console.error('No company found for customer:', customerId);
          break;
        }

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
        const subscription = event.data.object;
        const customerId = subscription.customer as string;

        const { data: company } = await serviceClient
          .from('companies')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (!company) {
          console.error('No company found for customer:', customerId);
          break;
        }

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
        const invoice = event.data.object;
        const customerId = invoice.customer as string;

        const { data: company } = await serviceClient
          .from('companies')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (!company) {
          console.error('No company found for customer:', customerId);
          break;
        }

        await serviceClient
          .from('companies')
          .update({ subscription_status: 'past_due' })
          .eq('id', company.id);

        break;
      }

      default:
        // Unhandled event type — ignore silently
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
