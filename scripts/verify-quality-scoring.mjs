// Smoke test du scoring qualite CR. Pas d'appel LLM : on instancie le scorer
// avec des extractions synthetiques et on verifie que les scores sont
// coherents avec la grille (faible/moyen/bon/excellent).

import { readFileSync } from 'node:fs';

// Inline mirror exact de computeCRQualityScore (quality-score.ts)
function computeCRQualityScore({ extracted, crText, hasClientName, hasCommercialName, hasVisitDate }) {
  const text = (crText ?? '').trim();
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const signals = Array.isArray(extracted?.signals) ? extracted.signals : [];
  const deals = Array.isArray(extracted?.deals) ? extracted.deals : [];
  const prixSignals = Array.isArray(extracted?.prix_signals) ? extracted.prix_signals : [];
  const objectifs = Array.isArray(extracted?.objectifs) ? extracted.objectifs : [];
  const needs = Array.isArray(extracted?.needs) ? extracted.needs : [];
  const competitors = Array.isArray(extracted?.competitors_mentioned) ? extracted.competitors_mentioned : [];
  const hasVerbatim = (it) => typeof it?.verbatim === 'string' && it.verbatim.trim().length > 10;
  const hasContent = (it) => typeof it?.content === 'string' && it.content.trim().length > 10;
  const hasNextStep = /\b(next\s*rdv|prochain\s*rdv|relancer?|envoy[eé]e?|envoi|mise\s*en\s*place|prochaine\s*[ée]tape|next\s*step)/i.test(text)
    || /\bRDV\s+le\s+\d{1,2}\/\d{1,2}/i.test(text);
  const hasNumbers = (text.match(/[0-9]/g) || []).length >= 5;
  const hasQuotes = /["«][^"»]{15,}/.test(text) || signals.some(hasContent);
  const hasPriceMention = /\b(prix|remise|discount|marge|tarif|offre|gratuit|reduction)\b/i.test(text)
    || /\b\d+\s?(?:€|EUR|%)\b/.test(text);
  const criteria = [
    { id: 'client_named', weight: 8, passed: hasClientName },
    { id: 'commercial_named', weight: 5, passed: hasCommercialName },
    { id: 'visit_date', weight: 5, passed: hasVisitDate },
    { id: 'sufficient_length', weight: 8, passed: wordCount >= 40 },
    { id: 'competitor_named', weight: 12, passed: competitors.length >= 1 || signals.some((s) => s?.competitor_name) || prixSignals.some((p) => p?.concurrent_nom) },
    { id: 'verbatim_present', weight: 12, passed: hasQuotes || prixSignals.some(hasVerbatim) || deals.some(hasVerbatim) },
    { id: 'numbers_present', weight: 10, passed: hasNumbers },
    { id: 'price_signal', weight: 10, passed: prixSignals.length >= 1 || hasPriceMention },
    { id: 'objectif_present', weight: 10, passed: objectifs.length >= 1 },
    { id: 'need_or_signal', weight: 10, passed: needs.length >= 1 || signals.length >= 1 },
    { id: 'next_step', weight: 10, passed: hasNextStep },
  ];
  const passedWeight = criteria.reduce((s, c) => s + (c.passed ? c.weight : 0), 0);
  const totalWeight = criteria.reduce((s, c) => s + c.weight, 0);
  const score = Math.round((passedWeight / totalWeight) * 100);
  let band;
  if (score >= 85) band = 'excellent';
  else if (score >= 70) band = 'bon';
  else if (score >= 50) band = 'moyen';
  else band = 'faible';
  return { score, band, criteria, passedWeight };
}

console.log('═══════════════════════════════════════════════════════════════');
console.log('TEST — Quality scoring sur CRs synthetiques');
console.log('═══════════════════════════════════════════════════════════════\n');

const cases = [
  {
    name: 'CR vide vague (≈30)',
    expectBand: 'faible',
    expectScore: [25, 45],
    input: {
      extracted: {},
      crText: 'RDV cliente. Bons retours. À recontacter.',
      hasClientName: true, hasCommercialName: true, hasVisitDate: true,
    },
  },
  {
    name: 'CR moyen Roche-style (≈60)',
    expectBand: 'moyen',
    expectScore: [50, 75],
    input: {
      extracted: {
        signals: [{ type: 'concurrence', severity: 'jaune', title: 'Abbott', content: 'Abbott actif', competitor_name: 'Abbott' }],
        prix_signals: [{ concurrent_nom: 'Abbott', verbatim: 'Remise 18% sur volume Abbott' }],
        deals: [],
        needs: [{ label: 'Formation produit', trend: 'new' }],
        objectifs: [],
        competitors_mentioned: [{ name: 'Abbott' }],
      },
      crText: 'Pharmacie du Centre, Lyon. Acteurs Abbott et Lifescan. Remise 18% Abbott. Pas le temps next rdv.',
      hasClientName: true, hasCommercialName: true, hasVisitDate: true,
    },
  },
  {
    name: 'CR riche complet (≈90)',
    expectBand: 'excellent',
    expectScore: [80, 100],
    input: {
      extracted: {
        signals: [
          { type: 'concurrence', severity: 'rouge', title: 'Abbott menace', content: 'Risque switch Abbott', competitor_name: 'Abbott' },
          { type: 'prix', severity: 'orange', title: 'Ecart prix', content: 'Ecart -12% vs Abbott' },
        ],
        prix_signals: [{ concurrent_nom: 'Abbott', ecart_pct: 12, verbatim: 'Si vous bougez pas sur l\'AF je teste Abbott au prochain trimestre' }],
        deals: [{ view: 'commercial', motif: 'concurrent', resultat: 'en_cours', verbatim: 'Risque bascule Abbott', concurrent_nom: 'Abbott' }],
        needs: [{ label: 'Argumentaire AF patient', trend: 'new' }],
        objectifs: [{ type: 'signature', resultat: 'non_atteint', cause_echec: 'surstock 2025' }],
        competitors_mentioned: [{ name: 'Abbott' }, { name: 'Lifescan' }],
      },
      crText: `Pharmacie du Centre — Marie Lambert (Lyon 3e).
PDM 68%. Rotation Roche : B7:90 / K7:35 / L7:85.
Ecart prix Abbott : -12% sur AF.
"Si vous bougez pas sur l'AF, je teste Abbott au prochain trimestre."
Objectif AF -> Non atteint, cause surstock 2025.
Next rdv le 14/05 a 10h30. Envoi argumentaire AF par mail.`,
      hasClientName: true, hasCommercialName: true, hasVisitDate: true,
    },
  },
  {
    name: 'CR sans Salesforce wiring (≈10)',
    expectBand: 'faible',
    expectScore: [0, 30],
    input: {
      extracted: {},
      crText: 'rien',
      hasClientName: false, hasCommercialName: false, hasVisitDate: false,
    },
  },
];

let pass = 0, fail = 0;
for (const c of cases) {
  const r = computeCRQualityScore(c.input);
  const inBand = r.band === c.expectBand;
  const inRange = r.score >= c.expectScore[0] && r.score <= c.expectScore[1];
  const ok = inBand && inRange;
  console.log(`${ok ? '✓' : '✗'} ${c.name}: score=${r.score} (band=${r.band})`);
  if (!ok) {
    console.log(`    expected band=${c.expectBand}, score in [${c.expectScore.join(',')}]`);
    console.log(`    criteres rates :`);
    for (const cr of r.criteria.filter((x) => !x.passed)) {
      console.log(`      - ${cr.id} (-${cr.weight}pts)`);
    }
  }
  if (ok) pass++; else fail++;
}

console.log(`\n${pass}/${cases.length} cases OK`);

// Static check : prompt persona block
const promptSrc = readFileSync('src/lib/crm/extraction-prompt.ts', 'utf8');
console.log('\n─── Static checks prompt ──────────────────────────');
const checks = [
  { n: 'Section RESPONSABLE MARKETING', ok: promptSrc.includes('RESPONSABLE MARKETING') },
  { n: 'Section COMMERCIAL TERRAIN / KAM', ok: promptSrc.includes('COMMERCIAL TERRAIN') },
  { n: 'Section DIRECTEUR COMMERCIAL', ok: promptSrc.includes('DIRECTEUR COMMERCIAL') },
  { n: 'Verification mentale 3 personas', ok: promptSrc.includes('verification mentale') || promptSrc.includes('marketeur, un commercial') },
  { n: 'Mots-cles metier (PDM, switch, rotation)', ok: promptSrc.includes('switch') && promptSrc.includes('PDM') && promptSrc.includes('rotation') },
];
let pass2 = 0;
for (const c of checks) {
  console.log(`${c.ok ? '✓' : '✗'} ${c.n}`);
  if (c.ok) pass2++;
}
console.log(`${pass2}/${checks.length} checks prompt OK`);

const total = pass + pass2;
const tot = cases.length + checks.length;
console.log(`\n═══ TOTAL ${total}/${tot} ═══`);
process.exit(total === tot ? 0 : 1);
