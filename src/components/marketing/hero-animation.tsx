'use client';

import { useState, useEffect } from 'react';

const CR_TEXT =
  '"Client mentionne qu\'Acme leur a proposé un bundle avec 3 mois offerts, prix 15% en dessous du nôtre — il teste depuis 2 semaines et semble convaincu par l\'argument ROI."';

const TAGS = [
  { label: 'CONCURRENT ACTIF', color: 'bg-red-500', delay: 0 },
  { label: 'OFFRE BUNDLE', color: 'bg-amber-500', delay: 300 },
  { label: 'ÉCART PRIX −15%', color: 'bg-orange-500', delay: 600 },
  { label: 'DURÉE TEST 2 SEM.', color: 'bg-purple-500', delay: 900 },
];

export function HeroAnimation() {
  const [phase, setPhase] = useState<'text' | 'tags'>('text');
  const [visibleTags, setVisibleTags] = useState<number[]>([]);
  const [typed, setTyped] = useState('');

  // Typing effect
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setTyped(CR_TEXT.slice(0, i + 1));
      i++;
      if (i >= CR_TEXT.length) {
        clearInterval(interval);
        setTimeout(() => setPhase('tags'), 600);
      }
    }, 22);
    return () => clearInterval(interval);
  }, []);

  // Show tags one by one
  useEffect(() => {
    if (phase !== 'tags') return;
    TAGS.forEach((tag, idx) => {
      setTimeout(() => {
        setVisibleTags((prev) => [...prev, idx]);
      }, tag.delay);
    });
  }, [phase]);

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      {/* Terminal/CRM window */}
      <div className="rounded-2xl border border-slate-700 bg-slate-900 overflow-hidden shadow-2xl shadow-indigo-950/40">
        {/* Window chrome */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-700/80 bg-slate-800/50">
          <div className="w-3 h-3 rounded-full bg-red-500/80" />
          <div className="w-3 h-3 rounded-full bg-amber-500/80" />
          <div className="w-3 h-3 rounded-full bg-green-500/80" />
          <span className="ml-3 text-xs text-slate-500 font-mono">Salesforce CRM — Compte rendu de visite</span>
        </div>

        {/* CR text */}
        <div className="p-6 min-h-[140px]">
          <div className="text-xs text-slate-500 mb-3 font-mono">Description</div>
          <p className="text-slate-200 text-sm leading-relaxed font-mono">
            {typed}
            {typed.length < CR_TEXT.length && (
              <span className="inline-block w-0.5 h-4 bg-[#6366F1] ml-0.5 animate-pulse align-middle" />
            )}
          </p>
        </div>

        {/* Tags appearing */}
        {phase === 'tags' && (
          <div className="px-6 pb-6 flex flex-wrap gap-2">
            {TAGS.map((tag, idx) => (
              <span
                key={tag.label}
                className={`inline-flex items-center px-3 py-1.5 rounded-full text-white text-xs font-bold tracking-wider uppercase transition-all duration-500 ${tag.color} ${
                  visibleTags.includes(idx)
                    ? 'opacity-100 translate-y-0 scale-100'
                    : 'opacity-0 translate-y-2 scale-95'
                }`}
                style={{ transitionDelay: `${tag.delay}ms` }}
              >
                {tag.label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Glow effect */}
      <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-[#6366F1]/20 via-transparent to-[#3730A3]/20 pointer-events-none" />

      {/* Arrow to dashboard */}
      {phase === 'tags' && visibleTags.length === TAGS.length && (
        <div className="mt-4 flex items-center justify-center gap-2 text-slate-400 text-xs animate-pulse">
          <span>Alimenté vers votre dashboard marketing</span>
          <span>→</span>
        </div>
      )}
    </div>
  );
}
