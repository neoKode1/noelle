/**
 * POST /api/auth/magic-link
 * Body: { email: string }
 *
 * Creates a magic-link token, sends it via Resend (or logs to console in dev).
 * Always returns 200 — no email enumeration.
 */
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getOrCreateUser, createMagicToken } from '$lib/server/auth';

export const POST: RequestHandler = async ({ request, url }) => {
	let email = '';
	try {
		const body = await request.json();
		email = (body?.email ?? '').toString().trim().toLowerCase();
	} catch {
		return json({ ok: true }); // fail silently
	}

	if (!email || !email.includes('@')) {
		return json({ ok: true }); // fail silently — no enumeration
	}

	try {
		await getOrCreateUser(email);
		const token = await createMagicToken(email);
		const verifyUrl = `${url.origin}/api/auth/verify?token=${token}`;

		const resendKey = process.env.RESEND_API_KEY;
		if (resendKey) {
			// Send via Resend
			await fetch('https://api.resend.com/emails', {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${resendKey}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					from: process.env.AUTH_FROM_EMAIL ?? 'noreply@retools.dev',
					to: email,
					subject: 'Your Noelle sign-in link',
					html: buildEmail(verifyUrl)
				})
			});
		} else {
			// Dev fallback — log the link
			console.info(`[auth] Magic link for ${email}: ${verifyUrl}`);
		}
	} catch (e) {
		console.error('[auth] magic-link error:', e);
		// Still return 200 — no enumeration
	}

	return json({ ok: true });
};

function buildEmail(verifyUrl: string): string {
	return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0f0f11;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="420" cellpadding="0" cellspacing="0"
             style="background:#18181b;border-radius:12px;padding:40px 32px;border:1px solid #27272a;">
        <tr><td align="center" style="padding-bottom:8px;">
          <span style="color:#f97316;font-size:11px;letter-spacing:3px;font-family:monospace;text-transform:uppercase;">NOELLE</span>
        </td></tr>
        <tr><td align="center" style="padding-bottom:28px;">
          <span style="color:#e4e4e7;font-size:18px;font-weight:500;">Your sign-in link</span>
        </td></tr>
        <tr><td align="center" style="padding-bottom:28px;">
          <a href="${verifyUrl}"
             style="display:inline-block;padding:14px 40px;background:#f97316;color:#fff;
                    text-decoration:none;font-size:13px;letter-spacing:2px;text-transform:uppercase;
                    font-family:monospace;border-radius:6px;font-weight:bold;">
            SIGN IN &rarr;
          </a>
        </td></tr>
        <tr><td align="center">
          <span style="color:#71717a;font-size:11px;line-height:1.6;">
            Expires in 15 minutes.<br/>If you didn't request this, ignore it.
          </span>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

