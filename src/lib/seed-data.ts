import { Signal, Account, Alert, Commercial, Competitor, NeedItem, Contact, User } from './types';

// --- USERS ---
export const DEMO_USERS: Record<string, User> = {
  marketing: { id: 'u-mkt-1', name: 'Sophie Laurent', email: 'sophie@field-intel.com', role: 'marketing', company_id: 'c1' },
  kam: { id: 'u-kam-1', name: 'Thomas Moreau', email: 'thomas@field-intel.com', role: 'kam', company_id: 'c1' },
  dirco: { id: 'u-dir-1', name: 'Philippe Durand', email: 'philippe@field-intel.com', role: 'dirco', company_id: 'c1' },
};

// --- COMMERCIAUX ---
export const COMMERCIALS: Commercial[] = [
  { id: 'com-1', name: 'Thomas D.', region: 'Nord', cr_week: 12, quality_score: 95, quality_trend: 3, useful_signals: 8, active_alerts: 0 },
  { id: 'com-2', name: 'Sarah R.', region: 'Nord', cr_week: 11, quality_score: 88, quality_trend: 2, useful_signals: 6, active_alerts: 1 },
  { id: 'com-3', name: 'Julie L.', region: 'IDF', cr_week: 9, quality_score: 82, quality_trend: -1, useful_signals: 5, active_alerts: 0 },
  { id: 'com-4', name: 'Marc D.', region: 'Ouest', cr_week: 8, quality_score: 78, quality_trend: 4, useful_signals: 4, active_alerts: 0 },
  { id: 'com-5', name: 'Pierre B.', region: 'Sud', cr_week: 5, quality_score: 51, quality_trend: -12, useful_signals: 1, active_alerts: 0 },
  { id: 'com-6', name: 'Lucas M.', region: 'Est', cr_week: 10, quality_score: 84, quality_trend: 1, useful_signals: 5, active_alerts: 2 },
  { id: 'com-7', name: 'Emma V.', region: 'IDF', cr_week: 11, quality_score: 91, quality_trend: 5, useful_signals: 7, active_alerts: 0 },
  { id: 'com-8', name: 'Antoine G.', region: 'Sud-Ouest', cr_week: 7, quality_score: 65, quality_trend: -5, useful_signals: 2, active_alerts: 1 },
  { id: 'com-9', name: 'Camille P.', region: 'Nord-Est', cr_week: 9, quality_score: 76, quality_trend: 0, useful_signals: 4, active_alerts: 0 },
  { id: 'com-10', name: 'Hugo T.', region: 'Ouest', cr_week: 6, quality_score: 58, quality_trend: -8, useful_signals: 2, active_alerts: 1 },
  { id: 'com-11', name: 'Léa F.', region: 'Est', cr_week: 10, quality_score: 86, quality_trend: 3, useful_signals: 6, active_alerts: 0 },
  { id: 'com-12', name: 'Nathan B.', region: 'Sud', cr_week: 8, quality_score: 72, quality_trend: -2, useful_signals: 3, active_alerts: 0 },
  { id: 'com-13', name: 'Clara S.', region: 'IDF', cr_week: 12, quality_score: 93, quality_trend: 1, useful_signals: 8, active_alerts: 0 },
  { id: 'com-14', name: 'Maxime R.', region: 'Nord', cr_week: 10, quality_score: 80, quality_trend: 2, useful_signals: 5, active_alerts: 0 },
  { id: 'com-15', name: 'Inès D.', region: 'Sud-Ouest', cr_week: 7, quality_score: 69, quality_trend: -3, useful_signals: 3, active_alerts: 0 },
  { id: 'com-16', name: 'Raphaël C.', region: 'Est', cr_week: 9, quality_score: 77, quality_trend: 1, useful_signals: 4, active_alerts: 0 },
  { id: 'com-17', name: 'Alice M.', region: 'Nord-Est', cr_week: 11, quality_score: 89, quality_trend: 4, useful_signals: 6, active_alerts: 0 },
  { id: 'com-18', name: 'Gabriel L.', region: 'Ouest', cr_week: 8, quality_score: 74, quality_trend: 0, useful_signals: 3, active_alerts: 1 },
  { id: 'com-19', name: 'Zoé H.', region: 'IDF', cr_week: 10, quality_score: 85, quality_trend: 2, useful_signals: 5, active_alerts: 0 },
  { id: 'com-20', name: 'Louis J.', region: 'Sud', cr_week: 6, quality_score: 62, quality_trend: -6, useful_signals: 2, active_alerts: 0 },
  { id: 'com-21', name: 'Manon A.', region: 'Nord', cr_week: 9, quality_score: 81, quality_trend: 1, useful_signals: 5, active_alerts: 0 },
  { id: 'com-22', name: 'Théo N.', region: 'Sud-Ouest', cr_week: 7, quality_score: 67, quality_trend: -4, useful_signals: 2, active_alerts: 0 },
  { id: 'com-23', name: 'Jade W.', region: 'Est', cr_week: 10, quality_score: 83, quality_trend: 3, useful_signals: 5, active_alerts: 0 },
  { id: 'com-24', name: 'Ethan K.', region: 'Nord-Est', cr_week: 8, quality_score: 75, quality_trend: 0, useful_signals: 4, active_alerts: 0 },
];

const now = new Date();
function hoursAgo(h: number): string {
  return new Date(now.getTime() - h * 3600000).toISOString();
}
function daysAgo(d: number): string {
  return new Date(now.getTime() - d * 86400000).toISOString();
}

// --- SIGNALS ---
export const SIGNALS: Signal[] = [
  { id: 's1', type: 'concurrence', severity: 'rouge', title: 'Acme testé depuis 2 mois', content: 'Acme testé depuis 2 mois. Prix -12%. SAV problématique chez concurrent.', client_name: 'Dupont Industries', client_id: 'acc-1', commercial_name: 'Thomas D.', commercial_id: 'com-1', region: 'Nord', competitor_name: 'Acme', price_delta: -12, created_at: hoursAgo(2), treated: false },
  { id: 's2', type: 'concurrence', severity: 'orange', title: 'Bexor démarchage actif', content: 'Bexor démarchage actif — bundle produit inédit — 3 clients ciblés.', client_name: 'Groupe Mercier', client_id: 'acc-2', commercial_name: 'Julie R.', commercial_id: 'com-3', region: 'Sud-Ouest', competitor_name: 'Bexor', created_at: hoursAgo(5), treated: false },
  { id: 's3', type: 'besoin', severity: 'jaune', title: 'Catalogue numérique demandé', content: 'Demande de catalogue numérique + accès commande en ligne.', client_name: 'Bertrand & Fils', client_id: 'acc-4', commercial_name: 'Marc D.', commercial_id: 'com-4', region: 'Ouest', created_at: daysAgo(1), treated: false },
  { id: 's4', type: 'prix', severity: 'orange', title: 'Sensibilité prix forte', content: 'Client compare activement nos tarifs. Demande remise volume 15%.', client_name: 'Groupe Mercier', client_id: 'acc-2', commercial_name: 'Sarah R.', commercial_id: 'com-2', region: 'Nord', created_at: hoursAgo(8), treated: false },
  { id: 's5', type: 'opportunite', severity: 'vert', title: 'Upsell gamme Pro 45K', content: 'Ouverture projet gamme Pro — budget 45K€ — décision septembre.', client_name: 'Dupont Industries', client_id: 'acc-1', commercial_name: 'Thomas D.', commercial_id: 'com-1', region: 'Nord', created_at: daysAgo(1), treated: false },
  { id: 's6', type: 'satisfaction', severity: 'vert', title: 'Très satisfait — fidélisation', content: 'Client très satisfait du SAV. Recommande à son réseau. Potentiel upsell.', client_name: 'Bertrand & Fils', client_id: 'acc-4', commercial_name: 'Marc D.', commercial_id: 'com-4', region: 'Ouest', created_at: daysAgo(2), treated: true },
  { id: 's7', type: 'concurrence', severity: 'rouge', title: 'Acme offensive prix nationale', content: '8 commerciaux remontent Acme avec offre à -12% sur tout le territoire.', client_name: 'Multi-clients', client_id: 'acc-1', commercial_name: 'Emma V.', commercial_id: 'com-7', region: 'IDF', competitor_name: 'Acme', price_delta: -12, created_at: hoursAgo(3), treated: false },
  { id: 's8', type: 'besoin', severity: 'orange', title: 'Délais livraison trop longs', content: 'Client se plaint de délais de livraison à 3 semaines. Veut 1 semaine max.', client_name: 'Horizon Distribution', client_id: 'acc-3', commercial_name: 'Lucas M.', commercial_id: 'com-6', region: 'Est', created_at: hoursAgo(6), treated: false },
  { id: 's9', type: 'concurrence', severity: 'orange', title: 'TechPro SAV défaillant', content: 'Client revient de TechPro — SAV catastrophique. Opportunité de reconquête.', client_name: 'LogiPro SAS', client_id: 'acc-5', commercial_name: 'Léa F.', commercial_id: 'com-11', region: 'Est', competitor_name: 'TechPro', created_at: daysAgo(2), treated: true },
  { id: 's10', type: 'prix', severity: 'jaune', title: 'Demande remise volume', content: 'Demande de remise sur volume — commande récurrente de 50K/an.', client_name: 'Transco Group', client_id: 'acc-6', commercial_name: 'Clara S.', commercial_id: 'com-13', region: 'IDF', created_at: daysAgo(3), treated: false },
  { id: 's11', type: 'opportunite', severity: 'orange', title: 'Appel d\'offres 200K', content: 'Appel d\'offres évoqué — budget 200K€ — décision fin avril.', client_name: 'Horizon Distribution', client_id: 'acc-3', commercial_name: 'Lucas M.', commercial_id: 'com-6', region: 'Est', created_at: daysAgo(1), treated: false },
  { id: 's12', type: 'besoin', severity: 'jaune', title: 'Formation produit demandée', content: 'Équipe client demande une formation produit complète. 15 personnes.', client_name: 'NovaTech', client_id: 'acc-7', commercial_name: 'Antoine G.', commercial_id: 'com-8', region: 'Sud-Ouest', created_at: daysAgo(2), treated: false },
  { id: 's13', type: 'concurrence', severity: 'jaune', title: 'Proxio bundle offre', content: 'Proxio propose un bundle produit + service maintenance. Client intéressé.', client_name: 'Atelier Central', client_id: 'acc-8', commercial_name: 'Camille P.', commercial_id: 'com-9', region: 'Nord-Est', competitor_name: 'Proxio', created_at: daysAgo(4), treated: true },
  { id: 's14', type: 'satisfaction', severity: 'orange', title: 'SAV peu réactif', content: 'Client mécontent du temps de réponse SAV — 5 jours pour un ticket simple.', client_name: 'Dupont Industries', client_id: 'acc-1', commercial_name: 'Thomas D.', commercial_id: 'com-1', region: 'Nord', created_at: daysAgo(3), treated: false },
  { id: 's15', type: 'besoin', severity: 'orange', title: 'Stock insuffisant', content: 'Rupture de stock fréquente sur gamme A. Client menace de changer.', client_name: 'Groupe Mercier', client_id: 'acc-2', commercial_name: 'Sarah R.', commercial_id: 'com-2', region: 'Nord', created_at: daysAgo(1), treated: false },
  { id: 's16', type: 'concurrence', severity: 'rouge', title: 'Bexor nouveau région Sud-Ouest', content: 'Nouveau concurrent Bexor détecté — démarchage agressif sur 5 comptes.', client_name: 'SudFrance Logistique', client_id: 'acc-9', commercial_name: 'Antoine G.', commercial_id: 'com-8', region: 'Sud-Ouest', competitor_name: 'Bexor', created_at: hoursAgo(4), treated: false },
  { id: 's17', type: 'opportunite', severity: 'vert', title: 'Renouvellement anticipé', content: 'Client souhaite renouveler contrat 6 mois avant échéance. Très bon signe.', client_name: 'Bertrand & Fils', client_id: 'acc-4', commercial_name: 'Marc D.', commercial_id: 'com-4', region: 'Ouest', created_at: daysAgo(5), treated: true },
  { id: 's18', type: 'prix', severity: 'rouge', title: 'Acme prix -15% sur gamme B', content: 'Acme propose -15% sur gamme B avec engagement 2 ans. 3 clients ciblés.', client_name: 'Multi-clients', client_id: 'acc-10', commercial_name: 'Maxime R.', commercial_id: 'com-14', region: 'Nord', competitor_name: 'Acme', price_delta: -15, created_at: hoursAgo(7), treated: false },
  { id: 's19', type: 'besoin', severity: 'jaune', title: 'API intégration ERP', content: 'Client demande intégration API avec son ERP SAP. Besoin technique fort.', client_name: 'Horizon Distribution', client_id: 'acc-3', commercial_name: 'Lucas M.', commercial_id: 'com-6', region: 'Est', created_at: daysAgo(6), treated: false },
  { id: 's20', type: 'satisfaction', severity: 'vert', title: 'NPS excellent', content: 'Client note 9/10 au NPS. Ambassadeur potentiel pour référencement.', client_name: 'NovaTech', client_id: 'acc-7', commercial_name: 'Antoine G.', commercial_id: 'com-8', region: 'Sud-Ouest', created_at: daysAgo(4), treated: true },
  // More signals for density
  { id: 's21', type: 'concurrence', severity: 'orange', title: 'Acme mentionné chez LogiPro', content: 'Acme a pris contact avec le directeur achats de LogiPro.', client_name: 'LogiPro SAS', client_id: 'acc-5', commercial_name: 'Léa F.', commercial_id: 'com-11', region: 'Est', competitor_name: 'Acme', created_at: daysAgo(2), treated: false },
  { id: 's22', type: 'besoin', severity: 'orange', title: 'Livraison express demandée', content: 'Besoin de livraison J+1 pour les commandes urgentes. Actuellement J+5.', client_name: 'Transco Group', client_id: 'acc-6', commercial_name: 'Clara S.', commercial_id: 'com-13', region: 'IDF', created_at: daysAgo(3), treated: false },
  { id: 's23', type: 'opportunite', severity: 'orange', title: 'Nouveau site en ouverture', content: 'Client ouvre un nouveau site en mai. Besoin équipement complet 80K€.', client_name: 'Atelier Central', client_id: 'acc-8', commercial_name: 'Camille P.', commercial_id: 'com-9', region: 'Nord-Est', created_at: daysAgo(1), treated: false },
  { id: 's24', type: 'concurrence', severity: 'jaune', title: 'Proxio présent salon régional', content: 'Proxio avait un grand stand au salon régional Nord-Est. Catalogue agressif.', client_name: 'Multi-clients', client_id: 'acc-8', commercial_name: 'Ethan K.', commercial_id: 'com-24', region: 'Nord-Est', competitor_name: 'Proxio', created_at: daysAgo(5), treated: true },
  { id: 's25', type: 'satisfaction', severity: 'orange', title: 'Fréquence visites insuffisante', content: 'Client se plaint de ne pas voir assez souvent son commercial. 1 visite/trimestre.', client_name: 'Dupont Industries', client_id: 'acc-1', commercial_name: 'Thomas D.', commercial_id: 'com-1', region: 'Nord', created_at: daysAgo(1), treated: false },
];

// --- CONTACTS ---
const CONTACTS: Contact[] = [
  { id: 'ct-1', name: 'Marc Martin', role: 'Directeur Achats', client_id: 'acc-1', first_detected: daysAgo(45), is_new: true },
  { id: 'ct-2', name: 'Pierre Lefèvre', role: 'DG', client_id: 'acc-1', first_detected: daysAgo(180), is_new: false },
  { id: 'ct-3', name: 'Claire Dupuis', role: 'Responsable Supply Chain', client_id: 'acc-2', first_detected: daysAgo(90), is_new: false },
  { id: 'ct-4', name: 'Jean-Paul Mercier', role: 'PDG', client_id: 'acc-2', first_detected: daysAgo(365), is_new: false },
  { id: 'ct-5', name: 'Sophie Blanc', role: 'Directrice Commerciale', client_id: 'acc-3', first_detected: daysAgo(30), is_new: true },
  { id: 'ct-6', name: 'Luc Bertrand', role: 'Gérant', client_id: 'acc-4', first_detected: daysAgo(200), is_new: false },
  { id: 'ct-7', name: 'Nathalie Roux', role: 'DAF', client_id: 'acc-5', first_detected: daysAgo(60), is_new: false },
  { id: 'ct-8', name: 'Arnaud Petit', role: 'Directeur Technique', client_id: 'acc-6', first_detected: daysAgo(15), is_new: true },
];

// --- ACCOUNTS ---
export const ACCOUNTS: Account[] = [
  { id: 'acc-1', name: 'Dupont Industries', sector: 'Industrie', region: 'Nord', ca_annual: 480000, kam_id: 'u-kam-1', kam_name: 'Thomas Moreau', risk_score: 78, risk_trend: 22, active_signals: 3, last_rdv: daysAgo(2), health: 'rouge', signals: SIGNALS.filter(s => s.client_id === 'acc-1'), contacts: CONTACTS.filter(c => c.client_id === 'acc-1') },
  { id: 'acc-2', name: 'Groupe Mercier', sector: 'Distribution', region: 'Nord', ca_annual: 820000, kam_id: 'u-kam-1', kam_name: 'Thomas Moreau', risk_score: 65, risk_trend: 15, active_signals: 2, last_rdv: daysAgo(9), health: 'rouge', signals: SIGNALS.filter(s => s.client_id === 'acc-2'), contacts: CONTACTS.filter(c => c.client_id === 'acc-2') },
  { id: 'acc-3', name: 'Horizon Distribution', sector: 'Distribution', region: 'Est', ca_annual: 1200000, kam_id: 'u-kam-1', kam_name: 'Thomas Moreau', risk_score: 45, risk_trend: 8, active_signals: 1, last_rdv: daysAgo(16), health: 'orange', signals: SIGNALS.filter(s => s.client_id === 'acc-3'), contacts: CONTACTS.filter(c => c.client_id === 'acc-3') },
  { id: 'acc-4', name: 'Bertrand & Fils', sector: 'Artisanat', region: 'Ouest', ca_annual: 290000, kam_id: 'u-kam-1', kam_name: 'Thomas Moreau', risk_score: 12, risk_trend: -5, active_signals: 0, last_rdv: daysAgo(3), health: 'vert', signals: SIGNALS.filter(s => s.client_id === 'acc-4'), contacts: CONTACTS.filter(c => c.client_id === 'acc-4') },
  { id: 'acc-5', name: 'LogiPro SAS', sector: 'Logistique', region: 'Est', ca_annual: 350000, kam_id: 'u-kam-1', kam_name: 'Thomas Moreau', risk_score: 38, risk_trend: 5, active_signals: 1, last_rdv: daysAgo(12), health: 'orange', signals: SIGNALS.filter(s => s.client_id === 'acc-5'), contacts: CONTACTS.filter(c => c.client_id === 'acc-5') },
  { id: 'acc-6', name: 'Transco Group', sector: 'Transport', region: 'IDF', ca_annual: 560000, kam_id: 'u-kam-1', kam_name: 'Thomas Moreau', risk_score: 28, risk_trend: 3, active_signals: 1, last_rdv: daysAgo(7), health: 'jaune', signals: SIGNALS.filter(s => s.client_id === 'acc-6'), contacts: CONTACTS.filter(c => c.client_id === 'acc-6') },
  { id: 'acc-7', name: 'NovaTech', sector: 'Tech', region: 'Sud-Ouest', ca_annual: 180000, kam_id: 'u-kam-1', kam_name: 'Thomas Moreau', risk_score: 15, risk_trend: -2, active_signals: 0, last_rdv: daysAgo(5), health: 'vert', signals: SIGNALS.filter(s => s.client_id === 'acc-7'), contacts: CONTACTS.filter(c => c.client_id === 'acc-7') },
  { id: 'acc-8', name: 'Atelier Central', sector: 'Industrie', region: 'Nord-Est', ca_annual: 420000, kam_id: 'u-kam-1', kam_name: 'Thomas Moreau', risk_score: 32, risk_trend: -1, active_signals: 1, last_rdv: daysAgo(10), health: 'orange', signals: SIGNALS.filter(s => s.client_id === 'acc-8'), contacts: CONTACTS.filter(c => c.client_id === 'acc-8') },
  { id: 'acc-9', name: 'SudFrance Logistique', sector: 'Logistique', region: 'Sud-Ouest', ca_annual: 310000, kam_id: 'u-kam-1', kam_name: 'Thomas Moreau', risk_score: 55, risk_trend: 18, active_signals: 1, last_rdv: daysAgo(14), health: 'orange', signals: SIGNALS.filter(s => s.client_id === 'acc-9'), contacts: [] },
  { id: 'acc-10', name: 'MétalPro', sector: 'Industrie', region: 'Nord', ca_annual: 670000, kam_id: 'u-kam-1', kam_name: 'Thomas Moreau', risk_score: 42, risk_trend: 10, active_signals: 1, last_rdv: daysAgo(8), health: 'orange', signals: SIGNALS.filter(s => s.client_id === 'acc-10'), contacts: [] },
  { id: 'acc-11', name: 'BioSanté Plus', sector: 'Santé', region: 'IDF', ca_annual: 520000, kam_id: 'u-kam-1', kam_name: 'Thomas Moreau', risk_score: 18, risk_trend: 0, active_signals: 0, last_rdv: daysAgo(4), health: 'vert', signals: [], contacts: [] },
  { id: 'acc-12', name: 'EcoVert Services', sector: 'Services', region: 'Sud', ca_annual: 240000, kam_id: 'u-kam-1', kam_name: 'Thomas Moreau', risk_score: 22, risk_trend: -3, active_signals: 0, last_rdv: daysAgo(6), health: 'vert', signals: [], contacts: [] },
];

// --- ALERTS ---
export const ALERTS: Alert[] = [
  { id: 'a1', signal_id: 's1', signal: SIGNALS[0], user_id: 'u-kam-1', severity: 'rouge', status: 'nouveau', created_at: hoursAgo(2) },
  { id: 'a2', signal_id: 's7', signal: SIGNALS[6], user_id: 'u-kam-1', severity: 'rouge', status: 'nouveau', created_at: hoursAgo(3) },
  { id: 'a3', signal_id: 's2', signal: SIGNALS[1], user_id: 'u-kam-1', severity: 'orange', status: 'nouveau', created_at: hoursAgo(5) },
  { id: 'a4', signal_id: 's16', signal: SIGNALS[15], user_id: 'u-kam-1', severity: 'rouge', status: 'nouveau', created_at: hoursAgo(4) },
  { id: 'a5', signal_id: 's11', signal: SIGNALS[10], user_id: 'u-kam-1', severity: 'jaune', status: 'nouveau', created_at: daysAgo(1) },
  { id: 'a6', signal_id: 's4', signal: SIGNALS[3], user_id: 'u-kam-1', severity: 'orange', status: 'en_cours', created_at: hoursAgo(8) },
  { id: 'a7', signal_id: 's25', signal: SIGNALS[24], user_id: 'u-kam-1', severity: 'orange', status: 'nouveau', created_at: daysAgo(1) },
  { id: 'a8', signal_id: 's8', signal: SIGNALS[7], user_id: 'u-kam-1', severity: 'orange', status: 'traite', created_at: hoursAgo(6), treated_at: hoursAgo(2) },
  { id: 'a9', signal_id: 's14', signal: SIGNALS[13], user_id: 'u-kam-1', severity: 'orange', status: 'traite', created_at: daysAgo(3), treated_at: daysAgo(2) },
  { id: 'a10', signal_id: 's15', signal: SIGNALS[14], user_id: 'u-kam-1', severity: 'orange', status: 'traite', created_at: daysAgo(1), treated_at: hoursAgo(12) },
  { id: 'a11', signal_id: 's18', signal: SIGNALS[17], user_id: 'u-dir-1', severity: 'rouge', status: 'nouveau', created_at: hoursAgo(7) },
  { id: 'a12', signal_id: 's23', signal: SIGNALS[22], user_id: 'u-kam-1', severity: 'orange', status: 'nouveau', created_at: daysAgo(1) },
];

// --- COMPETITORS ---
export const COMPETITORS: Competitor[] = [
  { id: 'cp-1', name: 'Acme', mentions: 89, mention_type: 'Prix agressif', evolution: 34, risk: 'rouge', is_new: false },
  { id: 'cp-2', name: 'TechPro', mentions: 52, mention_type: 'SAV défaillant', evolution: -12, risk: 'jaune', is_new: false },
  { id: 'cp-3', name: 'Bexor', mentions: 38, mention_type: 'Nouveau / démarchage', evolution: 100, risk: 'orange', is_new: true },
  { id: 'cp-4', name: 'Proxio', mentions: 24, mention_type: 'Bundle offre', evolution: 0, risk: 'jaune', is_new: false },
];

// --- NEEDS ---
export const NEEDS: NeedItem[] = [
  { rank: 1, label: 'Délais de livraison trop longs', mentions: 47, evolution: 22, trend: 'up' },
  { rank: 2, label: 'Manque de disponibilité stock', mentions: 38, evolution: 18, trend: 'up' },
  { rank: 3, label: 'Demande de remise sur volume', mentions: 35, evolution: 0, trend: 'stable' },
  { rank: 4, label: 'Besoin formation produit', mentions: 28, evolution: 0, trend: 'new' },
  { rank: 5, label: 'SAV peu réactif', mentions: 21, evolution: -8, trend: 'down' },
  { rank: 6, label: 'Intégration API / ERP', mentions: 18, evolution: 12, trend: 'up' },
  { rank: 7, label: 'Catalogue numérique', mentions: 15, evolution: 0, trend: 'new' },
  { rank: 8, label: 'Livraison express J+1', mentions: 12, evolution: 5, trend: 'up' },
];

// --- AI RECOMMENDATIONS ---
export const AI_RECOMMENDATIONS: Record<string, string> = {
  'acc-1': 'RDV stratégique urgent — proposer offre gamme Pro avant fin avril. Mettre en avant qualité SAV vs Acme.',
  'acc-2': 'Relancer avant fin de semaine — concurrent Bexor en phase de démarchage actif. Valoriser la continuité de service.',
  'acc-3': 'Préparer réponse appel d\'offres 200K€ — décision fin avril. Impliquer la direction pour soutien commercial.',
  'acc-5': 'Opportunité de reconquête — client déçu par TechPro. Proposer offre de transition avec SAV premium.',
  'acc-8': 'Nouveau site en ouverture mai — proposer package équipement complet. Budget estimé 80K€.',
  'acc-9': 'Surveiller Bexor — démarchage agressif en cours. Planifier visite terrain cette semaine.',
  'acc-10': 'Attention offensive prix Acme -15% sur gamme B. Proposer avantage hors-prix (service, garantie).',
};
