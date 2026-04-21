#!/usr/bin/env node
/**
 * Supprime toutes les Tasks + Events dans l'org Salesforce connectee via
 * OAuth dans la table crm_connections. L'utilisateur (humain) execute ce
 * script. Moi (Claude) ne l'execute pas.
 *
 * Mode d'emploi :
 *   node scripts/wipe-salesforce-activities.js --confirm
 *
 * Options :
 *   --confirm            obligatoire, sinon refus
 *   --dry-run            compte sans supprimer
 *   --access-token TOK   override le token (ex. pour un autre org que celui
 *                        connecte via notre app)
 *   --instance-url URL   override l'instance_url (utilise seulement avec
 *                        --access-token)
 *
 * Par defaut : lit la premiere connexion 'connected' dans crm_connections,
 * dechiffre son access_token via CRM_ENCRYPTION_KEY, refresh si expire.
 *
 * Ce que le script fait :
 *  1. SOQL "SELECT Id FROM Task" (avec pagination queryMore)
 *  2. SOQL "SELECT Id FROM Event"
 *  3. DELETE en batch de 200 via /composite/sobjects?ids=...&allOrNone=false
 *  4. Imprime un compte-rendu : N supprimes, erreurs eventuelles
 *
 * Aucune suppression silencieuse : le script print ce qu'il va faire AVANT
 * de supprimer quoi que ce soit.
 */
/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { Client } = require('pg');

const SF_API_VERSION = 'v59.0';
const BATCH_SIZE = 200; // limite API composite Salesforce

// ---------------------------------------------------------------------------
// Bootstrap .env.local
// ---------------------------------------------------------------------------
(function loadDotEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) return;
  for (const raw of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const k = line.slice(0, eq).trim();
    const v = line.slice(eq + 1).trim();
    if (!(k in process.env)) process.env[k] = v;
  }
})();

// ---------------------------------------------------------------------------
// Dechiffrement AES-256-GCM (meme format que src/lib/crm/encryption.ts)
// Format : <ivHex>:<authTagHex>:<cipherHex>
// ---------------------------------------------------------------------------
function decryptAesGcm(encrypted) {
  const raw = process.env.CRM_ENCRYPTION_KEY;
  if (!raw || raw.length !== 64 || !/^[0-9a-fA-F]+$/.test(raw)) {
    throw new Error('CRM_ENCRYPTION_KEY doit etre 64 hex chars');
  }
  const key = Buffer.from(raw, 'hex');
  const [ivHex, tagHex, dataHex] = encrypted.split(':');
  if (!ivHex || !tagHex || !dataHex) {
    throw new Error('Format ciphertext invalide (attendu iv:tag:data)');
  }
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const data = Buffer.from(dataHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}

// ---------------------------------------------------------------------------
// Args CLI
// ---------------------------------------------------------------------------
function parseArgs() {
  const args = { confirm: false, dryRun: false, accessToken: null, instanceUrl: null };
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--confirm') args.confirm = true;
    else if (a === '--dry-run') args.dryRun = true;
    else if (a === '--access-token') args.accessToken = argv[++i];
    else if (a === '--instance-url') args.instanceUrl = argv[++i];
  }
  return args;
}

// ---------------------------------------------------------------------------
// OAuth : refresh du token via le refresh_token si besoin
// ---------------------------------------------------------------------------
async function refreshAccessToken(refreshToken) {
  const res = await fetch('https://login.salesforce.com/services/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: process.env.SALESFORCE_CLIENT_ID,
      client_secret: process.env.SALESFORCE_CLIENT_SECRET,
      refresh_token: refreshToken,
    }),
  });
  if (!res.ok) {
    throw new Error(`Refresh token failed: HTTP ${res.status} ${await res.text()}`);
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// Recupere toutes les IDs d'un sObject via SOQL (avec pagination queryMore)
// ---------------------------------------------------------------------------
async function fetchAllIds(accessToken, instanceUrl, sobject) {
  const ids = [];
  const q = `SELECT Id FROM ${sobject}`;
  let url = `${instanceUrl}/services/data/${SF_API_VERSION}/query?q=${encodeURIComponent(q)}`;
  while (url) {
    const resp = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!resp.ok) {
      const body = await resp.text();
      throw new Error(`SOQL ${sobject} failed: HTTP ${resp.status} - ${body.slice(0, 300)}`);
    }
    const data = await resp.json();
    for (const r of data.records || []) ids.push(r.Id);
    url = data.nextRecordsUrl ? `${instanceUrl}${data.nextRecordsUrl}` : null;
  }
  return ids;
}

// ---------------------------------------------------------------------------
// Supprime une liste d'IDs via l'API composite (200 par call, allOrNone=false).
// Retourne { deleted, errors[] }
// ---------------------------------------------------------------------------
async function deleteInBatches(accessToken, instanceUrl, ids) {
  let deleted = 0;
  const errors = [];
  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    const batch = ids.slice(i, i + BATCH_SIZE);
    const url = `${instanceUrl}/services/data/${SF_API_VERSION}/composite/sobjects?ids=${batch.join(',')}&allOrNone=false`;
    const resp = await fetch(url, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!resp.ok) {
      errors.push(`batch ${i / BATCH_SIZE + 1}: HTTP ${resp.status} ${await resp.text().catch(() => '')}`);
      continue;
    }
    const results = await resp.json();
    for (const r of results) {
      if (r.success) deleted++;
      else errors.push(`${r.id || '?'}: ${JSON.stringify(r.errors)}`);
    }
    // Log de progression pour les gros volumes
    process.stdout.write(`  … ${Math.min(i + BATCH_SIZE, ids.length)}/${ids.length}\r`);
  }
  if (ids.length > 0) process.stdout.write('\n');
  return { deleted, errors };
}

// ---------------------------------------------------------------------------
// Resolution des credentials : override CLI > DB OAuth
// ---------------------------------------------------------------------------
async function resolveCredentials(args) {
  if (args.accessToken) {
    if (!args.instanceUrl) throw new Error('--access-token requiert --instance-url');
    return { accessToken: args.accessToken, instanceUrl: args.instanceUrl, source: 'cli' };
  }
  const pg = new Client({
    connectionString: process.env.PG_CONNECTION,
    ssl: { rejectUnauthorized: false },
  });
  await pg.connect();
  try {
    const { rows } = await pg.query(
      "SELECT id, instance_url, config_json FROM crm_connections WHERE provider='salesforce' AND status='connected' ORDER BY updated_at DESC LIMIT 1"
    );
    if (rows.length === 0) {
      throw new Error("Aucune connexion Salesforce 'connected' en DB. Relance avec --access-token + --instance-url.");
    }
    const conn = rows[0];
    const cfg = conn.config_json || {};
    if (!cfg.access_token_encrypted || !cfg.refresh_token_encrypted) {
      throw new Error('config_json de crm_connections est incomplet (tokens chiffres manquants)');
    }
    let accessToken = decryptAesGcm(cfg.access_token_encrypted);
    const refreshToken = decryptAesGcm(cfg.refresh_token_encrypted);
    // Refresh si le token est expire (ou si on veut etre safe)
    const expAt = cfg.token_expires_at ? new Date(cfg.token_expires_at).getTime() : 0;
    if (Date.now() >= expAt - 60_000) {
      console.log('[sf-wipe] Access token expire, refresh...');
      const refreshed = await refreshAccessToken(refreshToken);
      accessToken = refreshed.access_token;
      // On ne persiste pas le nouveau token ici — le script est one-shot et la
      // sync normale du backend le renouvellera de son cote au prochain run.
    }
    return { accessToken, instanceUrl: conn.instance_url, source: 'db' };
  } finally {
    await pg.end();
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const args = parseArgs();
  if (!args.confirm && !args.dryRun) {
    console.error('Refus. Relance avec --confirm pour supprimer, ou --dry-run pour juste compter.');
    process.exit(2);
  }

  const { accessToken, instanceUrl, source } = await resolveCredentials(args);
  console.log(`[sf-wipe] Cible : ${instanceUrl} (source: ${source})`);

  console.log('[sf-wipe] Fetch IDs (Task + Event)...');
  const [taskIds, eventIds] = await Promise.all([
    fetchAllIds(accessToken, instanceUrl, 'Task'),
    fetchAllIds(accessToken, instanceUrl, 'Event'),
  ]);
  console.log(`  → Tasks  : ${taskIds.length}`);
  console.log(`  → Events : ${eventIds.length}`);

  if (taskIds.length === 0 && eventIds.length === 0) {
    console.log('Rien a supprimer.');
    return;
  }

  if (args.dryRun) {
    console.log('[sf-wipe] Dry run termine. Relance avec --confirm pour supprimer.');
    return;
  }

  console.log('[sf-wipe] DELETE Tasks...');
  const t = await deleteInBatches(accessToken, instanceUrl, taskIds);
  console.log(`  → ${t.deleted}/${taskIds.length} supprimees`);
  if (t.errors.length > 0) {
    console.log(`  → ${t.errors.length} erreurs :`);
    for (const e of t.errors.slice(0, 10)) console.log(`     - ${e}`);
    if (t.errors.length > 10) console.log(`     ... et ${t.errors.length - 10} autres`);
  }

  console.log('[sf-wipe] DELETE Events...');
  const e = await deleteInBatches(accessToken, instanceUrl, eventIds);
  console.log(`  → ${e.deleted}/${eventIds.length} supprimees`);
  if (e.errors.length > 0) {
    console.log(`  → ${e.errors.length} erreurs :`);
    for (const x of e.errors.slice(0, 10)) console.log(`     - ${x}`);
    if (e.errors.length > 10) console.log(`     ... et ${e.errors.length - 10} autres`);
  }

  console.log('\n[sf-wipe] Termine.');
}

main().catch((err) => {
  console.error('[sf-wipe] FAILED:', err.message || err);
  process.exit(1);
});
