'use client';

import { useMemo } from 'react';
import { EVOLUTION_CLIENTS } from '@/lib/seed-data-v2';
import { KpiCard } from '@/components/shared/kpi-card';
import { formatDate } from '@/lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts';
import { TrendingUp, TrendingDown, ShieldAlert } from 'lucide-react';

export default function DirN1Page() {
  const stats = useMemo(() => {
    const progression = EVOLUTION_CLIENTS.filter((c) => c.delta > 0).length;
    const regression = EVOLUTION_CLIENTS.filter((c) => c.delta < 0).length;
    const nouveauxConcurrents = EVOLUTION_CLIENTS.filter(
      (c) => c.presence_concurrent_actuel && !c.presence_concurrent_precedent
    ).length;
    return { progression, regression, nouveauxConcurrents };
  }, []);

  const sorted = useMemo(
    () => [...EVOLUTION_CLIENTS].sort((a, b) => a.delta - b.delta),
    []
  );

  const chartData = useMemo(
    () =>
      sorted.map((c) => ({
        name: c.client_name,
        delta: c.delta,
      })),
    [sorted]
  );

  function sentimentBadge(sentiment: string) {
    const config: Record<string, string> = {
      positif: 'bg-emerald-50 text-emerald-700',
      neutre: 'bg-slate-50 text-slate-600',
      negatif: 'bg-rose-50 text-rose-700',
    };
    const labels: Record<string, string> = {
      positif: 'Positif',
      neutre: 'Neutre',
      negatif: 'Negatif',
    };
    return (
      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${config[sentiment] || ''}`}>
        {labels[sentiment] || sentiment}
      </span>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Evolution Clients — Retours N-1</h1>
        <p className="text-sm text-slate-500 mt-1">Comparaison des scores clients entre deux periodes</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          label="Clients en progression"
          value={stats.progression}
          icon={<TrendingUp className="w-5 h-5" />}
          iconColor="text-emerald-600 bg-emerald-50"
        />
        <KpiCard
          label="En regression"
          value={stats.regression}
          icon={<TrendingDown className="w-5 h-5" />}
          iconColor="text-rose-600 bg-rose-50"
        />
        <KpiCard
          label="Nouveaux concurrents detectes"
          value={stats.nouveauxConcurrents}
          icon={<ShieldAlert className="w-5 h-5" />}
          iconColor="text-amber-600 bg-amber-50"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">Detail par client</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/60">
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Client</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Commercial</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Score actuel</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Score precedent</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Delta</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Concurrent</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Sentiment</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date actuel</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date precedent</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((c) => (
                <tr key={c.client_id} className="border-b border-slate-100 hover:bg-slate-50/40 transition-colors">
                  <td className="px-6 py-3 font-medium text-slate-900">{c.client_name}</td>
                  <td className="px-4 py-3 text-slate-700">{c.commercial_name}</td>
                  <td className="px-4 py-3 text-center tabular-nums font-semibold text-slate-900">{c.score_actuel}</td>
                  <td className="px-4 py-3 text-center tabular-nums text-slate-500">{c.score_precedent}</td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${
                        c.delta > 0
                          ? 'bg-emerald-50 text-emerald-700'
                          : c.delta < 0
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-slate-50 text-slate-600'
                      }`}
                    >
                      {c.delta > 0 ? '+' : ''}{c.delta}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {c.presence_concurrent_actuel ? (
                      <span className="inline-block w-2.5 h-2.5 rounded-full bg-rose-500" title="Concurrent present" />
                    ) : (
                      <span className="inline-block w-2.5 h-2.5 rounded-full bg-slate-200" title="Aucun concurrent" />
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">{sentimentBadge(c.sentiment)}</td>
                  <td className="px-4 py-3 text-slate-500 tabular-nums">{formatDate(c.date_actuel)}</td>
                  <td className="px-6 py-3 text-slate-500 tabular-nums">{formatDate(c.date_precedent)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delta chart */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-base font-semibold text-slate-900 mb-4">Delta par client</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} angle={-20} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
              <Tooltip
                formatter={(value) => [`${Number(value) > 0 ? '+' : ''}${value}`, 'Delta']}
                contentStyle={{
                  borderRadius: 12,
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                }}
              />
              <Bar dataKey="delta" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, idx) => (
                  <Cell
                    key={idx}
                    fill={entry.delta >= 0 ? '#10b981' : '#f43f5e'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
