/**
 * POST /api/jobs/[id]/refine
 *
 * Creates a new child retool job with an updated prompt,
 * linked to the parent job via parent_job_id.
 * Enqueues a DeploymentMessage v8 to the builder queue.
 */
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const DEPLOYMENT_SCHEMA_VERSION = 8;

export const POST: RequestHandler = async ({ params, request, platform }) => {
	const env = platform?.env;
	if (!env?.DB) throw error(503, 'Database not available');

	const queue = env.BUILDER_QUEUE;
	if (!queue) throw error(503, 'Builder queue not available');

	const parentId = params.id;
	const parentRow = await env.DB.prepare(`SELECT * FROM retool_jobs WHERE id = ?`).bind(parentId).first<Record<string, unknown>>();
	if (!parentRow) throw error(404, 'Parent job not found');

	const body = await request.json();
	const { prompt, github_token: githubToken } = body;
	if (!prompt || typeof prompt !== 'string') throw error(400, 'prompt is required');
	if (!githubToken || typeof githubToken !== 'string') throw error(400, 'github_token is required for refinements');

	// ── Create child job ─────────────────────────────────────────
	const jobId = crypto.randomUUID().replace(/-/g, '').slice(0, 21);
	const deploymentId = `rt_${jobId}`;
	const now = Date.now();
	const refinementCount = ((parentRow.refinement_count as number) || 0) + 1;
	const domain = `${parentRow.github_repo}-${jobId.slice(0, 8)}`;

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

	// ── Build DeploymentMessage v8 ───────────────────────────────
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
		template_repo_owner: parentRow.github_owner as string,
		template_repo_name: parentRow.github_repo as string,
		template_repo_ref: parentRow.branch as string,
		addon_cubes: [],
		custom_cube_repo_url: null,
		ai_prompt: prompt,
		ai_mode: 'pegasus_hb',
		orchestrator_registry_slug: null,
		revert_to_commit: null,
		webhook_url: `${baseUrl}/api/webhooks/pegasus`,
		deploy_mode: 'pr_only',
		github_token: githubToken,
		timestamp: new Date().toISOString()
	};

	// ── Send to builder queue ────────────────────────────────────
	try {
		await queue.send(deploymentMessage);
	} catch (e) {
		console.error('Refine queue error:', e);
		await env.DB.prepare(
			`UPDATE retool_jobs SET status = 'failed', error_message = ?, updated_at = ? WHERE id = ?`
		).bind(`Queue error: ${String(e)}`, Date.now(), jobId).run();
		throw error(500, 'Failed to enqueue refinement');
	}

	// ── Update parent as superseded ──────────────────────────────
	await env.DB.prepare(
		`UPDATE retool_jobs SET updated_at = ? WHERE id = ?`
	).bind(now, parentId).run();

	return json({ id: jobId, parentId, deploymentId, status: 'queued', refinementCount }, { status: 201 });
};

