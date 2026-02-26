/**
 * POST /api/wizard/chat
 *
 * Body: { message: string; session_id?: string; screenshots?: ImageAttachment[] }
 *
 * Returns: WizardChatResponse JSON — reply text, extracted requirements,
 *          template recommendation, and readyToGenerate flag.
 */
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { processWizardMessage } from '$lib/server/wizard-orchestrator';
import { getDB } from '$lib/server/db';
import type { ImageAttachment } from '$lib/types/orchestration';

interface ChatRequestBody {
	message: string;
	session_id?: string;
	screenshots?: ImageAttachment[];
}

export const POST: RequestHandler = async ({ request }) => {
	const db = getDB();

	let body: ChatRequestBody;
	try {
		body = await request.json();
	} catch {
		throw error(400, 'Invalid JSON body');
	}

	const { message, session_id, screenshots } = body;
	if (!message?.trim() && (!screenshots || screenshots.length === 0)) {
		throw error(400, 'message or screenshots are required');
	}

	const result = await processWizardMessage(db, message?.trim() ?? 'I have attached some reference images.', session_id, screenshots);

	return json(result, {
		headers: { 'Cache-Control': 'no-store' }
	});
};

