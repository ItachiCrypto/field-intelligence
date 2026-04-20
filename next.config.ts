import type { NextConfig } from 'next';

/**
 * Security headers applied to every response.
 *
 * CSP tuning notes:
 *   - `'unsafe-inline'` / `'unsafe-eval'` on script-src are still required by the
 *     current Next.js App Router runtime (it inlines bootstrap scripts without a
 *     nonce and supabase-js uses WASM-style eval in some code paths). Nonced CSP
 *     would be the ideal — tracked as a follow-up.
 *   - `'unsafe-inline'` on style-src is required by Tailwind's JIT output.
 *   - `connect-src` must include Supabase (auth/db/realtime) + Stripe + Salesforce
 *     instance domains (for OAuth exchange from the browser when we ever do it).
 *   - Stripe checkout iframes require `frame-src https://*.stripe.com`.
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://checkout.stripe.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://checkout.stripe.com https://*.salesforce.com https://*.force.com https://api.openai.com https://api.anthropic.com",
  "frame-src https://js.stripe.com https://hooks.stripe.com https://checkout.stripe.com",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  'upgrade-insecure-requests',
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: CSP },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), browsing-topics=(), interest-cohort=(), payment=(self "https://checkout.stripe.com")',
  },
  { key: 'X-DNS-Prefetch-Control', value: 'off' },
  // Isolate the origin so cross-origin window references can't read us.
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
];

const nextConfig: NextConfig = {
  // Do not leak the Next.js version banner to clients.
  poweredByHeader: false,

  async headers() {
    return [
      {
        // Apply to every path.
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
