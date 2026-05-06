/**
 * OAuth state + PKCE verifier handling (Salesforce and, eventually, every
 * other OAuth integration).
 *
 * Threat model addressed:
 *   - State tampering:      an attacker could change company_id in a base64
 *                           blob to re-home the connection into their own
 *                           tenant. Fixed by HMAC-signing the state.
 *   - PKCE verifier leak:   the previous implementation put the verifier
 *                           inside the state parameter. Anyone who captured
 *                           a state (referrer leak, proxy logs, ...) could
 *                           complete the flow. Fixed by keeping the verifier
 *                           in an httpOnly cookie.
 *   - State replay:         states are short-lived (10 minutes), carry a
 *                           random nonce that must round-trip through a
 *                           cookie, and are scoped to a single user id.
 */
import crypto from 'node:crypto';
import type { NextRequest, NextResponse } from 'next/server';

const STATE_TTL_MS = 10 * 60 * 1000;
const COOKIE_VERIFIER = 'sf_oauth_verifier';
const COOKIE_NONCE = 'sf_oauth_nonce';

export interface OAuthStatePayload {
  companyId: string;
  userId: string;
  nonce: string;
  issuedAt: number;
}

function getSecret(): Buffer {
  const secret = process.env.OAUTH_STATE_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      'OAUTH_STATE_SECRET must be set to at least 32 characters (use 64 hex chars).'
    );
  }
  // Defense-in-depth contre les secrets faibles. On exige >= 8 chars
  // distincts dans les 64 premiers — empeche les "aaaaaaaa..." ou les
  // suites trop predictibles (ex. "secret_key_for_local_dev_12345678").
  // Cette heuristique n'est pas une preuve d'entropie mais bloque les
  // erreurs grossieres de configuration.
  const sample = secret.slice(0, 64);
  const distinct = new Set(sample.split('')).size;
  if (distinct < 8) {
    throw new Error(
      'OAUTH_STATE_SECRET has too few distinct characters (low entropy). Use crypto.randomBytes(32).toString("hex").'
    );
  }
  return Buffer.from(secret, 'utf-8');
}

function b64urlEncode(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(str: string): Buffer {
  const pad = str.length % 4 === 0 ? '' : '='.repeat(4 - (str.length % 4));
  return Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64');
}

/** Sign a state payload as `<base64url(payload)>.<base64url(hmac)>`. */
export function signState(payload: Omit<OAuthStatePayload, 'issuedAt' | 'nonce'> & { nonce?: string }): {
  state: string;
  nonce: string;
} {
  const nonce = payload.nonce ?? crypto.randomBytes(16).toString('hex');
  const full: OAuthStatePayload = {
    companyId: payload.companyId,
    userId: payload.userId,
    nonce,
    issuedAt: Date.now(),
  };
  const body = Buffer.from(JSON.stringify(full), 'utf-8');
  const mac = crypto.createHmac('sha256', getSecret()).update(body).digest();
  return { state: `${b64urlEncode(body)}.${b64urlEncode(mac)}`, nonce };
}

/**
 * Verify a signed state. Returns the payload on success, `null` on any failure
 * (bad format, bad signature, expired).
 */
export function verifyState(state: string | null): OAuthStatePayload | null {
  if (!state) return null;
  const parts = state.split('.');
  if (parts.length !== 2) return null;
  let body: Buffer;
  let mac: Buffer;
  try {
    body = b64urlDecode(parts[0]);
    mac = b64urlDecode(parts[1]);
  } catch {
    return null;
  }

  const expected = crypto.createHmac('sha256', getSecret()).update(body).digest();
  if (expected.length !== mac.length || !crypto.timingSafeEqual(expected, mac)) {
    return null;
  }

  let payload: OAuthStatePayload;
  try {
    payload = JSON.parse(body.toString('utf-8')) as OAuthStatePayload;
  } catch {
    return null;
  }

  if (
    typeof payload !== 'object' ||
    typeof payload.companyId !== 'string' ||
    typeof payload.userId !== 'string' ||
    typeof payload.nonce !== 'string' ||
    typeof payload.issuedAt !== 'number'
  ) {
    return null;
  }
  if (Date.now() - payload.issuedAt > STATE_TTL_MS) return null;
  return payload;
}

/** Attach PKCE verifier + nonce cookies to the OAuth redirect response. */
export function attachOAuthCookies(
  response: NextResponse,
  opts: { codeVerifier: string; nonce: string }
): NextResponse {
  const common = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/api/integrations/salesforce',
    maxAge: STATE_TTL_MS / 1000,
  };
  response.cookies.set(COOKIE_VERIFIER, opts.codeVerifier, common);
  response.cookies.set(COOKIE_NONCE, opts.nonce, common);
  return response;
}

/** Read + invalidate the verifier/nonce cookies at the end of the OAuth dance. */
export function readAndClearOAuthCookies(
  request: NextRequest,
  response: NextResponse
): { codeVerifier: string | null; nonce: string | null } {
  const codeVerifier = request.cookies.get(COOKIE_VERIFIER)?.value ?? null;
  const nonce = request.cookies.get(COOKIE_NONCE)?.value ?? null;

  const common = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/api/integrations/salesforce',
    maxAge: 0,
  };
  response.cookies.set(COOKIE_VERIFIER, '', common);
  response.cookies.set(COOKIE_NONCE, '', common);

  return { codeVerifier, nonce };
}

/**
 * Validate a Salesforce `instance_url` against the official domain suffixes
 * so an attacker who somehow hijacks the token response cannot pin the
 * connection to their own fake server.
 *
 * Accepted suffixes (Salesforce-owned):
 *   - *.my.salesforce.com          (Lightning orgs)
 *   - *.salesforce.com             (classic login / test)
 *   - *.my.site.com                (Experience/Site cloud domains used by SF)
 *   - *.force.com                  (legacy domain)
 *   - *.cloudforce.com             (legacy)
 *   - *.lightning.force.com        (Lightning UI)
 */
export function isAllowedSalesforceInstanceUrl(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.protocol !== 'https:') return false;
    const host = u.hostname.toLowerCase();
    const allowedSuffixes = [
      '.my.salesforce.com',
      '.salesforce.com',
      '.my.site.com',
      '.force.com',
      '.cloudforce.com',
      '.lightning.force.com',
    ];
    return allowedSuffixes.some((suffix) => host.endsWith(suffix));
  } catch {
    return false;
  }
}
