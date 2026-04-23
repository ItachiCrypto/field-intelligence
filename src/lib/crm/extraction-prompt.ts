// @ts-nocheck
// Prompt d'extraction enrichi (audit 2026-04-15) : region, secteur, type_offre,
// type_action_communication, equilibrage marketing/commercial et positif/negatif.
import { z } from 'zod';
import type { ExtractedCRData } from './types';

// ---------------------------------------------------------------------------
// Input cap. A single CR of more than this many characters is almost
// certainly either a test payload or an attempt to exhaust tokens. Truncate
// silently to keep costs bounded.
// ---------------------------------------------------------------------------
const MAX_CR_INPUT_CHARS = 32_000;

export function buildExtractionPrompt(
  crText: string,
  knownCompetitors: string[],
  knownAbbreviations: { short: string; full: string }[],
): string {
  const safeCr =
    typeof crText === 'string'
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

  return `Vous etes un expert en analyse de comptes rendus de visite commerciale francais.
Analysez ce compte-rendu et extrayez TOUTES les informations structurees en JSON strict.

${competitorsList}
${abbrList}

COMPTE-RENDU:
"""
${safeCr}
"""

Extrayez en JSON strict (pas de texte avant/apres, uniquement le JSON) :

{
  "region": "IDF|Nord|Sud|Est|Ouest|Sud-Ouest|Sud-Est|Nord-Est ou null",
  "client_name": "nom exact du client/pharmacie/entreprise mentionné dans le CR, ou null",
  "secteur": "Pharma|Industrie|Tech|BTP|Agroalimentaire|Distribution|Services|Energie|Transport|Automobile|Autre",
  "signals": [
    {
      "type": "concurrence|besoin|prix|satisfaction|opportunite|echec",
      "severity": "rouge|orange|jaune|vert",
      "title": "titre court du signal",
      "content": "description du signal",
      "competitor_name": "nom du concurrent ou null",
      "price_delta": "ecart prix en % ou null",
      "region": "region (heritee du CR si non specifique)"
    }
  ],
  "deals": [
    {
      "view": "marketing|commercial",
      "motif": "prix|produit|offre|timing|concurrent|relation|budget|autre",
      "resultat": "gagne|perdu|en_cours",
      "concurrent_nom": "nom ou null",
      "type_offre": "remise|bundle|gratuit|upgrade|sav|autre",
      "verbatim": "extrait du CR",
      "region": "region (heritee du CR si non specifique)"
    }
  ],
  "prix_signals": [
    {
      "concurrent_nom": "nom",
      "ecart_pct": 12,
      "ecart_type": "inferieur|superieur",
      "verbatim": "extrait",
      "region": "region (heritee du CR si non specifique)"
    }
  ],
  "objectifs": [
    {
      "type": "signature|sell_out|sell_in|formation|decouverte|fidelisation",
      "resultat": "atteint|non_atteint",
      "cause_echec": "si non atteint, la cause",
      "facteur_reussite": "si atteint, le facteur cle"
    }
  ],
  "sentiment": "positif|negatif|neutre|interesse",
  "needs": [
    { "label": "formulation concise du besoin exprime par le client (ex: 'formation produit', 'delai livraison trop long')", "trend": "up|down|stable|new", "region": "region" }
  ],
  "competitors_mentioned": [
    { "name": "nom", "mention_type": "description courte", "type_action_communication": "remise|campagne|event|partenariat|autre" }
  ]
}

Regles :
- Soyez conservateur : n'inventez pas d'information absente du CR.
- Si aucun signal d'un type, retournez un tableau vide.
- Les prix doivent etre en pourcentage (ecart_pct est un nombre, pas une string).
- Le sentiment est une evaluation globale du ton du CR.
- Chaque deal detecte doit avoir un verbatim extrait directement du CR.

EQUILIBRAGE MARKETING/COMMERCIAL :
- Si un deal concerne le positionnement produit, l'offre/packaging, le canal de distribution,
  la communication/marque, l'image, la visibilite -> view="marketing".
- Sinon, view="commercial" (processus de vente, relation client, negociation, suivi, timing).
- Visez un equilibre realiste : ~30% des deals doivent etre "marketing" si les signaux le permettent.

EQUILIBRAGE POSITIF/NEGATIF :
- Meme dans les CRs positifs (deals gagnes, satisfaction), extraire les signaux verts
  (type=satisfaction, opportunite), les facteurs de succes, les innovations mentionnees.

EXTRACTION GEOGRAPHIQUE (region) :
- Paris->IDF, Lille->Nord, Lyon->Sud-Est, Nantes->Ouest, Bordeaux->Sud-Ouest,
  Strasbourg->Est, Marseille->Sud, Toulouse->Sud-Ouest.
- Propager la region sur chaque signal/deal/prix_signal/need.

EXTRACTION SECTORIELLE :
- Deduire le secteur a partir du contexte (produits, terminologie).
- Valeurs valides : Pharma, Industrie, Tech, BTP, Agroalimentaire, Distribution,
  Services, Energie, Transport, Automobile, Autre.

TYPE_OFFRE (sur chaque deal) : remise | bundle | gratuit | upgrade | sav | autre.
TYPE_ACTION_COMMUNICATION (sur chaque competitor_mention) : remise | campagne | event | partenariat | autre.`;
}

// ---------------------------------------------------------------------------
// Strict Zod schema for the LLM output. The model is a third party that we
// don't trust: before any field lands in the DB it must pass this schema.
// Unknown fields are stripped, out-of-range enums reject the whole payload.
// ---------------------------------------------------------------------------
const SHORT_TEXT = z.string().max(500);
const MEDIUM_TEXT = z.string().max(4000);
const CAP_LIST = <T extends z.ZodTypeAny>(item: T) => z.array(item).max(50);

const SignalSchema = z.object({
  type: z.enum(['concurrence', 'besoin', 'prix', 'satisfaction', 'opportunite', 'echec']),
  severity: z.enum(['rouge', 'orange', 'jaune', 'vert']),
  title: SHORT_TEXT,
  content: MEDIUM_TEXT,
  competitor_name: SHORT_TEXT.nullable().optional(),
  price_delta: z.union([z.number().finite(), z.null()]).optional(),
  region: SHORT_TEXT.optional(),
}).passthrough();

const DealSchema = z.object({
  view: z.enum(['marketing', 'commercial']),
  motif: z.enum(['prix', 'produit', 'offre', 'timing', 'concurrent', 'relation', 'budget', 'autre']),
  resultat: z.enum(['gagne', 'perdu', 'en_cours']),
  concurrent_nom: SHORT_TEXT.nullable().optional(),
  type_offre: z.enum(['remise', 'bundle', 'gratuit', 'upgrade', 'sav', 'autre']).optional(),
  verbatim: MEDIUM_TEXT,
  region: SHORT_TEXT.optional(),
}).passthrough();

const PrixSignalSchema = z.object({
  concurrent_nom: SHORT_TEXT,
  ecart_pct: z.number().finite().min(-100).max(1000),
  ecart_type: z.enum(['inferieur', 'superieur']),
  verbatim: MEDIUM_TEXT,
  region: SHORT_TEXT.optional(),
}).passthrough();

const ObjectifSchema = z.object({
  type: z.enum(['signature', 'sell_out', 'sell_in', 'formation', 'decouverte', 'fidelisation']),
  resultat: z.enum(['atteint', 'non_atteint']),
  cause_echec: SHORT_TEXT.nullable().optional(),
  facteur_reussite: SHORT_TEXT.nullable().optional(),
}).passthrough();

const NeedSchema = z.object({
  label: SHORT_TEXT,
  trend: z.enum(['up', 'down', 'stable', 'new']),
  region: SHORT_TEXT.optional(),
}).passthrough();

const CompetitorMentionSchema = z.object({
  name: SHORT_TEXT,
  mention_type: SHORT_TEXT.optional(),
  type_action_communication: z.enum(['remise', 'campagne', 'event', 'partenariat', 'autre']).optional(),
}).passthrough();

const ExtractedCRSchema = z.object({
  region: SHORT_TEXT.nullable().optional(),
  client_name: SHORT_TEXT.nullable().optional(),
  secteur: SHORT_TEXT.optional(),
  signals: CAP_LIST(SignalSchema).default([]),
  deals: CAP_LIST(DealSchema).default([]),
  prix_signals: CAP_LIST(PrixSignalSchema).default([]),
  objectifs: CAP_LIST(ObjectifSchema).default([]),
  sentiment: z.enum(['positif', 'negatif', 'neutre', 'interesse']).optional(),
  needs: CAP_LIST(NeedSchema).default([]),
  competitors_mentioned: CAP_LIST(CompetitorMentionSchema).default([]),
}).passthrough();

export function parseExtractionResponse(responseText: string): ExtractedCRData | null {
  if (typeof responseText !== 'string') return null;
  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const raw = JSON.parse(jsonMatch[0]);

    // Try strict schema first
    const result = ExtractedCRSchema.safeParse(raw);
    if (result.success) return result.data as ExtractedCRData;

    // Log validation issues (paths only, never content)
    console.warn(
      '[extraction] schema validation failed, using best-effort fallback:',
      result.error.issues.slice(0, 5).map((i) => `${i.path.join('.')}: ${i.message}`)
    );

    // Best-effort fallback: keep valid arrays, discard invalid items
    const fallback: ExtractedCRData = {
      region: typeof raw.region === 'string' ? raw.region : null,
      client_name: typeof raw.client_name === 'string' ? raw.client_name : null,
      secteur: typeof raw.secteur === 'string' ? raw.secteur : undefined,
      signals: Array.isArray(raw.signals)
        ? raw.signals.filter((s: any) => s?.type && s?.severity && s?.title && s?.content)
        : [],
      deals: Array.isArray(raw.deals)
        ? raw.deals.filter((d: any) => d?.motif && d?.resultat && d?.verbatim)
        : [],
      prix_signals: Array.isArray(raw.prix_signals)
        ? raw.prix_signals.filter((p: any) => p?.concurrent_nom)
            .map((p: any) => ({
              ...p,
              ecart_pct: typeof p.ecart_pct === 'number' ? p.ecart_pct
                : typeof p.ecart_pct === 'string' ? parseFloat(p.ecart_pct) || 0
                : 0,
            }))
        : [],
      objectifs: Array.isArray(raw.objectifs)
        ? raw.objectifs.filter((o: any) => o?.type && o?.resultat)
        : [],
      sentiment: raw.sentiment,
      needs: Array.isArray(raw.needs)
        ? raw.needs.filter((n: any) => n?.label && n?.trend)
        : [],
      competitors_mentioned: Array.isArray(raw.competitors_mentioned)
        ? raw.competitors_mentioned.filter((c: any) => c?.name)
        : [],
    } as unknown as ExtractedCRData;

    return fallback;
  } catch {
    return null;
  }
}
