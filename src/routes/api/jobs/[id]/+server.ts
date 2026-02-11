/**
 * GET /api/jobs/[id]
 *
 * Returns the full retool job record by ID.
 */
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, platform }) => {
	const env = platform?.env;
	if (!env?.DB) throw error(503, 'Database not available');

	const { id } = params;
	if (!id) throw error(400, 'Job ID required');

	const row = await env.DB.prepare(
		`SELECT * FROM retool_jobs WHERE id = ?`
	)
		.bind(id)
		.first();

	if (!row) throw error(404, 'Job not found');

	// Map snake_case DB columns to camelCase for the frontend
	const r = row as Record<string, unknown>;
	return json({
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
	});
};

