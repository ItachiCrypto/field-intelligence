#!/usr/bin/env node
/**
 * Apply a single SQL migration file to Supabase Postgres using the direct
 * connection string in PG_CONNECTION. Exits non-zero on failure.
 *
 * Usage: node scripts/apply-migration.js <path-to-sql>
 */
/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('node:fs');
const path = require('node:path');
const { Client } = require('pg');

// Lightweight .env.local loader — avoids taking a dep on dotenv for a one-off
// script. Only sets keys that aren't already in process.env.
(function loadDotEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    const val = line.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = val;
  }
})();

async function main() {
  const target = process.argv[2];
  if (!target) {
    console.error('usage: node apply-migration.js <sql-file>');
    process.exit(2);
  }
  const sqlPath = path.resolve(target);
  if (!fs.existsSync(sqlPath)) {
    console.error('not found:', sqlPath);
    process.exit(2);
  }
  const conn = process.env.PG_CONNECTION;
  if (!conn) {
    console.error('PG_CONNECTION not set in .env.local');
    process.exit(2);
  }
  const sql = fs.readFileSync(sqlPath, 'utf8');
  const client = new Client({ connectionString: conn, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    console.log('[apply-migration] applying', path.basename(sqlPath));
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('[apply-migration] ok');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[apply-migration] FAILED:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
