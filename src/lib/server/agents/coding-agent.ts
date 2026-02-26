/**
 * Claude Coding Agent
 *
 * Noelle's code-generation sub-agent powered by Claude (Sonnet).
 * Responsibilities:
 *   - Translate high-level requirements into concrete code changes
 *   - Generate diffs, new files, or updated component code
 *   - Apply design specs from the design agent into working code
 *   - Follow framework conventions (SvelteKit, React, Next.js, etc.)
 *
 * Env vars:
 *   ANTHROPIC_API_KEY — Anthropic API key
 *   CODING_MODEL      — Model override (default: claude-sonnet-4-5)
 */

import Anthropic from '@anthropic-ai/sdk';
import type { SubAgentTask, SubAgentResult } from '$lib/types/orchestration';

const CODING_SYSTEM_PROMPT = `You are Noelle's Coding Agent — a senior full-stack developer specializing in modern web frameworks.

Your role:
1. Receive a coding task and any design specifications from the design review.
2. Generate precise, production-ready code changes.
3. Output concrete file changes: specify the file path and the exact code.
4. Follow the project's existing patterns, naming conventions, and style.
5. Prefer Tailwind CSS for styling; use TypeScript where applicable.
6. Write clean, accessible HTML (semantic elements, ARIA attributes where needed).

Output format:
- Start with a brief implementation plan (2-3 sentences).
- For each file change, use this format:

FILE: path/to/file.ext
\`\`\`language
// full file content or clearly marked diff
\`\`\`

- End with a "Changes Summary" listing each file modified and why.

Be precise. Do not include unnecessary commentary. Every line of code must be intentional.`;

export async function runCodingAgent(task: SubAgentTask): Promise<SubAgentResult> {
	const model = process.env.CODING_MODEL ?? 'claude-sonnet-4-5';

	try {
		const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

		const userContent = task.context
			? `${task.instruction}\n\n---\nContext:\n${task.context}`
			: task.instruction;

		const response = await anthropic.messages.create({
			model,
			max_tokens: 4096,
			system: CODING_SYSTEM_PROMPT,
			messages: [{ role: 'user', content: userContent }]
		});

		const text = response.content[0].type === 'text' ? response.content[0].text : '';

		return {
			role: 'coder',
			model,
			success: true,
			output: text
		};
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		return {
			role: 'coder',
			model,
			success: false,
			output: '',
			error: `Coding agent error: ${message}`
		};
	}
}

