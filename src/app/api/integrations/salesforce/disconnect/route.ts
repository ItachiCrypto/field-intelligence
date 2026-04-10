// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { revokeToken } from '@/lib/crm/salesforce';
import { decrypt } from '@/lib/crm/encryption';

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

    // Verify admin role
    const { data: profile } = await supabase
      .from('profiles' as any)
      .select('company_id, role')
      .eq('id', user.id)
      .single() as any;

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const serviceClient = createServiceClient();

    // Get the existing connection
    const { data: connection, error: fetchError } = await serviceClient
      .from('crm_connections' as any)
      .select("*")
      .eq('company_id', profile.company_id)
      .eq('provider', 'salesforce')
      .single() as any;

    if (fetchError || !connection) {
      return NextResponse.json(
        { error: 'No Salesforce connection found' },
        { status: 404 }
      );
    }

    // Revoke the token at Salesforce
    try {
      const accessToken = decrypt(connection.config_json.access_token_encrypted);
      await revokeToken(accessToken);
    } catch (revokeError) {
      // Log but continue -- we still want to clean up locally
      console.warn('Failed to revoke Salesforce token:', revokeError);
    }

    // Update connection: mark as revoked, clear tokens
    const { error: updateError } = await serviceClient
      .from('crm_connections' as any)
      .update({
        status: 'revoked' as const,
        config_json: {},
        last_sync_error: null,
      })
      .eq('id', connection.id);

    if (updateError) {
      console.error('Failed to update connection:', updateError);
      return NextResponse.json(
        { error: 'Failed to disconnect' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Salesforce disconnect error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
