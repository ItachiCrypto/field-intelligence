// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe/client';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id, role')
      .eq('id', user.id)
      .single();

    if (!profile?.company_id || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Acces refuse' }, { status: 403 });
    }

    const serviceClient = createServiceClient();

    const { data: company } = await serviceClient
      .from('companies')
      .select('id, stripe_customer_id, stripe_subscription_id')
      .eq('id', profile.company_id)
      .single();

    if (!company) {
      return NextResponse.json({ error: 'Entreprise introuvable' }, { status: 404 });
    }

    // Cancel active Stripe subscription if exists
    if (company.stripe_subscription_id) {
      try {
        await stripe.subscriptions.cancel(company.stripe_subscription_id);
      } catch (e) {
        // Subscription might already be cancelled, continue
        console.warn('Could not cancel subscription:', e);
      }
    }

    // Update company to free plan
    await serviceClient
      .from('companies')
      .update({
        plan: 'free',
        plan_user_limit: 3,
        stripe_subscription_id: null,
        subscription_status: null,
      })
      .eq('id', company.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Downgrade error:', error);
    return NextResponse.json(
      { error: 'Erreur lors du changement de plan' },
      { status: 500 }
    );
  }
}
