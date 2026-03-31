'use client';

import { useMemo } from 'react';
import { GEO_SECTOR_DATA } from '@/lib/seed-data-v2';
import { KpiCard } from '@/components/shared/kpi-card';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { MapPin, Activity, Layers } from 'lucide-react';

const INTENSITY_COLORS = {
  high: { bg: 'bg-rose-100', text: 'text-rose-800', border: 'border-rose-200' },
  medium: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200' },
  low: { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200' },
};

function getIntensityLevel(score: number) {
  if (score > 70) return 'high';
  if (score > 40) return 'medium';
  return 'low';
}

const BAR_COLORS = ['#e11d48', '#6366f1', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#64748b'];

export default function MktGeoPage() {
  const secteurs = useMemo(() => Array.from(new Set(GEO_SECTOR_DATA.map((d) => d.secteur))).sort(), []);
  const regions = useMemo(() => Array.from(new Set(GEO_SECTOR_DATA.map((d) => d.region))).sort(), []);

  const getCell = (secteur: string, region: string) => {
    return GEO_SECTOR_DATA.find((d) => d.secteur === secteur && d.region === region);
  };

  const regionTotals = useMemo(() => {
    const map: Record<string, number> = {};
    GEO_SECTOR_DATA.forEach((d) => {
      const total = d.signaux_concurrence + d.signaux_besoins + d.signaux_opportunites;
      map[d.region] = (map[d.region] || 0) + total;
    });
    return Object.entries(map)
      .map(([region, total]) => ({ region, total }))
      .sort((a, b) => b.total - a.total);
  }, []);

  const totalSignaux = useMemo(() => {
    return GEO_SECTOR_DATA.reduce((acc, d) => acc + d.signaux_concurrence + d.signaux_besoins + d.signaux_opportunites, 0);
  }, []);

  const totalSecteurs = secteurs.length;
  const totalRegions = regions.length;

  const maxIntensity = useMemo(() => Math.max(...GEO_SECTOR_DATA.map((d) => d.score_intensite)), []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600">
          <MapPin className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Analyse Sectorielle &amp; Geographique</h1>
          <p className="text-sm text-slate-500">Croisement secteurs / regions par intensite concurrentielle</p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          label="Signaux totaux"
          value={totalSignaux}
          icon={<Activity className="w-5 h-5" />}
          iconColor="text-indigo-600 bg-indigo-50"
        />
        <KpiCard
          label="Secteurs couverts"
          value={totalSecteurs}
          icon={<Layers className="w-5 h-5" />}
          iconColor="text-emerald-600 bg-emerald-50"
        />
        <KpiCard
          label="Intensite max"
          value={maxIntensity}
          suffix="/100"
          icon={<MapPin className="w-5 h-5" />}
          iconColor="text-rose-600 bg-rose-50"
        />
      </div>

      {/* Heat matrix */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 pt-5 pb-3">
          <h2 className="text-sm font-semibold text-slate-900">Matrice d&apos;intensite (secteur x region)</h2>
          <p className="text-xs text-slate-500 mt-1">Score d&apos;intensite concurrentielle — nombre de signaux entre parentheses</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/60 border-b border-slate-100">
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Secteur</th>
                {regions.map((r) => (
                  <th key={r} className="text-center px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {r}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {secteurs.map((secteur) => (
                <tr key={secteur} className="border-b border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">{secteur}</td>
                  {regions.map((region) => {
                    const cell = getCell(secteur, region);
                    if (!cell) {
                      return (
                        <td key={region} className="px-4 py-3 text-center">
                          <span className="text-slate-300">--</span>
                        </td>
                      );
                    }
                    const level = getIntensityLevel(cell.score_intensite);
                    const config = INTENSITY_COLORS[level];
                    const signalCount = cell.signaux_concurrence + cell.signaux_besoins + cell.signaux_opportunites;
                    return (
                      <td key={region} className="px-3 py-2 text-center">
                        <div className={`inline-flex flex-col items-center rounded-lg px-3 py-1.5 border ${config.bg} ${config.border}`}>
                          <span className={`text-sm font-bold tabular-nums ${config.text}`}>
                            {cell.score_intensite}
                          </span>
                          <span className={`text-[10px] font-medium ${config.text} opacity-70`}>
                            ({signalCount})
                          </span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bar chart — top regions */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Top regions par nombre de signaux</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={regionTotals} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <XAxis
                dataKey="region"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#334155', fontSize: 11, fontWeight: 500 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '0.75rem',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                }}
                formatter={(value) => [`${value}`, 'Signaux']}
              />
              <Bar dataKey="total" radius={[6, 6, 0, 0]} barSize={36}>
                {regionTotals.map((_, index) => (
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
