'use client';

import { useState, useMemo } from 'react';

function Slider({
  label,
  hint,
  min,
  max,
  value,
  onChange,
  format,
}: {
  label: string;
  hint: string;
  min: number;
  max: number;
  value: number;
  onChange: (v: number) => void;
  format: (v: number) => string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <div
            className="text-[10px] tracking-[0.16em] uppercase"
            style={{
              fontFamily: 'var(--font-mono)',
              color: 'rgba(26, 21, 16, 0.5)',
            }}
          >
            {label}
          </div>
          <div
            className="text-[10.5px] mt-0.5"
            style={{ color: 'rgba(26, 21, 16, 0.45)' }}
          >
            {hint}
          </div>
        </div>
        <span
          className="tabular-nums"
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: 26,
            letterSpacing: '-0.03em',
            color: '#1A1510',
          }}
        >
          {format(value)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full cursor-pointer roi-slider"
        style={
          {
            background: `linear-gradient(to right, #CC3329 0%, #CC3329 ${pct}%, rgba(26,21,16,0.14) ${pct}%, rgba(26,21,16,0.14) 100%)`,
          } as React.CSSProperties
        }
      />
      <div
        className="flex justify-between text-[10px] tabular-nums"
        style={{
          fontFamily: 'var(--font-mono)',
          color: 'rgba(26, 21, 16, 0.4)',
        }}
      >
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
    const pertePct = Math.min(
      94,
      Math.round(65 + (200 - rdvSemaine) * 0.1 + (200 - commerciaux) * 0.05)
    );
    const etudes = Math.round((signaux * 4 * (pertePct / 100)) / 150);
    const signalsMensuel = signaux * 4;
    const signalsLost = signalsMensuel * (pertePct / 100);
    const dealsLost = signalsLost * 0.15;
    const caPerdu = Math.round(dealsLost * ca * 0.08);
    return { signaux, pertePct, etudes, caPerdu };
  }, [commerciaux, rdvSemaine, ca]);

  const fmt = (n: number) => n.toLocaleString('fr-FR');
  const fmtEur = (n: number) =>
    n >= 1000 ? `${Math.round(n / 1000)}K€` : `${n}€`;

  return (
    <div
      className="relative"
      style={{
        background: '#FBFAF6',
        border: '1px solid #1A1510',
        boxShadow: '10px 10px 0 #1A1510',
        borderRadius: 2,
      }}
    >
      {/* Masthead */}
      <div
        className="flex items-center justify-between px-6 sm:px-8 py-3 border-b"
        style={{
          background: '#1A1510',
          color: '#F4EFE6',
          borderColor: '#1A1510',
        }}
      >
        <div
          className="flex items-center gap-3 text-[10px] tracking-[0.16em] uppercase"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          <span>Terminal ROI</span>
          <span style={{ opacity: 0.4 }}>//</span>
          <span style={{ opacity: 0.7 }}>calcul live</span>
        </div>
        <span
          className="text-[10px] tabular-nums"
          style={{ fontFamily: 'var(--font-mono)', opacity: 0.7 }}
        >
          §{String(Math.round(caPerdu)).slice(-4).padStart(4, '0')}
        </span>
      </div>

      <div className="p-6 sm:p-10 space-y-8">
        {/* Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-10">
          <Slider
            label="Commerciaux"
            hint="Effectif terrain"
            min={5}
            max={200}
            value={commerciaux}
            onChange={setCommerciaux}
            format={(v) => `${v}`}
          />
          <Slider
            label="CA / client"
            hint="Panier annuel moyen"
            min={10000}
            max={500000}
            value={ca}
            onChange={setCa}
            format={fmtEur}
          />
          <Slider
            label="RDV / semaine"
            hint="Volume commercial"
            min={20}
            max={200}
            value={rdvSemaine}
            onChange={setRdvSemaine}
            format={(v) => `${v}`}
          />
        </div>

        {/* Heavy rule */}
        <div
          className="h-px"
          style={{ background: 'rgba(26, 21, 16, 0.2)' }}
        />

        {/* Narrative */}
        <p
          className="text-[17px] sm:text-[19px] leading-[1.5]"
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 400,
            letterSpacing: '-0.01em',
            color: '#1A1510',
          }}
        >
          Votre équipe génère{' '}
          <em
            style={{
              fontStyle: 'italic',
              fontWeight: 600,
              color: '#CC3329',
            }}
          >
            {fmt(signaux)} signaux chaque semaine
          </em>
          . Sans instrumentation,{' '}
          <em style={{ fontStyle: 'italic', fontWeight: 600 }}>
            {pertePct}%
          </em>{' '}
          s&apos;évaporent dans des CR non lus — l&apos;équivalent de{' '}
          <em style={{ fontStyle: 'italic', fontWeight: 600 }}>
            {etudes} études de marché
          </em>{' '}
          abandonnées par mois.
        </p>

        {/* KPI grid — newspaper style */}
        <div
          className="grid grid-cols-3 divide-x"
          style={{ borderTop: '2px solid #1A1510', borderBottom: '1px solid rgba(26, 21, 16, 0.15)' }}
        >
          {[
            { value: fmt(signaux * 4), unit: '/ mois', label: 'Signaux perdus', tone: '#1A1510' },
            { value: `${pertePct}`, unit: '%', label: 'Intel. non captée', tone: '#CC3329' },
            { value: fmtEur(caPerdu), unit: '/ mois', label: 'CA non capturé', tone: '#D4A017' },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className="py-6 px-4 sm:px-6"
              style={{ borderColor: 'rgba(26, 21, 16, 0.15)' }}
            >
              <div
                className="text-[10px] tracking-[0.16em] uppercase mb-3"
                style={{
                  fontFamily: 'var(--font-mono)',
                  color: 'rgba(26, 21, 16, 0.55)',
                }}
              >
                {kpi.label}
              </div>
              <div className="flex items-baseline gap-1">
                <span
                  className="tabular-nums"
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 700,
                    letterSpacing: '-0.04em',
                    color: kpi.tone,
                    fontSize: 'clamp(28px, 4vw, 44px)',
                    lineHeight: 1,
                  }}
                >
                  {kpi.value}
                </span>
                <span
                  className="text-[11px]"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    color: 'rgba(26, 21, 16, 0.5)',
                  }}
                >
                  {kpi.unit}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .roi-slider { -webkit-appearance: none; appearance: none; height: 4px; border-radius: 2px; outline: none; }
        .roi-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 20px; height: 20px;
          border-radius: 50%;
          background: #1A1510;
          border: 3px solid #F4EFE6;
          cursor: grab;
          box-shadow: 0 0 0 1px #1A1510;
        }
        .roi-slider::-webkit-slider-thumb:active { cursor: grabbing; background: #CC3329; }
        .roi-slider::-moz-range-thumb {
          width: 20px; height: 20px;
          border-radius: 50%;
          background: #1A1510;
          border: 3px solid #F4EFE6;
          cursor: grab;
          box-shadow: 0 0 0 1px #1A1510;
        }
      `}</style>
    </div>
  );
}
