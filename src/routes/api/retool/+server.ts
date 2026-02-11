/**
 * POST /api/retool
 *
 * Accepts a GitHub repo URL + prompt, creates a retool job,
 * and enqueues a DeploymentMessage v8 to the Cubicube builder queue.
 * The queue consumer handles GitHub Actions dispatch with a working PAT.
 */
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { parseGitHubUrl } from '$lib/types/retool';

const DEPLOYMENT_SCHEMA_VERSION = 8;

export const POST: RequestHandler = async ({ request, platform }) => {
	const env = platform?.env;
	if (!env?.DB) throw error(503, 'Database not available');

	const body = await request.json();
	const { repoUrl, branch = 'main', prompt } = body;

	// ── Validate inputs ──────────────────────────────────────────
	if (!repoUrl || typeof repoUrl !== 'string') throw error(400, 'repoUrl is required');
	if (!prompt || typeof prompt !== 'string') throw error(400, 'prompt is required');

	const parsed = parseGitHubUrl(repoUrl);
	if (!parsed) throw error(400, 'Invalid GitHub URL. Expected: https://github.com/owner/repo');

	// ── Check queue availability ─────────────────────────────────
	const queue = env.BUILDER_QUEUE;
	if (!queue) throw error(503, 'Builder queue not available');

	// ── Generate IDs ─────────────────────────────────────────────
	const jobId = crypto.randomUUID().replace(/-/g, '').slice(0, 21);
	const deploymentId = `rt_${jobId}`;
	const now = Date.now();
	const domain = `${parsed.repo}-${jobId.slice(0, 8)}`;

	// ── Insert job into DB ───────────────────────────────────────
	await env.DB.prepare(
		`INSERT INTO retool_jobs (id, user_id, github_owner, github_repo, branch, prompt, status, deployment_id, created_at, updated_at)
		 VALUES (?, ?, ?, ?, ?, ?, 'queued', ?, ?, ?)`
	)
		.bind(jobId, 'anonymous', parsed.owner, parsed.repo, branch, prompt, deploymentId, now, now)
		.run();

	// ── Build DeploymentMessage v8 for builder queue ─────────────
	const baseUrl = env.VITE_BASE_URL || 'https://retools.dev';
	const deploymentMessage = {
		schema_version: DEPLOYMENT_SCHEMA_VERSION,
		deployment_id: deploymentId,
		user_id: 'anonymous',
		user_email: 'retools@nexartis.com',
		user_name: 'Retools',
		domain_id: jobId,
		domain: `${domain}.cubicubes.ai`,
		is_real_domain: false,
		cubicube_id: null,
		base_type: null,
		base_ref: null,
		branch_name: `retools-${domain}`,
		cube_config: {
			domain: `${domain}.cubicubes.ai`,
			userEmail: 'retools@nexartis.com',
			userName: 'Retools',
			customizations: {}
		},
		template_repo_owner: parsed.owner,
		template_repo_name: parsed.repo,
		template_repo_ref: branch,
		addon_cubes: [],
		custom_cube_repo_url: null,
		ai_prompt: prompt,
		ai_mode: 'pegasus_hb',
		orchestrator_registry_slug: null,
		revert_to_commit: null,
		webhook_url: `${baseUrl}/api/webhooks/pegasus`,
		deploy_mode: 'pr_only',
		timestamp: new Date().toISOString()
	};

	// ── Send to builder queue ────────────────────────────────────
	try {
		await queue.send(deploymentMessage);
	} catch (e) {
		console.error('Queue send error:', e);
		await env.DB.prepare(
			`UPDATE retool_jobs SET status = 'failed', error_message = ?, updated_at = ? WHERE id = ?`
		)
			.bind(`Queue error: ${String(e)}`, Date.now(), jobId)
			.run();
		throw error(500, 'Failed to enqueue deployment');
	}

	return json({ id: jobId, deploymentId, status: 'queued' }, { status: 201 });
};

