/**
 * POST /api/jobs/[id]/refine
 *
 * Creates a new child retool job with an updated prompt,
 * linked to the parent job via parent_job_id.
 */
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { parseGitHubUrl } from '$lib/types/retool';

const PEGASUS_REPO_OWNER = 'Nexartis';
const PEGASUS_REPO_NAME = 'pegasus-horizon-breakthrough';
const PEGASUS_WORKFLOW_FILE = 'deploy-worker.yml';
const DEPLOYMENT_SCHEMA_VERSION = 8;

export const POST: RequestHandler = async ({ params, request, platform }) => {
	const env = platform?.env;
	if (!env?.DB) throw error(503, 'Database not available');

	const parentId = params.id;
	const parentRow = await env.DB.prepare(`SELECT * FROM retool_jobs WHERE id = ?`).bind(parentId).first<Record<string, unknown>>();
	if (!parentRow) throw error(404, 'Parent job not found');

	const body = await request.json();
	const { prompt } = body;
	if (!prompt || typeof prompt !== 'string') throw error(400, 'prompt is required');

	// ── Create child job ─────────────────────────────────────────
	const jobId = crypto.randomUUID().replace(/-/g, '').slice(0, 21);
	const deploymentId = `rt_${jobId}`;
	const now = Date.now();
	const refinementCount = ((parentRow.refinement_count as number) || 0) + 1;

	await env.DB.prepare(
		`INSERT INTO retool_jobs (id, user_id, github_owner, github_repo, branch, prompt, status, deployment_id, parent_job_id, refinement_count, created_at, updated_at)
		 VALUES (?, ?, ?, ?, ?, ?, 'queued', ?, ?, ?, ?, ?)`
	).bind(
		jobId,
		parentRow.user_id,
		parentRow.github_owner,
		parentRow.github_repo,
		parentRow.branch,
		prompt,
		deploymentId,
		parentId,
		refinementCount,
		now,
		now
	).run();

	// ── Build deployment payload ─────────────────────────────────
	const domain = `${parentRow.github_repo}-${jobId.slice(0, 8)}`;
	const deploymentPayload = {
		deployment_id: deploymentId,
		dispatch_namespace: 'retools-dispatch-namespace',
		domain: `${domain}.cubicubes.ai`,
		is_real_domain: false,
		cubicube_id: null,
		base_type: null,
		base_ref: null,
		user_email: 'retools@nexartis.com',
		user_name: 'Retools',
		template_repo: {
			owner: parentRow.github_owner,
			name: parentRow.github_repo,
			ref: parentRow.branch
		},
		addon_cubes: [],
		custom_cube_bundle: null,
		ai_prompt: prompt,
		ai_mode: 'pegasus_hb',
		schema_version: DEPLOYMENT_SCHEMA_VERSION,
		timestamp: new Date().toISOString()
	};

	// ── Dispatch ─────────────────────────────────────────────────
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
				branch_name: `retools-${domain}`,
				environment: 'pegasus-horizon-breakthrough',
				webhook_url: `${baseUrl}/api/webhooks/pegasus`,
				deployment_payload: JSON.stringify(deploymentPayload),
				max_repair_attempts: '3'
			}
		})
	});

	if (!res.ok) {
		const errText = await res.text();
		console.error('Refine dispatch failed:', res.status, errText);
		await env.DB.prepare(
			`UPDATE retool_jobs SET status = 'failed', error_message = ?, updated_at = ? WHERE id = ?`
		).bind(`Dispatch failed: ${res.status}`, Date.now(), jobId).run();
		throw error(502, 'Failed to dispatch refinement build');
	}

	// ── Update parent as superseded ──────────────────────────────
	await env.DB.prepare(
		`UPDATE retool_jobs SET updated_at = ? WHERE id = ?`
	).bind(now, parentId).run();

	return json({ id: jobId, parentId, deploymentId, status: 'queued', refinementCount }, { status: 201 });
};

