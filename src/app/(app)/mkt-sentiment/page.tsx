// @ts-nocheck
'use client';

import { useMemo, useState } from 'react';
import { useAppData } from '@/lib/data';
import type { SentimentRegion, MotifSentiment } from '@/lib/types-v2';
import { cn } from '@/lib/utils';
import { REGIONS } from '@/lib/constants';
import { KpiCard } from '@/components/shared/kpi-card';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend, Cell,
} from 'recharts';
import { Smile, Frown, UserCheck, FileText, ThumbsUp, ThumbsDown } from 'lucide-react';

const PERIOD_OPTIONS = ['Mois', 'Trimestre', 'Semestre'] as const;

function pct(n: number, total: number) {
  return total > 0 ? Math.round((n / total) * 100) : 0;
}

function changePct(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

export default function MktSentimentPage() {
  const { sentimentPeriodes: SENTIMENT_PERIODES, sentimentActuelle: SENTIMENT_PERIODE_ACTUELLE, sentimentPrecedente: SENTIMENT_PERIODE_PRECEDENTE, sentimentRegions: SENTIMENT_REGIONS, motifsSentiment: MOTIFS_SENTIMENT } = useAppData();
  const [regionFilter, setRegionFilter] = useState<string>('Toutes');
  const [periodFilter, setPeriodFilter] = useState<string>('Mois');

  const cur = SENTIMENT_PERIODE_ACTUELLE;
  const prev = SENTIMENT_PERIODE_PRECEDENTE;

  // --- KPIs ---
  const kpis = useMemo(() => ({
    positif: {
      count: cur.positif,
      pct: pct(cur.positif, cur.total),
      change: changePct(cur.positif, prev.positif),
    },
    negatif: {
      count: cur.negatif,
      pct: pct(cur.negatif, cur.total),
      change: changePct(cur.negatif, prev.negatif),
    },
    interesse: {
      count: cur.interesse,
      change: changePct(cur.interesse, prev.interesse),
    },
    total: {
      count: cur.total,
      change: changePct(cur.total, prev.total),
    },
  }), [cur, prev]);

  // --- Grouped bar chart data ---
  const compareData = useMemo(() => [
    { category: 'Positif', actuel: cur.positif, precedent: prev.positif },
    { category: 'Negatif', actuel: cur.negatif, precedent: prev.negatif },
    { category: 'Neutre', actuel: cur.neutre, precedent: prev.neutre },
    { category: 'Interesse', actuel: cur.interesse, precedent: prev.interesse },
  ], [cur, prev]);

  // --- Line chart: positif % per week ---
  const tendanceData = useMemo(() =>
    SENTIMENT_PERIODES.map((p) => ({
      semaine: p.periode,
      ratio: pct(p.positif, p.total),
    })),
  []);

  // --- Motifs principaux ---
  const topPositif = useMemo(() => {
    return MOTIFS_SENTIMENT
      .filter((m) => m.type === 'positif')
      .sort((a, b) => b.mentions - a.mentions)[0];
  }, []);

  const topNegatif = useMemo(() => {
    return MOTIFS_SENTIMENT
      .filter((m) => m.type === 'negatif')
      .sort((a, b) => b.mentions - a.mentions)[0];
  }, []);

  // --- Motifs bar chart data ---
  const motifsPositifs = useMemo(() =>
    MOTIFS_SENTIMENT
      .filter((m) => m.type === 'positif')
      .sort((a, b) => b.mentions - a.mentions),
  []);

  const motifsNegatifs = useMemo(() =>
    MOTIFS_SENTIMENT
      .filter((m) => m.type === 'negatif')
      .sort((a, b) => b.mentions - a.mentions),
  []);

  const motifsChartData = useMemo(() => {
    const all = [...motifsPositifs, ...motifsNegatifs];
    return all.map((m) => ({
      motif: m.motif,
      mentions: m.mentions,
      fill: m.type === 'positif' ? '#10b981' : '#f43f5e',
    }));
  }, [motifsPositifs, motifsNegatifs]);

  // --- Regions sorted by negatif/total desc ---
  const regionsSorted = useMemo(() => {
    let regions = [...SENTIMENT_REGIONS];
    if (regionFilter !== 'Toutes') {
      regions = regions.filter((r) => r.region === regionFilter);
    }
    return regions.sort((a, b) => {
      const ratioA = a.total > 0 ? a.negatif / a.total : 0;
      const ratioB = b.total > 0 ? b.negatif / b.total : 0;
      return ratioB - ratioA;
    });
  }, [regionFilter]);

  function stackedBar(r: SentimentRegion) {
    const total = r.total || 1;
    const segments = [
      { key: 'positif', value: r.positif, color: 'bg-emerald-500', label: 'Positif' },
      { key: 'negatif', value: r.negatif, color: 'bg-rose-500', label: 'Negatif' },
      { key: 'neutre', value: r.neutre, color: 'bg-slate-400', label: 'Neutre' },
      { key: 'interesse', value: r.interesse, color: 'bg-amber-500', label: 'Interesse' },
    ];
    return (
      <div className="flex h-2.5 rounded-full overflow-hidden bg-slate-100">
        {segments.map((s) => (
          <div
            key={s.key}
            className={s.color}
            style={{ width: `${(s.value / total) * 100}%` }}
            title={`${s.label}: ${s.value}`}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Sentiment Client</h1>
        <p className="text-sm text-slate-500 mt-1">
          Evolution du sentiment detecte dans les CR
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Sentiment positif"
          value={`${kpis.positif.count}`}
          suffix={`(${kpis.positif.pct}%)`}
          change={kpis.positif.change}
          icon={<Smile className="w-5 h-5" />}
          iconColor="text-emerald-600 bg-emerald-50"
        />
        <KpiCard
          label="Sentiment negatif"
          value={`${kpis.negatif.count}`}
          suffix={`(${kpis.negatif.pct}%)`}
          change={kpis.negatif.change}
          icon={<Frown className="w-5 h-5" />}
          iconColor="text-rose-600 bg-rose-50"
        />
        <KpiCard
          label="Clients interesses"
          value={kpis.interesse.count}
          change={kpis.interesse.change}
          icon={<UserCheck className="w-5 h-5" />}
          iconColor="text-amber-600 bg-amber-50"
        />
        <KpiCard
          label="Total CR analyses"
          value={kpis.total.count}
          change={kpis.total.change}
          icon={<FileText className="w-5 h-5" />}
          iconColor="text-indigo-600 bg-indigo-50"
        />
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap items-center gap-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-1">Region</span>
          {['Toutes', ...REGIONS].map((r) => (
            <button
              key={r}
              onClick={() => setRegionFilter(r)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                regionFilter === r
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              {r}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-1">Periode</span>
          {PERIOD_OPTIONS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriodFilter(p)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                periodFilter === p
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grouped bar chart */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-4">
            Comparaison mois actuel vs precedent
          </h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={compareData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <XAxis dataKey="category" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12, color: '#64748b' }} />
                <Bar dataKey="actuel" name="Mois actuel" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="precedent" name="Mois precedent" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Line chart: tendance positif % */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-4">
            Tendance sentiment positif (4 semaines)
          </h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={tendanceData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <XAxis dataKey="semaine" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  formatter={((value: any) => [`${value}%`, 'Positif']) as any}
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="ratio"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  dot={{ fill: '#6366f1', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Motifs principaux du sentiment */}
      <div>
        <h2 className="text-base font-semibold text-slate-900 mb-4">Motifs principaux du sentiment</h2>

        {/* Top motif cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* Top positif */}
          {topPositif && (
            <div className="bg-white rounded-xl border-2 border-emerald-200 shadow-sm p-5 flex items-start gap-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-50">
                <ThumbsUp className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Motif #1 positif</p>
                <p className="text-base font-bold text-slate-900">{topPositif.motif}</p>
                <p className="text-sm text-emerald-700 mt-1">{topPositif.mentions} mentions</p>
              </div>
            </div>
          )}

          {/* Top negatif */}
          {topNegatif && (
            <div className="bg-white rounded-xl border-2 border-rose-200 shadow-sm p-5 flex items-start gap-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-rose-50">
                <ThumbsDown className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Motif #1 negatif</p>
                <p className="text-base font-bold text-slate-900">{topNegatif.motif}</p>
                <p className="text-sm text-rose-700 mt-1">{topNegatif.mentions} mentions</p>
              </div>
            </div>
          )}
        </div>

        {/* Horizontal bar chart of all motifs */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Tous les motifs par nombre de mentions</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={motifsChartData}
                layout="vertical"
                margin={{ top: 0, right: 20, left: 10, bottom: 0 }}
              >
                <XAxis type="number" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis
                  type="category"
                  dataKey="motif"
                  tick={{ fontSize: 11, fill: '#334155' }}
                  width={180}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  }}
                  formatter={((value: any) => [`${value} mentions`, '']) as any}
                />
                <Bar dataKey="mentions" radius={[0, 4, 4, 0]} maxBarSize={24}>
                  {motifsChartData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Region breakdown */}
      <div>
        <h2 className="text-base font-semibold text-slate-900 mb-4">Repartition par region</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {regionsSorted.map((r) => (
            <div
              key={r.region}
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-5"
            >
              <h3 className="text-sm font-semibold text-slate-900 mb-3">{r.region}</h3>
              {stackedBar(r)}
              <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                {[
                  { label: 'Positif', value: r.positif, color: 'text-emerald-700' },
                  { label: 'Negatif', value: r.negatif, color: 'text-rose-700' },
                  { label: 'Neutre', value: r.neutre, color: 'text-slate-600' },
                  { label: 'Interesse', value: r.interesse, color: 'text-amber-700' },
                ].map((s) => (
                  <div key={s.label}>
                    <p className={cn('text-base font-bold tabular-nums', s.color)}>{s.value}</p>
                    <p className="text-[10px] text-slate-500">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
