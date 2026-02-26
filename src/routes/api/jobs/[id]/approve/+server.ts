/**
 * POST /api/jobs/[id]/approve
 *
 * Marks a job as approved, signalling the builder engine to promote
 * the preview branch to production.
 */
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDB } from '$lib/server/db';
import { mapJobRow } from '$lib/server/mapJobRow';

export const POST: RequestHandler = async ({ params }) => {
	const db = getDB();
	const { id } = params;
	if (!id) throw error(400, 'Job ID required');

	// Verify the job exists and is in an approvable state
	const row = await db
		.prepare(`SELECT * FROM retool_jobs WHERE id = ?`)
		.bind(id)
		.first<Record<string, unknown>>();

	if (!row) throw error(404, 'Job not found');

	const approvableStatuses = ['preview_ready'];
	if (!approvableStatuses.includes(row.status as string)) {
		throw error(400, `Job cannot be approved in status: ${row.status}`);
	}

	const now = Date.now();
	await db
		.prepare(`UPDATE retool_jobs SET status = 'approved', updated_at = ? WHERE id = ?`)
		.bind(now, id)
		.run();

	const updated = await db
		.prepare(`SELECT * FROM retool_jobs WHERE id = ?`)
		.bind(id)
		.first<Record<string, unknown>>();

	return json(mapJobRow(updated as Record<string, unknown>));
};

