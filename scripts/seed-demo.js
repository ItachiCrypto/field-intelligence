/**
 * seed-demo.js — Seeds a demo organization into the Supabase PostgreSQL database.
 *
 * Usage:  node scripts/seed-demo.js
 *
 * Requires: pg, @supabase/supabase-js (already installed)
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const { Client } = require('pg');
const { createClient } = require('@supabase/supabase-js');

// ---------------------------------------------------------------------------
// Config (all secrets read from environment)
// ---------------------------------------------------------------------------
const PG_CONNECTION = process.env.PG_CONNECTION;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const COMPANY_ID = process.env.DEMO_COMPANY_ID || 'a0000000-0000-0000-0000-000000000001';

const missing = [];
if (!PG_CONNECTION) missing.push('PG_CONNECTION');
if (!SUPABASE_URL) missing.push('NEXT_PUBLIC_SUPABASE_URL');
if (!SUPABASE_SERVICE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');
if (missing.length > 0) {
  console.error('[FATAL] Missing required environment variables:', missing.join(', '));
  console.error('        Copy .env.example -> .env.local and fill the values.');
  process.exit(1);
}

// Basic UUID shape validation for the demo company id (defense in depth).
if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(COMPANY_ID)) {
  console.error('[FATAL] DEMO_COMPANY_ID is not a valid UUID:', COMPANY_ID);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const now = new Date();
function hoursAgo(h) { return new Date(now.getTime() - h * 3600000).toISOString(); }
function daysAgo(d) { return new Date(now.getTime() - d * 86400000).toISOString(); }

// ---------------------------------------------------------------------------
// Demo users
// ---------------------------------------------------------------------------
const DEMO_USERS = [
  { email: 'admin@field-intel.com', password: 'demo1234', name: 'Admin Demo', role: 'admin' },
  { email: 'sophie@field-intel.com', password: 'demo1234', name: 'Sophie Laurent', role: 'marketing' },
  { email: 'thomas@field-intel.com', password: 'demo1234', name: 'Thomas Moreau', role: 'kam' },
  { email: 'philippe@field-intel.com', password: 'demo1234', name: 'Philippe Durand', role: 'dirco' },
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const pg = new Client({ connectionString: PG_CONNECTION });
  await pg.connect();
  console.log('[OK] Connected to PostgreSQL');

  try {
    // ===================================================================
    // STEP 1: Company
    // ===================================================================
    console.log('\n--- Step 1: Company ---');
    await pg.query(`
      INSERT INTO companies (id, name, plan, plan_user_limit, subscription_status)
      VALUES ($1, $2, $3::plan_id, $4, $5::subscription_status)
      ON CONFLICT (id) DO NOTHING
    `, [COMPANY_ID, 'Demo Corp', 'enterprise', 999999, 'active']);
    console.log('[OK] Company "Demo Corp" created (or already exists)');

    // ===================================================================
    // STEP 2: Auth users + profiles
    // ===================================================================
    console.log('\n--- Step 2: Auth users ---');
    const userIds = {};

    for (const u of DEMO_USERS) {
      try {
        const { data, error } = await supabase.auth.admin.createUser({
          email: u.email,
          password: u.password,
          email_confirm: true,
          user_metadata: {
            company_id: COMPANY_ID,
            name: u.name,
            role: u.role,
          },
        });
        if (error) {
          if (error.message && error.message.includes('already been registered')) {
            // Fetch existing user
            const { data: listData } = await supabase.auth.admin.listUsers();
            const existing = listData.users.find(x => x.email === u.email);
            if (existing) {
              userIds[u.email] = existing.id;
              console.log(`[SKIP] ${u.email} already exists (id=${existing.id})`);
            } else {
              console.log(`[WARN] ${u.email} — ${error.message}`);
            }
          } else {
            console.log(`[WARN] ${u.email} — ${error.message}`);
          }
        } else {
          userIds[u.email] = data.user.id;
          console.log(`[OK] Created ${u.email} (id=${data.user.id})`);
        }
      } catch (err) {
        console.log(`[ERR] ${u.email} — ${err.message}`);
      }

      // Insert profile (trigger may not fire via admin API)
      if (userIds[u.email]) {
        await pg.query(`
          INSERT INTO profiles (id, company_id, email, name, role)
          VALUES ($1, $2, $3, $4, $5::user_role)
          ON CONFLICT (id) DO NOTHING
        `, [userIds[u.email], COMPANY_ID, u.email, u.name, u.role]);
      }
    }

    // We need a KAM user id for accounts.kam_id and alerts.user_id
    const kamUserId = userIds['thomas@field-intel.com'] || null;
    const dircoUserId = userIds['philippe@field-intel.com'] || null;

    // ===================================================================
    // STEP 3: Business data
    // ===================================================================
    console.log('\n--- Step 3: Business data ---');

    // --- Commercials (8) ---
    console.log('  Inserting commercials...');
    const commercials = [
      ['c0000000-0000-0000-0000-000000000001', 'Thomas D.', 'Nord', 95, 3],
      ['c0000000-0000-0000-0000-000000000002', 'Sarah R.', 'Nord', 88, 2],
      ['c0000000-0000-0000-0000-000000000003', 'Julie L.', 'IDF', 82, -1],
      ['c0000000-0000-0000-0000-000000000004', 'Marc D.', 'Ouest', 78, 4],
      ['c0000000-0000-0000-0000-000000000005', 'Pierre B.', 'Sud', 51, -12],
      ['c0000000-0000-0000-0000-000000000006', 'Lucas M.', 'Est', 84, 1],
      ['c0000000-0000-0000-0000-000000000007', 'Emma V.', 'IDF', 91, 5],
      ['c0000000-0000-0000-0000-000000000008', 'Antoine G.', 'Sud-Ouest', 65, -5],
    ];
    for (const [id, name, region, qs, qt] of commercials) {
      await pg.query(`
        INSERT INTO commercials (id, company_id, name, region, quality_score, quality_trend)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO NOTHING
      `, [id, COMPANY_ID, name, region, qs, qt]);
    }
    console.log(`  [OK] ${commercials.length} commercials`);

    // --- Accounts (6) ---
    console.log('  Inserting accounts...');
    const accounts = [
      ['b0000000-0000-0000-0000-000000000001', 'Dupont Industries', 'Industrie', 'Nord', 480000, 78, 'rouge'],
      ['b0000000-0000-0000-0000-000000000002', 'Groupe Mercier', 'Distribution', 'Nord', 820000, 65, 'rouge'],
      ['b0000000-0000-0000-0000-000000000003', 'Horizon Distribution', 'Distribution', 'Est', 1200000, 45, 'orange'],
      ['b0000000-0000-0000-0000-000000000004', 'Bertrand & Fils', 'Artisanat', 'Ouest', 290000, 12, 'vert'],
      ['b0000000-0000-0000-0000-000000000005', 'LogiPro SAS', 'Logistique', 'Est', 350000, 38, 'orange'],
      ['b0000000-0000-0000-0000-000000000006', 'Transco Group', 'Transport', 'IDF', 560000, 28, 'jaune'],
    ];
    for (const [id, name, sector, region, ca, risk, health] of accounts) {
      await pg.query(`
        INSERT INTO accounts (id, company_id, name, sector, region, ca_annual, kam_id, risk_score, health)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::severity)
        ON CONFLICT (id) DO NOTHING
      `, [id, COMPANY_ID, name, sector, region, ca, kamUserId, risk, health]);
    }
    console.log(`  [OK] ${accounts.length} accounts`);

    // --- Competitors (4) ---
    console.log('  Inserting competitors...');
    const competitors = [
      ['d0000000-0000-0000-0000-000000000001', 'Acme', 'Prix agressif', 'rouge', false],
      ['d0000000-0000-0000-0000-000000000002', 'TechPro', 'SAV defaillant', 'jaune', false],
      ['d0000000-0000-0000-0000-000000000003', 'Bexor', 'Nouveau / demarchage', 'orange', true],
      ['d0000000-0000-0000-0000-000000000004', 'Proxio', 'Bundle offre', 'jaune', false],
    ];
    for (const [id, name, mt, risk, isNew] of competitors) {
      await pg.query(`
        INSERT INTO competitors (id, company_id, name, mention_type, risk, is_new)
        VALUES ($1, $2, $3, $4, $5::severity, $6)
        ON CONFLICT (id) DO NOTHING
      `, [id, COMPANY_ID, name, mt, risk, isNew]);
    }
    console.log(`  [OK] ${competitors.length} competitors`);

    // --- Signals (10) ---
    console.log('  Inserting signals...');
    const signals = [
      ['e0000000-0000-0000-0000-000000000001', 'concurrence', 'rouge', 'Acme teste depuis 2 mois', 'Acme teste depuis 2 mois. Prix -12%. SAV problematique chez concurrent.', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Nord', 'Acme', -12, false, hoursAgo(2)],
      ['e0000000-0000-0000-0000-000000000002', 'concurrence', 'orange', 'Bexor demarchage actif', 'Bexor demarchage actif - bundle produit inedit - 3 clients cibles.', 'b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000003', 'Sud-Ouest', 'Bexor', null, false, hoursAgo(5)],
      ['e0000000-0000-0000-0000-000000000003', 'besoin', 'jaune', 'Catalogue numerique demande', 'Demande de catalogue numerique + acces commande en ligne.', 'b0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000004', 'Ouest', null, null, false, daysAgo(1)],
      ['e0000000-0000-0000-0000-000000000004', 'prix', 'orange', 'Sensibilite prix forte', 'Client compare activement nos tarifs. Demande remise volume 15%.', 'b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', 'Nord', null, null, false, hoursAgo(8)],
      ['e0000000-0000-0000-0000-000000000005', 'opportunite', 'vert', 'Upsell gamme Pro 45K', 'Ouverture projet gamme Pro - budget 45K EUR - decision septembre.', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Nord', null, null, false, daysAgo(1)],
      ['e0000000-0000-0000-0000-000000000006', 'satisfaction', 'vert', 'Tres satisfait - fidelisation', 'Client tres satisfait du SAV. Recommande a son reseau. Potentiel upsell.', 'b0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000004', 'Ouest', null, null, true, daysAgo(2)],
      ['e0000000-0000-0000-0000-000000000007', 'concurrence', 'rouge', 'Acme offensive prix nationale', '8 commerciaux remontent Acme avec offre a -12% sur tout le territoire.', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000007', 'IDF', 'Acme', -12, false, hoursAgo(3)],
      ['e0000000-0000-0000-0000-000000000008', 'besoin', 'orange', 'Delais livraison trop longs', 'Client se plaint de delais de livraison a 3 semaines. Veut 1 semaine max.', 'b0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000006', 'Est', null, null, false, hoursAgo(6)],
      ['e0000000-0000-0000-0000-000000000009', 'concurrence', 'orange', 'TechPro SAV defaillant', 'Client revient de TechPro - SAV catastrophique. Opportunite de reconquete.', 'b0000000-0000-0000-0000-000000000005', null, 'Est', 'TechPro', null, true, daysAgo(2)],
      ['e0000000-0000-0000-0000-000000000010', 'prix', 'jaune', 'Demande remise volume', 'Demande de remise sur volume - commande recurrente de 50K/an.', 'b0000000-0000-0000-0000-000000000006', null, 'IDF', null, null, false, daysAgo(3)],
    ];
    for (const [id, type, sev, title, content, accId, comId, region, compName, priceDelta, treated, createdAt] of signals) {
      await pg.query(`
        INSERT INTO signals (id, company_id, type, severity, title, content, account_id, commercial_id, region, competitor_name, price_delta, treated, created_at)
        VALUES ($1, $2, $3::signal_type, $4::severity, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (id) DO NOTHING
      `, [id, COMPANY_ID, type, sev, title, content, accId, comId, region, compName, priceDelta, treated, createdAt]);
    }
    console.log(`  [OK] ${signals.length} signals`);

    // --- Alerts (5) ---
    console.log('  Inserting alerts...');
    const alerts = [
      ['f0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', kamUserId, 'rouge', 'nouveau', hoursAgo(2), null],
      ['f0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000007', kamUserId, 'rouge', 'nouveau', hoursAgo(3), null],
      ['f0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000002', kamUserId, 'orange', 'nouveau', hoursAgo(5), null],
      ['f0000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000004', kamUserId, 'orange', 'en_cours', hoursAgo(8), null],
      ['f0000000-0000-0000-0000-000000000005', 'e0000000-0000-0000-0000-000000000008', kamUserId, 'orange', 'traite', hoursAgo(6), hoursAgo(2)],
    ];
    for (const [id, sigId, userId, sev, status, createdAt, treatedAt] of alerts) {
      await pg.query(`
        INSERT INTO alerts (id, company_id, signal_id, user_id, severity, status, created_at, treated_at)
        VALUES ($1, $2, $3, $4, $5::severity, $6::alert_status, $7, $8)
        ON CONFLICT (id) DO NOTHING
      `, [id, COMPANY_ID, sigId, userId, sev, status, createdAt, treatedAt]);
    }
    console.log(`  [OK] ${alerts.length} alerts`);

    // --- Needs (5) ---
    console.log('  Inserting needs...');
    const needs = [
      ['f1000000-0000-0000-0000-000000000001', 'Delais de livraison trop longs', 47, 22, 'up', 1],
      ['f1000000-0000-0000-0000-000000000002', 'Manque de disponibilite stock', 38, 18, 'up', 2],
      ['f1000000-0000-0000-0000-000000000003', 'Demande de remise sur volume', 35, 0, 'stable', 3],
      ['f1000000-0000-0000-0000-000000000004', 'Besoin formation produit', 28, 0, 'new', 4],
      ['f1000000-0000-0000-0000-000000000005', 'SAV peu reactif', 21, -8, 'down', 5],
    ];
    for (const [id, label, mentions, evolution, trend, rank] of needs) {
      await pg.query(`
        INSERT INTO needs (id, company_id, label, mentions, evolution, trend, rank_order)
        VALUES ($1, $2, $3, $4, $5, $6::need_trend, $7)
        ON CONFLICT (id) DO NOTHING
      `, [id, COMPANY_ID, label, mentions, evolution, trend, rank]);
    }
    console.log(`  [OK] ${needs.length} needs`);

    // --- Abbreviations (10) ---
    console.log('  Inserting abbreviations...');
    const abbreviations = [
      ['f2000000-0000-0000-0000-000000000001', 'CR', 'Compte-Rendu', 'commercial'],
      ['f2000000-0000-0000-0000-000000000002', 'SAV', 'Service Apres-Vente', 'general'],
      ['f2000000-0000-0000-0000-000000000003', 'KAM', 'Key Account Manager', 'commercial'],
      ['f2000000-0000-0000-0000-000000000004', 'CA', 'Chiffre d\'Affaires', 'commercial'],
      ['f2000000-0000-0000-0000-000000000005', 'AO', 'Appel d\'Offres', 'commercial'],
      ['f2000000-0000-0000-0000-000000000006', 'NPS', 'Net Promoter Score', 'commercial'],
      ['f2000000-0000-0000-0000-000000000007', 'PME', 'Petite et Moyenne Entreprise', 'organisation'],
      ['f2000000-0000-0000-0000-000000000008', 'ETI', 'Entreprise de Taille Intermediaire', 'organisation'],
      ['f2000000-0000-0000-0000-000000000009', 'DG', 'Directeur General', 'organisation'],
      ['f2000000-0000-0000-0000-000000000010', 'DAF', 'Directeur Administratif et Financier', 'organisation'],
    ];
    for (const [id, short, full, cat] of abbreviations) {
      await pg.query(`
        INSERT INTO abbreviations (id, company_id, short, "full", category)
        VALUES ($1, $2, $3, $4, $5::abbrev_category)
        ON CONFLICT (id) DO NOTHING
      `, [id, COMPANY_ID, short, full, cat]);
    }
    console.log(`  [OK] ${abbreviations.length} abbreviations`);

    // --- Deals marketing (6) ---
    console.log('  Inserting deals_marketing...');
    const dealsMarketing = [
      ['f3000000-0000-0000-0000-000000000001', 'prix', 'perdu', 'Acme', 'Thomas D.', 'Dupont Industries', 'Nord', '2026-03-28', 'Client a choisi Acme car 12% moins cher sur la gamme standard'],
      ['f3000000-0000-0000-0000-000000000002', 'relation', 'gagne', null, 'Emma V.', 'BioSante Plus', 'IDF', '2026-03-27', 'Relation de confiance avec le DG - renouvellement sans appel d\'offres'],
      ['f3000000-0000-0000-0000-000000000003', 'produit', 'perdu', 'Bexor', 'Antoine G.', 'SudFrance Logistique', 'Sud-Ouest', '2026-03-25', 'Bexor propose un bundle produit+maintenance plus adapte'],
      ['f3000000-0000-0000-0000-000000000004', 'prix', 'perdu', 'Acme', 'Lucas M.', 'Horizon Distribution', 'Est', '2026-03-22', 'Impossible de matcher le prix Acme, engagement 3 ans trop contraignant'],
      ['f3000000-0000-0000-0000-000000000005', 'timing', 'perdu', null, 'Hugo T.', 'NovaTech', 'Sud-Ouest', '2026-03-20', 'Projet reporte au Q3, budget gele par la direction'],
      ['f3000000-0000-0000-0000-000000000006', 'relation', 'gagne', null, 'Clara S.', 'Transco Group', 'IDF', '2026-03-19', 'Le client valorise notre reactivite et la qualite du suivi commercial'],
    ];
    for (const [id, motif, resultat, concurrent, comm, client, region, date, verbatim] of dealsMarketing) {
      await pg.query(`
        INSERT INTO deals_marketing (id, company_id, motif_principal, resultat, concurrent_nom, commercial_name, client_name, region, date, verbatim)
        VALUES ($1, $2, $3::deal_motif, $4::statut_deal, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (id) DO NOTHING
      `, [id, COMPANY_ID, motif, resultat, concurrent, comm, client, region, date, verbatim]);
    }
    console.log(`  [OK] ${dealsMarketing.length} deals_marketing`);

    // --- Deals commerciaux (6) ---
    console.log('  Inserting deals_commerciaux...');
    const dealsCommerciaux = [
      ['f4000000-0000-0000-0000-000000000001', 'prix_non_competitif', 'perdu', 'Acme', 'Thomas D.', 'Dupont Industries', 'Nord', '2026-03-28', 'Notre tarif 12% au-dessus, pas de marge de negociation possible'],
      ['f4000000-0000-0000-0000-000000000002', 'relation_insuffisante', 'gagne', null, 'Emma V.', 'BioSante Plus', 'IDF', '2026-03-27', 'Suivi regulier et reactivite ont fait la difference face au concurrent'],
      ['f4000000-0000-0000-0000-000000000003', 'besoin_mal_identifie', 'perdu', 'Bexor', 'Antoine G.', 'SudFrance Logistique', 'Sud-Ouest', '2026-03-25', 'On a propose la mauvaise gamme, Bexor avait mieux compris le besoin'],
      ['f4000000-0000-0000-0000-000000000004', 'prix_non_competitif', 'perdu', 'Acme', 'Lucas M.', 'Horizon Distribution', 'Est', '2026-03-22', 'Ecart de prix trop important, le client ne pouvait pas justifier'],
      ['f4000000-0000-0000-0000-000000000005', 'timing_rate', 'perdu', null, 'Hugo T.', 'NovaTech', 'Sud-Ouest', '2026-03-20', 'Arrivee trop tard dans le cycle de decision, concurrent avait deja signe'],
      ['f4000000-0000-0000-0000-000000000006', 'relation_insuffisante', 'gagne', null, 'Clara S.', 'Transco Group', 'IDF', '2026-03-19', 'Visites regulieres et accompagnement technique apprecies'],
    ];
    for (const [id, motif, resultat, concurrent, comm, client, region, date, verbatim] of dealsCommerciaux) {
      await pg.query(`
        INSERT INTO deals_commerciaux (id, company_id, motif, resultat, concurrent_nom, commercial_name, client_name, region, date, verbatim)
        VALUES ($1, $2, $3::motif_commercial, $4::statut_deal, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (id) DO NOTHING
      `, [id, COMPANY_ID, motif, resultat, concurrent, comm, client, region, date, verbatim]);
    }
    console.log(`  [OK] ${dealsCommerciaux.length} deals_commerciaux`);

    // --- CR Objectifs (10) ---
    console.log('  Inserting cr_objectifs...');
    const crObjectifs = [
      ['f5000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Thomas D.', 'Dupont Industries', 'signature', 'atteint', null, 'Relation de confiance', '2026-03-29', 'Nord'],
      ['f5000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'Thomas D.', 'MetalPro', 'sell_in', 'atteint', null, 'Produit adapte', '2026-03-28', 'Nord'],
      ['f5000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 'Thomas D.', 'Groupe Mercier', 'fidelisation', 'non_atteint', 'Concurrent deja en place', null, '2026-03-27', 'Nord'],
      ['f5000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000007', 'Emma V.', 'BioSante Plus', 'signature', 'atteint', null, 'Besoin urgent client', '2026-03-29', 'IDF'],
      ['f5000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000007', 'Emma V.', 'Transco Group', 'sell_out', 'atteint', null, 'Prix competitif', '2026-03-28', 'IDF'],
      ['f5000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000006', 'Lucas M.', 'Horizon Distribution', 'sell_in', 'non_atteint', 'Timing mauvais', null, '2026-03-28', 'Est'],
      ['f5000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000006', 'Lucas M.', 'LogiPro SAS', 'fidelisation', 'atteint', null, 'Relation de confiance', '2026-03-26', 'Est'],
      ['f5000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000008', 'Antoine G.', 'SudFrance Logistique', 'sell_in', 'atteint', null, 'Prix competitif', '2026-03-28', 'Sud-Ouest'],
      ['f5000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000008', 'Antoine G.', 'NovaTech', 'formation', 'atteint', null, 'Besoin urgent client', '2026-03-26', 'Sud-Ouest'],
      ['f5000000-0000-0000-0000-000000000010', 'c0000000-0000-0000-0000-000000000005', 'Pierre B.', 'MecanoParts', 'sell_out', 'non_atteint', 'Client pas interesse', null, '2026-03-29', 'Sud'],
    ];
    for (const [id, comId, comName, client, objType, resultat, cause, facteur, date, region] of crObjectifs) {
      await pg.query(`
        INSERT INTO cr_objectifs (id, company_id, commercial_id, commercial_name, client_name, objectif_type, resultat, cause_echec, facteur_reussite, date, region)
        VALUES ($1, $2, $3, $4, $5, $6::objectif_type, $7::objectif_resultat, $8, $9, $10, $11)
        ON CONFLICT (id) DO NOTHING
      `, [id, COMPANY_ID, comId, comName, client, objType, resultat, cause, facteur, date, region]);
    }
    console.log(`  [OK] ${crObjectifs.length} cr_objectifs`);

    // --- Territoires (4) ---
    console.log('  Inserting territoires...');
    const territoires = [
      ['f6000000-0000-0000-0000-000000000001', 'Nord', ['Thomas D.', 'Sarah R.', 'Maxime R.'], 85, 'negatif', 22, 5, 5, 'hausse', 92, ['Client interesse par gamme Pro', 'Nouveau besoin formation technique'], ['Acme agressif sur le prix -12%', 'Client menace de changer de fournisseur']],
      ['f6000000-0000-0000-0000-000000000002', 'Sud-Ouest', ['Antoine G.', 'Ines D.'], 52, 'negatif', 16, 3, 3, 'hausse', 78, ['Ouverture nouveau site client en mai'], ['Bexor en demarchage agressif avec bundle']],
      ['f6000000-0000-0000-0000-000000000003', 'Est', ['Lucas M.', 'Lea F.', 'Jade W.'], 68, 'neutre', 14, 4, 3, 'stable', 72, ['Appel d\'offres 200K detecte', 'Client interesse par API ERP'], ['Concurrent TechPro en reconquete']],
      ['f6000000-0000-0000-0000-000000000004', 'IDF', ['Julie L.', 'Emma V.', 'Clara S.'], 78, 'positif', 10, 6, 1, 'baisse', 45, ['Fort interet pour demo gamme Pro', 'Upsell detecte sur 3 comptes'], ['Proxio detecte sur 2 comptes']],
    ];
    for (const [id, terr, comNames, nbCr, sentDom, nbMentions, nbOpp, nbRisques, tendance, score, motifsOpp, motifsRisque] of territoires) {
      await pg.query(`
        INSERT INTO territoires (id, company_id, territoire, commercial_names, nb_cr, sentiment_dominant, nb_mentions_concurrents, nb_opportunites, nb_risques_perte, tendance_vs_mois_precedent, score_priorite, motifs_opportunite, motifs_risque)
        VALUES ($1, $2, $3, $4, $5, $6::sentiment_type, $7, $8, $9, $10::trend_direction, $11, $12, $13)
        ON CONFLICT (id) DO NOTHING
      `, [id, COMPANY_ID, terr, comNames, nbCr, sentDom, nbMentions, nbOpp, nbRisques, tendance, score, motifsOpp, motifsRisque]);
    }
    console.log(`  [OK] ${territoires.length} territoires`);

    // --- Region profiles (4) ---
    console.log('  Inserting region_profiles...');
    const regionProfiles = [
      ['f7000000-0000-0000-0000-000000000001', 'Nord', ['Delais de livraison plus courts', 'Remise sur volume', 'SAV plus reactif'], 'Acme', 22, 'negatif', 'Forte sensibilite aux delais - la logistique industrielle exige du J+2 maximum', 85],
      ['f7000000-0000-0000-0000-000000000002', 'IDF', ['Catalogue numerique', 'Integration API ERP', 'Formation produit'], 'Proxio', 10, 'positif', 'Demande technologique forte - clients attendent des outils digitaux et self-service', 78],
      ['f7000000-0000-0000-0000-000000000003', 'Est', ['Disponibilite stock', 'Integration ERP SAP', 'Livraison express'], 'TechPro', 14, 'neutre', 'Tissu industriel dense - les clients comparent systematiquement 3+ fournisseurs', 68],
      ['f7000000-0000-0000-0000-000000000004', 'Sud-Ouest', ['Prix competitif', 'Bundle produit+service', 'Accompagnement terrain'], 'Bexor', 16, 'negatif', 'Marche tres sensible au prix - les bundles tout-inclus font la difference', 52],
    ];
    for (const [id, region, topBesoins, concPrincipal, concMentions, sentDom, spec, nbSignaux] of regionProfiles) {
      await pg.query(`
        INSERT INTO region_profiles (id, company_id, region, top_besoins, concurrent_principal, concurrent_mentions, sentiment_dominant, specificite_locale, nb_signaux)
        VALUES ($1, $2, $3, $4, $5, $6, $7::sentiment_type, $8, $9)
        ON CONFLICT (id) DO NOTHING
      `, [id, COMPANY_ID, region, topBesoins, concPrincipal, concMentions, sentDom, spec, nbSignaux]);
    }
    console.log(`  [OK] ${regionProfiles.length} region_profiles`);

    // --- Sentiment periodes (4) ---
    console.log('  Inserting sentiment_periodes...');
    const sentimentPeriodes = [
      ['f8000000-0000-0000-0000-000000000001', 'S11', 28, 12, 18, 8, 66],
      ['f8000000-0000-0000-0000-000000000002', 'S12', 25, 15, 20, 10, 70],
      ['f8000000-0000-0000-0000-000000000003', 'S13', 30, 14, 16, 12, 72],
      ['f8000000-0000-0000-0000-000000000004', 'S14', 32, 18, 15, 9, 74],
    ];
    for (const [id, periode, positif, negatif, neutre, interesse, total] of sentimentPeriodes) {
      await pg.query(`
        INSERT INTO sentiment_periodes (id, company_id, periode, positif, negatif, neutre, interesse, total)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO NOTHING
      `, [id, COMPANY_ID, periode, positif, negatif, neutre, interesse, total]);
    }
    console.log(`  [OK] ${sentimentPeriodes.length} sentiment_periodes`);

    // --- Sentiment regions (4) ---
    console.log('  Inserting sentiment_regions...');
    const sentimentRegions = [
      ['f9000000-0000-0000-0000-000000000001', 'Nord', 25, 18, 12, 8, 63],
      ['f9000000-0000-0000-0000-000000000002', 'IDF', 30, 8, 15, 12, 65],
      ['f9000000-0000-0000-0000-000000000003', 'Est', 18, 12, 10, 6, 46],
      ['f9000000-0000-0000-0000-000000000004', 'Sud-Ouest', 12, 14, 8, 5, 39],
    ];
    for (const [id, region, positif, negatif, neutre, interesse, total] of sentimentRegions) {
      await pg.query(`
        INSERT INTO sentiment_regions (id, company_id, region, positif, negatif, neutre, interesse, total)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO NOTHING
      `, [id, COMPANY_ID, region, positif, negatif, neutre, interesse, total]);
    }
    console.log(`  [OK] ${sentimentRegions.length} sentiment_regions`);

    // --- Segment sentiments (2) ---
    console.log('  Inserting segment_sentiments...');
    const segmentSentiments = [
      ['fa000000-0000-0000-0000-000000000001', 'nouveau', 85, 35, 28, 22, 15, ['Prix trop eleve', 'Manque d\'information produit', 'Delai de reponse trop long'], ['Qualite produit reconnue', 'Accueil commercial', 'Premiere impression positive']],
      ['fa000000-0000-0000-0000-000000000002', 'etabli', 197, 52, 18, 20, 10, ['SAV peu reactif', 'Manque de visite terrain', 'Concurrents plus agressifs sur le prix'], ['Relation de confiance', 'SAV quand il repond', 'Stabilite de la qualite']],
    ];
    for (const [id, segment, nbCr, pctPos, pctNeg, pctNeutre, pctInt, topInsatisf, topPos] of segmentSentiments) {
      await pg.query(`
        INSERT INTO segment_sentiments (id, company_id, segment, nb_cr, pct_positif, pct_negatif, pct_neutre, pct_interesse, top_insatisfactions, top_points_positifs)
        VALUES ($1, $2, $3::client_segment, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (id) DO NOTHING
      `, [id, COMPANY_ID, segment, nbCr, pctPos, pctNeg, pctNeutre, pctInt, topInsatisf, topPos]);
    }
    console.log(`  [OK] ${segmentSentiments.length} segment_sentiments`);

    // --- Prix signals (4) ---
    console.log('  Inserting prix_signals...');
    const prixSignals = [
      ['fb000000-0000-0000-0000-000000000001', 'Acme', -12, 'inferieur', 'perdu', 'Thomas D.', 'Dupont Industries', 'Nord', 'Acme propose 12% moins cher sur la gamme standard', '2026-03-29'],
      ['fb000000-0000-0000-0000-000000000002', 'Acme', -15, 'inferieur', 'perdu', 'Maxime R.', 'MetalPro', 'Nord', 'Acme a sorti un tarif a -15% avec engagement 2 ans', '2026-03-28'],
      ['fb000000-0000-0000-0000-000000000003', 'Bexor', -8, 'inferieur', 'en_cours', 'Antoine G.', 'SudFrance Logistique', 'Sud-Ouest', 'Bexor affiche -8% sur le bundle produit+service', '2026-03-27'],
      ['fb000000-0000-0000-0000-000000000004', 'TechPro', 5, 'superieur', 'gagne', 'Emma V.', 'BioSante Plus', 'IDF', 'TechPro 5% plus cher, client revient chez nous pour le SAV', '2026-03-26'],
    ];
    for (const [id, concurrent, ecart, ecartType, statut, comm, client, region, verbatim, date] of prixSignals) {
      await pg.query(`
        INSERT INTO prix_signals (id, company_id, concurrent_nom, ecart_pct, ecart_type, statut_deal, commercial_name, client_name, region, verbatim, date)
        VALUES ($1, $2, $3, $4, $5::ecart_type, $6::statut_deal, $7, $8, $9, $10, $11)
        ON CONFLICT (id) DO NOTHING
      `, [id, COMPANY_ID, concurrent, ecart, ecartType, statut, comm, client, region, verbatim, date]);
    }
    console.log(`  [OK] ${prixSignals.length} prix_signals`);

    // --- Recommandations IA (3) ---
    console.log('  Inserting recommandations_ia...');
    const recos = [
      ['fc000000-0000-0000-0000-000000000001', 'risque', 'Nord', 'Thomas D.', 1, 'RDV urgent Dupont Industries - Acme en test actif depuis 2 mois. Proposer offre de retention avec avantage SAV premium.', 'nouvelle'],
      ['fc000000-0000-0000-0000-000000000002', 'opportunite', 'IDF', 'Emma V.', 2, 'Relancer BioSante Plus - fort interet detecte dans les CR. Proposer demo gamme Pro.', 'nouvelle'],
      ['fc000000-0000-0000-0000-000000000003', 'territoire', 'Sud-Ouest', 'Antoine G.', 1, 'Renforcer presence Sud-Ouest - Bexor en demarchage agressif. Planifier 5 visites clients strategiques cette semaine.', 'vue'],
    ];
    for (const [id, type, terr, comm, priorite, action, statut] of recos) {
      await pg.query(`
        INSERT INTO recommandations_ia (id, company_id, type, territoire, commercial_suggere, priorite, action_recommandee, statut)
        VALUES ($1, $2, $3::reco_type, $4, $5, $6, $7, $8::reco_statut)
        ON CONFLICT (id) DO NOTHING
      `, [id, COMPANY_ID, type, terr, comm, priorite, action, statut]);
    }
    console.log(`  [OK] ${recos.length} recommandations_ia`);

    // ===================================================================
    // STEP 4: Summary
    // ===================================================================
    console.log('\n===================================================');
    console.log('  SEED COMPLETE');
    console.log('===================================================');
    console.log('\nDemo credentials:');
    console.log('  admin@field-intel.com   / demo1234  (admin)');
    console.log('  sophie@field-intel.com  / demo1234  (marketing)');
    console.log('  thomas@field-intel.com  / demo1234  (kam)');
    console.log('  philippe@field-intel.com/ demo1234  (dirco)');
    console.log('\nCompany: Demo Corp (enterprise plan)');
    console.log(`Company ID: ${COMPANY_ID}`);
    console.log('===================================================\n');

  } catch (err) {
    console.error('\n[FATAL]', err);
    process.exit(1);
  } finally {
    await pg.end();
  }
}

main();
