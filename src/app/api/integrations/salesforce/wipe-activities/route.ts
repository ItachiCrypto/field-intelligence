// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { decrypt, encrypt } from '@/lib/crm/encryption';
import { refreshAccessToken } from '@/lib/crm/salesforce';

const SF_API_VERSION = 'v59.0';
const BATCH_SIZE = 200;

/**
 * Recupere toutes les IDs d'un sObject via SOQL avec pagination queryMore.
 */
async function fetchAllIds(
  accessToken: string,
  instanceUrl: string,
  sobject: 'Task' | 'Event',
): Promise<string[]> {
  const ids: string[] = [];
  const soql = `SELECT Id FROM ${sobject}`;
  let url: string | null =
    `${instanceUrl}/services/data/${SF_API_VERSION}/query?q=${encodeURIComponent(soql)}`;

  while (url) {
    const resp = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!resp.ok) {
      const body = await resp.text();
      throw new Error(`SOQL ${sobject} failed: HTTP ${resp.status} – ${body.slice(0, 300)}`);
    }
    const data = await resp.json();
    for (const r of data.records ?? []) ids.push(r.Id);
    url = data.nextRecordsUrl ? `${instanceUrl}${data.nextRecordsUrl}` : null;
  }
  return ids;
}

/**
 * Supprime une liste d'IDs via l'API composite (200 par call, allOrNone=false).
 */
async function deleteInBatches(
  accessToken: string,
  instanceUrl: string,
  ids: string[],
): Promise<{ deleted: number; errors: string[] }> {
  let deleted = 0;
  const errors: string[] = [];

  // Defense in depth : Salesforce IDs sont alphanumeriques (15 ou 18 chars)
  // mais on filtre quand meme contre tout char ambigue dans une URL avant
  // de les coller dans la query string. Si un ID est malforme on le skip.
  const SF_ID_RE = /^[a-zA-Z0-9]{15,18}$/;
  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    const batch = ids.slice(i, i + BATCH_SIZE).filter((id) => SF_ID_RE.test(id));
    if (batch.length === 0) continue;
    const url = `${instanceUrl}/services/data/${SF_API_VERSION}/composite/sobjects?ids=${batch.join(',')}&allOrNone=false`;
    const resp = await fetch(url, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!resp.ok) {
      errors.push(`batch ${Math.floor(i / BATCH_SIZE) + 1}: HTTP ${resp.status}`);
      continue;
    }
    const results = await resp.json();
    for (const r of results) {
      if (r.success) deleted++;
      else errors.push(`${r.id ?? '?'}: ${JSON.stringify(r.errors)}`);
    }
  }
  return { deleted, errors };
}

/**
 * POST /api/integrations/salesforce/wipe-activities
 *
 * Supprime TOUS les Tasks et Events de l'org Salesforce connectee.
 * Requiert le role admin.
 * Body attendu : { confirm: true }
 */
export async function POST(request: NextRequest) {
  try {
    // Auth check
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
      return NextResponse.json({ error: 'Profile not found' }, { status: 400 });
    }

    if (profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 });
    }

    // Require explicit confirmation in body
    const body = await request.json().catch(() => ({}));
    if (body?.confirm !== true) {
      return NextResponse.json(
        { error: 'confirm: true required in request body' },
        { status: 400 },
      );
    }

    // Fetch CRM connection
    const serviceClient = createServiceClient();
    const { data: connection, error: connError } = await serviceClient
      .from('crm_connections' as any)
      .select('*')
      .eq('company_id', profile.company_id)
      .eq('provider', 'salesforce')
      .eq('status', 'connected')
      .single() as any;

    if (connError || !connection) {
      return NextResponse.json(
        { error: 'No active Salesforce connection found' },
        { status: 404 },
      );
    }

    // Decrypt tokens — if this fails the user needs to reconnect
    let accessToken: string;
    let refreshToken: string;
    try {
      accessToken = decrypt(connection.config_json.access_token_encrypted);
      refreshToken = decrypt(connection.config_json.refresh_token_encrypted);
    } catch (decryptErr: any) {
      return NextResponse.json(
        {
          error: 'decrypt_failed',
          message:
            'Impossible de dechiffrer les tokens Salesforce. ' +
            'Reconnectez Salesforce depuis cette page pour regenerer les tokens, puis reessayez.',
        },
        { status: 422 },
      );
    }

    // Refresh token if expired
    const tokenExpiresAt = connection.config_json.token_expires_at
      ? new Date(connection.config_json.token_expires_at).getTime()
      : 0;

    if (Date.now() >= tokenExpiresAt - 60_000) {
      const refreshed = await refreshAccessToken(refreshToken);
      accessToken = refreshed.access_token;
      await serviceClient
        .from('crm_connections' as any)
        .update({
          config_json: {
            ...connection.config_json,
            access_token_encrypted: encrypt(refreshed.access_token),
            token_expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          },
        })
        .eq('id', connection.id);
    }

    const instanceUrl: string = connection.instance_url;

    // Fetch all IDs in parallel
    const [taskIds, eventIds] = await Promise.all([
      fetchAllIds(accessToken, instanceUrl, 'Task'),
      fetchAllIds(accessToken, instanceUrl, 'Event'),
    ]);

    if (taskIds.length === 0 && eventIds.length === 0) {
      return NextResponse.json({
        message: 'Rien a supprimer — aucune Task ni Event trouvee.',
        deleted: { tasks: 0, events: 0 },
        errors: [],
      });
    }

    // Delete in batches
    const [taskResult, eventResult] = await Promise.all([
      deleteInBatches(accessToken, instanceUrl, taskIds),
      deleteInBatches(accessToken, instanceUrl, eventIds),
    ]);

    return NextResponse.json({
      deleted: {
        tasks: taskResult.deleted,
        events: eventResult.deleted,
      },
      total: taskResult.deleted + eventResult.deleted,
      errors: [...taskResult.errors, ...eventResult.errors],
    });
  } catch (error: any) {
    console.error('[wipe-activities] error:', error?.message ?? error);
    return NextResponse.json(
      { error: error?.message ?? 'Erreur inconnue' },
      { status: 500 },
    );
  }
}
