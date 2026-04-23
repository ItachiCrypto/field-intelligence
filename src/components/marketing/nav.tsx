'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, Zap } from 'lucide-react';

const links = [
  { label: 'Fonctionnalités', href: '/fonctionnalites' },
  { label: 'Pourquoi', href: '/pourquoi' },
  { label: 'Comment', href: '/comment' },
  { label: 'Pricing', href: '/#pricing' },
  { label: 'Blog', href: '/blog' },
];

export function MarketingNav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 bg-white transition-all duration-300 ${
        scrolled ? 'border-b border-slate-200 shadow-sm' : 'border-b border-transparent'
      }`}
    >
      <nav className="max-w-6xl mx-auto px-5 sm:px-8 h-14 flex items-center justify-between">
        {/* Logo — same as app sidebar */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-white" fill="currentColor" />
          </div>
          <span
            className="text-slate-900 font-bold text-[15px] tracking-tight"
            style={{ fontFamily: 'var(--font-syne), sans-serif' }}
          >
            Field Intelligence
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden lg:flex items-center gap-0.5">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="px-3.5 py-2 text-[13px] font-medium text-slate-500 hover:text-slate-900 rounded-lg transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* CTA — matches app primary button style */}
        <div className="hidden lg:flex items-center gap-2">
          <Link
            href="/auth/login"
            className="px-3.5 py-2 text-[13px] font-medium text-slate-500 hover:text-slate-900 transition-colors"
          >
            Connexion
          </Link>
          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-semibold rounded-lg transition-colors"
          >
            Démarrer gratuitement
          </Link>
        </div>

        {/* Mobile */}
        <button
          onClick={() => setOpen(!open)}
          className="lg:hidden p-2 text-slate-500 hover:text-slate-900 transition-colors"
          aria-label="Menu"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="lg:hidden bg-white border-b border-slate-200">
          <div className="max-w-6xl mx-auto px-5 py-3 flex flex-col gap-0.5">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="px-4 py-3 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
              >
                {l.label}
              </Link>
            ))}
            <div className="pt-3 mt-2 border-t border-slate-200 flex flex-col gap-2">
              <Link
                href="/auth/login"
                onClick={() => setOpen(false)}
                className="px-4 py-2.5 text-sm font-medium text-slate-600 text-center rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                Connexion
              </Link>
              <Link
                href="/auth/signup"
                onClick={() => setOpen(false)}
                className="px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 text-center rounded-lg transition-colors"
              >
                Démarrer gratuitement
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
