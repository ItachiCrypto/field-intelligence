'use client';

import { useMemo } from 'react';
import { KpiCard } from '@/components/shared/kpi-card';
import { SignalCard } from '@/components/shared/signal-card';
import { useAppData } from '@/lib/data';
import { getISOWeekNumber } from '@/lib/date-utils';
import {
  FileText,
  AlertTriangle,
  Star,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  TrendingUp,
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
  const { signals: SIGNALS, alerts: ALERTS, commercials: COMMERCIALS } = useAppData() as any;
  // CR total analyses (champ stocke par le pipeline) et CR semaine glissante
  const totalCRAllTime = COMMERCIALS.reduce((s: number, c: any) => s + (c.cr_total || 0), 0);
  const totalCRWeek = COMMERCIALS.reduce((s: number, c: any) => s + (c.cr_week || 0), 0);
  const criticalAlerts = ALERTS.filter(
    (a: any) => a.severity === 'rouge' && a.status === 'nouveau'
  );
  const avgQuality = COMMERCIALS.length > 0
    ? Math.round(COMMERCIALS.reduce((s: number, c: any) => s + c.quality_score, 0) / COMMERCIALS.length)
    : 0;
  // Nombre de commerciaux "actifs" cette semaine (au moins 1 CR remonte)
  const activeCount = COMMERCIALS.filter((c: any) => (c.cr_week || 0) > 0).length;

  const top10ByCR = useMemo(
    () =>
      [...COMMERCIALS]
        .sort((a: any, b: any) => (b.cr_total || b.cr_week || 0) - (a.cr_total || a.cr_week || 0))
        .slice(0, 10)
        .map((c: any) => ({
          name: c.name,
          cr: c.cr_total || 0,
          quality: c.quality_score,
        })),
    [COMMERCIALS]
  );

  const top5ByQuality = useMemo(
    () =>
      [...COMMERCIALS]
        .sort((a: any, b: any) => b.quality_score - a.quality_score)
        .slice(0, 5),
    [COMMERCIALS]
  );

  const criticalSignals = SIGNALS.filter((s: any) => s.severity === 'rouge');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard Executif</h1>
        <p className="text-sm text-slate-500 mt-1">
          {(() => {
            const now = new Date();
            const week = getISOWeekNumber(now);
            return `Semaine ${week} \u2014 ${now.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`;
          })()}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard
          label="CR analyses (total)"
          value={totalCRAllTime}
          suffix={totalCRWeek > 0 ? ` (${totalCRWeek} sem.)` : ''}
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
          value={`${activeCount}/${COMMERCIALS.length}`}
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
            {criticalSignals.slice(0, 4).map((signal: any) => (
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
            CR analyses par commercial (total)
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
                    name === 'cr' ? 'CR analyses (total)' : String(name),
                  ]) as any}
                />
                <Bar dataKey="cr" radius={[4, 4, 0, 0]} name="cr">
                  {top10ByCR.map((entry: any, index: number) => (
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
            {top5ByQuality.map((com: any, i: number) => (
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
                <div className="text-right shrink-0 w-20">
                  <span className="text-xs text-slate-500 tabular-nums">
                    {com.cr_total || 0} CR ({com.cr_week || 0} sem.)
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
      {SIGNALS.length > 0 && SIGNALS[0] && (
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

    </div>
  );
}
