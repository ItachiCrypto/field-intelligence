/**
 * process-pending.js — Process pending raw_visit_reports using OpenAI API
 * Usage: node scripts/process-pending.js
 */
const { Client } = require('pg');

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });

const PG = process.env.PG_CONNECTION || 'postgresql://postgres:password@localhost:5432/postgres';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY not set in .env.local');
  process.exit(1);
}

function buildPrompt(crText) {
  return `Vous etes un expert en analyse de comptes rendus de visite commerciale francais.
Analysez ce compte-rendu et extrayez TOUTES les informations structurees en JSON strict.

Aucun concurrent connu.

COMPTE-RENDU:
"""
${crText}
"""

Extrayez en JSON strict (pas de texte avant/apres, uniquement le JSON) :

{
  "signals": [
    {
      "type": "concurrence|besoin|prix|satisfaction|opportunite",
      "severity": "rouge|orange|jaune|vert",
      "title": "titre court du signal",
      "content": "description du signal",
      "competitor_name": "nom du concurrent ou null",
      "price_delta": "ecart prix en % ou null"
    }
  ],
  "deals": [
    {
      "view": "marketing|commercial",
      "motif": "prix|produit|offre|timing|concurrent|relation|budget|autre",
      "resultat": "gagne|perdu|en_cours",
      "concurrent_nom": "nom ou null",
      "verbatim": "extrait du CR"
    }
  ],
  "prix_signals": [
    {
      "concurrent_nom": "nom",
      "ecart_pct": 12,
      "ecart_type": "inferieur|superieur",
      "verbatim": "extrait"
    }
  ],
  "objectifs": [
    {
      "type": "signature|sell_out|sell_in|formation|decouverte|fidelisation",
      "resultat": "atteint|non_atteint",
      "cause_echec": "si non atteint, la cause",
      "facteur_reussite": "si atteint, le facteur cle"
    }
  ],
  "sentiment": "positif|negatif|neutre|interesse",
  "needs": [
    { "label": "besoin identifie", "trend": "up|down|stable|new" }
  ],
  "competitors_mentioned": [
    { "name": "nom", "mention_type": "description courte de la mention" }
  ]
}

Regles :
- Soyez conservateur : n'inventez pas d'information absente du CR
- Si aucun signal d'un type, retournez un tableau vide
- Les prix doivent etre en pourcentage (ecart_pct est un nombre, pas une string)
- Le sentiment est une evaluation globale du ton du CR
- Chaque deal detecte doit avoir un verbatim extrait directement du CR`;
}

function parseResponse(text) {
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  return JSON.parse(m[0]);
}

async function callOpenAI(prompt) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: 2000,
      temperature: 0.1,
      messages: [
        { role: 'system', content: 'Vous etes un expert en analyse de comptes rendus de visite commerciale. Repondez uniquement en JSON valide, sans texte avant ou apres.' },
        { role: 'user', content: prompt },
      ],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI error: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return {
    text: data.choices?.[0]?.message?.content ?? '',
    tokens: data.usage?.total_tokens ?? 0,
  };
}

async function main() {
  const db = new Client({ connectionString: PG });
  await db.connect();

  // Get pending reports
  const { rows: reports } = await db.query(
    `SELECT * FROM raw_visit_reports WHERE processing_status = 'pending' AND processing_attempts < 3 ORDER BY synced_at LIMIT 10`
  );
  console.log(`Found ${reports.length} pending reports`);

  for (const report of reports) {
    const start = Date.now();
    console.log(`\nProcessing: ${report.subject}...`);

    // Mark processing
    await db.query(`UPDATE raw_visit_reports SET processing_status = 'processing', processing_attempts = processing_attempts + 1 WHERE id = $1`, [report.id]);

    if (!report.content_text || report.content_text.trim().length < 10) {
      await db.query(`UPDATE raw_visit_reports SET processing_status = 'skipped', processed_at = NOW() WHERE id = $1`, [report.id]);
      console.log('  -> Skipped (no content)');
      continue;
    }

    try {
      const prompt = buildPrompt(report.content_text);
      const { text, tokens } = await callOpenAI(prompt);
      const extracted = parseResponse(text);

      if (!extracted) throw new Error('Failed to parse response');

      let signalsCreated = 0;

      // Enum validation maps
      const validSignalTypes = ['concurrence','besoin','prix','satisfaction','opportunite'];
      const validSeverity = ['rouge','orange','jaune','vert'];
      const validObjTypes = ['signature','sell_out','sell_in','formation','decouverte','fidelisation'];
      const validObjResultat = ['atteint','non_atteint'];
      const validEcartType = ['inferieur','superieur'];
      const validStatutDeal = ['gagne','perdu','en_cours'];
      const validNeedTrend = ['up','down','stable','new'];

      const mapSignalType = (t) => { const m = { concurrent: 'concurrence', competition: 'concurrence', opportunity: 'opportunite', need: 'besoin', price: 'prix', quality: 'satisfaction' }; return validSignalTypes.includes(t) ? t : m[t] || 'satisfaction'; };
      const mapSeverity = (s) => validSeverity.includes(s) ? s : 'jaune';
      const mapObjType = (t) => { const m = { certification: 'formation', renouvellement: 'fidelisation', prospection: 'decouverte', upsell: 'sell_in', crosssell: 'sell_in', 'cross-sell': 'sell_in', 'sell-in': 'sell_in', 'sell-out': 'sell_out', partenariat: 'fidelisation' }; return validObjTypes.includes(t) ? t : m[t] || 'decouverte'; };
      const mapObjResultat = (r) => validObjResultat.includes(r) ? r : (r === 'en_cours' ? 'non_atteint' : 'non_atteint');
      const mapEcartType = (t) => validEcartType.includes(t) ? t : 'inferieur';
      const mapStatutDeal = (s) => validStatutDeal.includes(s) ? s : 'en_cours';
      const mapNeedTrend = (t) => validNeedTrend.includes(t) ? t : 'new';

      // Insert signals
      for (const sig of (extracted.signals || [])) {
        await db.query(
          `INSERT INTO signals (company_id, type, severity, title, content, competitor_name, price_delta, region, treated, source_report_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, '', false, $8)`,
          [report.company_id, mapSignalType(sig.type), mapSeverity(sig.severity), sig.title, sig.content, sig.competitor_name || null, sig.price_delta || null, report.id]
        );
        signalsCreated++;
      }

      // Insert deals
      const motifToCommercial = {
        prix: 'prix_non_competitif',
        produit: 'besoin_mal_identifie',
        offre: 'concurrent_mieux_positionne',
        timing: 'timing_rate',
        concurrent: 'concurrent_mieux_positionne',
        relation: 'relation_insuffisante',
        budget: 'prix_non_competitif',
        autre: 'suivi_insuffisant',
      };
      for (const deal of (extracted.deals || [])) {
        if (deal.view === 'commercial') {
          const mappedMotif = motifToCommercial[deal.motif] || 'suivi_insuffisant';
          await db.query(
            `INSERT INTO deals_commerciaux (company_id, motif, resultat, concurrent_nom, commercial_name, client_name, region, verbatim, date, source_report_id)
             VALUES ($1, $2, $3, $4, $5, $6, '', $7, $8, $9)`,
            [report.company_id, mappedMotif, mapStatutDeal(deal.resultat), deal.concurrent_nom || null, report.commercial_name || '', report.client_name || '', deal.verbatim, report.visit_date || new Date().toISOString().split('T')[0], report.id]
          );
        } else {
          const validDealMotif = ['prix','produit','offre','timing','concurrent','relation','budget','autre'];
          const dealMotif = validDealMotif.includes(deal.motif) ? deal.motif : 'autre';
          await db.query(
            `INSERT INTO deals_marketing (company_id, motif_principal, resultat, concurrent_nom, commercial_name, client_name, region, verbatim, date, source_report_id)
             VALUES ($1, $2, $3, $4, $5, $6, '', $7, $8, $9)`,
            [report.company_id, dealMotif, mapStatutDeal(deal.resultat), deal.concurrent_nom || null, report.commercial_name || '', report.client_name || '', deal.verbatim, report.visit_date || new Date().toISOString().split('T')[0], report.id]
          );
        }
        signalsCreated++;
      }

      // Insert prix_signals
      for (const px of (extracted.prix_signals || [])) {
        await db.query(
          `INSERT INTO prix_signals (company_id, concurrent_nom, ecart_pct, ecart_type, statut_deal, commercial_name, client_name, region, verbatim, date, source_report_id)
           VALUES ($1, $2, $3, $4, 'en_cours', $5, $6, '', $7, $8, $9)`,
          [report.company_id, px.concurrent_nom, px.ecart_pct, mapEcartType(px.ecart_type), report.commercial_name || '', report.client_name || '', px.verbatim, report.visit_date || new Date().toISOString().split('T')[0], report.id]
        );
        signalsCreated++;
      }

      // Insert objectifs
      for (const obj of (extracted.objectifs || [])) {
        await db.query(
          `INSERT INTO cr_objectifs (company_id, commercial_name, client_name, objectif_type, resultat, cause_echec, facteur_reussite, date, region, source_report_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, '', $9)`,
          [report.company_id, report.commercial_name || '', report.client_name || '', mapObjType(obj.type), mapObjResultat(obj.resultat), obj.cause_echec || null, obj.facteur_reussite || null, report.visit_date || new Date().toISOString().split('T')[0], report.id]
        );
        signalsCreated++;
      }

      // Insert needs
      for (const need of (extracted.needs || [])) {
        await db.query(
          `INSERT INTO needs (company_id, label, mentions, evolution, trend, source_report_id)
           VALUES ($1, $2, 1, 0, $3, $4)`,
          [report.company_id, need.label, mapNeedTrend(need.trend), report.id]
        );
      }

      // Log processing result
      await db.query(
        `INSERT INTO processing_results (raw_report_id, company_id, extracted_json, signals_created, model_used, tokens_used, processing_time_ms)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [report.id, report.company_id, JSON.stringify(extracted), signalsCreated, 'gpt-4o-mini', tokens, Date.now() - start]
      );

      // Mark done
      await db.query(`UPDATE raw_visit_reports SET processing_status = 'done', processed_at = NOW() WHERE id = $1`, [report.id]);
      console.log(`  -> OK: ${signalsCreated} items extracted (${tokens} tokens, ${Date.now() - start}ms)`);

    } catch (err) {
      await db.query(`UPDATE raw_visit_reports SET processing_status = 'error', processing_error = $2 WHERE id = $1`, [report.id, err.message]);
      console.log(`  -> ERROR: ${err.message}`);
    }
  }

  // === Post-processing: update derived tables ===
  console.log('\n--- Post-processing derived tables ---');

  // Get all company IDs that have processed reports (not just from this batch)
  const { rows: allCompanies } = await db.query(`SELECT DISTINCT company_id FROM raw_visit_reports WHERE processing_status = 'done'`);
  const companyIds = allCompanies.map(r => r.company_id);

  for (const cid of companyIds) {
    // 1. Upsert commercials from raw_visit_reports
    const { rows: commercialNames } = await db.query(
      `SELECT DISTINCT commercial_name FROM raw_visit_reports WHERE commercial_name IS NOT NULL AND commercial_name != '' AND company_id = $1`,
      [cid]
    );
    for (const { commercial_name } of commercialNames) {
      // Compute real stats for this commercial
      const { rows: crCount } = await db.query(
        `SELECT count(*) as c FROM raw_visit_reports WHERE company_id = $1 AND commercial_name = $2 AND processing_status = 'done'`, [cid, commercial_name]
      );
      // Signals linked to this commercial's reports
      const { rows: sigCount } = await db.query(
        `SELECT count(*) as c FROM signals s JOIN raw_visit_reports r ON s.source_report_id = r.id WHERE s.company_id = $1 AND r.commercial_name = $2`, [cid, commercial_name]
      );
      // Quality score: based on objectifs atteints ratio + signal severity balance
      const { rows: objStats } = await db.query(
        `SELECT
          count(*) FILTER (WHERE resultat = 'atteint') as atteints,
          count(*) FILTER (WHERE resultat = 'non_atteint') as non_atteints,
          count(*) as total
        FROM cr_objectifs WHERE company_id = $1 AND commercial_name = $2`, [cid, commercial_name]
      );
      const { rows: sevStats } = await db.query(
        `SELECT
          count(*) FILTER (WHERE severity = 'vert') as vert,
          count(*) FILTER (WHERE severity = 'orange' OR severity = 'jaune') as moyen,
          count(*) FILTER (WHERE severity = 'rouge') as rouge,
          count(*) as total
        FROM signals s JOIN raw_visit_reports r ON s.source_report_id = r.id WHERE s.company_id = $1 AND r.commercial_name = $2`, [cid, commercial_name]
      );
      // Quality score formula: 40% objectif success rate + 40% signal positivity + 20% activity (CR count)
      const objTotal = parseInt(objStats[0].total) || 0;
      const objRate = objTotal > 0 ? parseInt(objStats[0].atteints) / objTotal : 0.5;
      const sigTotal = parseInt(sevStats[0].total) || 0;
      const sigPositivity = sigTotal > 0 ? (parseInt(sevStats[0].vert) * 1.0 + parseInt(sevStats[0].moyen) * 0.5) / sigTotal : 0.5;
      const crTotal = parseInt(crCount[0].c) || 0;
      const activityScore = Math.min(crTotal / 10, 1.0); // 10 CRs = max activity score
      const qualityScore = Math.round((objRate * 40 + sigPositivity * 40 + activityScore * 20));

      // Quality trend: compare recent signals vs older ones
      const { rows: recentSig } = await db.query(
        `SELECT count(*) FILTER (WHERE severity = 'vert') as vert, count(*) as total
        FROM signals s JOIN raw_visit_reports r ON s.source_report_id = r.id
        WHERE s.company_id = $1 AND r.commercial_name = $2 AND s.created_at > NOW() - INTERVAL '7 days'`, [cid, commercial_name]
      );
      const { rows: olderSig } = await db.query(
        `SELECT count(*) FILTER (WHERE severity = 'vert') as vert, count(*) as total
        FROM signals s JOIN raw_visit_reports r ON s.source_report_id = r.id
        WHERE s.company_id = $1 AND r.commercial_name = $2 AND s.created_at <= NOW() - INTERVAL '7 days'`, [cid, commercial_name]
      );
      const recentRate = parseInt(recentSig[0].total) > 0 ? parseInt(recentSig[0].vert) / parseInt(recentSig[0].total) : 0.5;
      const olderRate = parseInt(olderSig[0].total) > 0 ? parseInt(olderSig[0].vert) / parseInt(olderSig[0].total) : 0.5;
      const qualityTrend = Math.round((recentRate - olderRate) * 100); // positive = improving

      // Determine region from most common client region or report data
      const { rows: regionData } = await db.query(
        `SELECT region, count(*) as c FROM signals s JOIN raw_visit_reports r ON s.source_report_id = r.id
        WHERE s.company_id = $1 AND r.commercial_name = $2 AND s.region IS NOT NULL AND s.region != ''
        GROUP BY region ORDER BY c DESC LIMIT 1`, [cid, commercial_name]
      );
      const commercialRegion = regionData.length > 0 ? regionData[0].region : '';

      const { rows: existing } = await db.query(
        `SELECT id FROM commercials WHERE company_id = $1 AND name = $2`, [cid, commercial_name]
      );
      if (existing.length === 0) {
        await db.query(
          `INSERT INTO commercials (company_id, name, region, quality_score, quality_trend, cr_week, useful_signals) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [cid, commercial_name, commercialRegion, qualityScore, qualityTrend, crTotal, parseInt(sigCount[0].c)]
        );
        console.log(`  Created commercial: ${commercial_name} (score=${qualityScore}, trend=${qualityTrend}, signals=${sigCount[0].c}, CRs=${crTotal})`);
      } else {
        await db.query(
          `UPDATE commercials SET region = $1, quality_score = $2, quality_trend = $3, cr_week = $4, useful_signals = $5 WHERE id = $6`,
          [commercialRegion, qualityScore, qualityTrend, crTotal, parseInt(sigCount[0].c), existing[0].id]
        );
        console.log(`  Updated commercial: ${commercial_name} (score=${qualityScore}, trend=${qualityTrend}, signals=${sigCount[0].c}, CRs=${crTotal})`);
      }
    }

    // 2. Upsert competitors from signals + prix_signals
    const { rows: sigComps } = await db.query(
      `SELECT competitor_name, count(*) as mentions FROM signals WHERE competitor_name IS NOT NULL AND competitor_name != '' AND company_id = $1 GROUP BY competitor_name`,
      [cid]
    );
    const { rows: pxComps } = await db.query(
      `SELECT concurrent_nom as competitor_name, count(*) as mentions FROM prix_signals WHERE concurrent_nom IS NOT NULL AND concurrent_nom != '' AND company_id = $1 GROUP BY concurrent_nom`,
      [cid]
    );
    const compMap = new Map();
    for (const c of [...sigComps, ...pxComps]) {
      compMap.set(c.competitor_name, (compMap.get(c.competitor_name) || 0) + parseInt(c.mentions));
    }
    for (const [name, mentions] of compMap) {
      const risk = mentions >= 5 ? 'rouge' : mentions >= 3 ? 'orange' : 'jaune';
      const { rows: existing } = await db.query(`SELECT id FROM competitors WHERE company_id = $1 AND name = $2`, [cid, name]);
      if (existing.length === 0) {
        await db.query(
          `INSERT INTO competitors (company_id, name, mention_type, mentions, risk) VALUES ($1, $2, 'concurrence', $3, $4)`,
          [cid, name, mentions, risk]
        );
        console.log(`  Created competitor: ${name} (${mentions} mentions, ${risk})`);
      } else {
        await db.query(`UPDATE competitors SET mentions = $1, risk = $2 WHERE id = $3`, [mentions, risk, existing[0].id]);
      }
    }

    // 3. Create alerts from new severe signals
    const { rows: adminUser } = await db.query(
      `SELECT id FROM profiles WHERE company_id = $1 AND role = 'admin' LIMIT 1`, [cid]
    );
    if (adminUser.length > 0) {
      const { rows: unalerted } = await db.query(
        `SELECT s.id, s.severity, s.title FROM signals s LEFT JOIN alerts a ON a.signal_id = s.id WHERE s.company_id = $1 AND s.severity IN ('rouge', 'orange') AND a.id IS NULL`,
        [cid]
      );
      for (const sig of unalerted) {
        await db.query(
          `INSERT INTO alerts (company_id, signal_id, user_id, severity, status, created_at, content) VALUES ($1, $2, $3, $4, 'nouveau', NOW(), $5)`,
          [cid, sig.id, adminUser[0].id, sig.severity, sig.title]
        );
      }
      if (unalerted.length > 0) console.log(`  Created ${unalerted.length} new alerts`);
    }

    // 4. Extract client names from subjects
    const { rows: noClient } = await db.query(
      `SELECT id, subject FROM raw_visit_reports WHERE company_id = $1 AND client_name IS NULL`, [cid]
    );
    for (const r of noClient) {
      const match = r.subject?.match(/(?:Visite|visite|RDV|CR visite|CR RDV)\s+(?:urgente\s+)?(.+?)\s*[-–]/);
      if (match) {
        await db.query(`UPDATE raw_visit_reports SET client_name = $1 WHERE id = $2`, [match[1].trim(), r.id]);
      }
    }
  }

  // === Generate all derived/aggregated tables ===
  console.log('\n--- Generating derived/aggregated tables ---');
  await generateDerivedTables(db, companyIds);

  // Final summary
  const { rows: summary } = await db.query(`
    SELECT processing_status, count(*) FROM raw_visit_reports GROUP BY processing_status
  `);
  console.log('\n--- Summary ---');
  summary.forEach(r => console.log(`  ${r.processing_status}: ${r.count}`));

  const tables = ['signals', 'deals_marketing', 'deals_commerciaux', 'prix_signals', 'cr_objectifs', 'needs', 'commercials', 'competitors', 'alerts',
    'sentiment_periodes', 'territoires', 'positionnement', 'recommandations_ia'];
  for (const t of tables) {
    const { rows } = await db.query(`SELECT count(*) FROM ${t}`);
    console.log(`  ${t}: ${rows[0].count}`);
  }

  await db.end();
}

/** Generate all derived tables for the given company IDs */
async function generateDerivedTables(db, companyIds) {
  for (const cid of companyIds) {
    // --- sentiment_periodes ---
    await db.query(`DELETE FROM sentiment_periodes WHERE company_id = $1`, [cid]);
    const { rows: sigByWeek } = await db.query(`
      SELECT TO_CHAR(r.visit_date, 'IYYY-"S"IW') as periode, s.severity, s.type::text as stype, COUNT(*) as c
      FROM signals s JOIN raw_visit_reports r ON r.id = s.source_report_id
      WHERE s.company_id = $1 AND r.visit_date IS NOT NULL GROUP BY periode, s.severity, s.type ORDER BY periode`, [cid]);
    const wk = {};
    for (const row of sigByWeek) {
      if (!wk[row.periode]) wk[row.periode] = { positif: 0, negatif: 0, neutre: 0, interesse: 0, total: 0 };
      const w = wk[row.periode]; const n = parseInt(row.c); w.total += n;
      if (row.stype === 'opportunite') w.interesse += n;
      else if (row.severity === 'vert') w.positif += n;
      else if (row.severity === 'rouge') w.negatif += n;
      else w.neutre += n;
    }
    for (const [p, s] of Object.entries(wk))
      await db.query(`INSERT INTO sentiment_periodes (company_id, periode, positif, negatif, neutre, interesse, total) VALUES ($1,$2,$3,$4,$5,$6,$7)`, [cid, p, s.positif, s.negatif, s.neutre, s.interesse, s.total]);
    console.log(`  sentiment_periodes: ${Object.keys(wk).length}`);

    // --- sentiment_regions ---
    await db.query(`DELETE FROM sentiment_regions WHERE company_id = $1`, [cid]);
    const { rows: cliSig } = await db.query(`
      SELECT COALESCE(NULLIF(r.client_name,''),'Non assigne') as region, s.severity, s.type::text as stype, COUNT(*) as c
      FROM signals s JOIN raw_visit_reports r ON r.id = s.source_report_id WHERE s.company_id = $1
      GROUP BY COALESCE(NULLIF(r.client_name,''),'Non assigne'), s.severity, s.type`, [cid]);
    const rg = {};
    for (const row of cliSig) {
      if (!rg[row.region]) rg[row.region] = { positif: 0, negatif: 0, neutre: 0, interesse: 0, total: 0 };
      const w = rg[row.region]; const n = parseInt(row.c); w.total += n;
      if (row.stype === 'opportunite') w.interesse += n;
      else if (row.severity === 'vert') w.positif += n;
      else if (row.severity === 'rouge') w.negatif += n;
      else w.neutre += n;
    }
    for (const [region, s] of Object.entries(rg))
      await db.query(`INSERT INTO sentiment_regions (company_id, region, positif, negatif, neutre, interesse, total) VALUES ($1,$2,$3,$4,$5,$6,$7)`, [cid, region, s.positif, s.negatif, s.neutre, s.interesse, s.total]);
    console.log(`  sentiment_regions: ${Object.keys(rg).length}`);

    // --- motifs_sentiment ---
    await db.query(`DELETE FROM motifs_sentiment WHERE company_id = $1`, [cid]);
    const { rows: pm } = await db.query(`SELECT title as motif, COUNT(*) as mentions FROM signals WHERE company_id = $1 AND severity = 'vert' GROUP BY title LIMIT 10`, [cid]);
    for (const m of pm) await db.query(`INSERT INTO motifs_sentiment (company_id, motif, type, mentions) VALUES ($1,$2,'positif',$3)`, [cid, m.motif, parseInt(m.mentions)]);
    const { rows: nm } = await db.query(`SELECT title as motif, COUNT(*) as mentions FROM signals WHERE company_id = $1 AND severity IN ('rouge','orange','jaune') GROUP BY title LIMIT 15`, [cid]);
    for (const m of nm) await db.query(`INSERT INTO motifs_sentiment (company_id, motif, type, mentions) VALUES ($1,$2,'negatif',$3)`, [cid, m.motif, parseInt(m.mentions)]);
    console.log(`  motifs_sentiment: ${pm.length + nm.length}`);

    // --- segment_sentiments ---
    await db.query(`DELETE FROM segment_sentiments WHERE company_id = $1`, [cid]);
    const { rows: cv } = await db.query(`SELECT client_name, COUNT(*) as visits FROM raw_visit_reports WHERE company_id = $1 AND client_name IS NOT NULL AND processing_status = 'done' GROUP BY client_name`, [cid]);
    const segs = { nouveau: { clients: [], cr: 0 }, etabli: { clients: [], cr: 0 } };
    for (const c of cv) { const s = parseInt(c.visits) >= 2 ? 'etabli' : 'nouveau'; segs[s].clients.push(c.client_name); segs[s].cr += parseInt(c.visits); }
    for (const [seg, data] of Object.entries(segs)) {
      if (data.clients.length === 0) continue;
      const { rows: sd } = await db.query(`SELECT s.severity, COUNT(*) as c FROM signals s JOIN raw_visit_reports r ON r.id = s.source_report_id WHERE s.company_id = $1 AND r.client_name = ANY($2) GROUP BY s.severity`, [cid, data.clients]);
      const tot = sd.reduce((s, r) => s + parseInt(r.c), 0) || 1;
      const sm = {}; sd.forEach(r => sm[r.severity] = parseInt(r.c));
      const pp = Math.round(((sm['vert']||0)/tot)*100), pn = Math.round(((sm['rouge']||0)/tot)*100), pne = Math.round((((sm['orange']||0)+(sm['jaune']||0))/tot)*100);
      const { rows: ins } = await db.query(`SELECT DISTINCT s.title FROM signals s JOIN raw_visit_reports r ON r.id = s.source_report_id WHERE s.company_id = $1 AND r.client_name = ANY($2) AND s.severity IN ('rouge','orange') LIMIT 5`, [cid, data.clients]);
      const { rows: pos } = await db.query(`SELECT DISTINCT s.title FROM signals s JOIN raw_visit_reports r ON r.id = s.source_report_id WHERE s.company_id = $1 AND r.client_name = ANY($2) AND s.severity = 'vert' LIMIT 5`, [cid, data.clients]);
      await db.query(`INSERT INTO segment_sentiments (company_id,segment,nb_cr,pct_positif,pct_negatif,pct_neutre,pct_interesse,top_insatisfactions,top_points_positifs) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [cid, seg, data.cr, pp, pn, pne, Math.max(0, 100-pp-pn-pne), ins.map(i=>i.title), pos.map(p=>p.title)]);
    }
    console.log(`  segment_sentiments: ${Object.keys(segs).filter(s=>segs[s].clients.length>0).length}`);

    // --- geo_points + region_profiles + geo_sector_data ---
    await db.query(`DELETE FROM geo_points WHERE company_id = $1`, [cid]);
    await db.query(`DELETE FROM region_profiles WHERE company_id = $1`, [cid]);
    await db.query(`DELETE FROM geo_sector_data WHERE company_id = $1`, [cid]);
    const { rows: gd } = await db.query(`SELECT COALESCE(NULLIF(r.client_name,''),'Non assigne') as client, s.type::text, COUNT(*) as c FROM signals s JOIN raw_visit_reports r ON r.id = s.source_report_id WHERE s.company_id = $1 GROUP BY COALESCE(NULLIF(r.client_name,''),'Non assigne'), s.type`, [cid]);
    const gm = {};
    for (const row of gd) { if (!gm[row.client]) gm[row.client] = { opp: 0, risk: 0, conc: 0, bes: 0 }; const g = gm[row.client]; const n = parseInt(row.c);
      if (row.type === 'opportunite') g.opp += n; else if (row.type === 'concurrence') g.conc += n; else if (row.type === 'besoin') g.bes += n; else g.risk += n; }
    for (const [cl, g] of Object.entries(gm)) {
      const int = g.opp + g.risk + g.conc + g.bes;
      await db.query(`INSERT INTO geo_points (company_id,region,dept,opportunites,risques,concurrence,besoins,intensite) VALUES ($1,$2,$2,$3,$4,$5,$6,$7)`, [cid, cl, g.opp, g.risk, g.conc, g.bes, int]);
      const { rows: tb } = await db.query(`SELECT s.title FROM signals s JOIN raw_visit_reports r ON r.id = s.source_report_id WHERE s.company_id = $1 AND r.client_name = $2 AND s.type = 'besoin' LIMIT 3`, [cid, cl === 'Non assigne' ? null : cl]);
      const { rows: tc } = await db.query(`SELECT s.competitor_name, COUNT(*) as c FROM signals s JOIN raw_visit_reports r ON r.id = s.source_report_id WHERE s.company_id = $1 AND r.client_name = $2 AND s.competitor_name IS NOT NULL GROUP BY s.competitor_name ORDER BY c DESC LIMIT 1`, [cid, cl === 'Non assigne' ? null : cl]);
      const sd = g.opp > g.risk ? 'positif' : g.risk > 0 ? 'negatif' : 'neutre';
      await db.query(`INSERT INTO region_profiles (company_id,region,top_besoins,concurrent_principal,concurrent_mentions,sentiment_dominant,specificite_locale,nb_signaux) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [cid, cl, tb.map(b=>b.title), tc[0]?.competitor_name||null, parseInt(tc[0]?.c||0), sd, g.conc > 2 ? 'Forte pression concurrentielle' : g.bes > 2 ? 'Zone a fort besoin' : 'Zone standard', int]);
      await db.query(`INSERT INTO geo_sector_data (company_id,secteur,region,signaux_concurrence,signaux_besoins,signaux_opportunites,score_intensite) VALUES ($1,'General',$2,$3,$4,$5,$6)`, [cid, cl, g.conc, g.bes, g.opp, Math.min(100, int*10)]);
    }
    console.log(`  geo_points/region_profiles/geo_sector_data: ${Object.keys(gm).length} each`);

    // --- territoires ---
    await db.query(`DELETE FROM territoires WHERE company_id = $1`, [cid]);
    const { rows: cs } = await db.query(`
      SELECT COALESCE(NULLIF(r.client_name,''),'Non assigne') as territoire, ARRAY_AGG(DISTINCT r.commercial_name) FILTER (WHERE r.commercial_name IS NOT NULL) as commercial_names, COUNT(DISTINCT r.id) as nb_cr,
        COUNT(*) FILTER (WHERE s.competitor_name IS NOT NULL) as nb_conc, COUNT(*) FILTER (WHERE s.type = 'opportunite') as nb_opp, COUNT(*) FILTER (WHERE s.severity = 'rouge') as nb_risk
      FROM raw_visit_reports r LEFT JOIN signals s ON s.source_report_id = r.id WHERE r.company_id = $1 AND r.processing_status = 'done'
      GROUP BY COALESCE(NULLIF(r.client_name,''),'Non assigne')`, [cid]);
    for (const c of cs) {
      const sd = parseInt(c.nb_opp) > parseInt(c.nb_risk) ? 'positif' : parseInt(c.nb_risk) > 0 ? 'negatif' : 'neutre';
      const sp = Math.min(100, parseInt(c.nb_risk)*20 + parseInt(c.nb_opp)*10 + parseInt(c.nb_conc)*5);
      const { rows: om } = await db.query(`SELECT DISTINCT s.title FROM signals s JOIN raw_visit_reports r ON r.id = s.source_report_id WHERE s.company_id = $1 AND r.client_name = $2 AND s.type = 'opportunite' LIMIT 3`, [cid, c.territoire === 'Non assigne' ? null : c.territoire]);
      const { rows: rm } = await db.query(`SELECT DISTINCT s.title FROM signals s JOIN raw_visit_reports r ON r.id = s.source_report_id WHERE s.company_id = $1 AND r.client_name = $2 AND s.severity = 'rouge' LIMIT 3`, [cid, c.territoire === 'Non assigne' ? null : c.territoire]);
      await db.query(`INSERT INTO territoires (company_id,territoire,commercial_names,nb_cr,sentiment_dominant,nb_mentions_concurrents,nb_opportunites,nb_risques_perte,tendance_vs_mois_precedent,score_priorite,motifs_opportunite,motifs_risque) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'stable',$9,$10,$11)`,
        [cid, c.territoire, c.commercial_names||[], parseInt(c.nb_cr), sd, parseInt(c.nb_conc), parseInt(c.nb_opp), parseInt(c.nb_risk), sp, om.map(m=>m.title), rm.map(m=>m.title)]);
    }
    console.log(`  territoires: ${cs.length}`);

    // --- positionnement ---
    await db.query(`DELETE FROM positionnement WHERE company_id = $1`, [cid]);
    const { rows: comps } = await db.query(`SELECT name FROM competitors WHERE company_id = $1`, [cid]);
    const actors = ['Nous', ...comps.map(c => c.name)];
    for (const acteur of actors) {
      if (acteur === 'Nous') {
        const { rows: pc } = await db.query(`SELECT COUNT(*) as c FROM signals WHERE company_id = $1 AND severity = 'vert'`, [cid]);
        const { rows: sc } = await db.query(`SELECT COUNT(*) as c FROM signals WHERE company_id = $1 AND type = 'satisfaction'`, [cid]);
        const attrs = [{ a: 'qualite', v: parseInt(pc[0].c)>3?'fort':parseInt(pc[0].c)>0?'moyen':'faible', c: parseInt(pc[0].c) },
          { a: 'relation', v: parseInt(sc[0].c)>2?'fort':'moyen', c: parseInt(sc[0].c) }, { a: 'sav', v: 'moyen', c: 1 }, { a: 'prix', v: 'moyen', c: 1 }];
        for (const at of attrs) await db.query(`INSERT INTO positionnement (company_id,acteur,attribut,valeur,count) VALUES ($1,$2,$3,$4,$5)`, [cid, acteur, at.a, at.v, at.c]);
      } else {
        const { rows: px } = await db.query(`SELECT ecart_type, AVG(ecart_pct) as avg FROM prix_signals WHERE company_id = $1 AND concurrent_nom = $2 GROUP BY ecart_type`, [cid, acteur]);
        const { rows: cs2 } = await db.query(`SELECT COUNT(*) as c FROM signals WHERE company_id = $1 AND competitor_name = $2`, [cid, acteur]);
        const prixVal = px.length > 0 ? (px[0]?.ecart_type === 'inferieur' ? 'fort' : 'faible') : 'moyen';
        const tm = parseInt(cs2[0]?.c || 0);
        const attrs = [{ a: 'prix', v: prixVal, c: px.length||1 }, { a: 'qualite', v: tm>3?'fort':'moyen', c: tm }, { a: 'relation', v: 'moyen', c: 1 }];
        for (const at of attrs) await db.query(`INSERT INTO positionnement (company_id,acteur,attribut,valeur,count) VALUES ($1,$2,$3,$4,$5)`, [cid, acteur, at.a, at.v, at.c]);
      }
    }
    console.log(`  positionnement: ${actors.length} actors`);

    // --- offres_concurrentes ---
    await db.query(`DELETE FROM offres_concurrentes WHERE company_id = $1`, [cid]);
    const { rows: oc } = await db.query(`
      SELECT s.competitor_name, s.content, MIN(r.visit_date) as d, COUNT(*) as c, s.source_report_id, COALESCE(NULLIF(r.client_name,''),'') as region
      FROM signals s JOIN raw_visit_reports r ON r.id = s.source_report_id
      WHERE s.company_id = $1 AND s.competitor_name IS NOT NULL AND s.type IN ('concurrence','prix')
      GROUP BY s.competitor_name, s.content, s.source_report_id, r.client_name`, [cid]);
    for (const o of oc) await db.query(`INSERT INTO offres_concurrentes (company_id,concurrent_nom,type_offre,description,date_premiere_mention,count_mentions,deals_impactes,deals_perdus,deals_gagnes,region,secteur,statut,source_report_id) VALUES ($1,$2,'autre',$3,$4,$5,0,0,0,$6,'General','actif',$7)`,
      [cid, o.competitor_name, o.content, o.d, parseInt(o.c), o.region, o.source_report_id]);
    console.log(`  offres_concurrentes: ${oc.length}`);

    // --- comm_concurrentes ---
    await db.query(`DELETE FROM comm_concurrentes WHERE company_id = $1`, [cid]);
    const { rows: cc } = await db.query(`
      SELECT s.competitor_name, s.content, r.visit_date, COALESCE(NULLIF(r.client_name,''),'') as region, s.severity, s.source_report_id
      FROM signals s JOIN raw_visit_reports r ON r.id = s.source_report_id WHERE s.company_id = $1 AND s.competitor_name IS NOT NULL AND s.type = 'concurrence'`, [cid]);
    for (const c of cc) { const react = c.severity === 'rouge' ? 'negative' : c.severity === 'vert' ? 'positive' : 'neutre';
      await db.query(`INSERT INTO comm_concurrentes (company_id,concurrent_nom,type_action,description,reaction_client,date,count_mentions,region,source_report_id) VALUES ($1,$2,'autre',$3,$4,$5,1,$6,$7)`,
        [cid, c.competitor_name, c.content, react, c.visit_date, c.region, c.source_report_id]); }
    console.log(`  comm_concurrentes: ${cc.length}`);

    // --- recommandations_ia ---
    await db.query(`DELETE FROM recommandations_ia WHERE company_id = $1`, [cid]);
    const { rows: coms } = await db.query(`SELECT name FROM commercials WHERE company_id = $1 LIMIT 1`, [cid]);
    const comName = coms[0]?.name || 'Equipe';
    let prio = 1;
    const { rows: rc } = await db.query(`SELECT r.client_name, COUNT(*) as c FROM signals s JOIN raw_visit_reports r ON r.id = s.source_report_id WHERE s.company_id = $1 AND s.severity = 'rouge' AND r.client_name IS NOT NULL GROUP BY r.client_name ORDER BY c DESC LIMIT 5`, [cid]);
    for (const r of rc) await db.query(`INSERT INTO recommandations_ia (company_id,type,territoire,commercial_suggere,priorite,action_recommandee,statut,created_at) VALUES ($1,'risque',$2,$3,$4,$5,'nouvelle',NOW())`,
      [cid, r.client_name, comName, prio++, `Attention: ${r.c} signaux critiques chez ${r.client_name}. Planifier visite de suivi urgente.`]);
    const { rows: opc } = await db.query(`SELECT r.client_name, COUNT(*) as c FROM signals s JOIN raw_visit_reports r ON r.id = s.source_report_id WHERE s.company_id = $1 AND s.type = 'opportunite' AND r.client_name IS NOT NULL GROUP BY r.client_name ORDER BY c DESC LIMIT 5`, [cid]);
    for (const o of opc) await db.query(`INSERT INTO recommandations_ia (company_id,type,territoire,commercial_suggere,priorite,action_recommandee,statut,created_at) VALUES ($1,'opportunite',$2,$3,$4,$5,'nouvelle',NOW())`,
      [cid, o.client_name, comName, prio++, `Opportunite chez ${o.client_name}: ${o.c} signaux positifs. Preparer proposition commerciale.`]);
    const { rows: lc } = await db.query(`SELECT r.client_name, COUNT(*) as total, COUNT(*) FILTER (WHERE o.resultat = 'non_atteint') as echecs FROM cr_objectifs o JOIN raw_visit_reports r ON r.id = o.source_report_id WHERE o.company_id = $1 AND r.client_name IS NOT NULL GROUP BY r.client_name HAVING COUNT(*) FILTER (WHERE o.resultat = 'non_atteint') > 0 ORDER BY echecs DESC LIMIT 3`, [cid]);
    for (const l of lc) await db.query(`INSERT INTO recommandations_ia (company_id,type,territoire,commercial_suggere,priorite,action_recommandee,statut,created_at) VALUES ($1,'coaching',$2,$3,$4,$5,'nouvelle',NOW())`,
      [cid, l.client_name, comName, prio++, `${l.echecs}/${l.total} objectifs non atteints chez ${l.client_name}. Revoir strategie.`]);
    console.log(`  recommandations_ia: ${prio - 1}`);

    // --- deal_commercial_tendance ---
    await db.query(`DELETE FROM deal_commercial_tendance WHERE company_id = $1`, [cid]);
    const { rows: dcw } = await db.query(`SELECT TO_CHAR(date, 'IYYY-"S"IW') as semaine, motif::text, COUNT(*) as c FROM deals_commerciaux WHERE company_id = $1 GROUP BY semaine, motif`, [cid]);
    const dcm = {};
    for (const r of dcw) { if (!dcm[r.semaine]) dcm[r.semaine] = { prix_non_competitif:0, timing_rate:0, concurrent_mieux_positionne:0, relation_insuffisante:0, besoin_mal_identifie:0, suivi_insuffisant:0 }; dcm[r.semaine][r.motif] = parseInt(r.c); }
    if (Object.keys(dcm).length === 0) { const cw = new Date().toISOString().slice(0,4)+'-S'+String(getWeekNum(new Date())).padStart(2,'0'); dcm[cw] = { prix_non_competitif:0, timing_rate:0, concurrent_mieux_positionne:0, relation_insuffisante:0, besoin_mal_identifie:0, suivi_insuffisant:0 }; }
    for (const [s, m] of Object.entries(dcm)) await db.query(`INSERT INTO deal_commercial_tendance (company_id,semaine,prix_non_competitif,timing_rate,concurrent_mieux_positionne,relation_insuffisante,besoin_mal_identifie,suivi_insuffisant) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`, [cid, s, m.prix_non_competitif, m.timing_rate, m.concurrent_mieux_positionne, m.relation_insuffisante, m.besoin_mal_identifie, m.suivi_insuffisant]);
    console.log(`  deal_commercial_tendance: ${Object.keys(dcm).length}`);

    // --- deal_tendance ---
    await db.query(`DELETE FROM deal_tendance WHERE company_id = $1`, [cid]);
    const { rows: dtw } = await db.query(`SELECT TO_CHAR(date, 'IYYY-"S"IW') as semaine, motif_principal::text as motif, COUNT(*) as c FROM deals_marketing WHERE company_id = $1 GROUP BY semaine, motif`, [cid]);
    const dtm = {};
    for (const r of dtw) { if (!dtm[r.semaine]) dtm[r.semaine] = { prix:0, produit:0, offre:0, timing:0, concurrent:0, relation:0, budget:0, autre:0 }; if (dtm[r.semaine][r.motif] !== undefined) dtm[r.semaine][r.motif] = parseInt(r.c); }
    if (Object.keys(dtm).length === 0) { const cw = new Date().toISOString().slice(0,4)+'-S'+String(getWeekNum(new Date())).padStart(2,'0'); dtm[cw] = { prix:0, produit:0, offre:0, timing:0, concurrent:0, relation:0, budget:0, autre:0 }; }
    for (const [s, m] of Object.entries(dtm)) await db.query(`INSERT INTO deal_tendance (company_id,semaine,prix,produit,offre,timing,concurrent,relation,budget,autre) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`, [cid, s, m.prix, m.produit, m.offre, m.timing, m.concurrent, m.relation, m.budget, m.autre]);
    console.log(`  deal_tendance: ${Object.keys(dtm).length}`);

    // --- tendance_prix ---
    await db.query(`DELETE FROM tendance_prix WHERE company_id = $1`, [cid]);
    const { rows: pw } = await db.query(`SELECT concurrent_nom, TO_CHAR(date, 'IYYY-"S"IW') as semaine, COUNT(*) as mentions, ROUND(AVG(ecart_pct))::int as ecart_moyen FROM prix_signals WHERE company_id = $1 GROUP BY concurrent_nom, semaine`, [cid]);
    for (const p of pw) await db.query(`INSERT INTO tendance_prix (company_id,concurrent_nom,semaine,mentions,ecart_moyen,deals_perdus,deals_gagnes) VALUES ($1,$2,$3,$4,$5,0,0)`, [cid, p.concurrent_nom, p.semaine, parseInt(p.mentions), p.ecart_moyen]);
    console.log(`  tendance_prix: ${pw.length}`);
  }
}

function getWeekNum(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
}

main().catch(console.error);
