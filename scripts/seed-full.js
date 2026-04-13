/**
 * seed-full.js — Comprehensive seed: ~100 signals + ALL tables populated
 * so every feature of the app can be tested with realistic data.
 *
 * Usage:  node scripts/seed-full.js
 *
 * This script DELETES existing business data for the demo company first,
 * then re-inserts everything fresh.
 */

const { Client } = require('pg');

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const PG_CONNECTION = 'postgresql://postgres:FmYIOCDbBnzB0mpH@db.cbcjiszrajsqtrhpgsqf.supabase.co:5432/postgres';
const COMPANY_ID = 'a0000000-0000-0000-0000-000000000001';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const now = new Date();
function hoursAgo(h) { return new Date(now.getTime() - h * 3600000).toISOString(); }
function daysAgo(d) { return new Date(now.getTime() - d * 86400000).toISOString(); }
function dateStr(daysBack) {
  const d = new Date(now.getTime() - daysBack * 86400000);
  return d.toISOString().split('T')[0];
}
function uuid(prefix, n) {
  // UUID format: 8-4-4-4-12
  // prefix is 8 chars (e.g. 'c0000000'), n fills the last 12 hex chars
  const hex = n.toString(16).padStart(12, '0');
  return `${prefix}-0000-0000-0000-${hex}`;
}

// Regions used throughout
const REGIONS = ['Nord', 'IDF', 'Est', 'Ouest', 'Sud', 'Sud-Ouest', 'Sud-Est'];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const pg = new Client({ connectionString: PG_CONNECTION });
  await pg.connect();
  console.log('[OK] Connected to PostgreSQL');

  try {
    // ===================================================================
    // STEP 0: Apply migration 00004 (add missing columns)
    // ===================================================================
    console.log('\n--- Step 0: Apply missing columns migration ---');
    await pg.query(`ALTER TABLE competitors ADD COLUMN IF NOT EXISTS mentions int DEFAULT 0`);
    await pg.query(`ALTER TABLE competitors ADD COLUMN IF NOT EXISTS evolution int DEFAULT 0`);
    console.log('[OK] competitors.mentions + evolution columns ensured');

    // ===================================================================
    // STEP 1: Delete existing business data (keep company + users)
    // ===================================================================
    console.log('\n--- Step 1: Clean existing data ---');
    const tables = [
      'recommandations_ia', 'prix_signals', 'cr_objectifs',
      'deals_marketing', 'deals_commerciaux',
      'offres_concurrentes', 'comm_concurrentes', 'positionnement',
      'geo_sector_data', 'geo_points',
      'motifs_sentiment', 'tendance_prix', 'deal_tendance', 'deal_commercial_tendance',
      'segment_sentiments', 'sentiment_periodes', 'sentiment_regions',
      'territoires', 'region_profiles',
      'alerts', 'signals', 'contacts', 'needs',
      'abbreviations', 'competitors', 'accounts', 'commercials',
    ];
    for (const t of tables) {
      try {
        await pg.query(`DELETE FROM ${t} WHERE company_id = $1`, [COMPANY_ID]);
      } catch (e) {
        // Table may not exist yet — skip
        console.log(`  [SKIP] ${t}: ${e.message.split('\n')[0]}`);
      }
    }
    console.log('[OK] Cleaned all business data for demo company');

    // ===================================================================
    // STEP 2: Commercials (12)
    // ===================================================================
    console.log('\n--- Step 2: Commercials (12) ---');
    const commercials = [
      [uuid('c0000000', 1),  'Thomas D.',   'Nord',      95,  3,  14, 8, 2],
      [uuid('c0000000', 2),  'Sarah R.',    'Nord',      88,  2,  11, 6, 1],
      [uuid('c0000000', 3),  'Julie L.',    'IDF',       82, -1,   9, 4, 3],
      [uuid('c0000000', 4),  'Marc D.',     'Ouest',     78,  4,   8, 5, 0],
      [uuid('c0000000', 5),  'Pierre B.',   'Sud',       51,-12,   4, 1, 4],
      [uuid('c0000000', 6),  'Lucas M.',    'Est',       84,  1,  10, 7, 1],
      [uuid('c0000000', 7),  'Emma V.',     'IDF',       91,  5,  12, 9, 0],
      [uuid('c0000000', 8),  'Antoine G.',  'Sud-Ouest', 65, -5,   6, 3, 2],
      [uuid('c0000000', 9),  'Clara S.',    'IDF',       87,  2,  10, 6, 1],
      [uuid('c0000000', 10), 'Maxime R.',   'Nord',      73,  0,   7, 3, 2],
      [uuid('c0000000', 11), 'Ines D.',     'Sud-Ouest', 69, -3,   5, 2, 3],
      [uuid('c0000000', 12), 'Hugo T.',     'Sud-Est',   76,  1,   8, 4, 1],
    ];
    for (const [id, name, region, qs, qt, crw, us, aa] of commercials) {
      await pg.query(`
        INSERT INTO commercials (id, company_id, name, region, quality_score, quality_trend, cr_week, useful_signals, active_alerts)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO NOTHING
      `, [id, COMPANY_ID, name, region, qs, qt, crw, us, aa]);
    }
    console.log(`  [OK] ${commercials.length} commercials`);

    // ===================================================================
    // STEP 3: Accounts (15)
    // ===================================================================
    console.log('\n--- Step 3: Accounts (15) ---');
    const accounts = [
      [uuid('b0000000', 1),  'Dupont Industries',      'Industrie',     'Nord',      480000,  78, 'rouge',   -5, 3, 'Thomas D.',   '2026-04-10'],
      [uuid('b0000000', 2),  'Groupe Mercier',         'Distribution',  'Nord',      820000,  65, 'rouge',    2, 4, 'Sarah R.',    '2026-04-08'],
      [uuid('b0000000', 3),  'Horizon Distribution',   'Distribution',  'Est',      1200000,  45, 'orange',  -3, 2, 'Lucas M.',    '2026-04-05'],
      [uuid('b0000000', 4),  'Bertrand & Fils',        'Artisanat',     'Ouest',     290000,  12, 'vert',     0, 1, 'Marc D.',     '2026-04-11'],
      [uuid('b0000000', 5),  'LogiPro SAS',            'Logistique',    'Est',       350000,  38, 'orange',   5, 2, 'Lucas M.',    '2026-04-03'],
      [uuid('b0000000', 6),  'Transco Group',          'Transport',     'IDF',       560000,  28, 'jaune',   -2, 1, 'Emma V.',     '2026-04-09'],
      [uuid('b0000000', 7),  'BioSante Plus',          'Sante',         'IDF',       720000,  15, 'vert',     3, 0, 'Emma V.',     '2026-04-12'],
      [uuid('b0000000', 8),  'SudFrance Logistique',   'Logistique',    'Sud-Ouest', 410000,  52, 'orange',   8, 3, 'Antoine G.',  '2026-04-01'],
      [uuid('b0000000', 9),  'NovaTech',               'Tech',          'Sud-Ouest', 350000,  42, 'orange',  -1, 2, 'Ines D.',     '2026-04-07'],
      [uuid('b0000000', 10), 'MetalPro',               'Industrie',     'Nord',      680000,  55, 'orange',   4, 2, 'Maxime R.',   '2026-04-06'],
      [uuid('b0000000', 11), 'MecanoParts',            'Industrie',     'Sud',       250000,  70, 'rouge',  -10, 4, 'Pierre B.',   '2026-03-28'],
      [uuid('b0000000', 12), 'AgroVert',               'Agriculture',   'Ouest',     390000,  20, 'vert',     1, 0, 'Marc D.',     '2026-04-04'],
      [uuid('b0000000', 13), 'TechnoSud',              'Tech',          'Sud-Est',   580000,  35, 'jaune',    0, 1, 'Hugo T.',     '2026-04-02'],
      [uuid('b0000000', 14), 'EnergiePlus',            'Energie',       'Est',       950000,  25, 'jaune',   -2, 1, 'Lucas M.',    '2026-03-30'],
      [uuid('b0000000', 15), 'DistribExpress',         'Distribution',  'IDF',       1100000, 18, 'vert',     2, 0, 'Clara S.',    '2026-04-11'],
    ];
    for (const [id, name, sector, region, ca, risk, health, riskTrend, activeSig, kamName, lastRdv] of accounts) {
      await pg.query(`
        INSERT INTO accounts (id, company_id, name, sector, region, ca_annual, risk_score, health, risk_trend, active_signals, kam_name, last_rdv)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8::severity, $9, $10, $11, $12)
        ON CONFLICT (id) DO NOTHING
      `, [id, COMPANY_ID, name, sector, region, ca, risk, health, riskTrend, activeSig, kamName, lastRdv]);
    }
    console.log(`  [OK] ${accounts.length} accounts`);

    // ===================================================================
    // STEP 4: Competitors (6)
    // ===================================================================
    console.log('\n--- Step 4: Competitors (6) ---');
    const competitors = [
      [uuid('d0000000', 1), 'Acme',     'Prix agressif',          'rouge',  false, 38, 12],
      [uuid('d0000000', 2), 'TechPro',  'SAV defaillant',         'jaune',  false, 22, -5],
      [uuid('d0000000', 3), 'Bexor',    'Nouveau / demarchage',   'orange', true,  28, 18],
      [uuid('d0000000', 4), 'Proxio',   'Bundle offre',           'jaune',  false, 15, 3],
      [uuid('d0000000', 5), 'IndusPro', 'Specialiste industriel', 'orange', true,  12, 8],
      [uuid('d0000000', 6), 'VeloCom',  'Livraison rapide',       'jaune',  false, 8,  0],
    ];
    for (const [id, name, mt, risk, isNew, mentions, evolution] of competitors) {
      await pg.query(`
        INSERT INTO competitors (id, company_id, name, mention_type, risk, is_new, mentions, evolution)
        VALUES ($1, $2, $3, $4, $5::severity, $6, $7, $8)
        ON CONFLICT (id) DO NOTHING
      `, [id, COMPANY_ID, name, mt, risk, isNew, mentions, evolution]);
    }
    console.log(`  [OK] ${competitors.length} competitors`);

    // ===================================================================
    // STEP 5: Signals (100) — the big one
    // ===================================================================
    console.log('\n--- Step 5: Signals (100) ---');
    const signalData = [
      // --- Concurrence signals (30) ---
      [1,  'concurrence', 'rouge',  'Acme en test chez Dupont',              'Acme est en test actif depuis 2 mois chez Dupont Industries. Ils proposent -12% sur la gamme standard. Le directeur achat est tres interesse.', 1, 1, 'Nord', 'Acme', -12, false, 2],
      [2,  'concurrence', 'orange', 'Bexor demarchage Sud-Ouest',           'Bexor demarchage actif avec bundle produit+maintenance inedit. 3 clients cibles dans la region.', 8, 8, 'Sud-Ouest', 'Bexor', null, false, 5],
      [3,  'concurrence', 'rouge',  'Acme offensive prix nationale',        '8 commerciaux remontent Acme avec offre a -12% sur tout le territoire national. Campagne coordonnee.', 6, 7, 'IDF', 'Acme', -12, false, 3],
      [4,  'concurrence', 'orange', 'TechPro SAV defaillant',               'Client revient de TechPro apres SAV catastrophique. Opportunite de reconquete immediate.', 5, 6, 'Est', 'TechPro', null, true, 48],
      [5,  'concurrence', 'rouge',  'Acme -15% engagement 2 ans',           'Acme a sorti un nouveau tarif a -15% avec engagement 2 ans. Tres attractif pour les gros volumes.', 10, 10, 'Nord', 'Acme', -15, false, 24],
      [6,  'concurrence', 'orange', 'Bexor bundle chez SudFrance',          'Bexor propose un package tout-inclus a SudFrance Logistique. Le client hesite fortement.', 8, 11, 'Sud-Ouest', 'Bexor', -8, false, 36],
      [7,  'concurrence', 'jaune',  'Proxio detecte sur 2 comptes IDF',     'Proxio a ete detecte sur 2 comptes en IDF avec une offre bundle competitive.', 6, 9, 'IDF', 'Proxio', null, false, 72],
      [8,  'concurrence', 'rouge',  'Acme signe chez MetalPro',             'MetalPro a signe avec Acme la semaine derniere. On a perdu le compte sur le prix.', 10, 10, 'Nord', 'Acme', -12, false, 120],
      [9,  'concurrence', 'orange', 'IndusPro demarchage industrie',        'IndusPro cible les comptes industriels avec une offre specialisee. Deja en contact avec MecanoParts.', 11, 5, 'Sud', 'IndusPro', -5, false, 48],
      [10, 'concurrence', 'jaune',  'TechPro revient sur le marche Est',    'TechPro relance son offre dans l\'Est avec un nouveau commercial. Prix aligne sur le marche.', 3, 6, 'Est', 'TechPro', 0, false, 96],
      [11, 'concurrence', 'rouge',  'Acme casse les prix Dupont',           'Acme propose maintenant -18% chez Dupont Industries avec service inclus. Risque de perte imminent.', 1, 1, 'Nord', 'Acme', -18, false, 1],
      [12, 'concurrence', 'orange', 'Bexor approche AgroVert',             'Bexor a contacte AgroVert avec une offre agriculture specifique. Premier RDV prevu la semaine prochaine.', 12, 4, 'Ouest', 'Bexor', null, false, 12],
      [13, 'concurrence', 'jaune',  'VeloCom livraison express',            'VeloCom propose livraison J+1 gratuite. Plusieurs clients interesses dans le Nord.', 2, 2, 'Nord', 'VeloCom', null, false, 36],
      [14, 'concurrence', 'orange', 'Acme chez Horizon Distribution',       'Acme a presente une offre a Horizon Distribution. Le DA compare les prix activement.', 3, 6, 'Est', 'Acme', -10, false, 60],
      [15, 'concurrence', 'rouge',  'Bexor signe NovaTech',                 'Bexor a signe un contrat avec NovaTech cette semaine. Deal perdu sur la qualite du bundle.', 9, 11, 'Sud-Ouest', 'Bexor', -8, false, 168],
      [16, 'concurrence', 'jaune',  'IndusPro salon professionnel',         'IndusPro sera present au salon Industrie Lyon. Plusieurs clients communs seront presents.', 11, 12, 'Sud-Est', 'IndusPro', null, false, 48],
      [17, 'concurrence', 'orange', 'Proxio nouvelle gamme',                'Proxio lance une nouvelle gamme avec IA integree. Premiers retours tres positifs des clients.', 15, 9, 'IDF', 'Proxio', null, false, 24],
      [18, 'concurrence', 'jaune',  'TechPro offre SAV ameliore',           'TechPro communique sur une refonte complete de son SAV. Engagement 48h max.', 14, 6, 'Est', 'TechPro', null, false, 72],
      [19, 'concurrence', 'orange', 'Acme prospection Sud-Est',             'Acme lance une campagne de prospection en Sud-Est. 5 premiers contacts identifies.', 13, 12, 'Sud-Est', 'Acme', -10, false, 36],
      [20, 'concurrence', 'rouge',  'Bexor offre exclusive MecanoParts',    'Bexor propose une offre exclusive a MecanoParts avec -15% et maintenance incluse.', 11, 8, 'Sud', 'Bexor', -15, false, 6],

      // --- More concurrence (10 more)
      [21, 'concurrence', 'jaune',  'VeloCom partenariat logistique',       'VeloCom s\'associe avec un transporteur pour offrir des delais imbattables en IDF.', 6, 7, 'IDF', 'VeloCom', null, false, 48],
      [22, 'concurrence', 'orange', 'Acme recrutement commercial Nord',     'Acme recrute 2 nouveaux commerciaux dans le Nord. Intention de renforcer la pression.', 1, 2, 'Nord', 'Acme', null, false, 24],
      [23, 'concurrence', 'rouge',  'IndusPro signe EnergiePlus',          'IndusPro vient de signer un contrat cadre avec EnergiePlus. Perte d\'un compte strategique.', 14, 6, 'Est', 'IndusPro', -7, false, 48],
      [24, 'concurrence', 'jaune',  'Proxio formation gratuite',            'Proxio offre des formations gratuites aux equipes de ses clients. Bonne strategie de fidelisation.', 7, 3, 'IDF', 'Proxio', null, false, 72],
      [25, 'concurrence', 'orange', 'Bexor extension gamme',                'Bexor elargit sa gamme avec 3 nouveaux produits concurrents directs. Positionnement agressif.', 8, 11, 'Sud-Ouest', 'Bexor', null, false, 36],
      [26, 'concurrence', 'jaune',  'TechPro baisse de prix temporaire',    'TechPro fait une promotion temporaire -20% jusqu\'a fin avril. Risque de perte de clients.', 5, 6, 'Est', 'TechPro', -20, false, 12],
      [27, 'concurrence', 'orange', 'Acme chez DistribExpress',             'Acme a approche DistribExpress avec une offre nationale. Le DA est en reflexion.', 15, 9, 'IDF', 'Acme', -8, false, 48],
      [28, 'concurrence', 'rouge',  'Bexor campagne emailing massive',      'Bexor envoie des emailings agressifs a notre base clients Sud-Ouest. 4 clients interesses.', 9, 8, 'Sud-Ouest', 'Bexor', null, false, 6],
      [29, 'concurrence', 'jaune',  'IndusPro partenariat TechnoSud',       'IndusPro developpe un partenariat avec TechnoSud pour le marche Sud-Est.', 13, 12, 'Sud-Est', 'IndusPro', null, false, 24],
      [30, 'concurrence', 'orange', 'VeloCom expansion Ouest',              'VeloCom s\'installe dans l\'Ouest avec un depot logistique. Concurrence directe sur les delais.', 4, 4, 'Ouest', 'VeloCom', null, false, 48],

      // --- Besoin signals (25) ---
      [31, 'besoin', 'jaune',  'Catalogue numerique demande',              'Demande de catalogue numerique + acces commande en ligne. Client Bertrand & Fils.', 4, 4, 'Ouest', null, null, false, 24],
      [32, 'besoin', 'orange', 'Delais livraison trop longs',              'Client se plaint de delais a 3 semaines. Veut 1 semaine maximum. Risque de depart.', 3, 6, 'Est', null, null, false, 6],
      [33, 'besoin', 'jaune',  'Formation produit demandee',               'L\'equipe technique du client demande une formation sur la nouvelle gamme Pro.', 7, 7, 'IDF', null, null, false, 48],
      [34, 'besoin', 'orange', 'Integration ERP SAP urgente',              'Client EnergiePlus a besoin d\'une integration SAP pour continuer. Bloquant pour renouvellement.', 14, 6, 'Est', null, null, false, 12],
      [35, 'besoin', 'jaune',  'Disponibilite stock insuffisante',         '3 references en rupture depuis 2 semaines. Client menace de commander chez le concurrent.', 3, 6, 'Est', null, null, false, 36],
      [36, 'besoin', 'vert',   'Demande de demo gamme Pro',                'Fort interet pour la gamme Pro. Demo planifiee la semaine prochaine.', 7, 7, 'IDF', null, null, true, 24],
      [37, 'besoin', 'orange', 'SAV trop lent',                            'Client attend 10 jours pour une intervention SAV. Norme du marche: 48h. Tres insatisfait.', 1, 1, 'Nord', null, null, false, 48],
      [38, 'besoin', 'jaune',  'Commande en ligne souhaitee',              'Plusieurs clients demandent un portail de commande en ligne avec suivi en temps reel.', 6, 9, 'IDF', null, null, false, 72],
      [39, 'besoin', 'orange', 'Livraison express demandee',               'Le client a besoin de livraison J+2 pour maintenir sa propre chaine de production.', 10, 2, 'Nord', null, null, false, 12],
      [40, 'besoin', 'jaune',  'Documentation technique insuffisante',     'Les fiches techniques ne sont pas a jour. Client a du mal a specifier les produits.', 12, 4, 'Ouest', null, null, false, 36],
      [41, 'besoin', 'orange', 'API ERP demandee',                         'Client demande une API pour connecter notre catalogue a son ERP. Condition de renouvellement.', 5, 6, 'Est', null, null, false, 24],
      [42, 'besoin', 'jaune',  'Service apres-vente en region',            'Client veut un point SAV local au lieu de centralise a Paris. Trop loin pour interventions rapides.', 8, 11, 'Sud-Ouest', null, null, false, 48],
      [43, 'besoin', 'vert',   'Interets multi-produits',                  'Client interesse par 3 gammes differentes. Potentiel cross-sell important.', 15, 9, 'IDF', null, null, true, 12],
      [44, 'besoin', 'orange', 'Conditionnement adapte',                   'Client demande un conditionnement different (palette vs carton). Bloquant pour la commande.', 11, 5, 'Sud', null, null, false, 36],
      [45, 'besoin', 'jaune',  'Remise fidele client',                     'Client fidele depuis 5 ans demande un programme de fidelite avec remises progressives.', 6, 3, 'IDF', null, null, false, 72],
      [46, 'besoin', 'orange', 'Accompagnement technique terrain',         'Le client souhaite un technicien dedie pour les installations complexes.', 13, 12, 'Sud-Est', null, null, false, 24],
      [47, 'besoin', 'jaune',  'Facturation mensuelle',                    'Client prefere un paiement mensualise plutot que par commande. Frein a l\'achat.', 4, 4, 'Ouest', null, null, false, 48],
      [48, 'besoin', 'vert',   'Projet renovation usine',                  'Client lance renovation complete. Budget 200K. Recherche fournisseur unique.', 3, 6, 'Est', null, null, false, 6],
      [49, 'besoin', 'orange', 'Qualite emballage a ameliorer',            'Plusieurs casses lors des livraisons. Client demande un emballage renforce.', 10, 10, 'Nord', null, null, false, 36],
      [50, 'besoin', 'jaune',  'Rapport de suivi consommation',            'Client veut un dashboard de suivi de sa consommation et ses commandes en temps reel.', 7, 7, 'IDF', null, null, false, 48],

      // --- More besoins (5)
      [51, 'besoin', 'orange', 'Garantie etendue demandee',               'Le client exige une garantie 3 ans au lieu de 1 an. Condition sine qua non pour renouvellement.', 2, 2, 'Nord', null, null, false, 24],
      [52, 'besoin', 'jaune',  'Formation equipe de vente',               'Le distributeur demande une formation de ses propres commerciaux sur nos produits.', 15, 9, 'IDF', null, null, false, 36],
      [53, 'besoin', 'orange', 'Livraison le samedi',                     'Client en retail a besoin de livraisons le samedi matin. Actuellement impossible.', 8, 8, 'Sud-Ouest', null, null, false, 12],
      [54, 'besoin', 'jaune',  'Personnalisation produit',                'Le client souhaite une personnalisation avec son logo. Volume: 500 unites/mois.', 9, 11, 'Sud-Ouest', null, null, false, 48],
      [55, 'besoin', 'vert',   'Extension contrat annuel',                'Client pret a signer un contrat annuel si on integre la maintenance. Opportunite.', 14, 6, 'Est', null, null, true, 6],

      // --- Prix signals (20) ---
      [56, 'prix', 'orange', 'Sensibilite prix forte Mercier',           'Groupe Mercier compare activement nos tarifs avec 3 concurrents. Demande remise 15%.', 2, 2, 'Nord', null, null, false, 8],
      [57, 'prix', 'jaune',  'Demande remise volume 50K',                'Demande de remise sur volume. Commande recurrente de 50K/an. Negociation en cours.', 6, 7, 'IDF', null, null, false, 72],
      [58, 'prix', 'orange', 'Client menace de partir sur le prix',      'MecanoParts menace d\'aller chez IndusPro si on n\'aligne pas le prix a -10%.', 11, 5, 'Sud', null, null, false, 24],
      [59, 'prix', 'rouge',  'Perte de marge sur Dupont',                'Pour retenir Dupont face a Acme, on devra baisser de 10%. Impact marge: -48K/an.', 1, 1, 'Nord', 'Acme', -12, false, 4],
      [60, 'prix', 'jaune',  'Demande degressif sur 3 ans',              'Client demande un degressif de prix avec engagement 3 ans. Peut etre interessant.', 3, 6, 'Est', null, null, false, 48],
      [61, 'prix', 'orange', 'Concurrent -10% chez LogiPro',             'LogiPro a recu une offre concurrente a -10%. Demande un alignement.', 5, 6, 'Est', 'TechPro', -10, false, 36],
      [62, 'prix', 'jaune',  'Negociation volume AgroVert',              'AgroVert pret a doubler ses volumes si remise de 8%. Volume actuel: 40K.', 12, 4, 'Ouest', null, null, false, 24],
      [63, 'prix', 'rouge',  'Budget gele chez NovaTech',                'NovaTech gele ses budgets Q2. Toutes les commandes non signees sont suspendues.', 9, 11, 'Sud-Ouest', null, null, false, 12],
      [64, 'prix', 'orange', 'Pression prix SudFrance',                  'SudFrance Logistique fait jouer Bexor pour obtenir -12% sur notre contrat.', 8, 8, 'Sud-Ouest', 'Bexor', -12, false, 48],
      [65, 'prix', 'jaune',  'Remise saisonniere demandee',              'Le client demande une remise pour la periode creuse ete. -5% juillet-aout.', 6, 3, 'IDF', null, null, false, 72],
      [66, 'prix', 'orange', 'Ecart trop important sur ref. 450',        'Sur la reference 450, notre prix est 20% au-dessus du marche. Client pret a changer.', 10, 10, 'Nord', null, null, false, 24],
      [67, 'prix', 'jaune',  'Negociation frais de port',                'Client demande franco de port a partir de 500EUR au lieu de 1000EUR actuellement.', 4, 4, 'Ouest', null, null, false, 36],
      [68, 'prix', 'orange', 'Tarif public trop visible',                'Nos tarifs publics sont indexes sur Google. Concurrents peuvent facilement sous-coter.', 13, 12, 'Sud-Est', null, null, false, 48],
      [69, 'prix', 'rouge',  'Marge negative sur commande speciale',     'Commande speciale a marge negative pour garder le compte. Risque de precedent.', 2, 2, 'Nord', null, null, false, 6],
      [70, 'prix', 'jaune',  'Demande prix net industrie',               'Le client veut des prix nets sans remises visibles. Simplification administrative.', 14, 6, 'Est', null, null, false, 48],

      // --- Opportunite signals (15) ---
      [71, 'opportunite', 'vert',   'Upsell gamme Pro 45K Dupont',       'Ouverture projet gamme Pro chez Dupont - budget 45K EUR - decision septembre.', 1, 1, 'Nord', null, null, false, 24],
      [72, 'opportunite', 'vert',   'Cross-sell DistribExpress',          'DistribExpress interesse par notre gamme logistique. Potentiel 80K/an.', 15, 9, 'IDF', null, null, true, 12],
      [73, 'opportunite', 'vert',   'Appel d\'offres 200K Est',           'AO detecte chez EnergiePlus pour renouvellement complet. Budget 200K. Deadline mai.', 14, 6, 'Est', null, null, false, 48],
      [74, 'opportunite', 'jaune',  'Nouveau site client AgroVert',      'AgroVert ouvre un nouveau site en juin. Equipement complet a prevoir.', 12, 4, 'Ouest', null, null, false, 36],
      [75, 'opportunite', 'vert',   'TechnoSud extension contrat',       'TechnoSud veut etendre le contrat a 2 nouveaux sites. Potentiel +120K.', 13, 12, 'Sud-Est', null, null, true, 6],
      [76, 'opportunite', 'jaune',  'Reconquete client TechPro',         'Client insatisfait de TechPro veut revenir. RDV fixe la semaine prochaine.', 5, 6, 'Est', null, null, false, 48],
      [77, 'opportunite', 'vert',   'Projet digitalisation BioSante',    'BioSante lance un projet de digitalisation. Notre solution peut s\'integrer.', 7, 7, 'IDF', null, null, true, 24],
      [78, 'opportunite', 'jaune',  'Prescription architecte',           'Un architecte prescrit nos produits pour 3 chantiers. Volume potentiel 60K.', 4, 4, 'Ouest', null, null, false, 36],
      [79, 'opportunite', 'vert',   'Referenement grande distribution',  'Possibilite de referencement dans une enseigne nationale. Volume: 500K/an.', 6, 7, 'IDF', null, null, false, 12],
      [80, 'opportunite', 'jaune',  'Salon Industrie Lyon contact',      'Contact prometteur au salon de Lyon. Entreprise en recherche de fournisseur.', 12, 12, 'Sud-Est', null, null, false, 48],
      [81, 'opportunite', 'vert',   'Migration fournisseur Mercier',     'Groupe Mercier envisage de consolider ses fournisseurs. On est shortliste.', 2, 2, 'Nord', null, null, false, 24],
      [82, 'opportunite', 'jaune',  'Partenariat formation pro',         'Possibilite de partenariat avec un centre de formation professionnelle.', 8, 11, 'Sud-Ouest', null, null, false, 72],
      [83, 'opportunite', 'vert',   'Commande ponctuelle 35K',           'Commande ponctuelle de 35K detectee chez LogiPro pour equipement nouveau site.', 5, 6, 'Est', null, null, false, 6],
      [84, 'opportunite', 'jaune',  'Recommandation reseau client',      'Un client satisfait nous recommande a 2 entreprises de son reseau.', 1, 1, 'Nord', null, null, true, 48],
      [85, 'opportunite', 'vert',   'Extension contrat cadre Transco',   'Transco Group veut passer en contrat cadre 3 ans. Securisation du CA.', 6, 7, 'IDF', null, null, false, 12],

      // --- Satisfaction signals (15) ---
      [86,  'satisfaction', 'vert',   'Tres satisfait SAV',               'Client tres satisfait du SAV. Recommande a son reseau. Fidelisation renforcee.', 4, 4, 'Ouest', null, null, true, 48],
      [87,  'satisfaction', 'vert',   'Qualite produit reconnue',         'Le DA de BioSante confirme que notre qualite est la meilleure du marche.', 7, 7, 'IDF', null, null, true, 24],
      [88,  'satisfaction', 'jaune',  'Satisfait mais prix eleve',        'Client globalement satisfait mais trouve nos prix au-dessus du marche de 10%.', 3, 6, 'Est', null, null, false, 36],
      [89,  'satisfaction', 'orange', 'Insatisfaction livraison',         'Client insatisfait des delais de livraison. 2 commandes en retard ce mois.', 10, 10, 'Nord', null, null, false, 12],
      [90,  'satisfaction', 'vert',   'NPS excellent',                    'Score NPS de 9/10 chez Transco Group. Le meilleur score du portefeuille.', 6, 7, 'IDF', null, null, true, 48],
      [91,  'satisfaction', 'orange', 'Reclamation qualite',              'Lot defectueux livre a MecanoParts. Reclamation en cours. Risque de perte.', 11, 5, 'Sud', null, null, false, 6],
      [92,  'satisfaction', 'vert',   'Remerciement intervention urgente', 'Client remercie pour intervention SAV en urgence le week-end. Relation renforcee.', 14, 6, 'Est', null, null, true, 72],
      [93,  'satisfaction', 'jaune',  'Avis mitige nouveau produit',      'Le nouveau produit ne repond pas entierement aux attentes. Ameliorations demandees.', 9, 11, 'Sud-Ouest', null, null, false, 48],
      [94,  'satisfaction', 'vert',   'Fidelite 10 ans Bertrand',        'Bertrand & Fils renouvelle pour la 10e annee consecutive. Relation exemplaire.', 4, 4, 'Ouest', null, null, true, 24],
      [95,  'satisfaction', 'orange', 'Facturation erronnee recurrente', 'Erreurs de facturation repetees chez Horizon. Le DAF menace de changer.', 3, 6, 'Est', null, null, false, 12],
      [96,  'satisfaction', 'vert',   'Produit conforme - client ravi',  'Livraison conforme a 100% ce trimestre chez DistribExpress. Client tres satisfait.', 15, 9, 'IDF', null, null, true, 36],
      [97,  'satisfaction', 'jaune',  'Communication a ameliorer',       'Client reproche un manque de proactivite dans la communication. Pas de suivi regulier.', 13, 12, 'Sud-Est', null, null, false, 48],
      [98,  'satisfaction', 'orange', 'Retard chronique',                'Retards livraison chroniques chez SudFrance. 4/6 commandes en retard ce mois.', 8, 8, 'Sud-Ouest', null, null, false, 6],
      [99,  'satisfaction', 'vert',   'Excellent accueil commercial',    'Le nouveau commercial (Hugo T.) fait un excellent travail terrain en Sud-Est.', 13, 12, 'Sud-Est', null, null, true, 24],
      [100, 'satisfaction', 'jaune',  'Service correct sans plus',       'Client satisfait mais pas enthousiaste. Pas de differentiation percue vs concurrence.', 2, 2, 'Nord', null, null, false, 72],
    ];

    for (const [n, type, sev, title, content, accIdx, comIdx, region, compName, priceDelta, treated, hAgo] of signalData) {
      const id = uuid('e0000000', n);
      const accId = uuid('b0000000', accIdx);
      const comId = comIdx ? uuid('c0000000', comIdx) : null;
      await pg.query(`
        INSERT INTO signals (id, company_id, type, severity, title, content, account_id, commercial_id, region, competitor_name, price_delta, treated, created_at)
        VALUES ($1, $2, $3::signal_type, $4::severity, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (id) DO NOTHING
      `, [id, COMPANY_ID, type, sev, title, content, accId, comId, region, compName, priceDelta, treated, hoursAgo(hAgo)]);
    }
    console.log(`  [OK] ${signalData.length} signals`);

    // ===================================================================
    // STEP 6: Alerts (25)
    // ===================================================================
    console.log('\n--- Step 6: Alerts (25) ---');
    const alerts = [
      // Rouge alerts
      [1,  1,  'rouge', 'nouveau',  2,   null],
      [2,  3,  'rouge', 'nouveau',  3,   null],
      [3,  5,  'rouge', 'en_cours', 24,  null],
      [4,  8,  'rouge', 'traite',   120, 72],
      [5,  11, 'rouge', 'nouveau',  1,   null],
      [6,  15, 'rouge', 'traite',   168, 140],
      [7,  20, 'rouge', 'en_cours', 6,   null],
      [8,  23, 'rouge', 'nouveau',  48,  null],
      [9,  59, 'rouge', 'nouveau',  4,   null],
      [10, 69, 'rouge', 'en_cours', 6,   null],
      // Orange alerts
      [11, 2,  'orange', 'nouveau',  5,   null],
      [12, 6,  'orange', 'en_cours', 36,  null],
      [13, 9,  'orange', 'traite',   48,  24],
      [14, 14, 'orange', 'nouveau',  60,  null],
      [15, 32, 'orange', 'en_cours', 6,   null],
      [16, 34, 'orange', 'nouveau',  12,  null],
      [17, 58, 'orange', 'en_cours', 24,  null],
      [18, 64, 'orange', 'traite',   48,  12],
      [19, 89, 'orange', 'nouveau',  12,  null],
      [20, 91, 'orange', 'nouveau',  6,   null],
      [21, 95, 'orange', 'en_cours', 12,  null],
      [22, 98, 'orange', 'nouveau',  6,   null],
      // Jaune alerts
      [23, 7,  'jaune', 'traite',   72,  48],
      [24, 10, 'jaune', 'traite',   96,  72],
      [25, 26, 'jaune', 'nouveau',  12,  null],
    ];
    for (const [n, sigIdx, sev, status, hAgoC, hAgoT] of alerts) {
      await pg.query(`
        INSERT INTO alerts (id, company_id, signal_id, severity, status, created_at, treated_at)
        VALUES ($1, $2, $3, $4::severity, $5::alert_status, $6, $7)
        ON CONFLICT (id) DO NOTHING
      `, [uuid('f0000000', n), COMPANY_ID, uuid('e0000000', sigIdx), sev, status, hoursAgo(hAgoC), hAgoT ? hoursAgo(hAgoT) : null]);
    }
    console.log(`  [OK] ${alerts.length} alerts`);

    // ===================================================================
    // STEP 7: Needs (15)
    // ===================================================================
    console.log('\n--- Step 7: Needs (15) ---');
    const needs = [
      [1,  'Delais de livraison trop longs',       47, 22, 'up',     1],
      [2,  'Manque de disponibilite stock',         38, 18, 'up',     2],
      [3,  'Demande de remise sur volume',          35,  0, 'stable', 3],
      [4,  'Besoin formation produit',              28,  0, 'new',    4],
      [5,  'SAV peu reactif',                       21, -8, 'down',   5],
      [6,  'Catalogue numerique demande',           19, 12, 'up',     6],
      [7,  'Integration ERP/API',                   18, 15, 'up',     7],
      [8,  'Portail commande en ligne',             16, 10, 'new',    8],
      [9,  'Conditionnement adapte',                14,  5, 'up',     9],
      [10, 'Accompagnement technique terrain',      12,  0, 'stable', 10],
      [11, 'Garantie etendue',                      10,  8, 'new',    11],
      [12, 'Livraison le samedi',                    9,  3, 'up',     12],
      [13, 'Personnalisation produit',               8,  0, 'new',    13],
      [14, 'Facturation mensuelle',                  7, -2, 'down',   14],
      [15, 'Documentation technique a jour',         6,  0, 'stable', 15],
    ];
    for (const [n, label, mentions, evolution, trend, rank] of needs) {
      await pg.query(`
        INSERT INTO needs (id, company_id, label, mentions, evolution, trend, rank_order)
        VALUES ($1, $2, $3, $4, $5, $6::need_trend, $7)
        ON CONFLICT (id) DO NOTHING
      `, [uuid('f1000000', n), COMPANY_ID, label, mentions, evolution, trend, rank]);
    }
    console.log(`  [OK] ${needs.length} needs`);

    // ===================================================================
    // STEP 8: Abbreviations (15)
    // ===================================================================
    console.log('\n--- Step 8: Abbreviations (15) ---');
    const abbreviations = [
      [1,  'CR',  'Compte-Rendu',                          'commercial'],
      [2,  'SAV', 'Service Apres-Vente',                   'general'],
      [3,  'KAM', 'Key Account Manager',                   'commercial'],
      [4,  'CA',  'Chiffre d\'Affaires',                   'commercial'],
      [5,  'AO',  'Appel d\'Offres',                       'commercial'],
      [6,  'NPS', 'Net Promoter Score',                    'commercial'],
      [7,  'PME', 'Petite et Moyenne Entreprise',          'organisation'],
      [8,  'ETI', 'Entreprise de Taille Intermediaire',    'organisation'],
      [9,  'DG',  'Directeur General',                     'organisation'],
      [10, 'DAF', 'Directeur Administratif et Financier',  'organisation'],
      [11, 'DA',  'Directeur Achat',                       'organisation'],
      [12, 'ERP', 'Enterprise Resource Planning',          'technique'],
      [13, 'API', 'Application Programming Interface',     'technique'],
      [14, 'RDV', 'Rendez-vous',                           'general'],
      [15, 'ROI', 'Return On Investment',                  'commercial'],
    ];
    for (const [n, short, full, cat] of abbreviations) {
      await pg.query(`
        INSERT INTO abbreviations (id, company_id, short, "full", category)
        VALUES ($1, $2, $3, $4, $5::abbrev_category)
        ON CONFLICT (id) DO NOTHING
      `, [uuid('f2000000', n), COMPANY_ID, short, full, cat]);
    }
    console.log(`  [OK] ${abbreviations.length} abbreviations`);

    // ===================================================================
    // STEP 9: Deals marketing (20)
    // ===================================================================
    console.log('\n--- Step 9: Deals marketing (20) ---');
    const dealsMarketing = [
      [1,  'prix',       'perdu',   'Acme',     'Thomas D.',  'Dupont Industries',    'Nord',      dateStr(2),  'Client a choisi Acme car 12% moins cher sur la gamme standard'],
      [2,  'relation',   'gagne',   null,       'Emma V.',    'BioSante Plus',        'IDF',       dateStr(3),  'Relation de confiance avec le DG - renouvellement sans AO'],
      [3,  'produit',    'perdu',   'Bexor',    'Antoine G.', 'SudFrance Logistique', 'Sud-Ouest', dateStr(5),  'Bexor propose un bundle produit+maintenance plus adapte'],
      [4,  'prix',       'perdu',   'Acme',     'Lucas M.',   'Horizon Distribution', 'Est',       dateStr(8),  'Impossible de matcher le prix Acme, engagement 3 ans trop contraignant'],
      [5,  'timing',     'perdu',   null,       'Hugo T.',    'NovaTech',             'Sud-Ouest', dateStr(10), 'Projet reporte au Q3, budget gele par la direction'],
      [6,  'relation',   'gagne',   null,       'Clara S.',   'Transco Group',        'IDF',       dateStr(11), 'Le client valorise notre reactivite et la qualite du suivi'],
      [7,  'concurrent', 'perdu',   'IndusPro', 'Pierre B.',  'MecanoParts',          'Sud',       dateStr(4),  'IndusPro mieux positionne sur le segment industriel lourd'],
      [8,  'offre',      'gagne',   null,       'Marc D.',    'AgroVert',             'Ouest',     dateStr(6),  'Notre offre package avec formation a fait la difference'],
      [9,  'prix',       'perdu',   'Acme',     'Maxime R.',  'MetalPro',             'Nord',      dateStr(7),  'Acme -15% avec engagement 2 ans, impossible a concurrencer'],
      [10, 'budget',     'perdu',   null,       'Ines D.',    'NovaTech',             'Sud-Ouest', dateStr(12), 'Budget client coupe suite a restructuration interne'],
      [11, 'produit',    'gagne',   null,       'Lucas M.',   'EnergiePlus',          'Est',       dateStr(9),  'Notre gamme Pro mieux adaptee que la concurrence'],
      [12, 'relation',   'gagne',   null,       'Thomas D.',  'Groupe Mercier',       'Nord',      dateStr(1),  'Renouvellement grace a la relation commerciale historique'],
      [13, 'prix',       'en_cours','Bexor',    'Antoine G.', 'SudFrance Logistique', 'Sud-Ouest', dateStr(3),  'Negociation en cours, Bexor a -8% mais SAV inferieur'],
      [14, 'concurrent', 'perdu',   'Bexor',    'Ines D.',    'NovaTech',             'Sud-Ouest', dateStr(7),  'Bexor a remporte le marche avec un bundle imbattable'],
      [15, 'timing',     'en_cours',null,       'Hugo T.',    'TechnoSud',            'Sud-Est',   dateStr(2),  'Decision prevue fin avril - on est bien positionnes'],
      [16, 'offre',      'gagne',   null,       'Emma V.',    'DistribExpress',       'IDF',       dateStr(5),  'L\'offre logistique integree a convaincu le comite achat'],
      [17, 'prix',       'perdu',   'VeloCom',  'Marc D.',    'Bertrand & Fils',      'Ouest',     dateStr(14), 'VeloCom a propose un prix imbattable avec livraison gratuite'],
      [18, 'relation',   'gagne',   null,       'Sarah R.',   'Dupont Industries',    'Nord',      dateStr(15), 'Retention reussie grace a un plan de fidelisation personnalise'],
      [19, 'autre',      'perdu',   null,       'Pierre B.',  'MecanoParts',          'Sud',       dateStr(6),  'Le client a change d\'interlocuteur interne, perte de contact'],
      [20, 'produit',    'en_cours',null,       'Hugo T.',    'TechnoSud',            'Sud-Est',   dateStr(1),  'Le client teste notre nouveau produit. Decision dans 2 semaines'],
    ];
    for (const [n, motif, resultat, concurrent, comm, client, region, date, verbatim] of dealsMarketing) {
      await pg.query(`
        INSERT INTO deals_marketing (id, company_id, motif_principal, resultat, concurrent_nom, commercial_name, client_name, region, date, verbatim)
        VALUES ($1, $2, $3::deal_motif, $4::statut_deal, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (id) DO NOTHING
      `, [uuid('f3000000', n), COMPANY_ID, motif, resultat, concurrent, comm, client, region, date, verbatim]);
    }
    console.log(`  [OK] ${dealsMarketing.length} deals_marketing`);

    // ===================================================================
    // STEP 10: Deals commerciaux (20)
    // ===================================================================
    console.log('\n--- Step 10: Deals commerciaux (20) ---');
    const dealsCommerciaux = [
      [1,  'prix_non_competitif',          'perdu',   'Acme',     'Thomas D.',  'Dupont Industries',    'Nord',      dateStr(2),  'Notre tarif 12% au-dessus, pas de marge de negociation possible'],
      [2,  'relation_insuffisante',        'gagne',   null,       'Emma V.',    'BioSante Plus',        'IDF',       dateStr(3),  'Suivi regulier et reactivite ont fait la difference'],
      [3,  'besoin_mal_identifie',         'perdu',   'Bexor',    'Antoine G.', 'SudFrance Logistique', 'Sud-Ouest', dateStr(5),  'On a propose la mauvaise gamme, Bexor avait mieux compris le besoin'],
      [4,  'prix_non_competitif',          'perdu',   'Acme',     'Lucas M.',   'Horizon Distribution', 'Est',       dateStr(8),  'Ecart de prix trop important, le client ne pouvait pas justifier'],
      [5,  'timing_rate',                  'perdu',   null,       'Hugo T.',    'NovaTech',             'Sud-Ouest', dateStr(10), 'Arrivee trop tard dans le cycle de decision'],
      [6,  'relation_insuffisante',        'gagne',   null,       'Clara S.',   'Transco Group',        'IDF',       dateStr(11), 'Visites regulieres et accompagnement technique apprecies'],
      [7,  'concurrent_mieux_positionne',  'perdu',   'IndusPro', 'Pierre B.',  'MecanoParts',          'Sud',       dateStr(4),  'IndusPro avait une solution industrielle cle en main'],
      [8,  'suivi_insuffisant',            'perdu',   null,       'Pierre B.',  'MecanoParts',          'Sud',       dateStr(6),  'Pas assez de visites, le client s\'est senti delaisse'],
      [9,  'prix_non_competitif',          'perdu',   'Acme',     'Maxime R.',  'MetalPro',             'Nord',      dateStr(7),  'Acme -15% impossible a contrer sans detruire la marge'],
      [10, 'timing_rate',                  'perdu',   null,       'Ines D.',    'NovaTech',             'Sud-Ouest', dateStr(12), 'Budget gele avant qu\'on ait pu finaliser la proposition'],
      [11, 'relation_insuffisante',        'gagne',   null,       'Lucas M.',   'EnergiePlus',          'Est',       dateStr(9),  'Accompagnement technique superieur reconnu par le client'],
      [12, 'relation_insuffisante',        'gagne',   null,       'Thomas D.',  'Groupe Mercier',       'Nord',      dateStr(1),  'Historique relationnel et confiance construite sur 5 ans'],
      [13, 'prix_non_competitif',          'en_cours','Bexor',    'Antoine G.', 'SudFrance Logistique', 'Sud-Ouest', dateStr(3),  'En negociation, on essaie de jouer sur le SAV inclus'],
      [14, 'besoin_mal_identifie',         'perdu',   'Bexor',    'Ines D.',    'NovaTech',             'Sud-Ouest', dateStr(7),  'On n\'avait pas vu que le client voulait un service integre'],
      [15, 'concurrent_mieux_positionne',  'en_cours',null,       'Hugo T.',    'TechnoSud',            'Sud-Est',   dateStr(2),  'On est en competition directe, notre offre technique est forte'],
      [16, 'relation_insuffisante',        'gagne',   null,       'Emma V.',    'DistribExpress',       'IDF',       dateStr(5),  'Proximite et reactivite ont convaincu le comite de direction'],
      [17, 'prix_non_competitif',          'perdu',   'VeloCom',  'Marc D.',    'Bertrand & Fils',      'Ouest',     dateStr(14), 'VeloCom inclut la livraison, notre offre globale est plus chere'],
      [18, 'suivi_insuffisant',            'gagne',   null,       'Sarah R.',   'Dupont Industries',    'Nord',      dateStr(15), 'Plan de rattrapage avec visites hebdomadaires qui a paye'],
      [19, 'concurrent_mieux_positionne',  'perdu',   null,       'Pierre B.',  'MecanoParts',          'Sud',       dateStr(6),  'Le concurrent avait une reference plus adaptee au besoin'],
      [20, 'besoin_mal_identifie',         'en_cours',null,       'Hugo T.',    'TechnoSud',            'Sud-Est',   dateStr(1),  'On a revu notre proposition apres retour client, en attente'],
    ];
    for (const [n, motif, resultat, concurrent, comm, client, region, date, verbatim] of dealsCommerciaux) {
      await pg.query(`
        INSERT INTO deals_commerciaux (id, company_id, motif, resultat, concurrent_nom, commercial_name, client_name, region, date, verbatim)
        VALUES ($1, $2, $3::motif_commercial, $4::statut_deal, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (id) DO NOTHING
      `, [uuid('f4000000', n), COMPANY_ID, motif, resultat, concurrent, comm, client, region, date, verbatim]);
    }
    console.log(`  [OK] ${dealsCommerciaux.length} deals_commerciaux`);

    // ===================================================================
    // STEP 11: CR Objectifs (30)
    // ===================================================================
    console.log('\n--- Step 11: CR Objectifs (30) ---');
    const crObjectifs = [
      [1,  1,  'Thomas D.',  'Dupont Industries',   'signature',     'atteint',     null,                        'Relation de confiance',           dateStr(1),  'Nord'],
      [2,  1,  'Thomas D.',  'MetalPro',            'sell_in',       'atteint',     null,                        'Produit adapte au besoin',        dateStr(2),  'Nord'],
      [3,  1,  'Thomas D.',  'Groupe Mercier',      'fidelisation',  'non_atteint', 'Concurrent deja en place',  null,                              dateStr(3),  'Nord'],
      [4,  7,  'Emma V.',    'BioSante Plus',       'signature',     'atteint',     null,                        'Besoin urgent client',            dateStr(1),  'IDF'],
      [5,  7,  'Emma V.',    'Transco Group',       'sell_out',      'atteint',     null,                        'Prix competitif',                 dateStr(2),  'IDF'],
      [6,  6,  'Lucas M.',   'Horizon Distribution','sell_in',       'non_atteint', 'Timing mauvais',            null,                              dateStr(2),  'Est'],
      [7,  6,  'Lucas M.',   'LogiPro SAS',         'fidelisation',  'atteint',     null,                        'Relation de confiance',           dateStr(4),  'Est'],
      [8,  8,  'Antoine G.', 'SudFrance Logistique','sell_in',       'atteint',     null,                        'Prix competitif',                 dateStr(2),  'Sud-Ouest'],
      [9,  8,  'Antoine G.', 'NovaTech',            'formation',     'atteint',     null,                        'Besoin urgent client',            dateStr(4),  'Sud-Ouest'],
      [10, 5,  'Pierre B.',  'MecanoParts',         'sell_out',      'non_atteint', 'Client pas interesse',      null,                              dateStr(1),  'Sud'],
      [11, 2,  'Sarah R.',   'Dupont Industries',   'sell_in',       'atteint',     null,                        'Suivi rigoureux',                 dateStr(3),  'Nord'],
      [12, 2,  'Sarah R.',   'MetalPro',            'decouverte',    'atteint',     null,                        'Contact receptif',                dateStr(5),  'Nord'],
      [13, 3,  'Julie L.',   'BioSante Plus',       'sell_out',      'non_atteint', 'Budget insuffisant',        null,                              dateStr(2),  'IDF'],
      [14, 4,  'Marc D.',    'Bertrand & Fils',     'fidelisation',  'atteint',     null,                        'Historique relationnel',           dateStr(3),  'Ouest'],
      [15, 4,  'Marc D.',    'AgroVert',            'sell_in',       'atteint',     null,                        'Offre adaptee',                   dateStr(5),  'Ouest'],
      [16, 9,  'Clara S.',   'DistribExpress',      'signature',     'atteint',     null,                        'Reactivite commerciale',          dateStr(1),  'IDF'],
      [17, 9,  'Clara S.',   'Transco Group',       'fidelisation',  'atteint',     null,                        'Qualite de suivi',                dateStr(4),  'IDF'],
      [18, 10, 'Maxime R.',  'Groupe Mercier',      'sell_in',       'non_atteint', 'Produit pas adapte',        null,                              dateStr(2),  'Nord'],
      [19, 10, 'Maxime R.',  'MetalPro',            'decouverte',    'non_atteint', 'Interlocuteur absent',      null,                              dateStr(6),  'Nord'],
      [20, 11, 'Ines D.',    'NovaTech',            'sell_out',      'non_atteint', 'Concurrent plus reactif',   null,                              dateStr(3),  'Sud-Ouest'],
      [21, 11, 'Ines D.',    'SudFrance Logistique','formation',     'atteint',     null,                        'Equipe motivee',                  dateStr(5),  'Sud-Ouest'],
      [22, 12, 'Hugo T.',    'TechnoSud',           'sell_in',       'atteint',     null,                        'Produit innovant',                dateStr(1),  'Sud-Est'],
      [23, 12, 'Hugo T.',    'TechnoSud',           'signature',     'en_cours' === 'en_cours' ? 'atteint' : 'non_atteint', null, 'Bon timing',    dateStr(3),  'Sud-Est'],
      [24, 6,  'Lucas M.',   'EnergiePlus',         'sell_in',       'atteint',     null,                        'Besoin identifie en amont',       dateStr(6),  'Est'],
      [25, 7,  'Emma V.',    'DistribExpress',      'sell_out',      'atteint',     null,                        'Volume interessant',              dateStr(7),  'IDF'],
      [26, 1,  'Thomas D.',  'Dupont Industries',   'sell_out',      'non_atteint', 'Prix non competitif',       null,                              dateStr(8),  'Nord'],
      [27, 5,  'Pierre B.',  'MecanoParts',         'fidelisation',  'non_atteint', 'Manque de visite',          null,                              dateStr(4),  'Sud'],
      [28, 8,  'Antoine G.', 'SudFrance Logistique','sell_out',      'atteint',     null,                        'Reactivite',                      dateStr(6),  'Sud-Ouest'],
      [29, 4,  'Marc D.',    'AgroVert',            'decouverte',    'atteint',     null,                        'Nouveau besoin detecte',          dateStr(7),  'Ouest'],
      [30, 3,  'Julie L.',   'BioSante Plus',       'formation',     'atteint',     null,                        'Demande client forte',            dateStr(3),  'IDF'],
    ];
    for (const [n, comIdx, comName, client, objType, resultat, cause, facteur, date, region] of crObjectifs) {
      await pg.query(`
        INSERT INTO cr_objectifs (id, company_id, commercial_id, commercial_name, client_name, objectif_type, resultat, cause_echec, facteur_reussite, date, region)
        VALUES ($1, $2, $3, $4, $5, $6::objectif_type, $7::objectif_resultat, $8, $9, $10, $11)
        ON CONFLICT (id) DO NOTHING
      `, [uuid('f5000000', n), COMPANY_ID, uuid('c0000000', comIdx), comName, client, objType, resultat, cause, facteur, date, region]);
    }
    console.log(`  [OK] ${crObjectifs.length} cr_objectifs`);

    // ===================================================================
    // STEP 12: Prix signals (20)
    // ===================================================================
    console.log('\n--- Step 12: Prix signals (20) ---');
    const prixSignals = [
      [1,  'Acme',     -12, 'inferieur', 'perdu',    'Thomas D.',  'Dupont Industries',    'Nord',      'Acme propose 12% moins cher sur la gamme standard',               dateStr(1)],
      [2,  'Acme',     -15, 'inferieur', 'perdu',    'Maxime R.',  'MetalPro',             'Nord',      'Acme a sorti un tarif a -15% avec engagement 2 ans',              dateStr(2)],
      [3,  'Bexor',    -8,  'inferieur', 'en_cours', 'Antoine G.', 'SudFrance Logistique', 'Sud-Ouest', 'Bexor affiche -8% sur le bundle produit+service',                 dateStr(3)],
      [4,  'TechPro',   5,  'superieur', 'gagne',    'Emma V.',    'BioSante Plus',        'IDF',       'TechPro 5% plus cher, client revient chez nous pour le SAV',      dateStr(4)],
      [5,  'Acme',     -10, 'inferieur', 'en_cours', 'Lucas M.',   'Horizon Distribution', 'Est',       'Acme a -10% avec service inclus, negociation en cours',           dateStr(5)],
      [6,  'IndusPro', -7,  'inferieur', 'perdu',    'Pierre B.',  'MecanoParts',          'Sud',       'IndusPro moins cher sur la gamme industrielle lourde',             dateStr(3)],
      [7,  'Acme',     -12, 'inferieur', 'perdu',    'Sarah R.',   'Dupont Industries',    'Nord',      'Acme maintient sa pression sur Dupont avec -12% sur tout',         dateStr(6)],
      [8,  'Bexor',    -12, 'inferieur', 'perdu',    'Ines D.',    'NovaTech',             'Sud-Ouest', 'Bexor a propose -12% avec bundle, deal perdu',                    dateStr(7)],
      [9,  'Proxio',   -5,  'inferieur', 'en_cours', 'Clara S.',   'DistribExpress',       'IDF',       'Proxio 5% en dessous mais SAV moins bon, client hesite',          dateStr(4)],
      [10, 'TechPro',  -10, 'inferieur', 'en_cours', 'Lucas M.',   'LogiPro SAS',          'Est',       'TechPro a baisse de 10%, on doit repondre',                       dateStr(8)],
      [11, 'VeloCom',  -3,  'inferieur', 'perdu',    'Marc D.',    'Bertrand & Fils',      'Ouest',     'VeloCom 3% moins cher avec livraison gratuite incluse',            dateStr(10)],
      [12, 'Acme',     -18, 'inferieur', 'en_cours', 'Thomas D.',  'Dupont Industries',    'Nord',      'Acme monte a -18% pour forcer la decision chez Dupont',            dateStr(0)],
      [13, 'IndusPro', -5,  'inferieur', 'en_cours', 'Hugo T.',    'TechnoSud',            'Sud-Est',   'IndusPro aligne ses prix pour le marche Sud-Est',                  dateStr(2)],
      [14, 'Bexor',    -10, 'inferieur', 'perdu',    'Antoine G.', 'NovaTech',             'Sud-Ouest', 'Bexor a offert -10% avec maintenance 2 ans',                       dateStr(7)],
      [15, 'Acme',     -8,  'inferieur', 'en_cours', 'Maxime R.',  'Groupe Mercier',       'Nord',      'Acme tente -8% chez Mercier, on defend avec la qualite',           dateStr(3)],
      [16, 'TechPro',  -20, 'inferieur', 'en_cours', 'Lucas M.',   'EnergiePlus',          'Est',       'TechPro en promo temporaire -20%, tres agressif',                  dateStr(1)],
      [17, 'Proxio',   -6,  'inferieur', 'gagne',    'Emma V.',    'Transco Group',        'IDF',       'Proxio a propose -6% mais client prefere notre qualite de service', dateStr(9)],
      [18, 'VeloCom',  -5,  'inferieur', 'en_cours', 'Sarah R.',   'Groupe Mercier',       'Nord',      'VeloCom tente de percer dans le Nord avec -5% et livraison J+1',    dateStr(5)],
      [19, 'IndusPro', -8,  'inferieur', 'perdu',    'Pierre B.',  'MecanoParts',          'Sud',       'IndusPro a signe avec MecanoParts a -8%',                           dateStr(4)],
      [20, 'Bexor',    -15, 'inferieur', 'en_cours', 'Ines D.',    'SudFrance Logistique', 'Sud-Ouest', 'Bexor propose -15% a SudFrance avec maintenance incluse',            dateStr(1)],
    ];
    for (const [n, conc, ecart, ecartType, statut, comm, client, region, verbatim, date] of prixSignals) {
      await pg.query(`
        INSERT INTO prix_signals (id, company_id, concurrent_nom, ecart_pct, ecart_type, statut_deal, commercial_name, client_name, region, verbatim, date)
        VALUES ($1, $2, $3, $4, $5::ecart_type, $6::statut_deal, $7, $8, $9, $10, $11)
        ON CONFLICT (id) DO NOTHING
      `, [uuid('fb000000', n), COMPANY_ID, conc, ecart, ecartType, statut, comm, client, region, verbatim, date]);
    }
    console.log(`  [OK] ${prixSignals.length} prix_signals`);

    // ===================================================================
    // STEP 13: Offres concurrentes (10)
    // ===================================================================
    console.log('\n--- Step 13: Offres concurrentes (10) ---');
    const offres = [
      [1,  'Acme',     'promotion',           'Remise de 12% sur toute la gamme standard',                dateStr(30), 38, 8, 6, 'Nord',      'Industrie',     'active'],
      [2,  'Bexor',    'bundle',              'Bundle produit + maintenance 2 ans incluse',               dateStr(20), 28, 6, 5, 'Sud-Ouest', 'Logistique',    'active'],
      [3,  'TechPro',  'promotion',           'Promotion temporaire -20% jusqu\'a fin avril',             dateStr(10), 15, 4, 2, 'Est',       'Distribution',  'active'],
      [4,  'Proxio',   'bundle',              'Offre bundle avec IA integree pour la gestion de stock',   dateStr(25), 12, 3, 1, 'IDF',       'Tech',          'active'],
      [5,  'IndusPro', 'nouvelle_gamme',      'Nouvelle gamme specialisee industrie lourde',              dateStr(15), 10, 4, 3, 'Sud',       'Industrie',     'active'],
      [6,  'VeloCom',  'conditions_paiement', 'Livraison J+1 gratuite + paiement 60 jours',              dateStr(18), 8,  2, 0, 'Ouest',     'Distribution',  'active'],
      [7,  'Acme',     'essai_gratuit',       'Essai gratuit 3 mois sur gamme Pro',                       dateStr(8),  22, 5, 3, 'National',  'Multi-secteur', 'active'],
      [8,  'Bexor',    'nouvelle_gamme',      'Extension de gamme avec 3 nouveaux produits',              dateStr(5),  15, 3, 2, 'Sud-Ouest', 'Logistique',    'active'],
      [9,  'TechPro',  'promotion',           'Refonte SAV avec engagement 48h max',                     dateStr(12), 10, 2, 0, 'Est',       'Multi-secteur', 'active'],
      [10, 'Acme',     'promotion',           'Tarif -18% avec service inclus chez grands comptes',       dateStr(3),  30, 10, 7, 'Nord',     'Industrie',     'active'],
    ];
    for (const [n, conc, typeOffre, desc, datePremiere, mentions, impactes, perdus, region, secteur, statut] of offres) {
      await pg.query(`
        INSERT INTO offres_concurrentes (id, company_id, concurrent_nom, type_offre, description, date_premiere_mention, count_mentions, deals_impactes, deals_perdus, deals_gagnes, region, secteur, statut)
        VALUES ($1, $2, $3, $4::offre_type, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (id) DO NOTHING
      `, [uuid('fd000000', n), COMPANY_ID, conc, typeOffre, desc, datePremiere, mentions, impactes, perdus, Math.max(0, impactes - perdus), region, secteur, statut]);
    }
    console.log(`  [OK] ${offres.length} offres_concurrentes`);

    // ===================================================================
    // STEP 14: Comm concurrentes (10)
    // ===================================================================
    console.log('\n--- Step 14: Comm concurrentes (10) ---');
    const commConc = [
      [1,  'Acme',     'emailing',    'Campagne emailing massive sur la base clients Nord',                    'negative',  dateStr(5),  18, 'Nord'],
      [2,  'Bexor',    'salon',       'Stand imposant au salon Logistique de Bordeaux',                        'positive',  dateStr(12), 12, 'Sud-Ouest'],
      [3,  'TechPro',  'pub',         'Campagne pub radio regionale en Est sur le theme du SAV',               'neutre',    dateStr(8),  8,  'Est'],
      [4,  'Proxio',   'social',      'Campagne LinkedIn ciblee avec temoignages clients IDF',                 'positive',  dateStr(15), 10, 'IDF'],
      [5,  'IndusPro', 'salon',       'Presence au salon Industrie Lyon avec demos live',                      'positive',  dateStr(10), 6,  'Sud-Est'],
      [6,  'VeloCom',  'emailing',    'Offre flash par email: livraison gratuite pendant 1 mois',              'negative',  dateStr(3),  8,  'National'],
      [7,  'Acme',     'sponsoring',  'Sponsoring evenement professionnel industrie Nord',                     'neutre',    dateStr(20), 15, 'Nord'],
      [8,  'Bexor',    'partenariat', 'Partenariat avec transporteur regional pour offre tout-inclus',         'negative',  dateStr(7),  10, 'Sud-Ouest'],
      [9,  'TechPro',  'presse',      'Article dans Industrie Magazine sur leur refonte SAV',                  'neutre',    dateStr(14), 5,  'National'],
      [10, 'Acme',     'pub',         'Publicite Google Ads sur les termes de nos produits phares',            'negative',  dateStr(2),  22, 'National'],
    ];
    for (const [n, conc, typeAction, desc, reaction, date, mentions, region] of commConc) {
      await pg.query(`
        INSERT INTO comm_concurrentes (id, company_id, concurrent_nom, type_action, description, reaction_client, date, count_mentions, region)
        VALUES ($1, $2, $3, $4::comm_type, $5, $6::reaction_client, $7, $8, $9)
        ON CONFLICT (id) DO NOTHING
      `, [uuid('fe000000', n), COMPANY_ID, conc, typeAction, desc, reaction, date, mentions, region]);
    }
    console.log(`  [OK] ${commConc.length} comm_concurrentes`);

    // ===================================================================
    // STEP 15: Positionnement (36 — 6 competitors x 6 attributes)
    // ===================================================================
    console.log('\n--- Step 15: Positionnement (36) ---');
    const posData = [
      // Acme
      ['Acme', 'prix', 'fort', 38], ['Acme', 'qualite', 'moyen', 20], ['Acme', 'sav', 'faible', 15],
      ['Acme', 'delai', 'moyen', 12], ['Acme', 'relation', 'faible', 8], ['Acme', 'innovation', 'moyen', 10],
      // Bexor
      ['Bexor', 'prix', 'fort', 28], ['Bexor', 'qualite', 'moyen', 18], ['Bexor', 'sav', 'moyen', 14],
      ['Bexor', 'delai', 'fort', 10], ['Bexor', 'relation', 'moyen', 8], ['Bexor', 'innovation', 'fort', 12],
      // TechPro
      ['TechPro', 'prix', 'moyen', 15], ['TechPro', 'qualite', 'moyen', 12], ['TechPro', 'sav', 'faible', 22],
      ['TechPro', 'delai', 'moyen', 8], ['TechPro', 'relation', 'moyen', 6], ['TechPro', 'innovation', 'moyen', 5],
      // Proxio
      ['Proxio', 'prix', 'moyen', 10], ['Proxio', 'qualite', 'fort', 8], ['Proxio', 'sav', 'moyen', 6],
      ['Proxio', 'delai', 'moyen', 5], ['Proxio', 'relation', 'fort', 7], ['Proxio', 'innovation', 'fort', 15],
      // IndusPro
      ['IndusPro', 'prix', 'moyen', 8], ['IndusPro', 'qualite', 'fort', 10], ['IndusPro', 'sav', 'moyen', 6],
      ['IndusPro', 'delai', 'moyen', 4], ['IndusPro', 'relation', 'moyen', 5], ['IndusPro', 'innovation', 'moyen', 3],
      // Nous (Notre entreprise)
      ['Notre entreprise', 'prix', 'moyen', 35], ['Notre entreprise', 'qualite', 'fort', 40], ['Notre entreprise', 'sav', 'fort', 30],
      ['Notre entreprise', 'delai', 'moyen', 25], ['Notre entreprise', 'relation', 'fort', 35], ['Notre entreprise', 'innovation', 'moyen', 20],
    ];
    let posN = 0;
    for (const [acteur, attribut, valeur, count] of posData) {
      posN++;
      await pg.query(`
        INSERT INTO positionnement (id, company_id, acteur, attribut, valeur, count)
        VALUES ($1, $2, $3, $4::attribut_pos, $5::valeur_percue, $6)
        ON CONFLICT (id) DO NOTHING
      `, [uuid('ff000000', posN), COMPANY_ID, acteur, attribut, valeur, count]);
    }
    console.log(`  [OK] ${posN} positionnement entries`);

    // ===================================================================
    // STEP 16: Geo sector data (21 — 7 regions x 3 sectors)
    // ===================================================================
    console.log('\n--- Step 16: Geo sector data (21) ---');
    const geoSectorData = [
      ['Industrie',    'Nord',      12, 8, 5, 85],
      ['Distribution', 'Nord',      8,  5, 3, 65],
      ['Logistique',   'Nord',      3,  4, 2, 42],
      ['Tech',         'IDF',       5,  10, 8, 78],
      ['Distribution', 'IDF',       6,  7, 6, 72],
      ['Sante',        'IDF',       2,  5, 4, 55],
      ['Industrie',    'Est',       8,  6, 4, 68],
      ['Distribution', 'Est',       5,  4, 3, 52],
      ['Energie',      'Est',       3,  3, 2, 38],
      ['Artisanat',    'Ouest',     2,  5, 3, 45],
      ['Agriculture',  'Ouest',     3,  4, 4, 50],
      ['Distribution', 'Ouest',     4,  3, 2, 38],
      ['Industrie',    'Sud',       6,  3, 2, 55],
      ['Logistique',   'Sud',       2,  2, 1, 25],
      ['Industrie',    'Sud-Ouest', 4,  5, 3, 52],
      ['Logistique',   'Sud-Ouest', 5,  4, 3, 58],
      ['Tech',         'Sud-Ouest', 3,  3, 2, 35],
      ['Tech',         'Sud-Est',   4,  4, 3, 48],
      ['Industrie',    'Sud-Est',   3,  2, 2, 32],
      ['Distribution', 'Sud-Est',   2,  3, 2, 28],
      ['Energie',      'Sud-Est',   1,  2, 1, 18],
    ];
    let geoN = 0;
    for (const [secteur, region, conc, besoins, opp, score] of geoSectorData) {
      geoN++;
      await pg.query(`
        INSERT INTO geo_sector_data (id, company_id, secteur, region, signaux_concurrence, signaux_besoins, signaux_opportunites, score_intensite)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO NOTHING
      `, [uuid('f0100000', geoN), COMPANY_ID, secteur, region, conc, besoins, opp, score]);
    }
    console.log(`  [OK] ${geoN} geo_sector_data`);

    // ===================================================================
    // STEP 17: Geo points (14 — 2 per region)
    // ===================================================================
    console.log('\n--- Step 17: Geo points (14) ---');
    const geoPoints = [
      ['Nord',      '59',   12, 5,  15, 8,  85],
      ['Nord',      '62',   8,  3,  10, 5,  65],
      ['IDF',       '75',   6,  2,  5,  10, 72],
      ['IDF',       '92',   4,  1,  3,  7,  55],
      ['Est',       '67',   8,  4,  8,  6,  68],
      ['Est',       '54',   5,  3,  5,  4,  48],
      ['Ouest',     '44',   3,  2,  4,  5,  45],
      ['Ouest',     '35',   2,  1,  3,  4,  38],
      ['Sud',       '13',   6,  4,  5,  3,  55],
      ['Sud',       '34',   3,  2,  2,  2,  32],
      ['Sud-Ouest', '33',   5,  3,  6,  4,  58],
      ['Sud-Ouest', '31',   4,  2,  4,  3,  45],
      ['Sud-Est',   '69',   4,  2,  4,  4,  48],
      ['Sud-Est',   '38',   2,  1,  3,  3,  32],
    ];
    let gpN = 0;
    for (const [region, dept, opp, risques, conc, besoins, intensite] of geoPoints) {
      gpN++;
      await pg.query(`
        INSERT INTO geo_points (id, company_id, region, dept, opportunites, risques, concurrence, besoins, intensite)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO NOTHING
      `, [uuid('f0200000', gpN), COMPANY_ID, region, dept, opp, risques, conc, besoins, intensite]);
    }
    console.log(`  [OK] ${gpN} geo_points`);

    // ===================================================================
    // STEP 18: Territoires (7)
    // ===================================================================
    console.log('\n--- Step 18: Territoires (7) ---');
    const territoires = [
      [1, 'Nord',      ['Thomas D.', 'Sarah R.', 'Maxime R.'], 85, 'negatif',  22, 5, 5, 'hausse', 92,
        ['Client interesse par gamme Pro', 'Nouveau besoin formation technique', 'Upsell detecte Dupont 45K'],
        ['Acme agressif -12% a -18%', 'Client menace de changer de fournisseur', 'VeloCom approche 2 comptes']],
      [2, 'IDF',       ['Julie L.', 'Emma V.', 'Clara S.'], 78, 'positif', 10, 6, 1, 'baisse', 45,
        ['Fort interet demo gamme Pro', 'Upsell detecte sur 3 comptes', 'Referencement grande distribution'],
        ['Proxio detecte sur 2 comptes']],
      [3, 'Est',       ['Lucas M.'], 68, 'neutre', 14, 4, 3, 'stable', 72,
        ['Appel d\'offres 200K EnergiePlus', 'Client interesse par API ERP', 'Reconquete ex-client TechPro'],
        ['TechPro en reconquete -20%', 'IndusPro signe EnergiePlus']],
      [4, 'Ouest',     ['Marc D.'], 48, 'positif', 8, 3, 1, 'stable', 35,
        ['AgroVert ouverture nouveau site', 'Prescription architecte 60K'],
        ['VeloCom s\'installe avec depot logistique']],
      [5, 'Sud',       ['Pierre B.'], 32, 'negatif', 12, 1, 4, 'hausse', 88,
        ['Contact salon prometteur'],
        ['IndusPro demarchage actif', 'MecanoParts menace de partir', 'Bexor offre exclusive -15%', 'Lot defectueux MecanoParts']],
      [6, 'Sud-Ouest', ['Antoine G.', 'Ines D.'], 52, 'negatif', 16, 3, 3, 'hausse', 78,
        ['Ouverture nouveau site client en mai', 'Partenariat formation pro'],
        ['Bexor demarchage agressif avec bundle', 'NovaTech perdu a Bexor', 'Budget gele NovaTech']],
      [7, 'Sud-Est',   ['Hugo T.'], 42, 'neutre', 8, 3, 1, 'stable', 48,
        ['TechnoSud extension contrat +120K', 'Salon Industrie Lyon contact', 'Nouveau produit en test'],
        ['IndusPro partenariat TechnoSud']],
    ];
    for (const [n, terr, comNames, nbCr, sentDom, nbMentions, nbOpp, nbRisques, tendance, score, motifsOpp, motifsRisque] of territoires) {
      await pg.query(`
        INSERT INTO territoires (id, company_id, territoire, commercial_names, nb_cr, sentiment_dominant, nb_mentions_concurrents, nb_opportunites, nb_risques_perte, tendance_vs_mois_precedent, score_priorite, motifs_opportunite, motifs_risque)
        VALUES ($1, $2, $3, $4, $5, $6::sentiment_type, $7, $8, $9, $10::trend_direction, $11, $12, $13)
        ON CONFLICT (id) DO NOTHING
      `, [uuid('f6000000', n), COMPANY_ID, terr, comNames, nbCr, sentDom, nbMentions, nbOpp, nbRisques, tendance, score, motifsOpp, motifsRisque]);
    }
    console.log(`  [OK] ${territoires.length} territoires`);

    // ===================================================================
    // STEP 19: Region profiles (7)
    // ===================================================================
    console.log('\n--- Step 19: Region profiles (7) ---');
    const regionProfiles = [
      [1, 'Nord',      ['Delais de livraison courts', 'Remise sur volume', 'SAV reactif'],               'Acme',     22, 'negatif', 'Forte sensibilite aux delais et prix. Tissu industriel dense. Acme tres agressif.', 85],
      [2, 'IDF',       ['Catalogue numerique', 'Integration API ERP', 'Formation produit'],              'Proxio',   10, 'positif', 'Demande technologique forte. Clients attendent des outils digitaux et self-service.', 78],
      [3, 'Est',       ['Disponibilite stock', 'Integration ERP SAP', 'Livraison express'],              'TechPro',  14, 'neutre',  'Tissu industriel dense. Clients comparent systematiquement 3+ fournisseurs.', 68],
      [4, 'Ouest',     ['Accompagnement technique', 'Prix competitif', 'Documentation a jour'],         'VeloCom',  8,  'positif', 'Marche artisanal et agricole. Relation de proximite essentielle.', 48],
      [5, 'Sud',       ['Prix competitif', 'Qualite produit', 'Garantie etendue'],                      'IndusPro', 12, 'negatif', 'Zone a risque: concurrence forte et qualite contestee sur dernier lot.', 32],
      [6, 'Sud-Ouest', ['Prix competitif', 'Bundle produit+service', 'Accompagnement terrain'],         'Bexor',    16, 'negatif', 'Marche tres sensible au prix. Les bundles tout-inclus font la difference.', 52],
      [7, 'Sud-Est',   ['Innovation produit', 'Formation technique', 'Reactivite commerciale'],         'IndusPro', 8,  'neutre',  'Marche technologique en croissance. Besoin d\'innovation et de partenariats.', 42],
    ];
    for (const [n, region, topBesoins, concP, concM, sentDom, spec, nbSignaux] of regionProfiles) {
      await pg.query(`
        INSERT INTO region_profiles (id, company_id, region, top_besoins, concurrent_principal, concurrent_mentions, sentiment_dominant, specificite_locale, nb_signaux)
        VALUES ($1, $2, $3, $4, $5, $6, $7::sentiment_type, $8, $9)
        ON CONFLICT (id) DO NOTHING
      `, [uuid('f7000000', n), COMPANY_ID, region, topBesoins, concP, concM, sentDom, spec, nbSignaux]);
    }
    console.log(`  [OK] ${regionProfiles.length} region_profiles`);

    // ===================================================================
    // STEP 20: Sentiment periodes (8 weeks)
    // ===================================================================
    console.log('\n--- Step 20: Sentiment periodes (8) ---');
    const sentimentPeriodes = [
      [1, 'S7',  20, 8,  15, 5,  48],
      [2, 'S8',  22, 10, 14, 6,  52],
      [3, 'S9',  25, 9,  16, 7,  57],
      [4, 'S10', 24, 12, 18, 8,  62],
      [5, 'S11', 28, 12, 18, 8,  66],
      [6, 'S12', 25, 15, 20, 10, 70],
      [7, 'S13', 30, 14, 16, 12, 72],
      [8, 'S14', 32, 18, 15, 9,  74],
    ];
    for (const [n, periode, positif, negatif, neutre, interesse, total] of sentimentPeriodes) {
      await pg.query(`
        INSERT INTO sentiment_periodes (id, company_id, periode, positif, negatif, neutre, interesse, total)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO NOTHING
      `, [uuid('f8000000', n), COMPANY_ID, periode, positif, negatif, neutre, interesse, total]);
    }
    console.log(`  [OK] ${sentimentPeriodes.length} sentiment_periodes`);

    // ===================================================================
    // STEP 21: Sentiment regions (7)
    // ===================================================================
    console.log('\n--- Step 21: Sentiment regions (7) ---');
    const sentimentRegions = [
      [1, 'Nord',      25, 18, 12, 8,  63],
      [2, 'IDF',       30, 8,  15, 12, 65],
      [3, 'Est',       18, 12, 10, 6,  46],
      [4, 'Ouest',     15, 5,  8,  6,  34],
      [5, 'Sud',       8,  12, 6,  3,  29],
      [6, 'Sud-Ouest', 12, 14, 8,  5,  39],
      [7, 'Sud-Est',   10, 6,  8,  5,  29],
    ];
    for (const [n, region, positif, negatif, neutre, interesse, total] of sentimentRegions) {
      await pg.query(`
        INSERT INTO sentiment_regions (id, company_id, region, positif, negatif, neutre, interesse, total)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO NOTHING
      `, [uuid('f9000000', n), COMPANY_ID, region, positif, negatif, neutre, interesse, total]);
    }
    console.log(`  [OK] ${sentimentRegions.length} sentiment_regions`);

    // ===================================================================
    // STEP 22: Segment sentiments (2)
    // ===================================================================
    console.log('\n--- Step 22: Segment sentiments (2) ---');
    const segmentSentiments = [
      [1, 'nouveau', 85, 35, 28, 22, 15,
        ['Prix trop eleve', 'Manque d\'information produit', 'Delai de reponse trop long', 'Pas de catalogue en ligne'],
        ['Qualite produit reconnue', 'Accueil commercial', 'Premiere impression positive', 'Ecoute du besoin']],
      [2, 'etabli', 197, 52, 18, 20, 10,
        ['SAV peu reactif', 'Manque de visite terrain', 'Concurrents plus agressifs sur le prix', 'Facturation erronnee'],
        ['Relation de confiance', 'SAV quand il repond', 'Stabilite de la qualite', 'Connaissance des besoins']],
    ];
    for (const [n, segment, nbCr, pctPos, pctNeg, pctNeutre, pctInt, topInsatisf, topPos] of segmentSentiments) {
      await pg.query(`
        INSERT INTO segment_sentiments (id, company_id, segment, nb_cr, pct_positif, pct_negatif, pct_neutre, pct_interesse, top_insatisfactions, top_points_positifs)
        VALUES ($1, $2, $3::client_segment, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (id) DO NOTHING
      `, [uuid('fa000000', n), COMPANY_ID, segment, nbCr, pctPos, pctNeg, pctNeutre, pctInt, topInsatisf, topPos]);
    }
    console.log(`  [OK] ${segmentSentiments.length} segment_sentiments`);

    // ===================================================================
    // STEP 23: Motifs sentiment (12)
    // ===================================================================
    console.log('\n--- Step 23: Motifs sentiment (12) ---');
    const motifsSentiment = [
      // Positifs
      [1,  'Qualite produit',            'positif', 35],
      [2,  'Relation commerciale',       'positif', 28],
      [3,  'Reactivite SAV',             'positif', 22],
      [4,  'Innovation produit',         'positif', 15],
      [5,  'Accompagnement technique',   'positif', 12],
      [6,  'Prix competitif',            'positif', 10],
      // Negatifs
      [7,  'Prix trop eleve',            'negatif', 30],
      [8,  'Delais de livraison',        'negatif', 25],
      [9,  'SAV lent',                   'negatif', 18],
      [10, 'Ruptures de stock',          'negatif', 14],
      [11, 'Manque de visite terrain',   'negatif', 10],
      [12, 'Erreurs de facturation',     'negatif', 8],
    ];
    for (const [n, motif, type, mentions] of motifsSentiment) {
      await pg.query(`
        INSERT INTO motifs_sentiment (id, company_id, motif, type, mentions)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO NOTHING
      `, [uuid('f0300000', n), COMPANY_ID, motif, type, mentions]);
    }
    console.log(`  [OK] ${motifsSentiment.length} motifs_sentiment`);

    // ===================================================================
    // STEP 24: Tendance prix (4 weeks x 6 competitors = 24)
    // ===================================================================
    console.log('\n--- Step 24: Tendance prix (24) ---');
    const tendancePrix = [
      // Acme
      [1,  'Acme',     'S11', 8,  -12, 2, 0],
      [2,  'Acme',     'S12', 10, -13, 3, 0],
      [3,  'Acme',     'S13', 12, -14, 3, 1],
      [4,  'Acme',     'S14', 15, -15, 4, 0],
      // Bexor
      [5,  'Bexor',    'S11', 5,  -8,  1, 0],
      [6,  'Bexor',    'S12', 6,  -8,  1, 0],
      [7,  'Bexor',    'S13', 8,  -10, 2, 0],
      [8,  'Bexor',    'S14', 10, -12, 3, 0],
      // TechPro
      [9,  'TechPro',  'S11', 3,  -5,  1, 1],
      [10, 'TechPro',  'S12', 4,  -8,  1, 1],
      [11, 'TechPro',  'S13', 5,  -10, 1, 0],
      [12, 'TechPro',  'S14', 6,  -15, 2, 1],
      // Proxio
      [13, 'Proxio',   'S11', 2,  -3,  0, 1],
      [14, 'Proxio',   'S12', 3,  -4,  0, 1],
      [15, 'Proxio',   'S13', 3,  -5,  1, 1],
      [16, 'Proxio',   'S14', 4,  -6,  1, 1],
      // IndusPro
      [17, 'IndusPro', 'S11', 2,  -5,  1, 0],
      [18, 'IndusPro', 'S12', 3,  -6,  1, 0],
      [19, 'IndusPro', 'S13', 3,  -7,  2, 0],
      [20, 'IndusPro', 'S14', 4,  -7,  2, 0],
      // VeloCom
      [21, 'VeloCom',  'S11', 1,  -2,  0, 0],
      [22, 'VeloCom',  'S12', 2,  -3,  0, 0],
      [23, 'VeloCom',  'S13', 2,  -3,  1, 0],
      [24, 'VeloCom',  'S14', 3,  -5,  1, 0],
    ];
    for (const [n, conc, semaine, mentions, ecart, perdus, gagnes] of tendancePrix) {
      await pg.query(`
        INSERT INTO tendance_prix (id, company_id, concurrent_nom, semaine, mentions, ecart_moyen, deals_perdus, deals_gagnes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO NOTHING
      `, [uuid('f0400000', n), COMPANY_ID, conc, semaine, mentions, ecart, perdus, gagnes]);
    }
    console.log(`  [OK] ${tendancePrix.length} tendance_prix`);

    // ===================================================================
    // STEP 25: Deal tendance (4 weeks)
    // ===================================================================
    console.log('\n--- Step 25: Deal tendance (4) ---');
    const dealTendance = [
      [1, 'S11', 3, 2, 1, 1, 2, 1, 0, 1],
      [2, 'S12', 4, 1, 2, 1, 1, 2, 1, 0],
      [3, 'S13', 5, 2, 1, 2, 2, 1, 0, 1],
      [4, 'S14', 6, 3, 1, 1, 3, 1, 1, 0],
    ];
    for (const [n, semaine, prix, produit, offre, timing, concurrent, relation, budget, autre] of dealTendance) {
      await pg.query(`
        INSERT INTO deal_tendance (id, company_id, semaine, prix, produit, offre, timing, concurrent, relation, budget, autre)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (id) DO NOTHING
      `, [uuid('f0500000', n), COMPANY_ID, semaine, prix, produit, offre, timing, concurrent, relation, budget, autre]);
    }
    console.log(`  [OK] ${dealTendance.length} deal_tendance`);

    // ===================================================================
    // STEP 26: Deal commercial tendance (4 weeks)
    // ===================================================================
    console.log('\n--- Step 26: Deal commercial tendance (4) ---');
    const dealCommTendance = [
      [1, 'S11', 2, 1, 1, 1, 1, 1],
      [2, 'S12', 3, 1, 2, 1, 1, 0],
      [3, 'S13', 3, 2, 1, 2, 1, 1],
      [4, 'S14', 4, 1, 2, 1, 2, 1],
    ];
    for (const [n, semaine, pnc, tr, cmp, ri, bmi, si] of dealCommTendance) {
      await pg.query(`
        INSERT INTO deal_commercial_tendance (id, company_id, semaine, prix_non_competitif, timing_rate, concurrent_mieux_positionne, relation_insuffisante, besoin_mal_identifie, suivi_insuffisant)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO NOTHING
      `, [uuid('f0600000', n), COMPANY_ID, semaine, pnc, tr, cmp, ri, bmi, si]);
    }
    console.log(`  [OK] ${dealCommTendance.length} deal_commercial_tendance`);

    // ===================================================================
    // STEP 27: Recommandations IA (8)
    // ===================================================================
    console.log('\n--- Step 27: Recommandations IA (8) ---');
    const recos = [
      [1, 'risque',       'Nord',      'Thomas D.',  1, 'RDV urgent Dupont Industries — Acme en test actif depuis 2 mois avec -18%. Proposer offre de retention avec avantage SAV premium.', 'nouvelle'],
      [2, 'opportunite',  'IDF',       'Emma V.',    2, 'Relancer BioSante Plus — fort interet detecte. Proposer demo gamme Pro + integration digitale.', 'nouvelle'],
      [3, 'territoire',   'Sud-Ouest', 'Antoine G.', 1, 'Renforcer presence Sud-Ouest — Bexor en demarchage agressif. Planifier 5 visites clients strategiques cette semaine.', 'vue'],
      [4, 'coaching',     'Sud',       'Pierre B.',  2, 'Accompagner Pierre B. — score qualite a 51/100 en baisse de 12 points. Identifier les causes et proposer un plan de formation.', 'nouvelle'],
      [5, 'risque',       'Est',       'Lucas M.',   1, 'Defendre EnergiePlus — IndusPro vient de signer. Proposer extension contrat avec conditions preferentielles.', 'en_cours'],
      [6, 'opportunite',  'Sud-Est',   'Hugo T.',    2, 'Accelerer le deal TechnoSud +120K — le client est pret a etendre sur 2 sites. Finaliser la proposition cette semaine.', 'nouvelle'],
      [7, 'risque',       'Nord',      'Sarah R.',   1, 'Securiser Groupe Mercier — Acme et VeloCom en approche. Renforcer les visites et proposer un contrat cadre.', 'nouvelle'],
      [8, 'opportunite',  'IDF',       'Clara S.',   3, 'Referencement grande distribution — potentiel 500K/an. Preparer le dossier technique et commercial pour le comite achat.', 'vue'],
    ];
    for (const [n, type, terr, comm, priorite, action, statut] of recos) {
      await pg.query(`
        INSERT INTO recommandations_ia (id, company_id, type, territoire, commercial_suggere, priorite, action_recommandee, statut)
        VALUES ($1, $2, $3::reco_type, $4, $5, $6, $7, $8::reco_statut)
        ON CONFLICT (id) DO NOTHING
      `, [uuid('fc000000', n), COMPANY_ID, type, terr, comm, priorite, action, statut]);
    }
    console.log(`  [OK] ${recos.length} recommandations_ia`);

    // ===================================================================
    // STEP 28: Contacts (20)
    // ===================================================================
    console.log('\n--- Step 28: Contacts (20) ---');
    const contacts = [
      [1,  'Jean Dupont',      'Directeur Achat',    1,  dateStr(180), false],
      [2,  'Marie Leclerc',    'DG',                 1,  dateStr(90),  false],
      [3,  'Paul Mercier',     'DA',                 2,  dateStr(120), false],
      [4,  'Sophie Blanc',     'Responsable Achats', 2,  dateStr(60),  false],
      [5,  'Luc Horizon',      'DG',                 3,  dateStr(200), false],
      [6,  'Anne Martin',      'DAF',                3,  dateStr(30),  true],
      [7,  'Pierre Bertrand',  'Gerant',             4,  dateStr(365), false],
      [8,  'Camille Durand',   'Technicien',         5,  dateStr(150), false],
      [9,  'Nicolas Petit',    'DG',                 6,  dateStr(100), false],
      [10, 'Isabelle Roy',     'Responsable Logistique', 6, dateStr(45), true],
      [11, 'Marc Sanchez',     'Directeur R&D',      7,  dateStr(80),  false],
      [12, 'Claire Lefevre',   'DA',                 7,  dateStr(20),  true],
      [13, 'Julien Moreau',    'DG',                 8,  dateStr(160), false],
      [14, 'Laura Faure',      'Responsable Technique', 9, dateStr(70), false],
      [15, 'Thierry Garnier',  'DA',                 10, dateStr(110), false],
      [16, 'Christine Meyer',  'DG',                 11, dateStr(200), false],
      [17, 'David Lopez',      'Responsable Achats', 12, dateStr(55),  true],
      [18, 'Nathalie Girard',  'DAF',                13, dateStr(85),  false],
      [19, 'Sebastien Roux',   'DG',                 14, dateStr(140), false],
      [20, 'Helene Fournier',  'DA',                 15, dateStr(25),  true],
    ];
    for (const [n, name, role, accIdx, firstDetected, isNew] of contacts) {
      await pg.query(`
        INSERT INTO contacts (id, company_id, name, role, account_id, first_detected, is_new)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO NOTHING
      `, [uuid('f0700000', n), COMPANY_ID, name, role, uuid('b0000000', accIdx), firstDetected, isNew]);
    }
    console.log(`  [OK] ${contacts.length} contacts`);

    // ===================================================================
    // DONE
    // ===================================================================
    console.log('\n===================================================');
    console.log('  SEED-FULL COMPLETE');
    console.log('===================================================');
    console.log(`  100 signals, 15 accounts, 12 commercials, 6 competitors`);
    console.log(`  25 alerts, 15 needs, 20 deals_mkt, 20 deals_comm`);
    console.log(`  30 cr_objectifs, 20 prix_signals, 10 offres_concurrentes`);
    console.log(`  10 comm_concurrentes, 36 positionnement, 21 geo_sector`);
    console.log(`  14 geo_points, 7 territoires, 7 region_profiles`);
    console.log(`  8 sentiment_periodes, 7 sentiment_regions, 2 segment_sentiments`);
    console.log(`  12 motifs_sentiment, 24 tendance_prix, 4 deal_tendance`);
    console.log(`  4 deal_comm_tendance, 8 recommandations_ia, 20 contacts`);
    console.log(`  15 abbreviations`);
    console.log('===================================================\n');

  } catch (err) {
    console.error('\n[FATAL]', err);
    process.exit(1);
  } finally {
    await pg.end();
  }
}

main();
