// @ts-nocheck
'use client';

import { useMemo } from 'react';
import { useAppData } from '@/lib/data';
import { KpiCard } from '@/components/shared/kpi-card';
import { formatDate } from '@/lib/utils';
import type { CommType, ReactionClient } from '@/lib/types-v2';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { Megaphone, ThumbsUp } from 'lucide-react';

const COMM_TYPE_LABELS: Record<CommType, string> = {
  salon: 'Salon',
  pub: 'Publicite',
  emailing: 'Emailing',
  social: 'Social media',
  presse: 'Presse',
  sponsoring: 'Sponsoring',
  partenariat: 'Partenariat',
  autre: 'Autre',
};

const COMM_TYPE_COLORS: Record<CommType, { bg: string; text: string; border: string }> = {
  salon: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
  pub: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  emailing: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  social: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  presse: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
  sponsoring: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  partenariat: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  autre: { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' },
};

const REACTION_CONFIG: Record<ReactionClient, { bg: string; text: string; border: string; label: string }> = {
  positive: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Positive' },
  neutre: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200', label: 'Neutre' },
  negative: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', label: 'Negative' },
};

const BAR_COLORS = ['#6366f1', '#e11d48', '#f59e0b', '#10b981', '#8b5cf6'];

export default function MktCommPage() {
  const { commConcurrentes: COMM_CONCURRENTES } = useAppData();
  const totalActions = COMM_CONCURRENTES.length;
  const reactionsPositives = useMemo(() => {
    return COMM_CONCURRENTES.filter((c) => c.reaction_client === 'positive').length;
  }, [COMM_CONCURRENTES]);

  const barData = useMemo(() => {
    const map: Record<string, number> = {};
    COMM_CONCURRENTES.forEach((c) => {
      map[c.concurrent_nom] = (map[c.concurrent_nom] || 0) + 1;
    });
    return Object.entries(map)
      .map(([nom, count]) => ({ nom, actions: count }))
      .sort((a, b) => b.actions - a.actions);
  }, [COMM_CONCURRENTES]);

  const sortedComms = useMemo(() => {
    return [...COMM_CONCURRENTES].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [COMM_CONCURRENTES]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600">
          <Megaphone className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Suivi Communications Concurrentes</h1>
          <p className="text-sm text-slate-500">Actions marketing et communication detectees par les equipes terrain</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <KpiCard
          label="Actions detectees"
          value={totalActions}
          icon={<Megaphone className="w-5 h-5" />}
          iconColor="text-indigo-600 bg-indigo-50"
        />
        <KpiCard
          label="Reactions positives"
          value={reactionsPositives}
          icon={<ThumbsUp className="w-5 h-5" />}
          iconColor="text-emerald-600 bg-emerald-50"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/60 border-b border-slate-100">
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Concurrent</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Type action</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Description</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Reaction client</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Mentions</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Region</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody>
              {sortedComms.map((c) => {
                const typeConfig = COMM_TYPE_COLORS[c.type_action];
                const reactionConfig = REACTION_CONFIG[c.reaction_client];
                return (
                  <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900">{c.concurrent_nom}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${typeConfig.bg} ${typeConfig.text} ${typeConfig.border}`}>
                        {COMM_TYPE_LABELS[c.type_action]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700 max-w-xs">{c.description}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${reactionConfig.bg} ${reactionConfig.text} ${reactionConfig.border}`}>
                        {reactionConfig.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-semibold text-slate-900 tabular-nums">{c.count_mentions}</td>
                    <td className="px-4 py-3 text-slate-600">{c.region}</td>
                    <td className="px-4 py-3 text-slate-600 tabular-nums">{formatDate(c.date)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bar chart — actions par concurrent */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Actions par concurrent</h2>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <XAxis
                dataKey="nom"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#334155', fontSize: 12, fontWeight: 500 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '0.75rem',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                }}
                formatter={(value) => [`${value}`, 'Actions']}
              />
              <Bar dataKey="actions" radius={[6, 6, 0, 0]} barSize={36}>
                {barData.map((_, index) => (
                  <Cell key={index} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
