import { GuideCRBody } from '@/components/guide-cr/guide-cr-body';

export const metadata = {
  title: 'Guide CR — Field Intelligence',
};

export default function GuideCrAppPage() {
  return (
    <div className="space-y-6">
      <GuideCRBody variant="app" />
    </div>
  );
}
