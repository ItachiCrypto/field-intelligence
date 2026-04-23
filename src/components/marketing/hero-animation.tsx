'use client';

import { useState, useEffect } from 'react';

const CR_TEXT =
  "Client mentionne qu'Acme a proposé un bundle avec 3 mois offerts — prix 15% sous le nôtre. Teste depuis 2 semaines, convaincu par l'argument ROI.";

const TAGS = [
  { label: 'CONCURRENT', sub: 'Acme Corp · actif', tone: '#CC3329', delay: 100 },
  { label: 'PRIX', sub: 'écart −15,0%', tone: '#D4A017', delay: 380 },
  { label: 'OFFRE', sub: '3 mois offerts', tone: '#4A6B3A', delay: 640 },
  { label: 'CHURN', sub: 'probabilité élevée', tone: '#7A3B8F', delay: 900 },
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
            setTimeout(
              () => setVisibleTags((prev) => [...prev, idx]),
              tag.delay
            );
          });
        }, 450);
      }
    }, 18);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="relative w-full"
      style={{
        background: '#FBFAF6',
        border: '1px solid #1A1510',
        boxShadow: '8px 8px 0 #1A1510',
        borderRadius: 2,
      }}
    >
      {/* Ticker header */}
      <div
        className="flex items-center justify-between px-5 py-2.5 border-b"
        style={{
          borderColor: '#1A1510',
          background: '#1A1510',
          color: '#F4EFE6',
          fontFamily: 'var(--font-mono)',
        }}
      >
        <div className="flex items-center gap-3 text-[10.5px] tracking-[0.12em] uppercase">
          <span className="flex items-center gap-1.5">
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: '#CC3329' }}
            />
            Salesforce
          </span>
          <span style={{ opacity: 0.5 }}>/</span>
          <span>CR-2047</span>
        </div>
        <span
          className="text-[10px] tabular-nums"
          style={{ opacity: 0.7 }}
        >
          14.04 · 15:42
        </span>
      </div>

      {/* Dateline */}
      <div
        className="px-5 pt-4 pb-2 border-b flex items-baseline justify-between"
        style={{ borderColor: 'rgba(26, 21, 16, 0.08)' }}
      >
        <div className="flex items-baseline gap-2">
          <span
            className="text-[10px] tracking-[0.14em] uppercase"
            style={{
              fontFamily: 'var(--font-mono)',
              color: 'rgba(26, 21, 16, 0.5)',
            }}
          >
            Commercial
          </span>
          <span
            className="text-[13px]"
            style={{
              fontFamily: 'var(--font-display)',
              fontStyle: 'italic',
              fontWeight: 500,
              color: '#1A1510',
            }}
          >
            Thomas D.
          </span>
        </div>
        <span
          className="text-[10px] tabular-nums"
          style={{
            fontFamily: 'var(--font-mono)',
            color: 'rgba(26, 21, 16, 0.5)',
          }}
        >
          Région IDF
        </span>
      </div>

      {/* Body */}
      <div className="p-5 space-y-5">
        <p
          className="text-[14.5px] leading-[1.55] min-h-[92px]"
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 400,
            color: '#1A1510',
            letterSpacing: '-0.005em',
          }}
        >
          <span style={{ fontStyle: 'italic', fontWeight: 500, color: '#CC3329' }}>
            «&nbsp;
          </span>
          {typed}
          {phase === 'typing' && (
            <span
              className="inline-block w-[2px] h-[15px] ml-0.5 align-middle animate-pulse"
              style={{ background: '#CC3329' }}
            />
          )}
          {phase === 'tagged' && (
            <span style={{ fontStyle: 'italic', fontWeight: 500, color: '#CC3329' }}>
              &nbsp;»
            </span>
          )}
        </p>

        {/* Horizontal rule */}
        <div
          className="flex items-center gap-3 text-[9.5px] tracking-[0.18em] uppercase"
          style={{
            fontFamily: 'var(--font-mono)',
            color: 'rgba(26, 21, 16, 0.45)',
          }}
        >
          <span>Signaux extraits</span>
          <div
            className="flex-1 h-px"
            style={{ background: 'rgba(26, 21, 16, 0.2)' }}
          />
          <span className="tabular-nums">{visibleTags.length} / 4</span>
        </div>

        {/* Tags grid */}
        <div className="grid grid-cols-2 gap-2">
          {TAGS.map((tag, idx) => {
            const visible = visibleTags.includes(idx);
            return (
              <div
                key={tag.label}
                className="flex items-center gap-2.5 px-3 py-2.5"
                style={{
                  border: '1px solid rgba(26, 21, 16, 0.15)',
                  borderLeft: `3px solid ${tag.tone}`,
                  background: '#F4EFE6',
                  opacity: visible ? 1 : 0,
                  transform: visible ? 'translateY(0)' : 'translateY(6px)',
                  transition: 'all 0.45s cubic-bezier(.22,1,.36,1)',
                  borderRadius: 1,
                }}
              >
                <div className="min-w-0">
                  <div
                    className="text-[10.5px] tracking-[0.14em] uppercase"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      color: tag.tone,
                      fontWeight: 600,
                    }}
                  >
                    {tag.label}
                  </div>
                  <div
                    className="text-[12px] mt-0.5 truncate"
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontStyle: 'italic',
                      color: '#1A1510',
                      fontWeight: 500,
                    }}
                  >
                    {tag.sub}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer ticker */}
      <div
        className="flex items-center justify-between px-5 py-2.5 border-t text-[10px] tracking-[0.12em] uppercase"
        style={{
          fontFamily: 'var(--font-mono)',
          borderColor: 'rgba(26, 21, 16, 0.12)',
          color: 'rgba(26, 21, 16, 0.55)',
        }}
      >
        <span>Dashboard · sync auto</span>
        <span
          className="flex items-center gap-1.5"
          style={{
            color: visibleTags.length === TAGS.length ? '#4A6B3A' : 'rgba(26, 21, 16, 0.5)',
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: visibleTags.length === TAGS.length ? '#4A6B3A' : 'rgba(26, 21, 16, 0.3)',
            }}
          />
          {visibleTags.length === TAGS.length ? 'Publié' : 'En cours'}
        </span>
      </div>
    </div>
  );
}
