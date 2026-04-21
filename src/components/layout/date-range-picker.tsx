'use client';

/**
 * Picker de plage temporelle globale, place dans la topbar.
 *
 * - 6 presets (7j, 30j, 90j, 6m, 1y, all)
 * - 2 champs date pour une plage custom "du ... au ..."
 * - Stocke la selection via le DateRangeContext (persistance localStorage)
 *
 * Le composant est purement UI : la logique de persistance et de filtrage
 * vit dans `@/lib/queries/date-range-context.tsx`.
 */

import { useEffect, useRef, useState } from 'react';
import { Calendar, ChevronDown, Check } from 'lucide-react';
import {
  useDateRange,
  type DateRangePreset,
} from '@/lib/queries/date-range-context';

const PRESETS: { key: Exclude<DateRangePreset, 'custom'>; label: string }[] = [
  { key: '7d', label: '7 derniers jours' },
  { key: '30d', label: '30 derniers jours' },
  { key: '90d', label: '90 derniers jours' },
  { key: '6m', label: '6 derniers mois' },
  { key: '1y', label: '12 derniers mois' },
  { key: 'all', label: 'Toutes les donnees' },
];

function fmt(d: Date): string {
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

/** Format YYYY-MM-DD pour <input type="date"> (local, pas UTC). */
function toInputDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function DateRangePicker() {
  const { range, preset, setPreset, setCustomRange } = useDateRange();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Champs date custom : synchronises avec le range courant a l'ouverture.
  const [customFrom, setCustomFrom] = useState(toInputDate(range.from));
  const [customTo, setCustomTo] = useState(toInputDate(range.to));

  useEffect(() => {
    // Quand la plage change ailleurs (ex. selection d'un preset), on resynchronise
    // les inputs pour que le "custom" parte toujours du range affiche.
    setCustomFrom(toInputDate(range.from));
    setCustomTo(toInputDate(range.to));
  }, [range.from, range.to]);

  // Ferme le dropdown si clic exterieur.
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const buttonLabel = preset === 'all'
    ? 'Toutes les donnees'
    : preset === 'custom'
      ? `${fmt(range.from)} \u2013 ${fmt(range.to)}`
      : PRESETS.find((p) => p.key === preset)?.label ?? 'Plage';

  const applyCustom = () => {
    // Parse en date locale : "YYYY-MM-DD" -> Date sans shift UTC.
    const [yf, mf, df] = customFrom.split('-').map(Number);
    const [yt, mt, dt] = customTo.split('-').map(Number);
    if (!yf || !mf || !df || !yt || !mt || !dt) return;
    const from = new Date(yf, mf - 1, df);
    const to = new Date(yt, mt - 1, dt);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return;
    setCustomRange(from, to);
    setOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:border-slate-300 cursor-pointer"
        title="Plage temporelle appliquee a toutes les pages"
      >
        <Calendar className="w-4 h-4 text-slate-500" />
        <span className="hidden md:inline">{buttonLabel}</span>
        <span className="md:hidden">Plage</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-80 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <div className="text-[11px] text-slate-500 uppercase tracking-wider">
              Filtre global
            </div>
            <div className="text-xs text-slate-600 mt-0.5">
              S&apos;applique a toutes les pages (signaux, prix, offres, comm, deals, CR).
            </div>
          </div>

          <div className="py-1">
            {PRESETS.map((p) => {
              const active = preset === p.key;
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => { setPreset(p.key); setOpen(false); }}
                  className={`w-full flex items-center justify-between px-4 py-2 text-sm text-left hover:bg-slate-50 cursor-pointer ${active ? 'text-indigo-700 font-medium' : 'text-slate-700'}`}
                >
                  <span>{p.label}</span>
                  {active && <Check className="w-4 h-4 text-indigo-600" />}
                </button>
              );
            })}
          </div>

          <div className="border-t border-slate-100 px-4 py-3 space-y-2">
            <div className="text-[11px] text-slate-500 uppercase tracking-wider">
              Plage personnalisee
            </div>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="flex-1 px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <span className="text-xs text-slate-400">au</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="flex-1 px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <button
              type="button"
              onClick={applyCustom}
              className="w-full px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 cursor-pointer"
            >
              Appliquer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
