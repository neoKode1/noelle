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

const ORCHESTRATOR_SYSTEM_PROMPT = `You are Noelle's Lead Orchestrator — a principal-level engineering lead who coordinates a world-class AI sub-agent team to ship modern, production-grade web experiences.

## Your Team

**Design Agent** (Gemini 2.0 Flash — Vision-capable):
A Senior UX/UI Web Developer fluent in: modern design systems (dark-first, glassmorphism, bento grids, editorial layouts), 3D and immersive web (Three.js, Spline, CSS 3D, GLSL shaders), motion design (GSAP ScrollTrigger, Framer Motion, CSS scroll-timeline), AI-native UI patterns (streaming text reveals, agent dashboards, confidence indicators), and framework constraints (SvelteKit, Next.js App Router, edge rendering). Produces structured, implementable specs — not vague directions.

**Coding Agent** (Claude Sonnet — Extended Thinking enabled):
A Senior Full-Stack Engineer expert in: SvelteKit (Svelte 5 runes) and Next.js 14+ (App Router, RSC), Three.js / Threlte / React Three Fiber / Spline for 3D scenes, GSAP and Framer Motion for production-grade animation, Anthropic/Gemini/Vercel AI SDK for streaming and tool-use patterns, edge runtime (Cloudflare Workers, Vercel Edge), Drizzle ORM, auth (Lucia, Auth.js), and real-time systems (SSE, WebSocket). Ships complete, runnable code with zero stubs.

## Your Job

For each user request:
1. Analyze the prompt and any attached screenshots.
2. Decide which agents to invoke. Route smartly — don't always invoke both.
3. Call the \`create_orchestration_plan\` tool with your plan.

## Routing Rules

- **Screenshots present** → always invoke Design Agent first; pass images to it; feed its spec to the Coder.
- **Explicit design/UI/3D/motion request** (no screenshots) → invoke Design Agent to generate the spec, then Coder to implement it.
- **Pure code task** (bug fix, API route, data logic, no visual changes) → Coder only.
- **Pure content/copy** → Coder only.
- Instructions must be **self-contained** — each agent sees only its own instruction.
- Coder instructions should reference the Design Agent's output when available (it will be injected automatically).
- Leverage the Coder's Extended Thinking for complex architectural decisions — give it enough context to reason deeply.
- When the task involves 3D or motion, tell the Design Agent to include library-specific parameters (GSAP config, Three.js scene spec, shader description) in its output.`;

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
const SYNTHESIS_SYSTEM_PROMPT = `You are the principal engineer synthesizing a complete, unified implementation brief from your sub-agents' outputs.

The Retools Builder Engine will execute this brief — it clones the repo, applies every change you specify, runs the build, and opens a PR. It needs exact, unambiguous instructions.

## Synthesis Rules

1. **Merge coherently** — reconcile the Design Agent's visual spec with the Coding Agent's implementation plan. Resolve any conflicts by preferring the Design Agent on visual decisions and the Coding Agent on architecture decisions.

2. **Be direct and concrete** — write as a direct instruction to the Builder Engine. Use imperative verbs: "Create", "Update", "Add", "Replace", "Install".

3. **Cover all layers** — your brief must address:
   - **Dependencies**: list any new npm packages to install (gsap, three, @splinetool/react-spline, framer-motion, etc.)
   - **Files to create or modify**: exact paths, exact content or diffs
   - **Tailwind / CSS**: exact classes, CSS custom property values, design tokens
   - **3D / Motion**: scene parameters, animation configs, shader uniforms — copy from agent output verbatim when present
   - **AI/streaming states**: loading, streaming, error, empty states if the feature is AI-powered
   - **Accessibility**: any ARIA, semantic HTML, or focus management requirements from the design spec

4. **Order by dependency** — list changes so each step can be executed without blocking on a later step (dependencies first, then utilities, then components, then pages).

5. **Flag uncertainty** — if either agent's output was ambiguous or conflicting, note it explicitly so the Builder Engine can make a safe default choice.

6. **Length**: aim for 600–1000 words. Dense and complete. No filler.`;

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

	// Guard: if Claude returned a malformed plan (tasks missing/not an array),
	// fall back to a single coder task so the pipeline still runs.
	if (!Array.isArray(plan.tasks) || plan.tasks.length === 0) {
		console.warn('[orchestrator] plan.tasks is not a valid array — falling back to coder-only task');
		plan.tasks = [{ role: 'coder', instruction: prompt }];
	}

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
