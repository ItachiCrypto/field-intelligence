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
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-600">{label}</span>
        <span className="text-sm font-semibold text-slate-900 tabular-nums">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, #4f46e5 0%, #4f46e5 ${pct}%, #e2e8f0 ${pct}%, #e2e8f0 100%)`,
        }}
      />
      <div className="flex justify-between text-[11px] text-slate-400 tabular-nums">
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

  const { signaux, pertePct, etudes, caPerdu } = useMemo(() => {
    const signaux = Math.round(rdvSemaine * 2.1);
    const pertePct = Math.min(94, Math.round(65 + (200 - rdvSemaine) * 0.1 + (200 - commerciaux) * 0.05));
    const etudes = Math.round((signaux * 4 * (pertePct / 100)) / 150);
    const signalsMensuel = signaux * 4;
    const signalsLost = signalsMensuel * (pertePct / 100);
    const dealsLost = signalsLost * 0.15;
    const caPerdu = Math.round(dealsLost * ca * 0.08);
    return { signaux, pertePct, etudes, caPerdu };
  }, [commerciaux, rdvSemaine, ca]);

  const fmt = (n: number) => n.toLocaleString('fr-FR');
  const fmtEur = (n: number) => (n >= 1000 ? `${Math.round(n / 1000)}K€` : `${n}€`);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 space-y-6">
        {/* Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Slider label="Commerciaux terrain" min={5} max={200} value={commerciaux} onChange={setCommerciaux} format={(v) => `${v}`} />
          <Slider label="CA moyen / client" min={10000} max={500000} value={ca} onChange={setCa} format={fmtEur} />
          <Slider label="RDV par semaine" min={20} max={200} value={rdvSemaine} onChange={setRdvSemaine} format={(v) => `${v}`} />
        </div>

        <div className="border-t border-slate-100" />

        {/* Results */}
        <div>
          <p className="text-sm text-slate-500 mb-4 leading-relaxed">
            Votre équipe génère{' '}
            <span className="text-slate-900 font-semibold">{fmt(signaux)} signaux / semaine</span>.
            Sans Field Intelligence,{' '}
            <span className="text-red-600 font-semibold">{pertePct}%</span>
            {' '}disparaissent dans des CR non lus —{' '}
            <span className="text-slate-900 font-semibold">{etudes} études de marché</span> perdues / mois.
          </p>

          <div className="grid grid-cols-3 gap-3">
            {[
              { value: fmt(signaux * 4), label: 'signaux perdus / mois', color: 'text-slate-900' },
              { value: `${pertePct}%`,   label: 'intel. marché perdue',   color: 'text-red-600' },
              { value: `~${fmtEur(caPerdu)}`, label: 'CA non capturé / mois', color: 'text-indigo-600' },
            ].map((kpi) => (
              <div
                key={kpi.label}
                className="bg-slate-50 rounded-lg border border-slate-200 p-4 text-center"
              >
                <div
                  className={`text-2xl sm:text-3xl font-bold tabular-nums ${kpi.color}`}
                  style={{ fontFamily: 'var(--font-syne), sans-serif' }}
                >
                  {kpi.value}
                </div>
                <div className="text-[11px] text-slate-500 mt-1 leading-tight">{kpi.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 14px; height: 14px;
          border-radius: 50%;
          background: #4f46e5;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 0 0 1px #4f46e5, 0 1px 3px rgba(0,0,0,0.15);
        }
        input[type=range]::-moz-range-thumb {
          width: 14px; height: 14px;
          border-radius: 50%;
          background: #4f46e5;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 0 0 1px #4f46e5;
        }
      `}</style>
    </div>
  );
}
