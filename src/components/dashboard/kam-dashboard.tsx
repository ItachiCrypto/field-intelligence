'use client';

import Link from 'next/link';
import { KpiCard } from '@/components/shared/kpi-card';
import { SeverityIndicator } from '@/components/shared/severity-indicator';
import { useAppData } from '@/lib/data';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Briefcase, AlertTriangle, TrendingUp } from 'lucide-react';

export function KamDashboard() {
  const { accounts: ACCOUNTS, alerts: ALERTS } = useAppData();
  const sortedAccounts = [...ACCOUNTS].sort((a, b) => b.risk_score - a.risk_score);
  const criticalAlertCount = ALERTS.filter(
    (a) => a.status === 'nouveau' && (a.severity === 'rouge' || a.severity === 'orange')
  ).length;
  const opportunityCount = ACCOUNTS.reduce(
    (sum, acc) => sum + acc.signals.filter((s) => s.type === 'opportunite').length,
    0
  );

  function riskColor(score: number): string {
    if (score >= 60) return 'text-rose-600 bg-rose-50';
    if (score >= 30) return 'text-amber-600 bg-amber-50';
    return 'text-emerald-600 bg-emerald-50';
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Portefeuille KAM</h1>
        <p className="text-sm text-slate-500 mt-1">
          Suivi de vos comptes strategiques
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <KpiCard
          label="Comptes suivis"
          value={ACCOUNTS.length}
          icon={<Briefcase className="w-5 h-5" />}
          iconColor="text-teal-600 bg-teal-50"
        />
        <KpiCard
          label="Alertes critiques"
          value={criticalAlertCount}
          icon={<AlertTriangle className="w-5 h-5" />}
          iconColor="text-rose-600 bg-rose-50"
        />
        <KpiCard
          label="Opportunites actives"
          value={opportunityCount}
          icon={<TrendingUp className="w-5 h-5" />}
          iconColor="text-violet-600 bg-violet-50"
        />
      </div>

      {/* Accounts table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <h2 className="text-base font-semibold text-slate-900">
            Comptes strategiques
          </h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/60">
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">
                Compte
              </th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">
                Secteur
              </th>
              <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">
                CA annuel
              </th>
              <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">
                Signaux
              </th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">
                Dernier RDV
              </th>
              <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">
                Score risque
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedAccounts.map((acc) => (
              <tr
                key={acc.id}
                className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors"
              >
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <SeverityIndicator severity={acc.health} size="sm" />
                    <Link
                      href={`/account/${acc.id}`}
                      className="text-sm font-medium text-slate-900 hover:text-slate-700 hover:underline underline-offset-2"
                    >
                      {acc.name}
                    </Link>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <span className="text-sm text-slate-600">{acc.sector}</span>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <span className="text-sm font-medium tabular-nums text-slate-900">
                    {formatCurrency(acc.ca_annual)}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-center">
                  {acc.active_signals > 0 ? (
                    <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] rounded-full bg-slate-100 text-xs font-semibold text-slate-700 px-1.5">
                      {acc.active_signals}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-300">&mdash;</span>
                  )}
                </td>
                <td className="px-5 py-3.5">
                  <span className="text-sm tabular-nums text-slate-600">
                    {formatDate(acc.last_rdv)}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-center">
                  <span
                    className={`inline-flex items-center justify-center min-w-[36px] rounded-md px-2 py-0.5 text-xs font-bold tabular-nums ${riskColor(
                      acc.risk_score
                    )}`}
                  >
                    {acc.risk_score}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
