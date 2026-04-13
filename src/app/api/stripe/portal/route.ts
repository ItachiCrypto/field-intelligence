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

    const serviceClient = createServiceClient();

    const { data: company, error: companyError } = await serviceClient
      .from('companies')
      .select('stripe_customer_id')
      .eq('id', profile.company_id)
      .single();

    if (companyError || !company?.stripe_customer_id) {
      return NextResponse.json({ error: 'Aucun abonnement Stripe trouvé' }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    const session = await stripe.billingPortal.sessions.create({
      customer: company.stripe_customer_id,
      return_url: `${appUrl}/admin/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Stripe portal error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de la session du portail' },
      { status: 500 }
    );
  }
}
