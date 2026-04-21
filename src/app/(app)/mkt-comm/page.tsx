// @ts-nocheck
'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useAppData } from '@/lib/data';
import { KpiCard } from '@/components/shared/kpi-card';
import { formatDate } from '@/lib/utils';
import type { CommType, ReactionClient, CommConcurrente } from '@/lib/types-v2';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, Legend,
} from 'recharts';
import {
  Megaphone, ThumbsUp, TrendingUp, Sparkles, ChevronDown, MapPin, Info,
} from 'lucide-react';

// Liste blanche des actions qui relevent purement de la COMMUNICATION externe.
// Partenariat/autre relevent du commercial/marketing au sens large — exclus ici.
const COMM_ACTIONS: CommType[] = ['salon', 'pub', 'emailing', 'social', 'presse', 'sponsoring'];

const COMM_TYPE_LABELS: Record<CommType, string> = {
  salon: 'Salon',
  pub: 'Publicite',
  emailing: 'Emailing',
  social: 'Social media',
  presse: 'Presse',
  sponsoring: 'Sponsoring',
  partenariat: 'Partenariat',
  autre: 'Autre',
};

const COMM_TYPE_COLORS: Record<CommType, { bg: string; text: string; border: string; dot: string }> = {
  salon: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', dot: 'bg-violet-500' },
  pub: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', dot: 'bg-sky-500' },
  emailing: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
  social: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', dot: 'bg-indigo-500' },
  presse: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200', dot: 'bg-slate-500' },
  sponsoring: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500' },
  partenariat: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  autre: { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', dot: 'bg-slate-400' },
};

const EVOLUTION_COLORS = ['#6366f1', '#e11d48', '#f59e0b', '#10b981', '#8b5cf6', '#06b6d4'];

function weekKey(d: Date): string {
  const year = d.getUTCFullYear();
  const jan1 = new Date(Date.UTC(year, 0, 1));
  const diff = (d.getTime() - jan1.getTime()) / 86400000;
  const week = Math.ceil((diff + jan1.getUTCDay() + 1) / 7);
  return `${year}-S${String(week).padStart(2, '0')}`;
}

const REACTION_CONFIG: Record<ReactionClient, { bg: string; text: string; border: string; label: string }> = {
  positive: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Positive' },
  neutre: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200', label: 'Neutre' },
  negative: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', label: 'Negative' },
};

const BAR_COLORS = ['#6366f1', '#e11d48', '#f59e0b', '#10b981', '#8b5cf6'];

// Une action est "nouvelle" si elle date de moins de 30 jours.
const NEW_ACTION_WINDOW_MS = 30 * 86400 * 1000;

type CompetitorCard = {
  concurrent_nom: string;
  actions: CommConcurrente[];
  nouvelles: number;
  typeCounts: Map<CommType, number>;
  reactionCounts: Record<ReactionClient, number>;
  regionCounts: Map<string, number>;
  totalMentions: number;
};

export default function MktCommPage() {
  const { commConcurrentes: RAW_COMMS } = useAppData();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  // On ne garde que les actions de communication pure (salon, pub, emailing, social, presse, sponsoring).
  // Les entrees restantes ('autre', 'partenariat') sont des activites commerciales/marketing au sens large.
  const COMM_CONCURRENTES = useMemo(
    () => (RAW_COMMS || []).filter((c: any) => COMM_ACTIONS.includes(c.type_action)),
    [RAW_COMMS],
  );

  const totalActions = COMM_CONCURRENTES.length;
  const reactionsPositives = useMemo(
    () => COMM_CONCURRENTES.filter((c) => c.reaction_client === 'positive').length,
    [COMM_CONCURRENTES],
  );

  // Regroupement par concurrent : totaux + repartition type + reactions + region.
  const cards: CompetitorCard[] = useMemo(() => {
    const now = Date.now();
    const map = new Map<string, CompetitorCard>();
    for (const a of COMM_CONCURRENTES) {
      if (!map.has(a.concurrent_nom)) {
        map.set(a.concurrent_nom, {
          concurrent_nom: a.concurrent_nom,
          actions: [],
          nouvelles: 0,
          typeCounts: new Map(),
          reactionCounts: { positive: 0, neutre: 0, negative: 0 },
          regionCounts: new Map(),
          totalMentions: 0,
        });
      }
      const c = map.get(a.concurrent_nom)!;
      c.actions.push(a);
      const ts = new Date(a.date).getTime();
      if (!Number.isNaN(ts) && now - ts <= NEW_ACTION_WINDOW_MS) c.nouvelles++;
      c.typeCounts.set(a.type_action, (c.typeCounts.get(a.type_action) || 0) + 1);
      c.reactionCounts[a.reaction_client] = (c.reactionCounts[a.reaction_client] || 0) + 1;
      if (a.region) c.regionCounts.set(a.region, (c.regionCounts.get(a.region) || 0) + 1);
      c.totalMentions += a.count_mentions || 1;
    }
    return Array.from(map.values())
      .map((c) => ({
        ...c,
        actions: [...c.actions].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        ),
      }))
      .sort((a, b) => b.actions.length - a.actions.length);
  }, [COMM_CONCURRENTES]);

  const barData = useMemo(() => {
    const map: Record<string, number> = {};
    COMM_CONCURRENTES.forEach((c) => {
      map[c.concurrent_nom] = (map[c.concurrent_nom] || 0) + 1;
    });
    return Object.entries(map)
      .map(([nom, count]) => ({ nom, actions: count }))
      .sort((a, b) => b.actions - a.actions);
  }, [COMM_CONCURRENTES]);

  // Evolution hebdo : on compte le nombre d'actions par (concurrent + type_action) par semaine.
  // On ne trace que les paires (concurrent, type_action) ayant >=2 occurrences (= amplification)
  const evolutionData = useMemo(() => {
    if (COMM_CONCURRENTES.length === 0) return { rows: [], series: [] };

    const pairCounts = new Map<string, number>();
    for (const c of COMM_CONCURRENTES) {
      const key = `${c.concurrent_nom} - ${COMM_TYPE_LABELS[c.type_action] || c.type_action}`;
      pairCounts.set(key, (pairCounts.get(key) || 0) + (c.count_mentions || 1));
    }
    const amplifiedPairs = Array.from(pairCounts.entries())
      .filter(([, n]) => n >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([k]) => k);

    if (amplifiedPairs.length === 0) return { rows: [], series: [] };

    const now = new Date();
    const buckets: string[] = [];
    for (let i = 7; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 7 * 86400000);
      buckets.push(weekKey(d));
    }
    const rows: Record<string, any>[] = buckets.map((wk) => {
      const row: Record<string, any> = { semaine: wk };
      for (const p of amplifiedPairs) row[p] = 0;
      return row;
    });
    const rowByKey = new Map(rows.map((r, i) => [buckets[i], r]));

    for (const c of COMM_CONCURRENTES) {
      const pairKey = `${c.concurrent_nom} - ${COMM_TYPE_LABELS[c.type_action] || c.type_action}`;
      if (!amplifiedPairs.includes(pairKey)) continue;
      if (!c.date) continue;
      const wk = weekKey(new Date(c.date));
      const row = rowByKey.get(wk);
      if (!row) continue;
      row[pairKey] = (row[pairKey] || 0) + (c.count_mentions || 1);
    }

    return { rows, series: amplifiedPairs };
  }, [COMM_CONCURRENTES]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600">
          <Megaphone className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Suivi Communications Concurrentes</h1>
          <p className="text-sm text-slate-500">
            Actions de communication externe (salon, pub, emailing, social, presse, sponsoring)
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <KpiCard
          label="Actions detectees"
          value={totalActions}
          icon={<Megaphone className="w-5 h-5" />}
          iconColor="text-indigo-600 bg-indigo-50"
        />
        <KpiCard
          label="Reactions positives"
          value={reactionsPositives}
          icon={<ThumbsUp className="w-5 h-5" />}
          iconColor="text-emerald-600 bg-emerald-50"
        />
      </div>

      {/* Panneau d'aide : explique comment les donnees sont extraites et
          comment lire les indicateurs de chaque carte concurrent. */}
      <div className="bg-sky-50/70 border border-sky-200 rounded-xl">
        <button
          type="button"
          onClick={() => setShowHelp((v) => !v)}
          className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left"
        >
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-sky-600 shrink-0" />
            <span className="text-sm font-semibold text-sky-900">
              Comment lire ces indicateurs&nbsp;?
            </span>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-sky-700 transition-transform ${showHelp ? 'rotate-180' : ''}`}
          />
        </button>
        {showHelp && (
          <div className="px-4 pb-4 pt-1 text-xs text-sky-900 space-y-2 leading-relaxed">
            <p>
              <strong>D&apos;ou viennent les donnees&nbsp;?</strong> Chaque
              action de communication concurrente (salon, pub, emailing, social
              media, presse, sponsoring) est extraite automatiquement des
              comptes-rendus de visite saisis par les commerciaux, via analyse
              par IA. Une meme action peut etre mentionnee par plusieurs CR —
              c&apos;est ce qu&apos;on appelle les <em>mentions</em>.
            </p>
            <p>
              <strong>Actions vs mentions&nbsp;:</strong>{' '}
              <span className="font-mono">N actions</span> = nombre d&apos;actions
              distinctes detectees ;{' '}
              <span className="font-mono">N mentions</span> = nombre total de fois
              ou ces actions ont ete citees par les commerciaux (plus une action
              est mentionnee, plus elle est visible sur le terrain).
            </p>
            <p>
              <strong>Badge &laquo;&nbsp;nouvelle&nbsp;&raquo;</strong> : une
              action apparaissant pour la premiere fois dans un CR dans les 30
              derniers jours.
            </p>
            <p>
              <strong>Reactions clients</strong> : lorsqu&apos;un commercial
              remonte une action concurrente, il indique (ou l&apos;IA deduit du
              verbatim) si le client a reagi positivement (curiosite / interet /
              demande), de maniere neutre (information factuelle) ou
              negativement (scepticisme / rejet). La barre colore en vert le
              pourcentage de reactions positives, en gris le neutre, en rouge le
              negatif. Les chiffres sous la barre sont les <em>compteurs</em>
              {' '}associes&nbsp;: une polarite positive avec {' '}
              <span className="inline-flex px-1 rounded bg-emerald-100 text-emerald-800 font-mono">
                +N
              </span>
              , neutre{' '}
              <span className="inline-flex px-1 rounded bg-slate-200 text-slate-700 font-mono">
                =N
              </span>
              , negative{' '}
              <span className="inline-flex px-1 rounded bg-rose-100 text-rose-800 font-mono">
                -N
              </span>
              .
            </p>
            <p>
              <strong>Region dominante</strong> : region ayant le plus grand
              nombre d&apos;actions detectees pour ce concurrent — indique ou il
              concentre ses efforts.
            </p>
            <p>
              <strong>Evolution des actions recurrentes</strong> (graphique en
              bas) : seules les paires{' '}
              <em>(concurrent + type d&apos;action)</em> apparaissant au moins 2
              fois sont tracees, pour mettre en evidence une <strong>amplification</strong>
              (ex. pub Instagram qui monte en puissance). Les paires isolees
              sont filtrees pour garder la lisibilite.
            </p>
          </div>
        )}
      </div>

      {/* Cards par concurrent */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-900">Par concurrent</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {cards.map((c) => {
            const isOpen = expanded === c.concurrent_nom;
            const totalReactions =
              c.reactionCounts.positive + c.reactionCounts.neutre + c.reactionCounts.negative;
            const pct = (n: number) =>
              totalReactions > 0 ? Math.round((n / totalReactions) * 100) : 0;
            const topRegion = Array.from(c.regionCounts.entries()).sort(
              (a, b) => b[1] - a[1],
            )[0];
            return (
              <div
                key={c.concurrent_nom}
                className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col"
              >
                {/* Header */}
                <div className="px-5 pt-4 pb-3 border-b border-slate-100 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/concurrent/${encodeURIComponent(c.concurrent_nom)}`}
                      className="font-semibold text-slate-900 hover:text-indigo-700 hover:underline underline-offset-2 truncate block"
                      title="Ouvrir la fiche concurrent"
                    >
                      {c.concurrent_nom}
                    </Link>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {c.actions.length} action{c.actions.length > 1 ? 's' : ''} • {c.totalMentions} mentions
                    </p>
                  </div>
                  {c.nouvelles > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                      <Sparkles className="w-3 h-3" />
                      {c.nouvelles} nouvelle{c.nouvelles > 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                {/* Reactions bar (stacked %) — Les segments sont proportionnels
                    au nombre de CR citant cette reaction pour ce concurrent.
                    Les 3 compteurs sous la barre sont explicites : positives,
                    neutres, negatives. */}
                <div className="px-5 pt-3 pb-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] text-slate-500 uppercase tracking-wider">
                      Reactions clients
                    </span>
                    <span
                      className="inline-flex items-center text-slate-400"
                      title="Proportion des reactions positives / neutres / negatives relevees par les commerciaux dans leurs CR. Total = 100%."
                    >
                      <Info className="w-3 h-3" />
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full overflow-hidden bg-slate-100 flex">
                    {c.reactionCounts.positive > 0 && (
                      <div
                        className="bg-emerald-500 h-full"
                        style={{ width: `${pct(c.reactionCounts.positive)}%` }}
                        title={`Positive : ${c.reactionCounts.positive} (${pct(c.reactionCounts.positive)}%)`}
                      />
                    )}
                    {c.reactionCounts.neutre > 0 && (
                      <div
                        className="bg-slate-400 h-full"
                        style={{ width: `${pct(c.reactionCounts.neutre)}%` }}
                        title={`Neutre : ${c.reactionCounts.neutre} (${pct(c.reactionCounts.neutre)}%)`}
                      />
                    )}
                    {c.reactionCounts.negative > 0 && (
                      <div
                        className="bg-rose-500 h-full"
                        style={{ width: `${pct(c.reactionCounts.negative)}%` }}
                        title={`Negative : ${c.reactionCounts.negative} (${pct(c.reactionCounts.negative)}%)`}
                      />
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-2 text-[11px] tabular-nums">
                    <span className="inline-flex items-center gap-1 text-emerald-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {c.reactionCounts.positive} positive{c.reactionCounts.positive > 1 ? 's' : ''}
                    </span>
                    <span className="inline-flex items-center gap-1 text-slate-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                      {c.reactionCounts.neutre} neutre{c.reactionCounts.neutre > 1 ? 's' : ''}
                    </span>
                    <span className="inline-flex items-center gap-1 text-rose-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      {c.reactionCounts.negative} negative{c.reactionCounts.negative > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {/* Types d'action */}
                <div className="px-5 py-3 border-t border-slate-100">
                  <div className="text-[11px] text-slate-500 uppercase tracking-wider mb-2">
                    Types d&apos;action
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {Array.from(c.typeCounts.entries())
                      .sort((a, b) => b[1] - a[1])
                      .map(([type, n]) => {
                        const cfg = COMM_TYPE_COLORS[type];
                        return (
                          <span
                            key={type}
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.text} ${cfg.border}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                            {COMM_TYPE_LABELS[type]}
                            <span className="text-[10px] opacity-70 tabular-nums">×{n}</span>
                          </span>
                        );
                      })}
                  </div>
                </div>

                {/* Region dominante */}
                {topRegion && (
                  <div className="px-5 pb-3 text-xs text-slate-500 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    Region dominante :{' '}
                    <span className="font-medium text-slate-700">{topRegion[0]}</span>
                    <span className="text-slate-400">({topRegion[1]})</span>
                  </div>
                )}

                {/* Expand */}
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : c.concurrent_nom)}
                  className="mt-auto px-5 py-2.5 border-t border-slate-100 text-xs font-medium text-indigo-600 hover:bg-indigo-50/50 transition-colors flex items-center justify-center gap-1"
                >
                  {isOpen
                    ? 'Masquer le detail'
                    : `Voir les ${c.actions.length} action${c.actions.length > 1 ? 's' : ''}`}
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {isOpen && (
                  <div className="border-t border-slate-100 divide-y divide-slate-100">
                    {c.actions.map((a) => {
                      const cfg = COMM_TYPE_COLORS[a.type_action];
                      const rc = REACTION_CONFIG[a.reaction_client];
                      return (
                        <div key={a.id} className="px-5 py-3 space-y-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.text} ${cfg.border}`}
                            >
                              {COMM_TYPE_LABELS[a.type_action]}
                            </span>
                            <span
                              className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium border ${rc.bg} ${rc.text} ${rc.border}`}
                            >
                              {rc.label}
                            </span>
                          </div>
                          <p className="text-sm text-slate-700">{a.description}</p>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                            <span className="tabular-nums">{formatDate(a.date)}</span>
                            <span>{a.region}</span>
                            <span>
                              {a.count_mentions} mention{a.count_mentions > 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {cards.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500 text-sm">
            Aucune action de communication concurrente detectee.
          </div>
        )}
      </div>

      {/* Evolution hebdo — amplification des actions comm */}
      {evolutionData.series.length > 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-semibold text-slate-900">Evolution des actions recurrentes</h2>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Actions (concurrent + type) apparaissant plusieurs fois — permet de detecter une amplification.
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={evolutionData.rows} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <XAxis
                  dataKey="semaine"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '0.75rem',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    fontSize: 12,
                  }}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: '#64748b' }} />
                {evolutionData.series.map((key, idx) => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={EVOLUTION_COLORS[idx % EVOLUTION_COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        COMM_CONCURRENTES.length > 0 && (
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 text-xs text-slate-500 text-center">
            Pas encore d&apos;action comm recurrente detectee (aucune paire concurrent + type avec &ge; 2 occurrences).
          </div>
        )
      )}

      {/* Bar chart — actions par concurrent */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Actions par concurrent</h2>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <XAxis
                dataKey="nom"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#334155', fontSize: 12, fontWeight: 500 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '0.75rem',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                }}
                formatter={(value) => [`${value}`, 'Actions']}
              />
              <Bar dataKey="actions" radius={[6, 6, 0, 0]} barSize={36}>
                {barData.map((_, index) => (
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
