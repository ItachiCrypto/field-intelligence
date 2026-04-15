// === V2 TYPES — Toutes les donnees viennent des CR de visite (NLP) ===
// PAS de CA, PAS de valeur en euros, PAS de pipeline CRM

// MKT-PRIX — Radar Prix Concurrentiels
export interface PrixSignal {
  id: string;
  concurrent_nom: string;
  ecart_pct: number;
  ecart_type: 'inferieur' | 'superieur';
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

// MKT-DEAL + DIR-LOST — Deals Gagnes/Perdus (sans euros, bases sur CR)
export type DealMotif = 'prix' | 'produit' | 'offre' | 'timing' | 'concurrent' | 'relation' | 'budget' | 'autre';

export interface DealAnalyse {
  id: string;
  motif_principal: DealMotif;
  resultat: 'gagne' | 'perdu' | 'en_cours';
  concurrent_nom?: string;
  commercial_name: string;
  client_name: string;
  region: string;
  date: string;
  verbatim: string;
}

// Tendance deals par semaine
export interface DealTendanceSemaine {
  semaine: string;
  prix: number;
  produit: number;
  offre: number;
  timing: number;
  concurrent: number;
  relation: number;
  budget: number;
  autre: number;
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

// DIR-CLOS — Taux de Closing (base sur objectifs de visite, PAS sur CA)
export type ObjectifType = 'signature' | 'sell_out' | 'sell_in' | 'formation' | 'decouverte' | 'fidelisation';

export interface CRObjectif {
  id: string;
  commercial_id: string;
  commercial_name: string;
  client_name: string;
  objectif_type: ObjectifType;
  resultat: 'atteint' | 'non_atteint';
  cause_echec?: string;       // si non_atteint
  facteur_reussite?: string;  // si atteint
  date: string;
  region: string;
}

// Motifs commerciaux pour DIR-LOST (distincts des motifs marketing)
export type MotifCommercial = 'prix_non_competitif' | 'timing_rate' | 'concurrent_mieux_positionne' | 'relation_insuffisante' | 'besoin_mal_identifie' | 'suivi_insuffisant';

export interface DealCommercial {
  id: string;
  motif: MotifCommercial;
  resultat: 'gagne' | 'perdu' | 'en_cours';
  concurrent_nom?: string;
  commercial_name: string;
  client_name: string;
  region: string;
  date: string;
  verbatim: string;
}

export interface DealCommercialTendance {
  semaine: string;
  prix_non_competitif: number;
  timing_rate: number;
  concurrent_mieux_positionne: number;
  relation_insuffisante: number;
  besoin_mal_identifie: number;
  suivi_insuffisant: number;
}

export const MOTIF_COMMERCIAL_LABELS: Record<MotifCommercial, string> = {
  prix_non_competitif: 'Prix non competitif',
  timing_rate: 'Timing rate',
  concurrent_mieux_positionne: 'Concurrent mieux positionne',
  relation_insuffisante: 'Relation insuffisante',
  besoin_mal_identifie: 'Besoin mal identifie',
  suivi_insuffisant: 'Suivi commercial insuffisant',
};

export const MOTIF_COMMERCIAL_COLORS: Record<MotifCommercial, string> = {
  prix_non_competitif: '#e11d48',
  timing_rate: '#f59e0b',
  concurrent_mieux_positionne: '#ef4444',
  relation_insuffisante: '#8b5cf6',
  besoin_mal_identifie: '#0ea5e9',
  suivi_insuffisant: '#64748b',
};

// Motifs principaux du sentiment (pour MKT-SENTIMENT)
export interface MotifSentiment {
  motif: string;
  type: 'positif' | 'negatif';
  mentions: number;
}


// DIR-N1 — Vue de pilotage GLOBALE du sentiment client (pas individuel)
export type SentimentType = 'positif' | 'negatif' | 'neutre' | 'interesse';

export interface SentimentPeriode {
  periode: string; // "S11", "S12", etc. ou "Mars 2026"
  positif: number;
  negatif: number;
  neutre: number;
  interesse: number;
  total: number;
}

export interface SentimentRegion {
  region: string;
  positif: number;
  negatif: number;
  neutre: number;
  interesse: number;
  total: number;
}

// DIR-SEG — Segmentation Nouveaux vs Etablis (comparaison SENTIMENT, pas CA)
export type ClientSegment = 'nouveau' | 'etabli';

export interface SegmentSentiment {
  segment: ClientSegment;
  nb_cr: number;
  pct_positif: number;
  pct_negatif: number;
  pct_neutre: number;
  pct_interesse: number;
  top_insatisfactions: string[];
  top_points_positifs: string[];
}

// DIR-LOST — Deals Perdus (meme structure que DealAnalyse, filtre perdu)
// Reutilise DealAnalyse avec resultat='perdu'

// DIR-TERR — Carte Territoire (sans pipeline, sans euros)
export interface TerritoireSynthese {
  territoire: string;
  commercial_names: string[];
  nb_cr: number;
  sentiment_dominant: SentimentType;
  nb_mentions_concurrents: number;
  nb_opportunites: number;
  nb_risques_perte: number;
  tendance_vs_mois_precedent: 'hausse' | 'baisse' | 'stable';
  score_priorite: number;
  motifs_opportunite: string[];
  motifs_risque: string[];
}

// MKT-GEO — Profil par region (problematiques locales)
export interface RegionProfile {
  region: string;
  top_besoins: string[];
  concurrent_principal: string;
  concurrent_mentions: number;
  sentiment_dominant: SentimentType;
  specificite_locale: string;
  nb_signaux: number;
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

// Labels pour ObjectifType
export const OBJECTIF_LABELS: Record<ObjectifType, string> = {
  signature: 'Signature contrat',
  sell_out: 'Sell Out',
  sell_in: 'Sell In',
  formation: 'Formation',
  decouverte: 'Decouverte',
  fidelisation: 'Fidelisation',
};

// Labels pour DealMotif
export const MOTIF_LABELS: Record<DealMotif, string> = {
  prix: 'Prix',
  produit: 'Produit',
  offre: 'Offre',
  timing: 'Timing',
  concurrent: 'Concurrent retenu',
  relation: 'Relation',
  budget: 'Budget coupe',
  autre: 'Autre',
};

export const MOTIF_COLORS: Record<DealMotif, string> = {
  prix: '#e11d48',
  produit: '#0ea5e9',
  offre: '#8b5cf6',
  timing: '#f59e0b',
  concurrent: '#ef4444',
  relation: '#10b981',
  budget: '#64748b',
  autre: '#94a3b8',
};
