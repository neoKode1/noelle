/**
 * POST /api/auth/logout
 * Clears the noelle_session cookie.
 */
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ cookies }) => {
	cookies.delete('noelle_session', { path: '/' });
	return json({ ok: true });
};

