// Dedup case-variants des competitors apres coup. Pour chaque groupe
// (company_id, lower(name)) ayant >1 entree, on garde la PREMIERE creee
// et on reecrit toutes les references textuelles (signals.competitor_name,
// prix_signals.concurrent_nom, deals_*.concurrent_nom, etc.) vers la
// graphie canonique.

import { readFileSync } from 'node:fs';
import pg from 'pg';

const env = readFileSync('.env.local', 'utf8');
const conn = env.match(/^PG_CONNECTION=(.+)$/m)[1].trim();
const COMPANY_ID = process.argv[2] || 'a0000000-0000-0000-0000-000000000001';

const c = new pg.Client({ connectionString: conn, ssl: { rejectUnauthorized: false } });
await c.connect();

// Trouve les groupes en doublon par lower(name).
// Pas de colonne created_at sur competitors : on utilise id (uuid v4 random,
// stable dans le temps) comme tiebreaker. Mieux : on prend la graphie avec
// la plus grande premiere lettre majuscule (heuristique pour preferer "Marque"
// a "marque").
const dupes = await c.query(
  `SELECT lower(name) AS k, array_agg(name) AS names, array_agg(id) AS ids
   FROM competitors
   WHERE company_id = $1
   GROUP BY lower(name)
   HAVING COUNT(*) > 1`,
  [COMPANY_ID]
);

console.log(`Groupes en doublon : ${dupes.rows.length}`);
if (dupes.rows.length === 0) {
  console.log('  Rien a faire.');
  await c.end();
  process.exit(0);
}

await c.query('BEGIN');
let totalRewrites = 0;
try {
  for (const row of dupes.rows) {
    // Choisir la graphie avec la plus grande premiere lettre majuscule
    // ("Marque" plutot que "marque"). Si egal, prendre la plus longue.
    const ranked = row.names.map((n, i) => ({ name: n, id: row.ids[i] }))
      .sort((a, b) => {
        const aCap = /^[A-Z]/.test(a.name) ? 1 : 0;
        const bCap = /^[A-Z]/.test(b.name) ? 1 : 0;
        if (aCap !== bCap) return bCap - aCap;
        return b.name.length - a.name.length;
      });
    const canonical = ranked[0].name;
    const aliases = ranked.slice(1).map((r) => r.name);
    const aliasIds = ranked.slice(1).map((r) => r.id);
    console.log(`\nGroupe "${row.k}" :`);
    console.log(`  canonique : "${canonical}"`);
    console.log(`  aliases   : ${aliases.map((a) => `"${a}"`).join(', ')}`);

    // Rewrite text references in dependent tables
    const tables = [
      { table: 'signals',           col: 'competitor_name' },
      { table: 'prix_signals',      col: 'concurrent_nom' },
      { table: 'deals_marketing',   col: 'concurrent_nom' },
      { table: 'deals_commerciaux', col: 'concurrent_nom' },
      { table: 'offres_concurrentes', col: 'concurrent_nom' },
      { table: 'comm_concurrentes',   col: 'concurrent_nom' },
      { table: 'positionnement',      col: 'acteur' },
    ];
    for (const { table, col } of tables) {
      for (const alias of aliases) {
        const r = await c.query(
          `UPDATE ${table} SET ${col} = $1 WHERE company_id = $2 AND ${col} = $3`,
          [canonical, COMPANY_ID, alias]
        );
        if (r.rowCount > 0) {
          console.log(`    ${table}.${col} : ${r.rowCount} ligne(s) reecrite(s) ("${alias}" -> "${canonical}")`);
          totalRewrites += r.rowCount;
        }
      }
    }

    // Delete duplicate competitor rows
    const del = await c.query(
      `DELETE FROM competitors WHERE id = ANY($1::uuid[])`,
      [aliasIds]
    );
    console.log(`    competitors : ${del.rowCount} doublon(s) supprime(s)`);
  }
  await c.query('COMMIT');
  console.log(`\n✓ Dedup commit. ${totalRewrites} references textuelles reecrites.`);
} catch (e) {
  await c.query('ROLLBACK');
  console.error('✗ Rollback :', e.message);
  process.exit(1);
} finally {
  await c.end();
}
