/**
 * POST /api/jobs/[id]/approve
 *
 * Promotes a preview_ready job to production by enqueuing
 * a new DeploymentMessage v8 with is_real_domain: true.
 */
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const DEPLOYMENT_SCHEMA_VERSION = 8;

export const POST: RequestHandler = async ({ params, request, platform }) => {
	const env = platform?.env;
	if (!env?.DB) throw error(503, 'Database not available');

	const queue = env.BUILDER_QUEUE;
	if (!queue) throw error(503, 'Builder queue not available');

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
	const baseUrl = env.VITE_BASE_URL || 'https://retools.dev';

	// ── Mark as approved ─────────────────────────────────────────
	await env.DB.prepare(
		`UPDATE retool_jobs SET status = 'approved', production_url = ?, updated_at = ? WHERE id = ?`
	).bind(prodDomain, now, id).run();

	// ── Build DeploymentMessage v8 for production ────────────────
	const deploymentMessage = {
		schema_version: DEPLOYMENT_SCHEMA_VERSION,
		deployment_id: row.deployment_id as string,
		user_id: 'anonymous',
		user_email: 'retools@nexartis.com',
		user_name: 'Retools',
		domain_id: id,
		domain: prodDomain,
		is_real_domain: isRealDomain,
		cubicube_id: null,
		base_type: null,
		base_ref: null,
		branch_name: `retools-prod-${(row.id as string).slice(0, 12)}`,
		cube_config: {
			domain: prodDomain,
			userEmail: 'retools@nexartis.com',
			userName: 'Retools',
			customizations: {}
		},
		template_repo_owner: row.github_owner as string,
		template_repo_name: row.github_repo as string,
		template_repo_ref: row.branch as string,
		addon_cubes: [],
		custom_cube_repo_url: null,
		ai_prompt: row.prompt as string,
		ai_mode: 'pegasus_hb',
		orchestrator_registry_slug: null,
		revert_to_commit: null,
		webhook_url: `${baseUrl}/api/webhooks/pegasus`,
		timestamp: new Date().toISOString()
	};

	// ── Send to builder queue ────────────────────────────────────
	try {
		await queue.send(deploymentMessage);
	} catch (e) {
		console.error('Approve queue error:', e);
		await env.DB.prepare(
			`UPDATE retool_jobs SET status = 'failed', error_message = ?, updated_at = ? WHERE id = ?`
		).bind(`Queue error: ${String(e)}`, Date.now(), id).run();
		throw error(500, 'Failed to enqueue production deploy');
	}

	return json({ id, status: 'approved', productionUrl: prodDomain });
};

