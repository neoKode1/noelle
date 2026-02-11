/**
 * POST /api/jobs/[id]/approve
 *
 * Promotes a preview_ready job to production by dispatching
 * a new Pegasus workflow with is_real_domain: true.
 */
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const PEGASUS_REPO_OWNER = 'Nexartis';
const PEGASUS_REPO_NAME = 'pegasus-horizon-breakthrough';
const PEGASUS_WORKFLOW_FILE = 'deploy-worker.yml';
const DEPLOYMENT_SCHEMA_VERSION = 8;

export const POST: RequestHandler = async ({ params, request, platform }) => {
	const env = platform?.env;
	if (!env?.DB) throw error(503, 'Database not available');

	const { id } = params;
	const row = await env.DB.prepare(`SELECT * FROM retool_jobs WHERE id = ?`).bind(id).first<Record<string, unknown>>();
	if (!row) throw error(404, 'Job not found');
	if (row.status !== 'preview_ready') {
		throw error(409, `Job is "${row.status}", not "preview_ready". Cannot approve.`);
	}

	// ── Parse optional production domain from request body ────────
	let body: { domain?: string } = {};
	try { body = await request.json(); } catch { /* empty body OK */ }

	const prodDomain = body.domain || (row.production_url as string) || `${row.github_repo}-${(row.id as string).slice(0, 8)}.cubicubes.ai`;
	const isRealDomain = !!body.domain; // Only real if user supplied a domain
	const now = Date.now();

	// ── Mark as approved ─────────────────────────────────────────
	await env.DB.prepare(
		`UPDATE retool_jobs SET status = 'approved', production_url = ?, updated_at = ? WHERE id = ?`
	).bind(prodDomain, now, id).run();

	// ── Build production payload ─────────────────────────────────
	const deploymentPayload = {
		deployment_id: row.deployment_id,
		dispatch_namespace: 'retools-dispatch-namespace',
		domain: prodDomain,
		is_real_domain: isRealDomain,
		cubicube_id: null,
		base_type: null,
		base_ref: null,
		user_email: 'retools@nexartis.com',
		user_name: 'Retools',
		template_repo: {
			owner: row.github_owner,
			name: row.github_repo,
			ref: row.branch
		},
		addon_cubes: [],
		custom_cube_bundle: null,
		ai_prompt: row.prompt,
		ai_mode: 'pegasus_hb',
		schema_version: DEPLOYMENT_SCHEMA_VERSION,
		timestamp: new Date().toISOString()
	};

	// ── Dispatch production deploy ───────────────────────────────
	const githubPat = await env.GITHUB_PAT.get();
	const baseUrl = env.VITE_BASE_URL || 'https://retools.dev';
	const dispatchUrl = `https://api.github.com/repos/${PEGASUS_REPO_OWNER}/${PEGASUS_REPO_NAME}/actions/workflows/${PEGASUS_WORKFLOW_FILE}/dispatches`;

	const res = await fetch(dispatchUrl, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${githubPat}`,
			Accept: 'application/vnd.github.v3+json',
			'Content-Type': 'application/json',
			'User-Agent': 'Retools/1.0'
		},
		body: JSON.stringify({
			ref: 'main',
			inputs: {
				branch_name: `retools-prod-${(row.id as string).slice(0, 12)}`,
				environment: 'pegasus-horizon-breakthrough',
				webhook_url: `${baseUrl}/api/webhooks/pegasus`,
				deployment_payload: JSON.stringify(deploymentPayload),
				max_repair_attempts: '3'
			}
		})
	});

	if (!res.ok) {
		const errText = await res.text();
		console.error('Approve dispatch failed:', res.status, errText);
		await env.DB.prepare(
			`UPDATE retool_jobs SET status = 'failed', error_message = ?, updated_at = ? WHERE id = ?`
		).bind(`Production dispatch failed: ${res.status}`, Date.now(), id).run();
		throw error(502, 'Failed to dispatch production build');
	}

	return json({ id, status: 'approved', productionUrl: prodDomain });
};

