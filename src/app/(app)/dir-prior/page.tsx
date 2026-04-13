// @ts-nocheck
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAppData } from '@/lib/data';
import { createClient } from '@/lib/supabase/client';
import { RecommandationIA } from '@/lib/types-v2';
import { KpiCard } from '@/components/shared/kpi-card';
import { AbbreviationHighlight } from '@/components/shared/abbreviation-highlight';
import { Sparkles, Clock, CheckCircle2, Eye, Play, Check } from 'lucide-react';

const supabase = createClient();

type Statut = RecommandationIA['statut'];

const TYPE_CONFIG: Record<string, { border: string; label: string }> = {
  risque: { border: 'border-l-rose-500', label: 'Risque' },
  opportunite: { border: 'border-l-emerald-500', label: 'Opportunite' },
  territoire: { border: 'border-l-indigo-500', label: 'Territoire' },
  coaching: { border: 'border-l-amber-400', label: 'Coaching' },
};

const PRIORITE_CONFIG: Record<number, { bg: string; text: string }> = {
  1: { bg: 'bg-rose-50', text: 'text-rose-700' },
  2: { bg: 'bg-amber-50', text: 'text-amber-700' },
  3: { bg: 'bg-slate-50', text: 'text-slate-600' },
  4: { bg: 'bg-slate-50', text: 'text-slate-500' },
  5: { bg: 'bg-slate-50', text: 'text-slate-400' },
};

const STATUT_CONFIG: Record<Statut, { bg: string; text: string; label: string }> = {
  nouvelle: { bg: 'bg-indigo-50', text: 'text-indigo-700', label: 'Nouvelle' },
  vue: { bg: 'bg-slate-50', text: 'text-slate-600', label: 'Vue' },
  en_cours: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'En cours' },
  done: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Termine' },
};

export default function DirPriorPage() {
  const { recommandationsIA: RECOMMANDATIONS_IA, refresh } = useAppData();
  const [statuts, setStatuts] = useState<Record<string, Statut>>({});

  // Sync statuts when data arrives from async fetch
  useEffect(() => {
    if (RECOMMANDATIONS_IA.length > 0 && Object.keys(statuts).length === 0) {
      const init: Record<string, Statut> = {};
      for (const r of RECOMMANDATIONS_IA) {
        init[r.id] = r.statut;
      }
      setStatuts(init);
    }
  }, [RECOMMANDATIONS_IA]);

  async function updateStatut(id: string, statut: Statut) {
    setStatuts((prev) => ({ ...prev, [id]: statut }));
    await supabase
      .from('recommandations_ia')
      .update({ statut })
      .eq('id', id);
    refresh();
  }

  const kpis = useMemo(() => {
    const nouvelles = Object.values(statuts).filter((s) => s === 'nouvelle').length;
    const enCours = Object.values(statuts).filter((s) => s === 'en_cours').length;
    const completees = Object.values(statuts).filter((s) => s === 'done').length;
    return { nouvelles, enCours, completees };
  }, [statuts]);

  const sorted = useMemo(
    () => [...RECOMMANDATIONS_IA].sort((a, b) => a.priorite - b.priorite),
    [RECOMMANDATIONS_IA]
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Priorisation Commerciale IA</h1>
        <p className="text-sm text-slate-500 mt-1">Recommandations hebdomadaires</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          label="Recommandations nouvelles"
          value={kpis.nouvelles}
          icon={<Sparkles className="w-5 h-5" />}
          iconColor="text-indigo-600 bg-indigo-50"
        />
        <KpiCard
          label="En cours"
          value={kpis.enCours}
          icon={<Clock className="w-5 h-5" />}
          iconColor="text-amber-600 bg-amber-50"
        />
        <KpiCard
          label="Completees"
          value={kpis.completees}
          icon={<CheckCircle2 className="w-5 h-5" />}
          iconColor="text-emerald-600 bg-emerald-50"
        />
      </div>

      {/* Recommendation cards */}
      <div className="space-y-3">
        {sorted.map((rec) => {
          const typeConfig = TYPE_CONFIG[rec.type];
          const currentStatut = statuts[rec.id] || rec.statut;
          const statutConfig = STATUT_CONFIG[currentStatut];
          const prioConfig = PRIORITE_CONFIG[rec.priorite] || PRIORITE_CONFIG[3];

          return (
            <div
              key={rec.id}
              className={`bg-white rounded-xl border border-slate-200 shadow-sm p-5 border-l-4 ${typeConfig?.border || 'border-l-slate-300'}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${prioConfig.bg} ${prioConfig.text}`}>
                      P{rec.priorite}
                    </span>
                    <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                      {typeConfig?.label || rec.type}
                    </span>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statutConfig.bg} ${statutConfig.text}`}>
                      {statutConfig.label}
                    </span>
                  </div>
                  <div className="mb-2">
                    <AbbreviationHighlight
                      text={rec.action_recommandee}
                      className="text-sm text-slate-800 leading-relaxed"
                    />
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>{rec.territoire}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                    <span>{rec.commercial_suggere}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => updateStatut(rec.id, 'vue')}
                    className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors border ${
                      currentStatut === 'vue'
                        ? 'bg-slate-100 text-slate-700 border-slate-300'
                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                    }`}
                    title="Marquer vue"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Vue
                  </button>
                  <button
                    onClick={() => updateStatut(rec.id, 'en_cours')}
                    className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors border ${
                      currentStatut === 'en_cours'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                    }`}
                    title="En cours"
                  >
                    <Play className="w-3.5 h-3.5" />
                    En cours
                  </button>
                  <button
                    onClick={() => updateStatut(rec.id, 'done')}
                    className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors border ${
                      currentStatut === 'done'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                    }`}
                    title="Termine"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Termine
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
