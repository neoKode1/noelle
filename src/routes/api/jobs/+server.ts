/**
 * GET /api/jobs
 *
 * Returns retool jobs for the authenticated user only.
 * Requires a valid session cookie — returns 401 otherwise.
 */
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { mapJobRow } from '$lib/server/mapJobRow';
import { getDB } from '$lib/server/db';

export const GET: RequestHandler = async ({ locals }) => {
	const user = locals.user;
	if (!user) return json({ error: 'not_authenticated' }, { status: 401 });

	const db = getDB();
	const rows = await db
		.prepare(`SELECT * FROM retool_jobs WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`)
		.bind(user.id)
		.all();

	const jobs = (rows.results || []).map((r: Record<string, unknown>) => mapJobRow(r));

	return json(jobs);
};

