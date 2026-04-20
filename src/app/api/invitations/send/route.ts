// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

/**
 * POST /api/invitations/send
 *
 * Send (or re-send) the invitation email for a pending invitation row. The
 * caller provides only the invitation id — the token is looked up server-side
 * and is only exposed to the recipient's inbox. The body never carries the
 * token, role, email, or company_name: those come from the authenticated DB
 * row to prevent template injection and authorization confusion.
 *
 * Authorization:
 *   - Must be an authenticated user
 *   - Must have role='admin'
 *   - Invitation must belong to the caller's company
 */

const INVITATION_ID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Naive in-memory rate limiter keyed by user id. Good enough to blunt an
 * admin spamming invite emails from a compromised session; real production
 * use would back this with Redis / Upstash. Resets when the serverless
 * instance cycles, which is acceptable for this threat model.
 */
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 10;
const userHits = new Map<string, number[]>();

function hitRateLimit(userId: string): boolean {
  const now = Date.now();
  const bucket = (userHits.get(userId) ?? []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS
  );
  bucket.push(now);
  userHits.set(userId, bucket);
  return bucket.length > RATE_LIMIT_MAX;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (hitRateLimit(user.id)) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id, role')
      .eq('id', user.id)
      .single();
    if (!profile?.company_id || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = (await request.json().catch(() => null)) as
      | { invitationId?: unknown }
      | null;

    const invitationId =
      typeof body?.invitationId === 'string' ? body.invitationId : '';
    if (!invitationId || !INVITATION_ID_REGEX.test(invitationId)) {
      return NextResponse.json(
        { error: 'Invalid invitation id' },
        { status: 400 }
      );
    }

    // Use service role client so we can read the plaintext token (RLS hides
    // it from regular authenticated clients).
    const serviceClient = createServiceClient();
    const { data: invitation, error: inviteError } = await serviceClient
      .from('invitations')
      .select('id, company_id, email, role, token, expires_at, accepted_at')
      .eq('id', invitationId)
      .single();

    if (inviteError || !invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      );
    }
    if (invitation.company_id !== profile.company_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (invitation.accepted_at) {
      return NextResponse.json(
        { error: 'Invitation already accepted' },
        { status: 409 }
      );
    }
    if (new Date(invitation.expires_at).getTime() < Date.now()) {
      return NextResponse.json(
        { error: 'Invitation expired' },
        { status: 410 }
      );
    }

    const { data: company } = await serviceClient
      .from('companies')
      .select('name')
      .eq('id', invitation.company_id)
      .single();

    // All interpolated fields are now either:
    //   - escaped with escapeHtml() before landing in the template
    //   - URL-encoded into the href
    // No client-controlled string reaches the email body raw.
    const safeCompanyName = escapeHtml(company?.name || 'Field Intelligence');
    const safeRole = escapeHtml(invitation.role);
    const inviteUrl = `${request.nextUrl.origin}/invitations/accept?token=${encodeURIComponent(
      invitation.token
    )}`;
    const safeInviteUrl = escapeHtml(inviteUrl);

    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      const resp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${resendKey}`,
        },
        body: JSON.stringify({
          from: 'Field Intelligence <noreply@field-intelligence.app>',
          to: [invitation.email],
          subject: `Invitation a rejoindre ${company?.name || 'Field Intelligence'}`,
          html: `<p>Bonjour,</p>
<p>Vous etes invite a rejoindre ${safeCompanyName} en tant que <strong>${safeRole}</strong>.</p>
<p><a href="${safeInviteUrl}">Accepter l'invitation</a></p>
<p>Ce lien expire dans 7 jours.</p>`,
        }),
      });
      if (!resp.ok) {
        // Log status only — never echo provider body (may contain recipient
        // PII from other tenants if this key is misconfigured).
        console.error(
          '[invitations/send] Resend failed with status',
          resp.status
        );
        return NextResponse.json({ error: 'Email send failed' }, { status: 502 });
      }
      return NextResponse.json({ ok: true });
    }

    // Dev fallback: do not log the token or the recipient email.
    console.log('[invitations/send] (dev mode) invite prepared');
    return NextResponse.json({ ok: true, provider: 'console' });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
