'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      router.replace(user ? '/dashboard' : '/auth/login');
    }
  }, [user, loading, router]);

  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="animate-pulse text-gray-400 text-lg">Chargement...</div>
    </div>
  );
}
