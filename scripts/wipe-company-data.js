#!/usr/bin/env node
/**
 * Remet a zero toutes les donnees company-scoped (CR, signaux, alertes,
 * offres, comm, deals, positionnement, sentiment, segmentation,
 * territoires, recos, commerciaux, concurrents, comptes, besoins,
 * abbreviations, invitations).
 *
 * CONSERVE : companies, profiles, crm_connections, stripe_webhook_events.
 *
 * Requiert `--confirm` en argument pour s'executer, pour eviter un kaboom
 * accidentel a l'autocompletion shell.
 */
/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('node:fs');
const path = require('node:path');
const { Client } = require('pg');

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

// Tables a vider. L'ordre n'a pas d'importance : on utilise TRUNCATE CASCADE
// dans une seule transaction, Postgres resout les dependances.
const WIPE_TABLES = [
  'raw_visit_reports',
  'signals',
  'alerts',
  'accounts',
  'commercials',
  'competitors',
  'needs',
  'prix_signals',
  'tendance_prix',
  'deals_marketing',
  'deals_commerciaux',
  'deal_tendance',
  'deal_commercial_tendance',
  'offres_concurrentes',
  'comm_concurrentes',
  'positionnement',
  'geo_sector_data',
  'geo_points',
  'region_profiles',
  'cr_objectifs',
  'sentiment_periodes',
  'sentiment_regions',
  'segment_sentiments',
  'segment_insights',
  'motifs_sentiment',
  'territoires',
  'recommandations_ia',
  'abbreviations',
  'invitations',
  'contacts',
  'opportunities',
  'processing_results',
];

async function main() {
  if (!process.argv.includes('--confirm')) {
    console.error('Refus : relance avec --confirm pour executer.');
    process.exit(2);
  }
  const c = new Client({
    connectionString: process.env.PG_CONNECTION,
    ssl: { rejectUnauthorized: false },
  });
  await c.connect();
  try {
    console.log('[wipe] TRUNCATE', WIPE_TABLES.length, 'tables en transaction...');
    await c.query('BEGIN');
    const joined = WIPE_TABLES.map((t) => `public.${t}`).join(', ');
    await c.query(`TRUNCATE TABLE ${joined} RESTART IDENTITY CASCADE`);
    await c.query('COMMIT');
    // Reset last_sync_at sur crm_connections → prochain sync repart de 0
    await c.query(`UPDATE public.crm_connections SET last_sync_at = NULL, records_synced = 0`);
    console.log('[wipe] OK — last_sync_at reset sur toutes les connexions CRM');
    // Verification rapide : on re-compte et on vide les preserves
    const keep = await c.query(`
      SELECT 'companies' AS t, COUNT(*)::int AS n FROM public.companies
      UNION ALL SELECT 'profiles', COUNT(*) FROM public.profiles
      UNION ALL SELECT 'crm_connections', COUNT(*) FROM public.crm_connections
      UNION ALL SELECT 'stripe_webhook_events', COUNT(*) FROM public.stripe_webhook_events
    `);
    console.log('\n--- KEPT ---');
    console.table(keep.rows);
  } catch (err) {
    await c.query('ROLLBACK').catch(() => {});
    console.error('[wipe] FAILED, rollback:', err.message);
    process.exit(1);
  } finally {
    await c.end();
  }
}

main();
