/**
 * POST /api/webhooks/pegasus
 *
 * Receives HMAC-signed webhook callbacks from the Pegasus Retools Engine.
 * Only accepts callbacks originating from the neoKode1 GitHub account.
 * Updates the corresponding retool_jobs row with status, PR URL, GitHub run details, etc.
 */
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/** Only webhooks originating from this GitHub account are accepted. */
const ALLOWED_PEGASUS_OWNER = 'neoKode1';

/**
 * Valid pipeline statuses sent by pegasus-retools-engine workflow.
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

export const POST: RequestHandler = async ({ request, platform }) => {
	const env = platform?.env;
	if (!env?.DB) return json({ error: 'DB unavailable' }, { status: 503 });

	// ── Read + verify ────────────────────────────────────────────
	const rawBody = await request.text();
	const receivedSig = request.headers.get('x-webhook-signature') ?? '';

	// Resolve the secret from Cloudflare Secrets Store (requires .get() call)
	let webhookSecret: string;
	try {
		webhookSecret = (await env.RETOOLS_WEBHOOK_SECRET.get()).trim();
	} catch (err) {
		console.error('[Webhook] Failed to resolve RETOOLS_WEBHOOK_SECRET:', err);
		return json({ error: 'Webhook secret not configured' }, { status: 500 });
	}

	if (!webhookSecret) return json({ error: 'Webhook secret not configured' }, { status: 500 });

	console.log('[Webhook] Secret type:', typeof webhookSecret);
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
	const { job_id, status: pegasusStatus } = payload;
	if (!job_id || !pegasusStatus) {
		return json({ error: 'Missing job_id or status' }, { status: 400 });
	}

	// ── Source isolation: neoKode1 repos only ────────────────────
	// Reject any callback whose github_run_url is not from the allowed owner.
	// This ensures Nexartis workflows (pegasus-hb2-retools, pegasus-horizon-breakthrough)
	// can never update Retools job records, even if they somehow possess the secret.
	if (payload.github_run_url) {
		const owner = extractGitHubOwner(payload.github_run_url);
		if (owner && owner.toLowerCase() !== ALLOWED_PEGASUS_OWNER.toLowerCase()) {
			console.error(`[Webhook] REJECTED: run URL owner is "${owner}", expected "${ALLOWED_PEGASUS_OWNER}"`);
			return json({ error: 'Unauthorized source repository' }, { status: 403 });
		}
		console.log(`[Webhook] Source owner verified: ${owner} ✅`);
	}

	console.log(`[Webhook] Job ${job_id} → status: ${pegasusStatus}`);

	const now = Date.now();

	// ── Build SET clauses ────────────────────────────────────────
	const sets: string[] = ['updated_at = ?'];
	const binds: unknown[] = [now];

	// Update status if it's a valid pipeline status
	if (VALID_STATUSES.has(pegasusStatus)) {
		sets.push('status = ?');
		binds.push(pegasusStatus);
	}

	// PR URL (when preview_ready)
	if (payload.pr_url) {
		sets.push('preview_url = ?');
		binds.push(payload.pr_url);
	}

	// GitHub run details
	if (payload.github_run_id) {
		sets.push('github_run_id = ?');
		binds.push(String(payload.github_run_id));
	}
	if (payload.github_run_url) {
		sets.push('github_run_url = ?');
		binds.push(payload.github_run_url);
	}

	// Error message (when failed)
	if (payload.message && pegasusStatus === 'failed') {
		sets.push('error_message = ?');
		binds.push(payload.message);
	}

	// Mark as completed when PR is ready or deploying is done
	if (pegasusStatus === 'preview_ready') {
		sets.push('completed_at = ?');
		binds.push(now);
	}

	// ── Update DB ────────────────────────────────────────────────
	binds.push(job_id);
	await env.DB.prepare(
		`UPDATE retool_jobs SET ${sets.join(', ')} WHERE id = ?`
	)
		.bind(...binds)
		.run();

	console.log(`[Webhook] DB updated for job ${job_id}`);
	return json({ ok: true });
};

