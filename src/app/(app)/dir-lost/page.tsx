'use client';

import { useState, useMemo } from 'react';
import { DEALS_COMMERCIAUX, DEAL_COMMERCIAL_TENDANCE } from '@/lib/seed-data-v2';
import { MOTIF_COMMERCIAL_LABELS, MOTIF_COMMERCIAL_COLORS } from '@/lib/types-v2';
import type { MotifCommercial } from '@/lib/types-v2';
import { cn, formatDate } from '@/lib/utils';
import { KpiCard } from '@/components/shared/kpi-card';
import { AbbreviationHighlight } from '@/components/shared/abbreviation-highlight';
import {
  PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Target, TrendingUp, TrendingDown, Percent } from 'lucide-react';

const ALL_MOTIFS: MotifCommercial[] = [
  'prix_non_competitif', 'timing_rate', 'concurrent_mieux_positionne',
  'relation_insuffisante', 'besoin_mal_identifie', 'suivi_insuffisant',
];

type ResultatFilter = 'tous' | 'gagne' | 'perdu';

const RESULTAT_OPTIONS: { key: ResultatFilter; label: string }[] = [
  { key: 'tous', label: 'Tous' },
  { key: 'gagne', label: 'Gagnes' },
  { key: 'perdu', label: 'Perdus' },
];

export default function DirLostPage() {
  const [resultatFilter, setResultatFilter] = useState<ResultatFilter>('tous');

  const totalDeals = DEALS_COMMERCIAUX.length;
  const gagnes = useMemo(() => DEALS_COMMERCIAUX.filter(d => d.resultat === 'gagne'), []);
  const perdus = useMemo(() => DEALS_COMMERCIAUX.filter(d => d.resultat === 'perdu'), []);
  const tauxConversion = totalDeals > 0 ? Math.round((gagnes.length / totalDeals) * 100) : 0;

  // Donut gagnes: % par motif
  const donutGagne = useMemo(() => {
    const counts: Partial<Record<MotifCommercial, number>> = {};
    gagnes.forEach(d => {
      counts[d.motif] = (counts[d.motif] || 0) + 1;
    });
    const total = gagnes.length || 1;
    return Object.entries(counts)
      .map(([motif, count]) => ({
        name: MOTIF_COMMERCIAL_LABELS[motif as MotifCommercial],
        value: Math.round((count! / total) * 100),
        motif: motif as MotifCommercial,
      }))
      .sort((a, b) => b.value - a.value);
  }, [gagnes]);

  // Donut perdus: % par motif
  const donutPerdu = useMemo(() => {
    const counts: Partial<Record<MotifCommercial, number>> = {};
    perdus.forEach(d => {
      counts[d.motif] = (counts[d.motif] || 0) + 1;
    });
    const total = perdus.length || 1;
    return Object.entries(counts)
      .map(([motif, count]) => ({
        name: MOTIF_COMMERCIAL_LABELS[motif as MotifCommercial],
        value: Math.round((count! / total) * 100),
        motif: motif as MotifCommercial,
      }))
      .sort((a, b) => b.value - a.value);
  }, [perdus]);

  // Top motif description for gagnes
  const topGagneDescription = useMemo(() => {
    if (donutGagne.length === 0) return '';
    const topMotif = donutGagne[0].motif;
    const topDeal = gagnes.find(d => d.motif === topMotif);
    return topDeal ? topDeal.verbatim : '';
  }, [donutGagne, gagnes]);

  // Top motif description for perdus
  const topPerduDescription = useMemo(() => {
    if (donutPerdu.length === 0) return '';
    const topMotif = donutPerdu[0].motif;
    const topDeal = perdus.find(d => d.motif === topMotif);
    return topDeal ? topDeal.verbatim : '';
  }, [donutPerdu, perdus]);

  // Line chart: evolution deals perdus par motif (% of total that week)
  const lineTendance = useMemo(() => {
    return DEAL_COMMERCIAL_TENDANCE.map(w => {
      const total = ALL_MOTIFS.reduce((sum, m) => sum + w[m], 0) || 1;
      const row: Record<string, number | string> = { semaine: w.semaine };
      ALL_MOTIFS.forEach(m => {
        row[m] = Math.round((w[m] / total) * 100);
      });
      return row;
    });
  }, []);

  // Only show motifs that have data
  const activeLineMotifs = useMemo(() => {
    const motifs = new Set<MotifCommercial>();
    DEAL_COMMERCIAL_TENDANCE.forEach(w => {
      ALL_MOTIFS.forEach(m => {
        if (w[m] > 0) motifs.add(m);
      });
    });
    return Array.from(motifs);
  }, []);

  // Filtered table
  const filteredDeals = useMemo(() => {
    return DEALS_COMMERCIAUX
      .filter(d => resultatFilter === 'tous' || d.resultat === resultatFilter)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [resultatFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Analyse Deals Commerciaux</h1>
        <p className="text-sm text-slate-500 mt-1">Motifs commerciaux extraits des CR de visite</p>
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

      {/* Two-column donuts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: Deals gagnes */}
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-slate-900">Deals gagnes</h2>
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
                    {donutGagne.map(entry => (
                      <Cell key={entry.motif} fill={MOTIF_COMMERCIAL_COLORS[entry.motif]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '0.75rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
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
            {topGagneDescription && (
              <p className="text-xs text-slate-500 mt-3 italic border-t border-slate-100 pt-3">
                Motif #1 : {donutGagne[0]?.name} -- "{topGagneDescription}"
              </p>
            )}
          </div>
        </div>

        {/* RIGHT: Deals perdus */}
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-slate-900">Deals perdus</h2>
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
                    {donutPerdu.map(entry => (
                      <Cell key={entry.motif} fill={MOTIF_COMMERCIAL_COLORS[entry.motif]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '0.75rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
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
            {topPerduDescription && (
              <p className="text-xs text-slate-500 mt-3 italic border-t border-slate-100 pt-3">
                Motif #1 : {donutPerdu[0]?.name} -- "{topPerduDescription}"
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Line chart: evolution deals perdus par motif */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Evolution deals perdus par motif (%)</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineTendance} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <XAxis dataKey="semaine" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                domain={[0, 80]}
                tickFormatter={v => `${v}%`}
              />
              <Tooltip
                contentStyle={{ borderRadius: '0.75rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
                formatter={((value: any, name: any) => [`${value}%`, MOTIF_COMMERCIAL_LABELS[name as MotifCommercial] || name]) as any}
              />
              {activeLineMotifs.map(motif => (
                <Line
                  key={motif}
                  type="monotone"
                  dataKey={motif}
                  name={motif}
                  stroke={MOTIF_COMMERCIAL_COLORS[motif]}
                  strokeWidth={2}
                  dot={{ r: 3, fill: MOTIF_COMMERCIAL_COLORS[motif] }}
                  activeDot={{ r: 5 }}
                />
              ))}
              <Legend
                verticalAlign="bottom"
                iconType="circle"
                iconSize={8}
                formatter={(value) => <span className="text-xs text-slate-600">{MOTIF_COMMERCIAL_LABELS[value as MotifCommercial] || value}</span>}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex items-center gap-2 flex-wrap">
        {RESULTAT_OPTIONS.map(opt => (
          <button
            key={opt.key}
            onClick={() => setResultatFilter(opt.key)}
            className={cn(
              'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
              resultatFilter === opt.key
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
            )}
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
              {filteredDeals.map(d => (
                <tr key={d.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 text-center">
                    <span
                      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                      style={{
                        backgroundColor: `${MOTIF_COMMERCIAL_COLORS[d.motif]}15`,
                        color: MOTIF_COMMERCIAL_COLORS[d.motif],
                      }}
                    >
                      {MOTIF_COMMERCIAL_LABELS[d.motif]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn(
                      'inline-flex px-2 py-0.5 rounded-full text-xs font-medium border',
                      d.resultat === 'gagne'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200',
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
          <div className="p-8 text-center text-slate-500">Aucun deal pour ce filtre.</div>
        )}
      </div>
    </div>
  );
}
