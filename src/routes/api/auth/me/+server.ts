/**
 * GET /api/auth/me
 * Returns the current authenticated user or 401.
 * Reads plan fresh from DB so it reflects upgrades without requiring a re-login.
 */
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDB } from '$lib/server/db';

export const GET: RequestHandler = async ({ locals }) => {
	const user = locals.user;
	if (!user) {
		return json({ error: 'not_authenticated' }, { status: 401 });
	}

	// Read plan fresh from DB — JWT plan can lag after a Stripe upgrade
	const db = getDB();
	const row = await db
		.prepare(`SELECT plan FROM users WHERE id = ?`)
		.bind(user.id)
		.first<{ plan: string }>();

	const plan = row?.plan ?? user.plan;

	return json({ id: user.id, email: user.email, plan });
};

