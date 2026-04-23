'use client';

import { useState, useEffect } from 'react';

const CR_TEXT =
  '"Le client mentionne qu\'Acme a proposé un bundle avec 3 mois offerts — prix 15% sous le nôtre. Il teste depuis 2 semaines et semble convaincu par l\'argument ROI."';

const TAGS = [
  { label: 'CONCURRENT ACTIF', cls: 'bg-red-50 text-red-700 border-red-200',    dot: 'bg-red-500',    delay: 0 },
  { label: 'OFFRE BUNDLE',      cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500',  delay: 300 },
  { label: 'ÉCART PRIX −15%',   cls: 'bg-orange-50 text-orange-700 border-orange-200', dot: 'bg-orange-500', delay: 600 },
  { label: 'RISQUE CHURN',      cls: 'bg-violet-50 text-violet-700 border-violet-200', dot: 'bg-violet-500', delay: 900 },
];

export function HeroAnimation() {
  const [typed, setTyped] = useState('');
  const [phase, setPhase] = useState<'typing' | 'tagged'>('typing');
  const [visibleTags, setVisibleTags] = useState<number[]>([]);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setTyped(CR_TEXT.slice(0, i + 1));
      i++;
      if (i >= CR_TEXT.length) {
        clearInterval(interval);
        setTimeout(() => {
          setPhase('tagged');
          TAGS.forEach((tag, idx) => {
            setTimeout(() => setVisibleTags((prev) => [...prev, idx]), tag.delay);
          });
        }, 450);
      }
    }, 20);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full bg-white rounded-xl border border-slate-200 shadow-md overflow-hidden">
      {/* Window chrome */}
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-3">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
          <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
          <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
        </div>
        <span className="text-xs text-slate-500 font-medium">
          Salesforce — Compte rendu de visite
        </span>
      </div>

      <div className="p-4 space-y-3">
        {/* Meta */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">
            Description
          </span>
          <span className="text-[11px] text-slate-400">Thomas D. · 14 avr.</span>
        </div>

        {/* Typed text */}
        <p className="text-sm text-slate-700 leading-relaxed min-h-[72px] font-mono">
          {typed}
          {phase === 'typing' && (
            <span className="inline-block w-0.5 h-[14px] ml-0.5 align-middle bg-indigo-500 animate-pulse" />
          )}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {TAGS.map((tag, idx) => (
            <span
              key={tag.label}
              className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-semibold border transition-all duration-400 ${tag.cls}`}
              style={{
                opacity: visibleTags.includes(idx) ? 1 : 0,
                transform: visibleTags.includes(idx) ? 'translateY(0)' : 'translateY(4px)',
                transition: 'opacity 0.35s ease, transform 0.35s ease',
              }}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${tag.dot}`} />
              {tag.label}
            </span>
          ))}
        </div>
      </div>

      {/* Status footer */}
      {visibleTags.length === TAGS.length && (
        <div className="px-4 pb-4 border-t border-slate-100 pt-3 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">4 signaux extraits</span>
          <span className="flex items-center gap-1.5 text-[11px] text-indigo-600 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            Synchronisé · dashboard
          </span>
        </div>
      )}
    </div>
  );
}
