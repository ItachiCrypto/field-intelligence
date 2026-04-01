'use client';

import { useMemo } from 'react';
import { TERRITOIRES } from '@/lib/seed-data-v2';
import type { TerritoireSynthese, SentimentType } from '@/lib/types-v2';
import { cn } from '@/lib/utils';
import { KpiCard } from '@/components/shared/kpi-card';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import {
  Rocket, Shield, Search, Users, MapPin,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function sentimentBadge(sentiment: SentimentType) {
  const cfg: Record<SentimentType, { cls: string; label: string }> = {
    positif: { cls: 'bg-emerald-50 text-emerald-700', label: 'Positif' },
    negatif: { cls: 'bg-rose-50 text-rose-700', label: 'Negatif' },
    neutre: { cls: 'bg-slate-100 text-slate-600', label: 'Neutre' },
    interesse: { cls: 'bg-amber-50 text-amber-700', label: 'Interesse' },
  };
  const c = cfg[sentiment];
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', c.cls)}>
      {c.label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export default function DirTerrPage() {

  /* --- KPI computations --- */
  const kpiOpportunites = useMemo(
    () => TERRITOIRES.filter((t) => t.nb_opportunites >= 3).length,
    [],
  );
  const kpiSecuriser = useMemo(
    () => TERRITOIRES.filter((t) => t.nb_risques_perte >= 3).length,
    [],
  );
  const kpiSousExploitees = useMemo(
    () => TERRITOIRES.filter((t) => (t.nb_opportunites / t.nb_cr) > 0.05 && t.nb_cr < 50).length,
    [],
  );

  /* --- Bar chart data: nb_cr par region, sorted desc --- */
  const chartData = useMemo(
    () =>
      [...TERRITOIRES]
        .sort((a, b) => b.nb_cr - a.nb_cr)
        .map((t) => ({ name: t.territoire, cr: t.nb_cr })),
    [],
  );

  /* --- Section 1: Ou aller chercher du business --- */
  const regionsOpportunites = useMemo(
    () =>
      [...TERRITOIRES]
        .filter((t) => t.nb_opportunites >= 2)
        .sort((a, b) => b.nb_opportunites - a.nb_opportunites),
    [],
  );

  /* --- Section 2: Secteurs a securiser --- */
  const regionsSecuriser = useMemo(
    () =>
      [...TERRITOIRES]
        .filter((t) => t.nb_risques_perte >= 2 || t.nb_mentions_concurrents >= 10)
        .sort((a, b) => (b.nb_risques_perte + b.nb_mentions_concurrents) - (a.nb_risques_perte + a.nb_mentions_concurrents)),
    [],
  );

  /* --- Section 3: Secteurs sous-exploites --- */
  const regionsSousExploitees = useMemo(
    () =>
      [...TERRITOIRES]
        .filter((t) => t.nb_cr < 60 && t.nb_opportunites >= 1)
        .map((t) => ({ ...t, ratio: t.nb_opportunites / t.nb_cr }))
        .sort((a, b) => b.ratio - a.ratio),
    [],
  );

  return (
    <div className="space-y-8">

      {/* ---- Header ---- */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Vision Strategique Territoire
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Lecture strategique basee sur les remontees terrain
        </p>
      </div>

      {/* ---- KPIs ---- */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          label="Regions avec opportunites"
          value={kpiOpportunites}
          icon={<Rocket className="w-5 h-5" />}
          iconColor="text-emerald-600 bg-emerald-50"
        />
        <KpiCard
          label="Regions a securiser"
          value={kpiSecuriser}
          icon={<Shield className="w-5 h-5" />}
          iconColor="text-rose-600 bg-rose-50"
        />
        <KpiCard
          label="Regions sous-exploitees"
          value={kpiSousExploitees}
          icon={<Search className="w-5 h-5" />}
          iconColor="text-amber-600 bg-amber-50"
        />
      </div>

      {/* ---- Bar chart: Signaux par region ---- */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">
          Signaux par region
        </h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
              <Tooltip
                formatter={((value: any) => [value, 'Comptes-rendus']) as any}
                contentStyle={{
                  borderRadius: 12,
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                }}
              />
              <Bar dataKey="cr" radius={[4, 4, 0, 0]}>
                {chartData.map((_, idx) => (
                  <Cell key={idx} fill="#6366f1" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ---- Section 1: Ou aller chercher du business ---- */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Rocket className="w-5 h-5 text-emerald-600" />
          <h2 className="text-lg font-semibold text-slate-900">Ou aller chercher du business</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {regionsOpportunites.map((t) => (
            <div
              key={t.territoire}
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 border-l-4 border-l-emerald-500"
            >
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-base font-bold text-slate-900">{t.territoire}</h3>
                <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-0.5 text-xs font-medium">
                  {t.nb_opportunites} opportunites
                </span>
              </div>
              <ul className="list-disc list-inside space-y-1 mb-3">
                {t.motifs_opportunite.map((m, i) => (
                  <li key={i} className="text-sm text-slate-600">{m}</li>
                ))}
              </ul>
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <Users className="w-3.5 h-3.5" />
                <span>{t.commercial_names.join(', ')}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---- Section 2: Secteurs a securiser ---- */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-rose-600" />
          <h2 className="text-lg font-semibold text-slate-900">Secteurs a securiser</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {regionsSecuriser.map((t) => (
            <div
              key={t.territoire}
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 border-l-4 border-l-rose-500"
            >
              <div className="flex items-center gap-2 flex-wrap mb-3">
                <h3 className="text-base font-bold text-slate-900">{t.territoire}</h3>
                <span className="inline-flex items-center rounded-full bg-rose-50 text-rose-700 px-2.5 py-0.5 text-xs font-medium">
                  {t.nb_risques_perte} risques
                </span>
                <span className="inline-flex items-center rounded-full bg-amber-50 text-amber-700 px-2.5 py-0.5 text-xs font-medium">
                  {t.nb_mentions_concurrents} mentions concurrents
                </span>
              </div>
              <ul className="list-disc list-inside space-y-1 mb-3">
                {t.motifs_risque.map((m, i) => (
                  <li key={i} className="text-sm text-slate-600">{m}</li>
                ))}
              </ul>
              <div>
                {sentimentBadge(t.sentiment_dominant)}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---- Section 3: Secteurs sous-exploites ---- */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Search className="w-5 h-5 text-amber-600" />
          <h2 className="text-lg font-semibold text-slate-900">Secteurs sous-exploites</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {regionsSousExploitees.map((t) => (
            <div
              key={t.territoire}
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 border-l-4 border-l-amber-400"
            >
              <div className="flex items-center gap-2 flex-wrap mb-3">
                <h3 className="text-base font-bold text-slate-900">{t.territoire}</h3>
                <span className="inline-flex items-center rounded-full bg-amber-50 text-amber-700 px-2.5 py-0.5 text-xs font-medium">
                  {t.nb_opportunites} opportunites pour seulement {t.nb_cr} CR
                </span>
              </div>
              <ul className="list-disc list-inside space-y-1 mb-3">
                {t.motifs_opportunite.map((m, i) => (
                  <li key={i} className="text-sm text-slate-600">{m}</li>
                ))}
              </ul>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <Users className="w-3.5 h-3.5" />
                  <span>{t.commercial_names.join(', ')}</span>
                </div>
                <span className="text-xs font-medium text-amber-600">
                  Renforcer la presence terrain
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
