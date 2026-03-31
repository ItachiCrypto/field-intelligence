// === V2 TYPES — Nouvelles fonctionnalites ===

// MKT-PRIX — Radar Prix Concurrentiels
export interface PrixSignal {
  id: string;
  concurrent_nom: string;
  ecart_pct: number;
  ecart_type: 'inferieur' | 'superieur';
  deal_id?: string;
  statut_deal: 'gagne' | 'perdu' | 'en_cours';
  commercial_name: string;
  client_name: string;
  region: string;
  date: string;
  verbatim: string;
}

export interface TendancePrixConcurrent {
  concurrent_nom: string;
  semaine: string;
  mentions: number;
  ecart_moyen: number;
  deals_perdus: number;
  deals_gagnes: number;
}

// MKT-DEAL — Deals Gagnes / Perdus
export type DealMotif = 'prix' | 'produit' | 'offre' | 'timing' | 'concurrent' | 'relation' | 'budget' | 'autre';

export interface DealAnalyse {
  id: string;
  motif_principal: DealMotif;
  motif_secondaire?: DealMotif;
  resultat: 'gagne' | 'perdu';
  valeur_eur: number;
  concurrent_nom?: string;
  commercial_name: string;
  client_name: string;
  secteur: string;
  region: string;
  date: string;
  verbatim?: string;
}

// MKT-OFFRE — Offres Concurrentes
export type OffreType = 'bundle' | 'promotion' | 'nouvelle_gamme' | 'conditions_paiement' | 'essai_gratuit' | 'autre';

export interface OffreConcurrente {
  id: string;
  concurrent_nom: string;
  type_offre: OffreType;
  description: string;
  date_premiere_mention: string;
  count_mentions: number;
  deals_impactes: number;
  deals_perdus: number;
  deals_gagnes: number;
  region: string;
  secteur: string;
  statut: 'active' | 'inactive';
}

// MKT-COMM — Communication Concurrente
export type CommType = 'salon' | 'pub' | 'emailing' | 'social' | 'presse' | 'sponsoring' | 'partenariat' | 'autre';
export type ReactionClient = 'positive' | 'neutre' | 'negative';

export interface CommConcurrente {
  id: string;
  concurrent_nom: string;
  type_action: CommType;
  description: string;
  reaction_client: ReactionClient;
  date: string;
  count_mentions: number;
  region: string;
}

// MKT-POS — Positionnement
export type Attribut = 'prix' | 'qualite' | 'sav' | 'delai' | 'relation' | 'innovation';
export type ValeurPercue = 'fort' | 'moyen' | 'faible';

export interface PositionnementData {
  acteur: string;
  attribut: Attribut;
  valeur: ValeurPercue;
  count: number;
}

// MKT-GEO — Analyse Sectorielle & Geographique
export interface GeoSectorCell {
  secteur: string;
  region: string;
  signaux_concurrence: number;
  signaux_besoins: number;
  signaux_opportunites: number;
  score_intensite: number;
}

// DIR-CLOS — Taux de Closing
export interface ClosingCommercial {
  commercial_id: string;
  commercial_name: string;
  mois: string;
  nb_rdv: number;
  nb_propositions: number;
  nb_closings: number;
  ca_signe_eur: number;
  objectif_mensuel_eur: number;
  taux_closing_pct: number;
}

export interface FunnelEtape {
  etape: string;
  count: number;
  valeur_eur: number;
}

// DIR-N1 — Evolution Clients
export interface EvolutionClient {
  client_id: string;
  client_name: string;
  commercial_name: string;
  score_actuel: number;
  score_precedent: number;
  delta: number;
  presence_concurrent_actuel: boolean;
  presence_concurrent_precedent: boolean;
  sentiment: 'positif' | 'neutre' | 'negatif';
  date_actuel: string;
  date_precedent: string;
}

// DIR-SEG — Segmentation
export type ClientSegment = 'nouveau' | 'etabli' | 'strategique';

export interface SegmentStats {
  segment: ClientSegment;
  count: number;
  ca_total: number;
  signaux_avg: number;
  risk_avg: number;
  churn_rate: number;
}

// DIR-LOST — Deals Perdus
export interface DealPerdu {
  id: string;
  commercial_name: string;
  client_name: string;
  valeur_eur: number;
  motif_principal: DealMotif;
  concurrent_retenu?: string;
  secteur: string;
  region: string;
  date: string;
  verbatim?: string;
}

// DIR-TERR — Carte Territoire
export interface TerritoireSynthese {
  territoire: string;
  commercial_names: string[];
  nb_opportunites: number;
  valeur_opportunites_eur: number;
  nb_clients_risque_rouge: number;
  nb_clients_risque_orange: number;
  nb_besoins_non_couverts: number;
  nb_signaux_concurrent: number;
  score_priorite: number;
}

// DIR-GEO — Heatmap Geo
export interface GeoPoint {
  region: string;
  dept?: string;
  opportunites: number;
  risques: number;
  concurrence: number;
  besoins: number;
  intensite: number;
}

// DIR-PRIOR — Priorisation IA
export interface RecommandationIA {
  id: string;
  type: 'opportunite' | 'risque' | 'territoire' | 'coaching';
  territoire: string;
  commercial_suggere: string;
  priorite: 1 | 2 | 3 | 4 | 5;
  action_recommandee: string;
  statut: 'nouvelle' | 'vue' | 'en_cours' | 'done';
}
