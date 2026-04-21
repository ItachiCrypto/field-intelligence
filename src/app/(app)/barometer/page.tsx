// @ts-nocheck
'use client';

import { useMemo, useState } from 'react';
import { useAppData } from '@/lib/data';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { BarChart3, ArrowUpRight, ArrowDownRight, Minus, Sparkles, Cloud } from 'lucide-react';

const TREND_CONFIG = {
  up: { Icon: ArrowUpRight, color: 'text-rose-500', label: 'En hausse' },
  down: { Icon: ArrowDownRight, color: 'text-emerald-500', label: 'En baisse' },
  stable: { Icon: Minus, color: 'text-slate-400', label: 'Stable' },
  new: { Icon: Sparkles, color: 'text-indigo-500', label: 'Nouveau' },
};

const BAR_COLORS = ['#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe'];

type ClientFilter = 'all' | 'nouveau' | 'etabli';

const FILTER_OPTIONS: { key: ClientFilter; label: string; hint: string }[] = [
  { key: 'all', label: 'Tous', hint: 'Tous besoins confondus' },
  { key: 'nouveau', label: 'Nouveaux clients', hint: 'Clients avec 1 seul besoin exprime' },
  { key: 'etabli', label: 'Clients etablis', hint: 'Clients avec au moins 2 besoins exprimes' },
];

// Palette utilisee pour le nuage de mots : du plus intense (indigo fonce) au plus clair.
const WORDCLOUD_COLORS = ['#312e81', '#4338ca', '#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe'];

function fontSizeForRank(rank: number, total: number): number {
  // Top besoin : ~40px. Dernier : ~12px. Echelle sqrt pour compresser la queue.
  if (total <= 1) return 30;
  const norm = 1 - (rank - 1) / Math.max(1, total - 1);
  return Math.round(12 + Math.sqrt(norm) * 28);
}

export default function BarometerPage() {
  const { needs: NEEDS, signals: SIGNALS } = useAppData();
  const [clientFilter, setClientFilter] = useState<ClientFilter>('all');

  // Classification des clients : nouveau (1 besoin) vs etabli (>=2 besoins).
  // On compte uniquement les signaux de type 'besoin' pour etre coherent avec le filtre affiche.
  const clientStatus = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of SIGNALS || []) {
      if (s.type !== 'besoin') continue;
      if (!s.client_id) continue;
      counts.set(s.client_id, (counts.get(s.client_id) || 0) + 1);
    }
    return counts;
  }, [SIGNALS]);

  // Besoins agreges depuis les signaux (type=besoin) si un filtre client est actif.
  // Sinon, on prend la table needs directement (pre-agregee par la pipeline).
  const displayedNeeds = useMemo(() => {
    if (clientFilter === 'all') {
      // Aggregate by label to deduplicate (same need may appear across multiple CRs)
      const map = new Map<string, { label: string; mentions: number; trend: string }>();
      for (const need of NEEDS || []) {
        const key = (need.label || '').trim();
        if (!key) continue;
        if (!map.has(key)) {
          map.set(key, { label: key, mentions: 0, trend: need.trend || 'stable' });
        }
        map.get(key)!.mentions += need.mentions || 1;
      }
      return Array.from(map.values())
        .sort((a, b) => b.mentions - a.mentions)
        .map((e, i) => ({ rank: i + 1, ...e, evolution: 0 }));
    }
    // Agregation from signals ciblee par client status
    const map = new Map<string, { label: string; mentions: number; clients: Set<string> }>();
    for (const s of SIGNALS || []) {
      if (s.type !== 'besoin') continue;
      if (!s.title) continue;
      const count = clientStatus.get(s.client_id) || 0;
      const isNouveau = count <= 1;
      if (clientFilter === 'nouveau' && !isNouveau) continue;
      if (clientFilter === 'etabli' && isNouveau) continue;
      const key = s.title.trim();
      if (!map.has(key)) map.set(key, { label: key, mentions: 0, clients: new Set() });
      const entry = map.get(key)!;
      entry.mentions += 1;
      if (s.client_id) entry.clients.add(s.client_id);
    }
    return Array.from(map.values())
      .sort((a, b) => b.mentions - a.mentions)
      .map((e, i) => ({
        rank: i + 1,
        label: e.label,
        mentions: e.mentions,
        evolution: 0,
        trend: 'stable' as const,
        nbClients: e.clients.size,
      }));
  }, [clientFilter, NEEDS, SIGNALS, clientStatus]);

  const maxMentions = displayedNeeds.length > 0 ? Math.max(...displayedNeeds.map((n) => n.mentions)) : 0;
  const chartData = displayedNeeds.map((n) => ({ name: n.label, mentions: n.mentions }));

  // Nuage de mots : on eclate les labels pour chaque item en mots cles (>3 lettres, pas stop words)
  // Chaque mot est credite de 'mentions' pour son poids d'affichage.
  const wordCloud = useMemo(() => {
    const STOP = new Set([
      'dans', 'avec', 'pour', 'sans', 'plus', 'tres', 'etre', 'leur', 'leurs', 'elle', 'cela', 'cette',
      'ceux', 'notre', 'votre', 'chez', 'cest', 'cette', 'ainsi', 'sous', 'entre', 'vers', 'apres',
      'depuis', 'donc', 'mais', 'quand', 'comme', 'parce', 'avant', 'tout', 'tous', 'toutes', 'autre',
      'meme', 'peu', 'sur', 'ete', 'the', 'and', 'for',
    ]);
    const counts = new Map<string, number>();
    for (const n of displayedNeeds) {
      const tokens = (n.label || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // strip accents
        .replace(/[^a-z\s-]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 3 && !STOP.has(w));
      for (const t of tokens) {
        counts.set(t, (counts.get(t) || 0) + n.mentions);
      }
    }
    return Array.from(counts.entries())
      .map(([word, weight]) => ({ word, weight }))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 30); // top 30 mots
  }, [displayedNeeds]);

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

      {/* Filter pills */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider mr-1">Filtre client</span>
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            onClick={() => setClientFilter(opt.key)}
            title={opt.hint}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              clientFilter === opt.key
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Nuage de mots */}
      {wordCloud.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-1">
            <Cloud className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-semibold text-slate-900">Nuage de mots</h2>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Taille proportionnelle au nombre de mentions dans les besoins exprimes.
            {clientFilter !== 'all' && (
              <> Filtre actif : <span className="font-medium text-slate-700">{FILTER_OPTIONS.find((o) => o.key === clientFilter)?.label}</span>.</>
            )}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 min-h-[140px] py-2">
            {wordCloud.map(({ word, weight }, idx) => (
              <span
                key={word}
                className="font-semibold leading-tight transition-colors hover:opacity-75"
                style={{
                  fontSize: `${fontSizeForRank(idx + 1, wordCloud.length)}px`,
                  color: WORDCLOUD_COLORS[Math.min(Math.floor((idx / wordCloud.length) * WORDCLOUD_COLORS.length), WORDCLOUD_COLORS.length - 1)],
                }}
                title={`${weight} mention${weight > 1 ? 's' : ''}`}
              >
                {word}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Ranked list */}
      {displayedNeeds.length === 0 ? (
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 text-center text-sm text-slate-500">
          Aucun besoin exprime pour ce filtre.
        </div>
      ) : (
        <div className="space-y-3">
          {displayedNeeds.map((need) => {
            const barWidth = maxMentions > 0 ? (need.mentions / maxMentions) * 100 : 0;
            const trend = TREND_CONFIG[need.trend] || TREND_CONFIG.stable;
            const TrendIcon = trend.Icon;
            return (
              <div
                key={`${need.rank}-${need.label}`}
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
                        {clientFilter !== 'all' && (need as any).nbClients !== undefined && (
                          <span className="text-xs text-slate-500 tabular-nums">{(need as any).nbClients} client{(need as any).nbClients > 1 ? 's' : ''}</span>
                        )}
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
      )}

      {/* Bar chart */}
      {chartData.length > 0 && (
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
      )}
    </div>
  );
}
