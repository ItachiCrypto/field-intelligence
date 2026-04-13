'use client';

import { useMemo } from 'react';
import { KpiCard } from '@/components/shared/kpi-card';
import { SignalCard } from '@/components/shared/signal-card';
import { useAppData } from '@/lib/data';
import Link from 'next/link';
import {
  FileText,
  AlertTriangle,
  Star,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  TrendingUp,
  Target,
  GitCompare,
  PieChart,
  TrendingDown,
  Map,
  MapPin,
  Brain,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

function barColor(score: number): string {
  if (score >= 80) return '#10b981';
  if (score >= 60) return '#f59e0b';
  return '#e11d48';
}

function scoreTextColor(score: number): string {
  if (score >= 80) return 'text-emerald-600';
  if (score >= 60) return 'text-amber-600';
  return 'text-rose-600';
}

export function DirectorDashboard() {
  const { signals: SIGNALS, alerts: ALERTS, commercials: COMMERCIALS } = useAppData();
  const totalCR = COMMERCIALS.reduce((s, c) => s + (c.cr_week || 0), 0);
  const criticalAlerts = ALERTS.filter(
    (a) => a.severity === 'rouge' && a.status === 'nouveau'
  );
  const avgQuality = COMMERCIALS.length > 0
    ? Math.round(COMMERCIALS.reduce((s, c) => s + c.quality_score, 0) / COMMERCIALS.length)
    : 0;

  const top10ByCR = useMemo(
    () =>
      [...COMMERCIALS]
        .sort((a, b) => (b.cr_week || 0) - (a.cr_week || 0))
        .slice(0, 10)
        .map((c) => ({
          name: c.name,
          cr: c.cr_week || 0,
          quality: c.quality_score,
        })),
    [COMMERCIALS]
  );

  const top5ByQuality = useMemo(
    () =>
      [...COMMERCIALS]
        .sort((a, b) => b.quality_score - a.quality_score)
        .slice(0, 5),
    [COMMERCIALS]
  );

  const criticalSignals = SIGNALS.filter((s) => s.severity === 'rouge');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard Executif</h1>
        <p className="text-sm text-slate-500 mt-1">
          {(() => {
            const now = new Date();
            const start = new Date(now.getFullYear(), 0, 1);
            const week = Math.ceil(((now.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7);
            return `Semaine ${week} \u2014 ${now.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`;
          })()}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard
          label="CR analyses"
          value={totalCR}
          icon={<FileText className="w-5 h-5" />}
          iconColor="text-indigo-600 bg-indigo-50"
        />
        <KpiCard
          label="Alertes critiques"
          value={criticalAlerts.length}
          icon={<AlertTriangle className="w-5 h-5" />}
          iconColor="text-rose-600 bg-rose-50"
        />
        <KpiCard
          label="Score qualite moyen"
          value={avgQuality}
          suffix="/100"
          icon={<Star className="w-5 h-5" />}
          iconColor="text-amber-600 bg-amber-50"
        />
        <KpiCard
          label="Commerciaux actifs"
          value={`${COMMERCIALS.length}/${COMMERCIALS.length}`}
          icon={<Users className="w-5 h-5" />}
          iconColor="text-emerald-600 bg-emerald-50"
        />
      </div>

      {/* Alerts */}
      {criticalSignals.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-base font-semibold text-slate-900">
              Alertes urgentes
            </h2>
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-rose-100 text-rose-700 text-xs font-bold">
              {criticalSignals.length}
            </span>
          </div>
          <div className="space-y-3">
            {criticalSignals.slice(0, 4).map((signal) => (
              <SignalCard key={signal.id} signal={signal} compact />
            ))}
          </div>
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Bar chart — CR by commercial */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">
            CR par commercial (top 10)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={top10ByCR} barCategoryGap={6}>
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  interval={0}
                  angle={-30}
                  textAnchor="end"
                  height={50}
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
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={((value: any, name: any) => [
                    String(value),
                    name === 'cr' ? 'CR cette semaine' : String(name),
                  ]) as any}
                />
                <Bar dataKey="cr" radius={[4, 4, 0, 0]} name="cr">
                  {top10ByCR.map((entry, index) => (
                    <Cell key={index} fill={barColor(entry.quality)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top commerciaux ranked list */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">
            Top commerciaux
          </h3>
          <div className="space-y-1">
            {top5ByQuality.map((com, i) => (
              <div
                key={com.id}
                className="flex items-center gap-4 py-3 border-b border-slate-100 last:border-b-0"
              >
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 text-xs font-bold text-slate-600 shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {com.name}
                  </p>
                  <p className="text-xs text-slate-500">{com.region}</p>
                </div>
                <div className="text-right shrink-0">
                  <span
                    className={`text-sm font-bold tabular-nums ${scoreTextColor(
                      com.quality_score
                    )}`}
                  >
                    {com.quality_score}/100
                  </span>
                </div>
                <div className="text-right shrink-0 w-14">
                  <span className="text-xs text-slate-500">
                    {com.cr_week || 0} CR
                  </span>
                </div>
                <div className="shrink-0 w-14 text-right">
                  <span
                    className={`inline-flex items-center gap-0.5 text-xs font-medium ${
                      com.quality_trend > 0
                        ? 'text-emerald-600'
                        : com.quality_trend < 0
                        ? 'text-rose-600'
                        : 'text-slate-400'
                    }`}
                  >
                    {com.quality_trend > 0 && (
                      <ArrowUpRight className="w-3 h-3" />
                    )}
                    {com.quality_trend < 0 && (
                      <ArrowDownRight className="w-3 h-3" />
                    )}
                    {com.quality_trend === 0 && <Minus className="w-3 h-3" />}
                    {com.quality_trend > 0 ? '+' : ''}
                    {com.quality_trend}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Signal highlight — only shown when there are signals */}
      {SIGNALS.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-amber-900">
                Tendance de la semaine
              </h3>
              <p className="text-sm text-amber-800 mt-1 leading-relaxed">
                {SIGNALS[0].content}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Nouvelles fonctionnalites */}
      <div>
        <h2 className="text-base font-semibold text-slate-900 mb-4">Nouvelles fonctionnalites</h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            { href: '/dir-clos', icon: Target, title: 'Taux Closing', desc: 'Performance et objectifs de l\'equipe', color: 'bg-violet-50 text-violet-600' },
            { href: '/dir-n1', icon: GitCompare, title: 'Evolution Clients', desc: 'Retours N-1 et depuis dernier RDV', color: 'bg-sky-50 text-sky-600' },
            { href: '/dir-seg', icon: PieChart, title: 'Segmentation', desc: 'Nouveaux vs Etablis vs Strategiques', color: 'bg-indigo-50 text-indigo-600' },
            { href: '/dir-lost', icon: TrendingDown, title: 'Deals Perdus', desc: 'Motifs et valeur des deals perdus', color: 'bg-rose-50 text-rose-600' },
            { href: '/dir-terr', icon: Map, title: 'Carte Territoire', desc: 'Opportunites et risques par zone', color: 'bg-emerald-50 text-emerald-600' },
            { href: '/dir-geo', icon: MapPin, title: 'Heatmap Geo', desc: 'Vision geographique multicouche', color: 'bg-amber-50 text-amber-600' },
            { href: '/dir-prior', icon: Brain, title: 'Priorisation IA', desc: 'Recommandations d\'action hebdomadaires', color: 'bg-slate-100 text-slate-600' },
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
