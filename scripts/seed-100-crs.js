#!/usr/bin/env node
/**
 * seed-100-crs.js — Pousse 100 CRs varies dans Salesforce (Tasks),
 * puis synchronise raw_visit_reports pour la company admin (Demo Corp).
 *
 * Flow :
 *   1. Charge la connexion SF (refresh token si besoin)
 *   2. Genere 100 CRs a partir de templates + clients/concurrents randomises
 *   3. POST chaque Task sur l'API REST SF
 *   4. SOQL-fetch les Tasks creees (via Id IN)
 *   5. INSERT (pas upsert — evite de reset les 'done' existants) dans raw_visit_reports
 *   6. Update crm_connections.last_sync_at + records_synced
 *   7. Lance scripts/process-pending.js
 */

const crypto = require('crypto');
const { Client } = require('pg');
const { spawn } = require('child_process');
require('dotenv').config({ path: '.env.local' });

const PG = process.env.PG_CONNECTION;
const ALGORITHM = 'aes-256-gcm';
const ADMIN_COMPANY_ID = 'a0000000-0000-0000-0000-000000000001'; // Demo Corp

function getKey() {
  const key = process.env.CRM_ENCRYPTION_KEY;
  if (!key) throw new Error('CRM_ENCRYPTION_KEY not set');
  return Buffer.from(key.padEnd(32, '0').slice(0, 32), 'utf-8');
}

function decrypt(encryptedText) {
  const [ivHex, authTagHex, encrypted] = encryptedText.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

// --- Generateur de CRs ---

const COMMERCIALS = [
  { name: 'Sophie MARTIN', region: 'Ile-de-France' },
  { name: 'Thomas BERNARD', region: 'Nord' },
  { name: 'Marie LEFEVRE', region: 'Sud-Ouest' },
  { name: 'Alexandre VALETTE', region: 'Rhone-Alpes' },
  { name: 'Julie ROUSSEAU', region: 'Grand Est' },
  { name: 'Paul DUMONT', region: 'Bretagne' },
];

const CLIENTS = [
  'Carrefour Central', 'TechVision', 'Pharma Distri', 'AutoParts Pro', 'GreenTech Solutions',
  'MediGroup', 'DataFlow Corp', 'LogiPro SAS', 'BioSante Plus', 'Horizon Distribution',
  'Metal Precision', 'Plastimod', 'AgroNord', 'ElectroPower', 'TransLog',
  'Chimie Express', 'NovaTech', 'BuildMax', 'Dupont Industries', 'Oceane Distribution',
  'SudAgri', 'Vignobles Bordeaux', 'NantesTech', 'AquaPure', 'Aero Composites',
  'MerSud Logistics', 'EcoVert Services', 'Energie Plus', 'AlpinFood', 'RhoneDistri',
  'SaveurAlp', 'InduStrass', 'MecanoRhone', 'BoulangerIE', 'BreizhSea',
  'NormandProd', 'CiderCo', 'LorraineMetal', 'ChampagneCie', 'AlsaceBrew',
];

const COMPETITORS = ['Acme', 'Bexor', 'TechPro', 'Proxio', 'FabriMax', 'NovaCorp', 'ZenithIT'];

const REGIONS_PAR_COMMERCIAL = {
  'Sophie MARTIN': ['Ile-de-France', 'Normandie'],
  'Thomas BERNARD': ['Nord', 'Grand Est'],
  'Marie LEFEVRE': ['Sud-Ouest', 'Occitanie'],
  'Alexandre VALETTE': ['Rhone-Alpes', 'PACA'],
  'Julie ROUSSEAU': ['Grand Est', 'Bourgogne'],
  'Paul DUMONT': ['Bretagne', 'Pays de la Loire'],
};

const BESOINS_POOL = [
  'portail de commande en ligne avec suivi temps reel',
  'integration API RESTful avec notre ERP',
  'dashboard analytique temps reel',
  'module de gestion des retours et avoirs',
  'plateforme B2B pour les revendeurs',
  'reporting RSE et certification ISO 14001',
  'tracabilite lot par lot',
  'hotline 24/7 et stock de pieces detachees',
  'configurateur produit en ligne',
  'formation digitale avec quiz en ligne',
  'alertes SMS en cas de retard livraison',
  'integration SAP native',
  'interface multilingue pour filiales europeennes',
  'module de gestion de flotte eco-conduite',
  'capteurs IoT pour qualite de l\'air',
  'automatisation des commandes recurrentes',
  'outil de benchmark tarifaire',
  'application mobile pour commerciaux terrain',
  'conformite REACH et HSE',
  'marketplace B2B pour revendeurs',
];

// type_action pour comm concurrentes (whitelist comm-only)
const COMM_TYPES_POOL = [
  { type: 'salon', verb: 'est present au salon' },
  { type: 'pub', verb: 'a lance une campagne publicitaire' },
  { type: 'emailing', verb: 'envoie une campagne emailing' },
  { type: 'social', verb: 'est tres actif sur LinkedIn' },
  { type: 'presse', verb: 'a publie un article dans Usine Nouvelle' },
  { type: 'sponsoring', verb: 'sponsorise un evenement' },
];

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randFloat(min, max, decimals = 1) {
  return Math.round((Math.random() * (max - min) + min) * 10 ** decimals) / 10 ** decimals;
}

// Date uniformement repartie sur les 30 derniers jours
function randomRecentDate() {
  const daysAgo = randInt(0, 29);
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

const CR_TEMPLATES = [
  // Template 1 : concurrence + prix inferieur (remise demandee)
  (ctx) => {
    const ecart = randInt(8, 25);
    return {
      subject: `CR visite ${ctx.client} - Pression concurrentielle`,
      description: `Rendez-vous avec l'acheteur de ${ctx.client} en ${ctx.region}.
Situation tendue : ${ctx.concurrent} s'est positionne avec un prix ${ecart}% inferieur au notre sur la gamme standard.
Le client reconnait notre qualite superieure mais la pression budgetaire est forte ce trimestre.
Besoin exprime : ${ctx.besoin}.
Le directeur achats envisage de basculer 30% du volume si on ne s'aligne pas.
Deal en cours : concurrent ${ctx.concurrent} mieux positionne sur le prix.
Cause potentielle d'echec : prix non competitif.
Objectif : signature du renouvellement, non atteint pour le moment.`,
    };
  },
  // Template 2 : deal gagne face au concurrent
  (ctx) => ({
    subject: `CR visite ${ctx.client} - Signature contrat`,
    description: `Excellente nouvelle : signature du contrat chez ${ctx.client} apres 3 mois de negociation !
On a battu ${ctx.concurrent} grace a notre offre technique superieure et nos delais de livraison.
Montant : ${randInt(50, 300)}K EUR/an sur 2 ans.
Facteur de reussite : demo technique sur site et relation de confiance batie avec le DG.
Besoin pour la suite : ${ctx.besoin}.
Satisfaction elevee des operationnels depuis la phase de POC.
Objectif signature : atteint.`,
  }),
  // Template 3 : deal perdu
  (ctx) => {
    const motif = rand(['prix non competitif', 'timing rate (budget 2026 consomme)', 'concurrent mieux positionne', 'relation insuffisante au niveau direction', 'suivi commercial insuffisant']);
    return {
      subject: `CR visite ${ctx.client} - Deal perdu`,
      description: `Mauvaise nouvelle : ${ctx.client} a choisi ${ctx.concurrent} pour le renouvellement.
Motif principal : ${motif}.
${ctx.concurrent} a propose une solution tout-inclus avec maintenance integree.
Notre offre etait ${randInt(10, 30)}% plus chere sur la partie standard.
Perte estimee : ${randInt(60, 250)}K EUR/an.
On reste positionne pour la phase 2 si ${ctx.concurrent} ne tient pas ses promesses.
Deal perdu : ${motif}.
Cause d'echec : manque de flexibilite tarifaire.`,
    };
  },
  // Template 4 : satisfaction positive + opportunite
  (ctx) => ({
    subject: `CR visite ${ctx.client} - Bilan positif`,
    description: `Visite de routine chez ${ctx.client}. Tout va bien !
Le directeur technique est notre meilleur ambassadeur : il nous recommande a chaque salon professionnel.
Satisfaction maximale sur la qualite, le SAV et la reactivite.
Aucune pression concurrentielle : ${ctx.concurrent} a tente une approche mais le client n'a meme pas ecoute.
Besoin futur : ${ctx.besoin}.
Opportunite : le client veut nous presenter a sa filiale.
Objectif sell-out : atteint, +${randInt(3, 12)}% vs objectif trimestriel.
Facteur de reussite : proximite relationnelle et qualite constante.`,
  }),
  // Template 5 : reclamation / insatisfaction (severity rouge)
  (ctx) => ({
    subject: `CR visite ${ctx.client} - Reclamation urgente`,
    description: `Visite urgente suite a reclamation qualite sur le dernier lot livre.
Client tres mecontent : ${randInt(2, 5)} livraisons defectueuses ce trimestre.
${ctx.concurrent} a profite de la situation pour faire une offre proactive avec garantie qualite renforcee.
Le directeur qualite exige un plan d'amelioration sous 15 jours.
Impact financier pour le client : ${randInt(10, 50)}K EUR de perte.
Besoin urgent : ${ctx.besoin}.
Satisfaction : tres negative. Situation critique.
Objectif fidelisation : non atteint. Risque de perte imminente.
Cause d'echec : defaut qualite sur les 3 derniers mois.`,
  }),
  // Template 6 : prospection / nouveau client
  (ctx) => ({
    subject: `RDV ${ctx.client} - Prospection`,
    description: `Premier contact avec ${ctx.client}, entreprise en forte croissance en ${ctx.region}.
Rencontre avec le fondateur ou la directrice des operations.
Aucun concurrent en place : ils travaillent avec des artisans locaux peu fiables.
Besoin : fournisseur structure avec certification ISO et reporting RSE.
Budget previsionnel : ${randInt(100, 500)}K EUR/an en phase 1.
Opportunite majeure de new business.
Demande specifique : ${ctx.besoin}.
Objectif decouverte : atteint. Prochaine etape : POC en mai.
Facteur de reussite : differentiation environnementale et certifications.`,
  }),
  // Template 7 : communication concurrente (salon / pub / social / etc.)
  (ctx) => {
    const commAction = rand(COMM_TYPES_POOL);
    return {
      subject: `CR visite ${ctx.client} - Veille concurrence`,
      description: `Visite client chez ${ctx.client}. Le client nous signale que ${ctx.concurrent} ${commAction.verb} ces dernieres semaines.
Action de communication detectee : ${commAction.type}.
Impact : forte visibilite chez les acheteurs du secteur.
Le client nous demande si nous prevoyons une action similaire.
Besoin : ${ctx.besoin}.
Satisfaction globale : neutre. Rien de critique mais on doit reagir.
Reaction client face a ${ctx.concurrent} : positive — ils ont trouve la campagne impactante.
Objectif : veille terminee, a remonter au marketing pour reponse.`,
    };
  },
  // Template 8 : besoin urgent / prix superieur (pour positionnement favorable)
  (ctx) => {
    const ecart = randInt(5, 20);
    return {
      subject: `CR visite ${ctx.client} - Avantage prix`,
      description: `Point avec l'acheteur de ${ctx.client}.
Bonne nouvelle : ${ctx.concurrent} vient d'augmenter ses tarifs de ${ecart}% suite a la hausse des matieres premieres.
Notre prix est desormais ${ecart - 2}% inferieur, ce qui cree une opportunite de sell-in.
Le client est tres satisfait de cette dynamique.
Besoin : ${ctx.besoin}.
Opportunite : basculer une partie du volume du concurrent vers nous.
Objectif sell-in : en cours, proposition a envoyer semaine prochaine.
Facteur de reussite : stabilite de nos tarifs et anticipation.`,
    };
  },
  // Template 9 : formation / fidelisation
  (ctx) => ({
    subject: `CR visite ${ctx.client} - Formation equipes terrain`,
    description: `Session de formation des equipes terrain de ${ctx.client} sur nos nouveaux produits.
${randInt(5, 15)} participants, tres engages. Retours positifs unanimes.
Le pharmacien ou technicien responsable a identifie 3 produits a integrer en priorite.
${ctx.concurrent} ne propose aucun accompagnement comparable.
Besoin : ${ctx.besoin}.
Satisfaction elevee : le client apprecie l'investissement dans la formation.
Objectif formation : atteint, 100% des participants certifies.
Facteur de reussite : investissement dans l'accompagnement client long terme.`,
  }),
  // Template 10 : partenariat / co-innovation
  (ctx) => ({
    subject: `CR visite ${ctx.client} - Co-innovation`,
    description: `Session de co-innovation avec l'equipe R&D de ${ctx.client}.
Projet commun : developper ${ctx.besoin}.
Investissement partage : ${randInt(50, 200)}K EUR chacun sur 12 mois.
Aucun concurrent implique — projet exclusif.
Le CEO est visionnaire et tres motive.
Opportunite strategique : brevet conjoint + nouveau produit en catalogue.
Satisfaction de la collaboration : tres elevee.
Objectif partenariat : atteint. Lettre d'intention signee.
Facteur de reussite : vision partagee sur l'innovation durable.`,
  }),
  // Template 11 : SAV / delai
  (ctx) => ({
    subject: `CR visite ${ctx.client} - Probleme SAV`,
    description: `Visite post-incident : panne d'un equipement livre il y a 3 mois chez ${ctx.client}.
Delai d'intervention SAV : ${randInt(4, 7)} jours (engagement : 48h).
${ctx.concurrent} a propose un contrat de maintenance avec intervention sous 24h.
Le directeur technique menace de rompre le contrat si pas d'amelioration.
Besoin urgent : ${ctx.besoin}.
Satisfaction : tres negative sur le SAV, moderee sur la qualite produit.
Objectif fidelisation : non atteint.
Cause d'echec : SAV sous-dimensionne en region.`,
  }),
  // Template 12 : upsell cross-sell reussi
  (ctx) => ({
    subject: `CR visite ${ctx.client} - Upsell reussi`,
    description: `Excellente visite ! Upsell du module complementaire reussi chez ${ctx.client}.
Commande additionnelle de ${randInt(30, 100)}K EUR, activation le mois prochain.
Client tres satisfait de notre plateforme, NPS estime a 9/10.
Aucune pression de ${ctx.concurrent} — tres fidele.
Le DG veut nous recommander a deux entreprises partenaires.
Besoin futur : ${ctx.besoin}.
Objectif sell-in : atteint. Cross-sell reussi.
Facteur de reussite : relation de confiance et ROI demontre sur le module de base.`,
  }),
];

// Genere une liste de 100 CRs varies
function generate100CRs() {
  const crs = [];
  for (let i = 0; i < 100; i++) {
    const commercial = rand(COMMERCIALS);
    const region = rand(REGIONS_PAR_COMMERCIAL[commercial.name] || [commercial.region]);
    const client = rand(CLIENTS);
    const concurrent = rand(COMPETITORS);
    const besoin = rand(BESOINS_POOL);
    const template = rand(CR_TEMPLATES);
    const generated = template({ client, concurrent, besoin, region });
    crs.push({
      commercial: commercial.name,
      client,
      region,
      date: randomRecentDate(),
      subject: generated.subject,
      description: generated.description,
    });
  }
  return crs;
}

// --- SF token management ---
async function loadSFToken(db) {
  const { rows } = await db.query(
    "SELECT * FROM crm_connections WHERE company_id = $1 AND provider = 'salesforce' AND status = 'connected' LIMIT 1",
    [ADMIN_COMPANY_ID]
  );
  if (rows.length === 0) throw new Error('No SF connection for admin company');
  const conn = rows[0];
  let accessToken = decrypt(conn.config_json.access_token_encrypted);
  const refreshToken = decrypt(conn.config_json.refresh_token_encrypted);

  if (new Date(conn.config_json.token_expires_at) < new Date()) {
    console.log('[SF] token expired, refreshing...');
    const res = await fetch('https://login.salesforce.com/services/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: process.env.SALESFORCE_CLIENT_ID,
        client_secret: process.env.SALESFORCE_CLIENT_SECRET,
        refresh_token: refreshToken,
      }),
    });
    if (!res.ok) throw new Error('Token refresh failed: ' + (await res.text()));
    const data = await res.json();
    accessToken = data.access_token;
    await db.query(
      `UPDATE crm_connections SET config_json = $1 WHERE id = $2`,
      [
        {
          access_token_encrypted: encrypt(accessToken),
          refresh_token_encrypted: conn.config_json.refresh_token_encrypted,
          token_expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        },
        conn.id,
      ]
    );
    console.log('[SF] token refreshed');
  }

  return { conn, accessToken };
}

async function pushTaskToSF(instanceUrl, accessToken, cr) {
  const res = await fetch(`${instanceUrl}/services/data/v59.0/sobjects/Task`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      Subject: cr.subject,
      Description: cr.description,
      ActivityDate: cr.date,
      Status: 'Completed',
      Priority: 'Normal',
    }),
  });
  if (!res.ok) {
    throw new Error(`SF Task POST failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return data.id;
}

// Fetch back the Tasks we just created via SOQL
async function fetchTasksByIds(instanceUrl, accessToken, ids) {
  const results = [];
  // SOQL IN clause has a practical limit ~200 — on est large avec 100 en 1 batch
  const inClause = ids.map((id) => `'${id}'`).join(',');
  const soql = `
    SELECT Id, Subject, Description, CreatedDate, ActivityDate, LastModifiedDate,
           OwnerId, WhoId, WhatId, Owner.Email, Owner.Name,
           What.Name, What.Id, Who.Name
    FROM Task
    WHERE Id IN (${inClause})
  `.trim().replace(/\s+/g, ' ');
  const res = await fetch(
    `${instanceUrl}/services/data/v59.0/query?q=${encodeURIComponent(soql)}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) throw new Error(`SOQL fetch failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  results.push(...(data.records || []));
  return results;
}

// --- Run process-pending as child process, return exit code ---
function runProcessPending() {
  return new Promise((resolve, reject) => {
    const child = spawn('node', ['scripts/process-pending.js'], {
      stdio: 'inherit',
      env: process.env,
    });
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`process-pending exited with code ${code}`));
    });
  });
}

// --- Main ---
async function main() {
  console.log('=== seed-100-crs.js — target company: Demo Corp (admin) ===\n');
  const db = new Client({ connectionString: PG });
  await db.connect();

  // 1. Load SF connection
  const { conn, accessToken } = await loadSFToken(db);
  const instanceUrl = conn.instance_url;
  console.log(`[SF] instance: ${instanceUrl}`);

  // 2. Generate 100 CRs
  const crs = generate100CRs();
  console.log(`[GEN] ${crs.length} CRs generated\n`);

  // 3. Push to SF
  console.log('[SF] pushing Tasks to Salesforce...');
  const sfIds = [];
  let pushed = 0;
  let failed = 0;
  for (let i = 0; i < crs.length; i++) {
    const cr = crs[i];
    try {
      const sfId = await pushTaskToSF(instanceUrl, accessToken, cr);
      sfIds.push(sfId);
      pushed++;
      if ((i + 1) % 10 === 0) console.log(`  ${i + 1}/${crs.length} pushed`);
    } catch (err) {
      failed++;
      console.error(`  FAIL #${i}: ${cr.subject} — ${err.message}`);
    }
  }
  console.log(`[SF] ${pushed}/${crs.length} Tasks pushed (${failed} failed)\n`);

  if (sfIds.length === 0) {
    console.error('No Tasks pushed. Abort.');
    await db.end();
    process.exit(1);
  }

  // 4. Fetch them back (pour recuperer Owner.Name etc. tel que vu par SF)
  console.log('[SYNC] fetching Tasks from SF via SOQL...');
  const tasks = await fetchTasksByIds(instanceUrl, accessToken, sfIds);
  console.log(`[SYNC] ${tasks.length} Tasks fetched back\n`);

  // 5. Insert into raw_visit_reports (INSERT ON CONFLICT DO NOTHING to keep existing 'done' rows intact)
  console.log('[SYNC] inserting into raw_visit_reports...');
  let inserted = 0;
  for (const task of tasks) {
    // Trouver le commercial_name depuis notre generation pour forcer la variete
    // (sinon Owner.Name sera toujours Alexandre VALETTE qui possede les tokens SF)
    const origCr = crs.find((c) => c.subject === task.Subject && c.date === task.ActivityDate);
    const commercialName = origCr ? origCr.commercial : (task.Owner?.Name ?? null);
    const clientName = origCr ? origCr.client : (task.What?.Name ?? task.Who?.Name ?? null);

    const r = await db.query(
      `INSERT INTO raw_visit_reports
         (company_id, crm_connection_id, external_id, content_text, subject,
          commercial_email, commercial_name, client_name, visit_date,
          raw_json, processing_status, synced_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending', NOW())
       ON CONFLICT (company_id, external_id) DO NOTHING`,
      [
        ADMIN_COMPANY_ID,
        conn.id,
        task.Id,
        task.Description ?? null,
        task.Subject ?? null,
        task.Owner?.Email ?? null,
        commercialName,
        clientName,
        task.ActivityDate ?? null,
        task,
      ]
    );
    if (r.rowCount > 0) inserted++;
  }
  console.log(`[SYNC] ${inserted} new raw_visit_reports inserted\n`);

  // 6. Update connection metadata
  await db.query(
    `UPDATE crm_connections
     SET last_sync_at = NOW(),
         last_sync_error = NULL,
         records_synced = COALESCE(records_synced, 0) + $1
     WHERE id = $2`,
    [inserted, conn.id]
  );
  console.log('[SYNC] crm_connections updated\n');

  await db.end();

  // 7. Run pipeline twice (limit 50 par run)
  console.log('[PIPELINE] running process-pending (pass 1/2)...\n');
  await runProcessPending();
  console.log('\n[PIPELINE] running process-pending (pass 2/2)...\n');
  await runProcessPending();

  console.log('\n=== DONE. Login admin@field-intel.com (demo1234) et constate les nouveaux signaux ===');
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
