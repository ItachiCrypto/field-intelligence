'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User, SupabaseClient } from '@supabase/supabase-js';

type UserRole = 'admin' | 'marketing' | 'kam' | 'dirco';

interface Profile {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  company_id: string;
  avatar_url: string | null;
}

interface Company {
  id: string;
  name: string;
  plan: string;
  plan_user_limit: number;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  company: Company | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  company: null,
  loading: true,
  signOut: async () => {},
});

// Singleton client — stable across renders and strict mode
const supabase = createClient();

async function fetchProfileData(userId: string) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, company:companies(*)')
      .eq('id', userId)
      .single();

    if (error || !data) return null;

    const d = data as any;
    return {
      profile: {
        id: d.id,
        email: d.email,
        name: d.name,
        role: d.role as UserRole,
        company_id: d.company_id,
        avatar_url: d.avatar_url,
      },
      company: d.company ? {
        id: d.company.id,
        name: d.company.name,
        plan: d.company.plan,
        plan_user_limit: d.company.plan_user_limit,
      } : null,
    };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Get current session
    supabase.auth.getSession().then(async ({ data: { session }, error: sessionError }) => {
      if (!mounted) return;
      console.log('[auth] getSession result:', session ? `user=${session.user.email}` : 'no session', sessionError?.message ?? '');

      if (session?.user) {
        setUser(session.user);
        console.log('[auth] Fetching profile for', session.user.id);
        const result = await fetchProfileData(session.user.id);
        console.log('[auth] Profile result:', result ? `role=${result.profile.role}` : 'null');
        if (mounted && result) {
          setProfile(result.profile);
          setCompany(result.company);
        }
      }
      if (mounted) {
        console.log('[auth] Setting loading=false');
        setLoading(false);
      }
    }).catch((err) => {
      console.error('[auth] getSession error:', err);
      if (mounted) setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.user) {
            setUser(session.user);
            const result = await fetchProfileData(session.user.id);
            if (mounted && result) {
              setProfile(result.profile);
              setCompany(result.company);
            }
          }
          if (mounted) setLoading(false);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          setCompany(null);
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    // Don't await signOut — it can hang due to lock issues.
    // Just clear storage and redirect immediately.
    supabase.auth.signOut().catch(() => {});
    // Also clear localStorage directly as fallback
    const storageKey = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
    if (storageKey) localStorage.removeItem(storageKey);
    setUser(null);
    setProfile(null);
    setCompany(null);
    window.location.href = '/auth/login';
  };

  return (
    <AuthContext.Provider value={{ user, profile, company, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
