/**
 * GET /api/jobs/cleanup-stale
 *
 * Vercel Cron endpoint — runs every 10 minutes.
 * Marks any job stuck in a non-terminal status for more than 30 minutes as
 * "failed" so the dashboard never shows perpetually-spinning gear chains.
 *
 * Non-terminal statuses: queued | cloning | customizing | building | deploying
 *
 * Schedule: "* /10 * * * *" (every 10 minutes) — set in vercel.json
 */
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDB } from '$lib/server/db';

/** How long (ms) a job can sit in a non-terminal status before it's declared stale. */
const STALE_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes

/** Non-terminal statuses that can go stale. */
const STALE_STATUSES = ['queued', 'cloning', 'customizing', 'building', 'deploying'];

export const GET: RequestHandler = async ({ request }) => {
	// Verify Vercel cron secret when configured (CRON_SECRET env var).
	// Vercel automatically sends "Authorization: Bearer <secret>" on cron invocations.
	const cronSecret = process.env.CRON_SECRET;
	if (cronSecret) {
		const authHeader = request.headers.get('authorization') ?? '';
		if (authHeader !== `Bearer ${cronSecret}`) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}
	}

	const db = getDB();
	const cutoff = Date.now() - STALE_THRESHOLD_MS;

	// Build a parameterised IN clause: (?, ?, ?, ?, ?)
	const placeholders = STALE_STATUSES.map(() => '?').join(', ');

	// Find all stale jobs
	const staleRows = await db
		.prepare(
			`SELECT id, status, updated_at
             FROM retool_jobs
             WHERE status IN (${placeholders})
               AND updated_at < ?
             ORDER BY updated_at ASC
             LIMIT 100`
		)
		.bind(...STALE_STATUSES, cutoff)
		.all();

	const staleJobs = staleRows.results ?? [];

	if (staleJobs.length === 0) {
		return json({ cleaned: 0, message: 'No stale jobs found.' });
	}

	// Mark each one as failed
	const now = Date.now();
	const ids: string[] = [];

	for (const row of staleJobs) {
		const id = row.id as string;
		await db
			.prepare(
				`UPDATE retool_jobs
                 SET status        = 'failed',
                     error_message = ?,
                     updated_at    = ?
                 WHERE id = ?`
			)
			.bind(
				`Job timed out — the workflow failed without sending a status update. ` +
				`Original status: ${row.status}`,
				now,
				id
			)
			.run();
		ids.push(id);
	}

	console.log(`[cleanup-stale] Marked ${ids.length} jobs as failed:`, ids);

	return json({
		cleaned: ids.length,
		ids,
		message: `Marked ${ids.length} stale job(s) as failed.`
	});
};

