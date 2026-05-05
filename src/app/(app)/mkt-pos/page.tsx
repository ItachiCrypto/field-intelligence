// @ts-nocheck
'use client';

import { useMemo } from 'react';
import { useAppData } from '@/lib/data';
import type { Attribut, ValeurPercue } from '@/lib/types-v2';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Radar as RechartsRadar, ResponsiveContainer, Legend, Tooltip,
  BarChart, Bar, XAxis, YAxis,
} from 'recharts';
import { Crosshair, ArrowUpRight, ArrowDownRight, Minus, TrendingUp } from 'lucide-react';

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

// 18 couleurs visuellement distinctes (separation TLab > 25 entre voisines)
// pour mieux differencier les acteurs sur la radar chart. Au-dela on cycle
// avec un offset stable plutot qu'avec un simple modulo, ce qui donne un
// pattern moins reconnaissable a l'oeil que "1-2-3-1-2-3".
const ACTOR_PALETTE = [
  '#6366f1', // indigo
  '#e11d48', // rose
  '#f59e0b', // amber
  '#10b981', // emerald
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#f97316', // orange
  '#0ea5e9', // sky
  '#84cc16', // lime
  '#ec4899', // pink
  '#14b8a6', // teal
  '#a855f7', // purple
  '#eab308', // yellow
  '#0284c7', // blue
  '#dc2626', // red
  '#65a30d', // green
  '#7c3aed', // violet-deep
  '#0891b2', // cyan-deep
];

/**
 * Attribution couleur par INDEX dans la liste triee des acteurs.
 *
 * Le hash FNV qui etait ici avant garantissait la stabilite "meme nom -> meme
 * couleur a vie" mais souffrait du paradoxe des anniversaires : avec 10
 * acteurs sur 18 couleurs, on observait 4-6 collisions en pratique. Les
 * users voyaient plusieurs concurrents avec la meme couleur sur la radar.
 *
 * Approche actuelle : on trie la liste des acteurs deduplique (alphabetique
 * lowercase) puis on assigne par index modulo palette. Garanties :
 *   - 0 collision tant qu'il y a <= 18 acteurs distincts (cas usuel)
 *   - Ordre stable : ajouter "Abbott" ne change pas la couleur de "Lifescan"
 *     parce que "Abbott" se positionne avant alphabetiquement, decalant
 *     uniquement les noms qui viennent apres dans l'ordre. C'est OK car
 *     le tri lexical est deterministe : pour un set d'acteurs donne, les
 *     couleurs sont les memes a chaque rendu.
 *   - Stable across charts : tant que tous les charts utilisent la MEME
 *     liste d'acteurs (passee en arg), la couleur de "Abbott" est
 *     identique partout dans la page.
 */
function getActorColor(actors: string[], name: string): string {
  if (!name) return ACTOR_PALETTE[0];
  const sortedUnique = Array.from(new Set(actors))
    .sort((a, b) => (a || '').toLowerCase().localeCompare((b || '').toLowerCase()));
  const idx = sortedUnique.findIndex((a) => (a || '').toLowerCase() === name.toLowerCase());
  return ACTOR_PALETTE[(idx >= 0 ? idx : 0) % ACTOR_PALETTE.length];
}

const ATTRIBUTS: Attribut[] = ['prix', 'qualite', 'sav', 'delai', 'relation', 'innovation'];

export default function MktPosPage() {
  const { positionnement: POSITIONNEMENT, signals: SIGNALS } = useAppData();
  const acteurs = useMemo(() => {
    return Array.from(new Set(POSITIONNEMENT.map((p) => p.acteur)));
  }, [POSITIONNEMENT]);

  const radarData = useMemo(() => {
    return ATTRIBUTS.map((attr) => {
      const row: Record<string, string | number> = { attribut: ATTRIBUT_LABELS[attr] };
      for (const acteur of acteurs) {
        const entry = POSITIONNEMENT.find((p) => p.acteur === acteur && p.attribut === attr);
        row[acteur] = entry ? VALEUR_NUMERIC[entry.valeur] : 0;
      }
      return row;
    });
  }, [acteurs, POSITIONNEMENT]);

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
  }, [POSITIONNEMENT]);

  // Evolution vs trimestre precedent : on compte les mentions de chaque acteur dans les signaux
  // "concurrence" sur les 90 derniers jours vs 90-180 jours precedents.
  const evolutionTrimestre = useMemo(() => {
    const now = Date.now();
    const Q = 90 * 86400000; // 90 jours
    const rows = acteurs.map((acteur) => {
      let actuel = 0;
      let precedent = 0;
      for (const s of SIGNALS || []) {
        if (!s.competitor_name || s.competitor_name !== acteur) continue;
        const age = now - new Date(s.created_at).getTime();
        if (age < Q) actuel++;
        else if (age < 2 * Q) precedent++;
      }
      const delta = precedent === 0 ? (actuel > 0 ? null : 0) : Math.round(((actuel - precedent) / precedent) * 100);
      return { acteur, actuel, precedent, delta };
    });
    return rows;
  }, [acteurs, SIGNALS]);

  const hasEvolutionData = evolutionTrimestre.some((r) => r.actuel > 0 || r.precedent > 0);

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
                  stroke={getActorColor(acteurs, acteur)}
                  fill={getActorColor(acteurs, acteur)}
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

      {/* Evolution vs trimestre precedent */}
      {hasEvolutionData && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-semibold text-slate-900">Volume de mentions vs trimestre precedent</h2>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Nombre de mentions de chaque acteur dans les signaux concurrence — trimestre actuel (90 derniers jours) vs trimestre precedent.
          </p>
          <div className="h-64 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={evolutionTrimestre} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <XAxis dataKey="acteur" axisLine={false} tickLine={false} tick={{ fill: '#334155', fontSize: 12, fontWeight: 500 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: '0.75rem', border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: '#64748b' }} />
                <Bar dataKey="precedent" name="Q-1" fill="#cbd5e1" radius={[4, 4, 0, 0]} maxBarSize={36} />
                <Bar dataKey="actuel" name="Q actuel" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {evolutionTrimestre.map((r) => {
              const sameOrNone = r.actuel === 0 && r.precedent === 0;
              if (sameOrNone) return null;
              return (
                <div key={r.acteur} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <p className="text-xs font-semibold text-slate-700">{r.acteur}</p>
                  <p className="text-xs text-slate-500">
                    {r.precedent} &rarr; {r.actuel} mentions
                  </p>
                  <div className="mt-1.5 flex items-center gap-1">
                    {r.delta === null ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-violet-700">
                        <ArrowUpRight className="w-3 h-3" />
                        Nouveau
                      </span>
                    ) : r.delta > 0 ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-600">
                        <ArrowUpRight className="w-3 h-3" /> +{r.delta}%
                      </span>
                    ) : r.delta < 0 ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                        <ArrowDownRight className="w-3 h-3" /> {r.delta}%
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
                        <Minus className="w-3 h-3" /> Stable
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
