'use client';

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
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

async function fetchProfileData(supabase: SupabaseClient, userId: string) {
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
  const supabaseRef = useRef<SupabaseClient>(createClient());
  const initDone = useRef(false);

  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;

    const supabase = supabaseRef.current;
    let mounted = true;

    // Timeout: if auth takes more than 5s, stop loading anyway
    const timeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn('[auth] Timeout — forcing loading=false');
        setLoading(false);
      }
    }, 5000);

    // Try to get current session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;

      if (session?.user) {
        setUser(session.user);
        const result = await fetchProfileData(supabase, session.user.id);
        if (mounted && result) {
          setProfile(result.profile);
          setCompany(result.company);
        }
      }

      if (mounted) setLoading(false);
      clearTimeout(timeout);
    }).catch(() => {
      if (mounted) setLoading(false);
      clearTimeout(timeout);
    });

    // Listen for auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.user) {
            setUser(session.user);
            const result = await fetchProfileData(supabase, session.user.id);
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
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const signOut = async () => {
    await supabaseRef.current.auth.signOut();
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
