'use client';

import { useMemo } from 'react';
import { DEALS_PERDUS } from '@/lib/seed-data-v2';
import { KpiCard } from '@/components/shared/kpi-card';
import { AbbreviationHighlight } from '@/components/shared/abbreviation-highlight';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { XCircle, Banknote, Tag } from 'lucide-react';

const MOTIF_COLORS: Record<string, string> = {
  prix: '#6366f1',
  produit: '#0ea5e9',
  offre: '#f59e0b',
  timing: '#8b5cf6',
  concurrent: '#f43f5e',
  relation: '#10b981',
  budget: '#64748b',
  autre: '#cbd5e1',
};

const MOTIF_LABELS: Record<string, string> = {
  prix: 'Prix',
  produit: 'Produit',
  offre: 'Offre',
  timing: 'Timing',
  concurrent: 'Concurrent',
  relation: 'Relation',
  budget: 'Budget',
  autre: 'Autre',
};

export default function DirLostPage() {
  const sorted = useMemo(
    () => [...DEALS_PERDUS].sort((a, b) => b.valeur_eur - a.valeur_eur),
    []
  );

  const totals = useMemo(() => {
    const total = DEALS_PERDUS.length;
    const valeurTotale = DEALS_PERDUS.reduce((s, d) => s + d.valeur_eur, 0);
    const motifCounts: Record<string, number> = {};
    for (const d of DEALS_PERDUS) {
      motifCounts[d.motif_principal] = (motifCounts[d.motif_principal] || 0) + 1;
    }
    const motifTop = Object.entries(motifCounts).sort((a, b) => b[1] - a[1])[0];
    return { total, valeurTotale, motifTop: motifTop ? motifTop[0] : '-' };
  }, []);

  const donutData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const d of DEALS_PERDUS) {
      counts[d.motif_principal] = (counts[d.motif_principal] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([motif, count]) => ({
        name: MOTIF_LABELS[motif] || motif,
        value: count,
        color: MOTIF_COLORS[motif] || '#94a3b8',
      }))
      .sort((a, b) => b.value - a.value);
  }, []);

  const barData = useMemo(() => {
    const sums: Record<string, number> = {};
    for (const d of DEALS_PERDUS) {
      sums[d.motif_principal] = (sums[d.motif_principal] || 0) + d.valeur_eur;
    }
    return Object.entries(sums)
      .map(([motif, valeur]) => ({
        name: MOTIF_LABELS[motif] || motif,
        valeur,
        color: MOTIF_COLORS[motif] || '#94a3b8',
      }))
      .sort((a, b) => b.valeur - a.valeur);
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Analyse Motifs Deals Perdus</h1>
        <p className="text-sm text-slate-500 mt-1">Identification des causes de perte et valeur associee</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          label="Total deals perdus"
          value={totals.total}
          icon={<XCircle className="w-5 h-5" />}
          iconColor="text-rose-600 bg-rose-50"
        />
        <KpiCard
          label="Valeur totale perdue"
          value={formatCurrency(totals.valeurTotale)}
          icon={<Banknote className="w-5 h-5" />}
          iconColor="text-amber-600 bg-amber-50"
        />
        <KpiCard
          label="Motif principal"
          value={MOTIF_LABELS[totals.motifTop] || totals.motifTop}
          icon={<Tag className="w-5 h-5" />}
          iconColor="text-indigo-600 bg-indigo-50"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut chart */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Repartition par motif</h2>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  dataKey="value"
                  stroke="#fff"
                  strokeWidth={2}
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {donutData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar chart */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Valeur perdue par motif</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickFormatter={(v) => formatCurrency(v as number)}
                />
                <Tooltip
                  formatter={(value) => [formatCurrency(value as number), 'Valeur perdue']}
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  }}
                />
                <Bar dataKey="valeur" radius={[4, 4, 0, 0]}>
                  {barData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">Detail des deals perdus</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/60">
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Client</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Commercial</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Valeur</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Motif</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Concurrent retenu</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Secteur</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Region</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Verbatim</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((d) => (
                <tr key={d.id} className="border-b border-slate-100 hover:bg-slate-50/40 transition-colors">
                  <td className="px-6 py-3 font-medium text-slate-900">{d.client_name}</td>
                  <td className="px-4 py-3 text-slate-700">{d.commercial_name}</td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-900 tabular-nums">
                    {formatCurrency(d.valeur_eur)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                      style={{
                        backgroundColor: `${MOTIF_COLORS[d.motif_principal]}15`,
                        color: MOTIF_COLORS[d.motif_principal],
                      }}
                    >
                      {MOTIF_LABELS[d.motif_principal] || d.motif_principal}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{d.concurrent_retenu || '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{d.secteur}</td>
                  <td className="px-4 py-3 text-slate-600">{d.region}</td>
                  <td className="px-4 py-3 text-slate-500 tabular-nums">{formatDate(d.date)}</td>
                  <td className="px-6 py-3 text-slate-600 max-w-xs">
                    {d.verbatim ? (
                      <AbbreviationHighlight text={d.verbatim} className="text-sm" />
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
