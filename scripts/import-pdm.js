#!/usr/bin/env node
/**
 * Import PDM :
 *  1. Crée les CRs en tant que Tasks dans Salesforce
 *  2. Insère les abréviations dans la table abbreviations (Supabase)
 *
 * Usage : node scripts/import-pdm.js
 */
/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { Client } = require('pg');

const SF_API_VERSION = 'v59.0';

// ---------------------------------------------------------------------------
// .env.local
// ---------------------------------------------------------------------------
(function loadDotEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) return;
  for (const raw of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const k = line.slice(0, eq).trim();
    const v = line.slice(eq + 1).trim();
    if (!(k in process.env)) process.env[k] = v;
  }
})();

// ---------------------------------------------------------------------------
// AES-256-GCM decrypt (même format que src/lib/crm/encryption.ts)
// ---------------------------------------------------------------------------
function decryptAesGcm(encrypted) {
  const raw = process.env.CRM_ENCRYPTION_KEY;
  if (!raw || raw.length !== 64 || !/^[0-9a-fA-F]+$/.test(raw)) {
    throw new Error('CRM_ENCRYPTION_KEY doit être 64 hex chars');
  }
  const key = Buffer.from(raw, 'hex');
  const [ivHex, tagHex, dataHex] = encrypted.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const data = Buffer.from(dataHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}

// ---------------------------------------------------------------------------
// Données
// ---------------------------------------------------------------------------

// CRs extraits du document PDM.docx (un paragraphe = un CR)
const CRS = [
  `PDM : 84% Potentiel : 200 Acteurs : ROCHE et My Life Retours 2025 : Bascule vers ROCHE, reste quelques récalcitrant My Life. Rotation total B7 : Pas le temps pour me communiquer. Rotation ROCHE : B7 : 75 reste 10 K7 : 8 reste 6 L7 : 40 reste 5 AF : 152 reste 40 Objectif AF -> Atteint Objectif tests -> Atteint Next rdv diabco et autopiqueurs. Cliente pro roche, ok pour continuer de développer. Envoie de 16 lecteurs guide. Next rdv le 21/04Voir si elle a reçu sa rémunération groupement 2025. PDM : 84% Potentiel : 200 Bilan : 3 périmés et 5 autres en août. Les LM sont périmés, et 3 Performa vont périmer en septembre. Pour cela, nous sommes d'accord pour compenser le tout sur l'année avec 10 AF 4mm sur la dernière livraison. Impossible de faire plus de tests car elle fait déjà tout avec nous au max. Elle va m'envoyer un mail avec photos des périmés et futur périmés et je lui ai dis que nous pouvons organiser une formation équipe diabco. Prévu / Stock / SL B7 : 27 / 20 /27 K7 : 0 / 0 / 0 L7 : 17 / 12 / 17 Next rdv le 30/07 à 9h30`,
  `Contrat signé en décroissance PDM : 82% Potentiel : 91 Acteurs : AC Retours 2025 : Ne veut pas faire les AF ASG : Objectif AF -> Non atteint Objectif vs n-1 -> Décroissance -18 tests Next rdv le début juillet.`,
  `PDM : 20% Potentiel : 249 Acteurs : AC et LS Retours 2025 : LS N°1 car commerciale terrain et prescription LS. Ok pour éssayer de faire plus de PDM mais demande formation équipe terrain. Il faut appeler le numéro et taper 1 et demander justine car elle est aux comptoir et c'est elle qui prends les rdv pour formation équipe. C'est une pharmacie de 30 personnes. Ne veut pas cadencer. Envoie mail diabco et boite B7 pour dépistage. Rotation total B7 : Rotation ROCHE / Stock / SL : B7 : 31 / 0 SL / 8 K7 : 46 / 0 / 15 L7 : 40 / 0 / 9 Aiguilles : BD, j'ai parlé de AF mais n'a pas voulu communiquer le prix. Elle me dis que moins d'1€ de différence. J'ai dis que je pouvais lui assurer un prix de 6€27 si ok de passer avec nous. Elle en parle au titulaire. Objectif AF -> A suivre Objectif vs n-1 -> A suivre Objectif groupement -> A suivre Next rdv le 19 juin à 14h`,
  `PDM : 100% Potentiel : 43 Bilan : Titulaire en vacance. Envoi d'un mail pour lui dire que la livraison approche. Prévu / Stock / SL B7 : K7 : L7 : B7P :`,
  `rdv avec François. Voir pour mettre un prévisionnel. PDM : 76% Potentiel : 144 Bilan : Il vont switcher les patientes B7P pour B7 donc ajouter de 20B7 à la place des B7P. Surstock de la moitié de l'année. Ils font que AC et ont que 1 patients sur verio et 1 sur contour qu'ils ne peuvent pas switcher. Stock / SL B7 : 88 reste 28 K7 : 15 reste 3 L7 : 80 reste 17 B7P : 20 reste 2 Aiguilles : Unifine à 8,31€ mais le titulaire ne veut pas changer et il est fermé à switcher avec des AF margés argument. Essayer l'année pro. Objectif AF -> Non atteint Objectif vs n-1 -> En décroissance Objectif groupement ->Atteint Next rdv le 15/09 à 10h30`,
  `Rdv avec François (pas le titulaire). Encore 3 mois de stock sur les B7. Ne fais plus de K7. On a fais une commande addi en attendant le prochain rdv : 4K7, 24L7. Next rdv le 21/04 à 10h.`,
  `PDM : 69% Potentiel : 129 Acteurs : AC et LS Retours 2025 : Impact capteur, une patiente sur K7 est passée sur capteur donc baisse à prévoir des K7. Surstock de 6 mois sur les B7. Je lui ai dis de rationnaliser et de switcher les patients LS vers AC en utilisant diabco. Mail diabco ok. Elle a déja bien switcher car n-1 30% de PDM. Rotation total B7 : Rotation ROCHE : B7 : 60 reste 28 K7 : 25 reste 0 L7 : 30 reste 12 ASG : AF Objectif AF -> Atteint Objectif vs n-1 -> En décroissance Objectif groupement -> 70% de PDM ->125 tests, non atteint sur le cadencé. Next rdv le 07/07 à 14h`,
  `Voir si elle a reçu sa rémunération groupement 2025. PDM : 84% Potentiel : 200 Bilan : 3 périmés et 5 autres en août. Les LM sont périmés, et 3 Performa vont périmer en septembre. Pour cela, nous sommes d'accord pour compenser le tout sur l'année avec 10 AF 4mm sur la dernière livraison. Impossible de faire plus de tests car elle fait déjà tout avec nous au max. Elle va m'envoyer un mail avec photos des périmés et futur périmés et je lui ai dis que nous pouvons organiser une formation équipe diabco. Prévu / Stock / SL B7 : 27 / 20 /27 K7 : 0 / 0 / 0 L7 : 17 / 12 / 17 Next rdv le 30/07 à 9h30.`,
  `PDM : 95% Potentiel : 144 Bilan : RAS, livraison avancée de 2 semaines et ajout de lecteur guide. Prévu / Stock / SL B7 : 37 / 4 / 37 K7 : 9 / 8 / 9 L7 : 17 / 7 / 17 B7P : 2 Next rdv le 20/07 à 10h`,
  `PDM : 66% Potentiel : 128 Bilan : Pas encore pu faire de vrai rdv car il a vraiment pas le temps et me raccroche presque au nez. J'ai éssayé de parler des AF, il fait BD, envoie d'un mail pour lui expliquer. Stock / SL B7 : 13 / 12 K7 : 0 / 0 = Plus de sortie L7 : 7 / 6 B7P : - / 3`,
  `PDM : 87% Potentiel : 41 Bilan : RAS, Signature offre 1P-1B et animation dépistage. Stock / SL B7 : 12 (6-8mois) / 10 K7 : 17 (4-10mois) / 4 L7 : 9 (5-7mois) / 15 Next rdv le 18 juin à 9h15`,
  `On a fait une commande addi le 23/02 en attendant rdv accords : 10K7, 6L7, 10B7 PDM : 87% Potentiel : 41 Acteurs : ROCHE, YPSOMED, LS Retours 2025 : Bons retours, pour entretien diabconnect elle avait essayé mais avait eu du mal à connecter le lecteur à l'app donc a abandonné. Ok pour développer AC Rotation total B7 : 244 Ypsomed : 48 LS : 35 Rotation ROCHE : 161 B7 : 88 reste 9 K7 : 73 recu 10 de la commande addi L7 : 63 reste 9 AF : Travailler YPSOMED moins chère Objectif AF -> Non atteint Objectif tests -> Atteint en croissance Ok pour obj 164 tests sur 2026 J'ai parlé des autopiqueurs, voir si mise en place. Next rdv le 20/04 à 10h`,
  `PDM : 91% Potentiel : 171 Bilan : RAS, il essaie de déstocker. Il a prix quelques AF. Stock / SL B7 : 53 / 0 K7 : 1 / 6 L7 : 10 / 12 AF 4 : 0 / 3 Next rdv le début juin`,
  `PDM : 64% Potentiel : 276 Bilan : Pas dispo, envoie par mail de la prochaine livraison, en attente si modifs. Prévu / Stock / SL B7 : 30 / / 30 K7 : 16 / 4mois / 0 L7 : 20 / / 20 + 12AF5 On à supp les K7, voir pour le prochain rdv ce qu'ils ont fait en 2025 et ce qui est prévu pour 2026 pour rester en croissance.`,
  `PDM : 96% Potentiel : 123 Acteurs : AC Retours 2025 : Cliente PRO ROCHE mais énorme impact capteur. Vente divisée par 2/3 en 1 an. Rotation ROCHE : B7 : 30 K7 : 80 L7 : 20 Cadencé signé sur même rotation. ASG : Marque verte à 5,5€ Objectif AF -> Non Objectif vs n-1 -> Légère décroissance Next rdv le 22/07 avec adjoint Jean-Baptiste`,
  `Formation diabco avec CONSTANCE ok`,
  `RDV FIXE avec Mme Poujol Commande addi le 03/04 : 2B7, 8K7, 3L7 Ils vont chez le grossiste PDM : 29% Potentiel : 115 Acteurs : AC et LS Retours 2025 : Priorise LS mais ok pour ne plus aller chez le grossiste. Ok de tester 20 AF de 4mm. J'ai évoquer 3 leviers (diabco, autopiqueurs et marge aiguille). Objectif ne plus aller chez le grossiste. Rotation ROCHE : B7 : 0 K7 : 32 L7 : 12 ASG : BD mais ok essayer AF Objectif AF -> Atteint Objectif vs n-1 -> Croissance Objectif groupement -> Atteint Formation diabco au prochain rdv. Next rdv le 22/05 à 10h`,
  `RDV FIXE, commande addi le 27/03 : 12L7, 12K7, elle fait les AF mais finissait le stock d'autre acteur et vas commencer les AF PDM : 89% Potentiel : 85 Acteurs : AC Retours 2025 : PRO ROCHE, formation diabco équipe prévu le 30/04 à 14h. Rotation ROCHE : B7 : 89 reste 16 K7 : 40 reste 22 L7 : 88 reste 22 ASG : Marque verte car cherche marge et prix mais AF aussi mais souhaite écouler le stock AF avant de recommander. Objectif AF -> A suivre Objectif vs n-1 -> Croissance Objectif groupement -> Atteint Next rdv le 10/07 à 10h`,
  `PDM : 24% Potentiel : 205 Pas honoré le rdv et j'ai envoyé un mail pour reprendre rdv Acteurs : Retours 2025 : Rotation total B7 : Rotation ROCHE : B7 : K7 : L7 : ASG : Objectif AF -> Objectif vs n-1 -> Objectif groupement -> Next rdv le`,
  `PDM : 100% Potentiel : 6 Acteurs : AC Retours 2025 : Faible volume mais en croissance. 9B7 1K7, 1LM périmés, compensation avec 9 AF 4mm pour 20 AF achetés. Rotation total B7 : Rotation ROCHE : B7 : 24 K7 : 0 L7 : 18 reste 12 ASG : BD mais test les AF Objectif AF -> Atteint Objectif vs n-1 -> Croissance Objectif groupement -> Atteint Commande addi : 20 AF, 12B7 et 8 LG Reviens vers moi quand elle a des besoins.`,
  `PDM : 73% Potentiel : 60 Acteurs : AC et LS Retours 2025 : Plus accord groupement. Trop petit potentiel pour ouvrir un marché partenaire et son groupement à des accords avec contour. Impossible de dev ASG cette année car stocker sur BD. Rotation ROCHE : B7 : 20 K7 : 20 L7 : 20 ASG : BD`,
  `Commande addi de 20L7, 10LG, 1LM, 1K7 pour envoyer des LG.`,
  `RDV avec FLORIAN BARNES (Autre titulaire) admin@gpa16.fr PDM : 56% Potentiel : 115 Acteurs : ROCHE, LS, YPS Retours 2025 : RAS, J'étais avec M.BARNES qui est l'autre titulaire et qui n'avait aucun recul sur AC, les ventes, conditions ect... donc je lui ai tout expliqué (intérêt, animations, diabco ect...). Il est surstocker, compliquer de tenir les accords, il a aussi d'autres accords avec LS et souhaite continuer de travailler les 2. Rotation total B7 : A faire prochaine fois Rotation ROCHE : B7 : 52 reste 22 K7 : 21 reste 4 L7 : 43 reste 23 B7P : 0 reste 2 ASG : PIC à 5,40€ Objectif AF -> Non atteint Objectif vs n-1 -> Non atteint Objectif groupement -> Non atteint Next rdv début juin avant livraison`,
  `PDM : 89% Potentiel : 46 Acteurs : AC, YPS Retours 2025 : Il a basculé des patients sur YPS car B7 moins chère. Il ne veut pas switch YPS vers AC mais ne va pas continuer de switch AC vers YPS (Surveiller). Ne veut pas cadencer. Commande addi : 15K7, 8L7 Rotation total B7 : yps : 30 Rotation ROCHE : B7 : 34 reste 21 K7 : 54 reste 5 L7 : 24 reste 4 ASG : PIC à moins de 6€ Objectif AF -> Non atteint Objectif vs n-1 -> A suivre Objectif groupement -> Atteint mais à suivre Next rdv le mi-fin juin`,
  `La titulaire n'a pas souhaité me prendre au téléphone par manque de besoins actuels ; elle me recontactera si nécessaire pour les accords de groupement.`,
  `Laurence Mazas PDM : 77% Potentiel : 151 Acteurs : AC Retours 2025 : Surstock, pas le temps pour diabco. Ok pour animation dépistage j'ai envoyé le bon commande. Ok de continuer un peu AF mais pas très bon retours des patients qui veulent BD. Impact capteur malgré une bonne délivrance de lecteur guide (13). Elle souhaite un récap poussé et technique des informations sur la législation et sur le remboursement du matériel d'autosurveillance glycémique (ASG). Rotation total B7 : LS, accords avec eux et prescription. Rotation ROCHE : B7 : 60 reste 30 K7 : 14 reste 4 L7 : 50 reste 10 B7P : 20 reste 2 ASG : BD et AF Objectif AF -> Atteint Objectif vs n-1 -> Décroissance Objectif groupement -> Atteint Next rdv le 07/07 à 14h`,
  `Voir comment l'accompagner avec des services PDM :65% Potentiel : 162 Bilan : RAS, On avance la livraison de 2 semaines car besoins. Formation diabco à l'équipe le 27/04 à 14h30 pour développer AC. Stock/ Prévu / SL B7 : 1 / 27 / 27 K7 : 1 / 10 / 10 L7 : NA / 21 / 21 Next rdv le 27/04 à 14h30`,
];

// Abréviations extraites du document
const ABBREVIATIONS = [
  { short: 'LG',     full: 'Lecteur guide',                                              category: 'technique' },
  { short: 'B7',     full: 'Bandelettes guides',                                         category: 'technique' },
  { short: 'K7',     full: 'Cassette mobile',                                            category: 'technique' },
  { short: 'L7',     full: 'Lancettes mobiles',                                          category: 'technique' },
  { short: 'B7P',    full: 'Bandelette performa',                                        category: 'technique' },
  { short: 'AF',     full: 'Aiguille Accu-Fine',                                         category: 'technique' },
  { short: 'ASG',    full: 'Aiguilles (Autosurveillance Glycémique)',                    category: 'technique' },
  { short: 'Diabco', full: 'Formation DiabéConnect',                                     category: 'general' },
  { short: 'LS',     full: 'Lyfescan',                                                   category: 'commercial' },
  { short: 'Tests',  full: 'Bandelettes guide, cassette mobile et bandelette performa',  category: 'technique' },
];

// ---------------------------------------------------------------------------
// Salesforce helpers
// ---------------------------------------------------------------------------
async function refreshToken(refreshToken) {
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
  if (!res.ok) throw new Error(`Refresh failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function createTask(accessToken, instanceUrl, description) {
  const subject = description.slice(0, 80).replace(/\n/g, ' ');
  const body = {
    Subject: subject,
    Description: description,
    Status: 'Completed',
    ActivityDate: new Date().toISOString().split('T')[0],
  };
  const res = await fetch(`${instanceUrl}/services/data/${SF_API_VERSION}/sobjects/Task`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Create Task failed: ${res.status} ${err}`);
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const pg = new Client({
    connectionString: process.env.PG_CONNECTION,
    ssl: { rejectUnauthorized: false },
  });
  await pg.connect();

  // ---- Récupérer company_id admin ----------------------------------------
  const { rows: companyRows } = await pg.query(
    "SELECT id FROM companies LIMIT 1"
  );
  if (companyRows.length === 0) throw new Error('Aucune company trouvée en DB');
  const companyId = companyRows[0].id;
  console.log(`[import-pdm] Company ID : ${companyId}`);

  // ---- 1. ABRÉVIATIONS dans Supabase ------------------------------------
  console.log('\n[import-pdm] === Insertion des abréviations ===');
  let abbrevInserted = 0;
  let abbrevSkipped = 0;
  for (const abbrev of ABBREVIATIONS) {
    // Vérifier si l'abréviation existe déjà
    const { rows: existing } = await pg.query(
      'SELECT id FROM abbreviations WHERE company_id=$1 AND short=$2',
      [companyId, abbrev.short]
    );
    if (existing.length > 0) {
      console.log(`  ⏭  ${abbrev.short} — déjà présente, skip`);
      abbrevSkipped++;
      continue;
    }
    await pg.query(
      'INSERT INTO abbreviations (company_id, short, "full", category) VALUES ($1, $2, $3, $4)',
      [companyId, abbrev.short, abbrev.full, abbrev.category]
    );
    console.log(`  ✓ ${abbrev.short} → ${abbrev.full}`);
    abbrevInserted++;
  }
  console.log(`  → ${abbrevInserted} insérées, ${abbrevSkipped} ignorées (déjà présentes)`);

  // ---- 2. CRs dans Salesforce -------------------------------------------
  console.log('\n[import-pdm] === Création des Tasks Salesforce ===');

  // Récupérer la connexion Salesforce
  const { rows: connRows } = await pg.query(
    "SELECT instance_url, config_json FROM crm_connections WHERE company_id=$1 AND provider='salesforce' AND status='connected' ORDER BY updated_at DESC LIMIT 1",
    [companyId]
  );
  if (connRows.length === 0) {
    throw new Error('Aucune connexion Salesforce active. Connectez Salesforce dans /admin/integrations.');
  }
  const conn = connRows[0];
  let accessToken = decryptAesGcm(conn.config_json.access_token_encrypted);
  const refreshTok = decryptAesGcm(conn.config_json.refresh_token_encrypted);
  const instanceUrl = conn.instance_url;

  // Refresh si expiré
  const expiresAt = conn.config_json.token_expires_at ? new Date(conn.config_json.token_expires_at).getTime() : 0;
  if (Date.now() >= expiresAt - 60_000) {
    console.log('  [token] Refresh du token...');
    const refreshed = await refreshToken(refreshTok);
    accessToken = refreshed.access_token;
  }

  console.log(`  Instance : ${instanceUrl}`);
  console.log(`  ${CRS.length} CRs à créer...\n`);

  let created = 0;
  let errors = 0;
  for (let i = 0; i < CRS.length; i++) {
    const cr = CRS[i];
    try {
      const result = await createTask(accessToken, instanceUrl, cr);
      console.log(`  [${i + 1}/${CRS.length}] ✓ Task créée : ${result.id}`);
      created++;
    } catch (err) {
      console.error(`  [${i + 1}/${CRS.length}] ✗ Erreur : ${err.message.slice(0, 120)}`);
      errors++;
    }
    // Petit délai pour ne pas saturer l'API
    await new Promise(r => setTimeout(r, 100));
  }

  console.log(`\n[import-pdm] === Résumé ===`);
  console.log(`  Salesforce Tasks : ${created} créées, ${errors} erreurs`);
  console.log(`  Abréviations     : ${abbrevInserted} insérées, ${abbrevSkipped} ignorées`);

  await pg.end();
}

main().catch((err) => {
  console.error('[import-pdm] FAILED:', err.message || err);
  process.exit(1);
});
