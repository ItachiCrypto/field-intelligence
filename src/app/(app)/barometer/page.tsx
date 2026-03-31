'use client';

import { NEEDS } from '@/lib/seed-data';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { BarChart3, ArrowUpRight, ArrowDownRight, Minus, Sparkles } from 'lucide-react';

const TREND_CONFIG = {
  up: { Icon: ArrowUpRight, color: 'text-rose-500', label: 'En hausse' },
  down: { Icon: ArrowDownRight, color: 'text-emerald-500', label: 'En baisse' },
  stable: { Icon: Minus, color: 'text-slate-400', label: 'Stable' },
  new: { Icon: Sparkles, color: 'text-indigo-500', label: 'Nouveau' },
};

const BAR_COLORS = ['#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe'];

export default function BarometerPage() {
  const maxMentions = Math.max(...NEEDS.map((n) => n.mentions));
  const chartData = NEEDS.map((n) => ({ name: n.label, mentions: n.mentions }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600">
          <BarChart3 className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Barometre Besoins Clients</h1>
          <p className="text-sm text-slate-500">Classement par nombre de mentions terrain</p>
        </div>
      </div>

      {/* Ranked list */}
      <div className="space-y-3">
        {NEEDS.map((need) => {
          const barWidth = (need.mentions / maxMentions) * 100;
          const trend = TREND_CONFIG[need.trend];
          const TrendIcon = trend.Icon;
          return (
            <div
              key={need.rank}
              className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-5"
            >
              <div className="flex items-center gap-4">
                {/* Rank circle */}
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center font-bold text-base tabular-nums">
                  {need.rank}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-slate-900 text-sm">{need.label}</h3>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-slate-700 tabular-nums">{need.mentions} mentions</span>
                      <span className={`inline-flex items-center gap-1 text-xs font-medium ${trend.color}`}>
                        <TrendIcon className="w-3.5 h-3.5" />
                        {need.evolution !== 0 ? (
                          <span className="tabular-nums">{need.evolution > 0 ? '+' : ''}{need.evolution}%</span>
                        ) : (
                          <span>{trend.label}</span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Proportional bar */}
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-indigo-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bar chart */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Repartition des mentions</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 0 }}>
              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis
                type="category"
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#334155', fontSize: 11, fontWeight: 500 }}
                width={180}
              />
              <Tooltip
                contentStyle={{ borderRadius: '0.75rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
                formatter={(value) => [`${value}`, 'Mentions']}
              />
              <Bar dataKey="mentions" radius={[0, 6, 6, 0]} barSize={20}>
                {chartData.map((_, index) => (
                  <Cell key={index} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
