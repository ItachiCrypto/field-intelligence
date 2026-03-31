'use client';

import { useState, useMemo } from 'react';
import { COMMERCIALS } from '@/lib/seed-data';
import { SEVERITY_CONFIG } from '@/lib/constants';
import { qualityScoreToSeverity, cn } from '@/lib/utils';
import { KpiCard } from '@/components/shared/kpi-card';
import { SeverityIndicator } from '@/components/shared/severity-indicator';
import { Users, ChevronUp, ChevronDown, AlertTriangle, ArrowUpRight, ArrowDownRight, Minus, GraduationCap } from 'lucide-react';

type SortKey = 'name' | 'region' | 'cr_week' | 'quality_score' | 'useful_signals' | 'quality_trend';
type SortDir = 'asc' | 'desc';

export default function TeamPage() {
  const [sortKey, setSortKey] = useState<SortKey>('quality_score');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const sorted = useMemo(() => {
    return [...COMMERCIALS].sort((a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];
      if (typeof va === 'string' && typeof vb === 'string') {
        return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      return sortDir === 'asc' ? (va as number) - (vb as number) : (vb as number) - (va as number);
    });
  }, [sortKey, sortDir]);

  const avgScore = Math.round(COMMERCIALS.reduce((s, c) => s + c.quality_score, 0) / COMMERCIALS.length);
  const totalCR = COMMERCIALS.reduce((s, c) => s + c.cr_week, 0);
  const coachingCount = COMMERCIALS.filter((c) => c.quality_trend < -5).length;

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <span className="w-3.5 h-3.5 inline-block" />;
    return sortDir === 'asc'
      ? <ChevronUp className="w-3.5 h-3.5 inline text-indigo-600" />
      : <ChevronDown className="w-3.5 h-3.5 inline text-indigo-600" />;
  };

  const ColHeader = ({ col, label, align }: { col: SortKey; label: string; align?: string }) => (
    <th
      className={cn(
        'px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-900 select-none transition-colors',
        align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'
      )}
      onClick={() => handleSort(col)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <SortIcon col={col} />
      </span>
    </th>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-50 text-amber-600">
          <Users className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Suivi Equipe Commerciale</h1>
          <p className="text-sm text-slate-500">
            <span className="tabular-nums">{COMMERCIALS.length}</span> commerciaux actifs
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Commerciaux"
          value={COMMERCIALS.length}
          icon={<Users className="w-5 h-5" />}
          iconColor="text-slate-600 bg-slate-50"
        />
        <KpiCard
          label="Score qualite moyen"
          value={avgScore}
          suffix="%"
        />
        <KpiCard
          label="CR / semaine (total)"
          value={totalCR}
        />
        <KpiCard
          label="Coaching recommande"
          value={coachingCount}
          icon={<GraduationCap className="w-5 h-5" />}
          iconColor="text-amber-600 bg-amber-50"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/60 border-b border-slate-100">
                <ColHeader col="name" label="Nom" />
                <ColHeader col="region" label="Region" />
                <ColHeader col="cr_week" label="CR / semaine" align="center" />
                <ColHeader col="quality_score" label="Score qualite" align="center" />
                <ColHeader col="useful_signals" label="Signaux utiles" align="center" />
                <ColHeader col="quality_trend" label="Tendance" align="center" />
              </tr>
            </thead>
            <tbody>
              {sorted.map((c) => {
                const severity = qualityScoreToSeverity(c.quality_score);
                const sevConfig = SEVERITY_CONFIG[severity];
                const needsCoaching = c.quality_trend < -5;
                return (
                  <tr
                    key={c.id}
                    className={cn(
                      'border-b border-slate-100 transition-colors',
                      needsCoaching ? 'bg-amber-50 hover:bg-amber-100/60' : 'hover:bg-slate-50/50'
                    )}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="font-medium text-slate-900">{c.name}</span>
                        {needsCoaching && (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{c.region}</td>
                    <td className="px-4 py-3 text-center text-slate-900 tabular-nums font-medium">{c.cr_week}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn(
                        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold tabular-nums border',
                        sevConfig.bg, sevConfig.text, sevConfig.border
                      )}>
                        <SeverityIndicator severity={severity} size="sm" />
                        {c.quality_score}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-slate-900 tabular-nums">{c.useful_signals}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn(
                        'inline-flex items-center gap-0.5 text-xs font-medium tabular-nums',
                        c.quality_trend > 0 ? 'text-emerald-600' : c.quality_trend < 0 ? 'text-rose-600' : 'text-slate-400'
                      )}>
                        {c.quality_trend > 0 && <ArrowUpRight className="w-3.5 h-3.5" />}
                        {c.quality_trend < 0 && <ArrowDownRight className="w-3.5 h-3.5" />}
                        {c.quality_trend === 0 && <Minus className="w-3.5 h-3.5" />}
                        {c.quality_trend > 0 ? '+' : ''}{c.quality_trend}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
