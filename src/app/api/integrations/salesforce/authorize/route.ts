// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSalesforceAuthUrl } from '@/lib/crm/salesforce';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get profile to retrieve company_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles' as any)
      .select('company_id')
      .eq('id', user.id)
      .single() as any;

    if (profileError || !profile?.company_id) {
      return NextResponse.json(
        { error: 'Profile or company not found' },
        { status: 400 }
      );
    }

    // Generate state parameter for CSRF protection
    const state = Buffer.from(
      JSON.stringify({
        company_id: profile.company_id,
        timestamp: Date.now(),
      })
    ).toString('base64');

    if (!process.env.SALESFORCE_CLIENT_ID) {
      // Redirect back with error message
      const errorUrl = new URL('/admin/integrations', process.env.NEXT_PUBLIC_APP_URL || 'https://field-intelligence-five.vercel.app');
      errorUrl.searchParams.set('status', 'error');
      errorUrl.searchParams.set('message', 'Salesforce non configure. Ajoutez SALESFORCE_CLIENT_ID et SALESFORCE_CLIENT_SECRET dans les variables d\'environnement.');
      return NextResponse.redirect(errorUrl.toString());
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/salesforce/callback`;
    const authUrl = getSalesforceAuthUrl(redirectUri, state);

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Salesforce authorize error:', error);
    const errorUrl = new URL('/admin/integrations', process.env.NEXT_PUBLIC_APP_URL || 'https://field-intelligence-five.vercel.app');
    errorUrl.searchParams.set('status', 'error');
    errorUrl.searchParams.set('message', (error as Error).message || 'Erreur interne');
    return NextResponse.redirect(errorUrl.toString());
  }
}
