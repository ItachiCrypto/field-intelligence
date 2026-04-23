'use client';

import { useState, useEffect } from 'react';

const CR_TEXT =
  '"Le client mentionne qu\'Acme a proposé un bundle — 3 mois offerts, prix 15% sous le nôtre. Il teste depuis 2 semaines et semble convaincu par l\'argument ROI."';

const TAGS = [
  { label: 'CONCURRENT ACTIF', color: '#EF4444', r: 239, g: 68, b: 68, delay: 0 },
  { label: 'OFFRE BUNDLE', color: '#FBBF24', r: 251, g: 191, b: 36, delay: 300 },
  { label: 'ÉCART PRIX −15%', color: '#F97316', r: 249, g: 115, b: 22, delay: 600 },
  { label: 'RISQUE CHURN', color: '#A78BFA', r: 167, g: 139, b: 250, delay: 900 },
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
    <div className="relative w-full select-none">
      {/* Ambient amber glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          inset: '-40px',
          background: 'radial-gradient(ellipse at 60% 45%, rgba(99,102,241,0.12) 0%, transparent 68%)',
        }}
      />

      {/* Card */}
      <div
        className="relative overflow-hidden"
        style={{
          background: '#0C1018',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '14px',
          transform: 'perspective(1000px) rotateY(-5deg) rotateX(1.5deg)',
          boxShadow: '0 32px 64px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04), 0 8px 32px rgba(245,158,11,0.05)',
        }}
      >
        {/* Chrome bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '12px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(255,255,255,0.02)',
          }}
        >
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#FF5F56', display: 'block' }} />
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#FFBD2E', display: 'block' }} />
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#27C93F', display: 'block' }} />
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'rgba(255,255,255,0.22)' }}>
              Salesforce — Compte rendu de visite
            </span>
          </div>
        </div>

        <div style={{ padding: '20px' }}>
          {/* Meta row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: 10, fontFamily: 'monospace', color: 'rgba(255,255,255,0.20)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
              Description
            </span>
            <span style={{ fontSize: 10, fontFamily: 'monospace', color: 'rgba(255,255,255,0.15)' }}>
              Thomas D. · 14 avr.
            </span>
          </div>

          {/* Typed text */}
          <p
            style={{
              fontSize: 13,
              fontFamily: 'monospace',
              lineHeight: 1.7,
              color: 'rgba(255,255,255,0.62)',
              minHeight: 72,
              marginBottom: 16,
            }}
          >
            {typed}
            {phase === 'typing' && (
              <span
                style={{
                  display: 'inline-block',
                  width: 2,
                  height: 13,
                  marginLeft: 2,
                  verticalAlign: 'middle',
                  background: '#6366F1',
                  animation: 'blink 1s step-end infinite',
                }}
              />
            )}
          </p>

          {/* Tags */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
            {TAGS.map((tag, idx) => (
              <span
                key={tag.label}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '4px 10px',
                  fontSize: 10,
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  borderRadius: 5,
                  color: tag.color,
                  background: `rgba(${tag.r},${tag.g},${tag.b},0.12)`,
                  border: `1px solid rgba(${tag.r},${tag.g},${tag.b},0.22)`,
                  opacity: visibleTags.includes(idx) ? 1 : 0,
                  transform: visibleTags.includes(idx) ? 'translateY(0)' : 'translateY(5px)',
                  transition: 'opacity 0.4s ease, transform 0.4s ease',
                }}
              >
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    background: tag.color,
                    flexShrink: 0,
                  }}
                />
                {tag.label}
              </span>
            ))}
          </div>
        </div>

        {/* Status footer */}
        {visibleTags.length === TAGS.length && (
          <div style={{ padding: '0 20px 16px' }}>
            <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', marginBottom: 12 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 10, fontFamily: 'monospace', color: 'rgba(255,255,255,0.18)' }}>
                4 signaux extraits
              </span>
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 10,
                  fontFamily: 'monospace',
                  color: '#6366F1',
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#6366F1',
                    animation: 'pulse 2s infinite',
                  }}
                />
                Synchronisé · dashboard
              </span>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes blink { 50% { opacity: 0; } }
      `}</style>
    </div>
  );
}
