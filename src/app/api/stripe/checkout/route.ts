// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe/client';
import { PLANS } from '@/lib/stripe/plans';

/**
 * Build the set of Stripe price IDs this app is allowed to charge against.
 * Anything outside this set is rejected — a client cannot escalate to an
 * arbitrary (possibly cheaper) Stripe price by editing the request body.
 */
function allowedPriceIds(): Set<string> {
  const ids = new Set<string>();
  for (const plan of Object.values(PLANS)) {
    if (plan.stripePriceId) ids.add(plan.stripePriceId);
  }
  return ids;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id, role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.company_id) {
      return NextResponse.json(
        { error: 'Profile or company not found' },
        { status: 400 }
      );
    }

    if (profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let body: { priceId?: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }
    const priceId = typeof body.priceId === 'string' ? body.priceId : '';

    if (!priceId || !allowedPriceIds().has(priceId)) {
      // Whitelist check — never hit Stripe with a client-controlled priceId.
      return NextResponse.json({ error: 'Invalid priceId' }, { status: 400 });
    }

    const serviceClient = createServiceClient();
    const { data: company, error: companyError } = await serviceClient
      .from('companies')
      .select('id, name, stripe_customer_id')
      .eq('id', profile.company_id)
      .single();

    if (companyError || !company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    let stripeCustomerId = company.stripe_customer_id;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: company.name,
        metadata: { company_id: company.id },
      });
      stripeCustomerId = customer.id;

      await serviceClient
        .from('companies')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', company.id);
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/admin/billing?status=success`,
      cancel_url: `${appUrl}/admin/billing?status=cancelled`,
      // Metadata used by the webhook to look up the target company. We also
      // keep company_id on subscription_data so later subscription.* events
      // carry it through.
      metadata: { company_id: company.id },
      subscription_data: {
        metadata: { company_id: company.id },
      },
      // Hard client_reference_id too, belt and braces.
      client_reference_id: company.id,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('[stripe-checkout] error:', error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: 'Checkout session creation failed' },
      { status: 500 }
    );
  }
}
