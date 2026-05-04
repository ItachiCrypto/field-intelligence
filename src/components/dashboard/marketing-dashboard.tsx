'use client';

import { useMemo } from 'react';
import { KpiCard } from '@/components/shared/kpi-card';
import { QualityScoreInfo } from '@/components/shared/quality-score-info';
import { SignalCard } from '@/components/shared/signal-card';
import { SeverityIndicator } from '@/components/shared/severity-indicator';
import { useAppData } from '@/lib/data';
import { formatTrend } from '@/lib/utils';
import { getISOWeekNumber } from '@/lib/date-utils';
import {
  Crosshair,
  Lightbulb,
  Users,
  Radio,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Sparkles,
  Gauge,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';


const SEVERITY_BAR_COLORS: Record<string, string> = {
  rouge: '#e11d48',
  orange: '#f59e0b',
  jaune: '#eab308',
  vert: '#10b981',
};

function pctChange(curr: number, prev: number): number | undefined {
  if (prev === 0 && curr === 0) return 0;
  if (prev === 0) return undefined; // cannot compute % from 0
  return Math.round(((curr - prev) / prev) * 100);
}

export function MarketingDashboard() {
  const { signals: SIGNALS, competitors: COMPETITORS, needs: NEEDS, commercials: COMMERCIALS } = useAppData() as any;
  const concurrenceCount = SIGNALS.filter((s: any) => s.type === 'concurrence').length;
  const besoinsCount = SIGNALS.filter((s: any) => s.type === 'besoin').length;
  const criticalSignals = SIGNALS.filter((s: any) => s.severity === 'rouge');

  // Tendances hebdo : 7 derniers jours vs 7 jours precedents
  const trends = useMemo(() => {
    const now = Date.now();
    const DAY = 86400000;
    const sliceRecent = (s: any) => (now - new Date(s.created_at).getTime()) < 7 * DAY;
    const slicePrev = (s: any) => {
      const age = now - new Date(s.created_at).getTime();
      return age >= 7 * DAY && age < 14 * DAY;
    };
    const countType = (arr: any[], t: string) => arr.filter((s: any) => s.type === t).length;
    const recent = SIGNALS.filter(sliceRecent);
    const prev = SIGNALS.filter(slicePrev);
    return {
      concurrence: pctChange(countType(recent, 'concurrence'), countType(prev, 'concurrence')),
      besoins: pctChange(countType(recent, 'besoin'), countType(prev, 'besoin')),
      total: pctChange(recent.length, prev.length),
    };
  }, [SIGNALS]);

  // Nouveaux concurrents detectes (flag is_new sur table competitors — rempli par process-pending.js
  // quand un competitor apparait pour la premiere fois)
  const nouveauxConcurrents = COMPETITORS.filter((c: any) => c.is_new).length;

  // Score qualite moyen des CR : moyenne des quality_score par commercial
  const qualiteMoyenneCR = useMemo(() => {
    if (!COMMERCIALS || COMMERCIALS.length === 0) return 0;
    const scores = COMMERCIALS.map((c: any) => c.quality_score ?? 0).filter((s: number) => s > 0);
    if (scores.length === 0) return 0;
    return Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length);
  }, [COMMERCIALS]);

  // Build weekly chart data from real signals
  const weeklyData = useMemo(() => {
    if (SIGNALS.length === 0) return [];
    const weeks: Record<string, { concurrence: number; besoins: number; prix: number }> = {};
    SIGNALS.forEach((s: any) => {
      const d = new Date(s.created_at);
      const weekNum = getISOWeekNumber(d);
      const key = `S${weekNum}`;
      if (!weeks[key]) weeks[key] = { concurrence: 0, besoins: 0, prix: 0 };
      if (s.type === 'concurrence') weeks[key].concurrence++;
      else if (s.type === 'besoin') weeks[key].besoins++;
      else if (s.type === 'prix') weeks[key].prix++;
    });
    return Object.entries(weeks)
      .sort(([a], [b]) => parseInt(a.slice(1)) - parseInt(b.slice(1)))
      .slice(-4)
      .map(([week, counts]) => ({ week, ...counts }));
  }, [SIGNALS]);

  const competitorData = useMemo(
    () =>
      [...COMPETITORS]
        .sort((a: any, b: any) => b.mentions - a.mentions)
        .map((c: any) => ({ name: c.name, mentions: c.mentions, risk: c.risk })),
    [COMPETITORS]
  );

  const topCompetitors = COMPETITORS.slice().sort((a: any, b: any) => b.mentions - a.mentions);
  const topNeeds = NEEDS.slice(0, 6).map((n: any, i: number) => ({ ...n, rank: n.rank ?? n.rank_order ?? i + 1 }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard Marketing</h1>
        <p className="text-sm text-slate-500 mt-1">Vue d&apos;ensemble de la semaine</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <KpiCard
          label="Signaux concurrence"
          value={concurrenceCount}
          change={trends.concurrence}
          invertChange
          icon={<Crosshair className="w-5 h-5" />}
          iconColor="text-rose-600 bg-rose-50"
        />
        <KpiCard
          label="Besoins identifies"
          value={besoinsCount}
          change={trends.besoins}
          icon={<Lightbulb className="w-5 h-5" />}
          iconColor="text-sky-600 bg-sky-50"
        />
        <KpiCard
          label="Concurrents actifs"
          value={COMPETITORS.length}
          icon={<Users className="w-5 h-5" />}
          iconColor="text-violet-600 bg-violet-50"
        />
        <KpiCard
          label="Nouveaux concurrents detectes"
          value={nouveauxConcurrents}
          invertChange
          icon={<Sparkles className="w-5 h-5" />}
          iconColor="text-amber-600 bg-amber-50"
        />
        <KpiCard
          label="Remontees terrain totales"
          value={SIGNALS.length}
          change={trends.total}
          icon={<Radio className="w-5 h-5" />}
          iconColor="text-indigo-600 bg-indigo-50"
        />
        <KpiCard
          label="Score qualite moyen CR"
          value={qualiteMoyenneCR}
          suffix="/100"
          icon={<Gauge className="w-5 h-5" />}
          iconColor="text-emerald-600 bg-emerald-50"
          info={<QualityScoreInfo />}
        />
      </div>

      {/* Alerts */}
      {criticalSignals.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-base font-semibold text-slate-900">
              Alertes critiques
            </h2>
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-rose-100 text-rose-700 text-xs font-bold">
              {criticalSignals.length}
            </span>
          </div>
          <div className="space-y-3">
            {criticalSignals.map((signal: any) => (
              <SignalCard key={signal.id} signal={signal} compact />
            ))}
          </div>
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Line chart */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">
            Evolution des signaux (4 semaines)
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyData}>
                <XAxis
                  dataKey="week"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#94a3b8' }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#94a3b8' }}
                  width={30}
                />
                <Tooltip
                  contentStyle={{
                    background: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 8,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    fontSize: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="concurrence"
                  stroke="#e11d48"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#e11d48' }}
                  name="Concurrence"
                />
                <Line
                  type="monotone"
                  dataKey="besoins"
                  stroke="#0ea5e9"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#0ea5e9' }}
                  name="Besoins"
                />
                <Line
                  type="monotone"
                  dataKey="prix"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#f59e0b' }}
                  name="Prix"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar chart — competitor mentions */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">
            Mentions par concurrent
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={competitorData} layout="vertical" barCategoryGap={8}>
                <XAxis
                  type="number"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#94a3b8' }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#334155', fontWeight: 500 }}
                  width={60}
                />
                <Tooltip
                  contentStyle={{
                    background: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 8,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="mentions" radius={[0, 4, 4, 0]} name="Mentions">
                  {competitorData.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={SEVERITY_BAR_COLORS[entry.risk] ?? '#64748b'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom columns */}
      <div className="grid grid-cols-2 gap-4">
        {/* Top competitors */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">
            Top concurrents
          </h3>
          <div className="space-y-3">
            {topCompetitors.map((c: any) => (
              <div
                key={c.id}
                className="flex items-center justify-between py-2 border-b border-slate-100 last:border-b-0"
              >
                <div className="flex items-center gap-3">
                  <SeverityIndicator severity={c.risk} size="sm" />
                  <div>
                    <span className="text-sm font-medium text-slate-900">
                      {c.name}
                    </span>
                    <span className="text-xs text-slate-500 ml-2">
                      {c.mention_type}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm tabular-nums text-slate-600">
                    {c.mentions} mentions
                  </span>
                  <span
                    className={`inline-flex items-center gap-0.5 text-xs font-medium ${
                      c.evolution > 0
                        ? 'text-rose-600'
                        : c.evolution < 0
                        ? 'text-emerald-600'
                        : 'text-slate-400'
                    }`}
                  >
                    {c.evolution > 0 && <ArrowUpRight className="w-3 h-3" />}
                    {c.evolution < 0 && <ArrowDownRight className="w-3 h-3" />}
                    {c.evolution === 0 && <Minus className="w-3 h-3" />}
                    {formatTrend(c.evolution)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top besoins */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">
            Top besoins du mois
          </h3>
          <div className="space-y-3">
            {topNeeds.map((need: any) => (
              <div
                key={need.rank}
                className="flex items-center justify-between py-2 border-b border-slate-100 last:border-b-0"
              >
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                    {need.rank}
                  </span>
                  <span className="text-sm text-slate-700">{need.label}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm tabular-nums text-slate-600">
                    {need.mentions}
                  </span>
                  <span
                    className={`inline-flex items-center gap-0.5 text-xs font-medium ${
                      need.trend === 'up'
                        ? 'text-rose-600'
                        : need.trend === 'down'
                        ? 'text-emerald-600'
                        : need.trend === 'new'
                        ? 'text-violet-600'
                        : 'text-slate-400'
                    }`}
                  >
                    {need.trend === 'up' && <ArrowUpRight className="w-3 h-3" />}
                    {need.trend === 'down' && (
                      <ArrowDownRight className="w-3 h-3" />
                    )}
                    {need.trend === 'stable' && <Minus className="w-3 h-3" />}
                    {need.trend === 'new'
                      ? 'Nouveau'
                      : need.trend === 'stable'
                      ? 'Stable'
                      : formatTrend(need.evolution)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
