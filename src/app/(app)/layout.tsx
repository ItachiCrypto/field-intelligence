'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { DataProvider } from '@/lib/queries/data-context';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth();
  const router = useRouter();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!loading && !profile) {
      router.replace('/auth/login');
    }
  }, [profile, loading, router]);

  // After 4 seconds, if still loading, show debug info
  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 4000);
    return () => clearTimeout(t);
  }, []);

  if (loading || !profile) {
    if (timedOut) {
      // Show debug info + manual redirect
      return (
        <div className="flex flex-1 items-center justify-center flex-col gap-4 p-8">
          <p className="text-sm text-slate-500">
            {loading ? 'Auth en cours de chargement...' : 'Pas de profil detecte.'}
          </p>
          <button
            onClick={() => window.location.href = '/auth/login'}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 cursor-pointer"
          >
            Aller a la page de connexion
          </button>
        </div>
      );
    }
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="animate-pulse text-slate-400">Chargement...</div>
      </div>
    );
  }

  return (
    <DataProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Topbar />
          <main className="flex-1 overflow-y-auto p-6 bg-slate-50">
            {children}
          </main>
        </div>
      </div>
    </DataProvider>
  );
}
