// @ts-nocheck
'use client';

import { useMemo } from 'react';
import { useAppData } from '@/lib/data';
import { KpiCard } from '@/components/shared/kpi-card';
import { formatDate } from '@/lib/utils';
import type { CommType, ReactionClient } from '@/lib/types-v2';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, Legend,
} from 'recharts';
import { Megaphone, ThumbsUp, TrendingUp } from 'lucide-react';

// Liste blanche des actions qui relevent purement de la COMMUNICATION externe.
// Partenariat/autre relevent du commercial/marketing au sens large — exclus ici.
const COMM_ACTIONS: CommType[] = ['salon', 'pub', 'emailing', 'social', 'presse', 'sponsoring'];

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

const EVOLUTION_COLORS = ['#6366f1', '#e11d48', '#f59e0b', '#10b981', '#8b5cf6', '#06b6d4'];

function weekKey(d: Date): string {
  // YYYY-WW format pour tri chronologique
  const year = d.getUTCFullYear();
  const jan1 = new Date(Date.UTC(year, 0, 1));
  const diff = (d.getTime() - jan1.getTime()) / 86400000;
  const week = Math.ceil((diff + jan1.getUTCDay() + 1) / 7);
  return `${year}-S${String(week).padStart(2, '0')}`;
}

const REACTION_CONFIG: Record<ReactionClient, { bg: string; text: string; border: string; label: string }> = {
  positive: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Positive' },
  neutre: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200', label: 'Neutre' },
  negative: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', label: 'Negative' },
};

const BAR_COLORS = ['#6366f1', '#e11d48', '#f59e0b', '#10b981', '#8b5cf6'];

export default function MktCommPage() {
  const { commConcurrentes: RAW_COMMS } = useAppData();

  // On ne garde que les actions de communication pure (salon, pub, emailing, social, presse, sponsoring).
  // Les entrees restantes ('autre', 'partenariat') sont des activites commerciales/marketing au sens large.
  const COMM_CONCURRENTES = useMemo(
    () => (RAW_COMMS || []).filter((c: any) => COMM_ACTIONS.includes(c.type_action)),
    [RAW_COMMS]
  );

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

  // Evolution hebdo : on compte le nombre d'actions par (concurrent + type_action) par semaine.
  // On ne trace que les paires (concurrent, type_action) ayant >=2 occurrences (= amplification)
  const evolutionData = useMemo(() => {
    if (COMM_CONCURRENTES.length === 0) return { rows: [], series: [] };

    // 1. Recenser les paires amplifiees (count >= 2)
    const pairCounts = new Map<string, number>();
    for (const c of COMM_CONCURRENTES) {
      const key = `${c.concurrent_nom} - ${COMM_TYPE_LABELS[c.type_action] || c.type_action}`;
      pairCounts.set(key, (pairCounts.get(key) || 0) + (c.count_mentions || 1));
    }
    const amplifiedPairs = Array.from(pairCounts.entries())
      .filter(([, n]) => n >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6) // top 6 pour lisibilite
      .map(([k]) => k);

    if (amplifiedPairs.length === 0) return { rows: [], series: [] };

    // 2. Construire les buckets hebdo sur 8 semaines
    const now = new Date();
    const buckets: string[] = [];
    for (let i = 7; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 7 * 86400000);
      buckets.push(weekKey(d));
    }
    const rows: Record<string, any>[] = buckets.map((wk) => {
      const row: Record<string, any> = { semaine: wk };
      for (const p of amplifiedPairs) row[p] = 0;
      return row;
    });
    const rowByKey = new Map(rows.map((r, i) => [buckets[i], r]));

    for (const c of COMM_CONCURRENTES) {
      const pairKey = `${c.concurrent_nom} - ${COMM_TYPE_LABELS[c.type_action] || c.type_action}`;
      if (!amplifiedPairs.includes(pairKey)) continue;
      if (!c.date) continue;
      const wk = weekKey(new Date(c.date));
      const row = rowByKey.get(wk);
      if (!row) continue;
      row[pairKey] = (row[pairKey] || 0) + (c.count_mentions || 1);
    }

    return { rows, series: amplifiedPairs };
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
          <p className="text-sm text-slate-500">Actions de communication externe (salon, pub, emailing, social, presse, sponsoring)</p>
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

      {/* Evolution hebdo — amplification des actions comm */}
      {evolutionData.series.length > 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-semibold text-slate-900">Evolution des actions recurrentes</h2>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Actions (concurrent + type) apparaissant plusieurs fois — permet de detecter une amplification.
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={evolutionData.rows} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <XAxis dataKey="semaine" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '0.75rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', fontSize: 12 }}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: '#64748b' }} />
                {evolutionData.series.map((key, idx) => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={EVOLUTION_COLORS[idx % EVOLUTION_COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        COMM_CONCURRENTES.length > 0 && (
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 text-xs text-slate-500 text-center">
            Pas encore d&apos;action comm recurrente detectee (aucune paire concurrent + type avec &ge; 2 occurrences).
          </div>
        )
      )}

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
