'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function Home() {
  const { profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      router.replace(profile ? '/dashboard' : '/auth/login');
    }
  }, [profile, loading, router]);

  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="animate-pulse text-gray-400 text-lg">Chargement...</div>
    </div>
  );
}
