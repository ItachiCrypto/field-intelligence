import pg from 'pg';
import fs from 'node:fs';
const env = fs.readFileSync('.env.local', 'utf8');
const conn = env.match(/^PG_CONNECTION=(.+)$/m)[1].trim();
const c = new pg.Client({ connectionString: conn, ssl: { rejectUnauthorized: false } });
await c.connect();
const cid = process.argv[2] || 'dbc0e735-332e-43e8-8865-c206d4bff4b8';
const tables = [
  'raw_visit_reports', 'signals', 'alerts', 'accounts', 'contacts',
  'commercials', 'competitors', 'needs', 'prix_signals', 'deals_marketing',
  'deals_commerciaux', 'offres_concurrentes', 'comm_concurrentes',
  'positionnement', 'geo_sector_data', 'cr_objectifs', 'sentiment_periodes',
  'sentiment_regions', 'segment_sentiments', 'territoires', 'region_profiles',
  'geo_points', 'recommandations_ia', 'deal_commercial_tendance',
  'motifs_sentiment', 'tendance_prix', 'deal_tendance', 'segment_insights',
];
console.log(`Company: ${cid}\n`);
for (const t of tables) {
  try {
    const r = await c.query(`SELECT count(*)::int AS n FROM ${t} WHERE company_id=$1`, [cid]);
    if (r.rows[0].n > 0) console.log(`  ${t.padEnd(32)} ${r.rows[0].n}`);
  } catch {}
}
await c.end();
