// Rapport detaille du cout d'extraction IA pour une company.
// Lit processing_results et calcule : nb CRs traites, total tokens
// (input/output), cout total + extrapolation pour 200 / 1000 CRs.

import { readFileSync } from 'node:fs';
import pg from 'pg';

const env = readFileSync('.env.local', 'utf8');
const conn = env.match(/^PG_CONNECTION=(.+)$/m)[1].trim();
const COMPANY_ID = process.argv[2] || 'a0000000-0000-0000-0000-000000000001';

const c = new pg.Client({ connectionString: conn, ssl: { rejectUnauthorized: false } });
await c.connect();

const r = await c.query(
  `SELECT
     COUNT(*)::int                                      AS n,
     COALESCE(SUM(input_tokens), 0)::int                AS in_tot,
     COALESCE(SUM(output_tokens), 0)::int               AS out_tot,
     COALESCE(SUM(tokens_used), 0)::int                 AS tot_legacy,
     COALESCE(SUM(cost_usd), 0)::numeric                AS cost,
     COALESCE(AVG(input_tokens), 0)::numeric            AS in_avg,
     COALESCE(AVG(output_tokens), 0)::numeric           AS out_avg,
     COALESCE(AVG(cost_usd), 0)::numeric                AS cost_avg,
     COALESCE(MAX(cost_usd), 0)::numeric                AS cost_max,
     COALESCE(MIN(cost_usd) FILTER (WHERE cost_usd > 0), 0)::numeric AS cost_min,
     COALESCE(AVG(processing_time_ms), 0)::numeric      AS time_avg,
     ARRAY_AGG(DISTINCT model_used)                     AS models
   FROM processing_results
   WHERE company_id = $1`,
  [COMPANY_ID]
);

const row = r.rows[0];
const n = row.n;
const cost = Number(row.cost);
const costAvg = Number(row.cost_avg);
const costMin = Number(row.cost_min);
const costMax = Number(row.cost_max);
const inAvg = Number(row.in_avg);
const outAvg = Number(row.out_avg);
const timeAvg = Number(row.time_avg);
const models = (row.models || []).filter(Boolean);

console.log('═══════════════════════════════════════════════════════════════');
console.log(`COUT D'EXTRACTION IA — Company ${COMPANY_ID}`);
console.log('═══════════════════════════════════════════════════════════════\n');

if (n === 0) {
  console.log('Aucun CR traite pour cette company. Lance un Sync & Process pour mesurer.');
  await c.end();
  process.exit(0);
}

console.log(`Modele(s) utilise(s) : ${models.join(', ') || 'inconnu'}`);
console.log(`CRs traites          : ${n}`);
console.log('');

console.log('TOKENS');
console.log(`  Input total        : ${row.in_tot.toLocaleString()}`);
console.log(`  Output total       : ${row.out_tot.toLocaleString()}`);
console.log(`  Total              : ${(row.in_tot + row.out_tot).toLocaleString()}`);
console.log(`  Moyenne par CR     : ${Math.round(inAvg)} input / ${Math.round(outAvg)} output`);
console.log('');

console.log('COUT');
console.log(`  Total reel         : $${cost.toFixed(4)}`);
console.log(`  Moyenne par CR     : $${costAvg.toFixed(4)}`);
console.log(`  Min / Max par CR   : $${costMin.toFixed(4)} / $${costMax.toFixed(4)}`);
console.log('');

console.log('EXTRAPOLATIONS');
console.log(`  Pour 200 CRs       : $${(costAvg * 200).toFixed(2)}`);
console.log(`  Pour 1 000 CRs     : $${(costAvg * 1000).toFixed(2)}`);
console.log(`  Pour 10 000 CRs    : $${(costAvg * 10000).toFixed(2)}`);
console.log('');

console.log('PERFORMANCE');
console.log(`  Temps moyen par CR : ${(timeAvg / 1000).toFixed(2)}s`);
console.log('');

// Top 5 CRs les plus chers et les plus longs
const top = await c.query(
  `SELECT pr.cost_usd, pr.input_tokens, pr.output_tokens, pr.processing_time_ms,
          rvr.client_name, rvr.subject
   FROM processing_results pr
   LEFT JOIN raw_visit_reports rvr ON rvr.id = pr.raw_report_id
   WHERE pr.company_id = $1
   ORDER BY pr.cost_usd DESC
   LIMIT 5`,
  [COMPANY_ID]
);

if (top.rows.length > 0) {
  console.log('TOP 5 CRs LES PLUS CHERS');
  for (const r of top.rows) {
    const subject = (r.subject || r.client_name || 'sans titre').slice(0, 60);
    console.log(`  $${Number(r.cost_usd).toFixed(4)}  (${r.input_tokens} in / ${r.output_tokens} out, ${(r.processing_time_ms/1000).toFixed(1)}s) — ${subject}`);
  }
}

await c.end();
