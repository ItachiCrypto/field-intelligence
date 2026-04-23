import type { Metadata } from 'next';
import { Syne, DM_Sans } from 'next/font/google';
import { MarketingNav } from '@/components/marketing/nav';
import { MarketingFooter } from '@/components/marketing/footer';

const syne = Syne({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-syne',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-dm-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Field Intelligence — L\'intelligence terrain pour votre marketing',
  description:
    'Transformez les comptes rendus CRM de vos commerciaux en intelligence marché actionnable. Radar concurrentiel, besoins clients, analyse prix — en temps réel, sans rien changer aux habitudes terrain.',
  openGraph: {
    title: 'Field Intelligence — L\'intelligence terrain pour votre marketing',
    description:
      'Transformez les comptes rendus CRM de vos commerciaux en intelligence marché actionnable.',
    type: 'website',
  },
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${syne.variable} ${dmSans.variable}`} style={{ fontFamily: 'var(--font-dm-sans), sans-serif' }}>
      <MarketingNav />
      <main>{children}</main>
      <MarketingFooter />
    </div>
  );
}
