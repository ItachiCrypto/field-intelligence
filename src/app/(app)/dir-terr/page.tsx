'use client';

import { useMemo } from 'react';
import { TERRITOIRES } from '@/lib/seed-data-v2';
import { KpiCard } from '@/components/shared/kpi-card';
import { formatCurrency } from '@/lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { MapPin, Crosshair, PieChart as PieIcon } from 'lucide-react';

export default function DirTerrPage() {
  const sorted = useMemo(
    () => [...TERRITOIRES].sort((a, b) => b.score_priorite - a.score_priorite),
    []
  );

  const stats = useMemo(() => {
    const critiques = TERRITOIRES.filter((t) => t.score_priorite > 70).length;
    const opps = TERRITOIRES.reduce((s, t) => s + t.nb_opportunites, 0);
    const pipeline = TERRITOIRES.reduce((s, t) => s + t.valeur_opportunites_eur, 0);
    return { critiques, opps, pipeline };
  }, []);

  const chartData = useMemo(
    () =>
      sorted.map((t) => ({
        name: t.territoire,
        score: t.score_priorite,
      })),
    [sorted]
  );

  function priorityBorderColor(score: number) {
    if (score > 70) return 'border-l-rose-500';
    if (score > 40) return 'border-l-amber-400';
    return 'border-l-emerald-500';
  }

  function scoreBadge(score: number) {
    if (score > 70) return 'bg-rose-50 text-rose-700';
    if (score > 40) return 'bg-amber-50 text-amber-700';
    return 'bg-emerald-50 text-emerald-700';
  }

  function miniBar(value: number, max: number, color: string) {
    const pct = Math.min(100, Math.round((value / max) * 100));
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
        </div>
        <span className="text-xs text-slate-500 tabular-nums w-6 text-right">{value}</span>
      </div>
    );
  }

  const maxOpp = Math.max(...TERRITOIRES.map((t) => t.nb_opportunites));
  const maxRisque = Math.max(...TERRITOIRES.map((t) => t.nb_clients_risque_rouge));
  const maxBesoins = Math.max(...TERRITOIRES.map((t) => t.nb_besoins_non_couverts));
  const maxConc = Math.max(...TERRITOIRES.map((t) => t.nb_signaux_concurrent));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Carte Opportunites & Risques par Territoire</h1>
        <p className="text-sm text-slate-500 mt-1">Vue synthetique de la pression commerciale par zone geographique</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          label="Territoires critiques"
          value={stats.critiques}
          icon={<MapPin className="w-5 h-5" />}
          iconColor="text-rose-600 bg-rose-50"
        />
        <KpiCard
          label="Opportunites totales"
          value={stats.opps}
          icon={<Crosshair className="w-5 h-5" />}
          iconColor="text-emerald-600 bg-emerald-50"
        />
        <KpiCard
          label="Valeur pipeline"
          value={formatCurrency(stats.pipeline)}
          icon={<PieIcon className="w-5 h-5" />}
          iconColor="text-indigo-600 bg-indigo-50"
        />
      </div>

      {/* Territory cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {sorted.map((t) => (
          <div
            key={t.territoire}
            className={`bg-white rounded-xl border border-slate-200 shadow-sm p-5 border-l-4 ${priorityBorderColor(t.score_priorite)}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-base font-semibold text-slate-900">{t.territoire}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t.commercial_names.join(', ')}
                </p>
              </div>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums ${scoreBadge(t.score_priorite)}`}>
                {t.score_priorite}
              </span>
            </div>
            <div className="space-y-2.5">
              <div>
                <div className="flex justify-between items-center mb-0.5">
                  <span className="text-xs text-slate-500">Opportunites</span>
                </div>
                {miniBar(t.nb_opportunites, maxOpp, 'bg-emerald-500')}
              </div>
              <div>
                <div className="flex justify-between items-center mb-0.5">
                  <span className="text-xs text-slate-500">Risques rouge</span>
                </div>
                {miniBar(t.nb_clients_risque_rouge, maxRisque || 1, 'bg-rose-500')}
              </div>
              <div>
                <div className="flex justify-between items-center mb-0.5">
                  <span className="text-xs text-slate-500">Besoins non couverts</span>
                </div>
                {miniBar(t.nb_besoins_non_couverts, maxBesoins, 'bg-amber-400')}
              </div>
              <div>
                <div className="flex justify-between items-center mb-0.5">
                  <span className="text-xs text-slate-500">Signaux concurrence</span>
                </div>
                {miniBar(t.nb_signaux_concurrent, maxConc, 'bg-indigo-500')}
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between text-xs text-slate-500">
              <span>Pipeline: {formatCurrency(t.valeur_opportunites_eur)}</span>
              <span>Risque orange: {t.nb_clients_risque_orange}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-base font-semibold text-slate-900 mb-4">Score priorite par territoire</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} domain={[0, 100]} />
              <Tooltip
                formatter={(value) => [value, 'Score priorite']}
                contentStyle={{
                  borderRadius: 12,
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                }}
              />
              <Bar dataKey="score" radius={[4, 4, 0, 0]} fill="#6366f1" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
