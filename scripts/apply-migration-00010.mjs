import { readFileSync } from 'node:fs';
import pg from 'pg';

const conn = process.env.PG_CONNECTION;
if (!conn) {
  // Lecture paresseuse du .env.local si pas en env
  const env = readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
  const m = env.match(/^PG_CONNECTION=(.+)$/m);
  if (!m) throw new Error('PG_CONNECTION introuvable');
  process.env.PG_CONNECTION = m[1].trim();
}

const sql = readFileSync(
  new URL('../supabase/migrations/00010_add_echec_signal_type.sql', import.meta.url),
  'utf8'
);

const client = new pg.Client({
  connectionString: process.env.PG_CONNECTION,
  ssl: { rejectUnauthorized: false },
});

await client.connect();
console.log('→ Connecté. Exécution de la migration 00010…');
console.log('---\n' + sql + '\n---');
await client.query(sql);
console.log('✓ Migration appliquée.');

// Vérification : l'enum contient bien 'echec'
const { rows } = await client.query(
  `SELECT unnest(enum_range(NULL::signal_type))::text AS value`
);
console.log('✓ signal_type =', rows.map((r) => r.value).join(', '));

await client.end();
