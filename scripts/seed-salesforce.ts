/**
 * Seed Salesforce Dev Org with realistic test data
 *
 * Creates: Accounts, Contacts, and Tasks (visit reports / CR)
 * with French business content that will trigger signal extraction.
 *
 * Usage: npx tsx scripts/seed-salesforce.ts
 *
 * Prerequisites:
 *   - Salesforce connected in the app (tokens stored in crm_connections)
 *   - .env.local with SUPABASE keys
 */

import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import { createClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const SF_API = 'v59.0';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
async function getTokens() {
  const { data, error } = await supabase
    .from('crm_connections')
    .select('*')
    .eq('provider', 'salesforce')
    .eq('status', 'connected')
    .single();

  if (error || !data) throw new Error('No Salesforce connection found. Connect Salesforce first.');

  // Decrypt tokens — uses aes-256-gcm with format iv:authTag:encrypted
  const CRM_KEY = process.env.CRM_ENCRYPTION_KEY!;
  const crypto = await import('crypto');

  function decrypt(encryptedText: string) {
    const [ivHex, authTagHex, encryptedHex] = encryptedText.split(':');
    const key = Buffer.from(CRM_KEY.padEnd(32, '0').slice(0, 32), 'utf-8');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  const accessToken = decrypt(data.config_json.access_token_encrypted);
  const instanceUrl = data.instance_url;
  return { accessToken, instanceUrl, companyId: data.company_id };
}

async function sfCreate(instanceUrl: string, token: string, sobject: string, record: Record<string, any>) {
  const res = await fetch(`${instanceUrl}/services/data/${SF_API}/sobjects/${sobject}/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(record),
  });
  const body = await res.json();
  if (!res.ok) {
    console.error(`  ✗ Failed to create ${sobject}:`, JSON.stringify(body));
    return null;
  }
  return body.id as string;
}

// ---------------------------------------------------------------------------
// Test Data
// ---------------------------------------------------------------------------
const ACCOUNTS = [
  { Name: 'Dupont Industries', Industry: 'Manufacturing', BillingCity: 'Lyon', BillingCountry: 'France', Phone: '04 72 00 11 22', Website: 'https://dupont-industries.fr', Description: 'Client historique, fabrication industrielle, CA 2.5M' },
  { Name: 'Groupe Mercier', Industry: 'Retail', BillingCity: 'Marseille', BillingCountry: 'France', Phone: '04 91 00 33 44', Website: 'https://groupe-mercier.fr', Description: 'Distribution retail, 15 points de vente Sud' },
  { Name: 'Horizon Distribution', Industry: 'Distribution', BillingCity: 'Paris', BillingCountry: 'France', Phone: '01 40 00 55 66', Description: 'Grossiste IDF, fort volume, sensible aux prix' },
  { Name: 'Bertrand & Fils', Industry: 'Construction', BillingCity: 'Bordeaux', BillingCountry: 'France', Phone: '05 56 00 77 88', Description: 'BTP Sud-Ouest, client fidele depuis 8 ans' },
  { Name: 'LogiPro SAS', Industry: 'Technology', BillingCity: 'Nantes', BillingCountry: 'France', Phone: '02 40 00 99 00', Description: 'Solutions logistiques, en forte croissance' },
  { Name: 'NovaTech', Industry: 'Technology', BillingCity: 'Toulouse', BillingCountry: 'France', Phone: '05 61 00 11 22', Description: 'Innovation tech, prospect strategique, CA potentiel 800K' },
  { Name: 'BioSante Plus', Industry: 'Healthcare', BillingCity: 'Strasbourg', BillingCountry: 'France', Phone: '03 88 00 33 44', Description: 'Sante et bien-etre, 8 sites en France' },
  { Name: 'EcoVert Services', Industry: 'Environmental', BillingCity: 'Lille', BillingCountry: 'France', Phone: '03 20 00 55 66', Description: 'Services environnementaux, nouveaux besoins digitalisation' },
];

const CONTACTS: { accountIndex: number; FirstName: string; LastName: string; Title: string; Email: string; Phone: string }[] = [
  { accountIndex: 0, FirstName: 'Jean-Pierre', LastName: 'Dupont', Title: 'Directeur Achats', Email: 'jp.dupont@dupont-industries.fr', Phone: '06 12 34 56 78' },
  { accountIndex: 0, FirstName: 'Marie', LastName: 'Laurent', Title: 'Responsable Production', Email: 'm.laurent@dupont-industries.fr', Phone: '06 23 45 67 89' },
  { accountIndex: 1, FirstName: 'Philippe', LastName: 'Mercier', Title: 'PDG', Email: 'p.mercier@groupe-mercier.fr', Phone: '06 34 56 78 90' },
  { accountIndex: 1, FirstName: 'Sophie', LastName: 'Renaud', Title: 'Directrice Commerciale', Email: 's.renaud@groupe-mercier.fr', Phone: '06 45 67 89 01' },
  { accountIndex: 2, FirstName: 'François', LastName: 'Martin', Title: 'Responsable Approvisionnement', Email: 'f.martin@horizon-distrib.fr', Phone: '06 56 78 90 12' },
  { accountIndex: 3, FirstName: 'Alain', LastName: 'Bertrand', Title: 'Gerant', Email: 'a.bertrand@bertrand-fils.fr', Phone: '06 67 89 01 23' },
  { accountIndex: 4, FirstName: 'Claire', LastName: 'Dubois', Title: 'CTO', Email: 'c.dubois@logipro.fr', Phone: '06 78 90 12 34' },
  { accountIndex: 5, FirstName: 'Thomas', LastName: 'Girard', Title: 'Directeur Innovation', Email: 't.girard@novatech.fr', Phone: '06 89 01 23 45' },
  { accountIndex: 6, FirstName: 'Nathalie', LastName: 'Leroy', Title: 'Directrice Generale', Email: 'n.leroy@biosante-plus.fr', Phone: '06 90 12 34 56' },
  { accountIndex: 7, FirstName: 'David', LastName: 'Moreau', Title: 'Responsable Digital', Email: 'd.moreau@ecovert.fr', Phone: '06 01 23 45 67' },
];

// Realistic French visit reports (CR) — each contains signals for the AI to extract
const TASKS: { accountIndex: number; contactIndex: number; Subject: string; Description: string; ActivityDate: string }[] = [
  {
    accountIndex: 0, contactIndex: 0,
    Subject: 'CR visite Dupont Industries - Revue contrat annuel',
    ActivityDate: '2026-04-10',
    Description: `Compte rendu de visite — Dupont Industries — 10 avril 2026

Interlocuteurs : Jean-Pierre Dupont (Dir. Achats), Marie Laurent (Resp. Production)

Contexte : Revue annuelle du contrat cadre. Le client est globalement satisfait de nos produits mais remonte des points d'attention.

Points cles :
- Dupont Industries a ete demarche par Acme le mois dernier. Acme propose des tarifs 12% inferieurs sur la gamme standard. JP Dupont m'a montre le devis Acme. Ils n'ont pas encore signe mais reflechissent.
- Le client demande un catalogue numerique interactif pour ses equipes terrain. C'est un besoin nouveau, ils veulent pouvoir scanner les references et voir les fiches techniques sur tablette.
- Les delais de livraison du dernier trimestre etaient trop longs (8 jours en moyenne vs 5 jours contractuels). Marie Laurent est tres remontee sur ce point.
- Malgre tout, la qualite produit est reconnue comme superieure a la concurrence. Le taux de retour est quasi nul.

Opportunite : Possibilite d'upsell vers la gamme Pro sur leur nouvelle ligne de production. Potentiel estime a 45K euros annuels.

Prochain RDV : 24 avril pour presentation gamme Pro.
Objectif visite : fidelisation — ATTEINT (le client reste ouvert malgre l'approche Acme)`,
  },
  {
    accountIndex: 1, contactIndex: 2,
    Subject: 'RDV Groupe Mercier - Negociation renouvellement',
    ActivityDate: '2026-04-09',
    Description: `CR visite Groupe Mercier — 9 avril 2026

Participants : Philippe Mercier (PDG), Sophie Renaud (Dir. Commerciale)

Objet : Negociation du renouvellement annuel. Le groupe a ouvert 3 nouveaux points de vente dans le Sud, ce qui augmente les volumes.

Discussion :
- Philippe Mercier est tres satisfait de la relation commerciale. Il apprecie notre reactivite et la qualite du SAV. "Vous etes notre meilleur fournisseur sur ce segment" (verbatim).
- Sophie Renaud a neanmoins mentionne que Bexor les a contactes avec une offre bundle incluant la maintenance. Bexor propose un package 8% moins cher que notre offre actuelle.
- Le client souhaite une remise volume de 5% supplementaire vu l'augmentation des commandes (+30% prevus avec les 3 nouveaux magasins).
- Besoin identifie : formation des equipes des nouveaux points de vente. Le client est pret a payer pour des sessions sur site.

Action : Preparer une proposition commerciale avec remise volume progressive et offre de formation.
Signature potentielle : 180K euros sur 12 mois.
Sentiment global : POSITIF — le client est fidele mais surveille la concurrence.`,
  },
  {
    accountIndex: 2, contactIndex: 4,
    Subject: 'CR visite Horizon Distribution - Alerte prix',
    ActivityDate: '2026-04-08',
    Description: `Compte rendu visite — Horizon Distribution — 8 avril 2026

Interlocuteur : Francois Martin (Resp. Approvisionnement)

ALERTE : Situation critique. Le client menace de basculer chez TechPro si nous ne revoyons pas nos tarifs.

Points :
- Francois Martin m'a informe que TechPro propose des prix 15% inferieurs sur l'ensemble de la gamme. Il m'a montre les devis.
- Le client a perdu 2 gros marches le mois dernier a cause de nos prix trop eleves par rapport a la concurrence. Il nous tient pour partiellement responsable.
- Cependant, il reconnait que le SAV TechPro est catastrophique. Plusieurs de ses collegues dans le secteur se plaignent des delais SAV de 3 semaines chez TechPro.
- Horizon a un besoin urgent d'un outil de commande en ligne (e-procurement). Ils sont encore au fax/telephone. C'est un frein majeur a leur croissance.

Demande client : Remise exceptionnelle de 10% pour les 6 prochains mois, le temps que nous alignions nos tarifs.

Objectif visite : sell_in — NON ATTEINT. Le client n'a passe aucune commande. Il attend notre contre-proposition tarifaire.

Prochaine action : Remonter l'alerte au directeur commercial. Preparer offre tarifaire revisee sous 48h.`,
  },
  {
    accountIndex: 3, contactIndex: 5,
    Subject: 'Visite Bertrand & Fils - Suivi projet chantier A45',
    ActivityDate: '2026-04-07',
    Description: `CR visite Bertrand & Fils — 7 avril 2026

Interlocuteur : Alain Bertrand (Gerant)

Visite de suivi sur le chantier A45 (autoroute Bordeaux-Pau).

Bilan tres positif :
- Les produits livres sont conformes et Alain Bertrand est tres satisfait. Pas de retour, pas de casse, livraison dans les temps.
- Le client a signe la commande complementaire de 28K euros pour la phase 2 du chantier. DEAL GAGNE.
- Alain m'a recommande aupres de MegalBat, un constructeur regional avec qui il travaille. Contact prevu la semaine prochaine. Belle opportunite de decouverte.
- Aucun concurrent mentionne. Bertrand & Fils est fidele depuis 8 ans et ne regarde pas ailleurs tant que la qualite est la.

Facteurs de reussite : relation de confiance construite sur la duree, qualite produit, respect des delais.

Prochain RDV : livraison phase 2 le 5 mai.
Objectif visite : signature — ATTEINT`,
  },
  {
    accountIndex: 4, contactIndex: 6,
    Subject: 'CR RDV LogiPro SAS - Demo plateforme',
    ActivityDate: '2026-04-04',
    Description: `Compte rendu — LogiPro SAS — 4 avril 2026

Interlocuteur : Claire Dubois (CTO)

Objet : Demo de notre nouvelle plateforme de gestion des stocks.

Retours :
- Claire Dubois est tres interessee par la solution. Elle voit un potentiel d'economie de 20% sur leurs couts logistiques.
- LogiPro utilise actuellement une solution concurrente de Proxio (licence a 24K/an). Ils ne sont pas satisfaits : trop rigide, pas d'API ouverte, support lent.
- Notre solution repond a leur besoin principal : integration API avec leur ERP maison.
- Point bloquant : le budget est serre cette annee. Claire doit convaincre le DAF. Elle demande une periode d'essai gratuite de 30 jours.
- Besoin supplementaire identifie : tableau de bord temps reel pour le directeur logistique. C'est un critere de choix important.

Concurrent principal : Proxio (solution actuelle, 24K/an, client insatisfait)
Potentiel deal : 36K/an (notre offre vs 24K Proxio = premium justifie par les fonctionnalites)

Objectif visite : decouverte — ATTEINT. La demo a bien ete recue.
Prochaine etape : Envoyer proposition commerciale + conditions essai gratuit.`,
  },
  {
    accountIndex: 5, contactIndex: 7,
    Subject: 'Visite NovaTech - Premier contact',
    ActivityDate: '2026-04-03',
    Description: `CR premier contact NovaTech — 3 avril 2026

Interlocuteur : Thomas Girard (Directeur Innovation)

Contexte : Prospect identifie via salon IndustrIA. NovaTech est une startup en forte croissance (x3 en 2 ans) dans la tech industrielle.

Echanges :
- Thomas Girard cherche un partenaire pour equipper leurs 3 sites de production. Budget estimatif : 800K sur 3 ans.
- Ils sont actuellement equipes par Acme mais pas satisfaits : pannes frequentes, SAV mediocre, pas d'innovation.
- NovaTech a des besoins tres specifiques : IoT, capteurs connectes, maintenance predictive. Ils veulent un fournisseur capable de co-developper des solutions sur mesure.
- Bexor a deja fait une demo la semaine derniere. Thomas a trouve ca "interessant mais trop generique".
- Notre avantage : notre nouvelle gamme IoT lancee en janvier correspond exactement a leurs besoins.

Sentiment : TRES INTERESSE. Thomas veut organiser une visite de notre usine pour son equipe technique.

Opportunite : appel d'offres 800K en preparation. Deadline reponse fin mai.
Concurrents en lice : Acme (sortant, insatisfaction), Bexor (demo faite, jugee generique)

Objectif visite : decouverte — ATTEINT`,
  },
  {
    accountIndex: 6, contactIndex: 8,
    Subject: 'CR visite BioSante Plus - Reclamation qualite',
    ActivityDate: '2026-04-02',
    Description: `Compte rendu de visite — BioSante Plus — 2 avril 2026

Interlocuteur : Nathalie Leroy (Directrice Generale)

ALERTE QUALITE — Visite declenchee suite a reclamation formelle.

Probleme :
- 2 lots livres en mars presentaient des defauts d'emballage. Produits non conformes aux normes sanitaires requises.
- Nathalie Leroy est tres mecontente. Elle envisage une penalite contractuelle et a mentionne "chercher des alternatives".
- Impact business : BioSante a du retirer les produits de 3 de ses sites pendant 10 jours, causant une perte estimee a 15K euros.

Actions correctives presentees :
- Remplacement immediat des lots defectueux (fait le 28 mars)
- Audit qualite en cours a notre usine
- Avoir commercial de 5K euros propose en geste commercial
- Mise en place d'un controle qualite renforce pour les prochaines livraisons

Reaction client : Nathalie accepte nos mesures correctives mais reste vigilante. Elle veut un rapport qualite mensuel pendant 6 mois.
Aucun concurrent mentionne pour l'instant mais la situation est fragile.

Sentiment : NEGATIF — confiance entamee, a reconquerir.
Objectif visite : fidelisation — PARTIELLEMENT ATTEINT (le client n'est pas parti mais la confiance est rompue)`,
  },
  {
    accountIndex: 7, contactIndex: 9,
    Subject: 'RDV EcoVert Services - Besoin digitalisation',
    ActivityDate: '2026-04-01',
    Description: `CR visite EcoVert Services — 1er avril 2026

Interlocuteur : David Moreau (Responsable Digital)

Contexte : EcoVert est en pleine transformation digitale. Ils cherchent a moderniser toute leur chaine d'approvisionnement.

Besoins identifies :
1. Portail fournisseur en ligne (commandes, suivi, factures)
2. Integration avec leur nouveau SI (SAP)
3. Reporting automatise des consommations par site
4. Application mobile pour les techniciens terrain

David Moreau est convaincu par notre approche. Il a compare 4 fournisseurs et nous sommes en shortlist finale avec Proxio.

Avantage Proxio : ils ont deja un connecteur SAP natif
Notre avantage : meilleur rapport qualite/prix, support en francais, proximite geographique

Le client veut une decision avant fin avril. Budget : 120K premiere annee puis 45K/an recurrent.

Deal en cours — concurrent final : Proxio
Facteur de decision : la demo technique prevue le 15 avril sera determinante.

Objectif visite : sell_in — EN COURS
Prochaine etape : preparer demo technique personnalisee avec connecteur SAP`,
  },
  {
    accountIndex: 0, contactIndex: 1,
    Subject: 'CR visite Dupont Industries - Suivi gamme Pro',
    ActivityDate: '2026-03-28',
    Description: `CR suivi Dupont Industries — 28 mars 2026

Interlocuteur : Marie Laurent (Resp. Production)

Suite a la visite du 10 avril (a noter : cette visite est anterieure), retour sur la gamme Pro.

Marie Laurent a teste les echantillons Pro sur la ligne 3 pendant 2 semaines :
- Performance superieure de 25% par rapport a la gamme standard
- Reduction des temps d'arret machine de 40%
- Les operateurs sont satisfaits de la prise en main

Cependant : le cout unitaire est 30% plus eleve. Marie doit convaincre Jean-Pierre Dupont (Achats) que le ROI est positif.

J'ai prepare un business case chiffre montrant un ROI de 8 mois. Marie va le presenter en comite de direction la semaine prochaine.

Concurrent : Acme a aussi une gamme "premium" mais sans les certifications ISO que nous avons.

Potentiel upsell : confirme a 45K/an si la gamme Pro est validee.
Sentiment client : positif, enthousiaste sur la performance mais prudent sur le budget.

Objectif : sell_out — EN COURS`,
  },
  {
    accountIndex: 2, contactIndex: 4,
    Subject: 'CR visite urgente Horizon Distribution - Deal perdu',
    ActivityDate: '2026-03-25',
    Description: `ALERTE — Appel urgent avec Francois Martin — 25 mars 2026

Mauvaise nouvelle : Horizon Distribution a signe un contrat de 6 mois avec TechPro pour la gamme standard.

Raisons de la perte :
- Prix : TechPro etait 15% moins cher, nous n'avons pas pu nous aligner a temps
- Timing : notre contre-proposition tarifaire est arrivee 3 jours trop tard
- Le concurrent etait mieux positionne sur les delais (livraison J+2 vs notre J+5)

Points positifs a retenir :
- Francois Martin garde notre gamme premium (pas d'equivalent chez TechPro)
- Il est conscient que le SAV TechPro est mediocre et prevoit un retour vers nous d'ici 6 mois
- Il nous recommande d'etre plus reactifs sur les demandes de devis

Deal perdu : environ 95K euros annuels sur la gamme standard
Motif principal : prix_non_competitif + timing_rate
Concurrent gagnant : TechPro

Lecon : mettre en place un process de reponse rapide (< 24h) pour les demandes de devis strategiques.`,
  },
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log('🔌 Retrieving Salesforce tokens from Supabase...');
  const { accessToken, instanceUrl } = await getTokens();
  console.log(`✓ Connected to ${instanceUrl}\n`);

  // 1. Create Accounts
  console.log('🏢 Creating Accounts...');
  const accountIds: (string | null)[] = [];
  for (const acc of ACCOUNTS) {
    const id = await sfCreate(instanceUrl!, accessToken, 'Account', acc);
    accountIds.push(id);
    console.log(`  ${id ? '✓' : '✗'} ${acc.Name} ${id ? `(${id})` : ''}`);
  }

  // 2. Create Contacts (linked to Accounts)
  console.log('\n👤 Creating Contacts...');
  const contactIds: (string | null)[] = [];
  for (const contact of CONTACTS) {
    const accountId = accountIds[contact.accountIndex];
    if (!accountId) {
      console.log(`  ✗ Skipping ${contact.FirstName} ${contact.LastName} — account not created`);
      contactIds.push(null);
      continue;
    }
    const { accountIndex, ...fields } = contact;
    const id = await sfCreate(instanceUrl!, accessToken, 'Contact', {
      ...fields,
      AccountId: accountId,
    });
    contactIds.push(id);
    console.log(`  ${id ? '✓' : '✗'} ${contact.FirstName} ${contact.LastName} ${id ? `(${id})` : ''}`);
  }

  // 3. Create Tasks (visit reports)
  console.log('\n📝 Creating Tasks (visit reports / CR)...');
  for (const task of TASKS) {
    const accountId = accountIds[task.accountIndex];
    const contactId = contactIds[task.contactIndex];
    const { accountIndex, contactIndex, ...fields } = task;

    const id = await sfCreate(instanceUrl!, accessToken, 'Task', {
      ...fields,
      Status: 'Completed',
      Priority: 'Normal',
      WhatId: accountId,    // Link to Account
      WhoId: contactId,     // Link to Contact
    });
    console.log(`  ${id ? '✓' : '✗'} ${task.Subject.substring(0, 60)}... ${id ? `(${id})` : ''}`);
  }

  console.log('\n✅ Done! Salesforce org is now populated with test data.');
  console.log('\n📋 Next steps:');
  console.log('   1. Go to /admin/integrations and click "Synchroniser maintenant"');
  console.log('   2. The sync will import the Tasks into raw_visit_reports');
  console.log('   3. Then /api/integrations/process will extract signals via AI');
  console.log('   4. Check the dashboards to see the extracted data');
}

main().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
