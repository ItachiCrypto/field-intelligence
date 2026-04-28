import { readFileSync } from 'node:fs';
import pg from 'pg';

const env = readFileSync('.env.local', 'utf8');
const conn = env.match(/^PG_CONNECTION=(.+)$/m)[1].trim();
const sql = readFileSync('supabase/migrations/00012_add_company_business_context.sql', 'utf8');

const c = new pg.Client({ connectionString: conn, ssl: { rejectUnauthorized: false } });
await c.connect();
try {
  await c.query(sql);
  console.log('✓ Migration 00012 appliquee.');
  const r = await c.query("SELECT column_name FROM information_schema.columns WHERE table_name='companies' AND column_name='business_context'");
  console.log('  business_context column:', r.rows.length ? 'OK' : 'MISSING');
} catch (e) {
  console.error('✗', e.message);
  process.exit(1);
} finally {
  await c.end();
}
