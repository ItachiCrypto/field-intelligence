'use client';

import { useMemo } from 'react';
import { SEGMENT_STATS } from '@/lib/seed-data-v2';
import { formatCurrency } from '@/lib/utils';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { Users, Briefcase, Star } from 'lucide-react';

const SEGMENT_CONFIG: Record<string, { label: string; color: string; border: string; bg: string; icon: React.ReactNode }> = {
  nouveau: {
    label: 'Nouveau',
    color: '#6366f1',
    border: 'border-l-indigo-500',
    bg: 'bg-indigo-50',
    icon: <Users className="w-5 h-5 text-indigo-600" />,
  },
  etabli: {
    label: 'Etabli',
    color: '#0ea5e9',
    border: 'border-l-sky-500',
    bg: 'bg-sky-50',
    icon: <Briefcase className="w-5 h-5 text-sky-600" />,
  },
  strategique: {
    label: 'Strategique',
    color: '#f59e0b',
    border: 'border-l-amber-500',
    bg: 'bg-amber-50',
    icon: <Star className="w-5 h-5 text-amber-600" />,
  },
};

export default function DirSegPage() {
  const pieData = useMemo(
    () =>
      SEGMENT_STATS.map((s) => ({
        name: SEGMENT_CONFIG[s.segment]?.label || s.segment,
        value: s.count,
        color: SEGMENT_CONFIG[s.segment]?.color || '#94a3b8',
      })),
    []
  );

  const barData = useMemo(
    () =>
      SEGMENT_STATS.map((s) => ({
        name: SEGMENT_CONFIG[s.segment]?.label || s.segment,
        ca: s.ca_total,
        color: SEGMENT_CONFIG[s.segment]?.color || '#94a3b8',
      })),
    []
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Segmentation Nouveaux vs Etablis</h1>
        <p className="text-sm text-slate-500 mt-1">Repartition et performance par segment client</p>
      </div>

      {/* Segment cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {SEGMENT_STATS.map((seg) => {
          const config = SEGMENT_CONFIG[seg.segment];
          return (
            <div
              key={seg.segment}
              className={`bg-white rounded-xl border border-slate-200 shadow-sm p-5 border-l-4 ${config?.border || ''}`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${config?.bg || 'bg-slate-50'}`}>
                  {config?.icon}
                </div>
                <h3 className="text-base font-semibold text-slate-900">{config?.label || seg.segment}</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Nombre de clients</span>
                  <span className="text-sm font-semibold text-slate-900 tabular-nums">{seg.count}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">CA total</span>
                  <span className="text-sm font-semibold text-slate-900 tabular-nums">{formatCurrency(seg.ca_total)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Signaux moy.</span>
                  <span className="text-sm font-semibold text-slate-900 tabular-nums">{seg.signaux_avg}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Risque moy.</span>
                  <span className="text-sm font-semibold text-slate-900 tabular-nums">{seg.risk_avg}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Taux de churn</span>
                  <span className={`text-sm font-semibold tabular-nums ${seg.churn_rate >= 10 ? 'text-rose-600' : 'text-slate-900'}`}>
                    {seg.churn_rate}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie chart */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Repartition par segment</h2>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  dataKey="value"
                  stroke="#fff"
                  strokeWidth={2}
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {pieData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar chart */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-4">CA par segment</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickFormatter={(v) => formatCurrency(v as number)}
                />
                <Tooltip
                  formatter={(value) => [formatCurrency(value as number), 'CA total']}
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  }}
                />
                <Bar dataKey="ca" radius={[4, 4, 0, 0]}>
                  {barData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
