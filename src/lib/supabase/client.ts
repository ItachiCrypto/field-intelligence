import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './types';

// Singleton browser client using @supabase/ssr.
// This stores the session in BOTH localStorage AND cookies,
// so that server-side route handlers can read the session from cookies.
let client: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function createClient() {
  if (client) return client;

  // Patch navigator.locks to prevent deadlocks in React StrictMode.
  // The Supabase auth-js library uses navigator.locks for session
  // serialization, but in dev mode with double-renders this causes
  // permanent hangs where promises never resolve.
  if (typeof window !== 'undefined' && navigator?.locks) {
    const originalRequest = navigator.locks.request.bind(navigator.locks);
    navigator.locks.request = (name: string, optionsOrFn: any, maybeFn?: any) => {
      const fn = typeof optionsOrFn === 'function' ? optionsOrFn : maybeFn;
      // Run the function directly without acquiring a lock
      return fn({ name, mode: 'exclusive' });
    };
  }

  client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    }
  );
  return client;
}
