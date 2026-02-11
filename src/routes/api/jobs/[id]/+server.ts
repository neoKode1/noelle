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

	return json(row);
};

