'use client';

import { useState, useMemo } from 'react';

function Slider({
  label,
  min,
  max,
  value,
  onChange,
  format,
}: {
  label: string;
  min: number;
  max: number;
  value: number;
  onChange: (v: number) => void;
  format: (v: number) => string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <span className="text-sm font-bold text-[#3730A3] tabular-nums">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, #6366F1 0%, #6366F1 ${((value - min) / (max - min)) * 100}%, #e2e8f0 ${((value - min) / (max - min)) * 100}%, #e2e8f0 100%)`,
          accentColor: '#6366F1',
        }}
      />
      <div className="flex justify-between text-xs text-slate-400">
        <span>{format(min)}</span>
        <span>{format(max)}</span>
      </div>
    </div>
  );
}

export function RoiSimulator() {
  const [commerciaux, setCommerciaux] = useState(15);
  const [ca, setCa] = useState(80000);
  const [rdvSemaine, setRdvSemaine] = useState(60);

  const { signaux, pertePct, etudes } = useMemo(() => {
    // ~2 signaux par RDV en moyenne
    const signaux = Math.round(rdvSemaine * 2.1);
    // Taux de perte : dépend de la taille de l'équipe (moins de commerciaux = plus de perte relative)
    const pertePct = Math.min(94, Math.round(65 + (200 - rdvSemaine) * 0.1 + (200 - commerciaux) * 0.05));
    // Équivalent études marché perdues / mois (1 étude ~ 150 signaux structurés)
    const etudes = Math.round((signaux * 4 * (pertePct / 100)) / 150);
    return { signaux, pertePct, etudes };
  }, [commerciaux, rdvSemaine]);

  const caPerdu = useMemo(() => {
    const dealsRates = 0.15; // 15% des signaux = opportunité de deal
    const signalsMensuel = signaux * 4;
    const signalsLost = signalsMensuel * (pertePct / 100);
    const dealsLost = signalsLost * dealsRates;
    return Math.round(dealsLost * ca * 0.08); // 8% de conversion
  }, [signaux, pertePct, ca]);

  const fmt = (n: number) => n.toLocaleString('fr-FR');
  const fmtEur = (n: number) =>
    n >= 1000
      ? `${Math.round(n / 1000)}K€`
      : `${n}€`;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 lg:p-8 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Slider
            label="Commerciaux terrain"
            min={5}
            max={200}
            value={commerciaux}
            onChange={setCommerciaux}
            format={(v) => `${v}`}
          />
          <Slider
            label="CA moyen par client"
            min={10000}
            max={500000}
            value={ca}
            onChange={setCa}
            format={(v) => fmtEur(v)}
          />
          <Slider
            label="RDV par semaine"
            min={20}
            max={200}
            value={rdvSemaine}
            onChange={setRdvSemaine}
            format={(v) => `${v}`}
          />
        </div>

        {/* Result */}
        <div className="rounded-xl bg-[#EEF2FF] border border-[#6366F1]/20 p-6 space-y-4">
          <p className="text-sm text-slate-700 leading-relaxed">
            Votre équipe génère environ{' '}
            <strong className="text-[#3730A3]">{fmt(signaux)} signaux terrain</strong> par semaine.
            Sans Field Intelligence,{' '}
            <strong className="text-red-600">{pertePct}%</strong> de cette intelligence marché
            disparaît dans des CR non lus. Soit l&apos;équivalent de{' '}
            <strong className="text-[#3730A3]">{etudes} études de marché</strong> perdues chaque mois.
          </p>

          <div className="grid grid-cols-3 gap-4 pt-2 border-t border-[#6366F1]/10">
            <div className="text-center">
              <div
                className="text-2xl font-bold text-[#3730A3]"
                style={{ fontFamily: 'var(--font-syne), sans-serif' }}
              >
                {fmt(signaux * 4)}
              </div>
              <div className="text-xs text-slate-500 mt-1">signaux / mois non captés</div>
            </div>
            <div className="text-center">
              <div
                className="text-2xl font-bold text-red-600"
                style={{ fontFamily: 'var(--font-syne), sans-serif' }}
              >
                {pertePct}%
              </div>
              <div className="text-xs text-slate-500 mt-1">intel. marché perdue</div>
            </div>
            <div className="text-center">
              <div
                className="text-2xl font-bold text-[#059669]"
                style={{ fontFamily: 'var(--font-syne), sans-serif' }}
              >
                ~{fmtEur(caPerdu)}
              </div>
              <div className="text-xs text-slate-500 mt-1">CA potentiel non capturé / mois</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
