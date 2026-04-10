'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useAppData } from '@/lib/data';
import { SEVERITY_CONFIG } from '@/lib/constants';
import { formatCurrency, formatRelativeTime, scoreToSeverity } from '@/lib/utils';
import { SeverityIndicator } from '@/components/shared/severity-indicator';
import { Briefcase, Search } from 'lucide-react';

export default function PortfolioPage() {
  const { accounts: ACCOUNTS } = useAppData();
  const [search, setSearch] = useState('');

  const sortedAccounts = useMemo(() => {
    return [...ACCOUNTS]
      .filter((a) => a.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => b.risk_score - a.risk_score);
  }, [search]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-teal-50 text-teal-600">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Portefeuille Comptes</h1>
            <p className="text-sm text-slate-500">
              <span className="tabular-nums">{sortedAccounts.length}</span> comptes
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Rechercher un compte..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-300"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/60 border-b border-slate-100">
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Compte</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Secteur</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Region</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">CA annuel</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Signaux actifs</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Dernier RDV</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Score risque</th>
              </tr>
            </thead>
            <tbody>
              {sortedAccounts.map((account) => {
                const severity = scoreToSeverity(account.risk_score);
                const sevConfig = SEVERITY_CONFIG[severity];
                return (
                  <tr
                    key={account.id}
                    className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <SeverityIndicator severity={account.health} size="sm" />
                        <Link
                          href={`/account/${account.id}`}
                          className="font-medium text-slate-900 hover:text-indigo-700 hover:underline decoration-indigo-300 underline-offset-2"
                        >
                          {account.name}
                        </Link>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{account.sector}</td>
                    <td className="px-4 py-3 text-slate-600">{account.region}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900 tabular-nums">{formatCurrency(account.ca_annual)}</td>
                    <td className="px-4 py-3 text-center">
                      {account.active_signals > 0 ? (
                        <span className="inline-flex items-center justify-center min-w-[1.5rem] h-6 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold tabular-nums px-1.5">
                          {account.active_signals}
                        </span>
                      ) : (
                        <span className="text-slate-400 tabular-nums">0</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-sm">{formatRelativeTime(account.last_rdv)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold tabular-nums ${sevConfig.bg} ${sevConfig.text} border ${sevConfig.border}`}>
                        {account.risk_score}
                        {account.risk_trend !== 0 && (
                          <span className={account.risk_trend > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                            {account.risk_trend > 0 ? '+' : ''}{account.risk_trend}
                          </span>
                        )}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {sortedAccounts.length === 0 && (
          <div className="p-12 text-center text-slate-500">Aucun compte ne correspond a la recherche.</div>
        )}
      </div>
    </div>
  );
}
