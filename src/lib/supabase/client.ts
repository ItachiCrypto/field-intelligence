import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './types';

// Singleton — one client for the entire browser session.
// Prevents lock conflicts from React Strict Mode double-mounting.
let client: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function createClient() {
  if (client) return client;
  client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  return client;
}
