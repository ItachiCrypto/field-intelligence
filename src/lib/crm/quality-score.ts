// @ts-nocheck
// Scoring deterministe de la qualite d'un CR a partir de l'extraction IA.
// L'idee : un CR de qualite contient assez d'information pour qu'un
// marketeur, un commercial et un KAM y trouvent chacun une action
// concrete. On note 10 criteres binaires, chacun pesant un sous-total.
// Le score final est borne 0-100. quality_reasons explicite quels
// criteres sont remplis et lesquels manquent — ce qui donne au commercial
// une roadmap "voici quoi ajouter pour passer de 50 a 80".

export interface QualityCriterion {
  id: string;
  label: string;
  weight: number;
  passed: boolean;
  /** Suggestion courte adressee au commercial pour gagner ces points. */
  hint: string;
}

export interface QualityResult {
  score: number; // 0-100
  band: 'faible' | 'moyen' | 'bon' | 'excellent';
  criteria: QualityCriterion[];
  /** Total des poids des criteres remplis vs total des poids. */
  passedWeight: number;
  totalWeight: number;
}

/**
 * Compute a quality score from the AI extraction + raw CR text.
 * Pure function, no side effects. Safe for repeated runs.
 */
export function computeCRQualityScore(opts: {
  extracted: any;
  crText: string;
  /** From raw_visit_reports row (true if CRM identified a client/account) */
  hasClientName: boolean;
  hasCommercialName: boolean;
  hasVisitDate: boolean;
}): QualityResult {
  const { extracted, crText, hasClientName, hasCommercialName, hasVisitDate } = opts;

  const text = (crText ?? '').trim();
  const wordCount = text.split(/\s+/).filter(Boolean).length;

  const signals = Array.isArray(extracted?.signals) ? extracted.signals : [];
  const deals = Array.isArray(extracted?.deals) ? extracted.deals : [];
  const prixSignals = Array.isArray(extracted?.prix_signals) ? extracted.prix_signals : [];
  const objectifs = Array.isArray(extracted?.objectifs) ? extracted.objectifs : [];
  const needs = Array.isArray(extracted?.needs) ? extracted.needs : [];
  const competitors = Array.isArray(extracted?.competitors_mentioned) ? extracted.competitors_mentioned : [];

  const hasVerbatim = (it: any) => typeof it?.verbatim === 'string' && it.verbatim.trim().length > 10;
  const hasContent = (it: any) => typeof it?.content === 'string' && it.content.trim().length > 10;

  // Heuristiques de detection sur le texte brut. Pas parfait mais suffit
  // a detecter "Next rdv le 14/05" ou des nombres en quantite.
  const hasNextStep = /\b(next\s*rdv|prochain\s*rdv|relancer?|envoy[eé]e?|envoi|mise\s*en\s*place|prochaine\s*[ée]tape|next\s*step)/i.test(text)
    || /\bRDV\s+le\s+\d{1,2}\/\d{1,2}/i.test(text);
  const hasNumbers = (text.match(/[0-9]/g) || []).length >= 5;
  const hasQuotes = /["«][^"»]{15,}/.test(text) || signals.some(hasContent);
  const hasPriceMention = /\b(prix|remise|discount|marge|tarif|offre|gratuit|reduction)\b/i.test(text)
    || /\b\d+\s?(?:€|EUR|%)\b/.test(text);

  const criteria: QualityCriterion[] = [
    {
      id: 'client_named',
      label: 'Client identifié dans le CRM',
      weight: 8,
      passed: hasClientName,
      hint: 'Mentionne le nom EXACT du client (pharmacie, entreprise) tel qu\'il apparaît dans Salesforce.',
    },
    {
      id: 'commercial_named',
      label: 'Commercial identifié',
      weight: 5,
      passed: hasCommercialName,
      hint: 'Le CR doit être attribué à un Owner Salesforce (commercial qui a fait la visite).',
    },
    {
      id: 'visit_date',
      label: 'Date de visite renseignée',
      weight: 5,
      passed: hasVisitDate,
      hint: 'Renseigne ActivityDate côté Salesforce — sans date, impossible de tracer la fraîcheur.',
    },
    {
      id: 'sufficient_length',
      label: 'CR suffisamment détaillé (≥ 40 mots)',
      weight: 8,
      passed: wordCount >= 40,
      hint: `Étoffe le CR — il faut au moins 40 mots utiles. Actuel : ${wordCount} mots.`,
    },
    {
      id: 'competitor_named',
      label: 'Au moins 1 concurrent nommé',
      weight: 12,
      passed: competitors.length >= 1 || signals.some((s: any) => s?.competitor_name) || prixSignals.some((p: any) => p?.concurrent_nom),
      hint: 'Cite les concurrents par leur nom exact (Abbott, Lifescan, BD…) — pas "un autre fournisseur".',
    },
    {
      id: 'verbatim_present',
      label: 'Au moins 1 verbatim ou citation directe',
      weight: 12,
      passed: hasQuotes || prixSignals.some(hasVerbatim) || deals.some(hasVerbatim),
      hint: 'Insère une citation directe entre guillemets : "Le client m\'a dit que…". C\'est ce qui nourrit les alertes.',
    },
    {
      id: 'numbers_present',
      label: 'Chiffres concrets (rotations, %, volumes, prix)',
      weight: 10,
      passed: hasNumbers,
      hint: 'Donne des chiffres : PDM, rotations B7/K7/L7, écart prix vs concurrent, volumes commandés.',
    },
    {
      id: 'price_signal',
      label: 'Information de prix / remise / offre concurrent',
      weight: 10,
      passed: prixSignals.length >= 1 || hasPriceMention,
      hint: 'Mentionne les remises, offres ou prix des concurrents (ex. "Abbott fait −15% sur volume").',
    },
    {
      id: 'objectif_present',
      label: 'Objectif explicitement atteint ou raté',
      weight: 10,
      passed: objectifs.length >= 1,
      hint: 'Indique si l\'objectif (signature, sell-out, AF…) est atteint ou non, et la cause.',
    },
    {
      id: 'need_or_signal',
      label: 'Au moins 1 besoin client OU signal terrain',
      weight: 10,
      passed: needs.length >= 1 || signals.length >= 1,
      hint: 'Capture les besoins exprimés par le client (formation, animation, document patient…).',
    },
    {
      id: 'next_step',
      label: 'Prochaine action concrète (next step)',
      weight: 10,
      passed: hasNextStep,
      hint: 'Termine par les next steps : "Next rdv le 14/05", "Envoi mail argumentaire AF".',
    },
  ];

  const passedWeight = criteria.reduce((sum, c) => sum + (c.passed ? c.weight : 0), 0);
  const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);
  const score = Math.round((passedWeight / totalWeight) * 100);

  let band: QualityResult['band'];
  if (score >= 85) band = 'excellent';
  else if (score >= 70) band = 'bon';
  else if (score >= 50) band = 'moyen';
  else band = 'faible';

  return { score, band, criteria, passedWeight, totalWeight };
}

/**
 * Compact JSON-ready breakdown for storage in raw_visit_reports.quality_reasons.
 * Excludes the full criteria definitions to keep the row small; each entry is
 * just `{ id, passed }` — UI looks up labels/hints from the same module.
 */
export function buildQualityReasonsPayload(result: QualityResult) {
  return {
    score: result.score,
    band: result.band,
    criteria: result.criteria.map((c) => ({ id: c.id, passed: c.passed, weight: c.weight })),
    passed_weight: result.passedWeight,
    total_weight: result.totalWeight,
  };
}
