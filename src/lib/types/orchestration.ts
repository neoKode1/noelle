/**
 * Multi-Agent Orchestration Types
 *
 * Defines the shared contract between:
 *   - Claude Orchestrator (lead developer / planner)
 *   - Claude Coding Agent (code generation)
 *   - Gemini Design Agent (UX/UI analysis + vision)
 */

// ── Agent Roles ───────────────────────────────────────────────────────────────

export type AgentRole = 'orchestrator' | 'coder' | 'designer';

// ── Image Attachments ─────────────────────────────────────────────────────────

/** A base64-encoded image (screenshot, mockup, etc.) attached to a prompt. */
export interface ImageAttachment {
	/** Original filename */
	name: string;
	/** MIME type: image/png | image/jpeg | image/webp | image/gif */
	mimeType: string;
	/** Base64-encoded image data (no data-URI prefix) */
	data: string;
}

// ── Sub-Agent Contracts ───────────────────────────────────────────────────────

/** A unit of work dispatched by the orchestrator to a sub-agent. */
export interface SubAgentTask {
	role: AgentRole;
	instruction: string;
	/** Additional context (repo code, requirements, etc.) */
	context?: string;
	/** Images forwarded to vision-capable agents (Gemini designer). */
	images?: ImageAttachment[];
}

/** The output returned by a sub-agent after completing its task. */
export interface SubAgentResult {
	role: AgentRole;
	/** The raw text output from the agent */
	output: string;
	/** Model identifier used for this call */
	model: string;
	/** Whether the agent completed successfully */
	success: boolean;
	error?: string;
}

// ── Orchestration Plan + Result ───────────────────────────────────────────────

/** The orchestrator's breakdown of a user request into sub-agent tasks. */
export interface OrchestrationPlan {
	/** High-level rationale for the task decomposition */
	rationale: string;
	/** Ordered list of tasks — run sequentially so results can inform later steps */
	tasks: SubAgentTask[];
}

/** The full result of an orchestrated multi-agent run. */
export interface OrchestrationResult {
	plan: OrchestrationPlan;
	results: SubAgentResult[];
	/** Final synthesized output from the orchestrator */
	synthesized: string;
	/** Total tokens used across all agents (approximate) */
	totalTokens?: number;
}

// ── Agent Model Config ────────────────────────────────────────────────────────

/** Runtime model identifiers — override via env vars. */
export interface AgentModelConfig {
	/** Claude model used as the lead orchestrator */
	orchestratorModel: string;
	/** Claude model used as the coding sub-agent */
	codingModel: string;
	/** Gemini model used as the design/vision sub-agent */
	designModel: string;
}

export function getAgentModelConfig(): AgentModelConfig {
	return {
		orchestratorModel: process.env.ORCHESTRATOR_MODEL ?? 'claude-opus-4-5',
		codingModel: process.env.CODING_MODEL ?? 'claude-sonnet-4-5',
		designModel: process.env.DESIGN_MODEL ?? 'gemini-1.5-pro'
	};
}

