/**
 * Wizard Orchestrator — Agent Wizard AI logic (Anthropic Claude)
 *
 * Uses Anthropic SDK to:
 *   1. Maintain a conversational session stored in DB (Turso/libSQL)
 *   2. Extract structured requirements from natural language
 *   3. Recommend a template + MCP servers once enough info is gathered
 */

import Anthropic from '@anthropic-ai/sdk';
import { nanoid } from 'nanoid';
import { listTemplates } from '$lib/data/agent-templates';
import type { ChatMessage, ExtractedRequirements, AgentRecommendation } from '$lib/types/agent';
import type { getDB } from '$lib/server/db';

type DB = ReturnType<typeof getDB>;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface WizardChatResponse {
	sessionId: string;
	reply: string;
	requirements: ExtractedRequirements | null;
	recommendation: AgentRecommendation | null;
	readyToGenerate: boolean;
}

interface D1Session {
	id: string;
	user_id: string | null;
	messages: string;
	requirements: string | null;
	recommendation: string | null;
	status: string;
	agent_id: string | null;
	created_at: number;
	updated_at: number;
}

// ── System Prompt ─────────────────────────────────────────────────────────────

function buildSystemPrompt(): string {
	const templates = listTemplates();
	const templateList = templates
		.map((t) => `• ${t.id} — ${t.name} (${t.framework}, ${t.category}): ${t.description}`)
		.join('\n');

	return `You are the Retools Agent Wizard, an expert AI assistant that helps users build custom AI agents powered by the +12 Monkeys SDK on Cloudflare Workers.

Your job is to have a friendly, concise conversation to understand what the user wants to build, then recommend the best agent template and MCP server tools.

AVAILABLE TEMPLATES:
${templateList}

CONVERSATION RULES:
1. Ask focused questions — one at a time — to clarify: use case, data sources, output format, deployment preference (local/cloud), and framework preference if any.
2. After 2-4 exchanges, you should have enough to make a recommendation.
3. Once you have enough info, append a JSON block at the END of your reply (after your human-readable text) in this exact format:

__CONFIG__
{
  "requirements": {
    "use_case": "string",
    "data_sources": ["string"],
    "output_format": "string",
    "deployment_preference": "local|cloud|export",
    "framework": "langgraph|crewai|autogen|semantic-kernel|vercel-ai|rig|adk-go",
    "mcp_servers": ["server-id-strings"],
    "template_id": "one of the template ids above"
  },
  "recommendation": {
    "template_id": "string",
    "template_name": "string",
    "framework": "string",
    "mcp_servers": ["string"],
    "deployment_type": "local|cloud|export",
    "estimated_cost": "string",
    "rationale": "string",
    "ready_to_generate": true
  }
}
__CONFIG_END__

4. Only include the __CONFIG__ block when you are confident in your recommendation (ready_to_generate: true). Do not include it in early turns.
5. Keep replies concise (2-4 sentences max) — this is a chat interface, not a document.
6. Be enthusiastic but professional — Nexartis Technology Stacks brand voice.`;
}

// ── Session helpers ───────────────────────────────────────────────────────────

async function loadSession(db: DB, sessionId: string): Promise<D1Session | null> {
	const result = await db
		.prepare('SELECT * FROM agent_sessions WHERE id = ?')
		.bind(sessionId)
		.first<D1Session>();
	return result ?? null;
}

async function upsertSession(
	db: DB,
	sessionId: string,
	messages: ChatMessage[],
	requirements: ExtractedRequirements | null,
	recommendation: AgentRecommendation | null
): Promise<void> {
	const now = Math.floor(Date.now() / 1000);
	await db
		.prepare(`
			INSERT INTO agent_sessions (id, user_id, messages, requirements, recommendation, status, created_at, updated_at)
			VALUES (?, NULL, ?, ?, ?, 'active', ?, ?)
			ON CONFLICT(id) DO UPDATE SET
				messages = excluded.messages,
				requirements = excluded.requirements,
				recommendation = excluded.recommendation,
				updated_at = excluded.updated_at
		`)
		.bind(
			sessionId,
			JSON.stringify(messages),
			requirements ? JSON.stringify(requirements) : null,
			recommendation ? JSON.stringify(recommendation) : null,
			now,
			now
		)
		.run();
}

// ── Main entry point ─────────────────────────────────────────────────────────

export async function processWizardMessage(
	db: DB,
	userMessage: string,
	sessionId?: string
): Promise<WizardChatResponse> {
	const sid = sessionId ?? nanoid();

	// Load or start session
	const existing = sessionId ? await loadSession(db, sessionId) : null;
	const messages: ChatMessage[] = existing ? JSON.parse(existing.messages) : [];
	let requirements: ExtractedRequirements | null = existing?.requirements
		? JSON.parse(existing.requirements)
		: null;
	let recommendation: AgentRecommendation | null = existing?.recommendation
		? JSON.parse(existing.recommendation)
		: null;

	// Append user turn
	messages.push({ role: 'user', content: userMessage, timestamp: new Date().toISOString() });

	// Build messages array for Anthropic
	const aiMessages: { role: 'user' | 'assistant'; content: string }[] = messages.map((m) => ({
		role: m.role as 'user' | 'assistant',
		content: m.content
	}));

	// Call Anthropic Claude
	const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
	const aiResponse = await anthropic.messages.create({
		model: 'claude-3-5-haiku-20241022',
		max_tokens: 800,
		system: buildSystemPrompt(),
		messages: aiMessages
	});

	const rawText =
		aiResponse.content[0].type === 'text' ? aiResponse.content[0].text : '';

	// Parse optional structured config block
	const parsed = parseConfigBlock(rawText);
	if (parsed.requirements) requirements = parsed.requirements;
	if (parsed.recommendation) recommendation = parsed.recommendation;

	// Append assistant turn (without the config block — keep chat clean)
	messages.push({
		role: 'assistant',
		content: parsed.reply,
		timestamp: new Date().toISOString()
	});

	// Persist to D1
	await upsertSession(db, sid, messages, requirements, recommendation);

	return {
		sessionId: sid,
		reply: parsed.reply,
		requirements,
		recommendation,
		readyToGenerate: recommendation?.ready_to_generate ?? false
	};
}

// ── Config block parser ───────────────────────────────────────────────────────

function parseConfigBlock(text: string): {
	reply: string;
	requirements: ExtractedRequirements | null;
	recommendation: AgentRecommendation | null;
} {
	const start = text.indexOf('__CONFIG__');
	const end = text.indexOf('__CONFIG_END__');

	if (start === -1 || end === -1) {
		return { reply: text.trim(), requirements: null, recommendation: null };
	}

	const replyText = text.slice(0, start).trim();
	const jsonStr = text.slice(start + '__CONFIG__'.length, end).trim();

	try {
		const parsed = JSON.parse(jsonStr);
		return {
			reply: replyText,
			requirements: parsed.requirements ?? null,
			recommendation: parsed.recommendation ?? null
		};
	} catch {
		return { reply: replyText, requirements: null, recommendation: null };
	}
}

