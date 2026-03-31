'use client';

import { useMemo } from 'react';
import { POSITIONNEMENT } from '@/lib/seed-data-v2';
import type { Attribut, ValeurPercue } from '@/lib/types-v2';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Radar as RechartsRadar, ResponsiveContainer, Legend, Tooltip,
} from 'recharts';
import { Crosshair } from 'lucide-react';

const ATTRIBUT_LABELS: Record<Attribut, string> = {
  prix: 'Prix',
  qualite: 'Qualite',
  sav: 'SAV',
  delai: 'Delai',
  relation: 'Relation',
  innovation: 'Innovation',
};

const VALEUR_NUMERIC: Record<ValeurPercue, number> = {
  fort: 3,
  moyen: 2,
  faible: 1,
};

const VALEUR_CONFIG: Record<ValeurPercue, { bg: string; text: string; border: string; label: string }> = {
  fort: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Fort' },
  moyen: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'Moyen' },
  faible: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', label: 'Faible' },
};

const ACTOR_COLORS: Record<string, string> = {
  Nous: '#6366f1',
  Acme: '#e11d48',
  Bexor: '#f59e0b',
};

const ATTRIBUTS: Attribut[] = ['prix', 'qualite', 'sav', 'delai', 'relation', 'innovation'];

export default function MktPosPage() {
  const acteurs = useMemo(() => {
    return Array.from(new Set(POSITIONNEMENT.map((p) => p.acteur)));
  }, []);

  const radarData = useMemo(() => {
    return ATTRIBUTS.map((attr) => {
      const row: Record<string, string | number> = { attribut: ATTRIBUT_LABELS[attr] };
      for (const acteur of acteurs) {
        const entry = POSITIONNEMENT.find((p) => p.acteur === acteur && p.attribut === attr);
        row[acteur] = entry ? VALEUR_NUMERIC[entry.valeur] : 0;
      }
      return row;
    });
  }, [acteurs]);

  const getValeur = (acteur: string, attribut: Attribut): ValeurPercue | null => {
    const entry = POSITIONNEMENT.find((p) => p.acteur === acteur && p.attribut === attribut);
    return entry ? entry.valeur : null;
  };

  const totalMentions = useMemo(() => {
    const sums: Record<string, number> = {};
    POSITIONNEMENT.forEach((p) => {
      sums[p.acteur] = (sums[p.acteur] || 0) + p.count;
    });
    return sums;
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600">
          <Crosshair className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Positionnement Client vs Concurrents</h1>
          <p className="text-sm text-slate-500">Perception terrain sur 6 axes de differentiation</p>
        </div>
      </div>

      {/* Radar chart */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Carte de positionnement</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis
                dataKey="attribut"
                tick={{ fill: '#334155', fontSize: 12, fontWeight: 500 }}
              />
              <PolarRadiusAxis
                angle={30}
                domain={[0, 3]}
                tickCount={4}
                tick={{ fill: '#94a3b8', fontSize: 10 }}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '0.75rem',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                }}
              />
              {acteurs.map((acteur) => (
                <RechartsRadar
                  key={acteur}
                  name={acteur}
                  dataKey={acteur}
                  stroke={ACTOR_COLORS[acteur] || '#64748b'}
                  fill={ACTOR_COLORS[acteur] || '#64748b'}
                  fillOpacity={0.12}
                  strokeWidth={2}
                />
              ))}
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(value) => <span className="text-xs text-slate-600">{value}</span>}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Comparative table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 pt-5 pb-3">
          <h2 className="text-sm font-semibold text-slate-900">Tableau comparatif</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/60 border-b border-slate-100">
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Attribut</th>
                {acteurs.map((acteur) => (
                  <th key={acteur} className="text-center px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {acteur}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ATTRIBUTS.map((attr) => (
                <tr key={attr} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-900">{ATTRIBUT_LABELS[attr]}</td>
                  {acteurs.map((acteur) => {
                    const valeur = getValeur(acteur, attr);
                    if (!valeur) {
                      return <td key={acteur} className="px-4 py-3 text-center text-slate-400">--</td>;
                    }
                    const config = VALEUR_CONFIG[valeur];
                    return (
                      <td key={acteur} className="px-4 py-3 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}>
                          {config.label}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
              {/* Total mentions row */}
              <tr className="bg-slate-50/40">
                <td className="px-4 py-3 font-semibold text-slate-900">Total mentions</td>
                {acteurs.map((acteur) => (
                  <td key={acteur} className="px-4 py-3 text-center font-bold text-slate-900 tabular-nums">
                    {totalMentions[acteur] || 0}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
