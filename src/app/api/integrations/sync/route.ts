// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import {
  fetchCrmActivities,
  fetchSalesforceTasks,
  fetchSalesforceEvents,
  fetchSalesforceAccounts,
  fetchSalesforceContacts,
  fetchSalesforceOpportunities,
  fetchSalesforceUsers,
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
function mapActivityToRow(
  activity: SalesforceActivity,
  companyId: string,
  connectionId: string,
  maps?: {
    sfAccountMap: Map<string, { name: string; region: string }>;
    sfContactMap: Map<string, { name: string; accountSfId: string | null }>;
  },
) {
  const isEvent = activity._kind === 'event';
  // Extraire la partie date uniquement (la colonne visit_date est de type `date`)
  const rawDate = isEvent
    ? (activity as any).StartDateTime ?? null
    : (activity as any).ActivityDate ?? null;
  // StartDateTime est un ISO datetime → tronquer à YYYY-MM-DD
  const visitDate = rawDate
    ? (rawDate as string).slice(0, 10)
    : null;

  // Resolve client_name: What.Name > sfAccountMap[WhatId] > sfContactMap[WhoId].accountName > Who.Name
  const whatId = (activity as any).WhatId ?? null;
  const whoId = (activity as any).WhoId ?? null;

  let clientName = activity.What?.Name ?? null;
  if (!clientName && whatId && maps?.sfAccountMap.has(whatId)) {
    clientName = maps.sfAccountMap.get(whatId)!.name;
  }
  if (!clientName && whoId && maps?.sfContactMap.has(whoId)) {
    const contact = maps.sfContactMap.get(whoId)!;
    if (contact.accountSfId && maps.sfAccountMap.has(contact.accountSfId)) {
      clientName = maps.sfAccountMap.get(contact.accountSfId)!.name;
    } else {
      clientName = contact.name; // fallback: contact name
    }
  }
  if (!clientName) clientName = activity.Who?.Name ?? null;

  return {
    company_id: companyId,
    crm_connection_id: connectionId,
    external_id: activity.Id,
    external_updated_at: activity.LastModifiedDate,
    content_text: activity.Description ?? null,
    subject: activity.Subject ?? null,
    commercial_email: activity.Owner?.Email ?? null,
    commercial_name: activity.Owner?.Name ?? null,
    client_name: clientName,
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

// SF industry → secteur mapping
const industrySectorMap: Record<string, string> = {
  'Pharmaceuticals': 'Pharma',
  'Manufacturing': 'Industrie',
  'Technology': 'Tech',
  'Construction': 'BTP',
  'Food & Beverage': 'Agroalimentaire',
  'Retail': 'Distribution',
  'Energy': 'Energie',
  'Transportation': 'Transport',
  'Automotive': 'Automobile',
};

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

    const instanceUrl = connection.instance_url!;

    // Si jamais synchronisé : remonter 2 ans en arrière pour tout récupérer.
    const since = connection.last_sync_at
      || new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000).toISOString();

    // Fetch toutes les données SF en parallèle
    const [accounts, contacts, opportunities, users, tasks, events] = await Promise.all([
      fetchSalesforceAccounts(accessToken, instanceUrl, since),
      fetchSalesforceContacts(accessToken, instanceUrl, since),
      fetchSalesforceOpportunities(accessToken, instanceUrl, since),
      fetchSalesforceUsers(accessToken, instanceUrl),
      fetchSalesforceTasks(accessToken, instanceUrl, since),
      fetchSalesforceEvents(accessToken, instanceUrl, since),
    ]);

    let syncedCount = 0;

    // ── Upsert users → commercials (avant accounts pour avoir les IDs) ──────
    // ignoreDuplicates: true pour ne pas écraser cr_total/cr_week existants
    for (const user of users) {
      const userName = [user.FirstName, user.LastName].filter(Boolean).join(' ');
      // Try insert first (ignoreDuplicates=true preserves cr_total/cr_week)
      const { error: insertErr } = await serviceClient.from('commercials' as any).upsert({
        company_id: companyId,
        name: userName,
        email: user.Email,
        sf_id: user.Id,
        region: user.Territory__c ?? '',
        quality_score: 50,
        quality_trend: 0,
        cr_total: 0,
        cr_week: 0,
      }, { onConflict: 'company_id,sf_id', ignoreDuplicates: true });
      if (insertErr) {
        // On conflict, update only metadata (not cr_total/cr_week)
        await serviceClient.from('commercials' as any)
          .update({ name: userName, email: user.Email, region: user.Territory__c ?? '' })
          .eq('company_id', companyId)
          .eq('sf_id', user.Id);
      }
      syncedCount++;
    }

    // ── Upsert accounts ──────────────────────────────────────────────────────
    for (const acc of accounts) {
      const sector = industrySectorMap[acc.Industry ?? ''] ?? acc.Industry ?? 'Autre';
      const region = acc.BillingState ?? acc.BillingCity ?? '';
      await serviceClient.from('accounts' as any).upsert({
        company_id: companyId,
        sf_id: acc.Id,
        name: acc.Name ?? '',
        sector,
        region,
        ca_annual: acc.AnnualRevenue ? Math.round(acc.AnnualRevenue) : null,
        nb_employees: acc.NumberOfEmployees ?? null,
        account_type: acc.Type ?? null,
        sf_owner_id: acc.OwnerId ?? null,
        risk_score: 0,
        risk_trend: 0,
      }, { onConflict: 'company_id,sf_id', ignoreDuplicates: false });
      syncedCount++;
    }

    // ── Build lookup maps pour résoudre WhatId/WhoId des activités ───────────
    const sfAccountMap = new Map<string, { name: string; region: string }>();
    for (const acc of accounts) {
      sfAccountMap.set(acc.Id, {
        name: acc.Name ?? '',
        region: acc.BillingState ?? acc.BillingCity ?? '',
      });
    }

    const sfContactMap = new Map<string, { name: string; accountSfId: string | null }>();
    for (const c of contacts) {
      sfContactMap.set(c.Id, {
        name: [c.FirstName, c.LastName].filter(Boolean).join(' '),
        accountSfId: c.AccountId ?? null,
      });
    }

    // ── Upsert contacts ──────────────────────────────────────────────────────
    for (const c of contacts) {
      // Try to find account_id from our local accounts table
      const { data: localAcc } = await serviceClient
        .from('accounts' as any)
        .select('id')
        .eq('company_id', companyId)
        .eq('sf_id', c.AccountId ?? '')
        .maybeSingle();

      await serviceClient.from('contacts' as any).upsert({
        company_id: companyId,
        sf_id: c.Id,
        name: [c.FirstName, c.LastName].filter(Boolean).join(' '),
        role: c.Title ?? null,
        email: c.Email ?? null,
        sf_account_id: c.AccountId ?? null,
        account_id: localAcc?.id ?? null,
        is_new: false,
        first_detected: c.CreatedDate.slice(0, 10),
      }, { onConflict: 'company_id,sf_id', ignoreDuplicates: false });
      syncedCount++;
    }

    // ── Upsert opportunities ─────────────────────────────────────────────────
    for (const opp of opportunities) {
      const accInfo = opp.AccountId ? sfAccountMap.get(opp.AccountId) : null;
      await serviceClient.from('opportunities' as any).upsert({
        company_id: companyId,
        sf_id: opp.Id,
        name: opp.Name ?? '',
        amount: opp.Amount ?? null,
        stage: opp.StageName ?? null,
        close_date: opp.CloseDate ?? null,
        is_won: opp.IsWon,
        is_closed: opp.IsClosed,
        loss_reason: opp.Loss_Reason__c ?? null,
        account_sf_id: opp.AccountId ?? null,
        account_name: opp.Account?.Name ?? accInfo?.name ?? null,
        commercial_name: opp.Owner?.Name ?? null,
        commercial_sf_id: opp.OwnerId ?? null,
        region: accInfo?.region ?? null,
        probability: opp.Probability ?? null,
        lead_source: opp.LeadSource ?? null,
        competitor_name: (opp as any).Concurrent_Principal__c ?? null,
        sf_created_date: opp.CreatedDate,
        sf_modified_date: opp.LastModifiedDate,
      }, { onConflict: 'company_id,sf_id', ignoreDuplicates: false });
      syncedCount++;
    }

    // ── Upsert activités (tasks + events) dans raw_visit_reports ────────────
    const maps = { sfAccountMap, sfContactMap };

    // Combine tasks + events into unified activities list
    const activities: SalesforceActivity[] = [
      ...tasks.map((t) => ({ ...t, _kind: (['call', 'Call'].includes(t.TaskSubtype ?? '') ? 'call' : ['email', 'Email', 'List Email'].includes(t.TaskSubtype ?? '') ? 'email' : 'task') as 'task' | 'call' | 'email' })),
      ...events.map((e) => ({ ...e, _kind: 'event' as const })),
    ];

    for (const activity of activities) {
      const { error: upsertError } = await serviceClient
        .from('raw_visit_reports' as any)
        .upsert(
          mapActivityToRow(activity, companyId, connection.id, maps),
          // ignoreDuplicates=true → INSERT … ON CONFLICT DO NOTHING
          // Les records déjà traités (done/skipped) ne sont PAS remis en pending.
          // Seuls les nouveaux records sont insérés comme 'pending'.
          { onConflict: 'company_id,external_id', ignoreDuplicates: true }
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

    return NextResponse.json({
      success: true,
      synced: syncedCount,
      breakdown: {
        users: users.length,
        accounts: accounts.length,
        contacts: contacts.length,
        opportunities: opportunities.length,
        activities: activities.length,
      },
    });
  } catch (error: any) {
    const msg = error?.message ?? String(error) ?? 'unknown';
    console.error('[sync] error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
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
            mapActivityToRow(activity, conn.company_id, conn.id, undefined),
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
