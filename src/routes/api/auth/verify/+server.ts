/**
 * GET /api/auth/verify?token=XXX
 *
 * Verifies a magic-link token → sets noelle_session JWT cookie → redirects to /retool.
 */
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { verifyMagicToken, getOrCreateUser, signJwt } from '$lib/server/auth';

const COOKIE_NAME = 'noelle_session';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

export const GET: RequestHandler = async ({ url, cookies }) => {
	const token = url.searchParams.get('token') ?? '';

	if (!token) {
		redirect(302, '/auth?error=missing_token');
	}

	const email = await verifyMagicToken(token);
	if (!email) {
		redirect(302, '/auth?error=invalid_or_expired');
	}

	const user = await getOrCreateUser(email);
	const jwt = signJwt({ sub: user.id, email: user.email, plan: user.plan });

	cookies.set(COOKIE_NAME, jwt, {
		httpOnly: true,
		secure: true,
		sameSite: 'lax',
		maxAge: COOKIE_MAX_AGE,
		path: '/'
	});

	redirect(302, '/retool');
};

