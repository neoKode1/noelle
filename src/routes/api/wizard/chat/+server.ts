/**
 * POST /api/wizard/chat
 *
 * Body: { message: string; session_id?: string }
 *
 * Returns: WizardChatResponse JSON — reply text, extracted requirements,
 *          template recommendation, and readyToGenerate flag.
 */
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { processWizardMessage } from '$lib/server/wizard-orchestrator';
import { getDB } from '$lib/server/db';

interface ChatRequestBody {
	message: string;
	session_id?: string;
}

export const POST: RequestHandler = async ({ request }) => {
	const db = getDB();

	let body: ChatRequestBody;
	try {
		body = await request.json();
	} catch {
		throw error(400, 'Invalid JSON body');
	}

	const { message, session_id } = body;
	if (!message?.trim()) throw error(400, 'message is required');

	const result = await processWizardMessage(db, message.trim(), session_id);

	return json(result, {
		headers: { 'Cache-Control': 'no-store' }
	});
};

