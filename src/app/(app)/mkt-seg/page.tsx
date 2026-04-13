// @ts-nocheck
'use client';

import { useMemo } from 'react';
import { useAppData } from '@/lib/data';
import { ClientSegment } from '@/lib/types-v2';
import { cn } from '@/lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { CheckCircle, XCircle, Brain, Users } from 'lucide-react';

const SEGMENT_CONFIG: Record<ClientSegment, { label: string; border: string; headerBg: string; color: string }> = {
  nouveau: {
    label: 'Nouveaux clients',
    border: 'border-l-indigo-500',
    headerBg: 'bg-indigo-50',
    color: '#6366f1',
  },
  etabli: {
    label: 'Clients etablis',
    border: 'border-l-teal-500',
    headerBg: 'bg-teal-50',
    color: '#14b8a6',
  },
};

const SENTIMENT_COLORS = {
  positif: '#10b981',
  negatif: '#f43f5e',
  neutre: '#64748b',
  interesse: '#f59e0b',
};

const SENTIMENT_LABELS: Record<string, string> = {
  positif: 'Positif',
  negatif: 'Negatif',
  neutre: 'Neutre',
  interesse: 'Interesse',
};

export default function MktSegPage() {
  const { segmentSentiments: SEGMENT_SENTIMENTS, segmentInsights: SEGMENT_INSIGHTS } = useAppData();
  const nouveau = SEGMENT_SENTIMENTS.find(s => s.segment === 'nouveau')!;
  const etabli = SEGMENT_SENTIMENTS.find(s => s.segment === 'etabli')!;

  // Bar chart: grouped bars comparing sentiment % by segment
  const chartData = useMemo(() => {
    const keys = ['positif', 'negatif', 'neutre', 'interesse'] as const;
    return keys.map(k => ({
      sentiment: SENTIMENT_LABELS[k],
      Nouveau: nouveau[`pct_${k}`],
      Etabli: etabli[`pct_${k}`],
    }));
  }, [nouveau, etabli]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Segmentation Clients</h1>
        <p className="text-sm text-slate-500 mt-1">Comparaison sentiment entre nouveaux et etablis</p>
      </div>

      {/* Segment cards side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {([nouveau, etabli] as const).map(seg => {
          const cfg = SEGMENT_CONFIG[seg.segment];
          return (
            <div
              key={seg.segment}
              className={cn('bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden border-l-4', cfg.border)}
            >
              {/* Card header */}
              <div className={cn('px-6 py-4 flex items-center gap-3', cfg.headerBg)}>
                <Users className="w-5 h-5" style={{ color: cfg.color }} />
                <h2 className="text-base font-semibold text-slate-800">{cfg.label}</h2>
              </div>

              <div className="px-6 py-5 space-y-5">
                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">Nombre de CR</p>
                    <p className="text-xl font-bold text-slate-900 tabular-nums">{seg.nb_cr}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">Positif</p>
                    <p className="text-xl font-bold text-emerald-600 tabular-nums">{seg.pct_positif}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">Negatif</p>
                    <p className="text-xl font-bold text-rose-600 tabular-nums">{seg.pct_negatif}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">Neutre</p>
                    <p className="text-xl font-bold text-slate-600 tabular-nums">{seg.pct_neutre}%</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-slate-500 mb-0.5">Interesse</p>
                    <p className="text-xl font-bold text-amber-600 tabular-nums">{seg.pct_interesse}%</p>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-slate-100" />

                {/* Top insatisfactions */}
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Top insatisfactions</h3>
                  <ul className="space-y-1.5">
                    {seg.top_insatisfactions.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                        <XCircle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Points positifs */}
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Points positifs</h3>
                  <ul className="space-y-1.5">
                    {seg.top_points_positifs.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                        <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bar chart compare */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Comparaison sentiment par segment</h2>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={chartData} margin={{ left: 10, right: 10 }}>
            <XAxis dataKey="sentiment" tick={{ fill: '#334155', fontSize: 13 }} />
            <YAxis tickFormatter={v => `${v}%`} tick={{ fill: '#64748b', fontSize: 12 }} />
            <Tooltip
              formatter={((value: any) => [`${value}%`]) as any}
              contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 13, color: '#64748b' }}
            />
            <Bar dataKey="Nouveau" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={40} />
            <Bar dataKey="Etabli" fill="#14b8a6" radius={[4, 4, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Insights IA */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100">
            <Brain className="w-4.5 h-4.5 text-slate-600" />
          </div>
          <h2 className="text-sm font-semibold text-slate-700">Insights IA</h2>
        </div>
        <ul className="space-y-3">
          {SEGMENT_INSIGHTS.map((insight, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 text-slate-500 text-xs font-semibold shrink-0 mt-0.5">
                {i + 1}
              </span>
              {insight}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
