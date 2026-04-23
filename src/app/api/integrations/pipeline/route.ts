// @ts-nocheck
/**
 * POST /api/integrations/pipeline
 *
 * Pipeline complet en un seul appel SSE :
 *   1. Sync Salesforce (Account + Contact + Opportunity + User + Task + Event)
 *   2. Analyse IA de chaque CR en attente (concurrence x5)
 *   3. Recalcul automatique des analytics
 *
 * Répond avec un stream Server-Sent Events pour que le browser
 * voie la progression en temps réel sans jamais perdre la connexion.
 */
import { NextRequest } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import {
  fetchSalesforceAccounts,
  fetchSalesforceContacts,
  fetchSalesforceOpportunities,
  fetchSalesforceUsers,
  fetchSalesforceTasks,
  fetchSalesforceEvents,
  refreshAccessToken,
} from '@/lib/crm/salesforce';
import { decrypt, encrypt } from '@/lib/crm/encryption';
import { processReport } from '@/lib/crm/process-report';
import { recomputeAnalytics } from '@/lib/analytics/recompute';
import type { SalesforceActivity, RawVisitReport } from '@/lib/crm/types';

export const maxDuration = 300;
// SSE nécessite un runtime sans Edge (Node.js pour crypto / supabase-js)
export const runtime = 'nodejs';

const CONCURRENCY = 5;

// ── SF industry → secteur ────────────────────────────────────────────────────
const industrySectorMap: Record<string, string> = {
  Pharmaceuticals: 'Pharma',
  Manufacturing: 'Industrie',
  Technology: 'Tech',
  Construction: 'BTP',
  'Food & Beverage': 'Agroalimentaire',
  Retail: 'Distribution',
  Energy: 'Energie',
  Transportation: 'Transport',
  Automotive: 'Automobile',
};

// ── mapActivityToRow ─────────────────────────────────────────────────────────
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
  const rawDate = isEvent
    ? (activity as any).StartDateTime ?? null
    : (activity as any).ActivityDate ?? null;
  const visitDate = rawDate ? (rawDate as string).slice(0, 10) : null;

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
      clientName = contact.name;
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
    raw_json: { ...activity, _activity_kind: activity._kind } as any,
    processing_status: 'pending' as const,
    synced_at: new Date().toISOString(),
  };
}

// ── Worker pool ──────────────────────────────────────────────────────────────
async function runWithConcurrency<T>(
  items: T[],
  fn: (item: T, index: number) => Promise<void>,
  concurrency: number,
): Promise<void> {
  const queue = items.map((item, i) => ({ item, i }));
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (queue.length > 0) {
      const next = queue.shift();
      if (next !== undefined) await fn(next.item, next.i);
    }
  });
  await Promise.all(workers);
}

// ── Main handler ─────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  // Auth check
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  const { data: profile } = await supabase
    .from('profiles' as any)
    .select('company_id, role')
    .eq('id', user.id)
    .single() as any;
  if (!profile?.company_id || profile.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }
  const companyId: string = profile.company_id;

  // Create SSE stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: Record<string, unknown>) => {
        try {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
          );
        } catch { /* stream closed */ }
      };

      try {
        const serviceClient = createServiceClient();

        // ── Get CRM connection ─────────────────────────────────────────────
        send('step', { step: 'connect', message: 'Connexion à Salesforce…', progress: 2 });

        const { data: connection, error: connError } = await serviceClient
          .from('crm_connections' as any)
          .select('*')
          .eq('company_id', companyId)
          .eq('provider', 'salesforce')
          .eq('status', 'connected')
          .single() as any;

        if (connError || !connection) {
          send('error', { message: 'Aucune connexion Salesforce active.' });
          controller.close();
          return;
        }

        // Refresh token if needed
        let accessToken = decrypt(connection.config_json.access_token_encrypted);
        const refreshToken = decrypt(connection.config_json.refresh_token_encrypted);
        const tokenExpiresAt = new Date(connection.config_json.token_expires_at).getTime();
        if (Date.now() >= tokenExpiresAt) {
          const newTokens = await refreshAccessToken(refreshToken);
          accessToken = newTokens.access_token;
          await serviceClient.from('crm_connections' as any).update({
            config_json: {
              access_token_encrypted: encrypt(newTokens.access_token),
              refresh_token_encrypted: newTokens.refresh_token
                ? encrypt(newTokens.refresh_token)
                : connection.config_json.refresh_token_encrypted,
              token_expires_at: new Date(Date.now() + 2 * 3600_000).toISOString(),
            },
          }).eq('id', connection.id);
        }

        const instanceUrl: string = connection.instance_url!;
        const since = connection.last_sync_at
          || new Date(Date.now() - 2 * 365 * 24 * 3600_000).toISOString();

        // ── Fetch all SF objects in parallel ──────────────────────────────
        send('step', { step: 'fetch', message: 'Import depuis Salesforce…', progress: 5 });

        const [sfAccounts, sfContacts, sfOpportunities, sfUsers, sfTasks, sfEvents] =
          await Promise.all([
            fetchSalesforceAccounts(accessToken, instanceUrl, since).catch(() => []),
            fetchSalesforceContacts(accessToken, instanceUrl, since).catch(() => []),
            fetchSalesforceOpportunities(accessToken, instanceUrl, since).catch(() => []),
            fetchSalesforceUsers(accessToken, instanceUrl).catch(() => []),
            fetchSalesforceTasks(accessToken, instanceUrl, since).catch(() => []),
            fetchSalesforceEvents(accessToken, instanceUrl, since).catch(() => []),
          ]);

        send('step', {
          step: 'fetch_done',
          message: `Récupéré : ${sfAccounts.length} comptes, ${sfContacts.length} contacts, ${sfOpportunities.length} opportunités, ${sfUsers.length} utilisateurs, ${sfTasks.length + sfEvents.length} activités`,
          progress: 15,
          counts: {
            accounts: sfAccounts.length,
            contacts: sfContacts.length,
            opportunities: sfOpportunities.length,
            users: sfUsers.length,
            activities: sfTasks.length + sfEvents.length,
          },
        });

        // ── Upsert SF users → commercials ─────────────────────────────────
        for (const u of sfUsers) {
          const userName = [u.FirstName, u.LastName].filter(Boolean).join(' ');
          const { error: uErr } = await serviceClient.from('commercials' as any).upsert({
            company_id: companyId,
            name: userName,
            email: u.Email,
            sf_id: u.Id,
            region: u.Territory__c ?? '',
            quality_score: 50,
            quality_trend: 0,
            cr_total: 0,
            cr_week: 0,
          }, { onConflict: 'company_id,sf_id', ignoreDuplicates: true });
          if (uErr) {
            await serviceClient.from('commercials' as any)
              .update({ name: userName, email: u.Email, region: u.Territory__c ?? '' })
              .eq('company_id', companyId).eq('sf_id', u.Id);
          }
        }

        // ── Upsert accounts ───────────────────────────────────────────────
        const sfAccountMap = new Map<string, { name: string; region: string }>();
        for (const acc of sfAccounts) {
          const sector = industrySectorMap[acc.Industry ?? ''] ?? acc.Industry ?? 'Autre';
          const region = acc.BillingState ?? acc.BillingCity ?? '';
          sfAccountMap.set(acc.Id, { name: acc.Name ?? '', region });
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
        }

        // ── Upsert contacts ───────────────────────────────────────────────
        const sfContactMap = new Map<string, { name: string; accountSfId: string | null }>();
        for (const c of sfContacts) {
          const cName = [c.FirstName, c.LastName].filter(Boolean).join(' ');
          sfContactMap.set(c.Id, { name: cName, accountSfId: c.AccountId ?? null });
          const { data: localAcc } = await serviceClient.from('accounts' as any)
            .select('id').eq('company_id', companyId).eq('sf_id', c.AccountId ?? '').maybeSingle();
          await serviceClient.from('contacts' as any).upsert({
            company_id: companyId,
            sf_id: c.Id,
            name: cName,
            role: c.Title ?? null,
            email: c.Email ?? null,
            sf_account_id: c.AccountId ?? null,
            account_id: localAcc?.id ?? null,
            is_new: false,
            first_detected: c.CreatedDate.slice(0, 10),
          }, { onConflict: 'company_id,sf_id', ignoreDuplicates: false });
        }

        // ── Upsert opportunities ──────────────────────────────────────────
        for (const opp of sfOpportunities) {
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
            loss_reason: (opp as any).Loss_Reason__c ?? null,
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
        }

        // ── Upsert activities → raw_visit_reports ─────────────────────────
        const maps = { sfAccountMap, sfContactMap };
        const activities: SalesforceActivity[] = [
          ...sfTasks.map((t) => ({
            ...t,
            _kind: (['call', 'Call'].includes(t.TaskSubtype ?? '') ? 'call'
              : ['email', 'Email', 'List Email'].includes(t.TaskSubtype ?? '') ? 'email'
              : 'task') as 'task' | 'call' | 'email',
          })),
          ...sfEvents.map((e) => ({ ...e, _kind: 'event' as const })),
        ];

        let newActivities = 0;
        for (const activity of activities) {
          const row = mapActivityToRow(activity, companyId, connection.id, maps);
          // ignoreDuplicates: true → seuls les NOUVEAUX sont insérés en 'pending'
          // les existants (done/skipped/error) ne sont pas touchés
          const { error: uErr } = await serviceClient
            .from('raw_visit_reports' as any)
            .upsert(row, { onConflict: 'company_id,external_id', ignoreDuplicates: true });
          if (!uErr) newActivities++;
        }

        // Update last_sync_at
        await serviceClient.from('crm_connections' as any).update({
          last_sync_at: new Date().toISOString(),
          last_sync_error: null,
          records_synced: (connection.records_synced ?? 0) + newActivities,
        }).eq('id', connection.id);

        // ── Fetch ALL pending CRs ─────────────────────────────────────────
        const { data: pendingReports } = await serviceClient
          .from('raw_visit_reports' as any)
          .select('*')
          .eq('company_id', companyId)
          .eq('processing_status', 'pending')
          .lt('processing_attempts', 3)
          .order('synced_at', { ascending: true })
          .limit(500) as { data: any[] | null };

        const total = pendingReports?.length ?? 0;

        send('step', {
          step: 'ai_start',
          message: total === 0
            ? 'Tout est déjà à jour — aucun CR à analyser.'
            : `Analyse IA de ${total} CR…`,
          progress: 20,
          total,
          synced: newActivities,
        });

        if (total === 0) {
          // Still recompute analytics
          send('step', { step: 'analytics', message: 'Recalcul des tableaux analytiques…', progress: 90 });
          await recomputeAnalytics(companyId).catch(() => null);
          send('done', {
            synced: newActivities,
            processed: 0,
            errors: 0,
            total: 0,
            message: `Sync terminé — ${newActivities} nouvelles activités importées, aucun CR à analyser.`,
          });
          controller.close();
          return;
        }

        // ── AI processing with real-time progress ─────────────────────────
        let processedCount = 0;
        let errorCount = 0;

        await runWithConcurrency(
          pendingReports as RawVisitReport[],
          async (report, idx) => {
            try {
              const result = await processReport(report);
              if (result.success) {
                processedCount++;
              } else {
                errorCount++;
              }
            } catch {
              errorCount++;
            }
            // Emit progress after every CR
            const done = processedCount + errorCount;
            const pct = 20 + Math.round((done / total) * 65); // 20%→85%
            send('progress', {
              processed: processedCount,
              errors: errorCount,
              total,
              progress: pct,
              message: `Analyse IA : ${done}/${total} CR traités…`,
            });
          },
          CONCURRENCY,
        );

        // ── Recompute analytics ───────────────────────────────────────────
        send('step', { step: 'analytics', message: 'Calcul des tableaux analytiques…', progress: 88 });
        try {
          await recomputeAnalytics(companyId);
        } catch (e: any) {
          // Non-fatal
          console.warn('[pipeline] analytics recompute failed:', e?.message);
        }

        send('done', {
          synced: newActivities,
          processed: processedCount,
          errors: errorCount,
          total,
          progress: 100,
          message: `${newActivities} CR importés, ${processedCount} analysés par l'IA${errorCount > 0 ? ` (${errorCount} ignorés)` : ''}.`,
        });

      } catch (err: any) {
        send('error', { message: err?.message ?? 'Erreur inconnue.' });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
