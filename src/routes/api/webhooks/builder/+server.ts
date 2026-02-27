/**
 * POST /api/webhooks/builder
 *
 * Receives HMAC-signed webhook callbacks from the Retools Builder Engine.
 * Only accepts callbacks originating from the neoKode1 GitHub account.
 * Updates the corresponding retool_jobs row with status, PR URL, GitHub run details, etc.
 */
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDB } from '$lib/server/db';

/** Only webhooks originating from this GitHub account are accepted. */
const ALLOWED_BUILDER_OWNER = 'neoKode1';

/**
 * Valid pipeline statuses sent by the retools-engine workflow.
 * These match the UI pipeline tracker exactly.
 */
const VALID_STATUSES = new Set([
	'queued',
	'cloning',
	'customizing',
	'building',
	'deploying',
	'preview_ready',
	'failed'
]);

/**
 * Extract the GitHub owner (first path segment) from a github.com run URL.
 * Returns null if the URL is not a valid github.com URL.
 */
function extractGitHubOwner(runUrl: string): string | null {
	try {
		const url = new URL(runUrl);
		if (url.hostname !== 'github.com') return null;
		const parts = url.pathname.split('/').filter(Boolean);
		return parts[0] ?? null;
	} catch {
		return null;
	}
}

/** Verify HMAC-SHA256 signature. */
async function verifySignature(
	body: string,
	signature: string,
	secret: string
): Promise<{ valid: boolean; expected: string }> {
	const encoder = new TextEncoder();
	const key = await crypto.subtle.importKey(
		'raw',
		encoder.encode(secret),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign']
	);

	const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
	const expected = Array.from(new Uint8Array(signatureBuffer))
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');

	// Constant-time comparison
	if (signature.length !== expected.length) return { valid: false, expected };
	let mismatch = 0;
	for (let i = 0; i < signature.length; i++) {
		mismatch |= signature.charCodeAt(i) ^ expected.charCodeAt(i);
	}
	return { valid: mismatch === 0, expected };
}

export const POST: RequestHandler = async ({ request }) => {
	const db = getDB();

	// ── Read + verify ────────────────────────────────────────────
	const rawBody = await request.text();
	const receivedSig = request.headers.get('x-webhook-signature') ?? '';

	const webhookSecret = (process.env.RETOOLS_WEBHOOK_SECRET ?? '').trim();
	if (!webhookSecret) {
		console.error('[Webhook] RETOOLS_WEBHOOK_SECRET is not set');
		return json({ error: 'Webhook secret not configured' }, { status: 500 });
	}

	console.log('[Webhook] Secret length:', webhookSecret.length);
	console.log('[Webhook] Secret (first 8):', webhookSecret.substring(0, 8));
	console.log('[Webhook] Received sig:', receivedSig.substring(0, 16) + '...');
	console.log('[Webhook] Body length:', rawBody.length);

	if (!receivedSig) {
		console.log('[Webhook] No signature header');
		return json({ error: 'Missing signature' }, { status: 401 });
	}

	const { valid, expected } = await verifySignature(rawBody, receivedSig, webhookSecret);

	if (!valid) {
		console.log('[Webhook] Signature MISMATCH');
		console.log('[Webhook] Expected sig:', expected.substring(0, 16) + '...');
		console.log('[Webhook] Received sig:', receivedSig.substring(0, 16) + '...');
		return json({ error: 'Invalid signature' }, { status: 401 });
	}

	console.log('[Webhook] Signature verified ✅');

	// ── Parse payload ────────────────────────────────────────────
	const payload = JSON.parse(rawBody);
	const { job_id, status: builderStatus } = payload;
	if (!job_id || !builderStatus) {
		return json({ error: 'Missing job_id or status' }, { status: 400 });
	}

	// ── Source isolation: neoKode1 repos only ────────────────────
	// Reject any callback whose github_run_url is not from the allowed owner.
	if (payload.github_run_url) {
		const owner = extractGitHubOwner(payload.github_run_url);
		if (owner && owner.toLowerCase() !== ALLOWED_BUILDER_OWNER.toLowerCase()) {
			console.error(`[Webhook] REJECTED: run URL owner is "${owner}", expected "${ALLOWED_BUILDER_OWNER}"`);
			return json({ error: 'Unauthorized source repository' }, { status: 403 });
		}
		console.log(`[Webhook] Source owner verified: ${owner} ✅`);
	}

	console.log(`[Webhook] Job ${job_id} → status: ${builderStatus}`);

	const now = Date.now();

	// ── Build SET clauses ────────────────────────────────────────
	const sets: string[] = ['updated_at = ?'];
	const binds: unknown[] = [now];

	if (VALID_STATUSES.has(builderStatus)) {
		sets.push('status = ?');
		binds.push(builderStatus);
	}

	// Store PR link in the dedicated pr_url column
	if (payload.pr_url) {
		sets.push('pr_url = ?');
		binds.push(payload.pr_url);
	}

	// Store real live preview URL (Vercel/Netlify/etc.) in preview_url
	if (payload.preview_url) {
		sets.push('preview_url = ?');
		binds.push(payload.preview_url);
	}

	if (payload.github_run_id) {
		sets.push('github_run_id = ?');
		binds.push(String(payload.github_run_id));
	}
	if (payload.github_run_url) {
		sets.push('github_run_url = ?');
		binds.push(payload.github_run_url);
	}

	if (payload.message && builderStatus === 'failed') {
		sets.push('error_message = ?');
		binds.push(payload.message);
	}

	// ── Update DB ────────────────────────────────────────────────
	binds.push(job_id);
	const sql = `UPDATE retool_jobs SET ${sets.join(', ')} WHERE id = ?`;
	console.log(`[Webhook] SQL: ${sql}`);
	console.log(`[Webhook] Binds count: ${binds.length}`);

	try {
		await db.prepare(sql).bind(...binds).run();
	} catch (dbErr) {
		console.error(`[Webhook] DB update FAILED for job ${job_id}:`, dbErr);
		return json({ error: 'Database update failed', detail: String(dbErr) }, { status: 500 });
	}

	console.log(`[Webhook] DB updated for job ${job_id}`);
	return json({ ok: true });
};

