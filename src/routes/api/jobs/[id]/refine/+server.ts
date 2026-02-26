/**
 * POST /api/jobs/[id]/refine
 *
 * Creates a new child retool job with an updated prompt,
 * linked to the parent job via parent_job_id.
 * Enqueues a RetoolsDeploymentMessage v1 to the builder queue.
 */
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { RETOOLS_SCHEMA_VERSION, type RetoolsDeploymentMessage } from '$lib/types/deployment-contract';
import { getDB } from '$lib/server/db';
import { sendToQueue } from '$lib/server/queue';

export const POST: RequestHandler = async ({ params, request }) => {
	const db = getDB();

	const parentId = params.id;
	const parentRow = await db.prepare(`SELECT * FROM retool_jobs WHERE id = ?`).bind(parentId).first<Record<string, unknown>>();
	if (!parentRow) throw error(404, 'Parent job not found');

	const body = await request.json();
	const { prompt, github_token: githubToken } = body;
	if (!prompt || typeof prompt !== 'string') throw error(400, 'prompt is required');
	if (!githubToken || typeof githubToken !== 'string') throw error(400, 'github_token is required for refinements');

	// ── Create child job ─────────────────────────────────────────
	const jobId = `job-${crypto.randomUUID()}`;
	const now = Date.now();
	const refinementCount = ((parentRow.refinement_count as number) || 0) + 1;

	await db.prepare(
		`INSERT INTO retool_jobs (id, user_id, github_owner, github_repo, branch, prompt, status, parent_job_id, refinement_count, created_at, updated_at)
		 VALUES (?, ?, ?, ?, ?, ?, 'queued', ?, ?, ?, ?)`
	).bind(
		jobId,
		parentRow.user_id,
		parentRow.github_owner,
		parentRow.github_repo,
		parentRow.branch,
		prompt,
		parentId,
		refinementCount,
		now,
		now
	).run();

	// ── Build RetoolsDeploymentMessage v1 ────────────────────────
	const repoUrl = `https://github.com/${parentRow.github_owner}/${parentRow.github_repo}`;
	const deploymentMessage: RetoolsDeploymentMessage = {
		schema_version: RETOOLS_SCHEMA_VERSION,
		job_id: jobId,
		timestamp: new Date().toISOString(),
		repo_url: repoUrl,
		branch: parentRow.branch as string,
		github_token: githubToken,
		prompt: prompt,
		user_email: 'retools@nexartis.com',
		user_name: 'Retools AI'
	};

	// ── Send to builder queue ────────────────────────────────────
	try {
		await sendToQueue(deploymentMessage);
	} catch (e) {
		console.error('Refine queue error:', e);
		await db.prepare(
			`UPDATE retool_jobs SET status = 'failed', error_message = ?, updated_at = ? WHERE id = ?`
		).bind(`Queue error: ${String(e)}`, Date.now(), jobId).run();
		throw error(500, 'Failed to enqueue refinement');
	}

	// ── Update parent as superseded ──────────────────────────────
	await db.prepare(
		`UPDATE retool_jobs SET updated_at = ? WHERE id = ?`
	).bind(now, parentId).run();

	return json({ id: jobId, parentId, status: 'queued', refinementCount }, { status: 201 });
};

