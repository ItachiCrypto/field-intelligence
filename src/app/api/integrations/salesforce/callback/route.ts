// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { exchangeCodeForTokens } from '@/lib/crm/salesforce';
import { encrypt } from '@/lib/crm/encryption';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  if (!code || !state) {
    return NextResponse.redirect(
      `${appUrl}/admin/integrations?status=error&message=${encodeURIComponent('Missing code or state parameter')}`
    );
  }

  try {
    // Decode state to retrieve company_id
    const { company_id } = JSON.parse(
      Buffer.from(state, 'base64').toString('utf-8')
    );

    if (!company_id) {
      return NextResponse.redirect(
        `${appUrl}/admin/integrations?status=error&message=${encodeURIComponent('Invalid state parameter')}`
      );
    }

    const redirectUri = `${appUrl}/api/integrations/salesforce/callback`;
    const tokens = await exchangeCodeForTokens(code, redirectUri);

    // Extract org_id from the id field (format: https://login.salesforce.com/id/ORGID/USERID)
    const idParts = tokens.id.split('/');
    const salesforceOrgId = idParts[idParts.length - 2];

    // Encrypt tokens before storage
    const encryptedAccessToken = encrypt(tokens.access_token);
    const encryptedRefreshToken = encrypt(tokens.refresh_token);

    const serviceClient = createServiceClient();

    const { error: upsertError } = await serviceClient
      .from('crm_connections' as any)
      .upsert(
        {
          company_id,
          provider: 'salesforce' as const,
          status: 'connected' as const,
          instance_url: tokens.instance_url,
          salesforce_org_id: salesforceOrgId,
          config_json: {
            access_token_encrypted: encryptedAccessToken,
            refresh_token_encrypted: encryptedRefreshToken,
            token_expires_at: new Date(
              Date.now() + 2 * 60 * 60 * 1000
            ).toISOString(),
          },
          last_sync_error: null,
        },
        { onConflict: 'company_id,provider' }
      );

    if (upsertError) {
      console.error('Failed to save CRM connection:', upsertError);
      return NextResponse.redirect(
        `${appUrl}/admin/integrations?status=error&message=${encodeURIComponent('Failed to save connection')}`
      );
    }

    return NextResponse.redirect(
      `${appUrl}/admin/integrations?status=connected`
    );
  } catch (error) {
    console.error('Salesforce callback error:', error);
    const message =
      error instanceof Error ? error.message : 'Unknown error during callback';
    return NextResponse.redirect(
      `${appUrl}/admin/integrations?status=error&message=${encodeURIComponent(message)}`
    );
  }
}
