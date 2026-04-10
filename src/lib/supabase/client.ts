import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Singleton browser client using @supabase/supabase-js directly.
// Avoids the lock issues from @supabase/ssr's cookie-based approach.
let client: ReturnType<typeof createSupabaseClient<Database>> | null = null;

export function createClient() {
  if (client) return client;
  client = createSupabaseClient<Database>(
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
