/**
 * GET /api/jobs/[id]
 *
 * Returns the full retool job record by ID.
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

	return json(mapJobRow(row as Record<string, unknown>));
};

