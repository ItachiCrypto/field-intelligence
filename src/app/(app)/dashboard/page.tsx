'use client';

import { useAuth } from '@/lib/auth-context';
import { MarketingDashboard } from '@/components/dashboard/marketing-dashboard';
import { KamDashboard } from '@/components/dashboard/kam-dashboard';
import { DirectorDashboard } from '@/components/dashboard/director-dashboard';

export default function DashboardPage() {
  const { user } = useAuth();
  if (!user) return null;

  switch (user.role) {
    case 'marketing': return <MarketingDashboard />;
    case 'kam': return <KamDashboard />;
    case 'dirco': return <DirectorDashboard />;
  }
}
