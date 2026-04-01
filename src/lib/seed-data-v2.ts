import {
  PrixSignal, TendancePrixConcurrent, DealAnalyse, DealTendanceSemaine,
  OffreConcurrente, CommConcurrente, PositionnementData, GeoSectorCell,
  CRObjectif, SentimentPeriode, SentimentRegion, SegmentSentiment,
  TerritoireSynthese, GeoPoint, RecommandationIA,
  DealCommercial, DealCommercialTendance, MotifSentiment,
  RegionProfile,
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

// === MKT-DEAL + DIR-LOST — Deals (sans euros) ===
export const DEALS_ANALYSE: DealAnalyse[] = [
  { id: 'd-1', motif_principal: 'prix', resultat: 'perdu', concurrent_nom: 'Acme', commercial_name: 'Thomas D.', client_name: 'Dupont Industries', region: 'Nord', date: '2026-03-28', verbatim: 'Client a choisi Acme car 12% moins cher sur la gamme standard' },
  { id: 'd-2', motif_principal: 'relation', resultat: 'gagne', commercial_name: 'Emma V.', client_name: 'BioSante Plus', region: 'IDF', date: '2026-03-27', verbatim: 'Relation de confiance avec le DG — renouvellement sans appel d\'offres' },
  { id: 'd-3', motif_principal: 'produit', resultat: 'perdu', concurrent_nom: 'Bexor', commercial_name: 'Antoine G.', client_name: 'SudFrance Logistique', region: 'Sud-Ouest', date: '2026-03-25', verbatim: 'Bexor propose un bundle produit+maintenance plus adapte a leur usage' },
  { id: 'd-4', motif_principal: 'prix', resultat: 'perdu', concurrent_nom: 'Acme', commercial_name: 'Lucas M.', client_name: 'Horizon Distribution', region: 'Est', date: '2026-03-22', verbatim: 'Impossible de matcher le prix Acme, engagement 3 ans trop contraignant' },
  { id: 'd-5', motif_principal: 'timing', resultat: 'perdu', commercial_name: 'Hugo T.', client_name: 'NovaTech', region: 'Sud-Ouest', date: '2026-03-20', verbatim: 'Projet reporte au Q3, budget gele par la direction' },
  { id: 'd-6', motif_principal: 'relation', resultat: 'gagne', commercial_name: 'Clara S.', client_name: 'Transco Group', region: 'IDF', date: '2026-03-19', verbatim: 'Le client valorise notre reactivite et la qualite du suivi commercial' },
  { id: 'd-7', motif_principal: 'concurrent', resultat: 'perdu', concurrent_nom: 'Bexor', commercial_name: 'Camille P.', client_name: 'Atelier Central', region: 'Nord-Est', date: '2026-03-18', verbatim: 'Bexor a offert l\'installation gratuite du nouveau site' },
  { id: 'd-8', motif_principal: 'prix', resultat: 'gagne', commercial_name: 'Sarah R.', client_name: 'Groupe Mercier', region: 'Nord', date: '2026-03-15', verbatim: 'Notre offre prix alignee + SAV premium a fait la difference' },
  { id: 'd-9', motif_principal: 'budget', resultat: 'perdu', commercial_name: 'Marc D.', client_name: 'EcoVert Services', region: 'Ouest', date: '2026-03-12', verbatim: 'Budget supprime par la direction generale — projet annule' },
  { id: 'd-10', motif_principal: 'produit', resultat: 'gagne', commercial_name: 'Lea F.', client_name: 'LogiPro SAS', region: 'Est', date: '2026-03-10', verbatim: 'Notre gamme repond exactement au cahier des charges technique' },
  { id: 'd-11', motif_principal: 'prix', resultat: 'perdu', concurrent_nom: 'Proxio', commercial_name: 'Nathan B.', client_name: 'MecanoParts', region: 'Sud', date: '2026-03-08', verbatim: 'Proxio 5% moins cher sur le catalogue standard' },
  { id: 'd-12', motif_principal: 'offre', resultat: 'perdu', concurrent_nom: 'Bexor', commercial_name: 'Ines D.', client_name: 'AlphaLogistics', region: 'Sud-Ouest', date: '2026-03-05', verbatim: 'Offre Bexor tout inclus — maintenance + formation + installation' },
  { id: 'd-13', motif_principal: 'relation', resultat: 'gagne', commercial_name: 'Alice M.', client_name: 'TechnoPlus', region: 'Nord-Est', date: '2026-03-04', verbatim: 'Confiance etablie depuis 2 ans, le client ne veut pas changer' },
  { id: 'd-14', motif_principal: 'timing', resultat: 'perdu', commercial_name: 'Gabriel L.', client_name: 'OmegaCorp', region: 'Ouest', date: '2026-03-02', verbatim: 'Arrive trop tard, le concurrent avait deja signe la semaine derniere' },
];

export const DEAL_TENDANCE: DealTendanceSemaine[] = [
  { semaine: 'S11', prix: 2, produit: 1, offre: 0, timing: 0, concurrent: 1, relation: 0, budget: 1, autre: 0 },
  { semaine: 'S12', prix: 3, produit: 0, offre: 1, timing: 1, concurrent: 0, relation: 0, budget: 0, autre: 0 },
  { semaine: 'S13', prix: 2, produit: 1, offre: 0, timing: 1, concurrent: 1, relation: 0, budget: 1, autre: 0 },
  { semaine: 'S14', prix: 4, produit: 1, offre: 1, timing: 0, concurrent: 1, relation: 0, budget: 0, autre: 0 },
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

// === DIR-CLOS — Objectifs de visite avec causes/facteurs ===
export const CR_OBJECTIFS: CRObjectif[] = [
  { id: 'cr-1', commercial_id: 'com-1', commercial_name: 'Thomas D.', client_name: 'Dupont Industries', objectif_type: 'signature', resultat: 'atteint', facteur_reussite: 'Relation de confiance', date: '2026-03-29', region: 'Nord' },
  { id: 'cr-2', commercial_id: 'com-1', commercial_name: 'Thomas D.', client_name: 'MetalPro', objectif_type: 'sell_in', resultat: 'atteint', facteur_reussite: 'Produit adapte', date: '2026-03-28', region: 'Nord' },
  { id: 'cr-3', commercial_id: 'com-1', commercial_name: 'Thomas D.', client_name: 'Groupe Mercier', objectif_type: 'fidelisation', resultat: 'non_atteint', cause_echec: 'Concurrent deja en place', date: '2026-03-27', region: 'Nord' },
  { id: 'cr-4', commercial_id: 'com-7', commercial_name: 'Emma V.', client_name: 'BioSante Plus', objectif_type: 'signature', resultat: 'atteint', facteur_reussite: 'Besoin urgent client', date: '2026-03-29', region: 'IDF' },
  { id: 'cr-5', commercial_id: 'com-7', commercial_name: 'Emma V.', client_name: 'Transco Group', objectif_type: 'sell_out', resultat: 'atteint', facteur_reussite: 'Prix competitif', date: '2026-03-28', region: 'IDF' },
  { id: 'cr-6', commercial_id: 'com-7', commercial_name: 'Emma V.', client_name: 'NewCorp', objectif_type: 'decouverte', resultat: 'atteint', facteur_reussite: 'Relation de confiance', date: '2026-03-26', region: 'IDF' },
  { id: 'cr-7', commercial_id: 'com-13', commercial_name: 'Clara S.', client_name: 'Transco Group', objectif_type: 'sell_out', resultat: 'atteint', facteur_reussite: 'Produit adapte', date: '2026-03-28', region: 'IDF' },
  { id: 'cr-8', commercial_id: 'com-13', commercial_name: 'Clara S.', client_name: 'BioSante Plus', objectif_type: 'formation', resultat: 'atteint', facteur_reussite: 'Relation de confiance', date: '2026-03-27', region: 'IDF' },
  { id: 'cr-9', commercial_id: 'com-13', commercial_name: 'Clara S.', client_name: 'TechCom', objectif_type: 'signature', resultat: 'non_atteint', cause_echec: 'Client pas interesse', date: '2026-03-25', region: 'IDF' },
  { id: 'cr-10', commercial_id: 'com-6', commercial_name: 'Lucas M.', client_name: 'Horizon Distribution', objectif_type: 'sell_in', resultat: 'non_atteint', cause_echec: 'Timing mauvais', date: '2026-03-28', region: 'Est' },
  { id: 'cr-11', commercial_id: 'com-6', commercial_name: 'Lucas M.', client_name: 'LogiPro SAS', objectif_type: 'fidelisation', resultat: 'atteint', facteur_reussite: 'Relation de confiance', date: '2026-03-26', region: 'Est' },
  { id: 'cr-12', commercial_id: 'com-6', commercial_name: 'Lucas M.', client_name: 'EstParts', objectif_type: 'decouverte', resultat: 'non_atteint', cause_echec: 'Produit pas adapte', date: '2026-03-24', region: 'Est' },
  { id: 'cr-13', commercial_id: 'com-5', commercial_name: 'Pierre B.', client_name: 'MecanoParts', objectif_type: 'sell_out', resultat: 'non_atteint', cause_echec: 'Client pas interesse', date: '2026-03-29', region: 'Sud' },
  { id: 'cr-14', commercial_id: 'com-5', commercial_name: 'Pierre B.', client_name: 'SudTech', objectif_type: 'signature', resultat: 'non_atteint', cause_echec: 'Concurrent deja en place', date: '2026-03-27', region: 'Sud' },
  { id: 'cr-15', commercial_id: 'com-5', commercial_name: 'Pierre B.', client_name: 'EcoVert Services', objectif_type: 'decouverte', resultat: 'non_atteint', cause_echec: 'Timing mauvais', date: '2026-03-25', region: 'Sud' },
  { id: 'cr-16', commercial_id: 'com-8', commercial_name: 'Antoine G.', client_name: 'SudFrance Logistique', objectif_type: 'sell_in', resultat: 'atteint', facteur_reussite: 'Prix competitif', date: '2026-03-28', region: 'Sud-Ouest' },
  { id: 'cr-17', commercial_id: 'com-8', commercial_name: 'Antoine G.', client_name: 'NovaTech', objectif_type: 'formation', resultat: 'atteint', facteur_reussite: 'Besoin urgent client', date: '2026-03-26', region: 'Sud-Ouest' },
  { id: 'cr-18', commercial_id: 'com-8', commercial_name: 'Antoine G.', client_name: 'AlphaLogistics', objectif_type: 'signature', resultat: 'non_atteint', cause_echec: 'Produit pas adapte', date: '2026-03-24', region: 'Sud-Ouest' },
  { id: 'cr-19', commercial_id: 'com-4', commercial_name: 'Marc D.', client_name: 'Bertrand & Fils', objectif_type: 'fidelisation', resultat: 'atteint', facteur_reussite: 'Relation de confiance', date: '2026-03-29', region: 'Ouest' },
  { id: 'cr-20', commercial_id: 'com-4', commercial_name: 'Marc D.', client_name: 'OmegaCorp', objectif_type: 'sell_out', resultat: 'atteint', facteur_reussite: 'Produit adapte', date: '2026-03-27', region: 'Ouest' },
  { id: 'cr-21', commercial_id: 'com-2', commercial_name: 'Sarah R.', client_name: 'Groupe Mercier', objectif_type: 'sell_in', resultat: 'atteint', facteur_reussite: 'Prix competitif', date: '2026-03-28', region: 'Nord' },
  { id: 'cr-22', commercial_id: 'com-2', commercial_name: 'Sarah R.', client_name: 'NordParts', objectif_type: 'decouverte', resultat: 'atteint', facteur_reussite: 'Besoin urgent client', date: '2026-03-26', region: 'Nord' },
  { id: 'cr-23', commercial_id: 'com-2', commercial_name: 'Sarah R.', client_name: 'MetalPro', objectif_type: 'signature', resultat: 'non_atteint', cause_echec: 'Client pas interesse', date: '2026-03-24', region: 'Nord' },
  { id: 'cr-24', commercial_id: 'com-9', commercial_name: 'Camille P.', client_name: 'Atelier Central', objectif_type: 'sell_in', resultat: 'non_atteint', cause_echec: 'Concurrent deja en place', date: '2026-03-28', region: 'Nord-Est' },
  { id: 'cr-25', commercial_id: 'com-9', commercial_name: 'Camille P.', client_name: 'NordEst Indus', objectif_type: 'formation', resultat: 'atteint', facteur_reussite: 'Produit adapte', date: '2026-03-26', region: 'Nord-Est' },
];

// === DIR-N1 — Sentiment global par periode ===
export const SENTIMENT_PERIODES: SentimentPeriode[] = [
  { periode: 'S11', positif: 28, negatif: 12, neutre: 18, interesse: 8, total: 66 },
  { periode: 'S12', positif: 25, negatif: 15, neutre: 20, interesse: 10, total: 70 },
  { periode: 'S13', positif: 30, negatif: 14, neutre: 16, interesse: 12, total: 72 },
  { periode: 'S14', positif: 32, negatif: 18, neutre: 15, interesse: 9, total: 74 },
];

export const SENTIMENT_PERIODE_PRECEDENTE: SentimentPeriode = {
  periode: 'Mois precedent', positif: 95, negatif: 38, neutre: 60, interesse: 30, total: 223,
};
export const SENTIMENT_PERIODE_ACTUELLE: SentimentPeriode = {
  periode: 'Mois actuel', positif: 115, negatif: 59, neutre: 69, interesse: 39, total: 282,
};

export const SENTIMENT_REGIONS: SentimentRegion[] = [
  { region: 'Nord', positif: 25, negatif: 18, neutre: 12, interesse: 8, total: 63 },
  { region: 'IDF', positif: 30, negatif: 8, neutre: 15, interesse: 12, total: 65 },
  { region: 'Est', positif: 18, negatif: 12, neutre: 10, interesse: 6, total: 46 },
  { region: 'Sud-Ouest', positif: 12, negatif: 14, neutre: 8, interesse: 5, total: 39 },
  { region: 'Nord-Est', positif: 10, negatif: 4, neutre: 8, interesse: 3, total: 25 },
  { region: 'Ouest', positif: 12, negatif: 2, neutre: 10, interesse: 4, total: 28 },
  { region: 'Sud', positif: 8, negatif: 1, neutre: 6, interesse: 1, total: 16 },
];

// === DIR-SEG — Sentiment par segment ===
export const SEGMENT_SENTIMENTS: SegmentSentiment[] = [
  {
    segment: 'nouveau',
    nb_cr: 85,
    pct_positif: 35,
    pct_negatif: 28,
    pct_neutre: 22,
    pct_interesse: 15,
    top_insatisfactions: ['Prix trop eleve', 'Manque d\'information produit', 'Delai de reponse trop long'],
    top_points_positifs: ['Qualite produit reconnue', 'Accueil commercial', 'Premiere impression positive'],
  },
  {
    segment: 'etabli',
    nb_cr: 197,
    pct_positif: 52,
    pct_negatif: 18,
    pct_neutre: 20,
    pct_interesse: 10,
    top_insatisfactions: ['SAV peu reactif', 'Manque de visite terrain', 'Concurrents plus agressifs sur le prix'],
    top_points_positifs: ['Relation de confiance', 'SAV quand il repond', 'Stabilite de la qualite'],
  },
];

export const SEGMENT_INSIGHTS: string[] = [
  'Les nouveaux clients sont 2x plus sensibles au prix que les clients etablis',
  'Le taux d\'interet est 50% plus eleve chez les nouveaux clients — levier de conversion fort',
  'Les clients etablis mentionnent 3x plus souvent la concurrence — risque de churn a surveiller',
  'Le SAV est le 1er motif d\'insatisfaction chez les etablis mais absent chez les nouveaux',
];

// === DIR-TERR — Territoires avec motifs strategiques ===
export const TERRITOIRES: TerritoireSynthese[] = [
  { territoire: 'Nord', commercial_names: ['Thomas D.', 'Sarah R.', 'Maxime R.', 'Manon A.'], nb_cr: 85, sentiment_dominant: 'negatif', nb_mentions_concurrents: 22, nb_opportunites: 5, nb_risques_perte: 5, tendance_vs_mois_precedent: 'hausse', score_priorite: 92, motifs_opportunite: ['Client interesse par gamme Pro', 'Nouveau besoin formation technique', 'Demande de solution integree'], motifs_risque: ['Acme agressif sur le prix -12%', 'Client menace de changer de fournisseur', 'Insatisfaction delai livraison recurrente'] },
  { territoire: 'Sud-Ouest', commercial_names: ['Antoine G.', 'Ines D.', 'Theo N.'], nb_cr: 52, sentiment_dominant: 'negatif', nb_mentions_concurrents: 16, nb_opportunites: 3, nb_risques_perte: 3, tendance_vs_mois_precedent: 'hausse', score_priorite: 78, motifs_opportunite: ['Ouverture nouveau site client en mai', 'Besoin equipement complet'], motifs_risque: ['Bexor en demarchage agressif avec bundle', 'Prix non competitif face aux offres locales', 'Manque de presence terrain'] },
  { territoire: 'Est', commercial_names: ['Lucas M.', 'Lea F.', 'Jade W.', 'Raphael C.'], nb_cr: 68, sentiment_dominant: 'neutre', nb_mentions_concurrents: 14, nb_opportunites: 4, nb_risques_perte: 3, tendance_vs_mois_precedent: 'stable', score_priorite: 72, motifs_opportunite: ['Appel d\'offres 200K detecte', 'Client interesse par API ERP', 'Renouvellement contrats Q2'], motifs_risque: ['Concurrent TechPro en reconquete', 'Insatisfaction stock et disponibilite', 'Nouveau decideur non rencontre'] },
  { territoire: 'IDF', commercial_names: ['Julie L.', 'Emma V.', 'Clara S.', 'Zoe H.'], nb_cr: 78, sentiment_dominant: 'positif', nb_mentions_concurrents: 10, nb_opportunites: 6, nb_risques_perte: 1, tendance_vs_mois_precedent: 'baisse', score_priorite: 45, motifs_opportunite: ['Fort interet pour demo gamme Pro', 'Besoin catalogue numerique', 'Upsell detecte sur 3 comptes', 'Client pret a recommander'], motifs_risque: ['Proxio detecte sur 2 comptes'] },
  { territoire: 'Nord-Est', commercial_names: ['Camille P.', 'Ethan K.', 'Alice M.'], nb_cr: 42, sentiment_dominant: 'neutre', nb_mentions_concurrents: 12, nb_opportunites: 2, nb_risques_perte: 2, tendance_vs_mois_precedent: 'stable', score_priorite: 58, motifs_opportunite: ['Nouveau site Atelier Central — budget equipement', 'Client interesse par formation'], motifs_risque: ['Proxio present au salon regional', 'Bexor en prospection active'] },
  { territoire: 'Ouest', commercial_names: ['Marc D.', 'Hugo T.', 'Gabriel L.'], nb_cr: 38, sentiment_dominant: 'positif', nb_mentions_concurrents: 4, nb_opportunites: 2, nb_risques_perte: 1, tendance_vs_mois_precedent: 'baisse', score_priorite: 35, motifs_opportunite: ['Renouvellement anticipe Bertrand', 'Demande commande en ligne'], motifs_risque: ['Budget coupe chez EcoVert'] },
  { territoire: 'Sud', commercial_names: ['Pierre B.', 'Nathan B.', 'Louis J.'], nb_cr: 28, sentiment_dominant: 'neutre', nb_mentions_concurrents: 6, nb_opportunites: 1, nb_risques_perte: 2, tendance_vs_mois_precedent: 'stable', score_priorite: 42, motifs_opportunite: ['Besoin formation produit detecte'], motifs_risque: ['Proxio moins cher sur catalogue', 'Faible frequence de visite terrain'] },
];

// === MKT-GEO — Profils regionaux (problematiques locales) ===
export const REGION_PROFILES: RegionProfile[] = [
  { region: 'Nord', top_besoins: ['Delais de livraison plus courts', 'Remise sur volume', 'SAV plus reactif'], concurrent_principal: 'Acme', concurrent_mentions: 22, sentiment_dominant: 'negatif', specificite_locale: 'Forte sensibilite aux delais — la logistique industrielle exige du J+2 maximum', nb_signaux: 85 },
  { region: 'IDF', top_besoins: ['Catalogue numerique', 'Integration API ERP', 'Formation produit'], concurrent_principal: 'Proxio', concurrent_mentions: 10, sentiment_dominant: 'positif', specificite_locale: 'Demande technologique forte — clients attendent des outils digitaux et self-service', nb_signaux: 78 },
  { region: 'Est', top_besoins: ['Disponibilite stock', 'Integration ERP SAP', 'Livraison express'], concurrent_principal: 'TechPro', concurrent_mentions: 14, sentiment_dominant: 'neutre', specificite_locale: 'Tissu industriel dense — les clients comparent systematiquement 3+ fournisseurs', nb_signaux: 68 },
  { region: 'Sud-Ouest', top_besoins: ['Prix competitif', 'Bundle produit+service', 'Accompagnement terrain'], concurrent_principal: 'Bexor', concurrent_mentions: 16, sentiment_dominant: 'negatif', specificite_locale: 'Marche tres sensible au prix — les bundles tout-inclus font la difference', nb_signaux: 52 },
  { region: 'Nord-Est', top_besoins: ['Formation technique', 'SAV reactif', 'Conditions de paiement'], concurrent_principal: 'Proxio', concurrent_mentions: 12, sentiment_dominant: 'neutre', specificite_locale: 'Concurrence locale forte via salons regionaux — presence terrain essentielle', nb_signaux: 42 },
  { region: 'Ouest', top_besoins: ['Commande en ligne', 'Reactivite SAV', 'Suivi commercial regulier'], concurrent_principal: 'Proxio', concurrent_mentions: 4, sentiment_dominant: 'positif', specificite_locale: 'Clients fideles mais attendent un canal de commande digital', nb_signaux: 38 },
  { region: 'Sud', top_besoins: ['Prix competitif', 'Formation produit', 'Frequence de visite'], concurrent_principal: 'Proxio', concurrent_mentions: 6, sentiment_dominant: 'neutre', specificite_locale: 'Territoire sous-visite — les clients se plaignent du manque de presence commerciale', nb_signaux: 28 },
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
  { id: 'rec-2', type: 'opportunite', territoire: 'IDF', commercial_suggere: 'Emma V.', priorite: 2, action_recommandee: 'Relancer BioSante Plus — fort interet detecte dans les CR. Proposer demo gamme Pro.', statut: 'nouvelle' },
  { id: 'rec-3', type: 'territoire', territoire: 'Sud-Ouest', commercial_suggere: 'Antoine G.', priorite: 1, action_recommandee: 'Renforcer presence Sud-Ouest — Bexor en demarchage agressif. Planifier 5 visites clients strategiques cette semaine.', statut: 'vue' },
  { id: 'rec-4', type: 'coaching', territoire: 'Sud', commercial_suggere: 'Pierre B.', priorite: 3, action_recommandee: 'Session coaching Pierre B. — taux reussite objectifs 0% ce mois. Analyser approche et technique.', statut: 'nouvelle' },
  { id: 'rec-5', type: 'risque', territoire: 'Nord', commercial_suggere: 'Sarah R.', priorite: 2, action_recommandee: 'Groupe Mercier — sentiment negatif croissant dans les CR. Organiser revue de compte avec KAM.', statut: 'en_cours' },
  { id: 'rec-6', type: 'opportunite', territoire: 'Nord-Est', commercial_suggere: 'Camille P.', priorite: 3, action_recommandee: 'Atelier Central ouvre nouveau site en mai. Preparer proposition equipement complet.', statut: 'nouvelle' },
];

// === DIR-LOST — Deals avec motifs commerciaux ===
export const DEALS_COMMERCIAUX: DealCommercial[] = [
  { id: 'dc-1', motif: 'prix_non_competitif', resultat: 'perdu', concurrent_nom: 'Acme', commercial_name: 'Thomas D.', client_name: 'Dupont Industries', region: 'Nord', date: '2026-03-28', verbatim: 'Notre tarif 12% au-dessus, pas de marge de negociation possible' },
  { id: 'dc-2', motif: 'relation_insuffisante', resultat: 'gagne', commercial_name: 'Emma V.', client_name: 'BioSante Plus', region: 'IDF', date: '2026-03-27', verbatim: 'Suivi regulier et reactivite ont fait la difference face au concurrent' },
  { id: 'dc-3', motif: 'besoin_mal_identifie', resultat: 'perdu', concurrent_nom: 'Bexor', commercial_name: 'Antoine G.', client_name: 'SudFrance Logistique', region: 'Sud-Ouest', date: '2026-03-25', verbatim: 'On a propose la mauvaise gamme, Bexor avait mieux compris le besoin' },
  { id: 'dc-4', motif: 'prix_non_competitif', resultat: 'perdu', concurrent_nom: 'Acme', commercial_name: 'Lucas M.', client_name: 'Horizon Distribution', region: 'Est', date: '2026-03-22', verbatim: 'Ecart de prix trop important, le client ne pouvait pas justifier' },
  { id: 'dc-5', motif: 'timing_rate', resultat: 'perdu', commercial_name: 'Hugo T.', client_name: 'NovaTech', region: 'Sud-Ouest', date: '2026-03-20', verbatim: 'Arrivee trop tard dans le cycle de decision, concurrent avait deja signe' },
  { id: 'dc-6', motif: 'relation_insuffisante', resultat: 'gagne', commercial_name: 'Clara S.', client_name: 'Transco Group', region: 'IDF', date: '2026-03-19', verbatim: 'Visites regulieres et accompagnement technique apprecies' },
  { id: 'dc-7', motif: 'concurrent_mieux_positionne', resultat: 'perdu', concurrent_nom: 'Bexor', commercial_name: 'Camille P.', client_name: 'Atelier Central', region: 'Nord-Est', date: '2026-03-18', verbatim: 'Bexor propose installation gratuite et formation sur site' },
  { id: 'dc-8', motif: 'prix_non_competitif', resultat: 'gagne', commercial_name: 'Sarah R.', client_name: 'Groupe Mercier', region: 'Nord', date: '2026-03-15', verbatim: 'Alignement prix + engagement SAV premium ont convaincu' },
  { id: 'dc-9', motif: 'suivi_insuffisant', resultat: 'perdu', commercial_name: 'Pierre B.', client_name: 'MecanoParts', region: 'Sud', date: '2026-03-12', verbatim: 'Client se plaint de ne jamais avoir de nouvelles entre les visites' },
  { id: 'dc-10', motif: 'besoin_mal_identifie', resultat: 'gagne', commercial_name: 'Lea F.', client_name: 'LogiPro SAS', region: 'Est', date: '2026-03-10', verbatim: 'Deuxieme visite avec le bon diagnostic technique, client convaincu' },
  { id: 'dc-11', motif: 'concurrent_mieux_positionne', resultat: 'perdu', concurrent_nom: 'Proxio', commercial_name: 'Nathan B.', client_name: 'SudTech', region: 'Sud', date: '2026-03-08', verbatim: 'Proxio a un partenariat ERP qui nous manque' },
  { id: 'dc-12', motif: 'timing_rate', resultat: 'perdu', commercial_name: 'Gabriel L.', client_name: 'OmegaCorp', region: 'Ouest', date: '2026-03-02', verbatim: 'Budget deja alloue au T1, devra attendre T3' },
  { id: 'dc-13', motif: 'suivi_insuffisant', resultat: 'gagne', commercial_name: 'Alice M.', client_name: 'TechnoPlus', region: 'Nord-Est', date: '2026-03-04', verbatim: 'Apres mise en place suivi hebdo, le client a renouvele sa confiance' },
  { id: 'dc-14', motif: 'prix_non_competitif', resultat: 'perdu', concurrent_nom: 'Acme', commercial_name: 'Maxime R.', client_name: 'MetalPro', region: 'Nord', date: '2026-03-01', verbatim: 'Acme -15% sur 2 ans, impossible de s\'aligner' },
];

export const DEAL_COMMERCIAL_TENDANCE: DealCommercialTendance[] = [
  { semaine: 'S11', prix_non_competitif: 2, timing_rate: 1, concurrent_mieux_positionne: 0, relation_insuffisante: 1, besoin_mal_identifie: 0, suivi_insuffisant: 1 },
  { semaine: 'S12', prix_non_competitif: 3, timing_rate: 0, concurrent_mieux_positionne: 1, relation_insuffisante: 0, besoin_mal_identifie: 1, suivi_insuffisant: 0 },
  { semaine: 'S13', prix_non_competitif: 2, timing_rate: 1, concurrent_mieux_positionne: 1, relation_insuffisante: 0, besoin_mal_identifie: 0, suivi_insuffisant: 1 },
  { semaine: 'S14', prix_non_competitif: 4, timing_rate: 0, concurrent_mieux_positionne: 1, relation_insuffisante: 0, besoin_mal_identifie: 1, suivi_insuffisant: 0 },
];

// === MKT-SENTIMENT — Motifs principaux du sentiment ===
export const MOTIFS_SENTIMENT: MotifSentiment[] = [
  { motif: 'Qualite produit reconnue', type: 'positif', mentions: 42 },
  { motif: 'Relation commerciale de confiance', type: 'positif', mentions: 38 },
  { motif: 'Reactivite SAV', type: 'positif', mentions: 28 },
  { motif: 'Prix competitif', type: 'positif', mentions: 22 },
  { motif: 'Prix trop eleve', type: 'negatif', mentions: 35 },
  { motif: 'Delais de livraison', type: 'negatif', mentions: 28 },
  { motif: 'SAV peu reactif', type: 'negatif', mentions: 22 },
  { motif: 'Manque de visite terrain', type: 'negatif', mentions: 18 },
];
