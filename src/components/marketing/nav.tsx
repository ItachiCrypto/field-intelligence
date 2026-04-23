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
    const handler = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-[#0A0A0A]/90 backdrop-blur-xl border-b border-white/[0.06]'
          : 'bg-transparent'
      }`}
    >
      <nav className="max-w-6xl mx-auto px-5 sm:px-8 h-[60px] flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
          <div className="w-7 h-7 rounded-lg bg-[#6366F1] flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-white" fill="currentColor" />
          </div>
          <span
            className="text-white font-bold text-[15px] tracking-tight"
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
              className="px-3.5 py-2 text-[13px] font-medium text-white/50 hover:text-white rounded-lg transition-colors duration-200"
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="hidden lg:flex items-center gap-3">
          <Link
            href="/auth/login"
            className="text-[13px] font-medium text-white/50 hover:text-white px-3 py-2 transition-colors"
          >
            Connexion
          </Link>
          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-[#0A0A0A] text-[13px] font-semibold rounded-lg hover:bg-white/90 transition-colors"
          >
            Démarrer gratuitement
          </Link>
        </div>

        {/* Mobile burger */}
        <button
          onClick={() => setOpen(!open)}
          className="lg:hidden p-2 text-white/60 hover:text-white transition-colors"
          aria-label="Menu"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="lg:hidden bg-[#0A0A0A] border-b border-white/[0.08]">
          <div className="max-w-6xl mx-auto px-5 py-4 flex flex-col gap-0.5">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="px-4 py-3 text-sm font-medium text-white/60 hover:text-white rounded-lg transition-colors"
              >
                {l.label}
              </Link>
            ))}
            <div className="pt-3 mt-2 border-t border-white/[0.08] flex flex-col gap-2">
              <Link
                href="/auth/login"
                onClick={() => setOpen(false)}
                className="px-4 py-2.5 text-sm font-medium text-white/60 text-center rounded-lg border border-white/[0.10] hover:border-white/20"
              >
                Connexion
              </Link>
              <Link
                href="/auth/signup"
                onClick={() => setOpen(false)}
                className="px-4 py-2.5 text-sm font-semibold text-[#0A0A0A] bg-white text-center rounded-lg"
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
