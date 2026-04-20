// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getSalesforceAuthUrl,
  generateCodeVerifier,
  generateCodeChallenge,
} from '@/lib/crm/salesforce';
import { attachOAuthCookies, signState } from '@/lib/crm/oauth-state';

function errorRedirect(message: string) {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ||
    'https://field-intelligence-five.vercel.app';
  const url = new URL('/admin/integrations', base);
  url.searchParams.set('status', 'error');
  url.searchParams.set('message', message);
  return NextResponse.redirect(url.toString());
}

export async function GET(_request: NextRequest) {
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
      .from('profiles' as any)
      .select('company_id, role')
      .eq('id', user.id)
      .single() as { data: { company_id: string; role: string } | null; error: unknown };

    if (profileError || !profile?.company_id) {
      return NextResponse.json(
        { error: 'Profile or company not found' },
        { status: 400 }
      );
    }

    if (profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!process.env.SALESFORCE_CLIENT_ID) {
      return errorRedirect(
        "Salesforce non configure. Ajoutez SALESFORCE_CLIENT_ID et SALESFORCE_CLIENT_SECRET dans les variables d'environnement."
      );
    }

    // PKCE: code verifier stays server-side (set as httpOnly cookie). The
    // state only carries an HMAC-signed (companyId, userId, nonce, issuedAt)
    // so an attacker cannot replay the state across users/companies.
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);

    const { state, nonce } = signState({
      companyId: profile.company_id,
      userId: user.id,
    });

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/salesforce/callback`;
    const authUrl = getSalesforceAuthUrl(redirectUri, state, codeChallenge);

    const response = NextResponse.redirect(authUrl);
    return attachOAuthCookies(response, { codeVerifier, nonce });
  } catch (error) {
    // Never leak the raw error to the user.
    console.error('[sf-authorize] error:', error);
    return errorRedirect('Erreur interne');
  }
}
