// Drop total des donnees d'une entreprise (option B).
// Garde: companies row, profiles (users), abbreviations (glossaire manuel).
// Purge: tout le reste — raw_visit_reports inclus.
// Apres execution: l'admin doit reconnecter Salesforce dans /admin/integrations.

import pg from 'pg';
import fs from 'node:fs';

const env = fs.readFileSync('.env.local', 'utf8');
const conn = env.match(/^PG_CONNECTION=(.+)$/m)[1].trim();

const COMPANY_ID = process.argv[2] || 'a0000000-0000-0000-0000-000000000001';

const KEEP_TABLES = new Set([
  'companies',         // la row elle-meme
  'profiles',          // utilisateurs
  'abbreviations',     // glossaire (pas issu du CRM)
  'invitations',       // invitations en cours
]);

const c = new pg.Client({ connectionString: conn, ssl: { rejectUnauthorized: false } });
await c.connect();

// 1. Sanity check
const chk = await c.query('SELECT id, name FROM companies WHERE id = $1', [COMPANY_ID]);
if (chk.rows.length === 0) {
  console.error(`✗ Company ${COMPANY_ID} introuvable.`);
  process.exit(1);
}
console.log(`→ Drop total pour company: ${chk.rows[0].name} (${COMPANY_ID})\n`);

// 2. Enumere toutes les tables publiques avec une colonne company_id
const { rows: tbls } = await c.query(`
  SELECT DISTINCT table_name
  FROM information_schema.columns
  WHERE table_schema = 'public' AND column_name = 'company_id'
  ORDER BY table_name
`);

const targets = tbls
  .map((r) => r.table_name)
  .filter((t) => !KEEP_TABLES.has(t));

console.log(`Tables cibles (${targets.length}):`);
for (const t of targets) console.log(`  - ${t}`);
console.log('');

// 3. Execute les DELETE dans une transaction + log des counts
await c.query('BEGIN');
try {
  const results = [];
  for (const t of targets) {
    const r = await c.query(
      `DELETE FROM ${t} WHERE company_id = $1`,
      [COMPANY_ID]
    );
    if (r.rowCount > 0) {
      results.push({ table: t, deleted: r.rowCount });
    }
  }
  await c.query('COMMIT');

  console.log('✓ Transaction commit.\n');
  console.log('Résumé (tables non vides uniquement):');
  for (const r of results) {
    console.log(`  ${r.table.padEnd(36)} ${r.deleted}`);
  }
  const total = results.reduce((s, r) => s + r.deleted, 0);
  console.log(`\n  ${'TOTAL'.padEnd(36)} ${total} rows supprimées.`);
} catch (e) {
  await c.query('ROLLBACK');
  console.error('✗ Rollback.', e);
  process.exit(1);
}

// 4. Verif finale
console.log('\nVérif post-drop (comptes restants):');
for (const t of ['raw_visit_reports', 'signals', 'alerts', 'accounts', 'commercials']) {
  const r = await c.query(`SELECT count(*)::int AS n FROM ${t} WHERE company_id=$1`, [COMPANY_ID]);
  console.log(`  ${t.padEnd(24)} ${r.rows[0].n}`);
}
console.log('');
console.log('Conservé:');
for (const t of ['profiles', 'abbreviations']) {
  const r = await c.query(`SELECT count(*)::int AS n FROM ${t} WHERE company_id=$1`, [COMPANY_ID]);
  console.log(`  ${t.padEnd(24)} ${r.rows[0].n}`);
}

await c.end();
console.log('\n→ Prochaines étapes:');
console.log('  1. Login en admin@field-intel.com sur l\'app');
console.log('  2. /admin/integrations → Reconnecter Salesforce');
console.log('  3. Cliquer "Sync & Process"');
