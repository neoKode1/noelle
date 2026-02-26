/**
 * Database client — Cloudflare D1 HTTP API
 *
 * Keeps using your existing Cloudflare D1 database from Vercel via the
 * Cloudflare REST API. No data migration, no new service.
 *
 * Mirrors the D1 interface used throughout the app:
 *   .prepare(sql).bind(...args).first<T>()
 *   .prepare(sql).bind(...args).all<T>()   → { results: T[] }
 *   .prepare(sql).bind(...args).run()
 *
 * Required environment variables (see .env.local):
 *   CLOUDFLARE_ACCOUNT_ID    — your CF account ID
 *   CLOUDFLARE_D1_DATABASE_ID — the D1 database ID
 *   CLOUDFLARE_API_TOKEN     — CF API token with D1 Edit permission
 */

interface D1HttpResult<T> {
	results: T[];
	success: boolean;
	meta: Record<string, unknown>;
}

interface D1HttpResponse<T> {
	result: D1HttpResult<T>[];
	success: boolean;
	errors: { code: number; message: string }[];
}

async function queryD1<T = Record<string, unknown>>(
	sql: string,
	params: unknown[]
): Promise<D1HttpResult<T>> {
	const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
	const databaseId = process.env.CLOUDFLARE_D1_DATABASE_ID;
	const apiToken = process.env.CLOUDFLARE_API_TOKEN;

	if (!accountId) throw new Error('CLOUDFLARE_ACCOUNT_ID is not set');
	if (!databaseId) throw new Error('CLOUDFLARE_D1_DATABASE_ID is not set');
	if (!apiToken) throw new Error('CLOUDFLARE_API_TOKEN is not set');

	const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`;

	const res = await fetch(url, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${apiToken}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ sql, params })
	});

	const body = (await res.json()) as D1HttpResponse<T>;

	if (!res.ok || !body.success) {
		const msg = body.errors?.map((e) => e.message).join(', ') ?? res.statusText;
		throw new Error(`D1 query failed: ${msg}`);
	}

	return body.result[0];
}

interface BoundStatement {
	first<T = Record<string, unknown>>(): Promise<T | null>;
	all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
	run(): Promise<void>;
}

interface PreparedStatement {
	bind(...args: unknown[]): BoundStatement;
}

function prepare(sql: string): PreparedStatement {
	return {
		bind(...args: unknown[]): BoundStatement {
			return {
				async first<T = Record<string, unknown>>(): Promise<T | null> {
					const result = await queryD1<T>(sql, args);
					return result.results[0] ?? null;
				},
				async all<T = Record<string, unknown>>(): Promise<{ results: T[] }> {
					const result = await queryD1<T>(sql, args);
					return { results: result.results };
				},
				async run(): Promise<void> {
					await queryD1(sql, args);
				}
			};
		}
	};
}

export function getDB() {
	return { prepare };
}

