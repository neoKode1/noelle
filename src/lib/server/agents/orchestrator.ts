/**
 * Claude Orchestrator — Multi-Agent Lead Developer
 *
 * Noelle's master orchestrator powered by Claude Opus.
 * Responsibilities:
 *   1. Receive the user's full request (prompt + images)
 *   2. Decide which sub-agents to invoke (design agent, coding agent, or both)
 *   3. Dispatch tasks sequentially so results can inform later steps
 *   4. Synthesize all sub-agent outputs into a final enriched prompt
 *      that the Retools Builder Engine uses to generate the PR
 *
 * Env vars:
 *   ANTHROPIC_API_KEY    — Anthropic API key
 *   ORCHESTRATOR_MODEL   — Model override (default: claude-opus-4-5)
 *
 * Optimizations:
 *   - Singleton Anthropic client (one HTTP pool for all calls)
 *   - Prompt caching on system prompts (cache_control: ephemeral)
 *   - Tool use for orchestration plan (guaranteed valid JSON, no text parsing)
 *   - Separate system/user split in synthesizeResults to enable caching
 */

import Anthropic from '@anthropic-ai/sdk';
import type {
	ImageAttachment,
	OrchestrationPlan,
	OrchestrationResult,
	SubAgentResult
} from '$lib/types/orchestration';
import { runDesignAgent } from './design-agent';
import { runCodingAgent } from './coding-agent';

// ── Singleton client ──────────────────────────────────────────────────────────
// One instance per process — reuses the underlying HTTP connection pool.
let _anthropic: Anthropic | null = null;
function getClient(): Anthropic {
	if (!_anthropic) {
		_anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
	}
	return _anthropic;
}

// ── System Prompt ─────────────────────────────────────────────────────────────
// Stored as a cached content block — Anthropic caches this for 5 min after the
// first call, so repeat requests pay only 10% of normal input token cost.

const ORCHESTRATOR_SYSTEM_PROMPT = `You are Noelle's Lead Orchestrator — a senior engineering lead who coordinates a team of AI sub-agents.

Your team:
- **Coding Agent** (Claude Sonnet): Generates precise, production-ready code changes.
- **Design Agent** (Gemini Vision): Analyzes screenshots and produces UX/UI specifications.

Your job for each user request:
1. Analyze the prompt and any attached screenshots.
2. Decide which agents to invoke. Always invoke Design Agent when screenshots are present.
3. Call the \`create_orchestration_plan\` tool with your plan.

Rules:
- Only include agents that are truly needed.
- If no screenshots: skip the designer unless the prompt is explicitly about UI/design.
- "instruction" must be self-contained — each agent only sees its own instruction.
- Keep instructions concise (3-5 sentences max per agent).`;

// Tool definition for the orchestration plan — replaces fragile text parsing.
const PLAN_TOOL: Anthropic.Tool = {
	name: 'create_orchestration_plan',
	description: 'Submit the agent execution plan',
	input_schema: {
		type: 'object' as const,
		properties: {
			rationale: {
				type: 'string',
				description: 'Why you chose these agents and this order'
			},
			tasks: {
				type: 'array',
				description: 'Ordered list of sub-agent tasks to execute',
				items: {
					type: 'object',
					properties: {
						role: { type: 'string', enum: ['designer', 'coder'] },
						instruction: { type: 'string', description: 'Self-contained instruction for the agent' },
						includesImages: { type: 'boolean', description: 'Whether to pass attached images to this agent' }
					},
					required: ['role', 'instruction']
				}
			}
		},
		required: ['rationale', 'tasks']
	}
};

// Static system prompt for the synthesis step — cached separately.
const SYNTHESIS_SYSTEM_PROMPT = `You are the lead developer synthesizing the work of your sub-agents into a single, unified implementation brief.

Your output must:
1. Merge design specs with the code plan coherently.
2. Be written as a direct instruction to the Retools Builder Engine (which will make actual code changes).
3. List every specific change to make, in order of priority.
4. Include exact file paths, Tailwind classes, color values, and component names where specified.
5. Be under 800 words.`;

// ── Synthesis ─────────────────────────────────────────────────────────────────

async function synthesizeResults(
	originalPrompt: string,
	results: SubAgentResult[],
	model: string
): Promise<string> {
	const anthropic = getClient();

	const agentOutputs = results
		.filter((r) => r.success && r.output)
		.map((r) => `### ${r.role.toUpperCase()} AGENT OUTPUT (${r.model})\n${r.output}`)
		.join('\n\n---\n\n');

	// Variable content goes in the user message; static role instructions are
	// in the system prompt with cache_control so they're only charged once.
	const userContent = `Original user request:\n${originalPrompt}\n\nSub-agent outputs:\n${agentOutputs}`;

	const response = await anthropic.messages.create({
		model,
		max_tokens: 1200,
		system: [
			{
				type: 'text',
				text: SYNTHESIS_SYSTEM_PROMPT,
				cache_control: { type: 'ephemeral' }
			}
		],
		messages: [{ role: 'user', content: userContent }]
	});

	return response.content[0].type === 'text' ? response.content[0].text : originalPrompt;
}

// ── Planning ──────────────────────────────────────────────────────────────────

async function buildPlan(
	prompt: string,
	hasImages: boolean,
	model: string
): Promise<OrchestrationPlan> {
	const anthropic = getClient();

	const userMsg = `User request: ${prompt}\n\nScreenshots attached: ${hasImages ? 'yes' : 'no'}\n\nCall create_orchestration_plan with your plan.`;

	// tool_choice: {type:'tool'} forces Claude to always call the tool —
	// no text output, guaranteed valid JSON, zero parsing failures.
	const response = await anthropic.messages.create({
		model,
		max_tokens: 1024,
		system: [
			{
				type: 'text',
				text: ORCHESTRATOR_SYSTEM_PROMPT,
				cache_control: { type: 'ephemeral' }
			}
		],
		tools: [PLAN_TOOL],
		tool_choice: { type: 'tool', name: 'create_orchestration_plan' },
		messages: [{ role: 'user', content: userMsg }]
	});

	// Extract the tool call input directly — no text parsing needed.
	const toolUse = response.content.find((b) => b.type === 'tool_use');
	if (toolUse && toolUse.type === 'tool_use') {
		return toolUse.input as OrchestrationPlan;
	}

	// Fallback only if tool_use block is somehow missing (should not happen with tool_choice forced)
	return {
		rationale: 'Defaulting to coding agent only.',
		tasks: [{ role: 'coder', instruction: prompt }]
	};
}

// ── Main Entry Point ──────────────────────────────────────────────────────────

/**
 * Run the full multi-agent orchestration pipeline.
 *
 * @param prompt   The user's original prompt
 * @param images   Optional screenshot/image attachments
 * @returns        OrchestrationResult including the synthesized brief
 */
export async function runOrchestration(
	prompt: string,
	images: ImageAttachment[] = []
): Promise<OrchestrationResult> {
	const model = process.env.ORCHESTRATOR_MODEL ?? 'claude-opus-4-5';
	const hasImages = images.length > 0;

	// Step 1: Build orchestration plan
	const plan = await buildPlan(prompt, hasImages, model);

	// Step 2: Execute sub-agents sequentially
	const results: SubAgentResult[] = [];

	for (const task of plan.tasks) {
		if (task.role === 'designer') {
			const result = await runDesignAgent({
				...task,
				images: hasImages ? images : []
			});
			results.push(result);
		} else if (task.role === 'coder') {
			// Enrich coder context with previous design output if available
			const designOutput = results.find((r) => r.role === 'designer' && r.success);
			const enrichedTask = {
				...task,
				context: designOutput
					? `Design specifications from Gemini Design Agent:\n${designOutput.output}`
					: task.context
			};
			const result = await runCodingAgent(enrichedTask);
			results.push(result);
		}
	}

	// Step 3: Synthesize all outputs into a final brief
	const synthesized = await synthesizeResults(prompt, results, model);

	return { plan, results, synthesized };
}
