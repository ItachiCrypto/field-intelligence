// @ts-nocheck
'use client';

import { useMemo } from 'react';
import { useAppData } from '@/lib/data';
import { KpiCard } from '@/components/shared/kpi-card';
import { formatDate } from '@/lib/utils';
import type { OffreType } from '@/lib/types-v2';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { Package, AlertCircle, ShieldAlert } from 'lucide-react';

const OFFRE_TYPE_LABELS: Record<OffreType, string> = {
  bundle: 'Bundle',
  promotion: 'Promotion',
  nouvelle_gamme: 'Nouvelle gamme',
  conditions_paiement: 'Conditions paiement',
  essai_gratuit: 'Essai gratuit',
  autre: 'Autre',
};

const OFFRE_TYPE_COLORS: Record<OffreType, { bg: string; text: string; border: string }> = {
  bundle: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
  promotion: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  nouvelle_gamme: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  conditions_paiement: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  essai_gratuit: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  autre: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' },
};

const BAR_COLORS = ['#6366f1', '#e11d48', '#f59e0b', '#10b981', '#8b5cf6'];

export default function MktOffrePage() {
  const { offresConcurrentes: OFFRES_CONCURRENTES } = useAppData();
  const offresActives = useMemo(() => OFFRES_CONCURRENTES.filter((o) => o.statut === 'active').length, [OFFRES_CONCURRENTES]);
  const totalImpactes = useMemo(() => OFFRES_CONCURRENTES.reduce((acc, o) => acc + o.deals_impactes, 0), [OFFRES_CONCURRENTES]);
  const totalPerdus = useMemo(() => OFFRES_CONCURRENTES.reduce((acc, o) => acc + o.deals_perdus, 0), [OFFRES_CONCURRENTES]);

  const barData = useMemo(() => {
    return OFFRES_CONCURRENTES
      .map((o) => ({
        name: `${o.concurrent_nom} — ${OFFRE_TYPE_LABELS[o.type_offre]}`,
        mentions: o.count_mentions,
      }))
      .sort((a, b) => b.mentions - a.mentions);
  }, [OFFRES_CONCURRENTES]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600">
          <Package className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Analyse des Offres Concurrentes</h1>
          <p className="text-sm text-slate-500">Offres et promotions detectees sur le terrain</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          label="Offres actives"
          value={offresActives}
          icon={<Package className="w-5 h-5" />}
          iconColor="text-indigo-600 bg-indigo-50"
        />
        <KpiCard
          label="Deals impactes (total)"
          value={totalImpactes}
          icon={<AlertCircle className="w-5 h-5" />}
          iconColor="text-amber-600 bg-amber-50"
        />
        <KpiCard
          label="Deals perdus (total)"
          value={totalPerdus}
          icon={<ShieldAlert className="w-5 h-5" />}
          iconColor="text-rose-600 bg-rose-50"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/60 border-b border-slate-100">
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Concurrent</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Type offre</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Description</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Mentions</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Deals impactes</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Deals perdus</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Statut</th>
              </tr>
            </thead>
            <tbody>
              {OFFRES_CONCURRENTES.map((o) => {
                const typeConfig = OFFRE_TYPE_COLORS[o.type_offre];
                return (
                  <tr key={o.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900">{o.concurrent_nom}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${typeConfig.bg} ${typeConfig.text} ${typeConfig.border}`}>
                        {OFFRE_TYPE_LABELS[o.type_offre]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700 max-w-xs">{o.description}</td>
                    <td className="px-4 py-3 text-center font-semibold text-slate-900 tabular-nums">{o.count_mentions}</td>
                    <td className="px-4 py-3 text-center font-semibold text-amber-700 tabular-nums">{o.deals_impactes}</td>
                    <td className="px-4 py-3 text-center font-semibold text-rose-700 tabular-nums">{o.deals_perdus}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${
                        o.statut === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}>
                        {o.statut === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bar chart — mentions par offre */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Mentions par offre</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 10 }}>
              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis
                type="category"
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#334155', fontSize: 11, fontWeight: 500 }}
                width={200}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '0.75rem',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                }}
                formatter={(value) => [`${value}`, 'Mentions']}
              />
              <Bar dataKey="mentions" radius={[0, 6, 6, 0]} barSize={22}>
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
