import { readFileSync } from 'node:fs';
import pg from 'pg';

const env = readFileSync('.env.local', 'utf8');
const conn = env.match(/^PG_CONNECTION=(.+)$/m)[1].trim();
const sql = readFileSync('supabase/migrations/00013_cr_quality_score.sql', 'utf8');

const c = new pg.Client({ connectionString: conn, ssl: { rejectUnauthorized: false } });
await c.connect();
try {
  await c.query(sql);
  console.log('✓ Migration 00013 appliquee.');
  const r1 = await c.query("SELECT column_name FROM information_schema.columns WHERE table_name='raw_visit_reports' AND column_name IN ('quality_score','quality_reasons')");
  console.log('  Colonnes:', r1.rows.map((r) => r.column_name).join(', '));
  const r2 = await c.query("SELECT proname FROM pg_proc WHERE proname = 'refresh_commercial_quality_score'");
  console.log('  Fonction:', r2.rows.length ? 'OK' : 'MISSING');
} catch (e) {
  console.error('✗', e.message);
  process.exit(1);
} finally {
  await c.end();
}
