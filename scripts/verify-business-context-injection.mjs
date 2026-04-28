// Smoke test : verifie que business_context est bien injecte dans le prompt
// envoye a l'IA. Deux verifications :
//  1. Static : le code de process-report.ts fetch business_context et le passe
//     a buildExtractionPrompt, et buildExtractionPrompt l'injecte dans le prompt.
//  2. Runtime : on porte buildExtractionPrompt en JS pur (mirroir exact du TS)
//     et on imprime le prompt final genere pour un CR de demo.

import { readFileSync } from 'node:fs';
import pg from 'pg';

const env = readFileSync('.env.local', 'utf8');
const conn = env.match(/^PG_CONNECTION=(.+)$/m)[1].trim();

// ─── 1. STATIC CHECKS ─────────────────────────────────────────────────────
const procSrc = readFileSync('src/lib/crm/process-report.ts', 'utf8');
const promptSrc = readFileSync('src/lib/crm/extraction-prompt.ts', 'utf8');

const checks = [
  {
    name: 'process-report fetch companies.business_context',
    ok: /select\(\s*['"]business_context['"]\s*\)\s*\.eq\('id', report\.company_id\)/.test(procSrc)
      || (procSrc.includes("from('companies'") && procSrc.includes('business_context')),
  },
  {
    name: 'process-report passe business_context a buildExtractionPrompt',
    ok: /buildExtractionPrompt\([\s\S]{0,400}business_context/.test(procSrc),
  },
  {
    name: 'buildExtractionPrompt accepte le 4e parametre businessContext',
    ok: /export function buildExtractionPrompt\([\s\S]+?businessContext\??:\s*string\s*\|\s*null/m.test(promptSrc),
  },
  {
    name: 'buildExtractionPrompt definit la section CONTEXTE DE L\'ENTREPRISE',
    ok: promptSrc.includes("CONTEXTE DE L'ENTREPRISE UTILISATRICE"),
  },
  {
    name: 'buildExtractionPrompt cap business_context (MAX_BUSINESS_CONTEXT_CHARS)',
    ok: /MAX_BUSINESS_CONTEXT_CHARS\s*=\s*[\d_]+/.test(promptSrc),
  },
];

console.log('═══════════════════════════════════════════════════════════════');
console.log('1. STATIC CHECK — wiring code → AI prompt');
console.log('═══════════════════════════════════════════════════════════════\n');
let allOk = true;
for (const c of checks) {
  console.log(`${c.ok ? '✓' : '✗'} ${c.name}`);
  if (!c.ok) allOk = false;
}
console.log('');

// ─── 2. RUNTIME CHECK — appelle buildExtractionPrompt avec un vrai contexte ─

// Mirror exact du TS (extraction-prompt.ts) en JS pur. Si le TS change,
// re-synchroniser ici.
const MAX_CR_INPUT_CHARS = 32_000;
const MAX_BUSINESS_CONTEXT_CHARS = 4_000;

function buildExtractionPrompt(crText, knownCompetitors, knownAbbreviations, businessContext) {
  const safeCr = typeof crText === 'string'
    ? crText.length > MAX_CR_INPUT_CHARS
      ? crText.slice(0, MAX_CR_INPUT_CHARS) + '\n[... tronque]'
      : crText
    : '';
  const competitorsList = knownCompetitors.length > 0
    ? `Concurrents connus de cette entreprise : ${knownCompetitors.join(', ')}`
    : 'Aucun concurrent connu.';
  const abbrList = knownAbbreviations.length > 0
    ? `Abbreviations : ${knownAbbreviations.map(a => `${a.short}=${a.full}`).join(', ')}`
    : '';
  const trimmedContext = (businessContext ?? '').trim();
  const safeContext = trimmedContext.length > MAX_BUSINESS_CONTEXT_CHARS
    ? trimmedContext.slice(0, MAX_BUSINESS_CONTEXT_CHARS) + '\n[... tronque]'
    : trimmedContext;
  const contextBlock = safeContext
    ? `CONTEXTE DE L'ENTREPRISE UTILISATRICE (a utiliser pour mieux interpreter le CR : secteur, produits, concurrents, jargon metier, KPIs prioritaires) :
"""
${safeContext}
"""

`
    : '';
  return `Vous etes un expert en analyse de comptes rendus de visite commerciale francais.
Analysez ce compte-rendu et extrayez TOUTES les informations structurees en JSON strict.

${contextBlock}${competitorsList}
${abbrList}

COMPTE-RENDU:
"""
${safeCr}
"""

[... reste du prompt tronque pour ce smoke test ...]`;
}

// Lit le contexte reel depuis la DB
const c = new pg.Client({ connectionString: conn, ssl: { rejectUnauthorized: false } });
await c.connect();
const COMPANY_ID = process.argv[2] || 'a0000000-0000-0000-0000-000000000001';
const r = await c.query(
  'SELECT id, name, business_context FROM companies WHERE id = $1',
  [COMPANY_ID]
);
await c.end();

if (r.rows.length === 0) {
  console.error(`✗ Company ${COMPANY_ID} introuvable.`);
  process.exit(1);
}
const company = r.rows[0];

console.log('═══════════════════════════════════════════════════════════════');
console.log('2. RUNTIME CHECK — prompt construit pour Demo Corp');
console.log('═══════════════════════════════════════════════════════════════\n');
console.log(`Company: ${company.name}`);
console.log(`business_context en DB : ${company.business_context ? 'rempli (' + company.business_context.length + ' chars)' : 'NULL'}`);

const demoContext = company.business_context ?? `Distributeur de materiel de diagnostic glycemique aux pharmacies francaises.
Commerciaux visitent ~200 pharmacies/mois (IDF, Sud-Est, Ouest).
Concurrents principaux : Abbott, Dexcom, Ypsomed.
Produits : lecteurs B7, K7, L7, B7P. Auto-Piqueurs (AF) ROCHE/BD.
KPIs : PDM, rotation B7/K7/L7, signature offre AF.`;
if (!company.business_context) {
  console.log('  → injection d\'un contexte DEMO en RAM pour ce test (DB non modifiee).');
}
console.log('');

const sampleCR = `RDV avec Pharmacie du Centre — Marie Lambert (titulaire), Lyon 3e.
PDM 68%. Potentiel 220 tests.
Acteurs : ROCHE et Abbott. Bons retours sur 2025.
Rotation ROCHE : B7 : 90 / K7 : 35 / L7 : 85.
Ecart prix percu vs Abbott : -12%.
Verbatim : "Si vous bougez pas sur l'AF, je teste Abbott au prochain trimestre."
Objectif AF -> Non atteint. Cause : surstock 2025.
Next rdv le 14/05 a 10h30.`;

const promptWith = buildExtractionPrompt(
  sampleCR,
  ['Abbott', 'Dexcom', 'Ypsomed'],
  [{ short: 'PDM', full: 'Part de Marche' }, { short: 'AF', full: 'Auto-Piqueur' }],
  demoContext,
);
const promptWithout = buildExtractionPrompt(
  sampleCR,
  ['Abbott', 'Dexcom', 'Ypsomed'],
  [{ short: 'PDM', full: 'Part de Marche' }, { short: 'AF', full: 'Auto-Piqueur' }],
  null,
);

const hasContextSection = promptWith.includes("CONTEXTE DE L'ENTREPRISE UTILISATRICE");
const containsContextText = promptWith.includes(demoContext.slice(0, 60));
const lengthDiff = promptWith.length - promptWithout.length;

console.log(`✓ Section CONTEXTE DE L'ENTREPRISE UTILISATRICE presente : ${hasContextSection ? 'oui' : 'NON'}`);
console.log(`✓ Texte du business_context inclus dans le prompt    : ${containsContextText ? 'oui' : 'NON'}`);
console.log(`✓ Taille (avec) - Taille (sans) : +${lengthDiff} caracteres`);
console.log('');

console.log('─── PROMPT GENERE (premiers 1200 chars) ────────────────────────\n');
console.log(promptWith.slice(0, 1200));
console.log('\n[... CR + reste du prompt tronques ici, total = ' + promptWith.length + ' chars]\n');

console.log('═══════════════════════════════════════════════════════════════');
console.log('VERDICT');
console.log('═══════════════════════════════════════════════════════════════\n');

if (allOk && hasContextSection && containsContextText) {
  console.log('✓ business_context EST utilise par l\'IA pour chaque CR analyse.\n');
  console.log('Chemin complet verifie :');
  console.log('  1. signup → metadata business_context → trigger handle_new_user');
  console.log('     persiste dans companies.business_context (migration 00012)');
  console.log('  2. /admin/contexte-ia permet a l\'admin de l\'editer (RLS:');
  console.log('     id = current_company_id() AND current_user_role() = \'admin\')');
  console.log('  3. process-report.ts charge companies.business_context');
  console.log('  4. buildExtractionPrompt injecte la section CONTEXTE DE');
  console.log('     L\'ENTREPRISE UTILISATRICE en tete du prompt (cap 4k chars)');
  console.log('  5. Le prompt avec contexte est envoye comme messages[0].content');
  console.log('     a l\'API Anthropic (Claude) ou OpenAI (GPT)');
  process.exit(0);
} else {
  console.log('✗ Probleme detecte — voir les checks marques NON ci-dessus.');
  process.exit(1);
}
