// @ts-nocheck
'use client';

import { useMemo } from 'react';
import { useAppData } from '@/lib/data';
import type { RegionProfile, SentimentType } from '@/lib/types-v2';
import { cn } from '@/lib/utils';
import { KpiCard } from '@/components/shared/kpi-card';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  MapPin, Swords, Lightbulb, AlertTriangle, Globe, Users,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const SENTIMENT_CONFIG: Record<SentimentType, { label: string; bg: string; text: string; border: string }> = {
  positif:   { label: 'Positif',   bg: 'bg-emerald-50',  text: 'text-emerald-700', border: 'border-emerald-400' },
  negatif:   { label: 'Negatif',   bg: 'bg-rose-50',     text: 'text-rose-700',    border: 'border-rose-400' },
  neutre:    { label: 'Neutre',    bg: 'bg-slate-50',    text: 'text-slate-500',   border: 'border-slate-300' },
  interesse: { label: 'Interesse', bg: 'bg-sky-50',      text: 'text-sky-700',     border: 'border-sky-400' },
};

function sentimentBorderClass(s: SentimentType): string {
  if (s === 'positif') return 'border-l-emerald-500';
  if (s === 'negatif') return 'border-l-rose-500';
  return 'border-l-slate-300';
}

const INTENSITY_COLORS = {
  high:   { bg: 'bg-rose-100',    text: 'text-rose-800',    border: 'border-rose-200' },
  medium: { bg: 'bg-amber-100',   text: 'text-amber-800',   border: 'border-amber-200' },
  low:    { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200' },
};

function getIntensityLevel(score: number) {
  if (score > 70) return 'high';
  if (score > 40) return 'medium';
  return 'low';
}

const BAR_PALETTE = ['#6366f1', '#10b981', '#f59e0b', '#e11d48', '#8b5cf6', '#0ea5e9', '#64748b'];

/* ------------------------------------------------------------------ */
/*  Compute top 3 national besoins (frequency across regions)          */
/* ------------------------------------------------------------------ */

function computeTopBesoins(profiles: RegionProfile[]) {
  const freq: Record<string, number> = {};
  profiles.forEach((p) => {
    p.top_besoins.forEach((b) => {
      freq[b] = (freq[b] || 0) + 1;
    });
  });
  const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
  return sorted.slice(0, 3).map(([besoin]) => besoin);
}

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

export default function MktGeoPage() {
  const { regionProfiles: REGION_PROFILES, geoSectorData: GEO_SECTOR_DATA } = useAppData();
  /* --- KPIs -------------------------------------------------------- */
  const regionCount = REGION_PROFILES.length;

  const mostActive = useMemo(
    () => REGION_PROFILES.length > 0 ? [...REGION_PROFILES].sort((a, b) => b.nb_signaux - a.nb_signaux)[0] : null,
    [REGION_PROFILES],
  );

  const mostTense = useMemo(() => {
    if (REGION_PROFILES.length === 0) return null;
    const negatives = REGION_PROFILES.filter((r) => r.sentiment_dominant === 'negatif');
    if (negatives.length === 0) return REGION_PROFILES[0];
    return negatives.sort((a, b) => b.concurrent_mentions - a.concurrent_mentions)[0];
  }, [REGION_PROFILES]);

  /* --- Region cards sorted by nb_signaux desc ---------------------- */
  const sortedProfiles = useMemo(
    () => [...REGION_PROFILES].sort((a, b) => b.nb_signaux - a.nb_signaux),
    [REGION_PROFILES],
  );

  /* --- Bar chart data: top 3 besoins presence per region ----------- */
  const topBesoins = useMemo(() => computeTopBesoins(REGION_PROFILES), [REGION_PROFILES]);

  const besoinsChartData = useMemo(() => {
    return REGION_PROFILES.map((p) => {
      const row: Record<string, string | number> = { region: p.region };
      topBesoins.forEach((b) => {
        row[b] = p.top_besoins.includes(b) ? 1 : 0;
      });
      return row;
    });
  }, [REGION_PROFILES, topBesoins]);

  /* --- Heat matrix data ------------------------------------------- */
  const secteurs = useMemo(() => Array.from(new Set(GEO_SECTOR_DATA.map((d) => d.secteur))).sort(), [GEO_SECTOR_DATA]);
  const regions  = useMemo(() => Array.from(new Set(GEO_SECTOR_DATA.map((d) => d.region))).sort(), [GEO_SECTOR_DATA]);

  const getCell = (secteur: string, region: string) =>
    GEO_SECTOR_DATA.find((d) => d.secteur === secteur && d.region === region);

  /* ----------------------------------------------------------------- */
  /*  Render                                                            */
  /* ----------------------------------------------------------------- */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600">
          <Globe className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Analyse Geographique</h1>
          <p className="text-sm text-slate-500">Problematiques et specificites par region</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          label="Regions couvertes"
          value={regionCount}
          icon={<Globe className="w-5 h-5" />}
          iconColor="text-indigo-600 bg-indigo-50"
        />
        <KpiCard
          label="Region la plus active"
          value={mostActive?.region ?? '--'}
          suffix={mostActive ? `(${mostActive.nb_signaux} sig.)` : ''}
          icon={<MapPin className="w-5 h-5" />}
          iconColor="text-emerald-600 bg-emerald-50"
        />
        <KpiCard
          label="Region sous tension"
          value={mostTense?.region ?? '--'}
          suffix={mostTense ? `(${mostTense.concurrent_mentions} mentions)` : ''}
          icon={<AlertTriangle className="w-5 h-5" />}
          iconColor="text-rose-600 bg-rose-50"
        />
      </div>

      {/* ============================================================ */}
      {/*  Section 1 — Problematiques par region                       */}
      {/* ============================================================ */}
      <div>
        <h2 className="text-base font-semibold text-slate-900 mb-4">Problematiques par region</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {sortedProfiles.map((r) => {
            const sc = SENTIMENT_CONFIG[r.sentiment_dominant];
            return (
              <div
                key={r.region}
                className={cn(
                  'bg-white rounded-xl border border-slate-200 shadow-sm p-5 border-l-4',
                  sentimentBorderClass(r.sentiment_dominant),
                )}
              >
                {/* Header row */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="font-semibold text-slate-900 text-base">{r.region}</span>
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                    {r.nb_signaux} signaux
                  </span>
                  <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', sc.bg, sc.text)}>
                    {sc.label}
                  </span>
                </div>

                {/* Top 3 besoins */}
                <div className="mb-3">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Top besoins</span>
                  <ol className="mt-1.5 space-y-1">
                    {r.top_besoins.slice(0, 3).map((b, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                        <Lightbulb className="w-3.5 h-3.5 mt-0.5 text-sky-500 shrink-0" />
                        <span>{i + 1}. {b}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Concurrent principal */}
                <div
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-3 py-2 text-sm mb-3',
                    r.concurrent_mentions > 10 ? 'bg-rose-50' : 'bg-slate-50',
                  )}
                >
                  <Swords className="w-4 h-4 text-slate-500 shrink-0" />
                  <span className="font-medium text-slate-700">{r.concurrent_principal}</span>
                  <span className="text-slate-400">--</span>
                  <span className="text-slate-600">{r.concurrent_mentions} mentions</span>
                </div>

                {/* Specificite locale */}
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-sm italic text-slate-700">{r.specificite_locale}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ============================================================ */}
      {/*  Section 2 — Top besoins par region (grouped bar chart)      */}
      {/* ============================================================ */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-slate-900 mb-1">Top besoins par region</h2>
        <p className="text-xs text-slate-500 mb-3">Presence (1) ou absence (0) des 3 besoins les plus cites nationalement</p>
        <div className="flex flex-wrap items-center gap-4 mb-4">
          {topBesoins.map((b, i) => (
            <span key={b} className="inline-flex items-center gap-1.5 text-xs text-slate-600">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: BAR_PALETTE[i] }} />
              {b}
            </span>
          ))}
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={besoinsChartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <XAxis
                dataKey="region"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#334155', fontSize: 11, fontWeight: 500 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                domain={[0, 1]}
                ticks={[0, 1]}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '0.75rem',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                }}
                formatter={((value: any, name: any) => [value === 1 ? 'Oui' : 'Non', name]) as any}
              />
              {topBesoins.map((b, i) => (
                <Bar key={b} dataKey={b} fill={BAR_PALETTE[i]} radius={[4, 4, 0, 0]} barSize={20} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ============================================================ */}
      {/*  Section 3 — Matrice sectorielle                             */}
      {/* ============================================================ */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 pt-5 pb-3">
          <h2 className="text-sm font-semibold text-slate-900">Matrice sectorielle</h2>
          <p className="text-xs text-slate-500 mt-1">Intensite des signaux par secteur et region</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/60 border-b border-slate-100">
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Secteur</th>
                {regions.map((r) => (
                  <th key={r} className="text-center px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {r}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {secteurs.map((secteur) => (
                <tr key={secteur} className="border-b border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">{secteur}</td>
                  {regions.map((region) => {
                    const cell = getCell(secteur, region);
                    if (!cell) {
                      return (
                        <td key={region} className="px-4 py-3 text-center">
                          <span className="text-slate-300">--</span>
                        </td>
                      );
                    }
                    const level = getIntensityLevel(cell.score_intensite);
                    const config = INTENSITY_COLORS[level];
                    const signalCount = cell.signaux_concurrence + cell.signaux_besoins + cell.signaux_opportunites;
                    return (
                      <td key={region} className="px-3 py-2 text-center">
                        <div className={cn('inline-flex flex-col items-center rounded-lg px-3 py-1.5 border', config.bg, config.border)}>
                          <span className={cn('text-sm font-bold tabular-nums', config.text)}>
                            {cell.score_intensite}
                          </span>
                          <span className={cn('text-[10px] font-medium opacity-70', config.text)}>
                            ({signalCount})
                          </span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
