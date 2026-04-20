// @ts-nocheck
'use client';

import { useMemo, useState } from 'react';
import { useAppData } from '@/lib/data';
import { KpiCard } from '@/components/shared/kpi-card';
import { formatDate } from '@/lib/utils';
import type { OffreType, OffreConcurrente } from '@/lib/types-v2';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import {
  Package, AlertCircle, ShieldAlert, ChevronDown, Sparkles, Flame,
} from 'lucide-react';

const OFFRE_TYPE_LABELS: Record<OffreType, string> = {
  bundle: 'Bundle',
  promotion: 'Promotion',
  nouvelle_gamme: 'Nouvelle gamme',
  conditions_paiement: 'Conditions paiement',
  essai_gratuit: 'Essai gratuit',
  autre: 'Autre',
};

const OFFRE_TYPE_COLORS: Record<OffreType, { bg: string; text: string; border: string; dot: string }> = {
  bundle: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', dot: 'bg-violet-500' },
  promotion: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500' },
  nouvelle_gamme: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', dot: 'bg-sky-500' },
  conditions_paiement: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
  essai_gratuit: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  autre: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', dot: 'bg-slate-400' },
};

const BAR_COLORS = ['#6366f1', '#e11d48', '#f59e0b', '#10b981', '#8b5cf6'];

// Une offre est "nouvelle" si la premiere mention remonte a moins de 30 jours.
const NEW_OFFRE_WINDOW_MS = 30 * 86400 * 1000;

type CompetitorCard = {
  concurrent_nom: string;
  offres: OffreConcurrente[];
  offresActives: number;
  nouvelles: number;
  typeCounts: Map<OffreType, number>;
  dealsImpactes: number;
  dealsPerdus: number;
  dealsGagnes: number;
  totalMentions: number;
};

export default function MktOffrePage() {
  const { offresConcurrentes: OFFRES_CONCURRENTES } = useAppData();
  const [expanded, setExpanded] = useState<string | null>(null);

  const offresActivesGlobal = useMemo(
    () => OFFRES_CONCURRENTES.filter((o) => o.statut === 'active').length,
    [OFFRES_CONCURRENTES],
  );
  const totalImpactes = useMemo(
    () => OFFRES_CONCURRENTES.reduce((acc, o) => acc + o.deals_impactes, 0),
    [OFFRES_CONCURRENTES],
  );
  const totalPerdus = useMemo(
    () => OFFRES_CONCURRENTES.reduce((acc, o) => acc + o.deals_perdus, 0),
    [OFFRES_CONCURRENTES],
  );

  // Regroupement par concurrent : aggregat KPI + liste des offres triees par mentions.
  const cards: CompetitorCard[] = useMemo(() => {
    const now = Date.now();
    const map = new Map<string, CompetitorCard>();
    for (const o of OFFRES_CONCURRENTES) {
      if (!map.has(o.concurrent_nom)) {
        map.set(o.concurrent_nom, {
          concurrent_nom: o.concurrent_nom,
          offres: [],
          offresActives: 0,
          nouvelles: 0,
          typeCounts: new Map(),
          dealsImpactes: 0,
          dealsPerdus: 0,
          dealsGagnes: 0,
          totalMentions: 0,
        });
      }
      const c = map.get(o.concurrent_nom)!;
      c.offres.push(o);
      if (o.statut === 'active') c.offresActives++;
      const firstSeen = new Date(o.date_premiere_mention).getTime();
      if (!Number.isNaN(firstSeen) && now - firstSeen <= NEW_OFFRE_WINDOW_MS) c.nouvelles++;
      c.typeCounts.set(o.type_offre, (c.typeCounts.get(o.type_offre) || 0) + 1);
      c.dealsImpactes += o.deals_impactes;
      c.dealsPerdus += o.deals_perdus;
      c.dealsGagnes += o.deals_gagnes;
      c.totalMentions += o.count_mentions;
    }
    return Array.from(map.values())
      .map((c) => ({
        ...c,
        offres: [...c.offres].sort((a, b) => b.count_mentions - a.count_mentions),
      }))
      .sort((a, b) => b.totalMentions - a.totalMentions);
  }, [OFFRES_CONCURRENTES]);

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
          value={offresActivesGlobal}
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

      {/* Cards par concurrent */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-900">Par concurrent</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {cards.map((c) => {
            const isOpen = expanded === c.concurrent_nom;
            return (
              <div
                key={c.concurrent_nom}
                className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col"
              >
                {/* Header concurrent */}
                <div className="px-5 pt-4 pb-3 border-b border-slate-100 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-900 truncate">{c.concurrent_nom}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {c.offres.length} offre{c.offres.length > 1 ? 's' : ''} •{' '}
                      {c.offresActives} active{c.offresActives > 1 ? 's' : ''}
                    </p>
                  </div>
                  {c.nouvelles > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                      <Sparkles className="w-3 h-3" />
                      {c.nouvelles} nouvelle{c.nouvelles > 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                {/* Metrics grid */}
                <div className="grid grid-cols-3 divide-x divide-slate-100 text-center">
                  <div className="py-3">
                    <div className="text-lg font-bold text-slate-900 tabular-nums">{c.totalMentions}</div>
                    <div className="text-[11px] text-slate-500 uppercase tracking-wider">Mentions</div>
                  </div>
                  <div className="py-3">
                    <div className="text-lg font-bold text-amber-700 tabular-nums">{c.dealsImpactes}</div>
                    <div className="text-[11px] text-slate-500 uppercase tracking-wider">Impactes</div>
                  </div>
                  <div className="py-3">
                    <div className="text-lg font-bold text-rose-700 tabular-nums">{c.dealsPerdus}</div>
                    <div className="text-[11px] text-slate-500 uppercase tracking-wider">Perdus</div>
                  </div>
                </div>

                {/* Types offres */}
                <div className="px-5 py-3 border-t border-slate-100">
                  <div className="text-[11px] text-slate-500 uppercase tracking-wider mb-2">Types d&apos;offre</div>
                  <div className="flex flex-wrap gap-1.5">
                    {Array.from(c.typeCounts.entries())
                      .sort((a, b) => b[1] - a[1])
                      .map(([type, n]) => {
                        const cfg = OFFRE_TYPE_COLORS[type];
                        return (
                          <span
                            key={type}
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.text} ${cfg.border}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                            {OFFRE_TYPE_LABELS[type]}
                            <span className="text-[10px] opacity-70 tabular-nums">×{n}</span>
                          </span>
                        );
                      })}
                  </div>
                </div>

                {/* Expand button */}
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : c.concurrent_nom)}
                  className="mt-auto px-5 py-2.5 border-t border-slate-100 text-xs font-medium text-indigo-600 hover:bg-indigo-50/50 transition-colors flex items-center justify-center gap-1"
                >
                  {isOpen ? 'Masquer le detail' : `Voir les ${c.offres.length} offre${c.offres.length > 1 ? 's' : ''}`}
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {/* Liste detaillee */}
                {isOpen && (
                  <div className="border-t border-slate-100 divide-y divide-slate-100">
                    {c.offres.map((o) => {
                      const cfg = OFFRE_TYPE_COLORS[o.type_offre];
                      return (
                        <div key={o.id} className="px-5 py-3 space-y-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.text} ${cfg.border}`}
                            >
                              {OFFRE_TYPE_LABELS[o.type_offre]}
                            </span>
                            <span
                              className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                                o.statut === 'active'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-slate-100 text-slate-500 border-slate-200'
                              }`}
                            >
                              {o.statut === 'active' ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <p className="text-sm text-slate-700">{o.description}</p>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                            <span className="flex items-center gap-1">
                              <Flame className="w-3 h-3" /> {o.count_mentions} mention{o.count_mentions > 1 ? 's' : ''}
                            </span>
                            <span className="text-amber-700">{o.deals_impactes} impactes</span>
                            <span className="text-rose-700">{o.deals_perdus} perdus</span>
                            {o.deals_gagnes > 0 && <span className="text-emerald-700">{o.deals_gagnes} gagnes</span>}
                            <span className="tabular-nums">1re : {formatDate(o.date_premiere_mention)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {cards.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500 text-sm">
            Aucune offre concurrente detectee.
          </div>
        )}
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
