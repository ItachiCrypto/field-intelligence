import { GuideCRBody } from '@/components/guide-cr/guide-cr-body';

export const metadata = {
  title: 'Guide — Rédiger un compte rendu optimal | Field Intelligence',
  description:
    "Comment écrire des comptes rendus de visite que l'IA peut interpréter avec précision : structure, mots-clés, exemples avant/après.",
};

export default function GuideCrMarketingPage() {
  return (
    <div data-marketing className="bg-slate-50 min-h-screen">
      {/* Spacer for fixed nav */}
      <div className="h-14" />
      <GuideCRBody variant="marketing" />
    </div>
  );
}
