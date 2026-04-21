/**
 * run-analytics.js
 * Exécute recomputeAnalytics directement en Node.js (sans TypeScript/Next.js)
 * Usage: node scripts/run-analytics.js
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cbcjiszrajsqtrhpgsqf.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiY2ppc3pyYWpzcXRyaHBnc3FmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTc3ODU5MSwiZXhwIjoyMDkxMzU0NTkxfQ.Bdrhy2BlhUm4fZ9hH4qzPPtX-U19FZ4B8Lp-3Vkldec';
const COMPANY_ID = process.env.COMPANY_ID || 'a0000000-0000-0000-0000-000000000001';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

/* ── Helpers ──────────────────────────────────────────────── */

function isoWeek(date) {
  const d = new Date(typeof date === 'string' ? date : date.toISOString());
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const wn =
    1 +
    Math.round(
      ((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7,
    );
  return `${d.getFullYear()}-S${String(wn).padStart(2, '0')}`;
}

function classifySentiment(sig) {
  const { type, severity } = sig;
  if (type === 'satisfaction') {
    if (severity === 'vert') return 'positif';
    if (severity === 'rouge' || severity === 'orange') return 'negatif';
    return 'neutre';
  }
  if (type === 'opportunite') return 'positif';
  if (type === 'besoin') return 'interesse';
  if (type === 'concurrence' && (severity === 'rouge' || severity === 'orange')) return 'negatif';
  return 'neutre';
}

function topN(map, n) {
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([k]) => k);
}

/* ── Main ─────────────────────────────────────────────────── */

async function recomputeAnalytics(companyId) {
  console.log(`\nRecompute analytics for company: ${companyId}`);

  // 1. Fetch raw data
  console.log('  Fetching raw data...');
  const [
    { data: signals = [], error: e1 },
    { data: accounts = [], error: e2 },
    { data: commercials = [], error: e3 },
    { data: dealsCommerciaux = [], error: e4 },
    { data: prixSignals = [], error: e5 },
    { data: crObjectifs = [], error: e6 },
    { data: rawReports = [], error: e7 },
  ] = await Promise.all([
    supabase.from('signals').select('*').eq('company_id', companyId),
    supabase.from('accounts').select('id, name, sector, region').eq('company_id', companyId),
    supabase.from('commercials').select('id, name, region, quality_score').eq('company_id', companyId),
    supabase.from('deals_commerciaux').select('*').eq('company_id', companyId),
    supabase.from('prix_signals').select('*').eq('company_id', companyId),
    supabase.from('cr_objectifs').select('*').eq('company_id', companyId),
    supabase.from('raw_visit_reports').select('id, client_name, commercial_name').eq('company_id', companyId),
  ]);

  for (const [label, err] of [
    ['signals', e1], ['accounts', e2], ['commercials', e3],
    ['deals_commerciaux', e4], ['prix_signals', e5], ['cr_objectifs', e6], ['raw_visit_reports', e7]
  ]) {
    if (err) console.warn(`  Warning: error fetching ${label}:`, err.message);
  }

  console.log(`  signals=${signals.length}, accounts=${accounts.length}, commercials=${commercials.length}`);
  console.log(`  deals=${dealsCommerciaux.length}, prix=${prixSignals.length}, cr_obj=${crObjectifs.length}, reports=${rawReports.length}`);

  // Enrich signals
  const reportMap = new Map(rawReports.map(r => [r.id, { client_name: r.client_name ?? null, commercial_name: r.commercial_name ?? null }]));
  const enriched = signals.map(s => {
    const rpt = s.source_report_id ? reportMap.get(s.source_report_id) : null;
    return { ...s, client_name: rpt?.client_name ?? null, commercial_name: rpt?.commercial_name ?? null };
  });

  const acctMap = new Map(accounts.filter(a => a.name).map(a => [a.name.trim(), { sector: a.sector ?? 'Autre', region: a.region ?? '' }]));

  const clientReportCount = new Map();
  for (const r of rawReports) {
    if (r.client_name?.trim())
      clientReportCount.set(r.client_name.trim(), (clientReportCount.get(r.client_name.trim()) ?? 0) + 1);
  }

  const updated = [];

  /* 2. sentiment_periodes */
  {
    const map = new Map();
    for (const s of enriched) {
      if (!s.created_at) continue;
      const wk = isoWeek(s.created_at);
      if (!map.has(wk)) map.set(wk, { positif: 0, negatif: 0, neutre: 0, interesse: 0, total: 0 });
      const row = map.get(wk);
      row[classifySentiment(s)]++;
      row.total++;
    }
    const rows = Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([periode, c]) => ({ company_id: companyId, periode, ...c }));
    await supabase.from('sentiment_periodes').delete().eq('company_id', companyId);
    if (rows.length) await supabase.from('sentiment_periodes').insert(rows);
    console.log(`  sentiment_periodes: ${rows.length} rows`);
    updated.push('sentiment_periodes');
  }

  /* 3. sentiment_regions */
  {
    const map = new Map();
    for (const s of enriched) {
      const region = s.region || 'Non renseigne';
      if (!map.has(region)) map.set(region, { positif: 0, negatif: 0, neutre: 0, interesse: 0, total: 0 });
      const row = map.get(region);
      row[classifySentiment(s)]++;
      row.total++;
    }
    const rows = Array.from(map.entries()).map(([region, c]) => ({ company_id: companyId, region, ...c }));
    await supabase.from('sentiment_regions').delete().eq('company_id', companyId);
    if (rows.length) await supabase.from('sentiment_regions').insert(rows);
    console.log(`  sentiment_regions: ${rows.length} rows`);
    updated.push('sentiment_regions');
  }

  /* 4. motifs_sentiment */
  {
    const pos = new Map();
    const neg = new Map();
    for (const s of enriched) {
      if (!s.title) continue;
      const sent = classifySentiment(s);
      if (sent === 'positif') pos.set(s.title, (pos.get(s.title) ?? 0) + 1);
      if (sent === 'negatif') neg.set(s.title, (neg.get(s.title) ?? 0) + 1);
    }
    const rows = [
      ...Array.from(pos.entries()).map(([motif, mentions]) => ({ company_id: companyId, motif, type: 'positif', mentions })),
      ...Array.from(neg.entries()).map(([motif, mentions]) => ({ company_id: companyId, motif, type: 'negatif', mentions })),
    ];
    await supabase.from('motifs_sentiment').delete().eq('company_id', companyId);
    if (rows.length) await supabase.from('motifs_sentiment').insert(rows);
    console.log(`  motifs_sentiment: ${rows.length} rows`);
    updated.push('motifs_sentiment');
  }

  /* 5. geo_points */
  {
    const map = new Map();
    for (const s of enriched) {
      const region = s.region || 'Non renseigne';
      if (!map.has(region)) map.set(region, { opportunites: 0, risques: 0, concurrence: 0, besoins: 0, total: 0 });
      const r = map.get(region);
      if (s.type === 'opportunite') r.opportunites++;
      if (s.severity === 'rouge' || s.severity === 'orange') r.risques++;
      if (s.type === 'concurrence') r.concurrence++;
      if (s.type === 'besoin') r.besoins++;
      r.total++;
    }
    const maxTotal = Math.max(...Array.from(map.values()).map(v => v.total), 1);
    const rows = Array.from(map.entries()).map(([region, v]) => ({
      company_id: companyId, region,
      opportunites: v.opportunites, risques: v.risques, concurrence: v.concurrence, besoins: v.besoins,
      intensite: Math.round((v.total / maxTotal) * 100),
    }));
    await supabase.from('geo_points').delete().eq('company_id', companyId);
    if (rows.length) await supabase.from('geo_points').insert(rows);
    console.log(`  geo_points: ${rows.length} rows`);
    updated.push('geo_points');
  }

  /* 6. region_profiles */
  {
    const map = new Map();
    for (const s of enriched) {
      const region = s.region || 'Non renseigne';
      if (!map.has(region)) map.set(region, { sigs: [], concMentions: new Map(), besoins: new Map(), sents: { positif: 0, negatif: 0, neutre: 0, interesse: 0 } });
      const rd = map.get(region);
      rd.sigs.push(s);
      if (s.competitor_name) rd.concMentions.set(s.competitor_name, (rd.concMentions.get(s.competitor_name) ?? 0) + 1);
      if (s.type === 'besoin' && s.title) rd.besoins.set(s.title, (rd.besoins.get(s.title) ?? 0) + 1);
      rd.sents[classifySentiment(s)]++;
    }
    const rows = Array.from(map.entries()).map(([region, rd]) => {
      const topConc = Array.from(rd.concMentions.entries()).sort((a, b) => b[1] - a[1]);
      const topBesoins = topN(rd.besoins, 3);
      const dominant = ['positif', 'negatif', 'neutre', 'interesse'].sort((a, b) => rd.sents[b] - rd.sents[a])[0];
      const rougeCount = rd.sigs.filter(s => s.severity === 'rouge').length;
      return {
        company_id: companyId, region,
        nb_signaux: rd.sigs.length,
        sentiment_dominant: dominant,
        concurrent_mentions: [...rd.concMentions.values()].reduce((a, b) => a + b, 0),
        concurrent_principal: topConc[0]?.[0] ?? null,
        top_besoins: topBesoins,
        specificite_locale: rougeCount > 0
          ? `${rougeCount} signal${rougeCount > 1 ? 's' : ''} critique${rougeCount > 1 ? 's' : ''} detecte${rougeCount > 1 ? 's' : ''}`
          : topBesoins.length > 0 ? `Besoin principal : ${topBesoins[0]}` : 'Region en cours de couverture',
      };
    });
    await supabase.from('region_profiles').delete().eq('company_id', companyId);
    if (rows.length) await supabase.from('region_profiles').insert(rows);
    console.log(`  region_profiles: ${rows.length} rows`);
    updated.push('region_profiles');
  }

  /* 7. territoires */
  {
    const map = new Map();
    for (const s of enriched) {
      const region = s.region || 'Non renseigne';
      if (!map.has(region)) map.set(region, { sigs: [], comms: new Set(), reportIds: new Set(), sents: { positif: 0, negatif: 0, neutre: 0, interesse: 0 }, opps: [], risks: [], concCount: 0 });
      const rd = map.get(region);
      rd.sigs.push(s);
      if (s.commercial_name) rd.comms.add(s.commercial_name);
      if (s.source_report_id) rd.reportIds.add(s.source_report_id);
      rd.sents[classifySentiment(s)]++;
      if (s.type === 'opportunite' && s.title && rd.opps.length < 4) rd.opps.push(s.title);
      if (s.severity === 'rouge' && s.title && rd.risks.length < 4) rd.risks.push(s.title);
      if (s.competitor_name) rd.concCount++;
    }
    const rows = Array.from(map.entries()).map(([region, rd]) => {
      const dominant = ['positif', 'negatif', 'neutre', 'interesse'].sort((a, b) => rd.sents[b] - rd.sents[a])[0];
      const nbOpp = rd.sigs.filter(s => s.type === 'opportunite').length;
      const nbRouge = rd.sigs.filter(s => s.severity === 'rouge').length;
      return {
        company_id: companyId, territoire: region,
        commercial_names: Array.from(rd.comms),
        nb_cr: rd.reportIds.size,
        sentiment_dominant: dominant,
        nb_mentions_concurrents: rd.concCount,
        nb_opportunites: nbOpp,
        nb_risques_perte: nbRouge,
        tendance_vs_mois_precedent: 'stable',
        score_priorite: Math.min(100, nbOpp * 10 + nbRouge * 20),
        motifs_opportunite: [...new Set(rd.opps)].slice(0, 3),
        motifs_risque: [...new Set(rd.risks)].slice(0, 3),
      };
    });
    await supabase.from('territoires').delete().eq('company_id', companyId);
    if (rows.length) await supabase.from('territoires').insert(rows);
    console.log(`  territoires: ${rows.length} rows`);
    updated.push('territoires');
  }

  /* 8. segment_sentiments */
  {
    const segData = {
      nouveau: { sigs: [], pos: 0, neg: 0, neu: 0, int: 0 },
      etabli:  { sigs: [], pos: 0, neg: 0, neu: 0, int: 0 },
    };
    for (const s of enriched) {
      const clientName = s.client_name?.trim();
      const count = clientName ? (clientReportCount.get(clientName) ?? 0) : 0;
      const seg = count <= 1 ? 'nouveau' : 'etabli';
      segData[seg].sigs.push(s);
      const sent = classifySentiment(s);
      if (sent === 'positif') segData[seg].pos++;
      else if (sent === 'negatif') segData[seg].neg++;
      else if (sent === 'interesse') segData[seg].int++;
      else segData[seg].neu++;
    }
    const rows = ['nouveau', 'etabli'].map(segment => {
      const d = segData[segment];
      const total = d.sigs.length || 1;
      const negTitles = new Map();
      const posTitles = new Map();
      for (const s of d.sigs) {
        if (!s.title) continue;
        const sent = classifySentiment(s);
        if (sent === 'negatif') negTitles.set(s.title, (negTitles.get(s.title) ?? 0) + 1);
        if (sent === 'positif') posTitles.set(s.title, (posTitles.get(s.title) ?? 0) + 1);
      }
      return {
        company_id: companyId, segment,
        nb_cr: d.sigs.length,
        pct_positif: Math.round((d.pos / total) * 100),
        pct_negatif: Math.round((d.neg / total) * 100),
        pct_neutre: Math.round((d.neu / total) * 100),
        pct_interesse: Math.round((d.int / total) * 100),
        top_insatisfactions: topN(negTitles, 3),
        top_points_positifs: topN(posTitles, 3),
      };
    });
    await supabase.from('segment_sentiments').delete().eq('company_id', companyId);
    if (rows.length) await supabase.from('segment_sentiments').insert(rows);
    console.log(`  segment_sentiments: ${rows.length} rows`);
    updated.push('segment_sentiments');
  }

  /* 9. segment_insights */
  {
    const { data: segRows = [] } = await supabase.from('segment_sentiments').select('*').eq('company_id', companyId);
    const nouveau = segRows.find(s => s.segment === 'nouveau');
    const etabli  = segRows.find(s => s.segment === 'etabli');
    const insights = [];

    if (nouveau && etabli) {
      if (nouveau.pct_positif < etabli.pct_positif) {
        insights.push({ company_id: companyId, segment: 'nouveau', insight: `Les nouveaux clients expriment moins de satisfaction (${nouveau.pct_positif}% positif) que les etablis (${etabli.pct_positif}%). Renforcer l'onboarding et le suivi des 3 premiers mois.`, priorite: 2 });
      } else {
        insights.push({ company_id: companyId, segment: 'nouveau', insight: `Fort taux d'interet chez les nouveaux clients (${nouveau.pct_interesse}% interesse). Phase d'ouverture ideale pour presenter l'offre complete.`, priorite: 2 });
      }
      if (etabli.pct_negatif > 25) {
        insights.push({ company_id: companyId, segment: 'etabli', insight: `${etabli.pct_negatif}% de sentiment negatif chez les clients etablis. Risque de churn eleve — visites de fidelisation et revues de compte prioritaires.`, priorite: 3 });
      } else {
        insights.push({ company_id: companyId, segment: 'etabli', insight: `Base clients etablis saine (${etabli.pct_positif}% positif). Opportunite d'upsell et de cross-sell a exploiter avec le KAM.`, priorite: 2 });
      }
    }

    const typeCounts = new Map();
    for (const s of enriched) {
      if (s.type) typeCounts.set(s.type, (typeCounts.get(s.type) ?? 0) + 1);
    }
    const topType = topN(typeCounts, 1)[0];
    if (topType) {
      const count = typeCounts.get(topType);
      const labels = { besoin: 'besoins clients', concurrence: 'menaces concurrentielles', opportunite: 'opportunites commerciales', satisfaction: 'signaux satisfaction', prix: 'enjeux prix' };
      insights.push({ company_id: companyId, segment: 'general', insight: `Signal dominant dans les CR : ${labels[topType] ?? topType} (${count} occurrence${count > 1 ? 's' : ''}). Orienter les prochaines visites sur ce point.`, priorite: 1 });
    }

    await supabase.from('segment_insights').delete().eq('company_id', companyId);
    if (insights.length) await supabase.from('segment_insights').insert(insights);
    console.log(`  segment_insights: ${insights.length} rows`);
    updated.push('segment_insights');
  }

  /* 10. geo_sector_data */
  {
    const matrixMap = new Map();
    for (const s of enriched) {
      const clientName = s.client_name?.trim();
      const acctInfo = clientName ? acctMap.get(clientName) : null;
      const secteur = acctInfo?.sector ?? 'Autre';
      const region = s.region || acctInfo?.region || '';
      if (!region) continue;
      const key = `${secteur}|||${region}`;
      if (!matrixMap.has(key)) matrixMap.set(key, { signaux_concurrence: 0, signaux_besoins: 0, signaux_opportunites: 0, total: 0 });
      const cell = matrixMap.get(key);
      if (s.type === 'concurrence') cell.signaux_concurrence++;
      if (s.type === 'besoin') cell.signaux_besoins++;
      if (s.type === 'opportunite') cell.signaux_opportunites++;
      cell.total++;
    }
    const maxTotal = Math.max(...Array.from(matrixMap.values()).map(v => v.total), 1);
    const rows = Array.from(matrixMap.entries()).map(([key, v]) => {
      const [secteur, region] = key.split('|||');
      return { company_id: companyId, secteur, region, signaux_concurrence: v.signaux_concurrence, signaux_besoins: v.signaux_besoins, signaux_opportunites: v.signaux_opportunites, score_intensite: Math.round((v.total / maxTotal) * 100) };
    });
    await supabase.from('geo_sector_data').delete().eq('company_id', companyId);
    if (rows.length) await supabase.from('geo_sector_data').insert(rows);
    console.log(`  geo_sector_data: ${rows.length} rows`);
    updated.push('geo_sector_data');
  }

  /* 11. positionnement */
  {
    const ATTRIBUTS = ['prix', 'qualite', 'sav', 'delai', 'relation', 'innovation'];
    const rows = [];
    const competitorNames = new Set(enriched.filter(s => s.competitor_name).map(s => s.competitor_name));

    for (const acteur of competitorNames) {
      const acteurSigs = enriched.filter(s => s.competitor_name === acteur);
      const prixMentions = prixSignals.filter(p => p.concurrent_nom === acteur);
      const totalSigs = acteurSigs.length;
      const rougeSigs = acteurSigs.filter(s => s.severity === 'rouge').length;

      for (const attribut of ATTRIBUTS) {
        let valeur, count;
        if (attribut === 'prix') {
          count = prixMentions.length;
          valeur = count > 0 ? 'fort' : totalSigs > 2 ? 'moyen' : 'faible';
        } else if (attribut === 'relation') {
          count = totalSigs;
          const rougeRatio = totalSigs > 0 ? rougeSigs / totalSigs : 0;
          valeur = rougeRatio > 0.4 ? 'fort' : totalSigs > 2 ? 'moyen' : 'faible';
        } else {
          count = totalSigs;
          valeur = totalSigs > 3 ? 'fort' : totalSigs > 1 ? 'moyen' : 'faible';
        }
        rows.push({ company_id: companyId, acteur, attribut, valeur, count });
      }
    }

    const dealsPerdusPrix = dealsCommerciaux.filter(d => d.motif === 'prix_non_competitif' && d.resultat === 'perdu').length;
    const totalDeals = dealsCommerciaux.length;
    const objAtteints = crObjectifs.filter(o => o.resultat === 'atteint').length;
    const totalObj = crObjectifs.length;
    const positifSatisfaction = enriched.filter(s => s.type === 'satisfaction' && s.severity === 'vert').length;

    for (const attribut of ATTRIBUTS) {
      let valeur, count;
      if (attribut === 'prix') {
        const ratio = totalDeals > 0 ? dealsPerdusPrix / totalDeals : 0;
        valeur = ratio > 0.3 ? 'faible' : ratio > 0.1 ? 'moyen' : 'fort';
        count = dealsPerdusPrix;
      } else if (attribut === 'relation') {
        const ratio = totalObj > 0 ? objAtteints / totalObj : 0.5;
        valeur = ratio > 0.6 ? 'fort' : ratio > 0.3 ? 'moyen' : 'faible';
        count = objAtteints;
      } else if (attribut === 'qualite') {
        valeur = positifSatisfaction > 5 ? 'fort' : 'moyen';
        count = positifSatisfaction;
      } else {
        valeur = 'moyen';
        count = 0;
      }
      rows.push({ company_id: companyId, acteur: 'Notre offre', attribut, valeur, count });
    }

    await supabase.from('positionnement').delete().eq('company_id', companyId);
    if (rows.length) await supabase.from('positionnement').insert(rows);
    console.log(`  positionnement: ${rows.length} rows`);
    updated.push('positionnement');
  }

  /* 12. recommandations_ia */
  {
    const rows = [];

    // Rule 1: top 3 regions with opportunities
    const regionOpp = new Map();
    for (const s of enriched) {
      if (s.type === 'opportunite') {
        const r = s.region || 'Non renseigne';
        regionOpp.set(r, (regionOpp.get(r) ?? 0) + 1);
      }
    }
    for (const [region, count] of Array.from(regionOpp.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3)) {
      const comm = commercials.find(c => c.region === region);
      rows.push({ company_id: companyId, type: 'opportunite', territoire: region, commercial_suggere: comm?.name ?? null, priorite: Math.min(5, count), action_recommandee: `${count} opportunite${count > 1 ? 's' : ''} detectee${count > 1 ? 's' : ''} en ${region}. Planifier des visites de suivi pour transformer.`, statut: 'nouvelle' });
    }

    // Rule 2: top 2 regions with rouge signals
    const regionRouge = new Map();
    for (const s of enriched) {
      if (s.severity === 'rouge') {
        const r = s.region || 'Non renseigne';
        regionRouge.set(r, (regionRouge.get(r) ?? 0) + 1);
      }
    }
    for (const [region, count] of Array.from(regionRouge.entries()).sort((a, b) => b[1] - a[1]).slice(0, 2)) {
      const comm = commercials.find(c => c.region === region);
      rows.push({ company_id: companyId, type: 'risque', territoire: region, commercial_suggere: comm?.name ?? null, priorite: Math.min(5, count + 2), action_recommandee: `${count} signal${count > 1 ? 's' : ''} critique${count > 1 ? 's' : ''} (rouge) en ${region}. Intervention urgente recommandee.`, statut: 'nouvelle' });
    }

    // Rule 3: top 2 competitors
    const concThreat = new Map();
    for (const s of enriched) {
      if (s.type === 'concurrence' && s.competitor_name) {
        const prev = concThreat.get(s.competitor_name);
        concThreat.set(s.competitor_name, { count: (prev?.count ?? 0) + 1, region: s.severity === 'rouge' ? (s.region || prev?.region || '') : (prev?.region || s.region || '') });
      }
    }
    for (const [name, info] of Array.from(concThreat.entries()).sort((a, b) => b[1].count - a[1].count).slice(0, 2)) {
      rows.push({ company_id: companyId, type: 'territoire', territoire: info.region || null, commercial_suggere: null, priorite: Math.min(5, info.count), action_recommandee: `Pression concurrentielle de ${name} (${info.count} mention${info.count > 1 ? 's' : ''}). Preparer une argumentation differenciante et une contre-offre.`, statut: 'nouvelle' });
    }

    // Rule 4: low quality score commercials
    const lowQuality = commercials.filter(c => (c.quality_score ?? 50) < 50).slice(0, 2);
    for (const comm of lowQuality) {
      rows.push({ company_id: companyId, type: 'coaching', territoire: comm.region || null, commercial_suggere: comm.name, priorite: 3, action_recommandee: `Score qualite CR bas pour ${comm.name}. Accompagnement recommande sur la qualite des remontees terrain.`, statut: 'nouvelle' });
    }

    await supabase.from('recommandations_ia').delete().eq('company_id', companyId);
    if (rows.length) await supabase.from('recommandations_ia').insert(rows);
    console.log(`  recommandations_ia: ${rows.length} rows`);
    updated.push('recommandations_ia');
  }

  console.log(`\n✅ Done! Tables updated: ${updated.join(', ')}`);
  return { success: true, tables: updated };
}

recomputeAnalytics(COMPANY_ID)
  .then(r => { console.log('\nResult:', r); process.exit(0); })
  .catch(e => { console.error('\nError:', e); process.exit(1); });
