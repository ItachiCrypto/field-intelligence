import Link from 'next/link';

const COLS = [
  {
    label: 'Produit',
    links: [
      { label: 'Fonctionnalités', href: '/fonctionnalites' },
      { label: 'Méthode', href: '/pourquoi' },
      { label: 'Comment ça marche', href: '/comment' },
      { label: 'Tarification', href: '/#pricing' },
    ],
  },
  {
    label: 'Maison',
    links: [
      { label: 'Journal', href: '/blog' },
      { label: 'À propos', href: '/pourquoi' },
      { label: 'Presse', href: '/demo' },
      { label: 'Contact', href: 'mailto:hello@field-intelligence.io' },
    ],
  },
  {
    label: 'Légal',
    links: [
      { label: 'Mentions légales', href: '/legal/mentions' },
      { label: 'CGU', href: '/legal/cgu' },
      { label: 'Confidentialité', href: '/legal/confidentialite' },
      { label: 'Sécurité & RGPD', href: '/legal/confidentialite' },
    ],
  },
];

export function MarketingFooter() {
  return (
    <footer
      style={{
        background: '#1A1510',
        color: '#F4EFE6',
      }}
    >
      {/* Giant wordmark */}
      <div
        className="border-b"
        style={{ borderColor: 'rgba(244, 239, 230, 0.15)' }}
      >
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-10 sm:py-14">
          <div className="flex items-baseline justify-between gap-6 flex-wrap">
            <h2
              className="leading-[0.88]"
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 'clamp(48px, 11vw, 160px)',
                letterSpacing: '-0.055em',
              }}
            >
              <span style={{ fontStyle: 'italic', fontWeight: 400 }}>Field</span>
              <span>&nbsp;Intelligence.</span>
            </h2>
            <span
              className="text-[11px] tracking-[0.16em] uppercase"
              style={{
                fontFamily: 'var(--font-mono)',
                color: 'rgba(244, 239, 230, 0.55)',
              }}
            >
              Édition MMXXVI
            </span>
          </div>
        </div>
      </div>

      {/* Columns */}
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Motto */}
          <div className="space-y-5 lg:col-span-1">
            <p
              className="text-[18px] leading-[1.35]"
              style={{
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                fontWeight: 400,
                letterSpacing: '-0.01em',
              }}
            >
              « L&apos;intelligence terrain que vos études de marché n&apos;ont jamais su saisir. »
            </p>
            <div
              className="text-[10px] tracking-[0.16em] uppercase pt-3"
              style={{
                fontFamily: 'var(--font-mono)',
                color: 'rgba(244, 239, 230, 0.5)',
                borderTop: '1px solid rgba(244, 239, 230, 0.15)',
              }}
            >
              hello@field-intelligence.io
            </div>
          </div>

          {COLS.map((col) => (
            <div key={col.label} className="space-y-4">
              <h4
                className="text-[10px] tracking-[0.18em] uppercase pb-3 border-b"
                style={{
                  fontFamily: 'var(--font-mono)',
                  color: 'rgba(244, 239, 230, 0.55)',
                  borderColor: 'rgba(244, 239, 230, 0.15)',
                }}
              >
                {col.label}
              </h4>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="group inline-flex items-baseline gap-1.5 hover:italic transition-all"
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 15,
                        fontWeight: 400,
                        color: 'rgba(244, 239, 230, 0.85)',
                        letterSpacing: '-0.005em',
                      }}
                    >
                      {l.label}
                      <span
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ color: '#CC3329' }}
                      >
                        →
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Colophon */}
        <div
          className="mt-14 pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t"
          style={{ borderColor: 'rgba(244, 239, 230, 0.15)' }}
        >
          <div
            className="text-[10.5px] tracking-[0.14em] uppercase flex items-center gap-4 flex-wrap"
            style={{
              fontFamily: 'var(--font-mono)',
              color: 'rgba(244, 239, 230, 0.5)',
            }}
          >
            <span>© MMXXVI Field Intelligence</span>
            <span style={{ opacity: 0.4 }}>/</span>
            <span>Hébergé · UE</span>
            <span style={{ opacity: 0.4 }}>/</span>
            <span>RGPD</span>
            <span style={{ opacity: 0.4 }}>/</span>
            <span>Lecture seule CRM</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: '#CC3329' }}
            />
            <span
              className="text-[10.5px] tracking-[0.14em] uppercase"
              style={{
                fontFamily: 'var(--font-mono)',
                color: 'rgba(244, 239, 230, 0.7)',
              }}
            >
              Système opérationnel
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
