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

      // Insert signals
      for (const sig of (extracted.signals || [])) {
        await db.query(
          `INSERT INTO signals (company_id, type, severity, title, content, competitor_name, price_delta, region, treated, source_report_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, '', false, $8)`,
          [report.company_id, sig.type, sig.severity, sig.title, sig.content, sig.competitor_name || null, sig.price_delta || null, report.id]
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
            [report.company_id, mappedMotif, deal.resultat, deal.concurrent_nom || null, report.commercial_name || '', report.client_name || '', deal.verbatim, report.visit_date || new Date().toISOString().split('T')[0], report.id]
          );
        } else {
          await db.query(
            `INSERT INTO deals_marketing (company_id, motif_principal, resultat, concurrent_nom, commercial_name, client_name, region, verbatim, date, source_report_id)
             VALUES ($1, $2, $3, $4, $5, $6, '', $7, $8, $9)`,
            [report.company_id, deal.motif, deal.resultat, deal.concurrent_nom || null, report.commercial_name || '', report.client_name || '', deal.verbatim, report.visit_date || new Date().toISOString().split('T')[0], report.id]
          );
        }
        signalsCreated++;
      }

      // Insert prix_signals
      for (const px of (extracted.prix_signals || [])) {
        await db.query(
          `INSERT INTO prix_signals (company_id, concurrent_nom, ecart_pct, ecart_type, statut_deal, commercial_name, client_name, region, verbatim, date, source_report_id)
           VALUES ($1, $2, $3, $4, 'en_cours', $5, $6, '', $7, $8, $9)`,
          [report.company_id, px.concurrent_nom, px.ecart_pct, px.ecart_type, report.commercial_name || '', report.client_name || '', px.verbatim, report.visit_date || new Date().toISOString().split('T')[0], report.id]
        );
        signalsCreated++;
      }

      // Insert objectifs
      for (const obj of (extracted.objectifs || [])) {
        await db.query(
          `INSERT INTO cr_objectifs (company_id, commercial_name, client_name, objectif_type, resultat, cause_echec, facteur_reussite, date, region, source_report_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, '', $9)`,
          [report.company_id, report.commercial_name || '', report.client_name || '', obj.type, obj.resultat, obj.cause_echec || null, obj.facteur_reussite || null, report.visit_date || new Date().toISOString().split('T')[0], report.id]
        );
        signalsCreated++;
      }

      // Insert needs
      for (const need of (extracted.needs || [])) {
        await db.query(
          `INSERT INTO needs (company_id, label, mentions, evolution, trend, source_report_id)
           VALUES ($1, $2, 1, 0, $3, $4)`,
          [report.company_id, need.label, need.trend, report.id]
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

  // Get company IDs that had reports processed
  const companyIds = [...new Set(reports.map(r => r.company_id))];

  for (const cid of companyIds) {
    // 1. Upsert commercials from raw_visit_reports
    const { rows: commercialNames } = await db.query(
      `SELECT DISTINCT commercial_name FROM raw_visit_reports WHERE commercial_name IS NOT NULL AND commercial_name != '' AND company_id = $1`,
      [cid]
    );
    for (const { commercial_name } of commercialNames) {
      const { rows: existing } = await db.query(
        `SELECT id FROM commercials WHERE company_id = $1 AND name = $2`, [cid, commercial_name]
      );
      if (existing.length === 0) {
        const { rows: crCount } = await db.query(
          `SELECT count(*) as c FROM raw_visit_reports WHERE company_id = $1 AND commercial_name = $2 AND processing_status = 'done'`, [cid, commercial_name]
        );
        const { rows: sigCount } = await db.query(
          `SELECT count(*) as c FROM signals WHERE company_id = $1`, [cid]
        );
        await db.query(
          `INSERT INTO commercials (company_id, name, region, quality_score, quality_trend, cr_week, useful_signals) VALUES ($1, $2, '', 50, 0, $3, $4)`,
          [cid, commercial_name, parseInt(crCount[0].c), parseInt(sigCount[0].c)]
        );
        console.log(`  Created commercial: ${commercial_name}`);
      } else {
        // Update CR count
        const { rows: crCount } = await db.query(
          `SELECT count(*) as c FROM raw_visit_reports WHERE company_id = $1 AND commercial_name = $2 AND processing_status = 'done'`, [cid, commercial_name]
        );
        await db.query(`UPDATE commercials SET cr_week = $1 WHERE id = $2`, [parseInt(crCount[0].c), existing[0].id]);
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

  // Final summary
  const { rows: summary } = await db.query(`
    SELECT processing_status, count(*) FROM raw_visit_reports GROUP BY processing_status
  `);
  console.log('\n--- Summary ---');
  summary.forEach(r => console.log(`  ${r.processing_status}: ${r.count}`));

  const tables = ['signals', 'deals_marketing', 'deals_commerciaux', 'prix_signals', 'cr_objectifs', 'needs', 'commercials', 'competitors', 'alerts'];
  for (const t of tables) {
    const { rows } = await db.query(`SELECT count(*) FROM ${t}`);
    console.log(`  ${t}: ${rows[0].count}`);
  }

  await db.end();
}

main().catch(console.error);
