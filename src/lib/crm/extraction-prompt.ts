// @ts-nocheck
// Prompt d'extraction enrichi (audit 2026-04-15) : region, secteur, type_offre,
// type_action_communication, equilibrage marketing/commercial et positif/negatif.
// Refonte 2026-05-04 : canonicalization concurrents, capture des prix concurrents
// sans comparaison explicite, table villes->regions etendue, account context.
import { z } from 'zod';
import type { ExtractedCRData } from './types';

// ---------------------------------------------------------------------------
// Input cap. A single CR of more than this many characters is almost
// certainly either a test payload or an attempt to exhaust tokens. Truncate
// silently to keep costs bounded.
// ---------------------------------------------------------------------------
const MAX_CR_INPUT_CHARS = 32_000;

// Hard cap on the company-supplied business context.
const MAX_BUSINESS_CONTEXT_CHARS = 4_000;

export interface AccountContext {
  /** Account name as known in the CRM (Salesforce Account.Name) */
  name?: string | null;
  /** Account billing city — used for region inference */
  city?: string | null;
  /** Account billing state / region — preferred over city */
  region?: string | null;
  /** Account industry, already mapped to internal sector enum */
  sector?: string | null;
}

export function buildExtractionPrompt(
  crText: string,
  knownCompetitors: string[],
  knownAbbreviations: { short: string; full: string }[],
  businessContext?: string | null,
  accountContext?: AccountContext | null,
): string {
  const safeCr =
    typeof crText === 'string'
      ? crText.length > MAX_CR_INPUT_CHARS
        ? crText.slice(0, MAX_CR_INPUT_CHARS) + '\n[... tronque]'
        : crText
      : '';
  const competitorsList =
    knownCompetitors.length > 0
      ? `Concurrents connus de cette entreprise (a utiliser comme noms canoniques) : ${knownCompetitors.join(', ')}`
      : 'Aucun concurrent connu pour le moment.';

  const abbrList =
    knownAbbreviations.length > 0
      ? `Abbreviations / glossaire (left=alias dans le CR, right=forme canonique a utiliser dans tes outputs) :\n${knownAbbreviations
          .map((a) => `  - ${a.short} = ${a.full}`)
          .join('\n')}`
      : '';

  const trimmedContext = (businessContext ?? '').trim();
  const safeContext =
    trimmedContext.length > MAX_BUSINESS_CONTEXT_CHARS
      ? trimmedContext.slice(0, MAX_BUSINESS_CONTEXT_CHARS) + '\n[... tronque]'
      : trimmedContext;

  const contextBlock = safeContext
    ? `CONTEXTE DE L'ENTREPRISE UTILISATRICE (a utiliser pour mieux interpreter le CR : secteur, produits, concurrents, jargon metier, KPIs prioritaires) :
"""
${safeContext}
"""

`
    : '';

  // Account context (city/region/sector) — quand le CR est rattache a un Account
  // dans le CRM, on remonte les meta-donnees du compte au prompt. Permet a l'IA
  // de fixer la region meme quand le CR ne mentionne pas la ville en clair.
  let accountBlock = '';
  if (accountContext && (accountContext.city || accountContext.region || accountContext.sector)) {
    const parts: string[] = [];
    if (accountContext.name) parts.push(`Compte CRM : ${accountContext.name}`);
    if (accountContext.city) parts.push(`Ville : ${accountContext.city}`);
    if (accountContext.region) parts.push(`Region (CRM) : ${accountContext.region}`);
    if (accountContext.sector) parts.push(`Secteur (CRM) : ${accountContext.sector}`);
    accountBlock = `CONTEXTE DU COMPTE CRM LIE A CE CR (priorite haute pour fixer region et secteur) :\n${parts.join('\n')}\n\n`;
  }

  return `Vous etes un expert francais en analyse de comptes rendus de visite commerciale.
Vous travaillez SIMULTANEMENT pour 3 personas qui consomment vos extractions :

  • RESPONSABLE MARKETING — cherche : positionnement, perception marque, segments
    actifs, campagnes/offres concurrentes, evolution des besoins clients, motifs
    marketing de gain/perte (offre, packaging, communication, image).
  • COMMERCIAL TERRAIN / KAM — cherche : sante du compte, signaux de churn,
    blockers, prochaines actions, citations exploitables pour la negociation,
    objectifs atteints/rates et leur cause.
  • DIRECTEUR COMMERCIAL — cherche : taux closing, deals gagnes/perdus avec
    motif commercial (timing, prix, relation, suivi), priorisation territoire,
    pression concurrentielle par region.

AVANT DE REPONDRE, fais cette verification mentale : un marketeur, un
commercial et un directeur commercial trouvent-ils CHACUN au moins UNE
information actionnable dans tes extractions ? Si non, relis le CR pour
extraire ce qui manque.

NE TE LIMITE PAS A DU SURFACE-LEVEL. Identifie les MOTS-CLES et phrases
qui ont du SENS METIER dans le contexte (ex. dans la pharma diabete :
"switch", "rotation", "PDM", "verrouillage contractuel", "bascule",
"capteur", "AF", "B7/K7/L7", "sell-out", "RFA", "groupement", "MDD",
"echantillonnage", "DASRI", "force de prescription"). Quand tu en
detectes, traite-les comme signaux a part entiere : c'est ce qui
distingue un CR de qualite 80 d'un CR de qualite 50.

Analysez ce compte-rendu et extrayez TOUTES les informations structurees
en JSON strict.

${contextBlock}${accountBlock}${competitorsList}

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
      "competitor_name": "nom CANONIQUE du concurrent (voir REGLE DE CANONICALISATION) ou null",
      "price_delta": "ecart prix en % ou null",
      "region": "region (heritee du CR si non specifique)"
    }
  ],
  "deals": [
    {
      "view": "marketing|commercial",
      "motif": "prix|produit|offre|timing|concurrent|relation|budget|autre",
      "resultat": "gagne|perdu|en_cours",
      "concurrent_nom": "nom CANONIQUE ou null",
      "type_offre": "remise|bundle|gratuit|upgrade|sav|autre",
      "verbatim": "extrait du CR",
      "region": "region (heritee du CR si non specifique)"
    }
  ],
  "prix_signals": [
    {
      "concurrent_nom": "nom CANONIQUE du concurrent",
      "ecart_pct": null,
      "ecart_type": null,
      "verbatim": "extrait du CR (citation EXACTE de la mention de prix/remise/offre concurrent)",
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
    { "label": "formulation concise du besoin exprime par le client", "trend": "up|down|stable|new", "region": "region" }
  ],
  "competitors_mentioned": [
    { "name": "nom CANONIQUE", "mention_type": "description courte", "type_action_communication": "remise|campagne|event|partenariat|autre" }
  ]
}

═════════════════════════════════════════════════════════════════════════════
REGLE DE CANONICALISATION DES NOMS DE CONCURRENTS — TRES IMPORTANTE
═════════════════════════════════════════════════════════════════════════════

Quand tu mentionnes un concurrent dans n'importe quel champ
(competitor_name, concurrent_nom, competitors_mentioned[].name), tu DOIS
utiliser le NOM CANONIQUE et UN SEUL nom canonique meme s'il est appelle
de plusieurs facons dans le CR ou la base.

Source de verite pour le nom canonique, dans cet ordre de priorite :

  1. Si le CR ou le contexte d'entreprise contient une ligne du type
     "Lifescan = OneTouch = LS"  ou  "Abbott = Freestyle = AbbVie",
     alors TOUS ces termes designent une SEULE entite. Le canonique est
     LE PREMIER terme de la ligne (ici "Lifescan", "Abbott").

  2. Si le terme apparait dans la liste "Concurrents connus" plus haut,
     utilise EXACTEMENT cette graphie comme canonique.

  3. Si le terme apparait dans le glossaire d'abbreviations sous forme
     "X = Y", utilise Y comme canonique.

  4. Sinon, choisis la forme la plus complete observee dans le CR
     (ex. "OneTouch Verio" plutot que "OneTouch", "FreeStyle Libre"
     plutot que "Abbott").

Exemples :
  - CR mentionne "Lifescan", "OneTouch" et "LS" pour la meme entite ?
    → Tu sors UN seul concurrent_name = "Lifescan" (ou la forme du
       contexte, peu importe laquelle, mais TOUJOURS la meme).
  - CR mentionne "BD" et "Becton Dickinson" pour la meme entite ?
    → Tu sors un seul concurrent_name = "BD" (le canonique connu).
  - Tu n'inventes JAMAIS un concurrent absent du CR.

Cette regle s'applique aussi a competitors_mentioned (pas de doublons :
si OneTouch et Lifescan sont la meme boite, une SEULE entree).

═════════════════════════════════════════════════════════════════════════════
EXTRACTION DES PRIX_SIGNALS — TRES IMPORTANTE
═════════════════════════════════════════════════════════════════════════════

prix_signals capture TOUTE mention de TARIFICATION concurrente, qu'elle
soit comparative ou non. INCLURE notamment :

  ✓ Comparaisons explicites : "Acme est 15% moins cher que nous" →
       ecart_pct=15, ecart_type="inferieur"
  ✓ Remises concurrents : "Lifescan fait -18% sur volume" →
       ecart_pct=18, ecart_type="inferieur" (la remise rapproche du concurrent)
  ✓ Prix absolus concurrent : "BD vend a 4€ net la boite" →
       ecart_pct=null, ecart_type=null, verbatim contient "4€ net"
  ✓ Offres promotionnelles : "Pic offre 5 boites + 1 gratuite" →
       ecart_pct=null, ecart_type=null, verbatim cite l'offre
  ✓ Marges : "Marque Verte garantit 40% de marge" →
       ecart_pct=null, ecart_type=null, verbatim cite la marge
  ✓ Vente flash, prix discount, contrat exclusif a tarif preferentiel.

Regles de remplissage :
  - concurrent_nom : OBLIGATOIRE, nom canonique du concurrent (voir regle
    canonicalisation). Si pas de concurrent identifiable, n'extrais PAS
    le prix_signal.
  - ecart_pct : nombre entier positif quand un % est cite, sinon null.
  - ecart_type : "inferieur" si la remise/prix concurrent est plus bas
    que le notre OU si le concurrent annonce une baisse, "superieur" si
    plus haut. null quand l'information ne permet pas de trancher.
  - verbatim : OBLIGATOIRE. Cite TEXTUELLEMENT la phrase du CR qui
    mentionne le prix/remise/offre.

NE PAS extraire de prix_signal pour les remises/marges sur NOTRE PROPRE
gamme (ce sont des deals, pas des signaux concurrents).

═════════════════════════════════════════════════════════════════════════════
REGLES GENERALES
═════════════════════════════════════════════════════════════════════════════

- Soyez conservateur : n'inventez pas d'information absente du CR.
- Si aucun signal d'un type, retournez un tableau vide.
- Le sentiment est une evaluation globale du ton du CR.
- Chaque deal detecte doit avoir un verbatim extrait directement du CR.

EQUILIBRAGE MARKETING/COMMERCIAL :
- Si un deal concerne le positionnement produit, l'offre/packaging, le canal
  de distribution, la communication/marque, l'image, la visibilite -> view="marketing".
- Sinon, view="commercial" (processus de vente, relation client, negociation,
  suivi, timing).
- Visez un equilibre realiste : ~30% des deals doivent etre "marketing"
  si les signaux le permettent.

EQUILIBRAGE POSITIF/NEGATIF :
- Meme dans les CRs positifs (deals gagnes, satisfaction), extraire les
  signaux verts (type=satisfaction, opportunite), les facteurs de succes,
  les innovations mentionnees.

═════════════════════════════════════════════════════════════════════════════
EXTRACTION GEOGRAPHIQUE (region) — table villes->regions etendue
═════════════════════════════════════════════════════════════════════════════

PRIORITE 1 : si le CONTEXTE DU COMPTE CRM (plus haut) donne une region
            ou une ville, utilise-la directement.
PRIORITE 2 : si le CR cite une ville, deduis la region :

  IDF       : Paris, Versailles, Saint-Denis, Boulogne, Nanterre, Saclay, Meudon,
              Vincennes, Creteil, Cergy, Saint-Germain-en-Laye, Issy
  Nord      : Lille, Roubaix, Tourcoing, Dunkerque, Arras, Calais, Valenciennes,
              Cambrai, Amiens, Beauvais
  Est       : Strasbourg, Metz, Nancy, Mulhouse, Reims, Troyes, Colmar, Belfort,
              Besancon, Dijon
  Nord-Est  : Charleville, Sedan, Verdun
  Ouest     : Nantes, Rennes, Brest, Lorient, Quimper, Vannes, Saint-Nazaire,
              Saint-Brieuc, Angers, Le Mans, Tours, Caen, Le Havre, Cherbourg,
              Rouen, Saint-Malo, La Rochelle, Niort, Poitiers
  Sud-Ouest : Bordeaux, Toulouse, Bayonne, Biarritz, Pau, Tarbes, Agen, Perigueux,
              Limoges, Brive
  Sud       : Marseille, Aix-en-Provence, Toulon, Cannes, Antibes, Nice, Avignon,
              Arles, Nimes, Montpellier, Beziers, Perpignan, Carcassonne
  Sud-Est   : Lyon, Saint-Etienne, Grenoble, Annecy, Chambery, Valence,
              Clermont-Ferrand, Saint-Chamond, Aurillac, Chamonix

- Si le CR cite plusieurs villes, choisir la principale (lieu du RDV).
- Si la region n'est pas determinable, mettre null.
- Propager la region sur chaque signal/deal/prix_signal/need.
- Si le CR ne mentionne aucune ville mais que le compte CRM en donne une,
  utilise celle-la.

═════════════════════════════════════════════════════════════════════════════
EXTRACTION SECTORIELLE
═════════════════════════════════════════════════════════════════════════════

- Deduire le secteur a partir du contexte (produits, terminologie).
- PRIORITE au secteur du compte CRM s'il est fourni (CONTEXTE DU COMPTE).
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

// Refonte 2026-05-04 : ecart_pct et ecart_type deviennent optionnels +
// nullables pour capturer les remises/offres/prix concurrents qui ne sont
// pas exprimes en comparaison directe. concurrent_nom et verbatim restent
// obligatoires : pas de prix_signal sans concurrent identifie ni citation.
const PrixSignalSchema = z.object({
  concurrent_nom: SHORT_TEXT,
  ecart_pct: z.union([z.number().finite().min(-100).max(1000), z.null()]).optional(),
  ecart_type: z.union([z.enum(['inferieur', 'superieur']), z.null()]).optional(),
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
        ? raw.prix_signals.filter((p: any) => p?.concurrent_nom && p?.verbatim)
            .map((p: any) => ({
              ...p,
              ecart_pct:
                typeof p.ecart_pct === 'number' ? p.ecart_pct
                : typeof p.ecart_pct === 'string' && !isNaN(parseFloat(p.ecart_pct)) ? parseFloat(p.ecart_pct)
                : null,
              ecart_type:
                p.ecart_type === 'inferieur' || p.ecart_type === 'superieur' ? p.ecart_type : null,
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
