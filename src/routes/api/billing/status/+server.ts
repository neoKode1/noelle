/**
 * GET /api/billing/status
 * Returns current plan, usage count, and limit info for the authenticated user.
 */
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDB } from '$lib/server/db';

const FREE_LIMIT = 5;

export const GET: RequestHandler = async ({ locals }) => {
	const user = locals.user;
	if (!user) return json({ error: 'not_authenticated' }, { status: 401 });

	const db = getDB();
	const row = await db
		.prepare(`SELECT usage_count, plan FROM users WHERE id = ?`)
		.bind(user.id)
		.first<{ usage_count: number; plan: string }>();

	const usageCount = row?.usage_count ?? 0;
	const plan = row?.plan ?? 'free';

	const adminEmails = (process.env.ADMIN_EMAILS ?? '')
		.split(',')
		.map((e) => e.trim().toLowerCase())
		.filter(Boolean);
	const isAdmin = adminEmails.includes(user.email.toLowerCase());

	return json({
		plan,
		usageCount,
		freeLimit: FREE_LIMIT,
		isAdmin,
		needsUpgrade: !isAdmin && plan === 'free' && usageCount >= FREE_LIMIT,
		remaining: isAdmin || plan !== 'free' ? null : Math.max(0, FREE_LIMIT - usageCount)
	});
};

