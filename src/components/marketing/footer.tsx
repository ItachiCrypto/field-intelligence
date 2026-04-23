import Link from 'next/link';
import { Zap, Mail, ExternalLink } from 'lucide-react';

const COLS = [
  {
    label: 'Produit',
    links: [
      { label: 'Fonctionnalités', href: '/fonctionnalites' },
      { label: 'Pricing', href: '/#pricing' },
      { label: 'Comment ça marche', href: '/comment' },
      { label: 'Blog', href: '/blog' },
    ],
  },
  {
    label: 'Entreprise',
    links: [
      { label: 'À propos', href: '/pourquoi' },
      { label: 'Mentions légales', href: '/legal/mentions' },
      { label: 'CGU', href: '/legal/cgu' },
      { label: 'Confidentialité', href: '/legal/confidentialite' },
    ],
  },
  {
    label: 'Contact',
    links: [
      { label: 'hello@field-intelligence.io', href: 'mailto:hello@field-intelligence.io' },
      { label: 'Réserver une démo', href: '/demo' },
      { label: 'LinkedIn', href: 'https://linkedin.com' },
    ],
  },
];

export function MarketingFooter() {
  return (
    <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {/* Brand */}
          <div className="space-y-5">
            <div className="flex items-center gap-2.5">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: '#6366F1' }}
              >
                <Zap className="w-3.5 h-3.5 text-white" fill="currentColor" />
              </div>
              <span
                className="text-white font-bold text-[15px]"
                style={{ fontFamily: 'var(--font-syne), sans-serif' }}
              >
                Field Intelligence
              </span>
            </div>
            <p className="text-[13px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.30)' }}>
              L&apos;intelligence terrain que vos études de marché ne capturent jamais.
            </p>
            <div className="flex items-center gap-2">
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  color: 'rgba(255,255,255,0.35)',
                }}
                aria-label="LinkedIn"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <a
                href="mailto:hello@field-intelligence.io"
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  color: 'rgba(255,255,255,0.35)',
                }}
                aria-label="Email"
              >
                <Mail className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Link columns */}
          {COLS.map((col) => (
            <div key={col.label} className="space-y-4">
              <h4
                className="text-[11px] font-semibold uppercase tracking-widest"
                style={{ color: 'rgba(255,255,255,0.20)', fontFamily: 'var(--font-syne), sans-serif' }}
              >
                {col.label}
              </h4>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-[13px] transition-colors"
                      style={{ color: 'rgba(255,255,255,0.35)' }}
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div
          className="mt-16 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
        >
          <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.18)' }}>
            © {new Date().getFullYear()} Field Intelligence. Tous droits réservés.
          </p>
          <div
            className="flex items-center gap-4 text-[12px]"
            style={{ color: 'rgba(255,255,255,0.18)' }}
          >
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Hébergé en Europe
            </span>
            <span>·</span>
            <span>RGPD</span>
            <span>·</span>
            <span>Lecture seule CRM</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
