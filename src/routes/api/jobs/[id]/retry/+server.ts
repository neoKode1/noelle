/**
 * POST /api/jobs/[id]/retry
 *
 * Re-queues a failed job using its original prompt and repo settings.
 * Creates a new top-level job (not a refinement chain child).
 * Requires a GitHub token because the builder queue needs repository access.
 */
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { RETOOLS_SCHEMA_VERSION, type RetoolsDeploymentMessage } from '$lib/types/deployment-contract';
import { getDB } from '$lib/server/db';
import { sendToQueue } from '$lib/server/queue';

export const POST: RequestHandler = async ({ params, request }) => {
	const db = getDB();

	const failedId = params.id;
	const failedRow = await db
		.prepare(`SELECT * FROM retool_jobs WHERE id = ?`)
		.bind(failedId)
		.first<Record<string, unknown>>();

	if (!failedRow) throw error(404, 'Job not found');
	if (failedRow.status !== 'failed') throw error(400, 'Only failed jobs can be retried');

	const body = await request.json();
	const { github_token: githubToken } = body;
	if (!githubToken || typeof githubToken !== 'string') throw error(400, 'github_token is required');

	// ── Create new job ───────────────────────────────────────────
	const jobId = `job-${crypto.randomUUID()}`;
	const now = Date.now();

	await db.prepare(
		`INSERT INTO retool_jobs (id, user_id, github_owner, github_repo, branch, prompt, status, refinement_count, created_at, updated_at)
		 VALUES (?, ?, ?, ?, ?, ?, 'queued', 0, ?, ?)`
	).bind(
		jobId,
		failedRow.user_id,
		failedRow.github_owner,
		failedRow.github_repo,
		failedRow.branch,
		failedRow.prompt,
		now,
		now
	).run();

	// ── Build RetoolsDeploymentMessage v1 ───────────────────────
	const repoUrl = `https://github.com/${failedRow.github_owner}/${failedRow.github_repo}`;
	const deploymentMessage: RetoolsDeploymentMessage = {
		schema_version: RETOOLS_SCHEMA_VERSION,
		job_id: jobId,
		timestamp: new Date().toISOString(),
		repo_url: repoUrl,
		branch: failedRow.branch as string,
		github_token: githubToken,
		prompt: failedRow.prompt as string,
		user_email: 'noelle@nexartis.com',
		user_name: 'Noelle AI'
	};

	// ── Send to builder queue ────────────────────────────────────
	try {
		await sendToQueue(deploymentMessage);
	} catch (e) {
		console.error('Retry queue error:', e);
		await db.prepare(
			`UPDATE retool_jobs SET status = 'failed', error_message = ?, updated_at = ? WHERE id = ?`
		).bind(`Queue error: ${String(e)}`, Date.now(), jobId).run();
		throw error(500, 'Failed to enqueue retry');
	}

	return json({ id: jobId, status: 'queued', retriedFrom: failedId }, { status: 201 });
};

