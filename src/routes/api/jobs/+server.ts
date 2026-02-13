/**
 * GET /api/jobs
 *
 * Returns a list of retool jobs. Supports ?all=1 to get all jobs
 * or defaults to the anonymous user's jobs.
 */
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { mapJobRow } from '$lib/server/mapJobRow';

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

	const jobs = (rows.results || []).map((r: Record<string, unknown>) => mapJobRow(r));

	return json(jobs);
};

