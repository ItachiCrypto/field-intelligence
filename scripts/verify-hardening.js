#!/usr/bin/env node
/* Smoke test: verify that migration 00006 changes are live.
 * Runs read-only queries against Supabase Postgres. */
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

async function main() {
  const client = new Client({
    connectionString: process.env.PG_CONNECTION,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  const checks = [
    {
      name: 'invitations.token_hash column exists + NOT NULL',
      sql: `SELECT is_nullable FROM information_schema.columns
            WHERE table_name='invitations' AND column_name='token_hash'`,
      assert: (r) => r.rows[0]?.is_nullable === 'NO',
    },
    {
      name: 'unique index on invitations.token_hash',
      sql: `SELECT indexname FROM pg_indexes
            WHERE tablename='invitations' AND indexname='idx_invitations_token_hash'`,
      assert: (r) => r.rowCount === 1,
    },
    {
      name: 'accept_invitation() function exists',
      sql: `SELECT 1 FROM pg_proc WHERE proname='accept_invitation'`,
      assert: (r) => r.rowCount >= 1,
    },
    {
      name: 'handle_new_user has pinned search_path',
      sql: `SELECT proconfig FROM pg_proc WHERE proname='handle_new_user'`,
      assert: (r) =>
        Array.isArray(r.rows[0]?.proconfig) &&
        r.rows[0].proconfig.some((s) => s.startsWith('search_path=')),
    },
    {
      name: 'enforce_profile_immutable trigger present',
      sql: `SELECT 1 FROM pg_trigger WHERE tgname='enforce_profile_immutable'`,
      assert: (r) => r.rowCount === 1,
    },
    {
      name: 'enforce_company_immutable trigger present',
      sql: `SELECT 1 FROM pg_trigger WHERE tgname='enforce_company_immutable'`,
      assert: (r) => r.rowCount === 1,
    },
    {
      name: 'companies update policy has WITH CHECK',
      sql: `SELECT with_check FROM pg_policies
            WHERE tablename='companies' AND policyname='company_update_admin'`,
      assert: (r) => r.rows[0]?.with_check != null,
    },
    {
      name: 'profiles update policy has WITH CHECK',
      sql: `SELECT with_check FROM pg_policies
            WHERE tablename='profiles' AND policyname='profiles_update_self_or_admin'`,
      assert: (r) => r.rows[0]?.with_check != null,
    },
    {
      name: 'stripe_webhook_events table exists',
      sql: `SELECT 1 FROM information_schema.tables
            WHERE table_name='stripe_webhook_events'`,
      assert: (r) => r.rowCount === 1,
    },
    {
      name: 'unique index on companies.stripe_customer_id',
      sql: `SELECT indexname FROM pg_indexes
            WHERE tablename='companies' AND indexname='idx_companies_stripe_customer'`,
      assert: (r) => r.rowCount === 1,
    },
    {
      name: 'unique index on companies.stripe_subscription_id',
      sql: `SELECT indexname FROM pg_indexes
            WHERE tablename='companies' AND indexname='idx_companies_stripe_subscription'`,
      assert: (r) => r.rowCount === 1,
    },
    {
      name: 'authenticated has NO INSERT on profiles',
      sql: `SELECT has_table_privilege('authenticated','profiles','INSERT') AS yes`,
      assert: (r) => r.rows[0]?.yes === false,
    },
  ];

  let fail = 0;
  for (const c of checks) {
    try {
      const r = await client.query(c.sql);
      const ok = c.assert(r);
      console.log(`${ok ? 'PASS' : 'FAIL'}  ${c.name}`);
      if (!ok) fail++;
    } catch (e) {
      console.log(`ERROR ${c.name}: ${e.message}`);
      fail++;
    }
  }

  await client.end();
  if (fail > 0) {
    console.log(`\n${fail} check(s) failed.`);
    process.exit(1);
  }
  console.log('\nAll hardening checks passed.');
}

main();
