import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/invitations/send
 * Simule l'envoi d'une invitation par email.
 * Body : { email: string, token: string, role: string, companyName?: string }
 *
 * Si RESEND_API_KEY est defini dans l'environnement, envoie un vrai email via Resend.
 * Sinon, log l'invitation dans la console (mode dev).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || !body.email || !body.token) {
      return NextResponse.json(
        { error: 'Parametres manquants (email, token requis).' },
        { status: 400 },
      );
    }

    const { email, token, role, companyName } = body as {
      email: string;
      token: string;
      role?: string;
      companyName?: string;
    };

    const inviteUrl = `${request.nextUrl.origin}/invitations/accept?token=${encodeURIComponent(token)}`;

    const resendKey = process.env.RESEND_API_KEY;

    if (resendKey) {
      // Envoi reel via Resend
      const resp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${resendKey}`,
        },
        body: JSON.stringify({
          from: 'Field Intelligence <noreply@field-intelligence.app>',
          to: [email],
          subject: `Invitation a rejoindre ${companyName || 'Field Intelligence'}`,
          html: `<p>Bonjour,</p>
<p>Vous etes invite a rejoindre ${companyName || 'Field Intelligence'} en tant que <strong>${role || 'membre'}</strong>.</p>
<p><a href="${inviteUrl}">Accepter l'invitation</a></p>
<p>Ce lien expire dans 7 jours.</p>`,
        }),
      });
      if (!resp.ok) {
        const errBody = await resp.text();
        console.error('[invitations/send] Resend error', resp.status, errBody);
        return NextResponse.json(
          { error: "L'envoi de l'email a echoue." },
          { status: 502 },
        );
      }
      return NextResponse.json({ ok: true, provider: 'resend' });
    }

    // Mode dev : log seulement
    // eslint-disable-next-line no-console
    console.log('[invitations/send] (mode dev) email simule envoye a', email, {
      role,
      companyName,
      inviteUrl,
    });
    return NextResponse.json({ ok: true, provider: 'console', inviteUrl });
  } catch (err) {
    console.error('[invitations/send] unexpected error', err);
    return NextResponse.json(
      { error: 'Erreur interne lors de l\'envoi.' },
      { status: 500 },
    );
  }
}
