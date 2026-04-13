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
        .select('company_id, role')
        .eq('id', user.id)
        .single() as any;

      if (!profile?.company_id) {
        return NextResponse.json(
          { error: 'Profile or company not found' },
          { status: 400 }
        );
      }

      if (profile.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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
    // Default to 30 days ago if this is the first sync
    const since = connection.last_sync_at
      || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const tasks: SalesforceTask[] = await fetchVisitReports(
      accessToken,
      connection.instance_url!,
      since
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

// GET handler for Vercel Cron
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const serviceClient = createServiceClient();

  // Fetch all connected CRM connections
  const { data: connections } = await serviceClient
    .from('crm_connections')
    .select('*')
    .eq('status', 'connected');

  if (!connections || connections.length === 0) {
    return NextResponse.json({ message: 'No connected CRMs', synced: 0 });
  }

  let totalSynced = 0;

  for (const conn of connections) {
    try {
      let accessToken = decrypt(conn.access_token_encrypted);
      const refreshToken = decrypt(conn.refresh_token_encrypted);

      // Refresh token if expired
      if (conn.token_expires_at && new Date(conn.token_expires_at) < new Date()) {
        const refreshed = await refreshAccessToken(refreshToken);
        accessToken = refreshed.access_token;
        await serviceClient.from('crm_connections').update({
          access_token_encrypted: encrypt(accessToken),
          token_expires_at: new Date(Date.now() + 2 * 3600000).toISOString(),
        }).eq('id', conn.id);
      }

      const since = conn.last_sync_at || new Date(Date.now() - 7 * 86400000).toISOString();
      const tasks = await fetchVisitReports(accessToken, conn.instance_url, since);

      for (const task of tasks) {
        await serviceClient.from('raw_visit_reports').upsert({
          company_id: conn.company_id,
          crm_connection_id: conn.id,
          external_id: task.Id,
          external_updated_at: task.LastModifiedDate,
          content_text: task.Description,
          subject: task.Subject,
          commercial_email: task.Owner?.Email ?? null,
          commercial_name: task.Owner?.Name ?? null,
          client_name: task.What?.Name || task.Who?.Name || null,
          visit_date: task.ActivityDate,
          raw_json: task,
          processing_status: 'pending',
        }, { onConflict: 'company_id,external_id' });
      }

      await serviceClient.from('crm_connections').update({
        last_sync_at: new Date().toISOString(),
        records_synced: (conn.records_synced || 0) + tasks.length,
        last_sync_error: null,
      }).eq('id', conn.id);

      totalSynced += tasks.length;
    } catch (err) {
      await serviceClient.from('crm_connections').update({
        last_sync_error: err.message,
      }).eq('id', conn.id);
    }
  }

  return NextResponse.json({ synced: totalSynced });
}
