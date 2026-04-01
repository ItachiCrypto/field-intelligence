'use client';

import { useState, useMemo } from 'react';
import { DEALS_ANALYSE, DEAL_TENDANCE } from '@/lib/seed-data-v2';
import { MOTIF_LABELS, MOTIF_COLORS } from '@/lib/types-v2';
import type { DealMotif } from '@/lib/types-v2';
import { cn, formatDate } from '@/lib/utils';
import { KpiCard } from '@/components/shared/kpi-card';
import { AbbreviationHighlight } from '@/components/shared/abbreviation-highlight';
import {
  PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Target, TrendingUp, TrendingDown, Percent } from 'lucide-react';

type ResultatFilter = 'all' | 'gagne' | 'perdu';
type MotifFilter = 'all' | DealMotif;

const RESULTAT_OPTIONS: { key: ResultatFilter; label: string }[] = [
  { key: 'all', label: 'Tous' },
  { key: 'gagne', label: 'Gagnes' },
  { key: 'perdu', label: 'Perdus' },
];

const ALL_MOTIFS: DealMotif[] = ['prix', 'produit', 'offre', 'timing', 'concurrent', 'relation', 'budget', 'autre'];

// Static weekly % data for gagne deals
const GAGNE_TENDANCE = [
  { semaine: 'S11', relation: 45, produit: 30, prix: 15, autre: 10 },
  { semaine: 'S12', relation: 40, produit: 25, prix: 25, autre: 10 },
  { semaine: 'S13', relation: 50, produit: 20, prix: 20, autre: 10 },
  { semaine: 'S14', relation: 35, produit: 30, prix: 25, autre: 10 },
];

const GAGNE_LINE_MOTIFS: DealMotif[] = ['relation', 'produit', 'prix', 'autre'];

export default function MktDealPage() {
  const [resultatFilter, setResultatFilter] = useState<ResultatFilter>('all');
  const [motifFilter, setMotifFilter] = useState<MotifFilter>('all');

  const totalDeals = DEALS_ANALYSE.length;
  const gagnes = useMemo(() => DEALS_ANALYSE.filter((d) => d.resultat === 'gagne'), []);
  const perdus = useMemo(() => DEALS_ANALYSE.filter((d) => d.resultat === 'perdu'), []);
  const tauxConversion = totalDeals > 0 ? ((gagnes.length / totalDeals) * 100).toFixed(0) : '0';

  // Donut gagnes: % par motif
  const donutGagne = useMemo(() => {
    const counts: Partial<Record<DealMotif, number>> = {};
    gagnes.forEach((d) => {
      counts[d.motif_principal] = (counts[d.motif_principal] || 0) + 1;
    });
    const total = gagnes.length || 1;
    return Object.entries(counts)
      .map(([motif, count]) => ({
        name: MOTIF_LABELS[motif as DealMotif],
        value: Math.round((count! / total) * 100),
        motif: motif as DealMotif,
      }))
      .sort((a, b) => b.value - a.value);
  }, [gagnes]);

  // Donut perdus: % par motif
  const donutPerdu = useMemo(() => {
    const counts: Partial<Record<DealMotif, number>> = {};
    perdus.forEach((d) => {
      counts[d.motif_principal] = (counts[d.motif_principal] || 0) + 1;
    });
    const total = perdus.length || 1;
    return Object.entries(counts)
      .map(([motif, count]) => ({
        name: MOTIF_LABELS[motif as DealMotif],
        value: Math.round((count! / total) * 100),
        motif: motif as DealMotif,
      }))
      .sort((a, b) => b.value - a.value);
  }, [perdus]);

  // Perdu tendance: compute % from DEAL_TENDANCE
  const perduTendance = useMemo(() => {
    return DEAL_TENDANCE.map((w) => {
      const total = ALL_MOTIFS.reduce((sum, m) => sum + w[m], 0) || 1;
      const row: Record<string, number | string> = { semaine: w.semaine };
      ALL_MOTIFS.forEach((m) => {
        row[m] = Math.round((w[m] / total) * 100);
      });
      return row;
    });
  }, []);

  const perduLineMotifs = useMemo(() => {
    const motifs = new Set<DealMotif>();
    DEAL_TENDANCE.forEach((w) => {
      ALL_MOTIFS.forEach((m) => {
        if (w[m] > 0) motifs.add(m);
      });
    });
    return Array.from(motifs);
  }, []);

  // Filtered table
  const filteredDeals = useMemo(() => {
    return DEALS_ANALYSE
      .filter((d) => resultatFilter === 'all' || d.resultat === resultatFilter)
      .filter((d) => motifFilter === 'all' || d.motif_principal === motifFilter)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [resultatFilter, motifFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 text-slate-700">
          <Target className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Analyse Deals Gagnes / Perdus</h1>
          <p className="text-sm text-slate-500">Repartition en % des motifs extraits des comptes rendus de visite</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total deals"
          value={totalDeals}
          icon={<Target className="w-5 h-5" />}
          iconColor="text-slate-600 bg-slate-100"
        />
        <KpiCard
          label="Gagnes"
          value={gagnes.length}
          icon={<TrendingUp className="w-5 h-5" />}
          iconColor="text-emerald-600 bg-emerald-50"
        />
        <KpiCard
          label="Perdus"
          value={perdus.length}
          icon={<TrendingDown className="w-5 h-5" />}
          iconColor="text-rose-600 bg-rose-50"
        />
        <KpiCard
          label="Taux de conversion"
          value={tauxConversion}
          suffix="%"
          icon={<Percent className="w-5 h-5" />}
          iconColor="text-slate-600 bg-slate-100"
        />
      </div>

      {/* Two-column charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: Deals gagnes */}
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-slate-900">Deals gagnes</h2>

          {/* Donut gagnes */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Repartition par motif (%)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutGagne}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                    strokeWidth={0}
                  >
                    {donutGagne.map((entry) => (
                      <Cell key={entry.motif} fill={MOTIF_COLORS[entry.motif]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: '0.75rem',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    }}
                    formatter={((value: any) => [`${value}%`, '']) as any}
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

          {/* Line chart gagnes */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Evolution hebdo des motifs gagnes (%)</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={GAGNE_TENDANCE} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <XAxis dataKey="semaine" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    domain={[0, 60]}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '0.75rem',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    }}
                    formatter={((value: any, name: any) => [`${value}%`, MOTIF_LABELS[name as DealMotif] || name]) as any}
                  />
                  {GAGNE_LINE_MOTIFS.map((motif) => (
                    <Line
                      key={motif}
                      type="monotone"
                      dataKey={motif}
                      name={motif}
                      stroke={MOTIF_COLORS[motif]}
                      strokeWidth={2}
                      dot={{ r: 3, fill: MOTIF_COLORS[motif] }}
                      activeDot={{ r: 5 }}
                    />
                  ))}
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => <span className="text-xs text-slate-600">{MOTIF_LABELS[value as DealMotif] || value}</span>}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* RIGHT: Deals perdus */}
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-slate-900">Deals perdus</h2>

          {/* Donut perdus */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Repartition par motif (%)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutPerdu}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                    strokeWidth={0}
                  >
                    {donutPerdu.map((entry) => (
                      <Cell key={entry.motif} fill={MOTIF_COLORS[entry.motif]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: '0.75rem',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    }}
                    formatter={((value: any) => [`${value}%`, '']) as any}
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

          {/* Line chart perdus */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Evolution hebdo des motifs perdus (%)</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={perduTendance} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <XAxis dataKey="semaine" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    domain={[0, 60]}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '0.75rem',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    }}
                    formatter={((value: any, name: any) => [`${value}%`, MOTIF_LABELS[name as DealMotif] || name]) as any}
                  />
                  {perduLineMotifs.map((motif) => (
                    <Line
                      key={motif}
                      type="monotone"
                      dataKey={motif}
                      name={motif}
                      stroke={MOTIF_COLORS[motif]}
                      strokeWidth={2}
                      dot={{ r: 3, fill: MOTIF_COLORS[motif] }}
                      activeDot={{ r: 5 }}
                    />
                  ))}
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => <span className="text-xs text-slate-600">{MOTIF_LABELS[value as DealMotif] || value}</span>}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider mr-1">Resultat</span>
          {RESULTAT_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setResultatFilter(opt.key)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                resultatFilter === opt.key
                  ? 'bg-slate-800 text-white border-slate-800'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider mr-1">Motif</span>
          <button
            onClick={() => setMotifFilter('all')}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
              motifFilter === 'all'
                ? 'bg-slate-800 text-white border-slate-800'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            )}
          >
            Tous
          </button>
          {ALL_MOTIFS.map((m) => (
            <button
              key={m}
              onClick={() => setMotifFilter(m)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                motifFilter === m
                  ? 'text-white border-transparent'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              )}
              style={motifFilter === m ? { backgroundColor: MOTIF_COLORS[m] } : undefined}
            >
              {MOTIF_LABELS[m]}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/60 border-b border-slate-100">
                <th className="text-center px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Motif</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Resultat</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Concurrent</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Client</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Commercial</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Region</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Verbatim</th>
              </tr>
            </thead>
            <tbody>
              {filteredDeals.map((d) => (
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
                  <td className="px-4 py-3 text-center">
                    <span className={cn(
                      'inline-flex px-2 py-0.5 rounded-full text-xs font-medium border',
                      d.resultat === 'gagne'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    )}>
                      {d.resultat === 'gagne' ? 'Gagne' : 'Perdu'}
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
        {filteredDeals.length === 0 && (
          <div className="p-8 text-center text-slate-500">Aucun deal pour les filtres selectionnes.</div>
        )}
      </div>
    </div>
  );
}
