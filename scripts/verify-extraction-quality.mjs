// Smoke test des ameliorations extraction (2026-05-04) :
//  1. Canonicalisation des concurrents via abbreviations + business_context
//  2. Capture des prix concurrents sans % comparatif explicite
//  3. Inference region depuis ville (Roche CRs cite des villes en clair)
//  4. Account context (city/region/sector) injecte dans le prompt
//
// Pas d'appel a l'API LLM ici : on instancie le resolver de canonicalisation
// + on inspecte le prompt construit pour verifier les nouvelles sections.

import { readFileSync } from 'node:fs';

// Inline minimal port de buildCanonicalResolver (mirror exact de canonicalize.ts)
function normKey(s) {
  return (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

function buildCanonicalResolver({ abbreviations = [], businessContext = null, knownCompetitors = [] }) {
  const canonOf = new Map();
  if (businessContext) {
    for (const rawLine of businessContext.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || !line.includes('=')) continue;
      const parts = line.split('=')
        .map((p) => p.trim().replace(/^[-*•·\s]+/, '').replace(/[\s.,;]+$/, ''))
        .filter((p) => p.length > 0 && p.length < 80);
      if (parts.length < 2) continue;
      if (parts.some((p) => p.split(/\s+/).length > 4)) continue;
      const canonical = parts[0];
      for (const alias of parts) {
        const k = normKey(alias);
        if (k && !canonOf.has(k)) canonOf.set(k, canonical);
      }
    }
  }
  for (const { short, full } of abbreviations) {
    if (!short || !full) continue;
    const k = normKey(short);
    if (k && !canonOf.has(k)) canonOf.set(k, full);
    const kFull = normKey(full);
    if (kFull && !canonOf.has(kFull)) canonOf.set(kFull, full);
  }
  for (const c of knownCompetitors) {
    const k = normKey(c);
    if (k && !canonOf.has(k)) canonOf.set(k, c);
  }
  return (raw) => {
    if (!raw || typeof raw !== 'string') return null;
    const k = normKey(raw);
    if (!k) return null;
    return canonOf.get(k) || raw.trim();
  };
}

console.log('═══════════════════════════════════════════════════════════════');
console.log('TEST 1 — Canonicalization concurrents');
console.log('═══════════════════════════════════════════════════════════════\n');

const businessContext = `Activité : Distributeur Roche Diabetes Care en France.
Concurrents principaux : Abbott, Lifescan, BD, Ascensia, Pic.

Aliases concurrents :
Lifescan = OneTouch = LS
Abbott = FreeStyle = FreeStyle Libre = AbbVie
BD = Becton Dickinson = Micro-Fine
Ascensia = Contour = Contour Next

KPIs : PDM, rotation B7/K7/L7.`;

const abbreviations = [
  { short: 'AC', full: 'Accu-Chek' },
  { short: 'AF', full: 'Auto-Piqueur' },
  { short: 'PDM', full: 'Part de Marche' },
];

const knownCompetitors = ['Abbott', 'Lifescan', 'BD', 'Ascensia', 'Pic', 'Insupen', 'Marque Verte'];

const resolve = buildCanonicalResolver({ abbreviations, businessContext, knownCompetitors });

const TEST_CASES = [
  // [input,                expected_canonical]
  ['OneTouch',              'Lifescan'],
  ['LS',                    'Lifescan'],
  ['lifescan',              'Lifescan'], // case-insensitive
  ['Lifescan',              'Lifescan'],
  ['FreeStyle',             'Abbott'],
  ['FreeStyle Libre',       'Abbott'],
  ['AbbVie',                'Abbott'],
  ['Abbott',                'Abbott'],
  ['Becton Dickinson',      'BD'],
  ['Micro-Fine',            'BD'],
  ['BD',                    'BD'],
  ['Contour Next',          'Ascensia'],
  ['Ascensia',              'Ascensia'],
  ['Insupen',               'Insupen'], // not aliased, stays as-is
  ['UnknownCompetitor',     'UnknownCompetitor'], // unknown, stays as-is
];

let pass = 0, fail = 0;
for (const [input, expected] of TEST_CASES) {
  const got = resolve(input);
  const ok = got === expected;
  console.log(`${ok ? '✓' : '✗'} resolve("${input}") = "${got}"  (expected "${expected}")`);
  if (ok) pass++; else fail++;
}
console.log(`\n  ${pass}/${TEST_CASES.length} passed.\n`);

console.log('═══════════════════════════════════════════════════════════════');
console.log('TEST 2 — Section CONTEXTE DU COMPTE CRM dans le prompt');
console.log('═══════════════════════════════════════════════════════════════\n');

const promptSrc = readFileSync('src/lib/crm/extraction-prompt.ts', 'utf8');

const promptChecks = [
  { name: 'Section CONTEXTE DU COMPTE CRM',          ok: promptSrc.includes('CONTEXTE DU COMPTE CRM LIE A CE CR') },
  { name: 'Bloc REGLE DE CANONICALISATION',          ok: promptSrc.includes('REGLE DE CANONICALISATION') },
  { name: 'Section EXTRACTION DES PRIX_SIGNALS',     ok: promptSrc.includes('EXTRACTION DES PRIX_SIGNALS') },
  { name: 'Mention prix absolus capturable',         ok: promptSrc.includes('Prix absolus concurrent') },
  { name: 'Mention remises capturables',             ok: promptSrc.includes('Remises concurrents') },
  { name: 'Mention vente flash / contrat exclusif',  ok: promptSrc.includes('Vente flash') || promptSrc.includes('contrat exclusif') },
  { name: 'Table villes etendue (Aix-en-Provence)',  ok: promptSrc.includes('Aix-en-Provence') },
  { name: 'Table villes etendue (La Rochelle)',      ok: promptSrc.includes('La Rochelle') },
  { name: 'Table villes etendue (Saint-Chamond)',    ok: promptSrc.includes('Saint-Chamond') },
  { name: 'PrixSignalSchema avec ecart_pct nullable',ok: /ecart_pct:\s*z\.union\(\[z\.number\(\)/.test(promptSrc) || /ecart_pct.*nullable/.test(promptSrc) },
  { name: 'AccountContext exporte',                  ok: promptSrc.includes('export interface AccountContext') },
];

let pass2 = 0;
for (const c of promptChecks) {
  console.log(`${c.ok ? '✓' : '✗'} ${c.name}`);
  if (c.ok) pass2++;
}
console.log(`\n  ${pass2}/${promptChecks.length} passed.\n`);

console.log('═══════════════════════════════════════════════════════════════');
console.log('TEST 3 — process-report.ts wiring');
console.log('═══════════════════════════════════════════════════════════════\n');

const procSrc = readFileSync('src/lib/crm/process-report.ts', 'utf8');

const wiringChecks = [
  { name: 'Import canonicalize',                     ok: procSrc.includes("from './canonicalize'") },
  { name: 'Fetch account by client_name',            ok: /from\(['"]accounts['"][\s\S]+?ilike\(['"]name['"]/.test(procSrc) },
  { name: 'Pass accountCtx a buildExtractionPrompt', ok: /buildExtractionPrompt\([\s\S]{0,500}accountCtx/.test(procSrc) },
  { name: 'canonicalizeExtraction appele',           ok: procSrc.includes('canonicalizeExtraction(extracted') },
  { name: 'Modele claude-sonnet-4-5',                ok: procSrc.includes('claude-sonnet-4-5') },
  { name: 'Override via ANTHROPIC_MODEL env',        ok: procSrc.includes('process.env.ANTHROPIC_MODEL') },
];

let pass3 = 0;
for (const c of wiringChecks) {
  console.log(`${c.ok ? '✓' : '✗'} ${c.name}`);
  if (c.ok) pass3++;
}
console.log(`\n  ${pass3}/${wiringChecks.length} passed.\n`);

const total = pass + pass2 + pass3;
const tot = TEST_CASES.length + promptChecks.length + wiringChecks.length;
console.log('═══════════════════════════════════════════════════════════════');
console.log(`VERDICT : ${total}/${tot} checks OK`);
console.log('═══════════════════════════════════════════════════════════════');
process.exit(total === tot ? 0 : 1);
