/**
 * Gemini Design Agent
 *
 * Noelle's UX/UI sub-agent powered by Google Gemini (with vision).
 * Responsibilities:
 *   - Analyze screenshots to extract design intent, color palette, layout patterns
 *   - Generate actionable design specs and UI recommendations
 *   - Provide Tailwind class suggestions, spacing, typography guidance
 *
 * Env vars:
 *   GEMINI_API_KEY  — Google AI API key
 *   DESIGN_MODEL    — Model override (default: gemini-1.5-pro)
 */

import { GoogleGenerativeAI, type Part } from '@google/generative-ai';
import type { SubAgentTask, SubAgentResult } from '$lib/types/orchestration';

const DESIGN_SYSTEM_PROMPT = `You are Noelle's Design Agent — an expert UX/UI designer and front-end design consultant.

Your role:
1. Analyze screenshots and design references passed to you via images.
2. Extract design intent: color palette, typography, spacing, layout patterns, component hierarchy.
3. Produce clear, actionable design specifications that a developer can implement immediately.
4. Recommend Tailwind CSS classes, CSS variables, and component structure where applicable.
5. Flag accessibility issues (contrast, focus rings, ARIA) when visible.

Output format:
- Lead with a brief design summary (2-3 sentences).
- List specific, numbered recommendations.
- Include concrete values (hex colors, px sizes, Tailwind classes) wherever possible.
- End with a "Design Intent" statement: what feeling/brand the design should evoke.

Be concise and developer-friendly. Avoid vague adjectives — every statement should be actionable.`;

export async function runDesignAgent(task: SubAgentTask): Promise<SubAgentResult> {
	const apiKey = process.env.GEMINI_API_KEY;
	const model = process.env.DESIGN_MODEL ?? 'gemini-1.5-pro';

	if (!apiKey) {
		return {
			role: 'designer',
			model,
			success: false,
			output: '',
			error: 'GEMINI_API_KEY is not configured. Design agent skipped.'
		};
	}

	try {
		const genAI = new GoogleGenerativeAI(apiKey);
		const gemini = genAI.getGenerativeModel({
			model,
			systemInstruction: DESIGN_SYSTEM_PROMPT
		});

		// Build content parts: text instruction + any image attachments
		const parts: Part[] = [{ text: task.instruction }];

		if (task.context) {
			parts.push({ text: `\n\nAdditional context:\n${task.context}` });
		}

		if (task.images && task.images.length > 0) {
			for (const img of task.images) {
				parts.push({
					inlineData: {
						mimeType: img.mimeType as 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif',
						data: img.data
					}
				});
			}
		}

		const result = await gemini.generateContent({ contents: [{ role: 'user', parts }] });
		const text = result.response.text();

		return {
			role: 'designer',
			model,
			success: true,
			output: text
		};
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		return {
			role: 'designer',
			model,
			success: false,
			output: '',
			error: `Gemini design agent error: ${message}`
		};
	}
}

