// @ts-nocheck
'use client';

import { useState, useMemo } from 'react';
import { useAppData } from '@/lib/data';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';
import { MapPin, AlertTriangle, ShieldAlert, Lightbulb } from 'lucide-react';

type Layer = 'opportunites' | 'risques' | 'concurrence' | 'besoins';

const LAYERS: { key: Layer; label: string; color: string; icon: React.ReactNode }[] = [
  { key: 'opportunites', label: 'Opportunites', color: '#10b981', icon: <Lightbulb className="w-3.5 h-3.5" /> },
  { key: 'risques', label: 'Risques', color: '#f43f5e', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  { key: 'concurrence', label: 'Concurrence', color: '#6366f1', icon: <ShieldAlert className="w-3.5 h-3.5" /> },
  { key: 'besoins', label: 'Besoins', color: '#f59e0b', icon: <MapPin className="w-3.5 h-3.5" /> },
];

export default function DirGeoPage() {
  const { geoPoints: GEO_POINTS } = useAppData();
  const [activeLayers, setActiveLayers] = useState<Set<Layer>>(
    new Set(['opportunites', 'risques', 'concurrence', 'besoins'])
  );

  function toggleLayer(layer: Layer) {
    setActiveLayers((prev) => {
      const next = new Set(prev);
      if (next.has(layer)) {
        next.delete(layer);
      } else {
        next.add(layer);
      }
      return next;
    });
  }

  const sorted = useMemo(
    () => [...GEO_POINTS].sort((a, b) => b.intensite - a.intensite),
    [GEO_POINTS]
  );

  const chartData = useMemo(
    () =>
      sorted.map((g) => ({
        name: g.region,
        opportunites: g.opportunites,
        risques: g.risques,
        concurrence: g.concurrence,
        besoins: g.besoins,
      })),
    [sorted]
  );

  function intensiteBadge(value: number) {
    if (value >= 75) return 'bg-rose-50 text-rose-700';
    if (value >= 50) return 'bg-amber-50 text-amber-700';
    return 'bg-emerald-50 text-emerald-700';
  }

  function barColor(layer: Layer) {
    if (layer === 'opportunites') return 'bg-emerald-500';
    if (layer === 'risques') return 'bg-rose-500';
    if (layer === 'concurrence') return 'bg-indigo-500';
    return 'bg-amber-400';
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Heatmap Geographique Commerciale</h1>
        <p className="text-sm text-slate-500 mt-1">Analyse multi-couches par region</p>
      </div>

      {/* Layer toggle pills */}
      <div className="flex flex-wrap gap-2">
        {LAYERS.map((layer) => {
          const isActive = activeLayers.has(layer.key);
          return (
            <button
              key={layer.key}
              onClick={() => toggleLayer(layer.key)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors border ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {layer.icon}
              {layer.label}
            </button>
          );
        })}
      </div>

      {/* Region cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sorted.map((g) => (
          <div key={g.region} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-base font-semibold text-slate-900">{g.region}</h3>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums ${intensiteBadge(g.intensite)}`}>
                {g.intensite}
              </span>
            </div>
            <div className="space-y-2.5">
              {LAYERS.filter((l) => activeLayers.has(l.key)).map((layer) => {
                const value = g[layer.key];
                const maxVal = Math.max(...GEO_POINTS.map((p) => p[layer.key]));
                const pct = maxVal > 0 ? Math.round((value / maxVal) * 100) : 0;
                return (
                  <div key={layer.key}>
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="text-xs text-slate-500">{layer.label}</span>
                      <span className="text-xs font-medium text-slate-700 tabular-nums">{value}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${barColor(layer.key)}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Stacked bar chart */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-base font-semibold text-slate-900 mb-4">Vue comparative par region</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                }}
              />
              <Legend />
              {LAYERS.filter((l) => activeLayers.has(l.key)).map((layer) => (
                <Bar
                  key={layer.key}
                  dataKey={layer.key}
                  stackId="a"
                  fill={layer.color}
                  name={layer.label}
                  radius={layer.key === 'besoins' ? [4, 4, 0, 0] : undefined}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
