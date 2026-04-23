'use client';

import { useState, useEffect } from 'react';

const CR_TEXT =
  '"Client mentionne qu\'Acme leur a proposé un bundle avec 3 mois offerts, prix 15% en dessous du nôtre — il teste depuis 2 semaines et semble convaincu par l\'argument ROI."';

const TAGS = [
  { label: 'CONCURRENT ACTIF', bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/20', dot: 'bg-red-400', delay: 0 },
  { label: 'OFFRE BUNDLE', bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/20', dot: 'bg-amber-400', delay: 250 },
  { label: 'ÉCART PRIX −15%', bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/20', dot: 'bg-orange-400', delay: 500 },
  { label: 'TEST 2 SEMAINES', bg: 'bg-violet-500/15', text: 'text-violet-400', border: 'border-violet-500/20', dot: 'bg-violet-400', delay: 750 },
];

export function HeroAnimation() {
  const [phase, setPhase] = useState<'text' | 'tags'>('text');
  const [visibleTags, setVisibleTags] = useState<number[]>([]);
  const [typed, setTyped] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setTyped(CR_TEXT.slice(0, i + 1));
      i++;
      if (i >= CR_TEXT.length) {
        clearInterval(interval);
        setDone(true);
        setTimeout(() => setPhase('tags'), 500);
      }
    }, 18);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (phase !== 'tags') return;
    TAGS.forEach((tag, idx) => {
      setTimeout(() => {
        setVisibleTags((prev) => [...prev, idx]);
      }, tag.delay);
    });
  }, [phase]);

  return (
    <div className="relative w-full max-w-xl mx-auto">
      {/* Glow behind terminal */}
      <div className="absolute -inset-8 bg-[#6366F1] opacity-[0.07] blur-3xl rounded-full pointer-events-none" />

      {/* Terminal window */}
      <div className="relative rounded-xl border border-white/[0.08] bg-[#111111] overflow-hidden shadow-2xl">
        {/* Chrome bar */}
        <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
          <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#27C93F]" />
          <div className="flex-1 flex items-center justify-center">
            <span className="text-[11px] text-white/25 font-mono">Salesforce — Compte rendu de visite</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          <div className="text-[10px] text-white/20 font-mono uppercase tracking-widest mb-3">
            Description
          </div>
          <p className="text-white/70 text-[13px] leading-relaxed font-mono min-h-[80px]">
            {typed}
            {!done && (
              <span className="inline-block w-[2px] h-[14px] bg-[#6366F1] ml-0.5 align-middle animate-pulse" />
            )}
          </p>
        </div>

        {/* Tags */}
        <div
          className={`px-5 pb-5 flex flex-wrap gap-2 transition-all duration-300 ${
            phase === 'tags' ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {TAGS.map((tag, idx) => (
            <span
              key={tag.label}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold tracking-wider border transition-all duration-500 ${tag.bg} ${tag.text} ${tag.border} ${
                visibleTags.includes(idx)
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-1'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${tag.dot}`} />
              {tag.label}
            </span>
          ))}
        </div>

        {/* Status bar */}
        {phase === 'tags' && visibleTags.length === TAGS.length && (
          <div className="px-5 pb-4">
            <div className="h-px bg-white/[0.06] mb-3" />
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-white/25 font-mono">4 signaux extraits</span>
              <span className="inline-flex items-center gap-1.5 text-[11px] text-[#6366F1] font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-[#6366F1] animate-pulse" />
                Synchronisé avec le dashboard
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
