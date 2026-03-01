/**
 * Auth helpers — JWT (HMAC-SHA256 via Node.js crypto) + magic-link token ops.
 * No external JWT library needed; uses only built-in crypto.
 */
import { createHmac, randomBytes } from 'crypto';
import { nanoid } from 'nanoid';
import { getDB } from './db';

// ── Types ────────────────────────────────────────────────────────────────────

export interface JwtPayload {
	sub: string;   // user ID
	email: string;
	plan: string;
	exp: number;   // Unix seconds
}

// ── JWT ──────────────────────────────────────────────────────────────────────

function b64url(data: string): string {
	return Buffer.from(data)
		.toString('base64')
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=/g, '');
}

function getSecret(): string {
	return process.env.SESSION_SECRET ?? 'dev-secret-please-set-SESSION_SECRET';
}

export function signJwt(payload: Omit<JwtPayload, 'exp'>): string {
	const exp = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60; // 7 days
	const fullPayload: JwtPayload = { ...payload, exp };
	const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
	const body = b64url(JSON.stringify(fullPayload));
	const sig = createHmac('sha256', getSecret())
		.update(`${header}.${body}`)
		.digest('base64')
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=/g, '');
	return `${header}.${body}.${sig}`;
}

export function verifyJwt(token: string): JwtPayload | null {
	const parts = token.split('.');
	if (parts.length !== 3) return null;
	const [header, body, sig] = parts;
	const expectedSig = createHmac('sha256', getSecret())
		.update(`${header}.${body}`)
		.digest('base64')
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=/g, '');
	if (sig !== expectedSig) return null;
	try {
		const payload = JSON.parse(
			Buffer.from(body, 'base64').toString('utf-8')
		) as JwtPayload;
		if (payload.exp < Math.floor(Date.now() / 1000)) return null;
		return payload;
	} catch {
		return null;
	}
}

// ── Magic-link tokens ────────────────────────────────────────────────────────

const MAGIC_TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes

export async function createMagicToken(email: string): Promise<string> {
	const db = getDB();
	const token = randomBytes(48).toString('hex');
	const now = Date.now();
	const expiresAt = now + MAGIC_TOKEN_TTL_MS;
	await db
		.prepare(
			`INSERT INTO magic_link_tokens (token, email, used, expires_at, created_at)
			 VALUES (?, ?, 0, ?, ?)`
		)
		.bind(token, email, expiresAt, now)
		.run();
	return token;
}

export async function verifyMagicToken(token: string): Promise<string | null> {
	const db = getDB();
	const row = await db
		.prepare(
			`SELECT email, used, expires_at FROM magic_link_tokens WHERE token = ?`
		)
		.bind(token)
		.first<{ email: string; used: number; expires_at: number }>();
	if (!row || row.used !== 0 || row.expires_at < Date.now()) return null;
	await db
		.prepare(`UPDATE magic_link_tokens SET used = 1 WHERE token = ?`)
		.bind(token)
		.run();
	return row.email;
}

// ── User lookup / creation ───────────────────────────────────────────────────

export interface AuthUser {
	id: string;
	email: string;
	plan: string;
}

export async function getOrCreateUser(email: string): Promise<AuthUser> {
	const db = getDB();
	const existing = await db
		.prepare(`SELECT id, email, plan FROM users WHERE email = ?`)
		.bind(email)
		.first<{ id: string; email: string; plan: string }>();
	if (existing) return existing;

	const id = nanoid();
	const now = Date.now();
	await db
		.prepare(
			`INSERT INTO users (id, email, created_at, updated_at)
			 VALUES (?, ?, ?, ?)`
		)
		.bind(id, email, now, now)
		.run();
	return { id, email, plan: 'free' };
}

