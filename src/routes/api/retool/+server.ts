/**
 * POST /api/retool
 *
 * Accepts a GitHub repo URL + prompt, creates a retool job,
 * and enqueues a RetoolsDeploymentMessage v1 to the Retools builder queue.
 * The queue triggers the Retools Builder Engine via HTTP.
 */
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { parseGitHubUrl } from '$lib/types/retool';
import { RETOOLS_SCHEMA_VERSION, type RetoolsDeploymentMessage } from '$lib/types/deployment-contract';
import { getDB } from '$lib/server/db';
import { sendToQueue } from '$lib/server/queue';

export const POST: RequestHandler = async ({ request }) => {
	const db = getDB();

	const body = await request.json();
	const { repoUrl, branch, prompt, github_token: githubToken } = body;

	// ── Validate inputs ──────────────────────────────────────────
	if (!repoUrl || typeof repoUrl !== 'string') throw error(400, 'repoUrl is required');
	if (!prompt || typeof prompt !== 'string') throw error(400, 'prompt is required');
	if (!githubToken || typeof githubToken !== 'string') throw error(400, 'github_token is required');

	const parsed = parseGitHubUrl(repoUrl);
	if (!parsed) throw error(400, 'Invalid GitHub URL. Expected: https://github.com/owner/repo');

	// ── Validate GitHub token has repo access + detect default branch ─
	let resolvedBranch = typeof branch === 'string' && branch ? branch : '';
	try {
		const repoCheck = await fetch(
			`https://api.github.com/repos/${parsed.owner}/${parsed.repo}`,
			{
				headers: {
					Authorization: `token ${githubToken}`,
					Accept: 'application/vnd.github.v3+json',
					'User-Agent': 'Noelle-API'
				}
			}
		);
		if (repoCheck.status === 401) throw error(401, 'Invalid GitHub token');
		if (repoCheck.status === 403) throw error(403, 'GitHub token lacks repo access');
		if (repoCheck.status === 404) throw error(404, 'Repository not found or token lacks access');
		if (!repoCheck.ok) throw error(502, `GitHub API error: ${repoCheck.status}`);

		// Auto-detect default branch when the caller didn't specify one
		if (!resolvedBranch) {
			const repoData = await repoCheck.json();
			resolvedBranch = repoData.default_branch || 'main';
		}
	} catch (e: unknown) {
		// Re-throw SvelteKit errors (from our throw error() calls above)
		if (e && typeof e === 'object' && 'status' in e) throw e;
		throw error(502, 'Failed to validate GitHub token');
	}

	// Final fallback (should never happen, but safety net)
	if (!resolvedBranch) resolvedBranch = 'main';

	// ── Generate IDs ─────────────────────────────────────────────
	const jobId = `job-${crypto.randomUUID()}`;
	const now = Date.now();

	// ── Insert job into DB ───────────────────────────────────────
	await db.prepare(
		`INSERT INTO retool_jobs (id, user_id, github_owner, github_repo, branch, prompt, status, created_at, updated_at)
		 VALUES (?, ?, ?, ?, ?, ?, 'queued', ?, ?)`
	)
		.bind(jobId, 'anonymous', parsed.owner, parsed.repo, resolvedBranch, prompt, now, now)
		.run();

	// ── Build RetoolsDeploymentMessage v1 for builder queue ──────
	const deploymentMessage: RetoolsDeploymentMessage = {
		schema_version: RETOOLS_SCHEMA_VERSION,
		job_id: jobId,
		timestamp: new Date().toISOString(),
		repo_url: repoUrl,
		branch: resolvedBranch,
		github_token: githubToken,
		prompt: prompt,
		user_email: 'noelle@nexartis.com',
		user_name: 'Noelle AI'
	};

	// ── Send to builder queue ────────────────────────────────────
	try {
		await sendToQueue(deploymentMessage);
	} catch (e) {
		console.error('Queue send error:', e);
		await db.prepare(
			`UPDATE retool_jobs SET status = 'failed', error_message = ?, updated_at = ? WHERE id = ?`
		)
			.bind(`Queue error: ${String(e)}`, Date.now(), jobId)
			.run();
		throw error(500, 'Failed to enqueue deployment');
	}

	return json({ id: jobId, status: 'queued' }, { status: 201 });
};

