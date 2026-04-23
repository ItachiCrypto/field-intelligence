import Link from 'next/link';
import { Zap, Mail, ExternalLink } from 'lucide-react';

export function MarketingFooter() {
  return (
    <footer className="bg-[#111827] text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          {/* Col 1 — Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#3730A3] flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" fill="currentColor" />
              </div>
              <span
                className="text-white font-bold text-base"
                style={{ fontFamily: 'var(--font-syne), sans-serif' }}
              >
                Field Intelligence
              </span>
            </div>
            <p className="text-sm leading-relaxed text-slate-500">
              L'intelligence terrain que vos études de marché ne capturent jamais.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center hover:bg-[#3730A3] transition-colors"
                aria-label="LinkedIn"
              >
                <ExternalLink className="w-4 h-4 text-slate-400" />
              </a>
              <a
                href="mailto:hello@field-intelligence.io"
                className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center hover:bg-[#3730A3] transition-colors"
                aria-label="Email"
              >
                <Mail className="w-4 h-4 text-slate-400" />
              </a>
            </div>
          </div>

          {/* Col 2 — Produit */}
          <div className="space-y-4">
            <h4
              className="text-sm font-semibold text-white uppercase tracking-wider"
              style={{ fontFamily: 'var(--font-syne), sans-serif' }}
            >
              Produit
            </h4>
            <ul className="space-y-2.5 text-sm">
              {[
                { label: 'Fonctionnalités', href: '/fonctionnalites' },
                { label: 'Pricing', href: '/#pricing' },
                { label: 'Comment ça marche', href: '/comment' },
                { label: 'Blog', href: '/blog' },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3 — Entreprise */}
          <div className="space-y-4">
            <h4
              className="text-sm font-semibold text-white uppercase tracking-wider"
              style={{ fontFamily: 'var(--font-syne), sans-serif' }}
            >
              Entreprise
            </h4>
            <ul className="space-y-2.5 text-sm">
              {[
                { label: 'À propos', href: '/pourquoi' },
                { label: 'Mentions légales', href: '/legal/mentions' },
                { label: 'CGU', href: '/legal/cgu' },
                { label: 'Politique de confidentialité', href: '/legal/confidentialite' },
                { label: 'RGPD', href: '/legal/rgpd' },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4 — Contact */}
          <div className="space-y-4">
            <h4
              className="text-sm font-semibold text-white uppercase tracking-wider"
              style={{ fontFamily: 'var(--font-syne), sans-serif' }}
            >
              Contact
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a
                  href="mailto:hello@field-intelligence.io"
                  className="hover:text-white transition-colors"
                >
                  hello@field-intelligence.io
                </a>
              </li>
              <li>
                <Link href="/demo" className="hover:text-white transition-colors">
                  Réserver une démo
                </Link>
              </li>
              <li>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  LinkedIn
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
          <p>© {new Date().getFullYear()} Field Intelligence. Tous droits réservés.</p>
          <p className="flex items-center gap-2 flex-wrap justify-center sm:justify-end">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#059669] inline-block" />
              Hébergé en Europe
            </span>
            <span>·</span>
            <span>Données protégées RGPD</span>
            <span>·</span>
            <span>Connexion CRM en lecture seule</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
