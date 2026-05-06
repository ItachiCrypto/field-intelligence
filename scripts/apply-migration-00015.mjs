import { readFileSync } from 'node:fs';
import pg from 'pg';
const env = readFileSync('.env.local', 'utf8');
const conn = env.match(/^PG_CONNECTION=(.+)$/m)[1].trim();
const sql = readFileSync('supabase/migrations/00015_security_hardening_v2.sql', 'utf8');
const c = new pg.Client({ connectionString: conn, ssl: { rejectUnauthorized: false } });
await c.connect();
try {
  await c.query(sql);
  console.log('✓ Migration 00015 appliquee.');
  const r = await c.query("SELECT indexname FROM pg_indexes WHERE indexname='idx_competitors_company_name_lower'");
  console.log('  Index dedup competitors:', r.rows.length ? 'OK' : 'MISSING');
} catch (e) { console.error('✗', e.message); process.exit(1); }
finally { await c.end(); }
