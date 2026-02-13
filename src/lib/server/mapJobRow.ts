/**
 * Maps a snake_case D1 row to a camelCase job object for the frontend.
 * Shared by GET /api/jobs and GET /api/jobs/[id].
 */
export function mapJobRow(r: Record<string, unknown>) {
	return {
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
	};
}

