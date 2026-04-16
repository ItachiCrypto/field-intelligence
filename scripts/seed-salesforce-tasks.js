#!/usr/bin/env node
/**
 * seed-salesforce-tasks.js
 *
 * Creates 30 Tasks directly in Salesforce via REST API,
 * with 3 new commercials covering diverse aspects.
 */

const crypto = require('crypto');
const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const PG = process.env.PG_CONNECTION;
const ALGORITHM = 'aes-256-gcm';

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

// 30 CRs with 3 commercials, covering all aspects
const CRS = [
  // === Sophie MARTIN — IDF, focus grands comptes, beaucoup de concurrence ===
  {
    commercial: 'Sophie MARTIN',
    subject: 'CR visite Carrefour Central - Revue trimestrielle',
    date: '2026-03-25',
    client: 'Carrefour Central',
    description: `Rendez-vous trimestriel avec M. Dubois, directeur des achats.
Contexte positif: notre CA a progresse de 8% sur le trimestre. Le client est satisfait de la qualite de nos produits et du SAV.
Points negatifs: Acme a propose une offre groupee avec -15% sur les volumes. Le client hesite a basculer une partie du portefeuille.
Besoin exprime: un portail de commande en ligne avec suivi temps reel des livraisons.
Opportunite de sell-in sur la gamme Premium (interet marque pour les nouveaux produits bio).
Objectif signature du renouvellement: non atteint, reporte au mois prochain a cause du benchmark concurrentiel en cours.
Deal en cours: renouvellement contrat 3 ans, concurrent Acme positionne a -15%.`
  },
  {
    commercial: 'Sophie MARTIN',
    subject: 'RDV TechVision - Demo nouvelle plateforme',
    date: '2026-03-27',
    client: 'TechVision',
    description: `Demo de notre nouvelle plateforme digitale chez TechVision.
Tres bonne reception par l'equipe IT (Mme Laurent). Interface jugee intuitive.
Probleme identifie: TechPro a deja deploye une solution similaire chez eux en mode SaaS, prix 30% inferieur au notre.
Le DSI veut une integration avec leur ERP SAP — besoin technique prioritaire.
Satisfaction client sur le support technique: excellente, rapide et competent.
Opportunite d'upsell: module analytics avance. Le directeur general est interesse.
Objectif decouverte: atteint. Prochaine etape: POC en avril.`
  },
  {
    commercial: 'Sophie MARTIN',
    subject: 'CR visite Pharma Distri - Reclamation urgente',
    date: '2026-03-31',
    client: 'Pharma Distri',
    description: `Visite urgente suite a reclamation qualite sur le lot PLX-2024.
Client tres mecontent: 3 livraisons defectueuses ce trimestre. Menace de changer de fournisseur.
Bexor a fait une offre proactive avec garantie qualite renforcee et penalites en cas de defaut.
Le directeur qualite exige un plan d'amelioration sous 15 jours.
Impact: risque de perte du compte (350K EUR/an).
Besoin urgent: systeme de tracabilite lot par lot accessible en ligne.
Objectif fidelisation: non atteint. Situation critique.
Facteur d'echec: qualite produit insuffisante sur les 3 derniers mois.`
  },
  {
    commercial: 'Sophie MARTIN',
    subject: 'CR visite AutoParts Pro - Negociation prix',
    date: '2026-04-02',
    client: 'AutoParts Pro',
    description: `Negociation annuelle des tarifs avec le service achats.
Le client demande une baisse de 10% pour s'aligner sur l'offre de Proxio.
Notre prix est actuellement 12% superieur a Proxio sur la gamme standard.
Point fort: notre delai de livraison est 2x plus rapide (J+2 vs J+5 chez Proxio).
Client satisfait de la relation commerciale et du suivi personnalise.
Besoin: catalogue digital avec configurateur produit en ligne.
Objectif signature: non atteint. Le client veut comparer 3 fournisseurs.
Deal commercial: prix non competitif, en cours de negociation.`
  },
  {
    commercial: 'Sophie MARTIN',
    subject: 'RDV GreenTech Solutions - Prospection',
    date: '2026-04-03',
    client: 'GreenTech Solutions',
    description: `Premier contact avec GreenTech, startup en forte croissance (x3 en 2 ans).
Rencontre avec le fondateur M. Petit. Tres interesse par notre gamme eco-responsable.
Aucun concurrent en place: ils travaillent avec des artisans locaux pas fiables.
Besoin: fournisseur structure avec certification ISO 14001 et reporting RSE.
Budget prevu: 200K EUR/an en phase 1, potentiel 500K a 18 mois.
Opportunite majeure de new business.
Objectif decouverte: atteint. Client enthousiaste.
Facteur de reussite: notre certification environnementale est un differentiant cle.`
  },
  {
    commercial: 'Sophie MARTIN',
    subject: 'CR visite MediGroup - Point semestriel',
    date: '2026-04-07',
    client: 'MediGroup',
    description: `Point semestriel avec la direction achats de MediGroup.
Bonne relation, CA stable a 180K EUR/semestre.
Alerte: TechPro a ete referenceence chez eux le mois dernier pour une gamme complementaire.
Risque de cannibalisation sur nos references premium.
Le client est neutre, ni satisfait ni insatisfait. Service standard.
Besoin: formation des equipes terrain sur nos nouveaux produits.
Objectif sell-out: non atteint (objectif 95K, realise 82K). Le marche ralentit.
Cause echec: marche en ralentissement general sur le segment.`
  },
  {
    commercial: 'Sophie MARTIN',
    subject: 'CR visite DataFlow Corp - Renouvellement',
    date: '2026-04-08',
    client: 'DataFlow Corp',
    description: `Visite pour preparer le renouvellement du contrat (expiration juin 2026).
Client globalement satisfait. Notre solution est bien integree dans leurs process.
Acme a contacte le DSI avec une offre cloud native, 20% moins chere.
Le client veut des engagements SLA plus forts (99.9% uptime).
Besoin: API RESTful pour integration avec leurs outils internes.
Satisfaction elevee sur le support N2 mais delais N3 juges trop longs.
Objectif fidelisation: en cours. Proposition commerciale a envoyer avant fin avril.
Deal commercial: relation insuffisante au niveau direction — je ne connais que les operationnels.`
  },
  {
    commercial: 'Sophie MARTIN',
    subject: 'CR visite LogiPro SAS - Suivi projet',
    date: '2026-04-09',
    client: 'LogiPro SAS',
    description: `Suivi du deploiement du projet logistique chez LogiPro.
Phase 1 livree avec succes. Client satisfait de la gestion de projet.
Proxio tente de s'intercaler sur la phase 2 avec une offre a -25%.
Point positif: le chef de projet client nous recommande en interne.
Besoin: module de gestion des retours et des avoirs.
Opportunite de cross-sell sur la partie transport.
Objectif sell-in phase 2: atteint. Bon de commande signe.
Facteur de reussite: qualite de la phase 1 et relation de confiance.`
  },
  {
    commercial: 'Sophie MARTIN',
    subject: 'RDV BioSante Plus - Lancement gamme',
    date: '2026-04-10',
    client: 'BioSante Plus',
    description: `Presentation de la nouvelle gamme bio chez BioSante Plus.
Tres bon accueil. Le directeur marketing veut etre parmi les premiers a la distribuer.
Pas de concurrent positionne sur ce segment bio certifie.
Besoin: packaging personnalise et PLV sur mesure.
Potentiel: 150K EUR la premiere annee.
Satisfaction tres elevee sur la collaboration historique.
Objectif sell-in nouvelle gamme: atteint. Premiere commande prevue en mai.
Facteur de reussite: innovation produit alignee avec la strategie client.`
  },
  {
    commercial: 'Sophie MARTIN',
    subject: 'CR visite Horizon Distribution - Audit qualite',
    date: '2026-04-11',
    client: 'Horizon Distribution',
    description: `Audit qualite annuel chez Horizon Distribution.
Resultats mitiges: 2 non-conformites mineures detectees.
Le client reste fidele mais demande des corrections sous 30 jours.
Bexor a obtenu un rendez-vous avec le nouveau directeur des achats.
Satisfaction moderee. Le client apprecie notre reactivite mais pas nos prix.
Notre tarif est 8% superieur a la moyenne du marche.
Besoin: certification qualite specifique secteur agroalimentaire.
Objectif fidelisation: atteint malgre les non-conformites. Relation solide.`
  },

  // === Thomas BERNARD — Nord/Est, focus PME, deals et closing ===
  {
    commercial: 'Thomas BERNARD',
    subject: 'CR visite Metal Precision - Signature contrat',
    date: '2026-03-26',
    client: 'Metal Precision',
    description: `Signature du contrat de fourniture sur 2 ans avec Metal Precision!
Montant: 120K EUR/an. Nouveau client gagne sur le territoire Nord.
On a battu Acme qui etait en place depuis 5 ans grace a notre offre technique superieure.
Le directeur technique est impressionne par nos tolerances de fabrication.
Deal gagne: concurrent Acme battu sur la qualite produit.
Facteur de reussite: demo technique sur site + echantillons gratuits.
Objectif signature: atteint!`
  },
  {
    commercial: 'Thomas BERNARD',
    subject: 'CR visite Plastimod - Deal perdu',
    date: '2026-03-28',
    client: 'Plastimod',
    description: `Mauvaise nouvelle: le client a choisi TechPro pour le renouvellement.
Motif principal: notre prix etait 18% superieur sur les pieces standard.
TechPro a propose un package all-inclusive avec maintenance integree.
Le responsable achats m'a dit apprecier notre service mais le budget est serre.
Deal perdu: prix non competitif face a TechPro (-18%).
Le client reste ouvert pour les pieces speciales ou notre expertise est reconnue.
Objectif renouvellement: non atteint. Perte de 85K EUR/an.
Cause d'echec: politique tarifaire trop rigide, pas de flexibilite sur les volumes.`
  },
  {
    commercial: 'Thomas BERNARD',
    subject: 'RDV AgroNord - Nouveau prospect',
    date: '2026-04-01',
    client: 'AgroNord',
    description: `Prospection chez AgroNord, cooperative agricole en expansion.
Contact avec Mme Girard, directrice des operations.
Marche tres concurrentiel: Bexor, Proxio et un acteur local sont deja en place.
Le client cherche un fournisseur capable de gerer la saisonnalite (pics de commande x5 en ete).
Besoin: plateforme de commande avec previsionnel et alertes de stock.
Opportunite: 300K EUR/an si on arrive a demonstrer notre capacite logistique.
Satisfaction sur la premiere impression: positive.
Objectif decouverte: atteint. Prochaine etape: visite de notre entrepot.`
  },
  {
    commercial: 'Thomas BERNARD',
    subject: 'CR visite ElectroPower - Reclamation SAV',
    date: '2026-04-02',
    client: 'ElectroPower',
    description: `Visite post-incident: panne d'un equipement livre il y a 3 mois.
Client furieux. Delai d'intervention SAV: 5 jours (engagement: 48h).
Acme a propose un contrat de maintenance avec intervention sous 24h.
Le directeur technique menace de rompre le contrat si pas d'amelioration.
Impact financier pour le client: 15K EUR de perte de production.
Besoin: hotline 24/7 et stock de pieces detachees sur site.
Satisfaction: tres negative. Urgence absolue.
Objectif fidelisation: non atteint. Risque de perte imminente.
Cause d'echec: SAV sous-dimensionne, pas de stock pieces detachees en region.`
  },
  {
    commercial: 'Thomas BERNARD',
    subject: 'CR visite TransLog - Upsell reussi',
    date: '2026-04-03',
    client: 'TransLog',
    description: `Excellente visite chez TransLog! Upsell du module tracking GPS reussi.
Commande additionnelle de 45K EUR, activation en mai.
Client tres satisfait de notre plateforme. NPS estime a 9/10.
Aucune pression concurrentielle sur ce compte — tres fidele.
Le DG a mentionne vouloir nous recommander a deux entreprises partenaires.
Besoin futur: module de gestion de flotte avec eco-conduite.
Objectif sell-in: atteint. Cross-sell tracking GPS = succes.
Facteur de reussite: relation de confiance + ROI demontre sur le module de base.`
  },
  {
    commercial: 'Thomas BERNARD',
    subject: 'RDV Chimie Express - Appel d\'offres',
    date: '2026-04-04',
    client: 'Chimie Express',
    description: `Participation a l'appel d'offres de Chimie Express pour la fourniture annuelle.
4 concurrents en lice: nous, Acme, Bexor, et un nouveau venu FabriMax.
Budget client: 250K EUR. Notre offre est a 265K (6% au dessus).
Points forts de notre offre: securite, conformite REACH, et tracabilite.
Bexor est le moins-disant a 230K mais sans les certifications.
Le directeur HSE est notre allie: il prefere notre solution pour la conformite.
Deal en cours: budget non competitif mais differentiation reglementaire.
Objectif signature: en attente de decision fin avril.`
  },
  {
    commercial: 'Thomas BERNARD',
    subject: 'CR visite NovaTech - Extension deploiement',
    date: '2026-04-07',
    client: 'NovaTech',
    description: `NovaTech veut etendre le deploiement a ses 3 sites secondaires.
Budget previsionnel: 180K EUR supplementaire sur 18 mois.
Le CTO est tres satisfait de la fiabilite de notre solution (99.95% uptime).
Risque: TechPro est en discussion avec la filiale allemande de NovaTech.
Si TechPro gagne l'Allemagne, il y a un risque de standardisation groupe.
Besoin: interface multilingue et support multi-timezone.
Opportunite majeure de croissance sur ce compte.
Objectif sell-in extension: en cours. Presentation au comite d'investissement semaine prochaine.`
  },
  {
    commercial: 'Thomas BERNARD',
    subject: 'CR visite BuildMax - Negociation difficile',
    date: '2026-04-08',
    client: 'BuildMax',
    description: `Negociation tres tendue avec le nouvel acheteur de BuildMax.
Il vient de chez Acme et pousse fort pour un changement de fournisseur.
Notre contrat arrive a echeance en juin. Le client demande -20% pour rester.
Acme propose un prix 22% inferieur avec un engagement sur 3 ans.
Notre valeur ajoutee (service, qualite) est reconnue par le terrain mais pas par les achats.
Deal en danger: concurrent Acme mieux positionne sur le prix.
Besoin: etude TCO comparative pour prouver notre valeur globale.
Objectif renouvellement: non atteint pour l'instant. Risque eleve.
Cause d'echec: nouvel acheteur sans historique avec nous.`
  },
  {
    commercial: 'Thomas BERNARD',
    subject: 'CR visite AgroNord - Visite entrepot',
    date: '2026-04-09',
    client: 'AgroNord',
    description: `AgroNord est venu visiter notre entrepot de Lille.
Tres bonne impression sur nos capacites logistiques et notre gestion de stock.
Mme Girard confirme l'interet. Elle va proposer notre candidature au conseil.
Proxio est egalement en short-list mais n'a pas d'entrepot dans le Nord.
Notre avantage: proximite geographique et capacite de livraison en 24h.
Satisfaction de la visite: tres positive.
Objectif decouverte avancee: atteint. Decision du client prevue fin avril.`
  },
  {
    commercial: 'Thomas BERNARD',
    subject: 'RDV Dupont Industries - Cross-sell',
    date: '2026-04-10',
    client: 'Dupont Industries',
    description: `Tentative de cross-sell de la gamme automatisation chez Dupont Industries.
Le directeur de production est interesse mais le budget est bloque jusqu'en septembre.
TechPro a fait une demo la semaine derniere — le client a compare et trouve TechPro plus ergonomique.
Notre avantage: integration native avec la solution deja en place chez eux.
Besoin: formation operateurs et accompagnement au changement.
Objectif sell-in: non atteint. Timing rate (budget 2026 deja consomme).
Facteur d'echec: cycle budgetaire desaligne avec notre calendrier commercial.`
  },

  // === Marie LEFEVRE — Ouest/Sud-Ouest, focus marketing, sentiment, segmentation ===
  {
    commercial: 'Marie LEFEVRE',
    subject: 'CR visite Oceane Distribution - Bilan annuel',
    date: '2026-03-26',
    client: 'Oceane Distribution',
    description: `Bilan annuel tres positif avec Oceane Distribution.
CA en hausse de 15% sur l'annee. Le client est ravi de notre partenariat.
Innovation appreciee: notre gamme eco a represente 30% de leurs ventes.
Aucun concurrent ne menace ce compte. Relation de confiance depuis 8 ans.
Le directeur commercial nous considere comme fournisseur strategique.
Satisfaction client: excellente sur tous les criteres (prix, qualite, service).
Besoin futur: marketplace B2B pour leurs revendeurs.
Objectif fidelisation: atteint. Contrat prolonge de 2 ans.
Facteur de reussite: partenariat de long terme et innovation produit.`
  },
  {
    commercial: 'Marie LEFEVRE',
    subject: 'CR visite SudAgri - Probleme logistique',
    date: '2026-03-30',
    client: 'SudAgri',
    description: `Visite suite a des retards de livraison repetes (3 fois ce mois).
Le client est decu. Son equipe terrain est en difficulte sans les produits.
Proxio a profite de la situation pour livrer en urgence un lot de substitution.
Risque: le client envisage de diversifier ses fournisseurs.
Le responsable logistique demande un plan de fiabilisation sous 10 jours.
Besoin: alertes SMS en cas de retard + livraison partielle possible.
Satisfaction: negative sur la logistique, positive sur la qualite produit.
Objectif fidelisation: non atteint. Il faut reagir vite.
Cause d'echec: probleme d'approvisionnement de notre usine de Toulouse.`
  },
  {
    commercial: 'Marie LEFEVRE',
    subject: 'RDV Vignobles Bordeaux - Nouveau segment',
    date: '2026-04-01',
    client: 'Vignobles Bordeaux',
    description: `Premier rendez-vous dans le segment viticole — tres prometteur!
Rencontre avec le maitre de chai, M. Dufour. Interet pour nos solutions de tracabilite.
Marche totalement vierge pour nous: aucun concurrent tech positionne.
Le client gere 50 domaines et cherche a digitaliser la chaine de production.
Budget estime: 400K EUR sur 3 ans si le POC est concluant.
Besoin specifique: capteurs IoT + dashboard temps reel + conformite reglementaire vin.
Opportunite de nouveau segment strategique pour l'entreprise.
Objectif decouverte: atteint. POC a planifier en juin.`
  },
  {
    commercial: 'Marie LEFEVRE',
    subject: 'CR visite NantesTech - Deal perdu',
    date: '2026-04-02',
    client: 'NantesTech',
    description: `Deal perdu chez NantesTech — le client a choisi Bexor.
Motif: Bexor a propose une solution full-cloud avec migration gratuite.
Notre offre etait pertinente techniquement mais 25% plus chere.
Le DSI a reconnu notre superiorite technique mais le DG a tranche sur le budget.
Facteur d'echec: pas d'offre cloud competitive, migration trop couteuse.
On reste positionne pour la phase 2 si Bexor ne tient pas ses promesses.
Deal perdu: budget, concurrent Bexor.`
  },
  {
    commercial: 'Marie LEFEVRE',
    subject: 'CR visite AquaPure - Satisfaction excellente',
    date: '2026-04-03',
    client: 'AquaPure',
    description: `Visite de routine chez AquaPure. Tout va bien!
Le directeur technique est notre meilleur ambassadeur: il nous recommande a chaque salon.
Satisfaction maximale: qualite, prix, service, reactivite — tout est au top.
Aucune pression concurrentielle. Le client n'a meme pas ecoute les offres de Acme.
Petit besoin: mise a jour de l'interface utilisateur (jugee un peu datee).
Opportunite: le client veut nous presenter a sa filiale en Espagne.
Objectif sell-out: atteint. +5% vs objectif trimestriel.
Facteur de reussite: proximite relationnelle et qualite constante.`
  },
  {
    commercial: 'Marie LEFEVRE',
    subject: 'RDV Aero Composites - Appel d\'offres perdu',
    date: '2026-04-04',
    client: 'Aero Composites',
    description: `Retour sur l'appel d'offres Aero Composites: nous sommes elimines au premier tour.
Motif: notre certification aeronautique EN 9100 est expiree depuis janvier.
TechPro et Acme sont en finale. Tres frustrant car notre offre technique etait la meilleure.
Impact: 500K EUR de CA potentiel perdu.
Le client est ouvert a un nouveau dossier quand la certification sera renouvelee.
Cause d'echec: certification expiree — probleme interne a remonter.
Besoin pour le futur: processus de renouvellement automatique des certifications.`
  },
  {
    commercial: 'Marie LEFEVRE',
    subject: 'CR visite MerSud Logistics - Extension service',
    date: '2026-04-07',
    client: 'MerSud Logistics',
    description: `Proposition d'extension de notre service de tracking pour la flotte maritime de MerSud.
Le directeur des operations est interesse: 35 navires a equiper.
Budget: 90K EUR en phase 1. Potentiel global: 250K EUR avec les options.
Concurrent en place: un acteur local pas fiable avec beaucoup de pannes.
Le client veut changer mais a peur du risque de migration.
Besoin: installation sans interruption de service + formation equipages.
Satisfaction sur notre solution terrestre: bonne. Confiance a construire sur le maritime.
Objectif sell-in: en cours. Demo embarquee prevue fin avril.`
  },
  {
    commercial: 'Marie LEFEVRE',
    subject: 'CR visite EcoVert Services - Co-innovation',
    date: '2026-04-08',
    client: 'EcoVert Services',
    description: `Session de co-innovation avec l'equipe R&D d'EcoVert.
Ils veulent developper conjointement un capteur de qualite de l'air pour batiments.
Investissement partage: 100K EUR chacun sur 12 mois.
Aucun concurrent implique — projet exclusif.
Le CEO est un visionnaire, tres motive par le projet.
Besoin: acces a notre labo de prototypage + equipe R&D dediee.
Opportunite strategique: brevet conjoint + nouveau produit en catalogue.
Objectif partenariat: atteint. Lettre d'intention signee!
Facteur de reussite: vision partagee sur l'innovation durable.`
  },
  {
    commercial: 'Marie LEFEVRE',
    subject: 'CR visite BioSante Plus - Formation terrain',
    date: '2026-04-09',
    client: 'BioSante Plus',
    description: `Formation des equipes terrain de BioSante sur nos nouveaux produits.
8 participants, tous tres engages. Retours positifs unanimes.
Le pharmacien responsable a identifie 3 produits a integrer en priorite.
Besoin: supports de formation digitaux (videos tutoriels + quiz en ligne).
Satisfaction elevee: le client apprecie l'investissement dans la formation.
Proxio ne propose aucun accompagnement comparable.
Objectif formation: atteint. 100% des participants certifies.
Facteur de reussite: investissement dans l'accompagnement client.`
  },
  {
    commercial: 'Marie LEFEVRE',
    subject: 'RDV Energie Plus - Smart grid pilot',
    date: '2026-04-10',
    client: 'Energie Plus',
    description: `Presentation du projet pilote smart grid chez Energie Plus.
Le directeur innovation est emballe. 3 sites pilotes identifies.
Budget pilote: 75K EUR. Si succes, deploiement national (2M EUR).
Acme est aussi en discussion mais avec une solution moins mature.
Notre avantage: 2 ans d'avance technologique sur l'analytics predictif.
Besoin: dashboard temps reel + alertes predictives + rapport automatique.
Opportunite: si le pilote reussit, c'est un game changer pour notre division energie.
Objectif decouverte avancee: atteint. Contrat pilote a signer en mai.`
  },
];

async function main() {
  const db = new Client({ connectionString: PG });
  await db.connect();

  // Get SF connection
  const { rows } = await db.query("SELECT * FROM crm_connections WHERE status = 'connected' LIMIT 1");
  if (rows.length === 0) { console.error('No connected CRM'); process.exit(1); }
  const conn = rows[0];

  let accessToken = decrypt(conn.config_json.access_token_encrypted);
  const refreshToken = decrypt(conn.config_json.refresh_token_encrypted);

  // Check if token expired, refresh if needed
  if (new Date(conn.config_json.token_expires_at) < new Date()) {
    console.log('Token expired, refreshing...');
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
    if (!res.ok) throw new Error('Token refresh failed: ' + await res.text());
    const data = await res.json();
    accessToken = data.access_token;
    console.log('Token refreshed OK');
  }

  const instanceUrl = conn.instance_url;
  console.log(`Creating ${CRS.length} Tasks in Salesforce (${instanceUrl})...\n`);

  let created = 0;
  for (const cr of CRS) {
    try {
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
        const err = await res.text();
        console.error(`  FAIL: ${cr.subject} — ${err}`);
        continue;
      }

      const data = await res.json();
      console.log(`  OK: ${cr.subject} (${data.id})`);
      created++;
    } catch (err) {
      console.error(`  ERROR: ${cr.subject} — ${err.message}`);
    }
  }

  console.log(`\n${created}/${CRS.length} Tasks created in Salesforce.`);
  console.log('\nNow run:');
  console.log('  1. Sync: POST /api/integrations/sync (or click "Synchroniser maintenant")');
  console.log('  2. Process: node scripts/process-pending.js');

  await db.end();
}

main().catch(err => { console.error(err); process.exit(1); });
