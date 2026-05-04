import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

/**
 * Compact rubric explainer used inside InfoPopover on the "Score qualité"
 * KPI cards. Mirrors quality-score.ts (server-side) and the full guide
 * at /aide-cr — keep them in sync if criteria weights change.
 */
export function QualityScoreInfo() {
  return (
    <div className="space-y-3">
      <p className="text-slate-600">
        Chaque CR analysé reçoit un score 0–100 calculé sur 11 critères. Le
        score affiché ici est la <span className="font-semibold text-slate-900">moyenne</span> des
        CRs scorés sur ta période.
      </p>

      <div className="grid grid-cols-2 gap-1.5">
        <div className="rounded-md bg-rose-50 border border-rose-200 px-2 py-1.5 text-rose-800">
          <div className="font-mono text-[10px] opacity-70">0–49</div>
          <div className="font-bold text-xs">Faible</div>
        </div>
        <div className="rounded-md bg-amber-50 border border-amber-200 px-2 py-1.5 text-amber-800">
          <div className="font-mono text-[10px] opacity-70">50–69</div>
          <div className="font-bold text-xs">Moyen</div>
        </div>
        <div className="rounded-md bg-sky-50 border border-sky-200 px-2 py-1.5 text-sky-800">
          <div className="font-mono text-[10px] opacity-70">70–84</div>
          <div className="font-bold text-xs">Bon</div>
        </div>
        <div className="rounded-md bg-emerald-50 border border-emerald-200 px-2 py-1.5 text-emerald-800">
          <div className="font-mono text-[10px] opacity-70">85–100</div>
          <div className="font-bold text-xs">Excellent</div>
        </div>
      </div>

      <div>
        <p className="font-semibold text-slate-900 mb-1.5">Critères qui pèsent le plus :</p>
        <ul className="space-y-1 text-slate-600">
          <li className="flex items-baseline gap-1.5">
            <span className="font-mono text-indigo-600 font-semibold w-7 shrink-0">+12</span>
            <span>Au moins 1 concurrent nommé par son nom exact</span>
          </li>
          <li className="flex items-baseline gap-1.5">
            <span className="font-mono text-indigo-600 font-semibold w-7 shrink-0">+12</span>
            <span>Au moins 1 verbatim / citation directe entre guillemets</span>
          </li>
          <li className="flex items-baseline gap-1.5">
            <span className="font-mono text-indigo-600 font-semibold w-7 shrink-0">+10</span>
            <span>Chiffres concrets (PDM, rotations, écarts prix…)</span>
          </li>
          <li className="flex items-baseline gap-1.5">
            <span className="font-mono text-indigo-600 font-semibold w-7 shrink-0">+10</span>
            <span>Information de prix / remise / offre concurrent</span>
          </li>
          <li className="flex items-baseline gap-1.5">
            <span className="font-mono text-indigo-600 font-semibold w-7 shrink-0">+10</span>
            <span>Objectif explicitement atteint ou raté + cause</span>
          </li>
          <li className="flex items-baseline gap-1.5">
            <span className="font-mono text-indigo-600 font-semibold w-7 shrink-0">+10</span>
            <span>Prochaine action concrète (Next rdv, envoi mail…)</span>
          </li>
          <li className="flex items-baseline gap-1.5 text-slate-400">
            <span className="font-mono w-7 shrink-0">+26</span>
            <span>5 autres critères (client / commercial / date / longueur / besoin)</span>
          </li>
        </ul>
      </div>

      <Link
        href="/aide-cr"
        className="inline-flex items-center gap-1 text-indigo-600 font-semibold hover:text-indigo-700 transition-colors text-xs"
      >
        Voir le guide complet
        <ArrowUpRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}
