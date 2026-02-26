/**
 * GET /api/mcp/servers/:id
 * Returns a single MCP server entry by ID.
 */
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getServer } from '$lib/data/mcp-registry';

export const GET: RequestHandler = ({ params }) => {
	const server = getServer(params.id);
	if (!server) throw error(404, `MCP server "${params.id}" not found`);
	return json(server);
};

