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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  // Stable reference — never recreated
  const supabaseRef = useRef<SupabaseClient>(createClient());
  const supabase = supabaseRef.current;

  useEffect(() => {
    let mounted = true;

    async function fetchProfile(authUser: User) {
      const { data } = await supabase
        .from('profiles')
        .select('*, company:companies(*)')
        .eq('id', authUser.id)
        .single();

      if (!mounted) return;

      if (data) {
        const d = data as any;
        setProfile({
          id: d.id,
          email: d.email,
          name: d.name,
          role: d.role,
          company_id: d.company_id,
          avatar_url: d.avatar_url,
        });
        if (d.company) {
          setCompany({
            id: d.company.id,
            name: d.company.name,
            plan: d.company.plan,
            plan_user_limit: d.company.plan_user_limit,
          });
        }
      }
    }

    async function init() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!mounted) return;
      if (authUser) {
        setUser(authUser);
        await fetchProfile(authUser);
      }
      setLoading(false);
    }

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          const authUser = session?.user ?? null;
          setUser(authUser);
          if (authUser) {
            await fetchProfile(authUser);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          setCompany(null);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const signOut = async () => {
    await supabase.auth.signOut();
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
