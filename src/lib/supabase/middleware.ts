import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from './types';

/**
 * Routes under `/api/` that do NOT require an authenticated Supabase session.
 * Each of these handlers MUST perform its own authentication (signature
 * verification, shared cron secret, OAuth state check, etc.). Anything not on
 * this list is forced through the usual Supabase-session check below.
 */
const PUBLIC_API_ROUTES = [
  '/api/stripe/webhook',                        // Stripe signature-verified
  '/api/integrations/salesforce/callback',      // OAuth state-verified
  '/api/integrations/sync',                     // Cron / service-to-service
  '/api/invitations/accept',                    // Token-verified invitation
];

function isPublicApiRoute(pathname: string): boolean {
  return PUBLIC_API_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  );
}

/**
 * Same-origin guard for state-changing requests. Supabase cookies are already
 * SameSite=Lax so cross-site POSTs are mitigated at the browser level, but we
 * add a defensive Origin check for mutating API calls since the API bypass
 * skips the auth redirect above.
 */
function isCrossOriginMutation(request: NextRequest): boolean {
  const method = request.method.toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return false;

  const origin = request.headers.get('origin');
  if (!origin) return false; // same-origin fetch or server-to-server call

  try {
    const originHost = new URL(origin).host;
    const reqHost = request.headers.get('host');
    return reqHost !== null && originHost !== reqHost;
  } catch {
    return true; // malformed Origin — refuse
  }
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAuthRoute = pathname.startsWith('/auth/');
  const isApiRoute = pathname.startsWith('/api/');
  const isAdminRoute = pathname.startsWith('/admin');
  const isAdminApi = pathname.startsWith('/api/admin');
  const isPublicApi = isApiRoute && isPublicApiRoute(pathname);
  const MARKETING_ROUTES = ['/fonctionnalites', '/pourquoi', '/comment', '/guide-cr', '/blog', '/demo'];
  const isMarketingRoute = pathname === '/' || MARKETING_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'));
  const isPublicRoute = isMarketingRoute || isAuthRoute;

  // -------------------------------------------------------------------------
  // CSRF defense-in-depth: refuse cross-origin mutations on any path.
  // (Supabase cookies are SameSite=Lax so browsers already block this for
  // classic form posts, but we do an explicit check for fetch/XHR too.)
  // -------------------------------------------------------------------------
  if (isCrossOriginMutation(request)) {
    return new NextResponse('Forbidden (cross-origin)', { status: 403 });
  }

  // -------------------------------------------------------------------------
  // Public API routes (webhooks, cron, OAuth callbacks) bypass the session
  // requirement. They must authenticate themselves in their own handler.
  // -------------------------------------------------------------------------
  if (isPublicApi) {
    return supabaseResponse;
  }

  // -------------------------------------------------------------------------
  // Authenticated API routes: require a session but do not redirect.
  // -------------------------------------------------------------------------
  if (isApiRoute) {
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Admin-only API routes: check role from profiles.
    if (isAdminApi) {
      const { data: profile } = (await supabase
        .from('profiles' as any)
        .select('role')
        .eq('id', user.id)
        .single()) as { data: { role: string } | null };
      if (profile?.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }
    return supabaseResponse;
  }

  // -------------------------------------------------------------------------
  // Page routes: unauthenticated users get bounced to /auth/login.
  // -------------------------------------------------------------------------
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    url.search = '';
    return redirectPreservingCookies(url, supabaseResponse);
  }

  // -------------------------------------------------------------------------
  // Authenticated user on an auth page: send them to the dashboard.
  // -------------------------------------------------------------------------
  if (
    user &&
    isAuthRoute &&
    pathname !== '/auth/callback' &&
    pathname !== '/auth/verify'
  ) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    url.search = '';
    return redirectPreservingCookies(url, supabaseResponse);
  }

  // -------------------------------------------------------------------------
  // Admin pages: require role=admin on the profile.
  // -------------------------------------------------------------------------
  if (user && isAdminRoute) {
    const { data: profile } = (await supabase
      .from('profiles' as any)
      .select('role')
      .eq('id', user.id)
      .single()) as { data: { role: string } | null };
    if (profile?.role !== 'admin') {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      url.search = '';
      return redirectPreservingCookies(url, supabaseResponse);
    }
  }

  return supabaseResponse;
}

/**
 * Build a redirect response that copies every cookie Supabase just refreshed
 * on `sourceResponse` — including flags (HttpOnly, Secure, SameSite, path…)
 * — so the client's session is preserved across the redirect.
 */
function redirectPreservingCookies(url: URL, sourceResponse: NextResponse): NextResponse {
  const redirect = NextResponse.redirect(url);
  for (const cookie of sourceResponse.cookies.getAll()) {
    // ResponseCookies returns the full cookie record; pass the whole object
    // to preserve HttpOnly / Secure / SameSite / Path / Domain / Expires.
    redirect.cookies.set(cookie);
  }
  return redirect;
}
