// @ts-nocheck
'use client';

import { use, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAppData } from '@/lib/data';
import { SeverityBadge } from '@/components/shared/severity-badge';
import { CRReference } from '@/components/shared/cr-reference';
import { formatDate } from '@/lib/utils';
import type {
  OffreType, CommType, ReactionClient, Attribut, ValeurPercue,
} from '@/lib/types-v2';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Radar as RechartsRadar, ResponsiveContainer, Tooltip, Legend,
  LineChart, Line, XAxis, YAxis,
} from 'recharts';
import {
  ArrowLeft, Building2, Package, Megaphone, CircleDollarSign, Crosshair,
  Sparkles, Flame, MapPin, TrendingUp,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Constantes de labels/couleurs reprises des pages mkt-*. Gardees locales
// pour eviter de transformer les pages existantes en modules partages.
// ---------------------------------------------------------------------------
const OFFRE_TYPE_LABELS: Record<OffreType, string> = {
  bundle: 'Bundle',
  promotion: 'Promotion',
  nouvelle_gamme: 'Nouvelle gamme',
  conditions_paiement: 'Conditions paiement',
  essai_gratuit: 'Essai gratuit',
  autre: 'Autre',
};
const OFFRE_TYPE_COLORS: Record<OffreType, { bg: string; text: string; border: string }> = {
  bundle: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
  promotion: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  nouvelle_gamme: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  conditions_paiement: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  essai_gratuit: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  autre: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' },
};
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
const COMM_TYPE_COLORS: Record<CommType, { bg: string; text: string; border: string }> = {
  salon: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
  pub: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  emailing: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  social: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  presse: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
  sponsoring: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  partenariat: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  autre: { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' },
};
const REACTION_CONFIG: Record<ReactionClient, { bg: string; text: string; border: string; label: string }> = {
  positive: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Positive' },
  neutre: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200', label: 'Neutre' },
  negative: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', label: 'Negative' },
};

const ATTRIBUTS: Attribut[] = ['prix', 'qualite', 'sav', 'delai', 'relation', 'innovation'];
const ATTRIBUT_LABELS: Record<Attribut, string> = {
  prix: 'Prix',
  qualite: 'Qualite',
  sav: 'SAV',
  delai: 'Delai',
  relation: 'Relation',
  innovation: 'Innovation',
};
const VALEUR_NUMERIC: Record<ValeurPercue, number> = { fort: 3, moyen: 2, faible: 1 };
const VALEUR_CONFIG: Record<ValeurPercue, { bg: string; text: string; border: string; label: string }> = {
  fort: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Fort' },
  moyen: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'Moyen' },
  faible: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', label: 'Faible' },
};

type TabKey = 'offres' | 'comm' | 'prix' | 'pos';
const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: 'offres', label: 'Offres', icon: Package },
  { key: 'comm', label: 'Communications', icon: Megaphone },
  { key: 'prix', label: 'Prix', icon: CircleDollarSign },
  { key: 'pos', label: 'Positionnement', icon: Crosshair },
];

// Seuil "nouveaute" pour offres et actions comm : premiere mention < 30j.
const NEW_WINDOW_MS = 30 * 86400 * 1000;

export default function FicheConcurrentPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name: rawName } = use(params);
  const decodedName = decodeURIComponent(rawName);

  const {
    competitors: COMPETITORS,
    offresConcurrentes: OFFRES,
    commConcurrentes: COMMS,
    prixSignals: PRIX,
    positionnement: POSITIONNEMENT,
    signals: SIGNALS_ALL,
    dealsAnalyse: DEALS_MK_ALL,
    dealsCommerciaux: DEALS_CO_ALL,
  } = useAppData();

  // Matching case-insensitive : le concurrent_nom peut differer legerement
  // de competitors.name selon la source (LLM). On fait le match sur lowercase.
  const lowerName = decodedName.toLowerCase();
  const competitor = useMemo(
    () => COMPETITORS.find((c: any) => (c.name || '').toLowerCase() === lowerName),
    [COMPETITORS, lowerName],
  );

  const offres = useMemo(
    () =>
      (OFFRES || [])
        .filter((o: any) => (o.concurrent_nom || '').toLowerCase() === lowerName)
        .sort((a: any, b: any) => b.count_mentions - a.count_mentions),
    [OFFRES, lowerName],
  );
  const comms = useMemo(
    () =>
      (COMMS || [])
        .filter((c: any) => (c.concurrent_nom || '').toLowerCase() === lowerName)
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [COMMS, lowerName],
  );
  const prix = useMemo(
    () =>
      (PRIX || [])
        .filter((p: any) => (p.concurrent_nom || '').toLowerCase() === lowerName)
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [PRIX, lowerName],
  );
  const positionnement = useMemo(
    () => (POSITIONNEMENT || []).filter((p: any) => (p.acteur || '').toLowerCase() === lowerName),
    [POSITIONNEMENT, lowerName],
  );

  const [activeTab, setActiveTab] = useState<TabKey>('offres');

  const hasAnyData =
    competitor ||
    offres.length > 0 ||
    comms.length > 0 ||
    prix.length > 0 ||
    positionnement.length > 0;

  if (!hasAnyData) {
    return (
      <div className="space-y-6">
        <Link
          href="/radar"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour au radar concurrentiel
        </Link>
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <Building2 className="w-10 h-10 mx-auto text-slate-300 mb-3" />
          <h1 className="text-lg font-bold text-slate-900">{decodedName}</h1>
          <p className="text-sm text-slate-500 mt-2">
            Aucune donnee remontee par les CR terrain pour ce concurrent.
          </p>
        </div>
      </div>
    );
  }

  // KPIs resume
  const now = Date.now();
  const offresActives = offres.filter((o: any) => o.statut === 'active').length;
  const offresNouvelles = offres.filter((o: any) => {
    const t = new Date(o.date_premiere_mention).getTime();
    return !Number.isNaN(t) && now - t <= NEW_WINDOW_MS;
  }).length;
  const commsNouvelles = comms.filter((c: any) => {
    const t = new Date(c.date).getTime();
    return !Number.isNaN(t) && now - t <= NEW_WINDOW_MS;
  }).length;
  const totalDealsImpactes = offres.reduce((acc: number, o: any) => acc + o.deals_impactes, 0);
  const totalDealsPerdus = offres.reduce((acc: number, o: any) => acc + o.deals_perdus, 0);
  // ecart_pct est nullable (signaux qualitatifs). On filtre avant moyenne pour
  // eviter NaN / 0 trompeur.
  const prixQuants = prix.filter(
    (p: any) => typeof p.ecart_pct === 'number' && Number.isFinite(p.ecart_pct),
  );
  const ecartMoyenAbs =
    prixQuants.length > 0
      ? prixQuants.reduce((acc: number, p: any) => acc + Math.abs(p.ecart_pct), 0) / prixQuants.length
      : null;

  // ── Forces & Faiblesses du concurrent ────────────────────────────────────
  // Synthese : que ce concurrent gagne ou perd CONTRE NOUS, sur 4 axes
  // (offres, prix, communications, signaux). Aide le marketeur et le commercial
  // a savoir ou attaquer / defendre.
  const offresForces = offres
    .filter((o: any) => (o.deals_perdus || 0) > (o.deals_gagnes || 0))
    .sort((a: any, b: any) => (b.deals_perdus || 0) - (a.deals_perdus || 0))
    .slice(0, 3);
  const offresFaiblesses = offres
    .filter((o: any) => (o.deals_gagnes || 0) > (o.deals_perdus || 0))
    .sort((a: any, b: any) => (b.deals_gagnes || 0) - (a.deals_gagnes || 0))
    .slice(0, 3);

  // Prix : "fort sur le prix" = il est plus bas que nous ET a gagne le deal
  const prixForces = prix.filter(
    (p: any) => p.ecart_type === 'inferieur' && p.statut_deal === 'perdu',
  ).length;
  // "Faible sur le prix" = il est plus cher que nous OU on a gagne le deal
  const prixFaiblesses = prix.filter(
    (p: any) => p.ecart_type === 'superieur' || p.statut_deal === 'gagne',
  ).length;

  // Communications : reaction_client agrege
  const commPositif = comms.filter((c: any) => c.reaction_client === 'positive').length;
  const commNegatif = comms.filter((c: any) => c.reaction_client === 'negative').length;

  // Top 2 motifs des deals perdus (= ce qui marche pour le concurrent)
  // Et top 2 motifs des deals gagnes (= ce qu'il rate)
  const motifsPerdus = new Map<string, number>();
  const motifsGagnes = new Map<string, number>();
  for (const o of offres) {
    const tag = o.type_offre || 'autre';
    if ((o.deals_perdus || 0) > 0)
      motifsPerdus.set(tag, (motifsPerdus.get(tag) || 0) + (o.deals_perdus || 0));
    if ((o.deals_gagnes || 0) > 0)
      motifsGagnes.set(tag, (motifsGagnes.get(tag) || 0) + (o.deals_gagnes || 0));
  }
  const topMotifsPerdus = Array.from(motifsPerdus.entries()).sort((a, b) => b[1] - a[1]).slice(0, 2);
  const topMotifsGagnes = Array.from(motifsGagnes.entries()).sort((a, b) => b[1] - a[1]).slice(0, 2);

  // ── Fallback : si aucune offre/comm/prix structuree, on alimente Forces &
  // Faiblesses depuis les SIGNAUX et les deals_commerciaux/marketing qui
  // mentionnent ce concurrent. Ca donne du contenu meme quand l'IA n'a pas
  // genere d'offres_concurrentes (cas frequent : remontees CR sans offre
  // formelle declaree). Les conditions qui suivent se cumulent avec les
  // calculs deja faits plus haut.
  const sigsThisComp = (SIGNALS_ALL || []).filter(
    (s: any) => (s.competitor_name || '').toLowerCase() === lowerName,
  );
  // Signaux severite rouge/orange = menace = force concurrent
  const sigsForces = sigsThisComp.filter(
    (s: any) => s.severity === 'rouge' || s.severity === 'orange',
  ).length;
  // Signaux verts (satisfaction client chez nous, opportunite) = faiblesse concurrent
  const sigsFaiblesses = sigsThisComp.filter(
    (s: any) => s.severity === 'vert' || s.type === 'echec',
  ).length;

  // Deals (commerciaux + marketing) impliquant ce concurrent
  const allDeals = [
    ...(DEALS_MK_ALL || []).map((d: any) => ({ ...d, source: 'mk' })),
    ...(DEALS_CO_ALL || []).map((d: any) => ({ ...d, source: 'co' })),
  ].filter((d: any) => (d.concurrent_nom || '').toLowerCase() === lowerName);
  // Deals perdus contre ce concurrent = il gagne contre nous
  const dealsPerdus = allDeals.filter((d: any) => d.resultat === 'perdu');
  const dealsGagnes = allDeals.filter((d: any) => d.resultat === 'gagne');

  // Compteurs de motifs pour les forces (= ce qui pousse les clients vers eux)
  for (const d of dealsPerdus) {
    const tag = d.motif_principal || d.motif || 'autre';
    motifsPerdus.set(tag, (motifsPerdus.get(tag) || 0) + 1);
  }
  for (const d of dealsGagnes) {
    const tag = d.motif_principal || d.motif || 'autre';
    motifsGagnes.set(tag, (motifsGagnes.get(tag) || 0) + 1);
  }
  const topMotifsPerdusAll = Array.from(motifsPerdus.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const topMotifsGagnesAll = Array.from(motifsGagnes.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3);

  // Top verbatims (citations) issues des deals perdus / gagnes — concret et
  // actionable pour le commercial. On garde le source_report_id pour pouvoir
  // ouvrir le CR d'origine au clic.
  const verbatimsForces = dealsPerdus
    .filter((d: any) => d.verbatim && d.verbatim.length > 20)
    .slice(0, 3)
    .map((d: any) => ({ verbatim: d.verbatim as string, sourceId: d.source_report_id as string | null }));
  const verbatimsFaiblesses = dealsGagnes
    .filter((d: any) => d.verbatim && d.verbatim.length > 20)
    .slice(0, 3)
    .map((d: any) => ({ verbatim: d.verbatim as string, sourceId: d.source_report_id as string | null }));

  // Pour les motifs, on collecte les source_report_id contributeurs par tag
  // pour permettre de cliquer "+5 deals motif=prix" et voir les 5 CRs sources.
  const sourcesByMotifPerdus = new Map<string, string[]>();
  const sourcesByMotifGagnes = new Map<string, string[]>();
  for (const d of dealsPerdus) {
    const tag = d.motif_principal || d.motif || 'autre';
    if (!sourcesByMotifPerdus.has(tag)) sourcesByMotifPerdus.set(tag, []);
    if (d.source_report_id) sourcesByMotifPerdus.get(tag)!.push(d.source_report_id);
  }
  for (const d of dealsGagnes) {
    const tag = d.motif_principal || d.motif || 'autre';
    if (!sourcesByMotifGagnes.has(tag)) sourcesByMotifGagnes.set(tag, []);
    if (d.source_report_id) sourcesByMotifGagnes.get(tag)!.push(d.source_report_id);
  }

  const hasForcesData =
    offresForces.length > 0 ||
    prixForces > 0 ||
    commPositif > 0 ||
    sigsForces > 0 ||
    dealsPerdus.length > 0;
  const hasFaiblessesData =
    offresFaiblesses.length > 0 ||
    prixFaiblesses > 0 ||
    commNegatif > 0 ||
    sigsFaiblesses > 0 ||
    dealsGagnes.length > 0;

  return (
    <div className="space-y-6">
      {/* Retour */}
      <Link
        href="/radar"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour au radar concurrentiel
      </Link>

      {/* Header concurrent */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-slate-900">
                  {competitor?.name || decodedName}
                </h1>
                {competitor?.is_new && (
                  <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200 uppercase tracking-wider">
                    Nouveau
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500 mt-0.5">
                {competitor?.mention_type || 'Concurrent'}
                {competitor?.mentions != null && (
                  <span className="ml-2 text-slate-400">
                    • {competitor.mentions} mentions
                  </span>
                )}
              </p>
            </div>
          </div>
          {competitor?.risk && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 uppercase tracking-wider">Risque</span>
              <SeverityBadge severity={competitor.risk} size="sm" showLabel />
            </div>
          )}
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
          <FicheKpi
            label="Offres actives"
            value={offresActives}
            sub={offresNouvelles > 0 ? `${offresNouvelles} nouvelles` : undefined}
            tone="indigo"
          />
          <FicheKpi
            label="Actions comm"
            value={comms.length}
            sub={commsNouvelles > 0 ? `${commsNouvelles} nouvelles` : undefined}
            tone="violet"
          />
          <FicheKpi
            label="Signaux prix"
            value={prix.length}
            sub={
              ecartMoyenAbs !== null
                ? `Ecart moy. ${ecartMoyenAbs.toFixed(1)}%`
                : prix.length > 0
                ? `${prix.length} signal(aux) qualitatifs`
                : undefined
            }
            tone="amber"
          />
          <FicheKpi
            label="Deals impactes"
            value={totalDealsImpactes}
            sub={totalDealsPerdus > 0 ? `${totalDealsPerdus} perdus` : undefined}
            tone="rose"
          />
        </div>
      </div>

      {/* Forces & Faiblesses */}
      {(hasForcesData || hasFaiblessesData) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Ce qui FONCTIONNE pour le concurrent (= ce sur quoi il nous bat) */}
          <div className="bg-white rounded-xl border border-rose-200 shadow-sm overflow-hidden">
            <div className="bg-rose-50 border-b border-rose-200 px-5 py-3 flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-rose-100 text-rose-700 text-xs font-bold">
                ↑
              </span>
              <div>
                <h2 className="text-sm font-bold text-rose-900">
                  Ce qui marche pour {decodedName}
                </h2>
                <p className="text-[11px] text-rose-700/80">
                  Forces du concurrent — où il nous bat
                </p>
              </div>
            </div>
            <div className="p-5 space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="rounded-lg border border-rose-100 bg-rose-50/40 py-2">
                  <div className="text-xl font-bold text-rose-700 tabular-nums">{dealsPerdus.length}</div>
                  <div className="text-[10px] text-rose-600/80 uppercase tracking-wider">Deals perdus</div>
                </div>
                <div className="rounded-lg border border-rose-100 bg-rose-50/40 py-2">
                  <div className="text-xl font-bold text-rose-700 tabular-nums">{sigsForces}</div>
                  <div className="text-[10px] text-rose-600/80 uppercase tracking-wider">Signaux menace</div>
                </div>
                <div className="rounded-lg border border-rose-100 bg-rose-50/40 py-2">
                  <div className="text-xl font-bold text-rose-700 tabular-nums">{prixForces}</div>
                  <div className="text-[10px] text-rose-600/80 uppercase tracking-wider">Prix &lt; nous</div>
                </div>
                <div className="rounded-lg border border-rose-100 bg-rose-50/40 py-2">
                  <div className="text-xl font-bold text-rose-700 tabular-nums">{offresForces.length + commPositif}</div>
                  <div className="text-[10px] text-rose-600/80 uppercase tracking-wider">Offres / comm</div>
                </div>
              </div>

              {/* Top motifs perdus (deals + offres) */}
              {topMotifsPerdusAll.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-700 mb-1.5">Pourquoi on perd contre eux</p>
                  <div className="flex flex-wrap gap-1.5">
                    {topMotifsPerdusAll.map(([tag, n]) => {
                      const sources = sourcesByMotifPerdus.get(tag) ?? [];
                      return (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-medium"
                        >
                          {tag}
                          <span className="text-[10px] opacity-70 tabular-nums">×{n}</span>
                          <CRReference
                            reportIds={sources}
                            variant="rose"
                            size="xs"
                            label={`${sources.length}`}
                            contextLabel={`${decodedName} · motif "${tag}" — ${sources.length} CR${sources.length > 1 ? 's' : ''}`}
                          />
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Verbatims des deals perdus */}
              {verbatimsForces.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-700 mb-1.5">Ce que disent les clients qui basculent</p>
                  <ul className="space-y-2">
                    {verbatimsForces.map((v, i) => (
                      <li
                        key={i}
                        className="text-xs text-slate-700 italic leading-snug border-l-2 border-rose-300 pl-3 flex items-start gap-2"
                      >
                        <span className="flex-1">
                          « {v.verbatim.length > 200 ? v.verbatim.slice(0, 200) + '…' : v.verbatim} »
                        </span>
                        {v.sourceId && (
                          <CRReference
                            reportIds={[v.sourceId]}
                            variant="rose"
                            size="xs"
                            label="CR"
                            contextLabel={`Verbatim — ${decodedName}`}
                          />
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Top offres qui marchent (si donnees structurees disponibles) */}
              {offresForces.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-700 mb-1.5">Offres formelles qui marchent</p>
                  <ul className="space-y-1.5">
                    {offresForces.map((o: any) => (
                      <li
                        key={o.id || o.titre}
                        className="text-xs text-slate-700 flex items-start gap-2 leading-snug"
                      >
                        <span className="inline-block w-1 h-1 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                        <span className="flex-1 truncate">
                          <span className="font-semibold">{o.titre || o.type_offre}</span>
                          <span className="text-rose-700 font-mono ml-2 tabular-nums text-[11px]">
                            {o.deals_perdus} perdus
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {!hasForcesData && (
                <p className="text-xs text-slate-400 italic">
                  Aucune force détectée pour ce concurrent dans les CRs analysés.
                </p>
              )}
            </div>
          </div>

          {/* Ce qui NE FONCTIONNE PAS (= leurs faiblesses, on les bat la-dessus) */}
          <div className="bg-white rounded-xl border border-emerald-200 shadow-sm overflow-hidden">
            <div className="bg-emerald-50 border-b border-emerald-200 px-5 py-3 flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                ↓
              </span>
              <div>
                <h2 className="text-sm font-bold text-emerald-900">
                  Ce qui ne marche pas pour {decodedName}
                </h2>
                <p className="text-[11px] text-emerald-700/80">
                  Faiblesses — où vous le battez
                </p>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="rounded-lg border border-emerald-100 bg-emerald-50/40 py-2">
                  <div className="text-xl font-bold text-emerald-700 tabular-nums">{dealsGagnes.length}</div>
                  <div className="text-[10px] text-emerald-600/80 uppercase tracking-wider">Deals gagnés</div>
                </div>
                <div className="rounded-lg border border-emerald-100 bg-emerald-50/40 py-2">
                  <div className="text-xl font-bold text-emerald-700 tabular-nums">{sigsFaiblesses}</div>
                  <div className="text-[10px] text-emerald-600/80 uppercase tracking-wider">Signaux verts</div>
                </div>
                <div className="rounded-lg border border-emerald-100 bg-emerald-50/40 py-2">
                  <div className="text-xl font-bold text-emerald-700 tabular-nums">{prixFaiblesses}</div>
                  <div className="text-[10px] text-emerald-600/80 uppercase tracking-wider">Prix &gt; nous</div>
                </div>
                <div className="rounded-lg border border-emerald-100 bg-emerald-50/40 py-2">
                  <div className="text-xl font-bold text-emerald-700 tabular-nums">{offresFaiblesses.length + commNegatif}</div>
                  <div className="text-[10px] text-emerald-600/80 uppercase tracking-wider">Offres / comm</div>
                </div>
              </div>

              {topMotifsGagnesAll.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-700 mb-1.5">Pourquoi on les bat</p>
                  <div className="flex flex-wrap gap-1.5">
                    {topMotifsGagnesAll.map(([tag, n]) => {
                      const sources = sourcesByMotifGagnes.get(tag) ?? [];
                      return (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium"
                        >
                          {tag}
                          <span className="text-[10px] opacity-70 tabular-nums">×{n}</span>
                          <CRReference
                            reportIds={sources}
                            variant="emerald"
                            size="xs"
                            label={`${sources.length}`}
                            contextLabel={`${decodedName} · motif "${tag}" — ${sources.length} CR${sources.length > 1 ? 's' : ''}`}
                          />
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Verbatims des deals gagnes */}
              {verbatimsFaiblesses.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-700 mb-1.5">Ce que disent les clients qui restent / basculent vers nous</p>
                  <ul className="space-y-2">
                    {verbatimsFaiblesses.map((v, i) => (
                      <li
                        key={i}
                        className="text-xs text-slate-700 italic leading-snug border-l-2 border-emerald-300 pl-3 flex items-start gap-2"
                      >
                        <span className="flex-1">
                          « {v.verbatim.length > 200 ? v.verbatim.slice(0, 200) + '…' : v.verbatim} »
                        </span>
                        {v.sourceId && (
                          <CRReference
                            reportIds={[v.sourceId]}
                            variant="emerald"
                            size="xs"
                            label="CR"
                            contextLabel={`Verbatim — ${decodedName}`}
                          />
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {offresFaiblesses.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-700 mb-1.5">Offres formelles qui décrochent pas</p>
                  <ul className="space-y-1.5">
                    {offresFaiblesses.map((o: any) => (
                      <li
                        key={o.id || o.titre}
                        className="text-xs text-slate-700 flex items-start gap-2 leading-snug"
                      >
                        <span className="inline-block w-1 h-1 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                        <span className="flex-1 truncate">
                          <span className="font-semibold">{o.titre || o.type_offre}</span>
                          <span className="text-emerald-700 font-mono ml-2 tabular-nums text-[11px]">
                            {o.deals_gagnes} gagnés
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {!hasFaiblessesData && (
                <p className="text-xs text-slate-400 italic">
                  Aucune faiblesse détectée pour ce concurrent dans les CRs analysés.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-1 -mb-px" aria-label="Tabs">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.key;
            const count =
              t.key === 'offres'
                ? offres.length
                : t.key === 'comm'
                ? comms.length
                : t.key === 'prix'
                ? prix.length
                : positionnement.length;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setActiveTab(t.key)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  active
                    ? 'border-indigo-600 text-indigo-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
                <span
                  className={`inline-flex items-center justify-center min-w-[1.25rem] h-5 rounded-full text-[11px] font-semibold tabular-nums px-1.5 ${
                    active ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === 'offres' && <TabOffres offres={offres} />}
      {activeTab === 'comm' && <TabComm comms={comms} />}
      {activeTab === 'prix' && <TabPrix prix={prix} />}
      {activeTab === 'pos' && (
        <TabPositionnement entries={positionnement} actorName={competitor?.name || decodedName} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sous-composants
// ---------------------------------------------------------------------------
function FicheKpi({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: number;
  sub?: string;
  tone: 'indigo' | 'violet' | 'amber' | 'rose';
}) {
  const toneClass: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-700',
    violet: 'bg-violet-50 text-violet-700',
    amber: 'bg-amber-50 text-amber-700',
    rose: 'bg-rose-50 text-rose-700',
  };
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-3">
      <div className="text-[11px] text-slate-500 uppercase tracking-wider">{label}</div>
      <div className="text-2xl font-bold text-slate-900 tabular-nums mt-1">{value}</div>
      {sub && (
        <div className={`inline-flex mt-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${toneClass[tone]}`}>
          {sub}
        </div>
      )}
    </div>
  );
}

function TabOffres({ offres }: { offres: any[] }) {
  if (offres.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-sm text-slate-500">
        Aucune offre detectee pour ce concurrent.
      </div>
    );
  }
  // Repartition par type
  const typeCounts = new Map<OffreType, number>();
  for (const o of offres) {
    typeCounts.set(o.type_offre, (typeCounts.get(o.type_offre) || 0) + 1);
  }
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="text-[11px] text-slate-500 uppercase tracking-wider mb-2">
          Types d&apos;offres detectees
        </div>
        <div className="flex flex-wrap gap-1.5">
          {Array.from(typeCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([type, n]) => {
              const cfg = OFFRE_TYPE_COLORS[type];
              return (
                <span
                  key={type}
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.text} ${cfg.border}`}
                >
                  {OFFRE_TYPE_LABELS[type]}
                  <span className="text-[10px] opacity-70 tabular-nums">×{n}</span>
                </span>
              );
            })}
        </div>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100">
        {offres.map((o) => {
          const cfg = OFFRE_TYPE_COLORS[o.type_offre];
          return (
            <div key={o.id} className="px-5 py-4 space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <span
                  className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.text} ${cfg.border}`}
                >
                  {OFFRE_TYPE_LABELS[o.type_offre]}
                </span>
                <span
                  className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                    o.statut === 'active'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-100 text-slate-500 border-slate-200'
                  }`}
                >
                  {o.statut === 'active' ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-sm text-slate-700">{o.description}</p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <Flame className="w-3 h-3" /> {o.count_mentions} mentions
                </span>
                <span className="text-amber-700">{o.deals_impactes} deals impactes</span>
                <span className="text-rose-700">{o.deals_perdus} perdus</span>
                {o.deals_gagnes > 0 && <span className="text-emerald-700">{o.deals_gagnes} gagnes</span>}
                <span>{o.region}</span>
                <span className="tabular-nums">1re : {formatDate(o.date_premiere_mention)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TabComm({ comms }: { comms: any[] }) {
  if (comms.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-sm text-slate-500">
        Aucune action de communication detectee.
      </div>
    );
  }
  // Reactions
  const reactionCounts: Record<ReactionClient, number> = { positive: 0, neutre: 0, negative: 0 };
  const typeCounts = new Map<CommType, number>();
  const regionCounts = new Map<string, number>();
  for (const c of comms) {
    reactionCounts[c.reaction_client] = (reactionCounts[c.reaction_client] || 0) + 1;
    typeCounts.set(c.type_action, (typeCounts.get(c.type_action) || 0) + 1);
    if (c.region) regionCounts.set(c.region, (regionCounts.get(c.region) || 0) + 1);
  }
  const total = reactionCounts.positive + reactionCounts.neutre + reactionCounts.negative;
  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
        {/* Reactions */}
        <div>
          <div className="text-[11px] text-slate-500 uppercase tracking-wider mb-1.5">
            Reactions clients
          </div>
          <div className="h-2 w-full rounded-full overflow-hidden bg-slate-100 flex">
            {reactionCounts.positive > 0 && (
              <div className="bg-emerald-500 h-full" style={{ width: `${pct(reactionCounts.positive)}%` }} />
            )}
            {reactionCounts.neutre > 0 && (
              <div className="bg-slate-400 h-full" style={{ width: `${pct(reactionCounts.neutre)}%` }} />
            )}
            {reactionCounts.negative > 0 && (
              <div className="bg-rose-500 h-full" style={{ width: `${pct(reactionCounts.negative)}%` }} />
            )}
          </div>
          <div className="flex items-center justify-between mt-2 text-[11px] tabular-nums">
            <span className="inline-flex items-center gap-1 text-emerald-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {reactionCounts.positive} positive{reactionCounts.positive > 1 ? 's' : ''}
            </span>
            <span className="inline-flex items-center gap-1 text-slate-500">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              {reactionCounts.neutre} neutre{reactionCounts.neutre > 1 ? 's' : ''}
            </span>
            <span className="inline-flex items-center gap-1 text-rose-700">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              {reactionCounts.negative} negative{reactionCounts.negative > 1 ? 's' : ''}
            </span>
          </div>
        </div>
        {/* Types */}
        <div>
          <div className="text-[11px] text-slate-500 uppercase tracking-wider mb-1.5">
            Types d&apos;action
          </div>
          <div className="flex flex-wrap gap-1.5">
            {Array.from(typeCounts.entries())
              .sort((a, b) => b[1] - a[1])
              .map(([type, n]) => {
                const cfg = COMM_TYPE_COLORS[type];
                return (
                  <span
                    key={type}
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.text} ${cfg.border}`}
                  >
                    {COMM_TYPE_LABELS[type]}
                    <span className="text-[10px] opacity-70 tabular-nums">×{n}</span>
                  </span>
                );
              })}
          </div>
        </div>
        {regionCounts.size > 0 && (
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            Region dominante :{' '}
            <span className="font-medium text-slate-700">
              {Array.from(regionCounts.entries()).sort((a, b) => b[1] - a[1])[0][0]}
            </span>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100">
        {comms.map((c) => {
          const cfg = COMM_TYPE_COLORS[c.type_action];
          const rc = REACTION_CONFIG[c.reaction_client];
          return (
            <div key={c.id} className="px-5 py-4 space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <span
                  className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.text} ${cfg.border}`}
                >
                  {COMM_TYPE_LABELS[c.type_action]}
                </span>
                <span
                  className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium border ${rc.bg} ${rc.text} ${rc.border}`}
                >
                  {rc.label}
                </span>
              </div>
              <p className="text-sm text-slate-700">{c.description}</p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                <span className="tabular-nums">{formatDate(c.date)}</span>
                <span>{c.region}</span>
                <span>{c.count_mentions} mentions</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TabPrix({ prix }: { prix: any[] }) {
  if (prix.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-sm text-slate-500">
        Aucun signal prix pour ce concurrent.
      </div>
    );
  }

  // Split statut
  const gagne = prix.filter((p) => p.statut_deal === 'gagne').length;
  const perdu = prix.filter((p) => p.statut_deal === 'perdu').length;
  const enCours = prix.filter((p) => p.statut_deal === 'en_cours').length;
  const nbInferieur = prix.filter((p) => p.ecart_type === 'inferieur').length;
  const nbSuperieur = prix.filter((p) => p.ecart_type === 'superieur').length;
  // ecart_pct nullable : on ne moyenne que les signaux quantitatifs.
  const prixQuants = prix.filter(
    (p: any) => typeof p.ecart_pct === 'number' && Number.isFinite(p.ecart_pct),
  );
  const ecartMoyAbs =
    prixQuants.length > 0
      ? prixQuants.reduce((acc, p) => acc + Math.abs(p.ecart_pct), 0) / prixQuants.length
      : 0;

  // Tendance : regrouper par semaine et calculer l'ecart moyen signe.
  const byWeek = new Map<string, { sum: number; n: number }>();
  for (const p of prix) {
    const d = new Date(p.date);
    if (Number.isNaN(d.getTime())) continue;
    if (typeof p.ecart_pct !== 'number' || !Number.isFinite(p.ecart_pct)) continue;
    const y = d.getUTCFullYear();
    const jan1 = new Date(Date.UTC(y, 0, 1));
    const diff = (d.getTime() - jan1.getTime()) / 86400000;
    const week = Math.ceil((diff + jan1.getUTCDay() + 1) / 7);
    const key = `${y}-S${String(week).padStart(2, '0')}`;
    const signed = p.ecart_type === 'inferieur' ? -Math.abs(p.ecart_pct) : Math.abs(p.ecart_pct);
    const row = byWeek.get(key) || { sum: 0, n: 0 };
    row.sum += signed;
    row.n += 1;
    byWeek.set(key, row);
  }
  const lineData = Array.from(byWeek.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([semaine, { sum, n }]) => ({ semaine, ecart: Math.round((sum / n) * 10) / 10 }));

  const total = prix.length;
  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="text-[11px] text-slate-500 uppercase tracking-wider">Ecart moyen</div>
            <div className="text-2xl font-bold tabular-nums text-slate-900">
              {ecartMoyAbs.toFixed(1)}%
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="inline-flex px-2 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 tabular-nums">
              {gagne} gagnes
            </span>
            <span className="inline-flex px-2 py-0.5 rounded-full font-semibold bg-amber-50 text-amber-700 border border-amber-200 tabular-nums">
              {enCours} en cours
            </span>
            <span className="inline-flex px-2 py-0.5 rounded-full font-semibold bg-rose-50 text-rose-700 border border-rose-200 tabular-nums">
              {perdu} perdus
            </span>
          </div>
        </div>
        <div>
          <div className="text-[11px] text-slate-500 uppercase tracking-wider mb-1.5">
            Positionnement prix
          </div>
          <div className="h-2 w-full rounded-full overflow-hidden bg-slate-100 flex">
            {nbInferieur > 0 && (
              <div className="bg-rose-500 h-full" style={{ width: `${pct(nbInferieur)}%` }} />
            )}
            {nbSuperieur > 0 && (
              <div className="bg-emerald-500 h-full" style={{ width: `${pct(nbSuperieur)}%` }} />
            )}
          </div>
          <div className="flex items-center justify-between mt-1.5 text-[11px]">
            <span className="text-rose-700 tabular-nums">
              Nous plus chers : {nbInferieur}
            </span>
            <span className="text-emerald-700 tabular-nums">
              Nous moins chers : {nbSuperieur}
            </span>
          </div>
        </div>
      </div>

      {lineData.length >= 2 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-semibold text-slate-900">
              Evolution de l&apos;ecart prix
            </h2>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <XAxis dataKey="semaine" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  contentStyle={{ borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}
                  formatter={(v: number) => [`${v}%`, 'Ecart moyen']}
                />
                <Line type="monotone" dataKey="ecart" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/60 border-b border-slate-100">
                <th className="text-center px-4 py-2 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Ecart
                </th>
                <th className="text-left px-4 py-2 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="text-left px-4 py-2 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Commercial
                </th>
                <th className="text-left px-4 py-2 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Region
                </th>
                <th className="text-center px-4 py-2 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="text-left px-4 py-2 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="text-center px-4 py-2 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Source
                </th>
              </tr>
            </thead>
            <tbody>
              {prix.map((s) => {
                const isNeg = s.ecart_type === 'inferieur';
                const hasPct = typeof s.ecart_pct === 'number' && Number.isFinite(s.ecart_pct);
                return (
                  <tr key={s.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                    <td className="px-4 py-2.5 text-center">
                      {hasPct ? (
                        <span
                          className={`text-sm font-semibold tabular-nums ${isNeg ? 'text-rose-600' : 'text-emerald-600'}`}
                        >
                          {s.ecart_pct > 0 ? '+' : ''}
                          {s.ecart_pct}%
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 italic" title="Remise/offre concurrent sans % comparatif">
                          Sans %
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-slate-700">{s.client_name}</td>
                    <td className="px-4 py-2.5 text-slate-700">{s.commercial_name}</td>
                    <td className="px-4 py-2.5 text-slate-600">{s.region}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${
                          s.statut_deal === 'gagne'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : s.statut_deal === 'perdu'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {s.statut_deal === 'gagne'
                          ? 'Gagne'
                          : s.statut_deal === 'perdu'
                          ? 'Perdu'
                          : 'En cours'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-600 tabular-nums">
                      {formatDate(s.date)}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <CRReference
                        reportIds={[(s as any).source_report_id]}
                        variant="minimal"
                        label="CR"
                        contextLabel={`Signal prix — ${s.client_name ?? 'client'}`}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function TabPositionnement({
  entries,
  actorName,
}: {
  entries: any[];
  actorName: string;
}) {
  if (entries.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-sm text-slate-500">
        Aucune donnee de positionnement pour ce concurrent.
      </div>
    );
  }

  // Construit un row par attribut avec la valeur du concurrent.
  const radarData = ATTRIBUTS.map((attr) => {
    const entry = entries.find((e) => e.attribut === attr);
    return {
      attribut: ATTRIBUT_LABELS[attr],
      valeur: entry ? VALEUR_NUMERIC[entry.valeur] : 0,
    };
  });

  const getValeur = (attribut: Attribut): ValeurPercue | null => {
    const entry = entries.find((e) => e.attribut === attribut);
    return entry ? entry.valeur : null;
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-slate-900 mb-1">Positionnement sur 6 axes</h2>
        <p className="text-xs text-slate-500 mb-4">
          Perception terrain extraite des CR : plus le point est loin du centre, plus l&apos;attribut est percu fort.
        </p>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis
                dataKey="attribut"
                tick={{ fill: '#334155', fontSize: 12, fontWeight: 500 }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 3]}
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                tickCount={4}
              />
              <RechartsRadar
                name={actorName}
                dataKey="valeur"
                stroke="#6366f1"
                fill="#6366f1"
                fillOpacity={0.3}
                strokeWidth={2}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '0.75rem',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                }}
                formatter={(value: number) => {
                  const label =
                    value === 3 ? 'Fort' : value === 2 ? 'Moyen' : value === 1 ? 'Faible' : '--';
                  return [label, 'Perception'];
                }}
              />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {ATTRIBUTS.map((attr) => {
          const v = getValeur(attr);
          const cfg = v ? VALEUR_CONFIG[v] : null;
          return (
            <div
              key={attr}
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-4"
            >
              <div className="text-[11px] text-slate-500 uppercase tracking-wider">
                {ATTRIBUT_LABELS[attr]}
              </div>
              <div className="mt-1.5">
                {cfg ? (
                  <span
                    className={`inline-flex px-2.5 py-1 rounded-full text-sm font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}
                  >
                    {cfg.label}
                  </span>
                ) : (
                  <span className="text-sm text-slate-400">Non detecte</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
