// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import {
  fetchVisitReports,
  refreshAccessToken,
} from '@/lib/crm/salesforce';
import { decrypt, encrypt } from '@/lib/crm/encryption';
import type { SalesforceTask } from '@/lib/crm/types';

export async function POST(request: NextRequest) {
  try {
    const cronSecret = request.headers.get('x-cron-secret');
    const isCron =
      cronSecret && cronSecret === process.env.CRON_SECRET;

    let companyId: string;

    if (isCron) {
      // Cron mode: get company_id from request body
      const body = await request.json();
      companyId = body.company_id;
      if (!companyId) {
        return NextResponse.json(
          { error: 'company_id required for cron sync' },
          { status: 400 }
        );
      }
    } else {
      // Manual mode: verify auth
      const supabase = await createClient();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { data: profile } = await supabase
        .from('profiles' as any)
        .select('company_id')
        .eq('id', user.id)
        .single() as any;

      if (!profile?.company_id) {
        return NextResponse.json(
          { error: 'Profile or company not found' },
          { status: 400 }
        );
      }
      companyId = profile.company_id;
    }

    const serviceClient = createServiceClient();

    // Get CRM connection
    const { data: connection, error: connError } = await serviceClient
      .from('crm_connections' as any)
      .select("*")
      .eq('company_id', companyId)
      .eq('provider', 'salesforce')
      .eq('status', 'connected')
      .single() as any;

    if (connError || !connection) {
      return NextResponse.json(
        { error: 'No active Salesforce connection found' },
        { status: 404 }
      );
    }

    // Decrypt tokens
    let accessToken = decrypt(connection.config_json.access_token_encrypted);
    const refreshToken = decrypt(connection.config_json.refresh_token_encrypted);

    // Check token expiry and refresh if needed
    const tokenExpiresAt = new Date(
      connection.config_json.token_expires_at
    ).getTime();

    if (Date.now() >= tokenExpiresAt) {
      const newTokens = await refreshAccessToken(refreshToken);
      accessToken = newTokens.access_token;

      // Update stored tokens
      await serviceClient
        .from('crm_connections' as any)
        .update({
          config_json: {
            access_token_encrypted: encrypt(newTokens.access_token),
            refresh_token_encrypted: newTokens.refresh_token
              ? encrypt(newTokens.refresh_token)
              : connection.config_json.refresh_token_encrypted,
            token_expires_at: new Date(
              Date.now() + 2 * 60 * 60 * 1000
            ).toISOString(),
          },
        })
        .eq('id', connection.id);
    }

    // Fetch visit reports from Salesforce
    const tasks: SalesforceTask[] = await fetchVisitReports(
      accessToken,
      connection.instance_url!,
      connection.last_sync_at
    );

    // Upsert each task into raw_visit_reports
    let syncedCount = 0;

    for (const task of tasks) {
      const { error: upsertError } = await serviceClient
        .from('raw_visit_reports' as any)
        .upsert(
          {
            company_id: companyId,
            crm_connection_id: connection.id,
            external_id: task.Id,
            content_text: task.Description ?? null,
            subject: task.Subject ?? null,
            commercial_email: task.Owner?.Email ?? null,
            commercial_name: task.Owner?.Name ?? null,
            client_name: task.What?.Name ?? task.Who?.Name ?? null,
            visit_date: task.ActivityDate ?? null,
            raw_json: task as unknown as Record<string, unknown>,
            processing_status: 'pending' as const,
            synced_at: new Date().toISOString(),
          },
          { onConflict: 'company_id,external_id' }
        );

      if (upsertError) {
        console.error(
          `Failed to upsert task ${task.Id}:`,
          upsertError
        );
        continue;
      }
      syncedCount++;
    }

    // Update connection metadata
    await serviceClient
      .from('crm_connections' as any)
      .update({
        last_sync_at: new Date().toISOString(),
        last_sync_error: null,
        records_synced: (connection.records_synced ?? 0) + syncedCount,
      })
      .eq('id', connection.id);

    return NextResponse.json({ success: true, synced: syncedCount });
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json(
      {
        error: 'Sync failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
