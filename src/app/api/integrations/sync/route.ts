// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import {
  fetchCrmActivities,
  refreshAccessToken,
} from '@/lib/crm/salesforce';
import { decrypt, encrypt } from '@/lib/crm/encryption';
import type { SalesforceActivity } from '@/lib/crm/types';

/**
 * Normalise une activite Salesforce (Task ou Event) dans le shape attendu
 * par la table raw_visit_reports. Les differences principales :
 *   - date : ActivityDate (Task) vs StartDateTime (Event)
 *   - kind : 'task' | 'call' | 'email' | 'event' — enregistre dans raw_json
 *     pour retrouver la source en cas de debug
 */
function mapActivityToRow(activity: SalesforceActivity, companyId: string, connectionId: string) {
  const isEvent = activity._kind === 'event';
  const visitDate = isEvent
    ? (activity as any).StartDateTime ?? null
    : (activity as any).ActivityDate ?? null;
  return {
    company_id: companyId,
    crm_connection_id: connectionId,
    external_id: activity.Id,
    external_updated_at: activity.LastModifiedDate,
    content_text: activity.Description ?? null,
    subject: activity.Subject ?? null,
    commercial_email: activity.Owner?.Email ?? null,
    commercial_name: activity.Owner?.Name ?? null,
    client_name: activity.What?.Name ?? activity.Who?.Name ?? null,
    visit_date: visitDate,
    raw_json: {
      ...activity,
      _activity_kind: activity._kind,
    } as unknown as Record<string, unknown>,
    processing_status: 'pending' as const,
    synced_at: new Date().toISOString(),
  };
}
import {
  isUuid,
  verifyCronBearer,
  verifyCronHeader,
} from '@/lib/auth/cron';

export async function POST(request: NextRequest) {
  try {
    const isCron = verifyCronHeader(request.headers.get('x-cron-secret'));

    let companyId: string;

    if (isCron) {
      // Cron mode: company_id comes from the request body. We validate it as
      // a strict UUID so a bogus scheduler call cannot pivot through the
      // rest of the handler with a SQL-unfriendly value.
      const body = await request.json().catch(() => null);
      const candidate = body && typeof body === 'object' ? body.company_id : null;
      if (!isUuid(candidate)) {
        return NextResponse.json(
          { error: 'company_id (UUID) required for cron sync' },
          { status: 400 }
        );
      }
      companyId = candidate;
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

    // Fetch toutes les activites CRM (Task + Event = inclut Calls, Emails, RDV).
    // Default to 30 days ago if this is the first sync.
    const since = connection.last_sync_at
      || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const activities: SalesforceActivity[] = await fetchCrmActivities(
      accessToken,
      connection.instance_url!,
      since
    );

    // Upsert each activity into raw_visit_reports (table generique cote nous :
    // elle porte toutes les activites CRM, pas seulement les CR).
    let syncedCount = 0;

    for (const activity of activities) {
      const { error: upsertError } = await serviceClient
        .from('raw_visit_reports' as any)
        .upsert(
          mapActivityToRow(activity, companyId, connection.id),
          { onConflict: 'company_id,external_id' }
        );

      if (upsertError) {
        console.error(
          `Failed to upsert activity ${activity.Id}:`,
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
    console.error('[sync] error:', error instanceof Error ? error.message : 'unknown');
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}

// GET handler for Vercel Cron
export async function GET(request: NextRequest) {
  if (!verifyCronBearer(request.headers.get('authorization'))) {
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
      const activities = await fetchCrmActivities(accessToken, conn.instance_url, since);

      for (const activity of activities) {
        await serviceClient
          .from('raw_visit_reports')
          .upsert(
            mapActivityToRow(activity, conn.company_id, conn.id),
            { onConflict: 'company_id,external_id' }
          );
      }

      await serviceClient.from('crm_connections').update({
        last_sync_at: new Date().toISOString(),
        records_synced: (conn.records_synced || 0) + activities.length,
        last_sync_error: null,
      }).eq('id', conn.id);

      totalSynced += activities.length;
    } catch (err) {
      await serviceClient.from('crm_connections').update({
        last_sync_error: err.message,
      }).eq('id', conn.id);
    }
  }

  return NextResponse.json({ synced: totalSynced });
}
