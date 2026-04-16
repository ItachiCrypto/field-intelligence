// @ts-nocheck
'use client';

import { useState, useMemo } from 'react';
import { useAppData } from '@/lib/data';
import { KpiCard } from '@/components/shared/kpi-card';
import { formatDate } from '@/lib/utils';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, Cell,
} from 'recharts';
import { CircleDollarSign, TrendingDown, AlertTriangle, Percent } from 'lucide-react';

const DEAL_MOTIF_LABELS: Record<string, string> = {
  prix: 'Prix',
  produit: 'Produit',
  offre: 'Offre',
  timing: 'Timing',
  concurrent: 'Concurrent',
  relation: 'Relation',
  budget: 'Budget',
  autre: 'Autre',
};

const DEAL_MOTIF_COLORS: Record<string, string> = {
  prix: '#e11d48',
  produit: '#6366f1',
  offre: '#0ea5e9',
  timing: '#f59e0b',
  concurrent: '#ef4444',
  relation: '#8b5cf6',
  budget: '#64748b',
  autre: '#94a3b8',
};

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
  const { prixSignals: PRIX_SIGNALS, tendancePrix: TENDANCE_PRIX, dealsAnalyse: DEALS_ANALYSE } = useAppData();
  const [statutFilter, setStatutFilter] = useState<StatutFilter>('all');
  const [concurrentFilter, setConcurrentFilter] = useState<ConcurrentFilter>('all');

  const concurrents = useMemo(() => {
    const set = new Set(PRIX_SIGNALS.map((s) => s.concurrent_nom));
    return Array.from(set).sort();
  }, [PRIX_SIGNALS]);

  const ecartMoyen = useMemo(() => {
    const vals = PRIX_SIGNALS.map((s) => s.ecart_pct);
    if (vals.length === 0) return '0';
    return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
  }, [PRIX_SIGNALS]);

  const dealsPerdus = useMemo(() => {
    return PRIX_SIGNALS.filter((s) => s.statut_deal === 'perdu').length;
  }, [PRIX_SIGNALS]);

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
  }, [TENDANCE_PRIX]);

  const chartConcurrents = useMemo(() => {
    return Array.from(new Set(TENDANCE_PRIX.map((t) => t.concurrent_nom)));
  }, [TENDANCE_PRIX]);

  // Remises accordees par commercial vs raison evoquee.
  // Une "remise" est un signal ou nous etions plus chers (ecart_type=inferieur) ET le deal a ete gagne
  // OU est encore en cours — signe que le commercial a (ou va) aligner son prix.
  // La "raison" est reconstituee depuis dealsAnalyse (motif_principal) via jointure commercial_name + client_name.
  const remisesParCommercial = useMemo(() => {
    const byCommercial = new Map<string, {
      commercial: string;
      signaux: any[];
      motifs: Record<string, number>;
    }>();
    for (const s of PRIX_SIGNALS || []) {
      if (s.ecart_type !== 'inferieur') continue; // on ne garde que les cas ou une remise est necessaire
      if (s.statut_deal === 'perdu') continue; // deal perdu = pas de remise accordee
      const key = s.commercial_name || '—';
      if (!byCommercial.has(key)) byCommercial.set(key, { commercial: key, signaux: [], motifs: {} });
      byCommercial.get(key)!.signaux.push(s);
    }
    // Joindre avec dealsAnalyse pour extraire la raison evoquee
    for (const entry of byCommercial.values()) {
      for (const s of entry.signaux) {
        const deal = (DEALS_ANALYSE || []).find((d: any) =>
          d.commercial_name === s.commercial_name &&
          d.client_name === s.client_name
        );
        if (deal?.motif_principal) {
          entry.motifs[deal.motif_principal] = (entry.motifs[deal.motif_principal] || 0) + 1;
        }
      }
    }
    return Array.from(byCommercial.values())
      .map((e) => {
        const ecartMoy = e.signaux.length > 0
          ? e.signaux.reduce((acc, s) => acc + Math.abs(s.ecart_pct), 0) / e.signaux.length
          : 0;
        const motifEntries = Object.entries(e.motifs).sort((a, b) => b[1] - a[1]);
        const motifPrincipal = motifEntries[0]?.[0] || null;
        return {
          commercial: e.commercial,
          nbRemises: e.signaux.length,
          ecartMoy: Math.round(ecartMoy * 10) / 10,
          motifPrincipal,
          motifs: motifEntries,
        };
      })
      .sort((a, b) => b.ecartMoy - a.ecartMoy);
  }, [PRIX_SIGNALS, DEALS_ANALYSE]);

  const filteredSignals = useMemo(() => {
    return PRIX_SIGNALS.filter((s) => {
      if (statutFilter !== 'all' && s.statut_deal !== statutFilter) return false;
      if (concurrentFilter !== 'all' && s.concurrent_nom !== concurrentFilter) return false;
      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [PRIX_SIGNALS, statutFilter, concurrentFilter]);

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

      {/* Remises accordees par commercial vs raison evoquee */}
      {remisesParCommercial.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-1">
            <Percent className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-semibold text-slate-900">Remises accordees par commercial vs raison evoquee</h2>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Pour chaque commercial, remise moyenne (valeur absolue de l&apos;ecart prix) sur les deals ou nous etions plus chers, et raison dominante citee dans le CR.
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Bar chart : % remise moyen par commercial, colore par motif dominant */}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={remisesParCommercial} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <XAxis dataKey="commercial" axisLine={false} tickLine={false} tick={{ fill: '#334155', fontSize: 11, fontWeight: 500 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(v) => `${v}%`} />
                  <Tooltip
                    contentStyle={{ borderRadius: '0.75rem', border: '1px solid #e2e8f0', fontSize: 12 }}
                    formatter={(value: number, _name: string, props: any) => {
                      const motif = props?.payload?.motifPrincipal;
                      return [`${value}%${motif ? ` — ${DEAL_MOTIF_LABELS[motif] || motif}` : ''}`, 'Remise moyenne'];
                    }}
                  />
                  <Bar dataKey="ecartMoy" radius={[6, 6, 0, 0]} maxBarSize={48}>
                    {remisesParCommercial.map((r, idx) => (
                      <Cell
                        key={idx}
                        fill={r.motifPrincipal ? (DEAL_MOTIF_COLORS[r.motifPrincipal] || '#6366f1') : '#cbd5e1'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* Tableau detaille */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50/60 border-b border-slate-100">
                    <th className="text-left px-3 py-2 text-xs font-medium text-slate-500 uppercase tracking-wider">Commercial</th>
                    <th className="text-center px-3 py-2 text-xs font-medium text-slate-500 uppercase tracking-wider">Nb remises</th>
                    <th className="text-center px-3 py-2 text-xs font-medium text-slate-500 uppercase tracking-wider">Remise moy.</th>
                    <th className="text-left px-3 py-2 text-xs font-medium text-slate-500 uppercase tracking-wider">Raison(s) evoquee(s)</th>
                  </tr>
                </thead>
                <tbody>
                  {remisesParCommercial.map((r) => (
                    <tr key={r.commercial} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                      <td className="px-3 py-2 font-medium text-slate-900">{r.commercial}</td>
                      <td className="px-3 py-2 text-center tabular-nums text-slate-700">{r.nbRemises}</td>
                      <td className="px-3 py-2 text-center tabular-nums font-semibold text-rose-600">-{r.ecartMoy}%</td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-1">
                          {r.motifs.length === 0 ? (
                            <span className="text-xs text-slate-400">--</span>
                          ) : (
                            r.motifs.slice(0, 3).map(([motif, count]) => (
                              <span
                                key={motif}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border"
                                style={{
                                  backgroundColor: (DEAL_MOTIF_COLORS[motif] || '#64748b') + '1a',
                                  color: DEAL_MOTIF_COLORS[motif] || '#64748b',
                                  borderColor: (DEAL_MOTIF_COLORS[motif] || '#64748b') + '40',
                                }}
                              >
                                {DEAL_MOTIF_LABELS[motif] || motif} ({count})
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

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
