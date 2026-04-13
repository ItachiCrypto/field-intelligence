import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './types';

// Singleton browser client using @supabase/ssr.
// This stores the session in BOTH localStorage AND cookies,
// so that server-side route handlers can read the session from cookies.
let client: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function createClient() {
  if (client) return client;
  client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        // Disable navigator.locks which can hang in some environments
        lock: (name: string, acquireTimeout: number, fn: () => Promise<any>) => fn(),
      },
    }
  );
  return client;
}
