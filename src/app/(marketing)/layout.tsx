import type { Metadata } from 'next';
import { Fraunces, Geist, JetBrains_Mono } from 'next/font/google';
import { MarketingNav } from '@/components/marketing/nav';
import { MarketingFooter } from '@/components/marketing/footer';

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '900'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
});

const geist = Geist({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-body',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Field Intelligence — L'intelligence terrain pour votre marketing",
  description:
    'Transformez les comptes rendus CRM de vos commerciaux en intelligence marché actionnable. Radar concurrentiel, besoins clients, analyse prix — en temps réel.',
  openGraph: {
    title: "Field Intelligence — L'intelligence terrain pour votre marketing",
    description: 'Transformez les comptes rendus CRM de vos commerciaux en intelligence marché actionnable.',
    type: 'website',
  },
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-marketing="true"
      className={`${fraunces.variable} ${geist.variable} ${mono.variable} min-h-screen`}
      style={{
        background: '#F4EFE6',
        color: '#1A1510',
        fontFamily: 'var(--font-body), ui-sans-serif, system-ui',
      }}
    >
      {/* Subtle paper grain overlay */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[1] opacity-[0.035] mix-blend-multiply"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.1 0 0 0 0 0.08 0 0 0 0 0.06 0 0 0 0.9 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
        }}
      />
      <MarketingNav />
      <main className="relative z-[2]">{children}</main>
      <MarketingFooter />
    </div>
  );
}
