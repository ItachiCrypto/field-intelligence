import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Only same-origin, absolute-path redirects are permitted after an OAuth /
 * email-verification callback. Anything else gets silently rewritten to
 * `/dashboard` to kill the open-redirect vector.
 *
 * Concretely we reject:
 *   - anything not starting with `/`                 (e.g. `https://evil.com`)
 *   - protocol-relative URLs (`//evil.com`)
 *   - backslash variants (`/\\evil.com`)
 *   - paths containing `..`                          (defense in depth)
 *   - paths containing CR/LF                         (header-injection guard)
 */
function sanitizeNext(raw: string | null): string {
  if (!raw) return '/dashboard';
  if (!raw.startsWith('/')) return '/dashboard';
  if (raw.startsWith('//') || raw.startsWith('/\\')) return '/dashboard';
  if (raw.includes('..') || /[\r\n]/.test(raw)) return '/dashboard';
  return raw;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = sanitizeNext(searchParams.get('next'));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_failed`);
}
