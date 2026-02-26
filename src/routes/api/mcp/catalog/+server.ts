/**
 * GET /api/mcp/catalog
 *
 * Serves the static MCP server registry with optional filtering.
 *
 * Query params:
 *   category  — filter by MCPCategory slug (e.g. "data", "dev-tools")
 *   search    — full-text search across name, description, tags
 *   official  — "true" to return official servers only
 */
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { listServers, getCategories, serverCount } from '$lib/data/mcp-registry';
import type { MCPCategory } from '$lib/types/mcp';

export const GET: RequestHandler = ({ url }) => {
	const category = url.searchParams.get('category') as MCPCategory | null;
	const search = url.searchParams.get('search') ?? undefined;
	const officialOnly = url.searchParams.get('official') === 'true';

	const servers = listServers({
		category: category ?? undefined,
		search,
		officialOnly
	});

	return json(
		{
			servers,
			total: servers.length,
			totalAll: serverCount(),
			categories: getCategories()
		},
		{
			headers: {
				// Cache for 5 min on edge — registry is static
				'Cache-Control': 'public, max-age=300, s-maxage=300'
			}
		}
	);
};

