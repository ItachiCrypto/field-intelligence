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
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[13px] text-white/45">{label}</span>
        <span
          className="text-[14px] font-bold text-white tabular-nums"
          style={{ fontFamily: 'var(--font-syne), sans-serif' }}
        >
          {format(value)}
        </span>
      </div>
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-[3px] rounded-full appearance-none cursor-pointer relative z-10"
          style={{
            background: `linear-gradient(to right, #F59E0B 0%, #F59E0B ${pct}%, rgba(255,255,255,0.07) ${pct}%, rgba(255,255,255,0.07) 100%)`,
            WebkitAppearance: 'none',
          }}
        />
      </div>
      <div className="flex justify-between text-[11px] text-white/20 tabular-nums">
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
    <div
      className="overflow-hidden"
      style={{
        background: '#0C1018',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '16px',
      }}
    >
      <div className="p-8 space-y-8">
        {/* Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <Slider
            label="Commerciaux terrain"
            min={5}
            max={200}
            value={commerciaux}
            onChange={setCommerciaux}
            format={(v) => `${v}`}
          />
          <Slider
            label="CA moyen / client"
            min={10000}
            max={500000}
            value={ca}
            onChange={setCa}
            format={fmtEur}
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

        <div style={{ height: 1, background: 'rgba(255,255,255,0.05)' }} />

        {/* Results */}
        <div>
          <p className="text-[13px] text-white/35 mb-6 leading-relaxed">
            Votre équipe génère{' '}
            <span className="text-white font-medium">{fmt(signaux)} signaux / semaine</span>.
            Sans Field Intelligence,{' '}
            <span className="font-medium" style={{ color: '#EF4444' }}>{pertePct}%</span>
            {' '}disparaissent dans des CR non lus —{' '}
            <span className="text-white font-medium">{etudes} études de marché</span> perdues / mois.
          </p>

          <div className="grid grid-cols-3 gap-4">
            {[
              { value: fmt(signaux * 4), label: 'signaux perdus / mois', color: 'rgba(255,255,255,0.85)' },
              { value: `${pertePct}%`, label: 'intel. marché perdue', color: '#EF4444' },
              { value: `~${fmtEur(caPerdu)}`, label: 'CA non capturé / mois', color: '#F59E0B' },
            ].map((kpi) => (
              <div
                key={kpi.label}
                className="rounded-xl p-4 text-center"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
              >
                <div
                  className="text-2xl sm:text-3xl font-bold tabular-nums"
                  style={{ fontFamily: 'var(--font-syne), sans-serif', color: kpi.color }}
                >
                  {kpi.value}
                </div>
                <div className="text-[11px] text-white/25 mt-1.5 leading-tight">{kpi.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Slider thumb styles */}
      <style>{`
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px; height: 16px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          box-shadow: 0 0 0 3px rgba(245,158,11,0.35);
        }
        input[type=range]::-moz-range-thumb {
          width: 16px; height: 16px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          border: none;
          box-shadow: 0 0 0 3px rgba(245,158,11,0.35);
        }
      `}</style>
    </div>
  );
}
