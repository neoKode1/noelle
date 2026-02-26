/** ── Agent Types (mirrors +12 Monkeys Pydantic models) ─────────────────── */

// ── Enums ────────────────────────────────────────────────────────────────────

export type AgentFramework =
	| 'langgraph'
	| 'crewai'
	| 'autogen'
	| 'semantic-kernel'
	| 'vercel-ai'
	| 'rig'
	| 'adk-go';

export type DeploymentType = 'local' | 'cloud' | 'export';

export type AgentStatus = 'draft' | 'generated' | 'published';

export type WizardSessionStatus = 'active' | 'confirmed' | 'abandoned';

// ── Agent Template Types ──────────────────────────────────────────────────────

export type TemplateCategory =
	| 'customer-service'
	| 'research'
	| 'data-analysis'
	| 'code-generation'
	| 'multi-agent'
	| 'sales'
	| 'content'
	| 'ecommerce'
	| 'operations'
	| 'healthcare'
	| 'real-estate'
	| 'education'
	| 'stem'
	| 'grant-writing'
	| 'research-review'
	| 'finance'
	| 'compliance'
	| 'intelligence'
	| 'clinical';

export interface AgentRole {
	role: string;
	goal: string;
	backstory: string;
	tools: string[];
}

export interface MCPServerConfig {
	name: string;
	command: string;
	args: string[];
	requiredEnv: string[];
	category: string;
}

export interface TemplateField {
	name: string;
	label: string;
	fieldType?: 'text' | 'multiselect' | 'select' | 'number';
	options?: string[];
	required?: boolean;
	description?: string;
}

export interface AgentTemplate {
	id: string;
	name: string;
	description: string;
	category: TemplateCategory;
	framework: AgentFramework;
	agents: AgentRole[];
	mcpServers: MCPServerConfig[];
	requiredFields: TemplateField[];
	optionalFields: TemplateField[];
	estimatedCost: string;
	tags: string[];
	deploymentDefault: DeploymentType;
}

// ── Wizard Session Types ──────────────────────────────────────────────────────

export interface ChatMessage {
	role: 'user' | 'assistant';
	content: string;
	timestamp: string;
}

export interface ExtractedRequirements {
	use_case?: string;
	data_sources?: string[];
	output_format?: string;
	deployment_preference?: DeploymentType;
	framework?: AgentFramework;
	mcp_servers?: string[];
	template_id?: string;
}

export interface AgentRecommendation {
	template_id: string;
	template_name: string;
	framework: AgentFramework;
	mcp_servers: string[];
	deployment_type: DeploymentType;
	estimated_cost: string;
	rationale: string;
	ready_to_generate: boolean;
}

export interface WizardSession {
	id: string;
	userId: string | null;
	messages: ChatMessage[];
	requirements: ExtractedRequirements | null;
	recommendation: AgentRecommendation | null;
	status: WizardSessionStatus;
	agentId: string | null;
	createdAt: string;
	updatedAt: string;
}

// ── Saved Agent Types ─────────────────────────────────────────────────────────

export interface Agent {
	id: string;
	userId: string;
	name: string;
	description: string | null;
	templateId: string;
	framework: AgentFramework;
	mcpServers: string[];
	deploymentType: DeploymentType;
	userFields: Record<string, string>;
	status: AgentStatus;
	generatedFiles: Record<string, string> | null; // filename → content
	publishedNandaId: string | null;
	createdAt: string;
	updatedAt: string;
}

// ── Generated Package ─────────────────────────────────────────────────────────

export interface GeneratedPackage {
	agentId: string;
	files: Record<string, string>; // filename → content
	framework: AgentFramework;
	deploymentType: DeploymentType;
	mcpServers: string[];
}

