/**
 * GET /api/jobs/[id]
 *
 * Returns the full retool job record by ID.
 * For jobs in `preview_ready` status, automatically checks the GitHub API to
 * detect if the PR has been merged and auto-transitions to `deployed`.
 */
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { mapJobRow } from '$lib/server/mapJobRow';
import { getDB } from '$lib/server/db';

export const GET: RequestHandler = async ({ params }) => {
	const db = getDB();
	const { id } = params;
	if (!id) throw error(400, 'Job ID required');

	const row = await db.prepare(
		`SELECT * FROM retool_jobs WHERE id = ?`
	)
		.bind(id)
		.first();

	if (!row) throw error(404, 'Job not found');

	const job = mapJobRow(row as Record<string, unknown>);

	// Auto-detect PR merge for preview_ready jobs.
	// Queries the GitHub public API — works for public repos without auth.
	// Silently skips for private repos, rate-limit errors, or parse failures.
	if (job.status === 'preview_ready' && job.prUrl) {
		try {
			const merged = await checkIfPrMerged(job.prUrl as string);
			if (merged) {
				await db
					.prepare(`UPDATE retool_jobs SET status = 'deployed', updated_at = ? WHERE id = ?`)
					.bind(Date.now(), id)
					.run();
				job.status = 'deployed';
			}
		} catch {
			// Silently ignore — private repo, network error, or rate limit
		}
	}

	return json(job);
};

/**
 * Check if a GitHub PR has been merged via the public GitHub REST API.
 * Parses owner/repo/pr_number from the PR URL (e.g. https://github.com/owner/repo/pull/42).
 * Returns false for private repos or on any error so callers can handle gracefully.
 */
async function checkIfPrMerged(prUrl: string): Promise<boolean> {
	const match = prUrl.match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
	if (!match) return false;
	const [, owner, repo, prNumber] = match;

	const res = await fetch(
		`https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`,
		{
			headers: {
				Accept: 'application/vnd.github+json',
				'User-Agent': 'Noelle-App/1.0',
				'X-GitHub-Api-Version': '2022-11-28'
			}
		}
	);

	if (!res.ok) return false; // 404 = private/missing, 403 = rate limited
	const data = await res.json() as { merged: boolean };
	return data.merged === true;
}

