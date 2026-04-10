'use client';

import { useMemo, useState } from 'react';
import { useAppData } from '@/lib/data';
import { ObjectifType, OBJECTIF_LABELS } from '@/lib/types-v2';
import { KpiCard } from '@/components/shared/kpi-card';
import { cn, formatDate } from '@/lib/utils';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { FileText, CheckCircle, XCircle, Target } from 'lucide-react';

const OBJECTIF_TYPE_COLORS: Record<ObjectifType, string> = {
  signature: '#6366f1',
  sell_out: '#0ea5e9',
  sell_in: '#8b5cf6',
  formation: '#f59e0b',
  decouverte: '#10b981',
  fidelisation: '#64748b',
};

const BADGE_STYLES: Record<ObjectifType, string> = {
  signature: 'bg-indigo-50 text-indigo-700',
  sell_out: 'bg-sky-50 text-sky-700',
  sell_in: 'bg-violet-50 text-violet-700',
  formation: 'bg-amber-50 text-amber-700',
  decouverte: 'bg-emerald-50 text-emerald-700',
  fidelisation: 'bg-slate-100 text-slate-700',
};

type FilterType = 'tous' | ObjectifType;

export default function DirClosPage() {
  const { crObjectifs: CR_OBJECTIFS } = useAppData();
  const [filter, setFilter] = useState<FilterType>('tous');

  const filtered = useMemo(
    () => filter === 'tous' ? CR_OBJECTIFS : CR_OBJECTIFS.filter(cr => cr.objectif_type === filter),
    [filter],
  );

  const kpis = useMemo(() => {
    const total = CR_OBJECTIFS.length;
    const atteints = CR_OBJECTIFS.filter(cr => cr.resultat === 'atteint').length;
    const nonAtteints = total - atteints;
    const taux = total > 0 ? Math.round((atteints / total) * 100) : 0;
    return { total, atteints, nonAtteints, taux };
  }, []);

  // Bar chart: taux de reussite par commercial
  const barData = useMemo(() => {
    const grouped: Record<string, { atteint: number; total: number }> = {};
    for (const cr of filtered) {
      if (!grouped[cr.commercial_name]) grouped[cr.commercial_name] = { atteint: 0, total: 0 };
      grouped[cr.commercial_name].total++;
      if (cr.resultat === 'atteint') grouped[cr.commercial_name].atteint++;
    }
    return Object.entries(grouped)
      .map(([name, { atteint, total }]) => ({
        name,
        taux: Math.round((atteint / total) * 100),
        atteint,
        total,
      }))
      .sort((a, b) => b.taux - a.taux);
  }, [filtered]);

  // Donut chart: repartition par type d'objectif
  const donutData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const cr of CR_OBJECTIFS) {
      counts[cr.objectif_type] = (counts[cr.objectif_type] || 0) + 1;
    }
    return Object.entries(counts).map(([type, count]) => ({
      name: OBJECTIF_LABELS[type as ObjectifType],
      value: count,
      type: type as ObjectifType,
    }));
  }, []);

  // Causes de non-atteinte
  const causesData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const cr of CR_OBJECTIFS) {
      if (cr.resultat === 'non_atteint' && cr.cause_echec) {
        counts[cr.cause_echec] = (counts[cr.cause_echec] || 0) + 1;
      }
    }
    return Object.entries(counts)
      .map(([cause, count]) => ({ name: cause, count }))
      .sort((a, b) => b.count - a.count);
  }, []);

  // Facteurs de reussite
  const facteursData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const cr of CR_OBJECTIFS) {
      if (cr.resultat === 'atteint' && cr.facteur_reussite) {
        counts[cr.facteur_reussite] = (counts[cr.facteur_reussite] || 0) + 1;
      }
    }
    return Object.entries(counts)
      .map(([facteur, count]) => ({ name: facteur, count }))
      .sort((a, b) => b.count - a.count);
  }, []);

  // Table rows sorted by date desc
  const tableRows = useMemo(
    () => [...filtered].sort((a, b) => b.date.localeCompare(a.date)),
    [filtered],
  );

  const filterOptions: { key: FilterType; label: string }[] = [
    { key: 'tous', label: 'Tous' },
    ...Object.entries(OBJECTIF_LABELS).map(([k, v]) => ({ key: k as ObjectifType, label: v })),
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Taux d'Atteinte des Objectifs</h1>
        <p className="text-sm text-slate-500 mt-1">Resultats par objectif de visite depuis les CR</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total CR"
          value={kpis.total}
          icon={<FileText className="w-5 h-5" />}
          iconColor="text-indigo-600 bg-indigo-50"
        />
        <KpiCard
          label="Objectifs atteints"
          value={kpis.atteints}
          suffix={`(${kpis.taux}%)`}
          icon={<CheckCircle className="w-5 h-5" />}
          iconColor="text-emerald-600 bg-emerald-50"
        />
        <KpiCard
          label="Non atteints"
          value={kpis.nonAtteints}
          icon={<XCircle className="w-5 h-5" />}
          iconColor="text-rose-600 bg-rose-50"
        />
        <KpiCard
          label="Taux reussite global"
          value={kpis.taux}
          suffix="%"
          icon={<Target className="w-5 h-5" />}
          iconColor="text-amber-600 bg-amber-50"
        />
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2">
        {filterOptions.map(opt => (
          <button
            key={opt.key}
            onClick={() => setFilter(opt.key)}
            className={cn(
              'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
              filter === opt.key
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Taux de reussite par commercial</h2>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={barData} layout="vertical" margin={{ left: 80, right: 20 }}>
              <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#334155', fontSize: 12 }} width={75} />
              <Tooltip
                formatter={((value: any) => [`${value}%`, 'Taux']) as any}
                contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }}
              />
              <Bar dataKey="taux" radius={[0, 4, 4, 0]} maxBarSize={28}>
                {barData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.taux >= 70 ? '#10b981' : entry.taux >= 50 ? '#f59e0b' : '#f43f5e'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" /> &ge;70%</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" /> &ge;50%</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block" /> &lt;50%</span>
          </div>
        </div>

        {/* Donut chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Repartition par type d'objectif</h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={donutData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={3}
                strokeWidth={0}
              >
                {donutData.map((entry, i) => (
                  <Cell key={i} fill={OBJECTIF_TYPE_COLORS[entry.type]} />
                ))}
              </Pie>
              <Tooltip
                formatter={((value: any) => [value, 'CR']) as any}
                contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }}
              />
              <Legend
                verticalAlign="bottom"
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 12, color: '#64748b' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Causes & Facteurs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Causes de non-atteinte */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <XCircle className="w-4 h-4 text-rose-500" />
            <h2 className="text-sm font-semibold text-slate-700">Causes de non-atteinte</h2>
          </div>
          {causesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={causesData.length * 44 + 20}>
              <BarChart data={causesData} layout="vertical" margin={{ left: 140, right: 20 }}>
                <XAxis type="number" allowDecimals={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#334155', fontSize: 12 }} width={135} />
                <Tooltip
                  formatter={((value: any) => [value, 'CR']) as any}
                  contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }}
                />
                <Bar dataKey="count" fill="#f43f5e" radius={[0, 4, 4, 0]} maxBarSize={24} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-slate-400">Aucune cause renseignee.</p>
          )}
        </div>

        {/* Facteurs de reussite */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <h2 className="text-sm font-semibold text-slate-700">Facteurs de reussite</h2>
          </div>
          {facteursData.length > 0 ? (
            <ResponsiveContainer width="100%" height={facteursData.length * 44 + 20}>
              <BarChart data={facteursData} layout="vertical" margin={{ left: 140, right: 20 }}>
                <XAxis type="number" allowDecimals={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#334155', fontSize: 12 }} width={135} />
                <Tooltip
                  formatter={((value: any) => [value, 'CR']) as any}
                  contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }}
                />
                <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} maxBarSize={24} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-slate-400">Aucun facteur renseigne.</p>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                <th className="text-left py-3 px-4 font-semibold text-slate-600">Commercial</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-600">Type objectif</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-600">Resultat</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-600">Client</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-600">Date</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-600">Region</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-600">Detail</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map(cr => (
                <tr key={cr.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-4 font-medium text-slate-800">{cr.commercial_name}</td>
                  <td className="py-3 px-4">
                    <span className={cn('inline-block px-2 py-0.5 rounded-full text-xs font-medium', BADGE_STYLES[cr.objectif_type])}>
                      {OBJECTIF_LABELS[cr.objectif_type]}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                        cr.resultat === 'atteint'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-rose-50 text-rose-700',
                      )}
                    >
                      {cr.resultat === 'atteint'
                        ? <CheckCircle className="w-3 h-3" />
                        : <XCircle className="w-3 h-3" />}
                      {cr.resultat === 'atteint' ? 'Atteint' : 'Non atteint'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{cr.client_name}</td>
                  <td className="py-3 px-4 text-slate-500 tabular-nums">{formatDate(cr.date)}</td>
                  <td className="py-3 px-4 text-slate-500">{cr.region}</td>
                  <td className="py-3 px-4 text-slate-500 text-xs max-w-[200px]">
                    {cr.resultat === 'non_atteint' && cr.cause_echec && (
                      <span className="text-rose-600">{cr.cause_echec}</span>
                    )}
                    {cr.resultat === 'atteint' && cr.facteur_reussite && (
                      <span className="text-emerald-600">{cr.facteur_reussite}</span>
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
