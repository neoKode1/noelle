/**
 * POST /api/webhooks/pegasus
 *
 * Receives HMAC-signed webhook callbacks from the Pegasus deployment pipeline.
 * Updates the corresponding retool_jobs row with status, preview URL, AI summary, etc.
 */
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/** Map Pegasus webhook statuses → retool_jobs status. */
function mapStatus(pegasusStatus: string): string | null {
	switch (pegasusStatus) {
		case 'phase_update':
			return null; // handled per-phase below
		case 'ai_result':
			return 'customizing';
		case 'repairing':
			return 'customizing'; // still in AI phase
		case 'deployment_live':
			return 'preview_ready';
		case 'completed':
			return 'preview_ready';
		case 'failed':
			return 'failed';
		default:
			return null;
	}
}

/** Map phase_name from Pegasus to our job status. */
function mapPhase(phaseName: string): string | null {
	switch (phaseName) {
		case 'clone':
			return 'cloning';
		case 'install':
			return 'building';
		case 'ai_customize':
			return 'customizing';
		case 'build':
			return 'building';
		case 'deploy':
			return 'deploying';
		case 'verify':
			return 'deploying';
		default:
			return null;
	}
}

/** Verify HMAC-SHA256 signature (same pattern as cubicube-com). */
async function verifySignature(
	request: Request,
	body: string,
	secret: string
): Promise<boolean> {
	const signature = request.headers.get('x-webhook-signature');
	if (!signature) return false;

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
	if (signature.length !== expected.length) return false;
	let mismatch = 0;
	for (let i = 0; i < signature.length; i++) {
		mismatch |= signature.charCodeAt(i) ^ expected.charCodeAt(i);
	}
	return mismatch === 0;
}

export const POST: RequestHandler = async ({ request, platform }) => {
	const env = platform?.env;
	if (!env?.DB) return json({ error: 'DB unavailable' }, { status: 503 });

	// ── Read + verify ────────────────────────────────────────────
	const rawBody = await request.text();
	const webhookSecret = await env.CUBICUBE_BUILDER_QUEUE_WEBHOOK?.get();
	if (!webhookSecret) return json({ error: 'Webhook secret not configured' }, { status: 500 });

	const valid = await verifySignature(request, rawBody, webhookSecret);
	if (!valid) return json({ error: 'Invalid signature' }, { status: 401 });

	// ── Parse payload ────────────────────────────────────────────
	const payload = JSON.parse(rawBody);
	const { deployment_id, status: pegasusStatus } = payload;
	if (!deployment_id || !pegasusStatus) {
		return json({ error: 'Missing deployment_id or status' }, { status: 400 });
	}

	const now = Date.now();

	// ── Determine new job status ─────────────────────────────────
	let newStatus: string | null = null;
	if (pegasusStatus === 'phase_update' && payload.phase_name) {
		newStatus = mapPhase(payload.phase_name);
	} else {
		newStatus = mapStatus(pegasusStatus);
	}

	// ── Build SET clauses ────────────────────────────────────────
	const sets: string[] = ['updated_at = ?'];
	const binds: unknown[] = [now];

	if (newStatus) {
		sets.push('status = ?');
		binds.push(newStatus);
	}
	if (payload.worker_url) {
		sets.push('preview_url = ?');
		binds.push(payload.worker_url);
	}
	if (payload.github_run_id) {
		sets.push('github_run_id = ?');
		binds.push(String(payload.github_run_id));
	}
	if (payload.github_run_url) {
		sets.push('github_run_url = ?');
		binds.push(payload.github_run_url);
	}
	if (payload.ai_summary) {
		sets.push('ai_summary = ?');
		binds.push(payload.ai_summary);
	}
	if (payload.error_message) {
		sets.push('error_message = ?');
		binds.push(payload.error_message);
	}

	// ── Update DB ────────────────────────────────────────────────
	binds.push(deployment_id);
	await env.DB.prepare(
		`UPDATE retool_jobs SET ${sets.join(', ')} WHERE deployment_id = ?`
	)
		.bind(...binds)
		.run();

	return json({ ok: true });
};

