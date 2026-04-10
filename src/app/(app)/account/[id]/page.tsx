'use client';

import { use, useMemo } from 'react';
import Link from 'next/link';
import { useAppData } from '@/lib/data';
import { SEVERITY_CONFIG } from '@/lib/constants';
import { formatCurrency, formatRelativeTime, formatDate, formatTrend, scoreToSeverity } from '@/lib/utils';
import { SignalCard } from '@/components/shared/signal-card';
import { SeverityBadge } from '@/components/shared/severity-badge';
import { AbbreviationHighlight } from '@/components/shared/abbreviation-highlight';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowLeft, Building2, MapPin, User, Brain, Users, TrendingUp, ChevronRight, Calendar } from 'lucide-react';

function generateRiskHistory(currentScore: number, trend: number) {
  const months = ['Oct', 'Nov', 'Dec', 'Jan', 'Fev', 'Mar'];
  const data = [];
  let score = Math.max(5, Math.min(95, currentScore - trend * 3));
  for (let i = 0; i < 6; i++) {
    data.push({ month: months[i], score: Math.round(score) });
    score += (trend / 3) + (Math.random() * 6 - 3);
    score = Math.max(5, Math.min(95, score));
  }
  data[5].score = currentScore;
  return data;
}

export default function AccountPage({ params }: { params: Promise<{ id: string }> }) {
  const { accounts: ACCOUNTS, aiRecommendations: AI_RECOMMENDATIONS } = useAppData();
  const { id } = use(params);
  const account = ACCOUNTS.find((a) => a.id === id);

  const riskHistory = useMemo(() => {
    if (!account) return [];
    return generateRiskHistory(account.risk_score, account.risk_trend);
  }, [account]);

  if (!account) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-slate-500 text-lg mb-4">Compte introuvable</p>
        <Link href="/portfolio" className="text-indigo-600 hover:text-indigo-800 font-medium">
          Retour au portefeuille
        </Link>
      </div>
    );
  }

  const riskSeverity = scoreToSeverity(account.risk_score);
  const riskConfig = SEVERITY_CONFIG[riskSeverity];
  const aiReco = AI_RECOMMENDATIONS[account.id];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/portfolio" className="hover:text-indigo-600 transition-colors">Portefeuille</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-900 font-medium">{account.name}</span>
      </nav>

      {/* Header */}
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{account.name}</h1>
          <p className="text-sm text-slate-500">{account.sector}</p>
        </div>
        <div className="ml-auto">
          <SeverityBadge severity={account.health} showLabel />
        </div>
      </div>

      {/* 4 Info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">CA annuel</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">{formatCurrency(account.ca_annual)}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Score risque</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-2xl font-bold tabular-nums ${riskConfig.text}`}>{account.risk_score}</span>
            <span className={`text-sm font-medium tabular-nums ${account.risk_trend > 0 ? 'text-rose-500' : account.risk_trend < 0 ? 'text-emerald-500' : 'text-slate-400'}`}>
              {formatTrend(account.risk_trend)}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Region</span>
          </div>
          <p className="text-lg font-semibold text-slate-900">{account.region}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-3">
            <User className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">KAM</span>
          </div>
          <p className="text-base font-semibold text-slate-900">{account.kam_name}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <Calendar className="w-3 h-3 text-slate-400" />
            <p className="text-xs text-slate-500">Dernier RDV : {formatRelativeTime(account.last_rdv)}</p>
          </div>
        </div>
      </div>

      {/* AI Recommendation */}
      {aiReco && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-5 h-5 text-indigo-600" />
            <h3 className="font-semibold text-indigo-900">Recommandation IA</h3>
          </div>
          <p className="text-sm text-indigo-800 leading-relaxed">
            <AbbreviationHighlight text={aiReco} />
          </p>
        </div>
      )}

      {/* Active Signals */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold text-slate-900">Signaux actifs</h2>
          {account.signals.length > 0 && (
            <span className="inline-flex items-center justify-center min-w-[1.5rem] h-6 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold px-1.5 tabular-nums">
              {account.signals.length}
            </span>
          )}
          <div className="flex-1 h-px bg-slate-200" />
        </div>
        {account.signals.length > 0 ? (
          <div className="space-y-3">
            {[...account.signals]
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              .map((signal) => (
                <SignalCard key={signal.id} signal={signal} />
              ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center text-slate-500">
            Aucun signal actif pour ce compte.
          </div>
        )}
      </div>

      {/* Contacts */}
      {account.contacts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-slate-900">Contacts</h2>
            <span className="inline-flex items-center justify-center min-w-[1.5rem] h-6 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold px-1.5 tabular-nums">
              {account.contacts.length}
            </span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/60 border-b border-slate-100">
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Nom</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Role</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Premier contact</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Statut</th>
                </tr>
              </thead>
              <tbody>
                {account.contacts.map((contact) => (
                  <tr key={contact.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900">{contact.name}</td>
                    <td className="px-4 py-3 text-slate-600">{contact.role}</td>
                    <td className="px-4 py-3 text-slate-500 tabular-nums">{formatDate(contact.first_detected)}</td>
                    <td className="px-4 py-3">
                      {contact.is_new && (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200 uppercase tracking-wider">
                          Nouveau
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Risk score chart */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold text-slate-900">Evolution du score risque</h2>
          <div className="flex-1 h-px bg-slate-200" />
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={riskHistory} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={riskConfig.hex} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={riskConfig.hex} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '0.75rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
                  formatter={(value) => [`${value}`, 'Score']}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke={riskConfig.hex}
                  strokeWidth={2}
                  fill="url(#riskGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
