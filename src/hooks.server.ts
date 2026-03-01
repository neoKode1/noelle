/**
 * SvelteKit server hooks.
 *
 * 1. Startup: ensure `magic_link_tokens` table exists in D1.
 * 2. Per-request: read `noelle_session` JWT cookie → populate event.locals.user.
 */
import type { Handle } from '@sveltejs/kit';
import { getDB } from '$lib/server/db';
import { verifyJwt } from '$lib/server/auth';

// ── Startup migration ────────────────────────────────────────────────────────

let migrationDone = false;

async function ensureMagicLinkTokensTable(): Promise<void> {
	if (migrationDone) return;
	try {
		const db = getDB();
		await db
			.prepare(
				`CREATE TABLE IF NOT EXISTS magic_link_tokens (
					token      TEXT    PRIMARY KEY,
					email      TEXT    NOT NULL,
					used       INTEGER NOT NULL DEFAULT 0,
					expires_at INTEGER NOT NULL,
					created_at INTEGER NOT NULL
				)`
			)
			.bind()
			.run();
		migrationDone = true;
	} catch (e) {
		// Non-fatal — table may already exist or CF env vars not set in dev
		console.warn('[hooks] magic_link_tokens migration skipped:', e);
	}
}

// ── Handle ───────────────────────────────────────────────────────────────────

export const handle: Handle = async ({ event, resolve }) => {
	// Run migration once (no-op after first success)
	await ensureMagicLinkTokensTable();

	// Populate event.locals.user from session cookie
	const sessionCookie = event.cookies.get('noelle_session');
	if (sessionCookie) {
		const payload = verifyJwt(sessionCookie);
		if (payload) {
			event.locals.user = {
				id: payload.sub,
				email: payload.email,
				plan: payload.plan
			};
		} else {
			event.locals.user = null;
		}
	} else {
		event.locals.user = null;
	}

	return resolve(event);
};

