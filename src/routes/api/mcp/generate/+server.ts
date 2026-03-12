/**
 * POST /api/mcp/generate
 *
 * Proxy to the plus12monkeys.com generation API.
 * Requires an authenticated session (any plan).
 * Returns generated MCP server or SDK files.
 */
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const PLUS12_BASE = 'https://plus12monkeys.com/api/v1';

export const POST: RequestHandler = async ({ request, locals }) => {
	// Auth gate
	const user = locals.user;
	if (!user) return json({ error: 'auth_required' }, { status: 401 });

	let body: { repo_url: string; output_type?: string; project_name?: string };
	try {
		body = await request.json();
	} catch {
		return json({ error: 'invalid_json' }, { status: 400 });
	}

	if (!body.repo_url || typeof body.repo_url !== 'string') {
		return json({ error: 'repo_url is required' }, { status: 400 });
	}

	const payload = {
		repo_url: body.repo_url.trim(),
		output_type: body.output_type ?? 'mcp',
		...(body.project_name ? { project_name: body.project_name } : {}),
		deployment: 'export'
	};

	try {
		const upstream = await fetch(`${PLUS12_BASE}/generate`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload)
		});

		const data = await upstream.json();

		if (!upstream.ok) {
			return json(
				{ error: data?.detail ?? 'Generation failed' },
				{ status: upstream.status }
			);
		}

		return json(data);
	} catch (err) {
		console.error('[mcp/generate] upstream error:', err);
		return json({ error: 'Failed to reach plus12monkeys service' }, { status: 502 });
	}
};

