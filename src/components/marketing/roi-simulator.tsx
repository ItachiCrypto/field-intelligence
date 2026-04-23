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
        <span className="text-[13px] text-white/50">{label}</span>
        <span className="text-[13px] font-semibold text-white tabular-nums">{format(value)}</span>
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
            background: `linear-gradient(to right, #6366F1 0%, #6366F1 ${pct}%, rgba(255,255,255,0.08) ${pct}%, rgba(255,255,255,0.08) 100%)`,
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
  const fmtEur = (n: number) => n >= 1000 ? `${Math.round(n / 1000)}K€` : `${n}€`;

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#111111] overflow-hidden">
      <div className="p-8 space-y-8">
        {/* Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <Slider label="Commerciaux terrain" min={5} max={200} value={commerciaux} onChange={setCommerciaux} format={(v) => `${v}`} />
          <Slider label="CA moyen / client" min={10000} max={500000} value={ca} onChange={setCa} format={fmtEur} />
          <Slider label="RDV par semaine" min={20} max={200} value={rdvSemaine} onChange={setRdvSemaine} format={(v) => `${v}`} />
        </div>

        {/* Divider */}
        <div className="h-px bg-white/[0.06]" />

        {/* Results */}
        <div>
          <p className="text-[13px] text-white/40 mb-6 leading-relaxed">
            Votre équipe génère{' '}
            <span className="text-white font-medium">{fmt(signaux)} signaux / semaine</span>.
            Sans Field Intelligence,{' '}
            <span className="text-red-400 font-medium">{pertePct}%</span>{' '}
            disparaissent dans des CR non lus —{' '}
            <span className="text-white font-medium">{etudes} études de marché</span> perdues / mois.
          </p>

          <div className="grid grid-cols-3 gap-4">
            {[
              { value: fmt(signaux * 4), label: 'signaux perdus / mois', color: 'text-white' },
              { value: `${pertePct}%`, label: 'intel. marché perdue', color: 'text-red-400' },
              { value: `~${fmtEur(caPerdu)}`, label: 'CA non capturé / mois', color: 'text-[#6366F1]' },
            ].map((kpi) => (
              <div key={kpi.label} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 text-center">
                <div
                  className={`text-2xl sm:text-3xl font-bold ${kpi.color} tabular-nums`}
                  style={{ fontFamily: 'var(--font-syne), sans-serif' }}
                >
                  {kpi.value}
                </div>
                <div className="text-[11px] text-white/30 mt-1.5 leading-tight">{kpi.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
