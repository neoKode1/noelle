/**
 * GET /api/health
 *
 * Lightweight health check for deployment verification.
 * Returns environment, timestamp, and service status.
 */
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	return json({
		status: 'ok',
		service: 'noelle',
		environment: process.env.NODE_ENV ?? 'unknown',
		timestamp: new Date().toISOString(),
		version: '0.1.0'
	});
};

