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

// ── System Prompt ─────────────────────────────────────────────────────────────

const ORCHESTRATOR_SYSTEM_PROMPT = `You are Noelle's Lead Orchestrator — a senior engineering lead who coordinates a team of AI sub-agents.

Your team:
- **Coding Agent** (Claude Sonnet): Generates precise, production-ready code changes.
- **Design Agent** (Gemini Vision): Analyzes screenshots and produces UX/UI specifications.

Your job for each user request:
1. Analyze the prompt and any attached screenshots.
2. Decide which agents to invoke. Always invoke Design Agent when screenshots are present.
3. Return a JSON plan using EXACTLY this format:

__PLAN__
{
  "rationale": "Why you chose these agents and this order",
  "tasks": [
    {
      "role": "designer",
      "instruction": "Specific instruction for the design agent",
      "includesImages": true
    },
    {
      "role": "coder",
      "instruction": "Specific instruction for the coding agent, incorporating design output"
    }
  ]
}
__PLAN_END__

Rules:
- Only include agents that are truly needed.
- If no screenshots: skip the designer unless the prompt is explicitly about UI/design.
- "instruction" must be self-contained — each agent only sees its own instruction.
- Keep instructions concise (3-5 sentences max per agent).`;

// ── Synthesis ─────────────────────────────────────────────────────────────────

async function synthesizeResults(
	originalPrompt: string,
	results: SubAgentResult[],
	model: string
): Promise<string> {
	const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

	const agentOutputs = results
		.filter((r) => r.success && r.output)
		.map((r) => `### ${r.role.toUpperCase()} AGENT OUTPUT (${r.model})\n${r.output}`)
		.join('\n\n---\n\n');

	const synthPrompt = `You are the lead developer synthesizing the work of your sub-agents into a single, unified implementation brief.

Original user request:
${originalPrompt}

Sub-agent outputs:
${agentOutputs}

Produce a final, consolidated implementation brief that:
1. Merges the design specs with the code plan coherently.
2. Is written as a direct instruction to the Retools Builder Engine (which will make actual code changes).
3. Lists every specific change to make, in order of priority.
4. Includes exact file paths, Tailwind classes, color values, and component names where specified.
5. Is under 800 words.`;

	const response = await anthropic.messages.create({
		model,
		max_tokens: 1200,
		messages: [{ role: 'user', content: synthPrompt }]
	});

	return response.content[0].type === 'text' ? response.content[0].text : originalPrompt;
}

// ── Planning ──────────────────────────────────────────────────────────────────

async function buildPlan(
	prompt: string,
	hasImages: boolean,
	model: string
): Promise<OrchestrationPlan> {
	const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

	const userMsg = `User request: ${prompt}\n\nScreenshots attached: ${hasImages ? 'yes' : 'no'}\n\nProduce the orchestration plan.`;

	const response = await anthropic.messages.create({
		model,
		max_tokens: 1024,
		system: ORCHESTRATOR_SYSTEM_PROMPT,
		messages: [{ role: 'user', content: userMsg }]
	});

	const raw = response.content[0].type === 'text' ? response.content[0].text : '';

	const start = raw.indexOf('__PLAN__');
	const end = raw.indexOf('__PLAN_END__');

	if (start === -1 || end === -1) {
		// Fallback: just run the coding agent
		return {
			rationale: 'Defaulting to coding agent only (plan parse failed).',
			tasks: [{ role: 'coder', instruction: prompt }]
		};
	}

	try {
		const json = raw.slice(start + '__PLAN__'.length, end).trim();
		const parsed = JSON.parse(json);
		return parsed as OrchestrationPlan;
	} catch {
		return {
			rationale: 'Defaulting to coding agent only (JSON parse failed).',
			tasks: [{ role: 'coder', instruction: prompt }]
		};
	}
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
