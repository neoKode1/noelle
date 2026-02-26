/**
 * Database client — Vercel / Turso (libSQL)
 *
 * Wraps @libsql/client in a thin API that mirrors Cloudflare D1's
 *   .prepare(sql).bind(...args).first<T>()
 *   .prepare(sql).bind(...args).all<T>()   → { results: T[] }
 *   .prepare(sql).bind(...args).run()
 *
 * Configure via environment variables:
 *   TURSO_DATABASE_URL   — e.g. libsql://your-db.turso.io  (or file:local.db for local dev)
 *   TURSO_AUTH_TOKEN     — Turso auth token (omit for local file DBs)
 */

import { createClient, type Client, type InValue } from '@libsql/client';

let _client: Client | null = null;

function getClient(): Client {
	if (_client) return _client;

	const url = process.env.TURSO_DATABASE_URL;
	if (!url) throw new Error('TURSO_DATABASE_URL environment variable is not set');

	_client = createClient({
		url,
		authToken: process.env.TURSO_AUTH_TOKEN
	});

	return _client;
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
			const client = getClient();
			const libArgs = args as InValue[];

			return {
				async first<T = Record<string, unknown>>(): Promise<T | null> {
					const result = await client.execute({ sql, args: libArgs });
					if (!result.rows.length) return null;
					// libSQL rows are arrays; convert to named object using result.columns
					const row: Record<string, unknown> = {};
					result.columns.forEach((col, i) => {
						row[col] = result.rows[0][i];
					});
					return row as T;
				},

				async all<T = Record<string, unknown>>(): Promise<{ results: T[] }> {
					const result = await client.execute({ sql, args: libArgs });
					const results = result.rows.map((r) => {
						const row: Record<string, unknown> = {};
						result.columns.forEach((col, i) => {
							row[col] = r[i];
						});
						return row as T;
					});
					return { results };
				},

				async run(): Promise<void> {
					await client.execute({ sql, args: libArgs });
				}
			};
		}
	};
}

export function getDB() {
	return { prepare };
}

