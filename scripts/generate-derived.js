#!/usr/bin/env node
/**
 * generate-derived.js
 *
 * Generates all derived/aggregated tables from raw NLP data:
 *   signals, needs, prix_signals, cr_objectifs, deals_commerciaux, deals_marketing,
 *   raw_visit_reports
 *
 * Output tables:
 *   sentiment_periodes, sentiment_regions, motifs_sentiment,
 *   segment_sentiments, geo_points, region_profiles, geo_sector_data,
 *   territoires, positionnement, offres_concurrentes, comm_concurrentes,
 *   recommandations_ia, deal_commercial_tendance, deal_tendance, tendance_prix
 */

const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const PG = process.env.PG_CONNECTION || process.env.DATABASE_URL;
if (!PG) { console.error('No PG_CONNECTION'); process.exit(1); }

async function main() {
  const db = new Client({ connectionString: PG });
  await db.connect();

  // Get all company IDs that have data
  const { rows: companies } = await db.query(
    `SELECT DISTINCT company_id FROM raw_visit_reports WHERE processing_status = 'done'`
  );

  for (const { company_id: cid } of companies) {
    console.log(`\n=== Generating derived tables for company ${cid} ===`);

    // =====================================================================
    // 1. SENTIMENT_PERIODES — aggregate signal severity into sentiment by week
    // =====================================================================
    await db.query(`DELETE FROM sentiment_periodes WHERE company_id = $1`, [cid]);

    // Map signal severity to sentiment: vert/jaune → positif, orange → neutre, rouge → negatif
    // Also use signal type: satisfaction→positif/negatif based on severity, opportunite→interesse
    const { rows: reportsByWeek } = await db.query(`
      SELECT
        TO_CHAR(r.visit_date, 'IYYY-"S"IW') as periode,
        s.severity,
        s.type::text as signal_type,
        COUNT(*) as c
      FROM signals s
      JOIN raw_visit_reports r ON r.id = s.source_report_id
      WHERE s.company_id = $1 AND r.visit_date IS NOT NULL
      GROUP BY periode, s.severity, s.type
      ORDER BY periode
    `, [cid]);

    const weekSentiment = {};
    for (const row of reportsByWeek) {
      if (!weekSentiment[row.periode]) weekSentiment[row.periode] = { positif: 0, negatif: 0, neutre: 0, interesse: 0, total: 0 };
      const w = weekSentiment[row.periode];
      const n = parseInt(row.c);
      w.total += n;

      if (row.signal_type === 'opportunite') {
        w.interesse += n;
      } else if (row.severity === 'vert' || (row.signal_type === 'satisfaction' && row.severity !== 'rouge')) {
        w.positif += n;
      } else if (row.severity === 'rouge') {
        w.negatif += n;
      } else if (row.severity === 'orange') {
        w.neutre += n;
      } else {
        w.neutre += n;
      }
    }

    for (const [periode, s] of Object.entries(weekSentiment)) {
      await db.query(
        `INSERT INTO sentiment_periodes (company_id, periode, positif, negatif, neutre, interesse, total) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [cid, periode, s.positif, s.negatif, s.neutre, s.interesse, s.total]
      );
    }
    console.log(`  sentiment_periodes: ${Object.keys(weekSentiment).length} rows`);

    // =====================================================================
    // 2. SENTIMENT_REGIONS — sentiment by region (use client_name as pseudo-region)
    // =====================================================================
    await db.query(`DELETE FROM sentiment_regions WHERE company_id = $1`, [cid]);

    const { rows: clientSignals } = await db.query(`
      SELECT
        COALESCE(NULLIF(r.client_name, ''), 'Non assigne') as region,
        s.severity,
        s.type::text as signal_type,
        COUNT(*) as c
      FROM signals s
      JOIN raw_visit_reports r ON r.id = s.source_report_id
      WHERE s.company_id = $1
      GROUP BY COALESCE(NULLIF(r.client_name, ''), 'Non assigne'), s.severity, s.type
    `, [cid]);

    const regionSentiment = {};
    for (const row of clientSignals) {
      if (!regionSentiment[row.region]) regionSentiment[row.region] = { positif: 0, negatif: 0, neutre: 0, interesse: 0, total: 0 };
      const w = regionSentiment[row.region];
      const n = parseInt(row.c);
      w.total += n;
      if (row.signal_type === 'opportunite') w.interesse += n;
      else if (row.severity === 'vert') w.positif += n;
      else if (row.severity === 'rouge') w.negatif += n;
      else w.neutre += n;
    }

    for (const [region, s] of Object.entries(regionSentiment)) {
      await db.query(
        `INSERT INTO sentiment_regions (company_id, region, positif, negatif, neutre, interesse, total) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [cid, region, s.positif, s.negatif, s.neutre, s.interesse, s.total]
      );
    }
    console.log(`  sentiment_regions: ${Object.keys(regionSentiment).length} rows`);

    // =====================================================================
    // 3. MOTIFS_SENTIMENT — what drives positive/negative sentiment
    // =====================================================================
    await db.query(`DELETE FROM motifs_sentiment WHERE company_id = $1`, [cid]);

    // Positive motifs: signals with vert severity
    const { rows: posMotifs } = await db.query(`
      SELECT title as motif, COUNT(*) as mentions FROM signals
      WHERE company_id = $1 AND severity IN ('vert')
      GROUP BY title ORDER BY mentions DESC LIMIT 10
    `, [cid]);
    for (const m of posMotifs) {
      await db.query(
        `INSERT INTO motifs_sentiment (company_id, motif, type, mentions) VALUES ($1, $2, 'positif', $3)`,
        [cid, m.motif, parseInt(m.mentions)]
      );
    }

    // Negative motifs: signals with rouge severity
    const { rows: negMotifs } = await db.query(`
      SELECT title as motif, COUNT(*) as mentions FROM signals
      WHERE company_id = $1 AND severity IN ('rouge')
      GROUP BY title ORDER BY mentions DESC LIMIT 10
    `, [cid]);
    for (const m of negMotifs) {
      await db.query(
        `INSERT INTO motifs_sentiment (company_id, motif, type, mentions) VALUES ($1, $2, 'negatif', $3)`,
        [cid, m.motif, parseInt(m.mentions)]
      );
    }

    // Orange/jaune motifs → classify as negatif (constraint only allows positif/negatif)
    const { rows: warnMotifs } = await db.query(`
      SELECT title as motif, COUNT(*) as mentions FROM signals
      WHERE company_id = $1 AND severity IN ('orange', 'jaune')
      GROUP BY title ORDER BY mentions DESC LIMIT 10
    `, [cid]);
    for (const m of warnMotifs) {
      await db.query(
        `INSERT INTO motifs_sentiment (company_id, motif, type, mentions) VALUES ($1, $2, 'negatif', $3)`,
        [cid, m.motif, parseInt(m.mentions)]
      );
    }
    console.log(`  motifs_sentiment: ${posMotifs.length + negMotifs.length + warnMotifs.length} rows`);

    // =====================================================================
    // 4. SEGMENT_SENTIMENTS — segment = nouveau vs etabli (based on visit count)
    // =====================================================================
    await db.query(`DELETE FROM segment_sentiments WHERE company_id = $1`, [cid]);

    // Clients with 1 visit = nouveau, 2+ = etabli
    const { rows: clientVisits } = await db.query(`
      SELECT client_name, COUNT(*) as visits FROM raw_visit_reports
      WHERE company_id = $1 AND client_name IS NOT NULL AND processing_status = 'done'
      GROUP BY client_name
    `, [cid]);

    const segments = { nouveau: { clients: [], crCount: 0 }, etabli: { clients: [], crCount: 0 } };
    for (const cv of clientVisits) {
      const seg = parseInt(cv.visits) >= 2 ? 'etabli' : 'nouveau';
      segments[seg].clients.push(cv.client_name);
      segments[seg].crCount += parseInt(cv.visits);
    }

    for (const [segment, data] of Object.entries(segments)) {
      if (data.clients.length === 0) continue;

      // Get signal severity distribution for this segment's clients
      const { rows: sevDist } = await db.query(`
        SELECT s.severity, COUNT(*) as c FROM signals s
        JOIN raw_visit_reports r ON r.id = s.source_report_id
        WHERE s.company_id = $1 AND r.client_name = ANY($2)
        GROUP BY s.severity
      `, [cid, data.clients]);

      const total = sevDist.reduce((s, r) => s + parseInt(r.c), 0) || 1;
      const sevMap = {};
      sevDist.forEach(r => sevMap[r.severity] = parseInt(r.c));

      const pctPositif = Math.round(((sevMap['vert'] || 0) / total) * 100);
      const pctNegatif = Math.round(((sevMap['rouge'] || 0) / total) * 100);
      const pctNeutre = Math.round((((sevMap['orange'] || 0) + (sevMap['jaune'] || 0)) / total) * 100);
      const pctInteresse = 100 - pctPositif - pctNegatif - pctNeutre;

      // Get top negative signals as insatisfactions
      const { rows: insats } = await db.query(`
        SELECT DISTINCT s.title FROM signals s
        JOIN raw_visit_reports r ON r.id = s.source_report_id
        WHERE s.company_id = $1 AND r.client_name = ANY($2) AND s.severity IN ('rouge', 'orange')
        LIMIT 5
      `, [cid, data.clients]);

      // Get top positive signals
      const { rows: positifs } = await db.query(`
        SELECT DISTINCT s.title FROM signals s
        JOIN raw_visit_reports r ON r.id = s.source_report_id
        WHERE s.company_id = $1 AND r.client_name = ANY($2) AND s.severity = 'vert'
        LIMIT 5
      `, [cid, data.clients]);

      await db.query(
        `INSERT INTO segment_sentiments (company_id, segment, nb_cr, pct_positif, pct_negatif, pct_neutre, pct_interesse, top_insatisfactions, top_points_positifs)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [cid, segment, data.crCount, pctPositif, pctNegatif, pctNeutre, Math.max(0, pctInteresse),
         insats.map(i => i.title), positifs.map(p => p.title)]
      );
    }
    console.log(`  segment_sentiments: ${Object.keys(segments).filter(s => segments[s].clients.length > 0).length} rows`);

    // =====================================================================
    // 5. GEO_POINTS — signal distribution by client (as pseudo-region/dept)
    // =====================================================================
    await db.query(`DELETE FROM geo_points WHERE company_id = $1`, [cid]);

    const { rows: geoData } = await db.query(`
      SELECT
        COALESCE(NULLIF(r.client_name, ''), 'Non assigne') as client,
        s.type::text,
        COUNT(*) as c
      FROM signals s
      JOIN raw_visit_reports r ON r.id = s.source_report_id
      WHERE s.company_id = $1
      GROUP BY client, s.type
    `, [cid]);

    const geoMap = {};
    for (const row of geoData) {
      if (!geoMap[row.client]) geoMap[row.client] = { opportunites: 0, risques: 0, concurrence: 0, besoins: 0 };
      const g = geoMap[row.client];
      const n = parseInt(row.c);
      if (row.type === 'opportunite') g.opportunites += n;
      else if (row.type === 'concurrence') g.concurrence += n;
      else if (row.type === 'besoin') g.besoins += n;
      else if (row.type === 'prix' || row.type === 'satisfaction') g.risques += n;
    }

    for (const [client, g] of Object.entries(geoMap)) {
      const intensite = g.opportunites + g.risques + g.concurrence + g.besoins;
      await db.query(
        `INSERT INTO geo_points (company_id, region, dept, opportunites, risques, concurrence, besoins, intensite)
         VALUES ($1, $2, $2, $3, $4, $5, $6, $7)`,
        [cid, client, g.opportunites, g.risques, g.concurrence, g.besoins, intensite]
      );
    }
    console.log(`  geo_points: ${Object.keys(geoMap).length} rows`);

    // =====================================================================
    // 6. REGION_PROFILES — detailed profile per client/region
    // =====================================================================
    await db.query(`DELETE FROM region_profiles WHERE company_id = $1`, [cid]);

    for (const [client, g] of Object.entries(geoMap)) {
      // Top besoins for this client
      const { rows: topBesoins } = await db.query(`
        SELECT s.title FROM signals s
        JOIN raw_visit_reports r ON r.id = s.source_report_id
        WHERE s.company_id = $1 AND r.client_name = $2 AND s.type = 'besoin'
        LIMIT 3
      `, [cid, client === 'Non assigne' ? null : client]);

      // Top competitor for this client
      const { rows: topComp } = await db.query(`
        SELECT s.competitor_name, COUNT(*) as c FROM signals s
        JOIN raw_visit_reports r ON r.id = s.source_report_id
        WHERE s.company_id = $1 AND r.client_name = $2 AND s.competitor_name IS NOT NULL
        GROUP BY s.competitor_name ORDER BY c DESC LIMIT 1
      `, [cid, client === 'Non assigne' ? null : client]);

      // Dominant sentiment
      const totalSignals = g.opportunites + g.risques + g.concurrence + g.besoins;
      const sentimentDominant = g.opportunites > g.risques ? 'positif' : g.risques > 0 ? 'negatif' : 'neutre';

      await db.query(
        `INSERT INTO region_profiles (company_id, region, top_besoins, concurrent_principal, concurrent_mentions, sentiment_dominant, specificite_locale, nb_signaux)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [cid, client, topBesoins.map(b => b.title),
         topComp[0]?.competitor_name || null, parseInt(topComp[0]?.c || 0),
         sentimentDominant,
         g.concurrence > 2 ? 'Forte pression concurrentielle' : g.besoins > 2 ? 'Zone a fort besoin' : 'Zone standard',
         totalSignals]
      );
    }
    console.log(`  region_profiles: ${Object.keys(geoMap).length} rows`);

    // =====================================================================
    // 7. GEO_SECTOR_DATA — signals by type aggregated by client (sector proxy)
    // =====================================================================
    await db.query(`DELETE FROM geo_sector_data WHERE company_id = $1`, [cid]);

    for (const [client, g] of Object.entries(geoMap)) {
      const score = Math.min(100, (g.concurrence + g.besoins + g.opportunites) * 10);
      await db.query(
        `INSERT INTO geo_sector_data (company_id, secteur, region, signaux_concurrence, signaux_besoins, signaux_opportunites, score_intensite)
         VALUES ($1, 'General', $2, $3, $4, $5, $6)`,
        [cid, client, g.concurrence, g.besoins, g.opportunites, score]
      );
    }
    console.log(`  geo_sector_data: ${Object.keys(geoMap).length} rows`);

    // =====================================================================
    // 8. TERRITOIRES — territory = client grouping with stats
    // =====================================================================
    await db.query(`DELETE FROM territoires WHERE company_id = $1`, [cid]);

    const { rows: clientStats } = await db.query(`
      SELECT
        COALESCE(NULLIF(r.client_name, ''), 'Non assigne') as territoire,
        ARRAY_AGG(DISTINCT r.commercial_name) FILTER (WHERE r.commercial_name IS NOT NULL) as commercial_names,
        COUNT(DISTINCT r.id) as nb_cr,
        COUNT(*) FILTER (WHERE s.competitor_name IS NOT NULL) as nb_mentions_concurrents,
        COUNT(*) FILTER (WHERE s.type = 'opportunite') as nb_opportunites,
        COUNT(*) FILTER (WHERE s.severity = 'rouge') as nb_risques_perte
      FROM raw_visit_reports r
      LEFT JOIN signals s ON s.source_report_id = r.id
      WHERE r.company_id = $1 AND r.processing_status = 'done'
      GROUP BY territoire
    `, [cid]);

    for (const cs of clientStats) {
      const nbCr = parseInt(cs.nb_cr);
      const nbOpp = parseInt(cs.nb_opportunites);
      const nbRisk = parseInt(cs.nb_risques_perte);
      const sentDom = nbOpp > nbRisk ? 'positif' : nbRisk > 0 ? 'negatif' : 'neutre';
      const scorePrio = Math.min(100, nbRisk * 20 + nbOpp * 10 + parseInt(cs.nb_mentions_concurrents) * 5);

      // Get opportunity and risk motifs
      const { rows: oppMotifs } = await db.query(`
        SELECT DISTINCT s.title FROM signals s
        JOIN raw_visit_reports r ON r.id = s.source_report_id
        WHERE s.company_id = $1 AND r.client_name = $2 AND s.type = 'opportunite' LIMIT 3
      `, [cid, cs.territoire === 'Non assigne' ? null : cs.territoire]);

      const { rows: riskMotifs } = await db.query(`
        SELECT DISTINCT s.title FROM signals s
        JOIN raw_visit_reports r ON r.id = s.source_report_id
        WHERE s.company_id = $1 AND r.client_name = $2 AND s.severity = 'rouge' LIMIT 3
      `, [cid, cs.territoire === 'Non assigne' ? null : cs.territoire]);

      await db.query(
        `INSERT INTO territoires (company_id, territoire, commercial_names, nb_cr, sentiment_dominant, nb_mentions_concurrents, nb_opportunites, nb_risques_perte, tendance_vs_mois_precedent, score_priorite, motifs_opportunite, motifs_risque)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'stable', $9, $10, $11)`,
        [cid, cs.territoire, cs.commercial_names || [], nbCr, sentDom,
         parseInt(cs.nb_mentions_concurrents), nbOpp, nbRisk, scorePrio,
         oppMotifs.map(m => m.title), riskMotifs.map(m => m.title)]
      );
    }
    console.log(`  territoires: ${clientStats.length} rows`);

    // =====================================================================
    // 9. POSITIONNEMENT — perceived value per competitor per attribute
    // =====================================================================
    await db.query(`DELETE FROM positionnement WHERE company_id = $1`, [cid]);

    // Build positioning from signals and prix_signals
    const { rows: compList } = await db.query(
      `SELECT name FROM competitors WHERE company_id = $1`, [cid]
    );
    // Add "Nous" (our company)
    const actors = ['Nous', ...compList.map(c => c.name)];

    for (const acteur of actors) {
      if (acteur === 'Nous') {
        // Our positioning: derive from positive signals
        const { rows: posCount } = await db.query(
          `SELECT COUNT(*) as c FROM signals WHERE company_id = $1 AND severity = 'vert'`, [cid]
        );
        const { rows: satCount } = await db.query(
          `SELECT COUNT(*) as c FROM signals WHERE company_id = $1 AND type = 'satisfaction'`, [cid]
        );
        const attrs = [
          { attr: 'qualite', val: parseInt(posCount[0].c) > 3 ? 'fort' : parseInt(posCount[0].c) > 0 ? 'moyen' : 'faible', count: parseInt(posCount[0].c) },
          { attr: 'relation', val: parseInt(satCount[0].c) > 2 ? 'fort' : parseInt(satCount[0].c) > 0 ? 'moyen' : 'faible', count: parseInt(satCount[0].c) },
          { attr: 'sav', val: 'moyen', count: 1 },
          { attr: 'prix', val: 'moyen', count: 1 },
        ];
        for (const a of attrs) {
          await db.query(
            `INSERT INTO positionnement (company_id, acteur, attribut, valeur, count) VALUES ($1, $2, $3, $4, $5)`,
            [cid, acteur, a.attr, a.val, a.count]
          );
        }
      } else {
        // Competitor positioning from signals about them
        const { rows: compSigs } = await db.query(
          `SELECT type::text, severity, COUNT(*) as c FROM signals WHERE company_id = $1 AND competitor_name = $2 GROUP BY type, severity`,
          [cid, acteur]
        );
        const { rows: pxSigs } = await db.query(
          `SELECT ecart_type, AVG(ecart_pct) as avg_pct FROM prix_signals WHERE company_id = $1 AND concurrent_nom = $2 GROUP BY ecart_type`,
          [cid, acteur]
        );

        const totalMentions = compSigs.reduce((s, r) => s + parseInt(r.c), 0);
        const prixVal = pxSigs.length > 0 ? (pxSigs[0]?.ecart_type === 'inferieur' ? 'fort' : 'faible') : 'moyen';

        const attrs = [
          { attr: 'prix', val: prixVal, count: pxSigs.length || 1 },
          { attr: 'qualite', val: totalMentions > 3 ? 'fort' : 'moyen', count: totalMentions },
          { attr: 'relation', val: 'moyen', count: 1 },
        ];
        for (const a of attrs) {
          await db.query(
            `INSERT INTO positionnement (company_id, acteur, attribut, valeur, count) VALUES ($1, $2, $3, $4, $5)`,
            [cid, acteur, a.attr, a.val, a.count]
          );
        }
      }
    }
    console.log(`  positionnement: ${actors.length} actors`);

    // =====================================================================
    // 10. OFFRES_CONCURRENTES — competitor offers detected in signals
    // =====================================================================
    await db.query(`DELETE FROM offres_concurrentes WHERE company_id = $1`, [cid]);

    const { rows: compOffers } = await db.query(`
      SELECT
        s.competitor_name as concurrent_nom,
        s.content as description,
        MIN(r.visit_date) as date_premiere_mention,
        COUNT(*) as count_mentions,
        s.source_report_id,
        COALESCE(NULLIF(r.client_name, ''), '') as region
      FROM signals s
      JOIN raw_visit_reports r ON r.id = s.source_report_id
      WHERE s.company_id = $1 AND s.competitor_name IS NOT NULL AND s.type IN ('concurrence', 'prix')
      GROUP BY s.competitor_name, s.content, s.source_report_id, r.client_name
    `, [cid]);

    for (const offer of compOffers) {
      await db.query(
        `INSERT INTO offres_concurrentes (company_id, concurrent_nom, type_offre, description, date_premiere_mention, count_mentions, deals_impactes, deals_perdus, deals_gagnes, region, secteur, statut, source_report_id)
         VALUES ($1, $2, 'autre', $3, $4, $5, 0, 0, 0, $6, 'General', 'actif', $7)`,
        [cid, offer.concurrent_nom, offer.description, offer.date_premiere_mention, parseInt(offer.count_mentions), offer.region, offer.source_report_id]
      );
    }
    console.log(`  offres_concurrentes: ${compOffers.length} rows`);

    // =====================================================================
    // 11. COMM_CONCURRENTES — competitive communications detected
    // =====================================================================
    await db.query(`DELETE FROM comm_concurrentes WHERE company_id = $1`, [cid]);

    const { rows: compComms } = await db.query(`
      SELECT
        s.competitor_name as concurrent_nom,
        s.content as description,
        r.visit_date as date,
        COALESCE(NULLIF(r.client_name, ''), '') as region,
        s.severity,
        s.source_report_id
      FROM signals s
      JOIN raw_visit_reports r ON r.id = s.source_report_id
      WHERE s.company_id = $1 AND s.competitor_name IS NOT NULL AND s.type = 'concurrence'
    `, [cid]);

    for (const comm of compComms) {
      const reaction = comm.severity === 'rouge' ? 'negative' : comm.severity === 'vert' ? 'positive' : 'neutre';
      await db.query(
        `INSERT INTO comm_concurrentes (company_id, concurrent_nom, type_action, description, reaction_client, date, count_mentions, region, source_report_id)
         VALUES ($1, $2, 'autre', $3, $4, $5, 1, $6, $7)`,
        [cid, comm.concurrent_nom, comm.description, reaction, comm.date, comm.region, comm.source_report_id]
      );
    }
    console.log(`  comm_concurrentes: ${compComms.length} rows`);

    // =====================================================================
    // 12. RECOMMANDATIONS_IA — auto-generate recommendations from data
    // =====================================================================
    await db.query(`DELETE FROM recommandations_ia WHERE company_id = $1`, [cid]);

    // Get commercial name
    const { rows: commercials } = await db.query(
      `SELECT name FROM commercials WHERE company_id = $1 LIMIT 1`, [cid]
    );
    const commercialName = commercials[0]?.name || 'Equipe';

    // Risk-based recommendations: clients with rouge signals
    const { rows: riskClients } = await db.query(`
      SELECT r.client_name, COUNT(*) as c FROM signals s
      JOIN raw_visit_reports r ON r.id = s.source_report_id
      WHERE s.company_id = $1 AND s.severity = 'rouge' AND r.client_name IS NOT NULL
      GROUP BY r.client_name ORDER BY c DESC LIMIT 5
    `, [cid]);

    let prio = 1;
    for (const rc of riskClients) {
      await db.query(
        `INSERT INTO recommandations_ia (company_id, type, territoire, commercial_suggere, priorite, action_recommandee, statut, created_at)
         VALUES ($1, 'risque', $2, $3, $4, $5, 'nouvelle', NOW())`,
        [cid, rc.client_name, commercialName, prio++,
         `Attention: ${rc.c} signaux critiques detectes chez ${rc.client_name}. Planifier une visite de suivi urgente.`]
      );
    }

    // Opportunity-based recommendations
    const { rows: oppClients } = await db.query(`
      SELECT r.client_name, COUNT(*) as c FROM signals s
      JOIN raw_visit_reports r ON r.id = s.source_report_id
      WHERE s.company_id = $1 AND s.type = 'opportunite' AND r.client_name IS NOT NULL
      GROUP BY r.client_name ORDER BY c DESC LIMIT 5
    `, [cid]);

    for (const oc of oppClients) {
      await db.query(
        `INSERT INTO recommandations_ia (company_id, type, territoire, commercial_suggere, priorite, action_recommandee, statut, created_at)
         VALUES ($1, 'opportunite', $2, $3, $4, $5, 'nouvelle', NOW())`,
        [cid, oc.client_name, commercialName, prio++,
         `Opportunite identifiee chez ${oc.client_name}: ${oc.c} signaux positifs. Preparer une proposition commerciale.`]
      );
    }

    // Territory coaching recommendations
    const { rows: lowScoreClients } = await db.query(`
      SELECT r.client_name, COUNT(*) as total,
        COUNT(*) FILTER (WHERE o.resultat = 'non_atteint') as echecs
      FROM cr_objectifs o
      JOIN raw_visit_reports r ON r.id = o.source_report_id
      WHERE o.company_id = $1 AND r.client_name IS NOT NULL
      GROUP BY r.client_name
      HAVING COUNT(*) FILTER (WHERE o.resultat = 'non_atteint') > 0
      ORDER BY echecs DESC LIMIT 3
    `, [cid]);

    for (const lc of lowScoreClients) {
      await db.query(
        `INSERT INTO recommandations_ia (company_id, type, territoire, commercial_suggere, priorite, action_recommandee, statut, created_at)
         VALUES ($1, 'coaching', $2, $3, $4, $5, 'nouvelle', NOW())`,
        [cid, lc.client_name, commercialName, prio++,
         `${lc.echecs}/${lc.total} objectifs non atteints chez ${lc.client_name}. Revoir la strategie et accompagner le commercial.`]
      );
    }
    console.log(`  recommandations_ia: ${prio - 1} rows`);

    // =====================================================================
    // 13. DEAL_COMMERCIAL_TENDANCE — deals_commerciaux by week by motif
    // =====================================================================
    await db.query(`DELETE FROM deal_commercial_tendance WHERE company_id = $1`, [cid]);

    const { rows: dealCommWeek } = await db.query(`
      SELECT TO_CHAR(date, 'IYYY-"S"IW') as semaine, motif::text, COUNT(*) as c
      FROM deals_commerciaux WHERE company_id = $1
      GROUP BY semaine, motif
    `, [cid]);

    const dcWeeks = {};
    for (const r of dealCommWeek) {
      if (!dcWeeks[r.semaine]) dcWeeks[r.semaine] = { prix_non_competitif: 0, timing_rate: 0, concurrent_mieux_positionne: 0, relation_insuffisante: 0, besoin_mal_identifie: 0, suivi_insuffisant: 0 };
      dcWeeks[r.semaine][r.motif] = parseInt(r.c);
    }

    // If no deals, create a default week entry
    if (Object.keys(dcWeeks).length === 0) {
      const currentWeek = new Date().toISOString().slice(0, 4) + '-S' + String(getWeekNumber(new Date())).padStart(2, '0');
      dcWeeks[currentWeek] = { prix_non_competitif: 0, timing_rate: 0, concurrent_mieux_positionne: 0, relation_insuffisante: 0, besoin_mal_identifie: 0, suivi_insuffisant: 0 };
    }

    for (const [semaine, m] of Object.entries(dcWeeks)) {
      await db.query(
        `INSERT INTO deal_commercial_tendance (company_id, semaine, prix_non_competitif, timing_rate, concurrent_mieux_positionne, relation_insuffisante, besoin_mal_identifie, suivi_insuffisant)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [cid, semaine, m.prix_non_competitif, m.timing_rate, m.concurrent_mieux_positionne, m.relation_insuffisante, m.besoin_mal_identifie, m.suivi_insuffisant]
      );
    }
    console.log(`  deal_commercial_tendance: ${Object.keys(dcWeeks).length} rows`);

    // =====================================================================
    // 14. DEAL_TENDANCE — deals_marketing by week by motif
    // =====================================================================
    await db.query(`DELETE FROM deal_tendance WHERE company_id = $1`, [cid]);

    const { rows: dealMktWeek } = await db.query(`
      SELECT TO_CHAR(date, 'IYYY-"S"IW') as semaine, motif_principal::text as motif, COUNT(*) as c
      FROM deals_marketing WHERE company_id = $1
      GROUP BY semaine, motif
    `, [cid]);

    const dtWeeks = {};
    for (const r of dealMktWeek) {
      if (!dtWeeks[r.semaine]) dtWeeks[r.semaine] = { prix: 0, produit: 0, offre: 0, timing: 0, concurrent: 0, relation: 0, budget: 0, autre: 0 };
      if (dtWeeks[r.semaine][r.motif] !== undefined) dtWeeks[r.semaine][r.motif] = parseInt(r.c);
    }

    if (Object.keys(dtWeeks).length === 0) {
      const currentWeek = new Date().toISOString().slice(0, 4) + '-S' + String(getWeekNumber(new Date())).padStart(2, '0');
      dtWeeks[currentWeek] = { prix: 0, produit: 0, offre: 0, timing: 0, concurrent: 0, relation: 0, budget: 0, autre: 0 };
    }

    for (const [semaine, m] of Object.entries(dtWeeks)) {
      await db.query(
        `INSERT INTO deal_tendance (company_id, semaine, prix, produit, offre, timing, concurrent, relation, budget, autre)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [cid, semaine, m.prix, m.produit, m.offre, m.timing, m.concurrent, m.relation, m.budget, m.autre]
      );
    }
    console.log(`  deal_tendance: ${Object.keys(dtWeeks).length} rows`);

    // =====================================================================
    // 15. TENDANCE_PRIX — price trend per competitor per week
    // =====================================================================
    await db.query(`DELETE FROM tendance_prix WHERE company_id = $1`, [cid]);

    const { rows: prixWeek } = await db.query(`
      SELECT
        concurrent_nom,
        TO_CHAR(date, 'IYYY-"S"IW') as semaine,
        COUNT(*) as mentions,
        ROUND(AVG(ecart_pct))::int as ecart_moyen
      FROM prix_signals WHERE company_id = $1
      GROUP BY concurrent_nom, semaine
    `, [cid]);

    for (const pw of prixWeek) {
      await db.query(
        `INSERT INTO tendance_prix (company_id, concurrent_nom, semaine, mentions, ecart_moyen, deals_perdus, deals_gagnes)
         VALUES ($1, $2, $3, $4, $5, 0, 0)`,
        [cid, pw.concurrent_nom, pw.semaine, parseInt(pw.mentions), pw.ecart_moyen]
      );
    }
    console.log(`  tendance_prix: ${prixWeek.length} rows`);
  }

  // Final verification
  console.log('\n=== Verification ===');
  const allTables = [
    'sentiment_periodes', 'sentiment_regions', 'motifs_sentiment',
    'segment_sentiments', 'geo_points', 'region_profiles', 'geo_sector_data',
    'territoires', 'positionnement', 'offres_concurrentes', 'comm_concurrentes',
    'recommandations_ia', 'deal_commercial_tendance', 'deal_tendance', 'tendance_prix'
  ];
  for (const t of allTables) {
    const { rows } = await db.query(`SELECT count(*) as c FROM ${t}`);
    console.log(`  ${t}: ${rows[0].c} rows`);
  }

  await db.end();
  console.log('\nDone!');
}

function getWeekNumber(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
}

main().catch(err => { console.error(err); process.exit(1); });
