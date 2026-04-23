'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

const links = [
  { label: 'Produit', href: '/fonctionnalites', num: '01' },
  { label: 'Méthode', href: '/pourquoi', num: '02' },
  { label: 'Pricing', href: '/#pricing', num: '03' },
  { label: 'Journal', href: '/blog', num: '04' },
];

export function MarketingNav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [time, setTime] = useState('');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', onScroll, { passive: true });

    const updateTime = () =>
      setTime(
        new Date().toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'Europe/Paris',
        })
      );
    updateTime();
    const tick = setInterval(updateTime, 30_000);

    return () => {
      window.removeEventListener('scroll', onScroll);
      clearInterval(tick);
    };
  }, []);

  return (
    <header
      className="fixed top-0 inset-x-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? 'rgba(244, 239, 230, 0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px) saturate(1.2)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(12px) saturate(1.2)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(26, 21, 16, 0.12)' : '1px solid transparent',
      }}
    >
      {/* Top meta strip — FT-style */}
      <div
        className="hidden md:block border-b"
        style={{ borderColor: 'rgba(26, 21, 16, 0.08)' }}
      >
        <div
          className="max-w-[1400px] mx-auto px-6 lg:px-10 h-7 flex items-center justify-between text-[10.5px] tracking-[0.08em] uppercase"
          style={{
            fontFamily: 'var(--font-mono)',
            color: 'rgba(26, 21, 16, 0.55)',
          }}
        >
          <div className="flex items-center gap-5">
            <span className="flex items-center gap-1.5">
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: '#CC3329' }}
              />
              Live
            </span>
            <span>Paris · {time || '—'}</span>
            <span className="hidden lg:inline">Vol. MMXXVI · Édition numérique</span>
          </div>
          <div className="flex items-center gap-5">
            <span className="hidden lg:inline">Intelligence terrain B2B</span>
            <span>FR · EN</span>
          </div>
        </div>
      </div>

      <nav className="max-w-[1400px] mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
        {/* Wordmark */}
        <Link href="/" className="flex items-baseline gap-2 group">
          <span
            className="text-[22px] leading-none"
            style={{
              fontFamily: 'var(--font-display)',
              fontStyle: 'italic',
              fontWeight: 500,
              letterSpacing: '-0.02em',
              color: '#1A1510',
            }}
          >
            Field
          </span>
          <span
            className="text-[22px] leading-none"
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: '#1A1510',
            }}
          >
            Intelligence.
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden lg:flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="group px-3 py-2 flex items-baseline gap-1.5 transition-colors"
              style={{ color: '#1A1510' }}
            >
              <span
                className="text-[10px] tabular-nums"
                style={{
                  fontFamily: 'var(--font-mono)',
                  color: 'rgba(26, 21, 16, 0.4)',
                }}
              >
                {l.num}
              </span>
              <span
                className="text-[13px] tracking-tight group-hover:italic transition-all"
                style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}
              >
                {l.label}
              </span>
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="hidden lg:flex items-center gap-5">
          <Link
            href="/auth/login"
            className="text-[13px] hover:underline underline-offset-4"
            style={{ color: 'rgba(26, 21, 16, 0.7)', fontWeight: 500 }}
          >
            Connexion
          </Link>
          <Link
            href="/auth/signup"
            className="group inline-flex items-center gap-2 pl-4 pr-2 py-2 transition-all"
            style={{
              background: '#1A1510',
              color: '#F4EFE6',
              borderRadius: 2,
            }}
          >
            <span
              className="text-[12.5px] tracking-wide"
              style={{ fontWeight: 500 }}
            >
              S&apos;abonner
            </span>
            <span
              className="inline-flex items-center justify-center w-6 h-6 group-hover:translate-x-0.5 transition-transform"
              style={{ background: '#CC3329', borderRadius: 2 }}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M1 5h8m0 0L5.5 1.5M9 5L5.5 8.5" stroke="#F4EFE6" strokeWidth="1.4" strokeLinecap="square" />
              </svg>
            </span>
          </Link>
        </div>

        <button
          onClick={() => setOpen(!open)}
          className="lg:hidden p-2"
          style={{ color: '#1A1510' }}
          aria-label="Menu"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {/* Mobile */}
      {open && (
        <div
          className="lg:hidden border-t"
          style={{
            background: '#F4EFE6',
            borderColor: 'rgba(26, 21, 16, 0.12)',
          }}
        >
          <div className="max-w-[1400px] mx-auto px-6 py-6 flex flex-col gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="flex items-baseline gap-3 py-3 border-b"
                style={{ borderColor: 'rgba(26, 21, 16, 0.08)' }}
              >
                <span
                  className="text-[11px] tabular-nums"
                  style={{ fontFamily: 'var(--font-mono)', color: 'rgba(26, 21, 16, 0.4)' }}
                >
                  {l.num}
                </span>
                <span
                  className="text-[17px]"
                  style={{ fontFamily: 'var(--font-display)', fontWeight: 500, letterSpacing: '-0.01em' }}
                >
                  {l.label}
                </span>
              </Link>
            ))}
            <div className="pt-5 flex flex-col gap-2">
              <Link
                href="/auth/login"
                onClick={() => setOpen(false)}
                className="py-3 text-center text-[14px]"
                style={{
                  border: '1px solid rgba(26, 21, 16, 0.2)',
                  borderRadius: 2,
                  color: '#1A1510',
                }}
              >
                Connexion
              </Link>
              <Link
                href="/auth/signup"
                onClick={() => setOpen(false)}
                className="py-3 text-center text-[14px]"
                style={{
                  background: '#1A1510',
                  color: '#F4EFE6',
                  borderRadius: 2,
                  fontWeight: 500,
                }}
              >
                S&apos;abonner →
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
