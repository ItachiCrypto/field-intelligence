import type { Metadata } from 'next';
import { Syne } from 'next/font/google';
import { MarketingNav } from '@/components/marketing/nav';
import { MarketingFooter } from '@/components/marketing/footer';

const syne = Syne({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-syne',
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
      className={`${syne.variable} bg-slate-50 text-slate-900 min-h-screen`}
    >
      <MarketingNav />
      <main>{children}</main>
      <MarketingFooter />
    </div>
  );
}
