/**
 * GET /api/auth/me
 * Returns the current authenticated user or 401.
 */
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
	const user = locals.user;
	if (!user) {
		return json({ error: 'not_authenticated' }, { status: 401 });
	}
	return json({ id: user.id, email: user.email, plan: user.plan });
};

