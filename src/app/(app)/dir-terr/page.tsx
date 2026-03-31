'use client';

import { useMemo, useState } from 'react';
import { TERRITOIRES } from '@/lib/seed-data-v2';
import type { TerritoireSynthese, SentimentType } from '@/lib/types-v2';
import { cn } from '@/lib/utils';
import { KpiCard } from '@/components/shared/kpi-card';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import {
  AlertTriangle, TrendingUp, Shield, FileText, Swords,
  ArrowUp, ArrowDown, Minus,
} from 'lucide-react';

type FilterType = 'Tous' | 'Opportunites' | 'Risques' | 'Concurrence';
const FILTERS: FilterType[] = ['Tous', 'Opportunites', 'Risques', 'Concurrence'];

function priorityColor(score: number) {
  if (score > 70) return 'border-l-rose-500';
  if (score > 40) return 'border-l-amber-400';
  return 'border-l-emerald-500';
}

function scoreBadgeCls(score: number) {
  if (score > 70) return 'bg-rose-50 text-rose-700';
  if (score > 40) return 'bg-amber-50 text-amber-700';
  return 'bg-emerald-50 text-emerald-700';
}

function barFill(score: number) {
  if (score > 70) return '#f43f5e';
  if (score > 40) return '#f59e0b';
  return '#10b981';
}

function sentimentBadge(sentiment: SentimentType) {
  const cfg: Record<SentimentType, { bg: string; label: string }> = {
    positif: { bg: 'bg-emerald-50 text-emerald-700', label: 'Positif' },
    negatif: { bg: 'bg-rose-50 text-rose-700', label: 'Negatif' },
    neutre: { bg: 'bg-slate-100 text-slate-600', label: 'Neutre' },
    interesse: { bg: 'bg-amber-50 text-amber-700', label: 'Interesse' },
  };
  const c = cfg[sentiment];
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', c.bg)}>
      {c.label}
    </span>
  );
}

function tendanceBadge(tendance: TerritoireSynthese['tendance_vs_mois_precedent']) {
  if (tendance === 'hausse') {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium bg-rose-50 text-rose-700">
        <ArrowUp className="w-3 h-3" /> Hausse
      </span>
    );
  }
  if (tendance === 'baisse') {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-700">
        <ArrowDown className="w-3 h-3" /> Baisse
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600">
      <Minus className="w-3 h-3" /> Stable
    </span>
  );
}

export default function DirTerrPage() {
  const [filter, setFilter] = useState<FilterType>('Tous');

  const sorted = useMemo(() => {
    let list = [...TERRITOIRES];
    if (filter === 'Opportunites') list = list.filter((t) => t.nb_opportunites > 3);
    if (filter === 'Risques') list = list.filter((t) => t.nb_risques_perte > 2);
    if (filter === 'Concurrence') list = list.filter((t) => t.nb_mentions_concurrents > 10);
    return list.sort((a, b) => b.score_priorite - a.score_priorite);
  }, [filter]);

  const kpis = useMemo(() => ({
    sousPression: TERRITOIRES.filter((t) => t.score_priorite > 70).length,
    avecOpportunites: TERRITOIRES.filter((t) => t.nb_opportunites > 3).length,
    aRisque: TERRITOIRES.filter((t) => t.nb_risques_perte > 2).length,
  }), []);

  const chartData = useMemo(() =>
    [...TERRITOIRES]
      .sort((a, b) => b.score_priorite - a.score_priorite)
      .map((t) => ({
        name: t.territoire,
        score: t.score_priorite,
      })),
  []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Vue Panoramique Territoire</h1>
        <p className="text-sm text-slate-500 mt-1">
          Tendances et pressions detectees dans les CR
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          label="Territoires sous pression"
          value={kpis.sousPression}
          icon={<AlertTriangle className="w-5 h-5" />}
          iconColor="text-rose-600 bg-rose-50"
        />
        <KpiCard
          label="Territoires avec opportunites"
          value={kpis.avecOpportunites}
          icon={<TrendingUp className="w-5 h-5" />}
          iconColor="text-emerald-600 bg-emerald-50"
        />
        <KpiCard
          label="Territoires a risque"
          value={kpis.aRisque}
          icon={<Shield className="w-5 h-5" />}
          iconColor="text-amber-600 bg-amber-50"
        />
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
              filter === f
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Territory cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {sorted.map((t) => (
          <div
            key={t.territoire}
            className={cn(
              'relative bg-white rounded-xl border border-slate-200 shadow-sm p-5 border-l-4',
              priorityColor(t.score_priorite)
            )}
          >
            {/* Score badge top-right */}
            <span
              className={cn(
                'absolute top-4 right-4 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold tabular-nums',
                scoreBadgeCls(t.score_priorite)
              )}
            >
              {t.score_priorite}
            </span>

            {/* Title + trend */}
            <div className="flex items-center gap-2 mb-3 pr-14">
              <h3 className="text-base font-bold text-slate-900">{t.territoire}</h3>
              {tendanceBadge(t.tendance_vs_mois_precedent)}
            </div>

            {/* Mini stats row */}
            <div className="flex items-center gap-4 mb-3">
              <div className="flex items-center gap-1 text-xs text-slate-600">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span className="tabular-nums font-medium">{t.nb_cr}</span>
                <span className="text-slate-400">CR</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-600">
                <Swords className="w-3.5 h-3.5 text-slate-400" />
                <span className="tabular-nums font-medium">{t.nb_mentions_concurrents}</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-600">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                <span className="tabular-nums font-medium">{t.nb_opportunites}</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-600">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                <span className="tabular-nums font-medium">{t.nb_risques_perte}</span>
              </div>
            </div>

            {/* Sentiment dominant */}
            <div className="mb-3">
              {sentimentBadge(t.sentiment_dominant)}
            </div>

            {/* Commerciaux */}
            <p className="text-xs text-slate-500">
              {t.commercial_names.join(', ')}
            </p>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-base font-semibold text-slate-900 mb-4">
          Score priorite par territoire
        </h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} domain={[0, 100]} />
              <Tooltip
                formatter={((value: any) => [value, 'Score priorite']) as any}
                contentStyle={{
                  borderRadius: 12,
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                }}
              />
              <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, idx) => (
                  <Cell key={idx} fill={barFill(entry.score)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
