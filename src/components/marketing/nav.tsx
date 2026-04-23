'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, Zap } from 'lucide-react';

const links = [
  { label: 'Fonctionnalités', href: '/fonctionnalites' },
  { label: 'Pourquoi Field Intelligence', href: '/pourquoi' },
  { label: 'Comment ça marche', href: '/comment' },
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
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-[#3730A3] flex items-center justify-center shadow-sm group-hover:bg-[#6366F1] transition-colors">
            <Zap className="w-4 h-4 text-white" fill="currentColor" />
          </div>
          <span
            className="text-[#111827] font-bold text-lg tracking-tight"
            style={{ fontFamily: 'var(--font-syne), sans-serif' }}
          >
            Field Intelligence
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden lg:flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="px-3.5 py-2 text-sm font-medium text-slate-600 hover:text-[#3730A3] rounded-lg hover:bg-[#EEF2FF] transition-all"
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="hidden lg:flex items-center gap-3">
          <Link
            href="/auth/login"
            className="text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-2 transition-colors"
          >
            Connexion
          </Link>
          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#3730A3] text-white text-sm font-semibold rounded-lg hover:bg-[#6366F1] transition-colors shadow-sm"
          >
            Démarrer gratuitement
          </Link>
        </div>

        {/* Mobile burger */}
        <button
          onClick={() => setOpen(!open)}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Menu"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="lg:hidden bg-white border-b border-slate-200 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="px-4 py-3 text-sm font-medium text-slate-700 hover:text-[#3730A3] rounded-lg hover:bg-[#EEF2FF] transition-all"
              >
                {l.label}
              </Link>
            ))}
            <div className="pt-3 mt-2 border-t border-slate-100 flex flex-col gap-2">
              <Link
                href="/auth/login"
                onClick={() => setOpen(false)}
                className="px-4 py-2.5 text-sm font-medium text-slate-600 text-center rounded-lg border border-slate-200 hover:bg-slate-50"
              >
                Connexion
              </Link>
              <Link
                href="/auth/signup"
                onClick={() => setOpen(false)}
                className="px-4 py-2.5 text-sm font-semibold text-white bg-[#3730A3] text-center rounded-lg hover:bg-[#6366F1]"
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
