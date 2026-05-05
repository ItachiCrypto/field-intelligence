import { readFileSync } from 'node:fs';
import pg from 'pg';

const env = readFileSync('.env.local', 'utf8');
const conn = env.match(/^PG_CONNECTION=(.+)$/m)[1].trim();
const sql = readFileSync('supabase/migrations/00014_processing_cost_tracking.sql', 'utf8');

const c = new pg.Client({ connectionString: conn, ssl: { rejectUnauthorized: false } });
await c.connect();
try {
  await c.query(sql);
  console.log('✓ Migration 00014 appliquee.');
  const r = await c.query("SELECT column_name FROM information_schema.columns WHERE table_name='processing_results' AND column_name IN ('input_tokens','output_tokens','cost_usd') ORDER BY column_name");
  console.log('  Colonnes:', r.rows.map((x) => x.column_name).join(', '));
} catch (e) {
  console.error('✗', e.message);
  process.exit(1);
} finally {
  await c.end();
}
