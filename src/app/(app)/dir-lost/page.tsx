'use client';

import { useMemo } from 'react';
import { DEALS_ANALYSE, DEAL_TENDANCE } from '@/lib/seed-data-v2';
import { MOTIF_LABELS, MOTIF_COLORS } from '@/lib/types-v2';
import type { DealMotif } from '@/lib/types-v2';
import { formatDate } from '@/lib/utils';
import { KpiCard } from '@/components/shared/kpi-card';
import { AbbreviationHighlight } from '@/components/shared/abbreviation-highlight';
import {
  PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { XCircle, Tag, Users } from 'lucide-react';

const ALL_MOTIFS: DealMotif[] = ['prix', 'produit', 'offre', 'timing', 'concurrent', 'relation', 'budget', 'autre'];

export default function DirLostPage() {
  const perdus = useMemo(() =>
    DEALS_ANALYSE.filter((d) => d.resultat === 'perdu'),
    []
  );

  // KPI: most frequent motif
  const motifTop = useMemo(() => {
    const counts: Partial<Record<DealMotif, number>> = {};
    perdus.forEach((d) => {
      counts[d.motif_principal] = (counts[d.motif_principal] || 0) + 1;
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted.length > 0 ? MOTIF_LABELS[sorted[0][0] as DealMotif] : '--';
  }, [perdus]);

  // KPI: most cited competitor
  const concurrentTop = useMemo(() => {
    const counts: Record<string, number> = {};
    perdus.forEach((d) => {
      if (d.concurrent_nom) {
        counts[d.concurrent_nom] = (counts[d.concurrent_nom] || 0) + 1;
      }
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted.length > 0 ? sorted[0][0] : '--';
  }, [perdus]);

  // Donut: repartition par motif
  const donutData = useMemo(() => {
    const counts: Partial<Record<DealMotif, number>> = {};
    perdus.forEach((d) => {
      counts[d.motif_principal] = (counts[d.motif_principal] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([motif, count]) => ({
        name: MOTIF_LABELS[motif as DealMotif],
        value: count,
        motif: motif as DealMotif,
      }))
      .sort((a, b) => b.value - a.value);
  }, [perdus]);

  // Line chart: total + prix + produit per week
  const lineData = useMemo(() => {
    return DEAL_TENDANCE.map((w) => {
      const total = ALL_MOTIFS.reduce((sum, m) => sum + ((w as any)[m] ?? 0), 0);
      return {
        semaine: w.semaine,
        total,
        prix: w.prix,
        produit: w.produit,
      };
    });
  }, []);

  // Table sorted by date desc
  const sortedDeals = useMemo(() =>
    [...perdus].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [perdus]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 text-slate-700">
          <XCircle className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Analyse Motifs Deals Perdus</h1>
          <p className="text-sm text-slate-500">Tendances et motifs depuis les comptes rendus</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          label="Total deals perdus"
          value={perdus.length}
          icon={<XCircle className="w-5 h-5" />}
          iconColor="text-rose-600 bg-rose-50"
        />
        <KpiCard
          label="Motif #1"
          value={motifTop}
          icon={<Tag className="w-5 h-5" />}
          iconColor="text-slate-600 bg-slate-100"
        />
        <KpiCard
          label="Concurrent le plus cite"
          value={concurrentTop}
          icon={<Users className="w-5 h-5" />}
          iconColor="text-slate-600 bg-slate-100"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Donut */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Repartition par motif</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                  strokeWidth={0}
                >
                  {donutData.map((entry) => (
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

        {/* Line chart -- evolution hebdo */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Evolution deals perdus par semaine</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <XAxis
                  dataKey="semaine"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 11 }}
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
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  name="Total"
                  stroke="#334155"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#334155' }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="prix"
                  name="Prix"
                  stroke={MOTIF_COLORS.prix}
                  strokeWidth={2}
                  dot={{ r: 3, fill: MOTIF_COLORS.prix }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="produit"
                  name="Produit"
                  stroke={MOTIF_COLORS.produit}
                  strokeWidth={2}
                  dot={{ r: 3, fill: MOTIF_COLORS.produit }}
                  activeDot={{ r: 5 }}
                />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => <span className="text-xs text-slate-600">{value}</span>}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/60 border-b border-slate-100">
                <th className="text-center px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Motif</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Concurrent retenu</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Client</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Commercial</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Region</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Verbatim</th>
              </tr>
            </thead>
            <tbody>
              {sortedDeals.map((d) => (
                <tr key={d.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 text-center">
                    <span
                      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                      style={{
                        backgroundColor: `${MOTIF_COLORS[d.motif_principal]}15`,
                        color: MOTIF_COLORS[d.motif_principal],
                      }}
                    >
                      {MOTIF_LABELS[d.motif_principal]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{d.concurrent_nom || '--'}</td>
                  <td className="px-4 py-3 text-slate-700">{d.client_name}</td>
                  <td className="px-4 py-3 text-slate-700">{d.commercial_name}</td>
                  <td className="px-4 py-3 text-slate-600">{d.region}</td>
                  <td className="px-4 py-3 text-slate-600 tabular-nums">{formatDate(d.date)}</td>
                  <td className="px-4 py-3 text-slate-600 max-w-xs">
                    <AbbreviationHighlight text={d.verbatim} className="text-sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {sortedDeals.length === 0 && (
          <div className="p-8 text-center text-slate-500">Aucun deal perdu.</div>
        )}
      </div>
    </div>
  );
}
