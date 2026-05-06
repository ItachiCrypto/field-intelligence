'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { CRReference } from './cr-reference';

interface CompetitorSynthesisProps {
  name: string;
  signals: any[];
  prixSignals: any[];
  dealsMarketing?: any[];
  dealsCommerciaux?: any[];
  offres?: any[];
  comms?: any[];
  /** Show "Voir fiche complete" link to /concurrent/[name] (default true) */
  showFichLink?: boolean;
}

/**
 * Composant partage Forces & Faiblesses : meme logique que sur la page
 * /concurrent/[name], reutilisable depuis le radar (vue inline) ou autres
 * dashboards. Aggrege deals + signaux + offres + comms pour donner une
 * synthese 2 colonnes "ce qui marche pour eux" / "ce qui ne marche pas".
 */
export function CompetitorSynthesis({
  name,
  signals,
  prixSignals,
  dealsMarketing = [],
  dealsCommerciaux = [],
  offres = [],
  comms = [],
  showFichLink = true,
}: CompetitorSynthesisProps) {
  const lowerName = name.toLowerCase();

  const synth = useMemo(() => {
    const sigsThis = (signals || []).filter(
      (s: any) => (s.competitor_name || '').toLowerCase() === lowerName,
    );
    const prixThis = (prixSignals || []).filter(
      (p: any) => (p.concurrent_nom || '').toLowerCase() === lowerName,
    );
    const offresThis = (offres || []).filter(
      (o: any) => (o.concurrent_nom || '').toLowerCase() === lowerName,
    );
    const commsThis = (comms || []).filter(
      (c: any) => (c.concurrent_nom || '').toLowerCase() === lowerName,
    );
    const allDeals = [
      ...(dealsMarketing || []).map((d: any) => ({ ...d, _src: 'mk' })),
      ...(dealsCommerciaux || []).map((d: any) => ({ ...d, _src: 'co' })),
    ].filter((d: any) => (d.concurrent_nom || '').toLowerCase() === lowerName);

    const dealsPerdus = allDeals.filter((d: any) => d.resultat === 'perdu');
    const dealsGagnes = allDeals.filter((d: any) => d.resultat === 'gagne');

    const sigsForces = sigsThis.filter(
      (s: any) => s.severity === 'rouge' || s.severity === 'orange',
    ).length;
    const sigsFaiblesses = sigsThis.filter(
      (s: any) => s.severity === 'vert' || s.type === 'echec',
    ).length;

    const prixForces = prixThis.filter(
      (p: any) => p.ecart_type === 'inferieur' && p.statut_deal === 'perdu',
    ).length;
    const prixFaiblesses = prixThis.filter(
      (p: any) => p.ecart_type === 'superieur' || p.statut_deal === 'gagne',
    ).length;

    const commPositif = commsThis.filter((c: any) => c.reaction_client === 'positive').length;
    const commNegatif = commsThis.filter((c: any) => c.reaction_client === 'negative').length;

    const offresForces = offresThis.filter((o: any) => (o.deals_perdus || 0) > (o.deals_gagnes || 0)).length;
    const offresFaiblesses = offresThis.filter((o: any) => (o.deals_gagnes || 0) > (o.deals_perdus || 0)).length;

    // Motifs aggregation + CR sources tracking per motif
    const sourcesByMotifPerdus = new Map<string, string[]>();
    const sourcesByMotifGagnes = new Map<string, string[]>();
    const motifsPerdus = new Map<string, number>();
    const motifsGagnes = new Map<string, number>();
    for (const d of dealsPerdus) {
      const tag = d.motif_principal || d.motif || 'autre';
      motifsPerdus.set(tag, (motifsPerdus.get(tag) || 0) + 1);
      if (d.source_report_id) {
        if (!sourcesByMotifPerdus.has(tag)) sourcesByMotifPerdus.set(tag, []);
        sourcesByMotifPerdus.get(tag)!.push(d.source_report_id);
      }
    }
    for (const d of dealsGagnes) {
      const tag = d.motif_principal || d.motif || 'autre';
      motifsGagnes.set(tag, (motifsGagnes.get(tag) || 0) + 1);
      if (d.source_report_id) {
        if (!sourcesByMotifGagnes.has(tag)) sourcesByMotifGagnes.set(tag, []);
        sourcesByMotifGagnes.get(tag)!.push(d.source_report_id);
      }
    }

    const topMotifsPerdus = Array.from(motifsPerdus.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3);
    const topMotifsGagnes = Array.from(motifsGagnes.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3);

    const verbatimsForces = dealsPerdus
      .filter((d: any) => d.verbatim && d.verbatim.length > 20)
      .slice(0, 2)
      .map((d: any) => ({ verbatim: d.verbatim as string, sourceId: d.source_report_id as string | null }));
    const verbatimsFaiblesses = dealsGagnes
      .filter((d: any) => d.verbatim && d.verbatim.length > 20)
      .slice(0, 2)
      .map((d: any) => ({ verbatim: d.verbatim as string, sourceId: d.source_report_id as string | null }));

    return {
      dealsPerdus, dealsGagnes,
      sigsForces, sigsFaiblesses,
      prixForces, prixFaiblesses,
      commPositif, commNegatif,
      offresForces, offresFaiblesses,
      topMotifsPerdus, topMotifsGagnes,
      sourcesByMotifPerdus, sourcesByMotifGagnes,
      verbatimsForces, verbatimsFaiblesses,
    };
  }, [name, signals, prixSignals, dealsMarketing, dealsCommerciaux, offres, comms, lowerName]);

  const hasForces =
    synth.dealsPerdus.length > 0 ||
    synth.sigsForces > 0 ||
    synth.prixForces > 0 ||
    synth.commPositif > 0 ||
    synth.offresForces > 0;
  const hasFaiblesses =
    synth.dealsGagnes.length > 0 ||
    synth.sigsFaiblesses > 0 ||
    synth.prixFaiblesses > 0 ||
    synth.commNegatif > 0 ||
    synth.offresFaiblesses > 0;

  if (!hasForces && !hasFaiblesses) {
    return (
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 text-center text-sm text-slate-400 italic">
        Aucune donnée comparative disponible pour {name} — les signaux liés sont
        affichés ci-dessous.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {showFichLink && (
        <div className="flex justify-end">
          <Link
            href={`/concurrent/${encodeURIComponent(name)}`}
            className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700"
          >
            Voir la fiche complète
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Forces */}
        <div className="bg-white rounded-xl border border-rose-200 shadow-sm overflow-hidden">
          <div className="bg-rose-50 border-b border-rose-200 px-4 py-2.5 flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-rose-100 text-rose-700 text-xs font-bold">
              ↑
            </span>
            <div>
              <h3 className="text-xs font-bold text-rose-900">
                Ce qui marche pour {name}
              </h3>
              <p className="text-[10px] text-rose-700/80">Forces — où il nous bat</p>
            </div>
          </div>
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-4 gap-1.5 text-center">
              <Stat n={synth.dealsPerdus.length} label="Deals perdus" tone="rose" />
              <Stat n={synth.sigsForces} label="Signaux menace" tone="rose" />
              <Stat n={synth.prixForces} label="Prix < nous" tone="rose" />
              <Stat n={synth.offresForces + synth.commPositif} label="Off./comm" tone="rose" />
            </div>
            {synth.topMotifsPerdus.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold text-slate-700 mb-1.5">Pourquoi on perd</p>
                <div className="flex flex-wrap gap-1">
                  {synth.topMotifsPerdus.map(([tag, n]) => {
                    const sources = synth.sourcesByMotifPerdus.get(tag) ?? [];
                    return (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-medium"
                      >
                        {tag}
                        <span className="text-[9px] opacity-70 tabular-nums">×{n}</span>
                        <CRReference
                          reportIds={sources}
                          variant="rose"
                          size="xs"
                          label={`${sources.length}`}
                          contextLabel={`${name} · "${tag}" — ${sources.length} CR${sources.length > 1 ? 's' : ''}`}
                        />
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
            {synth.verbatimsForces.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold text-slate-700 mb-1.5">Verbatim</p>
                <ul className="space-y-1.5">
                  {synth.verbatimsForces.map((v, i) => (
                    <li
                      key={i}
                      className="text-[11px] text-slate-700 italic leading-snug border-l-2 border-rose-300 pl-2 flex items-start gap-1.5"
                    >
                      <span className="flex-1">
                        « {v.verbatim.length > 140 ? v.verbatim.slice(0, 140) + '…' : v.verbatim} »
                      </span>
                      {v.sourceId && (
                        <CRReference
                          reportIds={[v.sourceId]}
                          variant="rose"
                          size="xs"
                          label="CR"
                          contextLabel={`Verbatim — ${name}`}
                        />
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {!hasForces && (
              <p className="text-[11px] text-slate-400 italic">
                Aucune force détectée dans les CRs analysés.
              </p>
            )}
          </div>
        </div>

        {/* Faiblesses */}
        <div className="bg-white rounded-xl border border-emerald-200 shadow-sm overflow-hidden">
          <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2.5 flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
              ↓
            </span>
            <div>
              <h3 className="text-xs font-bold text-emerald-900">
                Ce qui ne marche pas pour {name}
              </h3>
              <p className="text-[10px] text-emerald-700/80">Faiblesses — où vous le battez</p>
            </div>
          </div>
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-4 gap-1.5 text-center">
              <Stat n={synth.dealsGagnes.length} label="Deals gagnés" tone="emerald" />
              <Stat n={synth.sigsFaiblesses} label="Signaux verts" tone="emerald" />
              <Stat n={synth.prixFaiblesses} label="Prix > nous" tone="emerald" />
              <Stat n={synth.offresFaiblesses + synth.commNegatif} label="Off./comm" tone="emerald" />
            </div>
            {synth.topMotifsGagnes.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold text-slate-700 mb-1.5">Pourquoi on les bat</p>
                <div className="flex flex-wrap gap-1">
                  {synth.topMotifsGagnes.map(([tag, n]) => {
                    const sources = synth.sourcesByMotifGagnes.get(tag) ?? [];
                    return (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-medium"
                      >
                        {tag}
                        <span className="text-[9px] opacity-70 tabular-nums">×{n}</span>
                        <CRReference
                          reportIds={sources}
                          variant="emerald"
                          size="xs"
                          label={`${sources.length}`}
                          contextLabel={`${name} · "${tag}" — ${sources.length} CR${sources.length > 1 ? 's' : ''}`}
                        />
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
            {synth.verbatimsFaiblesses.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold text-slate-700 mb-1.5">Verbatim</p>
                <ul className="space-y-1.5">
                  {synth.verbatimsFaiblesses.map((v, i) => (
                    <li
                      key={i}
                      className="text-[11px] text-slate-700 italic leading-snug border-l-2 border-emerald-300 pl-2 flex items-start gap-1.5"
                    >
                      <span className="flex-1">
                        « {v.verbatim.length > 140 ? v.verbatim.slice(0, 140) + '…' : v.verbatim} »
                      </span>
                      {v.sourceId && (
                        <CRReference
                          reportIds={[v.sourceId]}
                          variant="emerald"
                          size="xs"
                          label="CR"
                          contextLabel={`Verbatim — ${name}`}
                        />
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {!hasFaiblesses && (
              <p className="text-[11px] text-slate-400 italic">
                Aucune faiblesse détectée dans les CRs analysés.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({
  n,
  label,
  tone,
}: {
  n: number;
  label: string;
  tone: 'rose' | 'emerald';
}) {
  const cls = tone === 'rose'
    ? 'border-rose-100 bg-rose-50/40 text-rose-700'
    : 'border-emerald-100 bg-emerald-50/40 text-emerald-700';
  return (
    <div className={`rounded-lg border ${cls} py-1.5`}>
      <div className="text-base font-bold tabular-nums leading-none">{n}</div>
      <div className="text-[9px] opacity-80 uppercase tracking-wider mt-0.5 leading-tight">{label}</div>
    </div>
  );
}
