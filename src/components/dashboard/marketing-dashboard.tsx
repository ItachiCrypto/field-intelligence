'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { KpiCard } from '@/components/shared/kpi-card';
import { SignalCard } from '@/components/shared/signal-card';
import { SeverityIndicator } from '@/components/shared/severity-indicator';
import { useAppData } from '@/lib/data';
import { formatTrend } from '@/lib/utils';
import {
  Crosshair,
  Lightbulb,
  Users,
  Radio,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  DollarSign,
  TrendingUp,
  Target,
  Package,
  MapPin,
  Megaphone,
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

const WEEKLY_DATA = [
  { week: 'S11', concurrence: 12, besoins: 8, prix: 5 },
  { week: 'S12', concurrence: 18, besoins: 11, prix: 7 },
  { week: 'S13', concurrence: 15, besoins: 14, prix: 9 },
  { week: 'S14', concurrence: 22, besoins: 10, prix: 6 },
];

const SEVERITY_BAR_COLORS: Record<string, string> = {
  rouge: '#e11d48',
  orange: '#f59e0b',
  jaune: '#eab308',
  vert: '#10b981',
};

export function MarketingDashboard() {
  const { signals: SIGNALS, competitors: COMPETITORS, needs: NEEDS } = useAppData();
  const concurrenceCount = SIGNALS.filter((s) => s.type === 'concurrence').length;
  const besoinsCount = SIGNALS.filter((s) => s.type === 'besoin').length;
  const criticalSignals = SIGNALS.filter((s) => s.severity === 'rouge');

  const competitorData = useMemo(
    () =>
      [...COMPETITORS]
        .sort((a, b) => b.mentions - a.mentions)
        .map((c) => ({ name: c.name, mentions: c.mentions, risk: c.risk })),
    []
  );

  const topCompetitors = COMPETITORS.slice().sort((a, b) => b.mentions - a.mentions);
  const topNeeds = NEEDS.slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard Marketing</h1>
        <p className="text-sm text-slate-500 mt-1">Vue d&apos;ensemble de la semaine</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard
          label="Signaux concurrence"
          value={concurrenceCount}
          change={34}
          icon={<Crosshair className="w-5 h-5" />}
          iconColor="text-rose-600 bg-rose-50"
        />
        <KpiCard
          label="Besoins identifies"
          value={besoinsCount}
          change={9}
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
          label="Remontees terrain totales"
          value={SIGNALS.length}
          change={18}
          icon={<Radio className="w-5 h-5" />}
          iconColor="text-indigo-600 bg-indigo-50"
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
            {criticalSignals.map((signal) => (
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
              <LineChart data={WEEKLY_DATA}>
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
            {topCompetitors.map((c) => (
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
            {topNeeds.map((need) => (
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

      {/* Nouvelles fonctionnalites */}
      <div>
        <h2 className="text-base font-semibold text-slate-900 mb-4">Nouvelles fonctionnalites</h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            { href: '/mkt-prix', icon: DollarSign, title: 'Radar Prix', desc: 'Signaux prix concurrentiels et tendances', color: 'bg-amber-50 text-amber-600' },
            { href: '/mkt-deal', icon: TrendingUp, title: 'Deals Gagnes/Perdus', desc: 'Analyse des motifs de gain et perte', color: 'bg-emerald-50 text-emerald-600' },
            { href: '/mkt-pos', icon: Target, title: 'Positionnement', desc: 'Perception client vs concurrents', color: 'bg-violet-50 text-violet-600' },
            { href: '/mkt-offre', icon: Package, title: 'Offres Concurrentes', desc: 'Offres et bundles detectes sur le terrain', color: 'bg-sky-50 text-sky-600' },
            { href: '/mkt-geo', icon: MapPin, title: 'Analyse Geo', desc: 'Matrice sectorielle et geographique', color: 'bg-rose-50 text-rose-600' },
            { href: '/mkt-comm', icon: Megaphone, title: 'Comm Concurrentes', desc: 'Actions communication detectees', color: 'bg-indigo-50 text-indigo-600' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-5 flex items-start gap-4"
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${item.color}`}>
                <item.icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">{item.title}</h3>
                <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
