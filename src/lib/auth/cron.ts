/**
 * Constant-time secret comparison utilities for cron / service-to-service
 * routes. Using `===` on secret material is vulnerable to timing attacks —
 * the difference in rejection time between a good-prefix and a bad-prefix
 * header leaks enough bits over thousands of requests to brute-force the
 * secret. `crypto.timingSafeEqual` takes the same time regardless.
 */
import crypto from 'node:crypto';

function constantTimeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a, 'utf-8');
  const bBuf = Buffer.from(b, 'utf-8');
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

/**
 * Check a plain shared-secret header (e.g. `x-cron-secret: <secret>`) against
 * the configured CRON_SECRET. Returns false if the env var is missing so a
 * misconfigured deploy can never be invoked without the header.
 */
export function verifyCronHeader(providedRaw: string | null): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  if (!providedRaw) return false;
  return constantTimeEqual(providedRaw, expected);
}

/**
 * Check an `Authorization: Bearer <secret>` header against CRON_SECRET.
 * Matches the format Vercel Cron sends when configured with a secret.
 */
export function verifyCronBearer(authorizationHeader: string | null): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  if (!authorizationHeader) return false;
  const match = /^Bearer\s+(.+)$/i.exec(authorizationHeader);
  if (!match) return false;
  return constantTimeEqual(match[1], expected);
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_REGEX.test(value);
}
