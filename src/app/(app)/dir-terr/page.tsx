'use client';

import { useMemo, useState } from 'react';
import { TERRITOIRES, GEO_POINTS } from '@/lib/seed-data-v2';
import type { TerritoireSynthese, GeoPoint, SentimentType } from '@/lib/types-v2';
import { cn } from '@/lib/utils';
import { KpiCard } from '@/components/shared/kpi-card';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, Cell,
} from 'recharts';
import {
  AlertTriangle, TrendingUp, Shield, Swords, FileText,
  ArrowUp, ArrowDown, Minus, MapPin,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types & constants                                                 */
/* ------------------------------------------------------------------ */

type LayerKey = 'opportunites' | 'risques' | 'concurrence' | 'priorite';

const LAYERS: { key: LayerKey; label: string }[] = [
  { key: 'opportunites', label: 'Opportunites' },
  { key: 'risques', label: 'Risques' },
  { key: 'concurrence', label: 'Concurrence' },
  { key: 'priorite', label: 'Priorite globale' },
];

const LAYER_COLORS: Record<string, string> = {
  opportunites: '#10b981',
  risques: '#f43f5e',
  concurrence: '#f59e0b',
  besoins: '#6366f1',
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function priorityBorderColor(score: number) {
  if (score > 70) return 'border-l-rose-500';
  if (score > 40) return 'border-l-amber-400';
  return 'border-l-emerald-500';
}

function scoreBadgeCls(score: number) {
  if (score > 70) return 'bg-rose-50 text-rose-700';
  if (score > 40) return 'bg-amber-50 text-amber-700';
  return 'bg-emerald-50 text-emerald-700';
}

function intensiteBadgeCls(val: number) {
  if (val > 70) return 'bg-rose-50 text-rose-700';
  if (val > 50) return 'bg-amber-50 text-amber-700';
  return 'bg-slate-100 text-slate-600';
}

function sentimentBadge(sentiment: SentimentType) {
  const cfg: Record<SentimentType, { bg: string; label: string }> = {
    positif: { bg: 'bg-emerald-50 text-emerald-700', label: 'Positif' },
    negatif: { bg: 'bg-rose-50 text-rose-700', label: 'Negatif' },
    neutre: { bg: 'bg-slate-100 text-slate-600', label: 'Neutre' },
    interesse: { bg: 'bg-amber-50 text-amber-700', label: 'Interesse' },
  };
  const c = cfg[sentiment];
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', c.bg)}>
      {c.label}
    </span>
  );
}

function tendanceBadge(tendance: TerritoireSynthese['tendance_vs_mois_precedent']) {
  if (tendance === 'hausse') {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium bg-rose-50 text-rose-700">
        <ArrowUp className="w-3 h-3" /> Hausse
      </span>
    );
  }
  if (tendance === 'baisse') {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-700">
        <ArrowDown className="w-3 h-3" /> Baisse
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600">
      <Minus className="w-3 h-3" /> Stable
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export default function DirTerrPage() {
  const [activeLayers, setActiveLayers] = useState<Set<LayerKey>>(
    new Set(['opportunites', 'risques', 'concurrence', 'priorite']),
  );

  function toggleLayer(key: LayerKey) {
    setActiveLayers((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function isActive(key: LayerKey) {
    return activeLayers.has(key);
  }

  /* KPIs */
  const kpis = useMemo(() => ({
    sousPression: TERRITOIRES.filter((t) => t.score_priorite > 70).length,
    avecOpportunites: TERRITOIRES.filter((t) => t.nb_opportunites > 3).length,
    aRisqueChurn: TERRITOIRES.filter((t) => t.nb_risques_perte > 2).length,
  }), []);

  /* Territories sorted by priority */
  const sortedTerritoires = useMemo(
    () => [...TERRITOIRES].sort((a, b) => b.score_priorite - a.score_priorite),
    [],
  );

  /* Geo points sorted by intensite */
  const sortedGeo = useMemo(
    () => [...GEO_POINTS].sort((a, b) => b.intensite - a.intensite),
    [],
  );

  /* Max values for bar scaling */
  const geoMax = useMemo(() => {
    let m = 1;
    for (const g of GEO_POINTS) {
      m = Math.max(m, g.opportunites, g.risques, g.concurrence, g.besoins);
    }
    return m;
  }, []);

  /* Chart data for stacked bar */
  const geoChartData = useMemo(
    () => sortedGeo.map((g) => ({
      name: g.region,
      opportunites: g.opportunites,
      risques: g.risques,
      concurrence: g.concurrence,
      besoins: g.besoins,
    })),
    [sortedGeo],
  );

  /* Dim class helper */
  const dimCls = (layerKey: LayerKey) =>
    isActive(layerKey) ? '' : 'opacity-25';

  return (
    <div className="space-y-8">
      {/* ---- Header ---- */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Vue Territoire & Geographie
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Opportunites, risques et pression concurrentielle par zone
        </p>
      </div>

      {/* ---- KPIs ---- */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          label="Territoires sous pression"
          value={kpis.sousPression}
          icon={<AlertTriangle className="w-5 h-5" />}
          iconColor="text-rose-600 bg-rose-50"
        />
        <KpiCard
          label="Zones avec opportunites"
          value={kpis.avecOpportunites}
          icon={<TrendingUp className="w-5 h-5" />}
          iconColor="text-emerald-600 bg-emerald-50"
        />
        <KpiCard
          label="Zones a risque churn"
          value={kpis.aRisqueChurn}
          icon={<Shield className="w-5 h-5" />}
          iconColor="text-amber-600 bg-amber-50"
        />
      </div>

      {/* ---- Layer toggle pills ---- */}
      <div className="flex flex-wrap items-center gap-2">
        {LAYERS.map((l) => (
          <button
            key={l.key}
            onClick={() => toggleLayer(l.key)}
            className={cn(
              'px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors',
              isActive(l.key)
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200',
            )}
          >
            {l.label}
          </button>
        ))}
      </div>

      {/* ---- Section: Territoires ---- */}
      <section>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Territoires</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {sortedTerritoires.map((t) => (
            <div
              key={t.territoire}
              className={cn(
                'relative bg-white rounded-xl border border-slate-200 shadow-sm p-5 border-l-4',
                priorityBorderColor(t.score_priorite),
              )}
            >
              {/* Score priorite badge — top right */}
              <span
                className={cn(
                  'absolute top-4 right-4 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold tabular-nums',
                  scoreBadgeCls(t.score_priorite),
                )}
              >
                {t.score_priorite}
              </span>

              {/* Title + tendance */}
              <div className="flex items-center gap-2 mb-3 pr-14">
                <h3 className="text-base font-bold text-slate-900">{t.territoire}</h3>
                {tendanceBadge(t.tendance_vs_mois_precedent)}
              </div>

              {/* Mini stats row — dim inactive layers */}
              <div className="flex items-center gap-4 mb-3">
                {/* CR count — always visible */}
                <div className="flex items-center gap-1 text-xs text-slate-600">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span className="tabular-nums font-medium">{t.nb_cr}</span>
                  <span className="text-slate-400">CR</span>
                </div>

                {/* Concurrence */}
                <div className={cn('flex items-center gap-1 text-xs text-slate-600 transition-opacity', dimCls('concurrence'))}>
                  <Swords className="w-3.5 h-3.5 text-amber-500" />
                  <span className="tabular-nums font-medium">{t.nb_mentions_concurrents}</span>
                </div>

                {/* Opportunites */}
                <div className={cn('flex items-center gap-1 text-xs text-slate-600 transition-opacity', dimCls('opportunites'))}>
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="tabular-nums font-medium">{t.nb_opportunites}</span>
                </div>

                {/* Risques */}
                <div className={cn('flex items-center gap-1 text-xs text-slate-600 transition-opacity', dimCls('risques'))}>
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                  <span className="tabular-nums font-medium">{t.nb_risques_perte}</span>
                </div>
              </div>

              {/* Sentiment dominant */}
              <div className="mb-3">
                {sentimentBadge(t.sentiment_dominant)}
              </div>

              {/* Commerciaux */}
              <p className="text-xs text-slate-500">
                {t.commercial_names.join(', ')}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ---- Section: Vue geographique ---- */}
      <section>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="w-4.5 h-4.5 text-slate-400" />
            Vue geographique
          </span>
        </h2>

        {/* Region cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
          {sortedGeo.map((g) => (
            <div
              key={g.region}
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-5"
            >
              {/* Header row */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900">{g.region}</h3>
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold tabular-nums',
                    intensiteBadgeCls(g.intensite),
                  )}
                >
                  {g.intensite}
                </span>
              </div>

              {/* Horizontal bars */}
              <div className="space-y-2.5">
                {/* Opportunites */}
                {isActive('opportunites') && (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500 w-24 shrink-0">Opportunites</span>
                    <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${(g.opportunites / geoMax) * 100}%` }}
                      />
                    </div>
                    <span className="text-[11px] tabular-nums font-medium text-slate-600 w-6 text-right">
                      {g.opportunites}
                    </span>
                  </div>
                )}

                {/* Risques */}
                {isActive('risques') && (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500 w-24 shrink-0">Risques</span>
                    <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-rose-500 rounded-full transition-all"
                        style={{ width: `${(g.risques / geoMax) * 100}%` }}
                      />
                    </div>
                    <span className="text-[11px] tabular-nums font-medium text-slate-600 w-6 text-right">
                      {g.risques}
                    </span>
                  </div>
                )}

                {/* Concurrence */}
                {isActive('concurrence') && (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500 w-24 shrink-0">Concurrence</span>
                    <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all"
                        style={{ width: `${(g.concurrence / geoMax) * 100}%` }}
                      />
                    </div>
                    <span className="text-[11px] tabular-nums font-medium text-slate-600 w-6 text-right">
                      {g.concurrence}
                    </span>
                  </div>
                )}

                {/* Besoins — tied to priorite global layer */}
                {isActive('priorite') && (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500 w-24 shrink-0">Besoins</span>
                    <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full transition-all"
                        style={{ width: `${(g.besoins / geoMax) * 100}%` }}
                      />
                    </div>
                    <span className="text-[11px] tabular-nums font-medium text-slate-600 w-6 text-right">
                      {g.besoins}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Stacked bar chart */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">
            Signaux par region
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={geoChartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip
                  formatter={((value: any, name: any) => {
                    const labels: Record<string, string> = {
                      opportunites: 'Opportunites',
                      risques: 'Risques',
                      concurrence: 'Concurrence',
                      besoins: 'Besoins',
                    };
                    return [value, labels[name] ?? name];
                  }) as any}
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  }}
                />
                <Legend
                  formatter={(value: string) => {
                    const labels: Record<string, string> = {
                      opportunites: 'Opportunites',
                      risques: 'Risques',
                      concurrence: 'Concurrence',
                      besoins: 'Besoins',
                    };
                    return labels[value] ?? value;
                  }}
                />
                {isActive('opportunites') && (
                  <Bar dataKey="opportunites" stackId="geo" fill={LAYER_COLORS.opportunites} radius={[0, 0, 0, 0]} />
                )}
                {isActive('risques') && (
                  <Bar dataKey="risques" stackId="geo" fill={LAYER_COLORS.risques} radius={[0, 0, 0, 0]} />
                )}
                {isActive('concurrence') && (
                  <Bar dataKey="concurrence" stackId="geo" fill={LAYER_COLORS.concurrence} radius={[0, 0, 0, 0]} />
                )}
                {isActive('priorite') && (
                  <Bar dataKey="besoins" stackId="geo" fill={LAYER_COLORS.besoins} radius={[4, 4, 0, 0]} />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
    </div>
  );
}
