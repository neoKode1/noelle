/** ── MCP Types (mirrors +12 Monkeys Pydantic models) ───────────────────── */

// ── Enums ────────────────────────────────────────────────────────────────────

export type MCPCategory =
	| 'data'
	| 'communication'
	| 'dev-tools'
	| 'productivity'
	| 'search'
	| 'ai-ml'
	| 'finance'
	| 'intelligence'
	| 'custom';

export type MCPServerStatus = 'unknown' | 'healthy' | 'unhealthy' | 'checking';

/** Safety level determines whether a tool auto-runs or requires confirmation. */
export type ToolSafetyLevel = 'safe' | 'moderate' | 'dangerous';

// ── Tool Schema ───────────────────────────────────────────────────────────────

export interface MCPToolSchema {
	name: string;
	description: string;
	inputSchema: Record<string, unknown>;
	safetyLevel: ToolSafetyLevel;
	taskNameActive?: string; // UI label while running
	taskNameComplete?: string; // UI label when done
}

// ── Server Entry ──────────────────────────────────────────────────────────────

export interface MCPServerEntry {
	id: string;
	name: string;
	description: string;
	category: MCPCategory;
	/** stdio transport: the executable (e.g. "npx") */
	command?: string;
	/** stdio args (e.g. ["-y", "@modelcontextprotocol/server-github"]) */
	args?: string[];
	/** HTTP/SSE transport: server URL (used instead of command+args) */
	endpointUrl?: string;
	requiredEnv: string[];
	optionalEnv: string[];
	npmPackage?: string;
	documentationUrl?: string;
	/** Emoji or icon name for display */
	icon?: string;
	tags: string[];
	status: MCPServerStatus;
	tools: MCPToolSchema[];
	lastHealthCheck?: string; // ISO timestamp
	isOfficial: boolean;
}

// ── API Response Types ────────────────────────────────────────────────────────

export interface MCPServerListResponse {
	servers: MCPServerEntry[];
	total: number;
	categories: string[];
}

export interface MCPHealthResult {
	serverId: string;
	status: MCPServerStatus;
	toolsCount: number;
	tools: MCPToolSchema[];
	responseTimeMs: number;
	error?: string;
	checkedAt: string;
}

// ── Credential Types ──────────────────────────────────────────────────────────

export interface MCPCredentialEntry {
	key: string;
	value: string; // encrypted at rest
	serverId: string;
}

export interface MCPProjectConfig {
	id: string;
	userId: string;
	agentId: string | null;
	serverId: string;
	credentialsJson: Record<string, string>; // ENV_VAR → encrypted value
	createdAt: string;
	updatedAt: string;
}

// ── Category Labels ───────────────────────────────────────────────────────────

export const MCP_CATEGORY_LABELS: Record<MCPCategory, string> = {
	data: 'Data & Databases',
	communication: 'Communication',
	'dev-tools': 'Dev Tools',
	productivity: 'Productivity',
	search: 'Search',
	'ai-ml': 'AI & ML',
	finance: 'Finance',
	intelligence: 'Intelligence',
	custom: 'Custom'
};

