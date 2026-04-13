// @ts-nocheck
'use client';

import { useState, useMemo } from 'react';
import { useAppData } from '@/lib/data';
import { KpiCard } from '@/components/shared/kpi-card';
import { formatDate } from '@/lib/utils';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { CircleDollarSign, TrendingDown, AlertTriangle } from 'lucide-react';

// Dynamic color palette for competitors — assigned in order of appearance
const COLOR_PALETTE = ['#6366f1', '#f59e0b', '#10b981', '#e11d48', '#8b5cf6', '#06b6d4', '#f43f5e', '#84cc16'];
function getCompetitorColor(name: string, index: number): string {
  return COLOR_PALETTE[index % COLOR_PALETTE.length];
}

type StatutFilter = 'all' | 'gagne' | 'perdu' | 'en_cours';
type ConcurrentFilter = string;

const STATUT_OPTIONS: { key: StatutFilter; label: string }[] = [
  { key: 'all', label: 'Tous' },
  { key: 'gagne', label: 'Gagnes' },
  { key: 'perdu', label: 'Perdus' },
  { key: 'en_cours', label: 'En cours' },
];

export default function MktPrixPage() {
  const { prixSignals: PRIX_SIGNALS, tendancePrix: TENDANCE_PRIX } = useAppData();
  const [statutFilter, setStatutFilter] = useState<StatutFilter>('all');
  const [concurrentFilter, setConcurrentFilter] = useState<ConcurrentFilter>('all');

  const concurrents = useMemo(() => {
    const set = new Set(PRIX_SIGNALS.map((s) => s.concurrent_nom));
    return Array.from(set).sort();
  }, []);

  const ecartMoyen = useMemo(() => {
    const vals = PRIX_SIGNALS.map((s) => s.ecart_pct);
    return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
  }, []);

  const dealsPerdus = useMemo(() => {
    return PRIX_SIGNALS.filter((s) => s.statut_deal === 'perdu').length;
  }, []);

  const chartData = useMemo(() => {
    const semaines = Array.from(new Set(TENDANCE_PRIX.map((t) => t.semaine))).sort();
    return semaines.map((sem) => {
      const row: Record<string, string | number> = { semaine: sem };
      const entries = TENDANCE_PRIX.filter((t) => t.semaine === sem);
      for (const e of entries) {
        row[e.concurrent_nom] = e.ecart_moyen;
      }
      return row;
    });
  }, []);

  const chartConcurrents = useMemo(() => {
    return Array.from(new Set(TENDANCE_PRIX.map((t) => t.concurrent_nom)));
  }, []);

  const filteredSignals = useMemo(() => {
    return PRIX_SIGNALS.filter((s) => {
      if (statutFilter !== 'all' && s.statut_deal !== statutFilter) return false;
      if (concurrentFilter !== 'all' && s.concurrent_nom !== concurrentFilter) return false;
      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [statutFilter, concurrentFilter]);

  const statutBadge = (statut: string) => {
    const config: Record<string, string> = {
      gagne: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      perdu: 'bg-rose-50 text-rose-700 border-rose-200',
      en_cours: 'bg-amber-50 text-amber-700 border-amber-200',
    };
    const labels: Record<string, string> = {
      gagne: 'Gagne',
      perdu: 'Perdu',
      en_cours: 'En cours',
    };
    return (
      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${config[statut] || ''}`}>
        {labels[statut] || statut}
      </span>
    );
  };

  const ecartBadge = (ecart: number, type: string) => {
    const isNeg = type === 'inferieur';
    return (
      <span className={`inline-flex items-center gap-1 text-sm font-semibold tabular-nums ${isNeg ? 'text-rose-600' : 'text-emerald-600'}`}>
        {ecart > 0 ? '+' : ''}{ecart}%
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600">
          <CircleDollarSign className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Radar Prix Concurrentiels</h1>
          <p className="text-sm text-slate-500">Suivi des ecarts de prix detectes par les commerciaux</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          label="Signaux prix ce mois"
          value={PRIX_SIGNALS.length}
          icon={<CircleDollarSign className="w-5 h-5" />}
          iconColor="text-indigo-600 bg-indigo-50"
        />
        <KpiCard
          label="Ecart moyen detecte"
          value={ecartMoyen}
          suffix="%"
          icon={<TrendingDown className="w-5 h-5" />}
          iconColor="text-rose-600 bg-rose-50"
        />
        <KpiCard
          label="Deals perdus sur le prix"
          value={dealsPerdus}
          icon={<AlertTriangle className="w-5 h-5" />}
          iconColor="text-amber-600 bg-amber-50"
        />
      </div>

      {/* Line chart — evolution ecart prix */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Evolution de l&apos;ecart prix par concurrent</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <XAxis
                dataKey="semaine"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '0.75rem',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                }}
                formatter={(value) => [`${value}%`, '']}
              />
              <Legend />
              {chartConcurrents.map((nom, idx) => (
                <Line
                  key={nom}
                  type="monotone"
                  dataKey={nom}
                  stroke={getCompetitorColor(nom, idx)}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider mr-1">Concurrent</span>
        <button
          onClick={() => setConcurrentFilter('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
            concurrentFilter === 'all'
              ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          Tous
        </button>
        {concurrents.map((c) => (
          <button
            key={c}
            onClick={() => setConcurrentFilter(c)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              concurrentFilter === c
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {c}
          </button>
        ))}
        <span className="w-px h-5 bg-slate-200 mx-1" />
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider mr-1">Statut deal</span>
        {STATUT_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            onClick={() => setStatutFilter(opt.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              statutFilter === opt.key
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
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Concurrent</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Ecart</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Client</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Commercial</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Region</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Statut deal</th>
              </tr>
            </thead>
            <tbody>
              {filteredSignals.map((s) => (
                <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-900">{s.concurrent_nom}</td>
                  <td className="px-4 py-3 text-center">{ecartBadge(s.ecart_pct, s.ecart_type)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${
                      s.ecart_type === 'inferieur'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      {s.ecart_type === 'inferieur' ? 'Inferieur' : 'Superieur'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{s.client_name}</td>
                  <td className="px-4 py-3 text-slate-700">{s.commercial_name}</td>
                  <td className="px-4 py-3 text-slate-600">{s.region}</td>
                  <td className="px-4 py-3 text-slate-600 tabular-nums">{formatDate(s.date)}</td>
                  <td className="px-4 py-3 text-center">{statutBadge(s.statut_deal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredSignals.length === 0 && (
          <div className="p-8 text-center text-slate-500">Aucun signal pour les filtres selectionnes.</div>
        )}
      </div>
    </div>
  );
}
