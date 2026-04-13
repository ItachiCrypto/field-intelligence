'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && profile && profile.role !== 'admin') {
      router.replace('/dashboard');
    }
  }, [profile, loading, router]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="animate-pulse text-slate-400">Chargement...</div>
      </div>
    );
  }

  if (!profile || profile.role !== 'admin') {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-sm text-slate-500">Acces non autorise</div>
      </div>
    );
  }

  return <>{children}</>;
}
