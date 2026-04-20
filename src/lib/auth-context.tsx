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

async function fetchProfileData(userId: string, retries = 2): Promise<{ profile: Profile; company: Company | null } | null> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, company:companies(*)')
        .eq('id', userId)
        .single();

      if (error) {
        console.warn(`[auth] Profile fetch attempt ${attempt + 1} failed:`, error.message);
        if (attempt < retries) {
          await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
          continue;
        }
        return null;
      }
      if (!data) return null;

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
    } catch (err) {
      console.error(`[auth] Profile fetch attempt ${attempt + 1} exception:`, err);
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
        continue;
      }
      return null;
    }
  }
  return null;
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
      // Do NOT log user email — this is a browser console, PII leaks to
      // browser extensions / screen-recordings / shared support sessions.
      if (sessionError) {
        console.warn('[auth] getSession error');
      }
      if (session?.user) {
        setUser(session.user);
        const result = await fetchProfileData(session.user.id);
        if (mounted && result) {
          setProfile(result.profile);
          setCompany(result.company);
        }
      }
      if (mounted) {
        setLoading(false);
      }
    }).catch(() => {
      console.error('[auth] getSession failed');
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
    setUser(null);
    setProfile(null);
    setCompany(null);

    // Try to sign out properly with a timeout to avoid hanging
    try {
      await Promise.race([
        supabase.auth.signOut(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000)),
      ]);
    } catch {
      // If signOut hangs or fails, clear storage manually
    }

    // Clear localStorage as fallback
    Object.keys(localStorage)
      .filter(k => k.startsWith('sb-'))
      .forEach(k => localStorage.removeItem(k));

    // Clear Supabase cookies
    document.cookie.split(';').forEach(c => {
      const name = c.trim().split('=')[0];
      if (name.startsWith('sb-')) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
      }
    });

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
