import {
  PrixSignal, TendancePrixConcurrent, DealAnalyse, OffreConcurrente,
  CommConcurrente, PositionnementData, GeoSectorCell,
  ClosingCommercial, FunnelEtape, EvolutionClient, SegmentStats,
  DealPerdu, TerritoireSynthese, GeoPoint, RecommandationIA,
} from './types-v2';

// === MKT-PRIX ===
export const PRIX_SIGNALS: PrixSignal[] = [
  { id: 'px-1', concurrent_nom: 'Acme', ecart_pct: -12, ecart_type: 'inferieur', statut_deal: 'perdu', commercial_name: 'Thomas D.', client_name: 'Dupont Industries', region: 'Nord', date: '2026-03-29', verbatim: 'Acme propose 12% moins cher sur la gamme standard' },
  { id: 'px-2', concurrent_nom: 'Acme', ecart_pct: -15, ecart_type: 'inferieur', statut_deal: 'perdu', commercial_name: 'Maxime R.', client_name: 'MetalPro', region: 'Nord', date: '2026-03-28', verbatim: 'Acme a sorti un tarif a -15% avec engagement 2 ans' },
  { id: 'px-3', concurrent_nom: 'Bexor', ecart_pct: -8, ecart_type: 'inferieur', statut_deal: 'en_cours', commercial_name: 'Antoine G.', client_name: 'SudFrance Logistique', region: 'Sud-Ouest', date: '2026-03-27', verbatim: 'Bexor affiche -8% sur le bundle produit+service' },
  { id: 'px-4', concurrent_nom: 'TechPro', ecart_pct: 5, ecart_type: 'superieur', statut_deal: 'gagne', commercial_name: 'Emma V.', client_name: 'BioSante Plus', region: 'IDF', date: '2026-03-26', verbatim: 'TechPro 5% plus cher, client revient chez nous pour le SAV' },
  { id: 'px-5', concurrent_nom: 'Acme', ecart_pct: -10, ecart_type: 'inferieur', statut_deal: 'en_cours', commercial_name: 'Sarah R.', client_name: 'Groupe Mercier', region: 'Nord', date: '2026-03-25', verbatim: 'Acme propose -10% sur commande immediate' },
  { id: 'px-6', concurrent_nom: 'Proxio', ecart_pct: -5, ecart_type: 'inferieur', statut_deal: 'gagne', commercial_name: 'Clara S.', client_name: 'Transco Group', region: 'IDF', date: '2026-03-24', verbatim: 'Proxio -5% mais client prefere notre SAV' },
  { id: 'px-7', concurrent_nom: 'Bexor', ecart_pct: -18, ecart_type: 'inferieur', statut_deal: 'perdu', commercial_name: 'Hugo T.', client_name: 'Atelier Central', region: 'Nord-Est', date: '2026-03-22', verbatim: 'Bundle Bexor imbattable -18% sur le package complet' },
  { id: 'px-8', concurrent_nom: 'Acme', ecart_pct: -12, ecart_type: 'inferieur', statut_deal: 'perdu', commercial_name: 'Lucas M.', client_name: 'Horizon Distribution', region: 'Est', date: '2026-03-20', verbatim: 'Client a signe chez Acme pour le prix, -12% sur 3 ans' },
];

export const TENDANCE_PRIX: TendancePrixConcurrent[] = [
  { concurrent_nom: 'Acme', semaine: 'S11', mentions: 8, ecart_moyen: -11, deals_perdus: 2, deals_gagnes: 1 },
  { concurrent_nom: 'Acme', semaine: 'S12', mentions: 12, ecart_moyen: -13, deals_perdus: 3, deals_gagnes: 0 },
  { concurrent_nom: 'Acme', semaine: 'S13', mentions: 10, ecart_moyen: -12, deals_perdus: 2, deals_gagnes: 1 },
  { concurrent_nom: 'Acme', semaine: 'S14', mentions: 15, ecart_moyen: -14, deals_perdus: 4, deals_gagnes: 0 },
  { concurrent_nom: 'Bexor', semaine: 'S11', mentions: 3, ecart_moyen: -7, deals_perdus: 1, deals_gagnes: 0 },
  { concurrent_nom: 'Bexor', semaine: 'S12', mentions: 5, ecart_moyen: -9, deals_perdus: 1, deals_gagnes: 1 },
  { concurrent_nom: 'Bexor', semaine: 'S13', mentions: 6, ecart_moyen: -12, deals_perdus: 2, deals_gagnes: 0 },
  { concurrent_nom: 'Bexor', semaine: 'S14', mentions: 8, ecart_moyen: -15, deals_perdus: 2, deals_gagnes: 0 },
  { concurrent_nom: 'TechPro', semaine: 'S11', mentions: 4, ecart_moyen: 3, deals_perdus: 0, deals_gagnes: 2 },
  { concurrent_nom: 'TechPro', semaine: 'S12', mentions: 3, ecart_moyen: 5, deals_perdus: 0, deals_gagnes: 1 },
  { concurrent_nom: 'TechPro', semaine: 'S13', mentions: 2, ecart_moyen: 4, deals_perdus: 0, deals_gagnes: 2 },
  { concurrent_nom: 'TechPro', semaine: 'S14', mentions: 3, ecart_moyen: 5, deals_perdus: 0, deals_gagnes: 1 },
  { concurrent_nom: 'Proxio', semaine: 'S11', mentions: 2, ecart_moyen: -4, deals_perdus: 0, deals_gagnes: 1 },
  { concurrent_nom: 'Proxio', semaine: 'S12', mentions: 3, ecart_moyen: -5, deals_perdus: 1, deals_gagnes: 1 },
  { concurrent_nom: 'Proxio', semaine: 'S13', mentions: 2, ecart_moyen: -3, deals_perdus: 0, deals_gagnes: 2 },
  { concurrent_nom: 'Proxio', semaine: 'S14', mentions: 4, ecart_moyen: -5, deals_perdus: 1, deals_gagnes: 1 },
];

// === MKT-DEAL ===
export const DEALS_ANALYSE: DealAnalyse[] = [
  { id: 'd-1', motif_principal: 'prix', resultat: 'perdu', valeur_eur: 45000, concurrent_nom: 'Acme', commercial_name: 'Thomas D.', client_name: 'Dupont Industries', secteur: 'Industrie', region: 'Nord', date: '2026-03-28' },
  { id: 'd-2', motif_principal: 'relation', resultat: 'gagne', valeur_eur: 82000, commercial_name: 'Emma V.', client_name: 'BioSante Plus', secteur: 'Sante', region: 'IDF', date: '2026-03-27' },
  { id: 'd-3', motif_principal: 'produit', resultat: 'perdu', valeur_eur: 35000, concurrent_nom: 'Bexor', commercial_name: 'Antoine G.', client_name: 'SudFrance Logistique', secteur: 'Logistique', region: 'Sud-Ouest', date: '2026-03-25' },
  { id: 'd-4', motif_principal: 'prix', resultat: 'perdu', valeur_eur: 120000, concurrent_nom: 'Acme', commercial_name: 'Lucas M.', client_name: 'Horizon Distribution', secteur: 'Distribution', region: 'Est', date: '2026-03-22' },
  { id: 'd-5', motif_principal: 'timing', resultat: 'perdu', valeur_eur: 28000, commercial_name: 'Hugo T.', client_name: 'NovaTech', secteur: 'Tech', region: 'Sud-Ouest', date: '2026-03-20' },
  { id: 'd-6', motif_principal: 'relation', resultat: 'gagne', valeur_eur: 56000, commercial_name: 'Clara S.', client_name: 'Transco Group', secteur: 'Transport', region: 'IDF', date: '2026-03-19' },
  { id: 'd-7', motif_principal: 'concurrent', resultat: 'perdu', valeur_eur: 67000, concurrent_nom: 'Bexor', commercial_name: 'Camille P.', client_name: 'Atelier Central', secteur: 'Industrie', region: 'Nord-Est', date: '2026-03-18' },
  { id: 'd-8', motif_principal: 'prix', resultat: 'gagne', valeur_eur: 95000, commercial_name: 'Sarah R.', client_name: 'Groupe Mercier', secteur: 'Distribution', region: 'Nord', date: '2026-03-15' },
  { id: 'd-9', motif_principal: 'budget', resultat: 'perdu', valeur_eur: 42000, commercial_name: 'Marc D.', client_name: 'EcoVert Services', secteur: 'Services', region: 'Ouest', date: '2026-03-12' },
  { id: 'd-10', motif_principal: 'produit', resultat: 'gagne', valeur_eur: 73000, commercial_name: 'Lea F.', client_name: 'LogiPro SAS', secteur: 'Logistique', region: 'Est', date: '2026-03-10' },
  { id: 'd-11', motif_principal: 'prix', resultat: 'perdu', valeur_eur: 38000, concurrent_nom: 'Proxio', commercial_name: 'Nathan B.', client_name: 'MecanoParts', secteur: 'Industrie', region: 'Sud', date: '2026-03-08' },
  { id: 'd-12', motif_principal: 'offre', resultat: 'perdu', valeur_eur: 55000, concurrent_nom: 'Bexor', commercial_name: 'Ines D.', client_name: 'AlphaLogistics', secteur: 'Logistique', region: 'Sud-Ouest', date: '2026-03-05' },
];

// === MKT-OFFRE ===
export const OFFRES_CONCURRENTES: OffreConcurrente[] = [
  { id: 'of-1', concurrent_nom: 'Acme', type_offre: 'promotion', description: 'Remise -15% avec engagement 2 ans sur gamme B', date_premiere_mention: '2026-02-15', count_mentions: 12, deals_impactes: 8, deals_perdus: 4, deals_gagnes: 1, region: 'National', secteur: 'Industrie', statut: 'active' },
  { id: 'of-2', concurrent_nom: 'Bexor', type_offre: 'bundle', description: 'Bundle produit + maintenance 3 ans incluse', date_premiere_mention: '2026-03-01', count_mentions: 8, deals_impactes: 5, deals_perdus: 3, deals_gagnes: 0, region: 'Sud-Ouest', secteur: 'Multi', statut: 'active' },
  { id: 'of-3', concurrent_nom: 'TechPro', type_offre: 'essai_gratuit', description: 'Essai 3 mois gratuit sur solution premium', date_premiere_mention: '2026-01-20', count_mentions: 6, deals_impactes: 3, deals_perdus: 1, deals_gagnes: 2, region: 'Est', secteur: 'Tech', statut: 'active' },
  { id: 'of-4', concurrent_nom: 'Proxio', type_offre: 'conditions_paiement', description: 'Paiement en 12x sans frais sur tout le catalogue', date_premiere_mention: '2026-02-01', count_mentions: 5, deals_impactes: 4, deals_perdus: 1, deals_gagnes: 2, region: 'National', secteur: 'Distribution', statut: 'active' },
  { id: 'of-5', concurrent_nom: 'Acme', type_offre: 'nouvelle_gamme', description: 'Lancement gamme Eco a prix casse', date_premiere_mention: '2026-03-10', count_mentions: 4, deals_impactes: 2, deals_perdus: 1, deals_gagnes: 0, region: 'Nord', secteur: 'Industrie', statut: 'active' },
];

// === MKT-COMM ===
export const COMM_CONCURRENTES: CommConcurrente[] = [
  { id: 'cc-1', concurrent_nom: 'Acme', type_action: 'salon', description: 'Grand stand au salon Industrie Paris 2026', reaction_client: 'positive', date: '2026-03-15', count_mentions: 7, region: 'IDF' },
  { id: 'cc-2', concurrent_nom: 'Bexor', type_action: 'emailing', description: 'Campagne email agressive sur base prospects Sud-Ouest', reaction_client: 'neutre', date: '2026-03-20', count_mentions: 5, region: 'Sud-Ouest' },
  { id: 'cc-3', concurrent_nom: 'TechPro', type_action: 'pub', description: 'Publicite LinkedIn ciblee sur DG et DAF', reaction_client: 'positive', date: '2026-03-10', count_mentions: 4, region: 'National' },
  { id: 'cc-4', concurrent_nom: 'Proxio', type_action: 'partenariat', description: 'Partenariat annonce avec leader ERP du secteur', reaction_client: 'positive', date: '2026-03-05', count_mentions: 3, region: 'National' },
  { id: 'cc-5', concurrent_nom: 'Acme', type_action: 'presse', description: 'Article presse specialisee sur leur croissance 2025', reaction_client: 'neutre', date: '2026-02-28', count_mentions: 2, region: 'National' },
];

// === MKT-POS ===
export const POSITIONNEMENT: PositionnementData[] = [
  { acteur: 'Nous', attribut: 'sav', valeur: 'fort', count: 45 },
  { acteur: 'Nous', attribut: 'qualite', valeur: 'fort', count: 38 },
  { acteur: 'Nous', attribut: 'relation', valeur: 'fort', count: 42 },
  { acteur: 'Nous', attribut: 'prix', valeur: 'moyen', count: 30 },
  { acteur: 'Nous', attribut: 'delai', valeur: 'moyen', count: 22 },
  { acteur: 'Nous', attribut: 'innovation', valeur: 'moyen', count: 18 },
  { acteur: 'Acme', attribut: 'prix', valeur: 'fort', count: 52 },
  { acteur: 'Acme', attribut: 'innovation', valeur: 'fort', count: 28 },
  { acteur: 'Acme', attribut: 'qualite', valeur: 'moyen', count: 20 },
  { acteur: 'Acme', attribut: 'sav', valeur: 'faible', count: 35 },
  { acteur: 'Acme', attribut: 'relation', valeur: 'faible', count: 15 },
  { acteur: 'Acme', attribut: 'delai', valeur: 'moyen', count: 18 },
  { acteur: 'Bexor', attribut: 'prix', valeur: 'fort', count: 30 },
  { acteur: 'Bexor', attribut: 'delai', valeur: 'fort', count: 22 },
  { acteur: 'Bexor', attribut: 'qualite', valeur: 'faible', count: 12 },
  { acteur: 'Bexor', attribut: 'sav', valeur: 'moyen', count: 10 },
  { acteur: 'Bexor', attribut: 'innovation', valeur: 'moyen', count: 8 },
  { acteur: 'Bexor', attribut: 'relation', valeur: 'faible', count: 6 },
];

// === MKT-GEO ===
export const GEO_SECTOR_DATA: GeoSectorCell[] = [
  { secteur: 'Industrie', region: 'Nord', signaux_concurrence: 22, signaux_besoins: 15, signaux_opportunites: 8, score_intensite: 85 },
  { secteur: 'Distribution', region: 'Nord', signaux_concurrence: 18, signaux_besoins: 12, signaux_opportunites: 6, score_intensite: 72 },
  { secteur: 'Industrie', region: 'Est', signaux_concurrence: 14, signaux_besoins: 10, signaux_opportunites: 5, score_intensite: 65 },
  { secteur: 'Logistique', region: 'Sud-Ouest', signaux_concurrence: 16, signaux_besoins: 8, signaux_opportunites: 4, score_intensite: 60 },
  { secteur: 'Tech', region: 'IDF', signaux_concurrence: 10, signaux_besoins: 14, signaux_opportunites: 9, score_intensite: 70 },
  { secteur: 'Sante', region: 'IDF', signaux_concurrence: 5, signaux_besoins: 8, signaux_opportunites: 6, score_intensite: 45 },
  { secteur: 'Transport', region: 'IDF', signaux_concurrence: 8, signaux_besoins: 6, signaux_opportunites: 3, score_intensite: 40 },
  { secteur: 'Services', region: 'Ouest', signaux_concurrence: 4, signaux_besoins: 10, signaux_opportunites: 5, score_intensite: 38 },
  { secteur: 'Industrie', region: 'Nord-Est', signaux_concurrence: 12, signaux_besoins: 7, signaux_opportunites: 4, score_intensite: 55 },
  { secteur: 'Distribution', region: 'Est', signaux_concurrence: 9, signaux_besoins: 11, signaux_opportunites: 7, score_intensite: 58 },
];

// === DIR-CLOS ===
export const CLOSING_DATA: ClosingCommercial[] = [
  { commercial_id: 'com-1', commercial_name: 'Thomas D.', mois: '2026-03', nb_rdv: 48, nb_propositions: 18, nb_closings: 12, ca_signe_eur: 285000, objectif_mensuel_eur: 300000, taux_closing_pct: 67 },
  { commercial_id: 'com-2', commercial_name: 'Sarah R.', mois: '2026-03', nb_rdv: 42, nb_propositions: 15, nb_closings: 10, ca_signe_eur: 220000, objectif_mensuel_eur: 250000, taux_closing_pct: 67 },
  { commercial_id: 'com-7', commercial_name: 'Emma V.', mois: '2026-03', nb_rdv: 45, nb_propositions: 20, nb_closings: 14, ca_signe_eur: 340000, objectif_mensuel_eur: 280000, taux_closing_pct: 70 },
  { commercial_id: 'com-13', commercial_name: 'Clara S.', mois: '2026-03', nb_rdv: 50, nb_propositions: 22, nb_closings: 15, ca_signe_eur: 380000, objectif_mensuel_eur: 350000, taux_closing_pct: 68 },
  { commercial_id: 'com-6', commercial_name: 'Lucas M.', mois: '2026-03', nb_rdv: 38, nb_propositions: 12, nb_closings: 7, ca_signe_eur: 165000, objectif_mensuel_eur: 250000, taux_closing_pct: 58 },
  { commercial_id: 'com-4', commercial_name: 'Marc D.', mois: '2026-03', nb_rdv: 35, nb_propositions: 14, nb_closings: 9, ca_signe_eur: 195000, objectif_mensuel_eur: 220000, taux_closing_pct: 64 },
  { commercial_id: 'com-5', commercial_name: 'Pierre B.', mois: '2026-03', nb_rdv: 22, nb_propositions: 8, nb_closings: 3, ca_signe_eur: 78000, objectif_mensuel_eur: 200000, taux_closing_pct: 38 },
  { commercial_id: 'com-8', commercial_name: 'Antoine G.', mois: '2026-03', nb_rdv: 30, nb_propositions: 10, nb_closings: 5, ca_signe_eur: 125000, objectif_mensuel_eur: 200000, taux_closing_pct: 50 },
];

export const FUNNEL_DATA: FunnelEtape[] = [
  { etape: 'RDV realises', count: 310, valeur_eur: 4800000 },
  { etape: 'Propositions', count: 119, valeur_eur: 3200000 },
  { etape: 'Negociation', count: 68, valeur_eur: 2100000 },
  { etape: 'Closing', count: 75, valeur_eur: 1788000 },
];

// === DIR-N1 ===
export const EVOLUTION_CLIENTS: EvolutionClient[] = [
  { client_id: 'acc-1', client_name: 'Dupont Industries', commercial_name: 'Thomas D.', score_actuel: 35, score_precedent: 72, delta: -37, presence_concurrent_actuel: true, presence_concurrent_precedent: false, sentiment: 'negatif', date_actuel: '2026-03-29', date_precedent: '2025-09-15' },
  { client_id: 'acc-2', client_name: 'Groupe Mercier', commercial_name: 'Sarah R.', score_actuel: 45, score_precedent: 68, delta: -23, presence_concurrent_actuel: true, presence_concurrent_precedent: false, sentiment: 'negatif', date_actuel: '2026-03-22', date_precedent: '2025-10-01' },
  { client_id: 'acc-4', client_name: 'Bertrand & Fils', commercial_name: 'Marc D.', score_actuel: 88, score_precedent: 82, delta: 6, presence_concurrent_actuel: false, presence_concurrent_precedent: false, sentiment: 'positif', date_actuel: '2026-03-28', date_precedent: '2025-11-20' },
  { client_id: 'acc-3', client_name: 'Horizon Distribution', commercial_name: 'Lucas M.', score_actuel: 55, score_precedent: 60, delta: -5, presence_concurrent_actuel: true, presence_concurrent_precedent: true, sentiment: 'neutre', date_actuel: '2026-03-15', date_precedent: '2025-09-28' },
  { client_id: 'acc-6', client_name: 'Transco Group', commercial_name: 'Clara S.', score_actuel: 78, score_precedent: 65, delta: 13, presence_concurrent_actuel: false, presence_concurrent_precedent: true, sentiment: 'positif', date_actuel: '2026-03-24', date_precedent: '2025-12-10' },
  { client_id: 'acc-7', client_name: 'NovaTech', commercial_name: 'Antoine G.', score_actuel: 82, score_precedent: 80, delta: 2, presence_concurrent_actuel: false, presence_concurrent_precedent: false, sentiment: 'positif', date_actuel: '2026-03-26', date_precedent: '2026-01-05' },
  { client_id: 'acc-5', client_name: 'LogiPro SAS', commercial_name: 'Lea F.', score_actuel: 70, score_precedent: 55, delta: 15, presence_concurrent_actuel: false, presence_concurrent_precedent: true, sentiment: 'positif', date_actuel: '2026-03-19', date_precedent: '2025-10-22' },
  { client_id: 'acc-8', client_name: 'Atelier Central', commercial_name: 'Camille P.', score_actuel: 50, score_precedent: 62, delta: -12, presence_concurrent_actuel: true, presence_concurrent_precedent: false, sentiment: 'negatif', date_actuel: '2026-03-21', date_precedent: '2025-11-15' },
];

// === DIR-SEG ===
export const SEGMENT_STATS: SegmentStats[] = [
  { segment: 'nouveau', count: 3, ca_total: 730000, signaux_avg: 1.2, risk_avg: 35, churn_rate: 12 },
  { segment: 'etabli', count: 6, ca_total: 2870000, signaux_avg: 2.1, risk_avg: 42, churn_rate: 8 },
  { segment: 'strategique', count: 3, ca_total: 2500000, signaux_avg: 3.5, risk_avg: 55, churn_rate: 5 },
];

// === DIR-LOST ===
export const DEALS_PERDUS: DealPerdu[] = [
  { id: 'dp-1', commercial_name: 'Thomas D.', client_name: 'Dupont Industries', valeur_eur: 45000, motif_principal: 'prix', concurrent_retenu: 'Acme', secteur: 'Industrie', region: 'Nord', date: '2026-03-28', verbatim: 'Trop cher de 12% face a Acme' },
  { id: 'dp-2', commercial_name: 'Lucas M.', client_name: 'Horizon Distribution', valeur_eur: 120000, motif_principal: 'prix', concurrent_retenu: 'Acme', secteur: 'Distribution', region: 'Est', date: '2026-03-22', verbatim: 'Engagement prix 3 ans impossible a matcher' },
  { id: 'dp-3', commercial_name: 'Antoine G.', client_name: 'SudFrance Logistique', valeur_eur: 35000, motif_principal: 'produit', concurrent_retenu: 'Bexor', secteur: 'Logistique', region: 'Sud-Ouest', date: '2026-03-25', verbatim: 'Bundle Bexor plus adapte a leur besoin specifique' },
  { id: 'dp-4', commercial_name: 'Hugo T.', client_name: 'NovaTech', valeur_eur: 28000, motif_principal: 'timing', secteur: 'Tech', region: 'Sud-Ouest', date: '2026-03-20', verbatim: 'Projet reporte au Q3 — budget gele' },
  { id: 'dp-5', commercial_name: 'Camille P.', client_name: 'Atelier Central', valeur_eur: 67000, motif_principal: 'concurrent', concurrent_retenu: 'Bexor', secteur: 'Industrie', region: 'Nord-Est', date: '2026-03-18', verbatim: 'Bexor a propose ouverture site gratuite' },
  { id: 'dp-6', commercial_name: 'Nathan B.', client_name: 'MecanoParts', valeur_eur: 38000, motif_principal: 'prix', concurrent_retenu: 'Proxio', secteur: 'Industrie', region: 'Sud', date: '2026-03-08', verbatim: 'Proxio moins cher de 5% sur catalogue standard' },
  { id: 'dp-7', commercial_name: 'Ines D.', client_name: 'AlphaLogistics', valeur_eur: 55000, motif_principal: 'offre', concurrent_retenu: 'Bexor', secteur: 'Logistique', region: 'Sud-Ouest', date: '2026-03-05', verbatim: 'Offre Bexor trop complete — maintenance incluse' },
  { id: 'dp-8', commercial_name: 'Marc D.', client_name: 'EcoVert Services', valeur_eur: 42000, motif_principal: 'budget', secteur: 'Services', region: 'Ouest', date: '2026-03-12', verbatim: 'Budget coupe par la direction — projet annule' },
];

// === DIR-TERR ===
export const TERRITOIRES: TerritoireSynthese[] = [
  { territoire: 'Nord', commercial_names: ['Thomas D.', 'Sarah R.', 'Maxime R.', 'Manon A.'], nb_opportunites: 5, valeur_opportunites_eur: 380000, nb_clients_risque_rouge: 2, nb_clients_risque_orange: 3, nb_besoins_non_couverts: 8, nb_signaux_concurrent: 22, score_priorite: 92 },
  { territoire: 'Sud-Ouest', commercial_names: ['Antoine G.', 'Ines D.', 'Theo N.'], nb_opportunites: 3, valeur_opportunites_eur: 210000, nb_clients_risque_rouge: 1, nb_clients_risque_orange: 2, nb_besoins_non_couverts: 5, nb_signaux_concurrent: 16, score_priorite: 78 },
  { territoire: 'Est', commercial_names: ['Lucas M.', 'Lea F.', 'Jade W.', 'Raphael C.'], nb_opportunites: 4, valeur_opportunites_eur: 290000, nb_clients_risque_rouge: 1, nb_clients_risque_orange: 2, nb_besoins_non_couverts: 6, nb_signaux_concurrent: 14, score_priorite: 72 },
  { territoire: 'IDF', commercial_names: ['Julie L.', 'Emma V.', 'Clara S.', 'Zoe H.'], nb_opportunites: 6, valeur_opportunites_eur: 520000, nb_clients_risque_rouge: 0, nb_clients_risque_orange: 1, nb_besoins_non_couverts: 4, nb_signaux_concurrent: 10, score_priorite: 65 },
  { territoire: 'Nord-Est', commercial_names: ['Camille P.', 'Ethan K.', 'Alice M.'], nb_opportunites: 2, valeur_opportunites_eur: 150000, nb_clients_risque_rouge: 1, nb_clients_risque_orange: 1, nb_besoins_non_couverts: 3, nb_signaux_concurrent: 12, score_priorite: 58 },
  { territoire: 'Ouest', commercial_names: ['Marc D.', 'Hugo T.', 'Gabriel L.'], nb_opportunites: 2, valeur_opportunites_eur: 120000, nb_clients_risque_rouge: 0, nb_clients_risque_orange: 1, nb_besoins_non_couverts: 4, nb_signaux_concurrent: 4, score_priorite: 35 },
  { territoire: 'Sud', commercial_names: ['Pierre B.', 'Nathan B.', 'Louis J.'], nb_opportunites: 1, valeur_opportunites_eur: 85000, nb_clients_risque_rouge: 0, nb_clients_risque_orange: 2, nb_besoins_non_couverts: 3, nb_signaux_concurrent: 6, score_priorite: 42 },
];

// === DIR-GEO ===
export const GEO_POINTS: GeoPoint[] = [
  { region: 'Nord', opportunites: 5, risques: 5, concurrence: 22, besoins: 15, intensite: 92 },
  { region: 'IDF', opportunites: 6, risques: 1, concurrence: 10, besoins: 14, intensite: 65 },
  { region: 'Est', opportunites: 4, risques: 3, concurrence: 14, besoins: 10, intensite: 72 },
  { region: 'Sud-Ouest', opportunites: 3, risques: 3, concurrence: 16, besoins: 8, intensite: 78 },
  { region: 'Nord-Est', opportunites: 2, risques: 2, concurrence: 12, besoins: 7, intensite: 58 },
  { region: 'Ouest', opportunites: 2, risques: 1, concurrence: 4, besoins: 10, intensite: 35 },
  { region: 'Sud', opportunites: 1, risques: 2, concurrence: 6, besoins: 5, intensite: 42 },
];

// === DIR-PRIOR ===
export const RECOMMANDATIONS_IA: RecommandationIA[] = [
  { id: 'rec-1', type: 'risque', territoire: 'Nord', commercial_suggere: 'Thomas D.', priorite: 1, action_recommandee: 'RDV urgent Dupont Industries — Acme en test actif depuis 2 mois. Proposer offre de retention avec avantage SAV premium.', statut: 'nouvelle' },
  { id: 'rec-2', type: 'opportunite', territoire: 'IDF', commercial_suggere: 'Emma V.', priorite: 2, action_recommandee: 'Relancer BioSante Plus — 520K EUR d\'opportunites actives en IDF. Proposer demo gamme Pro.', statut: 'nouvelle' },
  { id: 'rec-3', type: 'territoire', territoire: 'Sud-Ouest', commercial_suggere: 'Antoine G.', priorite: 1, action_recommandee: 'Renforcer presence Sud-Ouest — Bexor en demarchage agressif. Planifier 5 visites clients strategiques cette semaine.', statut: 'vue' },
  { id: 'rec-4', type: 'coaching', territoire: 'Sud', commercial_suggere: 'Pierre B.', priorite: 3, action_recommandee: 'Session coaching Pierre B. — taux closing 38% (equipe: 62%). Analyser pipeline et technique de closing.', statut: 'nouvelle' },
  { id: 'rec-5', type: 'risque', territoire: 'Nord', commercial_suggere: 'Sarah R.', priorite: 2, action_recommandee: 'Groupe Mercier en regression — score satisfaction -23pts. Organiser revue de compte avec KAM.', statut: 'en_cours' },
  { id: 'rec-6', type: 'opportunite', territoire: 'Nord-Est', commercial_suggere: 'Camille P.', priorite: 3, action_recommandee: 'Atelier Central ouvre nouveau site en mai — budget 80K EUR. Preparer proposition equipement complet.', statut: 'nouvelle' },
];
