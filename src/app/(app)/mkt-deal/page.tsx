'use client';

import { useState, useMemo } from 'react';
import { DEALS_ANALYSE } from '@/lib/seed-data-v2';
import { KpiCard } from '@/components/shared/kpi-card';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Target, TrendingUp, TrendingDown, FileWarning } from 'lucide-react';
import type { DealMotif } from '@/lib/types-v2';

type ResultatFilter = 'all' | 'gagne' | 'perdu';

const RESULTAT_OPTIONS: { key: ResultatFilter; label: string }[] = [
  { key: 'all', label: 'Tous' },
  { key: 'gagne', label: 'Gagnes' },
  { key: 'perdu', label: 'Perdus' },
];

const MOTIF_LABELS: Record<DealMotif, string> = {
  prix: 'Prix',
  produit: 'Produit',
  offre: 'Offre',
  timing: 'Timing',
  concurrent: 'Concurrent',
  relation: 'Relation',
  budget: 'Budget',
  autre: 'Autre',
};

const MOTIF_COLORS: Record<DealMotif, string> = {
  prix: '#e11d48',
  produit: '#6366f1',
  offre: '#f59e0b',
  timing: '#8b5cf6',
  concurrent: '#ec4899',
  relation: '#10b981',
  budget: '#64748b',
  autre: '#94a3b8',
};

export default function MktDealPage() {
  const [resultatFilter, setResultatFilter] = useState<ResultatFilter>('all');

  const totalDeals = DEALS_ANALYSE.length;
  const gagnes = useMemo(() => DEALS_ANALYSE.filter((d) => d.resultat === 'gagne'), []);
  const perdus = useMemo(() => DEALS_ANALYSE.filter((d) => d.resultat === 'perdu'), []);
  const valeurGagnee = useMemo(() => gagnes.reduce((acc, d) => acc + d.valeur_eur, 0), [gagnes]);
  const valeurPerdue = useMemo(() => perdus.reduce((acc, d) => acc + d.valeur_eur, 0), [perdus]);
  const tauxConversion = useMemo(() => ((gagnes.length / totalDeals) * 100).toFixed(0), [gagnes, totalDeals]);

  const pieData = useMemo(() => {
    const counts: Partial<Record<DealMotif, number>> = {};
    DEALS_ANALYSE.forEach((d) => {
      counts[d.motif_principal] = (counts[d.motif_principal] || 0) + 1;
    });
    return Object.entries(counts).map(([motif, count]) => ({
      name: MOTIF_LABELS[motif as DealMotif],
      value: count,
      motif: motif as DealMotif,
    }));
  }, []);

  const barData = useMemo(() => {
    const sums: Partial<Record<DealMotif, number>> = {};
    perdus.forEach((d) => {
      sums[d.motif_principal] = (sums[d.motif_principal] || 0) + d.valeur_eur;
    });
    return Object.entries(sums)
      .map(([motif, valeur]) => ({
        name: MOTIF_LABELS[motif as DealMotif],
        valeur: valeur,
        motif: motif as DealMotif,
      }))
      .sort((a, b) => (b.valeur ?? 0) - (a.valeur ?? 0));
  }, [perdus]);

  const filteredDeals = useMemo(() => {
    return DEALS_ANALYSE
      .filter((d) => resultatFilter === 'all' || d.resultat === resultatFilter)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [resultatFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600">
          <Target className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Analyse Deals Gagnes / Perdus</h1>
          <p className="text-sm text-slate-500">Repartition et motifs des deals de la periode</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total deals"
          value={totalDeals}
          icon={<Target className="w-5 h-5" />}
          iconColor="text-indigo-600 bg-indigo-50"
        />
        <KpiCard
          label="Gagnes"
          value={`${gagnes.length} (${formatCurrency(valeurGagnee)})`}
          icon={<TrendingUp className="w-5 h-5" />}
          iconColor="text-emerald-600 bg-emerald-50"
        />
        <KpiCard
          label="Perdus"
          value={`${perdus.length} (${formatCurrency(valeurPerdue)})`}
          icon={<TrendingDown className="w-5 h-5" />}
          iconColor="text-rose-600 bg-rose-50"
        />
        <KpiCard
          label="Taux de conversion"
          value={tauxConversion}
          suffix="%"
          icon={<FileWarning className="w-5 h-5" />}
          iconColor="text-amber-600 bg-amber-50"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Donut — repartition par motif */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Repartition par motif</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                  strokeWidth={0}
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.motif} fill={MOTIF_COLORS[entry.motif]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: '0.75rem',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  }}
                  formatter={(value) => [`${value} deals`, '']}
                />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => <span className="text-xs text-slate-600">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar chart — valeur perdue par motif */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Valeur perdue par motif</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  tickFormatter={(v) => formatCurrency(v)}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '0.75rem',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  }}
                  formatter={(value) => [formatCurrency(value as number), 'Valeur perdue']}
                />
                <Bar dataKey="valeur" radius={[6, 6, 0, 0]} barSize={32}>
                  {barData.map((entry) => (
                    <Cell key={entry.motif} fill={MOTIF_COLORS[entry.motif]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider mr-1">Resultat</span>
        {RESULTAT_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            onClick={() => setResultatFilter(opt.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              resultatFilter === opt.key
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/60 border-b border-slate-100">
                <th className="text-center px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Resultat</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Motif</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Valeur</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Concurrent</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Client</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Commercial</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Region</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredDeals.map((d) => (
                <tr key={d.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${
                      d.resultat === 'gagne'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      {d.resultat === 'gagne' ? 'Gagne' : 'Perdu'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                      {MOTIF_LABELS[d.motif_principal]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-900 tabular-nums">{formatCurrency(d.valeur_eur)}</td>
                  <td className="px-4 py-3 text-slate-700">{d.concurrent_nom || '--'}</td>
                  <td className="px-4 py-3 text-slate-700">{d.client_name}</td>
                  <td className="px-4 py-3 text-slate-700">{d.commercial_name}</td>
                  <td className="px-4 py-3 text-slate-600">{d.region}</td>
                  <td className="px-4 py-3 text-slate-600 tabular-nums">{formatDate(d.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredDeals.length === 0 && (
          <div className="p-8 text-center text-slate-500">Aucun deal pour les filtres selectionnes.</div>
        )}
      </div>
    </div>
  );
}
