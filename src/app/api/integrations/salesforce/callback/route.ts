// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { exchangeCodeForTokens } from '@/lib/crm/salesforce';
import { encrypt } from '@/lib/crm/encryption';
import {
  isAllowedSalesforceInstanceUrl,
  readAndClearOAuthCookies,
  verifyState,
} from '@/lib/crm/oauth-state';

function errorRedirect(appUrl: string, message: string) {
  const url = new URL('/admin/integrations', appUrl);
  url.searchParams.set('status', 'error');
  url.searchParams.set('message', message);
  const res = NextResponse.redirect(url.toString());
  return res;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    'https://field-intelligence-five.vercel.app';

  // Prepare a provisional response so we can always invalidate the PKCE
  // cookies regardless of which branch we take below.
  const provisional = NextResponse.next();
  const { codeVerifier, nonce } = readAndClearOAuthCookies(request, provisional);

  if (!code || !state) {
    return errorRedirect(appUrl, 'Missing code or state parameter');
  }

  // 1. Verify the HMAC-signed state. This catches tampering + expiry +
  //    malformed payloads.
  const payload = verifyState(state);
  if (!payload) {
    return errorRedirect(appUrl, 'Invalid or expired state');
  }

  // 2. Check the nonce round-trip: the state's nonce MUST match the cookie
  //    we set at /authorize time. This is what ties the flow to the same
  //    browser session.
  if (!nonce || nonce !== payload.nonce) {
    return errorRedirect(appUrl, 'State/nonce mismatch');
  }

  // 3. The PKCE code_verifier MUST come from the cookie, never from the URL.
  if (!codeVerifier) {
    return errorRedirect(appUrl, 'Missing PKCE verifier');
  }

  // 4. Verify the logged-in user matches the one who started the flow and
  //    still belongs to the same company. This stops a cross-account replay
  //    where a second user finishes a first user's half-completed flow.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.id !== payload.userId) {
    return errorRedirect(appUrl, 'Session mismatch');
  }

  const { data: profile } = (await supabase
    .from('profiles' as any)
    .select('company_id, role')
    .eq('id', user.id)
    .single()) as { data: { company_id: string; role: string } | null };
  if (
    !profile ||
    profile.company_id !== payload.companyId ||
    profile.role !== 'admin'
  ) {
    return errorRedirect(appUrl, 'Forbidden');
  }

  // 5. Exchange the authorization code for tokens using the verifier we
  //    recovered from our own cookie.
  let tokens: Awaited<ReturnType<typeof exchangeCodeForTokens>>;
  try {
    const redirectUri = `${appUrl}/api/integrations/salesforce/callback`;
    tokens = await exchangeCodeForTokens(code, redirectUri, codeVerifier);
  } catch (error) {
    console.error('[sf-callback] token exchange failed');
    return errorRedirect(appUrl, 'Token exchange failed');
  }

  // 6. Validate instance_url against Salesforce-owned domain suffixes so an
  //    attacker who somehow tampers with the token response cannot pin the
  //    stored connection to a hostile server.
  if (!isAllowedSalesforceInstanceUrl(tokens.instance_url)) {
    console.error(
      '[sf-callback] rejected instance_url:',
      tokens.instance_url
    );
    return errorRedirect(appUrl, 'Invalid Salesforce instance URL');
  }

  // 7. Extract org_id from the `id` endpoint: .../id/<ORG_ID>/<USER_ID>
  const idParts = tokens.id.split('/');
  const salesforceOrgId = idParts[idParts.length - 2];

  // 8. Encrypt tokens at rest.
  const encryptedAccessToken = encrypt(tokens.access_token);
  const encryptedRefreshToken = encrypt(tokens.refresh_token);

  const serviceClient = createServiceClient();
  const { error: upsertError } = await serviceClient
    .from('crm_connections' as any)
    .upsert(
      {
        company_id: payload.companyId,
        provider: 'salesforce',
        status: 'connected',
        instance_url: tokens.instance_url,
        salesforce_org_id: salesforceOrgId,
        config_json: {
          access_token_encrypted: encryptedAccessToken,
          refresh_token_encrypted: encryptedRefreshToken,
          token_expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        },
        last_sync_error: null,
      },
      { onConflict: 'company_id,provider' }
    );

  if (upsertError) {
    console.error('[sf-callback] upsert error:', upsertError.message);
    return errorRedirect(appUrl, 'Failed to save connection');
  }

  // Success: bounce to the integrations page and clear cookies.
  const successUrl = new URL('/admin/integrations', appUrl);
  successUrl.searchParams.set('status', 'connected');
  const successResponse = NextResponse.redirect(successUrl.toString());
  // Propagate the cookie-invalidation headers we prepared on `provisional`.
  for (const cookie of provisional.cookies.getAll()) {
    successResponse.cookies.set(cookie);
  }
  return successResponse;
}
