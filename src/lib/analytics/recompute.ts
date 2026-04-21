// @ts-nocheck
/**
 * recomputeAnalytics — Calcule et upsert toutes les tables d'analytics
 * à partir des données brutes (signals, accounts, deals, cr_objectifs, etc.)
 *
 * Appelé automatiquement après chaque traitement de CR (process route)
 * et disponible manuellement via /api/analytics/recompute.
 */
import { createServiceClient } from '@/lib/supabase/server';

/* ─────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────── */

/** Numéro de semaine ISO "YYYY-SWW" */
function isoWeek(date: string | Date): string {
  const d = new Date(typeof date === 'string' ? date : date.toISOString());
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const wn =
    1 +
    Math.round(
      ((d.getTime() - week1.getTime()) / 86_400_000 -
        3 +
        ((week1.getDay() + 6) % 7)) /
        7,
    );
  return `${d.getFullYear()}-S${String(wn).padStart(2, '0')}`;
}

/** Classification du sentiment à partir d'un signal */
function classifySentiment(sig: any): 'positif' | 'negatif' | 'neutre' | 'interesse' {
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

/** top N entries d'une Map<string, number> */
function topN(map: Map<string, number>, n: number): string[] {
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([k]) => k);
}

/* ─────────────────────────────────────────────────────────
   Main function
───────────────────────────────────────────────────────── */

export async function recomputeAnalytics(
  companyId: string,
): Promise<{ success: boolean; tables?: string[]; error?: string }> {
  const supabase = createServiceClient();

  /* 1 ─ Fetch raw data ─────────────────────────────────── */
  const [
    { data: signals = [] },
    { data: accounts = [] },
    { data: commercials = [] },
    { data: dealsCommerciaux = [] },
    { data: prixSignals = [] },
    { data: crObjectifs = [] },
    { data: rawReports = [] },
  ] = await Promise.all([
    supabase.from('signals').select('*').eq('company_id', companyId),
    supabase.from('accounts').select('id, name, sector, region').eq('company_id', companyId),
    supabase.from('commercials').select('id, name, region, quality_score').eq('company_id', companyId),
    supabase.from('deals_commerciaux').select('*').eq('company_id', companyId),
    supabase.from('prix_signals').select('*').eq('company_id', companyId),
    supabase.from('cr_objectifs').select('*').eq('company_id', companyId),
    supabase
      .from('raw_visit_reports')
      .select('id, client_name, commercial_name')
      .eq('company_id', companyId),
  ]);

  /* Enrich signals with client_name / commercial_name from source report */
  const reportMap = new Map<string, { client_name: string | null; commercial_name: string | null }>(
    (rawReports as any[]).map((r) => [
      r.id,
      { client_name: r.client_name ?? null, commercial_name: r.commercial_name ?? null },
    ]),
  );

  const enriched = (signals as any[]).map((s) => {
    const rpt = s.source_report_id ? reportMap.get(s.source_report_id) : null;
    return {
      ...s,
      client_name: rpt?.client_name ?? null,
      commercial_name: rpt?.commercial_name ?? null,
    };
  });

  /* Account name → sector/region */
  const acctMap = new Map<string, { sector: string; region: string }>(
    (accounts as any[])
      .filter((a) => a.name)
      .map((a) => [a.name.trim(), { sector: a.sector ?? 'Autre', region: a.region ?? '' }]),
  );

  /* Count reports per client (for segment classification) */
  const clientReportCount = new Map<string, number>();
  for (const r of rawReports as any[]) {
    if (r.client_name?.trim())
      clientReportCount.set(
        r.client_name.trim(),
        (clientReportCount.get(r.client_name.trim()) ?? 0) + 1,
      );
  }

  const updated: string[] = [];

  /* ─────────────────────────────────────────────────────
     2. sentiment_periodes  (grouped by ISO week)
  ───────────────────────────────────────────────────── */
  {
    type Counts = { positif: number; negatif: number; neutre: number; interesse: number; total: number };
    const map = new Map<string, Counts>();
    for (const s of enriched) {
      if (!s.created_at) continue;
      const wk = isoWeek(s.created_at);
      if (!map.has(wk)) map.set(wk, { positif: 0, negatif: 0, neutre: 0, interesse: 0, total: 0 });
      const row = map.get(wk)!;
      row[classifySentiment(s)]++;
      row.total++;
    }
    const rows = Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([periode, c]) => ({ company_id: companyId, periode, ...c }));

    await supabase.from('sentiment_periodes').delete().eq('company_id', companyId);
    if (rows.length) await supabase.from('sentiment_periodes').insert(rows);
    updated.push('sentiment_periodes');
  }

  /* ─────────────────────────────────────────────────────
     3. sentiment_regions  (grouped by region)
  ───────────────────────────────────────────────────── */
  {
    type Counts = { positif: number; negatif: number; neutre: number; interesse: number; total: number };
    const map = new Map<string, Counts>();
    for (const s of enriched) {
      const region = s.region || 'Non renseigne';
      if (!map.has(region)) map.set(region, { positif: 0, negatif: 0, neutre: 0, interesse: 0, total: 0 });
      const row = map.get(region)!;
      row[classifySentiment(s)]++;
      row.total++;
    }
    const rows = Array.from(map.entries()).map(([region, c]) => ({
      company_id: companyId,
      region,
      ...c,
    }));

    await supabase.from('sentiment_regions').delete().eq('company_id', companyId);
    if (rows.length) await supabase.from('sentiment_regions').insert(rows);
    updated.push('sentiment_regions');
  }

  /* ─────────────────────────────────────────────────────
     4. motifs_sentiment  (signal titles by sentiment)
  ───────────────────────────────────────────────────── */
  {
    const pos = new Map<string, number>();
    const neg = new Map<string, number>();
    for (const s of enriched) {
      if (!s.title) continue;
      const sent = classifySentiment(s);
      if (sent === 'positif') pos.set(s.title, (pos.get(s.title) ?? 0) + 1);
      if (sent === 'negatif') neg.set(s.title, (neg.get(s.title) ?? 0) + 1);
    }
    const rows = [
      ...Array.from(pos.entries()).map(([motif, mentions]) => ({
        company_id: companyId,
        motif,
        type: 'positif',
        mentions,
      })),
      ...Array.from(neg.entries()).map(([motif, mentions]) => ({
        company_id: companyId,
        motif,
        type: 'negatif',
        mentions,
      })),
    ];

    await supabase.from('motifs_sentiment').delete().eq('company_id', companyId);
    if (rows.length) await supabase.from('motifs_sentiment').insert(rows);
    updated.push('motifs_sentiment');
  }

  /* ─────────────────────────────────────────────────────
     5. geo_points  (counts by region)
  ───────────────────────────────────────────────────── */
  {
    const map = new Map<
      string,
      { opportunites: number; risques: number; concurrence: number; besoins: number; total: number }
    >();
    for (const s of enriched) {
      const region = s.region || 'Non renseigne';
      if (!map.has(region))
        map.set(region, { opportunites: 0, risques: 0, concurrence: 0, besoins: 0, total: 0 });
      const r = map.get(region)!;
      if (s.type === 'opportunite') r.opportunites++;
      if (s.severity === 'rouge' || s.severity === 'orange') r.risques++;
      if (s.type === 'concurrence') r.concurrence++;
      if (s.type === 'besoin') r.besoins++;
      r.total++;
    }
    const maxTotal = Math.max(...Array.from(map.values()).map((v) => v.total), 1);
    const rows = Array.from(map.entries()).map(([region, v]) => ({
      company_id: companyId,
      region,
      opportunites: v.opportunites,
      risques: v.risques,
      concurrence: v.concurrence,
      besoins: v.besoins,
      intensite: Math.round((v.total / maxTotal) * 100),
    }));

    await supabase.from('geo_points').delete().eq('company_id', companyId);
    if (rows.length) await supabase.from('geo_points').insert(rows);
    updated.push('geo_points');
  }

  /* ─────────────────────────────────────────────────────
     6. region_profiles  (detailed by region)
  ───────────────────────────────────────────────────── */
  {
    const map = new Map<
      string,
      {
        sigs: any[];
        concMentions: Map<string, number>;
        besoins: Map<string, number>;
        sents: Record<string, number>;
      }
    >();
    for (const s of enriched) {
      const region = s.region || 'Non renseigne';
      if (!map.has(region))
        map.set(region, {
          sigs: [],
          concMentions: new Map(),
          besoins: new Map(),
          sents: { positif: 0, negatif: 0, neutre: 0, interesse: 0 },
        });
      const rd = map.get(region)!;
      rd.sigs.push(s);
      if (s.competitor_name)
        rd.concMentions.set(s.competitor_name, (rd.concMentions.get(s.competitor_name) ?? 0) + 1);
      if (s.type === 'besoin' && s.title)
        rd.besoins.set(s.title, (rd.besoins.get(s.title) ?? 0) + 1);
      rd.sents[classifySentiment(s)]++;
    }

    const rows = Array.from(map.entries()).map(([region, rd]) => {
      const topConc = Array.from(rd.concMentions.entries()).sort((a, b) => b[1] - a[1]);
      const topBesoins = topN(rd.besoins, 3);
      const dominant = (
        ['positif', 'negatif', 'neutre', 'interesse'] as const
      ).sort((a, b) => rd.sents[b] - rd.sents[a])[0];
      const rougeCount = rd.sigs.filter((s) => s.severity === 'rouge').length;

      return {
        company_id: companyId,
        region,
        nb_signaux: rd.sigs.length,
        sentiment_dominant: dominant,
        concurrent_mentions: [...rd.concMentions.values()].reduce((a, b) => a + b, 0),
        concurrent_principal: topConc[0]?.[0] ?? null,
        top_besoins: topBesoins,
        specificite_locale:
          rougeCount > 0
            ? `${rougeCount} signal${rougeCount > 1 ? 's' : ''} critique${rougeCount > 1 ? 's' : ''} detecte${rougeCount > 1 ? 's' : ''}`
            : topBesoins.length > 0
              ? `Besoin principal : ${topBesoins[0]}`
              : 'Region en cours de couverture',
      };
    });

    await supabase.from('region_profiles').delete().eq('company_id', companyId);
    if (rows.length) await supabase.from('region_profiles').insert(rows);
    updated.push('region_profiles');
  }

  /* ─────────────────────────────────────────────────────
     7. territoires  (synthesis by region)
  ───────────────────────────────────────────────────── */
  {
    const map = new Map<
      string,
      {
        sigs: any[];
        comms: Set<string>;
        reportIds: Set<string>;
        sents: Record<string, number>;
        opps: string[];
        risks: string[];
        concCount: number;
      }
    >();

    for (const s of enriched) {
      const region = s.region || 'Non renseigne';
      if (!map.has(region))
        map.set(region, {
          sigs: [],
          comms: new Set(),
          reportIds: new Set(),
          sents: { positif: 0, negatif: 0, neutre: 0, interesse: 0 },
          opps: [],
          risks: [],
          concCount: 0,
        });
      const rd = map.get(region)!;
      rd.sigs.push(s);
      if (s.commercial_name) rd.comms.add(s.commercial_name);
      if (s.source_report_id) rd.reportIds.add(s.source_report_id);
      rd.sents[classifySentiment(s)]++;
      if (s.type === 'opportunite' && s.title && rd.opps.length < 4) rd.opps.push(s.title);
      if (s.severity === 'rouge' && s.title && rd.risks.length < 4) rd.risks.push(s.title);
      if (s.competitor_name) rd.concCount++;
    }

    const rows = Array.from(map.entries()).map(([region, rd]) => {
      const dominant = (
        ['positif', 'negatif', 'neutre', 'interesse'] as const
      ).sort((a, b) => rd.sents[b] - rd.sents[a])[0];
      const nbOpp = rd.sigs.filter((s) => s.type === 'opportunite').length;
      const nbRouge = rd.sigs.filter((s) => s.severity === 'rouge').length;
      return {
        company_id: companyId,
        territoire: region,
        commercial_names: Array.from(rd.comms),
        nb_cr: rd.reportIds.size,
        sentiment_dominant: dominant,
        nb_mentions_concurrents: rd.concCount,
        nb_opportunites: nbOpp,
        nb_risques_perte: nbRouge,
        tendance_vs_mois_precedent: 'stable' as const,
        score_priorite: Math.min(100, nbOpp * 10 + nbRouge * 20),
        motifs_opportunite: [...new Set(rd.opps)].slice(0, 3),
        motifs_risque: [...new Set(rd.risks)].slice(0, 3),
      };
    });

    await supabase.from('territoires').delete().eq('company_id', companyId);
    if (rows.length) await supabase.from('territoires').insert(rows);
    updated.push('territoires');
  }

  /* ─────────────────────────────────────────────────────
     8. segment_sentiments  (nouveau vs etabli)
  ───────────────────────────────────────────────────── */
  {
    const segData = {
      nouveau: { sigs: [] as any[], pos: 0, neg: 0, neu: 0, int: 0 },
      etabli: { sigs: [] as any[], pos: 0, neg: 0, neu: 0, int: 0 },
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

    const rows = (['nouveau', 'etabli'] as const).map((segment) => {
      const d = segData[segment];
      const total = d.sigs.length || 1;

      const negTitles = new Map<string, number>();
      const posTitles = new Map<string, number>();
      for (const s of d.sigs) {
        if (!s.title) continue;
        const sent = classifySentiment(s);
        if (sent === 'negatif') negTitles.set(s.title, (negTitles.get(s.title) ?? 0) + 1);
        if (sent === 'positif') posTitles.set(s.title, (posTitles.get(s.title) ?? 0) + 1);
      }

      return {
        company_id: companyId,
        segment,
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
    updated.push('segment_sentiments');
  }

  /* ─────────────────────────────────────────────────────
     9. segment_insights  (rule-based text insights)
  ───────────────────────────────────────────────────── */
  {
    const { data: segRows = [] } = await supabase
      .from('segment_sentiments')
      .select('*')
      .eq('company_id', companyId);

    const nouveau = (segRows as any[]).find((s) => s.segment === 'nouveau');
    const etabli = (segRows as any[]).find((s) => s.segment === 'etabli');

    const insights: any[] = [];

    if (nouveau && etabli) {
      // Insight on satisfaction gap
      if (nouveau.pct_positif < etabli.pct_positif) {
        insights.push({
          company_id: companyId,
          segment: 'nouveau',
          insight: `Les nouveaux clients expriment moins de satisfaction (${nouveau.pct_positif}% positif) que les etablis (${etabli.pct_positif}%). Renforcer l'onboarding et le suivi des 3 premiers mois.`,
          priorite: 2,
        });
      } else {
        insights.push({
          company_id: companyId,
          segment: 'nouveau',
          insight: `Fort taux d'interet chez les nouveaux clients (${nouveau.pct_interesse}% interesse). Phase d'ouverture ideale pour presenter l'offre complete.`,
          priorite: 2,
        });
      }

      if (etabli.pct_negatif > 25) {
        insights.push({
          company_id: companyId,
          segment: 'etabli',
          insight: `${etabli.pct_negatif}% de sentiment negatif chez les clients etablis. Risque de churn eleve — visites de fidelisation et revues de compte prioritaires.`,
          priorite: 3,
        });
      } else {
        insights.push({
          company_id: companyId,
          segment: 'etabli',
          insight: `Base clients etablis saine (${etabli.pct_positif}% positif). Opportunite d'upsell et de cross-sell a exploiter avec le KAM.`,
          priorite: 2,
        });
      }
    }

    // Insight sur le type de signal dominant
    const typeCounts = new Map<string, number>();
    for (const s of enriched) {
      if (s.type) typeCounts.set(s.type, (typeCounts.get(s.type) ?? 0) + 1);
    }
    const topType = topN(typeCounts, 1)[0];
    if (topType) {
      const count = typeCounts.get(topType)!;
      const labels: Record<string, string> = {
        besoin: 'besoins clients',
        concurrence: 'menaces concurrentielles',
        opportunite: 'opportunites commerciales',
        satisfaction: 'signaux satisfaction',
        prix: 'enjeux prix',
      };
      insights.push({
        company_id: companyId,
        segment: null,
        insight: `Signal dominant dans les CR : ${labels[topType] ?? topType} (${count} occurrence${count > 1 ? 's' : ''}). Orienter les prochaines visites sur ce point.`,
        priorite: 1,
      });
    }

    await supabase.from('segment_insights').delete().eq('company_id', companyId);
    if (insights.length) await supabase.from('segment_insights').insert(insights);
    updated.push('segment_insights');
  }

  /* ─────────────────────────────────────────────────────
     10. geo_sector_data  (sector × region matrix)
  ───────────────────────────────────────────────────── */
  {
    const matrixMap = new Map<
      string,
      { signaux_concurrence: number; signaux_besoins: number; signaux_opportunites: number; total: number }
    >();

    for (const s of enriched) {
      const clientName = s.client_name?.trim();
      const acctInfo = clientName ? acctMap.get(clientName) : null;
      const secteur = acctInfo?.sector ?? 'Autre';
      const region = s.region || acctInfo?.region || '';
      if (!region) continue;

      const key = `${secteur}|||${region}`;
      if (!matrixMap.has(key))
        matrixMap.set(key, { signaux_concurrence: 0, signaux_besoins: 0, signaux_opportunites: 0, total: 0 });
      const cell = matrixMap.get(key)!;
      if (s.type === 'concurrence') cell.signaux_concurrence++;
      if (s.type === 'besoin') cell.signaux_besoins++;
      if (s.type === 'opportunite') cell.signaux_opportunites++;
      cell.total++;
    }

    const maxTotal = Math.max(...Array.from(matrixMap.values()).map((v) => v.total), 1);
    const rows = Array.from(matrixMap.entries()).map(([key, v]) => {
      const [secteur, region] = key.split('|||');
      return {
        company_id: companyId,
        secteur,
        region,
        signaux_concurrence: v.signaux_concurrence,
        signaux_besoins: v.signaux_besoins,
        signaux_opportunites: v.signaux_opportunites,
        score_intensite: Math.round((v.total / maxTotal) * 100),
      };
    });

    await supabase.from('geo_sector_data').delete().eq('company_id', companyId);
    if (rows.length) await supabase.from('geo_sector_data').insert(rows);
    updated.push('geo_sector_data');
  }

  /* ─────────────────────────────────────────────────────
     11. positionnement  (competitor positioning heuristic)
  ───────────────────────────────────────────────────── */
  {
    const ATTRIBUTS = ['prix', 'qualite', 'sav', 'delai', 'relation', 'innovation'] as const;
    const rows: any[] = [];

    // Distinct competitor acteurs
    const competitorNames = new Set<string>(
      enriched.filter((s) => s.competitor_name).map((s) => s.competitor_name as string),
    );

    for (const acteur of competitorNames) {
      const acteurSigs = enriched.filter((s) => s.competitor_name === acteur);
      const prixMentions = (prixSignals as any[]).filter((p) => p.concurrent_nom === acteur);
      const totalSigs = acteurSigs.length;
      const rougeSigs = acteurSigs.filter((s) => s.severity === 'rouge').length;

      for (const attribut of ATTRIBUTS) {
        let valeur: 'fort' | 'moyen' | 'faible';
        let count: number;

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

    // "Notre offre" entry
    const dealsPerdusPrix = (dealsCommerciaux as any[]).filter(
      (d) => d.motif === 'prix_non_competitif' && d.resultat === 'perdu',
    ).length;
    const totalDeals = (dealsCommerciaux as any[]).length;
    const objAtteints = (crObjectifs as any[]).filter((o) => o.resultat === 'atteint').length;
    const totalObj = (crObjectifs as any[]).length;
    const positifSatisfaction = enriched.filter(
      (s) => s.type === 'satisfaction' && s.severity === 'vert',
    ).length;

    for (const attribut of ATTRIBUTS) {
      let valeur: 'fort' | 'moyen' | 'faible';
      let count: number;

      if (attribut === 'prix') {
        const ratio = totalDeals > 0 ? dealsPerdusPrix / totalDeals : 0;
        valeur = ratio > 0.3 ? 'faible' : ratio > 0.1 ? 'moyen' : 'fort';
        count = dealsPerdusPrix;
      } else if (attribut === 'relation') {
        const ratio = totalObj > 0 ? objAtteints / totalObj : 0.5;
        valeur = ratio > 0.6 ? 'fort' : ratio > 0.3 ? 'moyen' : 'faible';
        count = objAtteints;
      } else if (attribut === 'qualite') {
        valeur = positifSatisfaction > 5 ? 'fort' : positifSatisfaction > 0 ? 'moyen' : 'moyen';
        count = positifSatisfaction;
      } else {
        valeur = 'moyen';
        count = 0;
      }

      rows.push({ company_id: companyId, acteur: 'Notre offre', attribut, valeur, count });
    }

    await supabase.from('positionnement').delete().eq('company_id', companyId);
    if (rows.length) await supabase.from('positionnement').insert(rows);
    updated.push('positionnement');
  }

  /* ─────────────────────────────────────────────────────
     12. recommandations_ia  (rule-based recommendations)
  ───────────────────────────────────────────────────── */
  {
    const rows: any[] = [];

    // Rule 1: top 3 regions avec opportunites → type 'opportunite'
    const regionOpp = new Map<string, number>();
    for (const s of enriched) {
      if (s.type === 'opportunite') {
        const r = s.region || 'Non renseigne';
        regionOpp.set(r, (regionOpp.get(r) ?? 0) + 1);
      }
    }
    for (const [region, count] of Array.from(regionOpp.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)) {
      const comm = (commercials as any[]).find((c) => c.region === region);
      rows.push({
        company_id: companyId,
        type: 'opportunite',
        territoire: region,
        commercial_suggere: comm?.name ?? null,
        priorite: Math.min(5, count),
        action_recommandee: `${count} opportunite${count > 1 ? 's' : ''} detectee${count > 1 ? 's' : ''} en ${region}. Planifier des visites de suivi pour transformer.`,
        statut: 'nouvelle',
      });
    }

    // Rule 2: top 2 regions avec signaux rouge → type 'risque'
    const regionRouge = new Map<string, number>();
    for (const s of enriched) {
      if (s.severity === 'rouge') {
        const r = s.region || 'Non renseigne';
        regionRouge.set(r, (regionRouge.get(r) ?? 0) + 1);
      }
    }
    for (const [region, count] of Array.from(regionRouge.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)) {
      const comm = (commercials as any[]).find((c) => c.region === region);
      rows.push({
        company_id: companyId,
        type: 'risque',
        territoire: region,
        commercial_suggere: comm?.name ?? null,
        priorite: Math.min(5, count + 2),
        action_recommandee: `${count} signal${count > 1 ? 's' : ''} critique${count > 1 ? 's' : ''} (rouge) en ${region}. Intervention urgente recommandee.`,
        statut: 'nouvelle',
      });
    }

    // Rule 3: top 2 concurrents les plus menaçants → type 'territoire'
    const concThreat = new Map<string, { count: number; region: string }>();
    for (const s of enriched) {
      if (s.type === 'concurrence' && s.competitor_name) {
        const prev = concThreat.get(s.competitor_name);
        concThreat.set(s.competitor_name, {
          count: (prev?.count ?? 0) + 1,
          region: s.severity === 'rouge' ? (s.region || prev?.region || '') : (prev?.region || s.region || ''),
        });
      }
    }
    for (const [name, info] of Array.from(concThreat.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 2)) {
      rows.push({
        company_id: companyId,
        type: 'territoire',
        territoire: info.region || null,
        commercial_suggere: null,
        priorite: Math.min(5, info.count),
        action_recommandee: `Pression concurrentielle de ${name} (${info.count} mention${info.count > 1 ? 's' : ''}). Preparer une argumentation differenciante et une contre-offre.`,
        statut: 'nouvelle',
      });
    }

    // Rule 4: commerciaux avec faible quality_score → type 'coaching'
    const lowQuality = (commercials as any[])
      .filter((c) => (c.quality_score ?? 50) < 50)
      .slice(0, 2);
    for (const comm of lowQuality) {
      rows.push({
        company_id: companyId,
        type: 'coaching',
        territoire: comm.region || null,
        commercial_suggere: comm.name,
        priorite: 3,
        action_recommandee: `Score qualite CR bas pour ${comm.name}. Accompagnement recommande sur la qualite des remontees terrain.`,
        statut: 'nouvelle',
      });
    }

    await supabase.from('recommandations_ia').delete().eq('company_id', companyId);
    if (rows.length) await supabase.from('recommandations_ia').insert(rows);
    updated.push('recommandations_ia');
  }

  return { success: true, tables: updated };
}
