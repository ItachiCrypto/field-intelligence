'use client';

import { useMemo } from 'react';
import { CLOSING_DATA, FUNNEL_DATA } from '@/lib/seed-data-v2';
import { KpiCard } from '@/components/shared/kpi-card';
import { formatCurrency } from '@/lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { Target, TrendingUp, FileText, CalendarCheck } from 'lucide-react';

export default function DirClosPage() {
  const totals = useMemo(() => {
    const caTotal = CLOSING_DATA.reduce((s, c) => s + c.ca_signe_eur, 0);
    const tauxMoyen = Math.round(
      CLOSING_DATA.reduce((s, c) => s + c.taux_closing_pct, 0) / CLOSING_DATA.length
    );
    const propositions = CLOSING_DATA.reduce((s, c) => s + c.nb_propositions, 0);
    const rdv = CLOSING_DATA.reduce((s, c) => s + c.nb_rdv, 0);
    return { caTotal, tauxMoyen, propositions, rdv };
  }, []);

  const funnelMax = useMemo(() => Math.max(...FUNNEL_DATA.map((f) => f.count)), []);

  const chartData = useMemo(
    () =>
      CLOSING_DATA.map((c) => ({
        name: c.commercial_name,
        ca: c.ca_signe_eur,
        objectif: c.objectif_mensuel_eur,
      })).sort((a, b) => b.ca - a.ca),
    []
  );

  function closingColor(taux: number) {
    if (taux >= 65) return 'text-emerald-700 bg-emerald-50';
    if (taux >= 50) return 'text-amber-700 bg-amber-50';
    return 'text-rose-700 bg-rose-50';
  }

  function progressPct(ca: number, obj: number) {
    return Math.min(100, Math.round((ca / obj) * 100));
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Taux de Closing & Objectifs</h1>
        <p className="text-sm text-slate-500 mt-1">Suivi mensuel des performances commerciales</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="CA signe total"
          value={formatCurrency(totals.caTotal)}
          icon={<Target className="w-5 h-5" />}
          iconColor="text-indigo-600 bg-indigo-50"
        />
        <KpiCard
          label="Taux closing moyen"
          value={totals.tauxMoyen}
          suffix="%"
          icon={<TrendingUp className="w-5 h-5" />}
          iconColor="text-emerald-600 bg-emerald-50"
        />
        <KpiCard
          label="Propositions envoyees"
          value={totals.propositions}
          icon={<FileText className="w-5 h-5" />}
          iconColor="text-amber-600 bg-amber-50"
        />
        <KpiCard
          label="RDV realises"
          value={totals.rdv}
          icon={<CalendarCheck className="w-5 h-5" />}
          iconColor="text-slate-600 bg-slate-50"
        />
      </div>

      {/* Funnel */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-base font-semibold text-slate-900 mb-6">Entonnoir commercial</h2>
        <div className="space-y-3">
          {FUNNEL_DATA.map((stage, idx) => {
            const widthPct = Math.max(20, (stage.count / funnelMax) * 100);
            const colors = [
              'bg-indigo-500',
              'bg-indigo-400',
              'bg-indigo-300',
              'bg-indigo-200',
            ];
            return (
              <div key={stage.etape} className="flex items-center gap-4">
                <div className="w-32 text-sm text-slate-600 text-right shrink-0 font-medium">
                  {stage.etape}
                </div>
                <div className="flex-1">
                  <div
                    className={`${colors[idx] || 'bg-indigo-300'} rounded-lg h-10 flex items-center px-4 transition-all`}
                    style={{ width: `${widthPct}%` }}
                  >
                    <span className="text-sm font-semibold text-white tabular-nums">
                      {stage.count}
                    </span>
                  </div>
                </div>
                <div className="w-24 text-sm text-slate-500 tabular-nums shrink-0">
                  {formatCurrency(stage.valeur_eur)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">Detail par commercial</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/60">
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Commercial</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">RDV</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Propositions</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Closings</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">CA signe</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Objectif</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Taux closing</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Progression</th>
              </tr>
            </thead>
            <tbody>
              {CLOSING_DATA.slice()
                .sort((a, b) => b.ca_signe_eur - a.ca_signe_eur)
                .map((c) => {
                  const pct = progressPct(c.ca_signe_eur, c.objectif_mensuel_eur);
                  return (
                    <tr key={c.commercial_id} className="border-b border-slate-100 hover:bg-slate-50/40 transition-colors">
                      <td className="px-6 py-3 font-medium text-slate-900">{c.commercial_name}</td>
                      <td className="px-4 py-3 text-right text-slate-700 tabular-nums">{c.nb_rdv}</td>
                      <td className="px-4 py-3 text-right text-slate-700 tabular-nums">{c.nb_propositions}</td>
                      <td className="px-4 py-3 text-right text-slate-700 tabular-nums">{c.nb_closings}</td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900 tabular-nums">
                        {formatCurrency(c.ca_signe_eur)}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500 tabular-nums">
                        {formatCurrency(c.objectif_mensuel_eur)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums ${closingColor(c.taux_closing_pct)}`}>
                          {c.taux_closing_pct}%
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${pct >= 100 ? 'bg-emerald-500' : pct >= 75 ? 'bg-indigo-500' : 'bg-amber-400'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-500 tabular-nums w-8 text-right">{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bar chart */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-base font-semibold text-slate-900 mb-4">CA signe par commercial</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis
                tick={{ fontSize: 12, fill: '#64748b' }}
                tickFormatter={(v) => formatCurrency(v as number)}
              />
              <Tooltip
                formatter={(value, name) => [
                  formatCurrency(value as number),
                  name === 'ca' ? 'CA signe' : 'Objectif',
                ]}
                contentStyle={{
                  borderRadius: 12,
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                }}
              />
              <Bar dataKey="ca" fill="#6366f1" radius={[4, 4, 0, 0]} name="CA signe" />
              <Bar dataKey="objectif" fill="#e2e8f0" radius={[4, 4, 0, 0]} name="Objectif" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
