/**
 * GET /api/jobs
 *
 * Returns a list of retool jobs. Supports ?all=1 to get all jobs
 * or defaults to the anonymous user's jobs.
 */
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, platform }) => {
	const env = platform?.env;
	if (!env?.DB) throw error(503, 'Database not available');

	const all = url.searchParams.get('all');
	let rows;

	if (all) {
		rows = await env.DB.prepare(
			`SELECT * FROM retool_jobs ORDER BY created_at DESC LIMIT 50`
		).all();
	} else {
		rows = await env.DB.prepare(
			`SELECT * FROM retool_jobs WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`
		).bind('anonymous').all();
	}

	// Map snake_case DB columns to camelCase for the frontend
	const jobs = (rows.results || []).map((r: Record<string, unknown>) => ({
		id: r.id,
		userId: r.user_id,
		githubOwner: r.github_owner,
		githubRepo: r.github_repo,
		branch: r.branch,
		prompt: r.prompt,
		status: r.status,
		previewUrl: r.preview_url,
		productionUrl: r.production_url,
		deploymentId: r.deployment_id,
		githubRunId: r.github_run_id,
		githubRunUrl: r.github_run_url,
		aiSummary: r.ai_summary,
		errorMessage: r.error_message,
		parentJobId: r.parent_job_id,
		refinementCount: r.refinement_count,
		createdAt: r.created_at,
		updatedAt: r.updated_at
	}));

	return json(jobs);
};

