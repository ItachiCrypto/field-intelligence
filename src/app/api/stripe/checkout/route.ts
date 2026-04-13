// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe/client';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id, role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.company_id) {
      return NextResponse.json({ error: 'Profil ou entreprise introuvable' }, { status: 400 });
    }

    if ((profile as any).role !== 'admin') {
      return NextResponse.json({ error: 'Acces reserve aux administrateurs' }, { status: 403 });
    }

    const { priceId } = await request.json();

    if (!priceId) {
      return NextResponse.json({ error: 'priceId requis' }, { status: 400 });
    }

    const serviceClient = createServiceClient();

    const { data: company, error: companyError } = await serviceClient
      .from('companies')
      .select('id, name, stripe_customer_id')
      .eq('id', profile.company_id)
      .single();

    if (companyError || !company) {
      return NextResponse.json({ error: 'Entreprise introuvable' }, { status: 404 });
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

    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/admin/billing?status=success`,
      cancel_url: `${appUrl}/admin/billing?status=cancelled`,
      metadata: { company_id: company.id },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de la session de paiement' },
      { status: 500 }
    );
  }
}
