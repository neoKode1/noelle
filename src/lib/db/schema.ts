import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

// ── Users ──────────────────────────────────────────────────────────
export const users = sqliteTable('users', {
	id: text('id').primaryKey(), // nanoid
	email: text('email').notNull().unique(),
	name: text('name'),
	githubUsername: text('github_username'),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});

// ── Retool Jobs ────────────────────────────────────────────────────
// Each row = one prompt-driven retooling request.
// Status flow: queued → cloning → customizing → building → deploying
//            → preview_ready → approved → deployed
//            (or → failed at any stage)
export const retoolJobs = sqliteTable('retool_jobs', {
	id: text('id').primaryKey(), // nanoid
	userId: text('user_id').notNull().references(() => users.id),

	// ── Repository info ────────────────────────────────────────────
	githubOwner: text('github_owner').notNull(),
	githubRepo: text('github_repo').notNull(),
	branch: text('branch').notNull().default('main'),

	// ── User prompt ────────────────────────────────────────────────
	prompt: text('prompt').notNull(),

	// ── Deployment state ───────────────────────────────────────────
	status: text('status').notNull().default('queued'),
	// queued | cloning | customizing | building | deploying
	// | preview_ready | approved | deployed | failed | cancelled

	previewUrl: text('preview_url'),
	productionUrl: text('production_url'),
	deploymentId: text('deployment_id'), // Pegasus deployment_id
	githubRunId: text('github_run_id'), // GitHub Actions run ID
	githubRunUrl: text('github_run_url'), // Link to GH Actions run

	// ── AI output ──────────────────────────────────────────────────
	aiSummary: text('ai_summary'), // AI-generated summary of changes
	errorMessage: text('error_message'),

	// ── Refinement ─────────────────────────────────────────────────
	parentJobId: text('parent_job_id'), // If this is a refinement of a previous job
	refinementCount: integer('refinement_count').notNull().default(0),

	// ── Timestamps ─────────────────────────────────────────────────
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});


// ── Agents ─────────────────────────────────────────────────────────
// Each row = one agent configuration built via the +12 Monkeys wizard.
// Status flow: draft → generated → published
export const agents = sqliteTable(
	'agents',
	{
		id: text('id').primaryKey(), // nanoid
		userId: text('user_id')
			.notNull()
			.references(() => users.id),

		// ── Identity ───────────────────────────────────────────────
		name: text('name').notNull(),
		description: text('description'),
		templateId: text('template_id').notNull(), // from agent-templates.ts
		framework: text('framework').notNull(), // langgraph | crewai | autogen | semantic-kernel | vercel-ai | rig | adk-go

		// ── Configuration (JSON) ───────────────────────────────────
		mcpServers: text('mcp_servers').notNull().default('[]'), // string[]
		deploymentType: text('deployment_type').notNull().default('local'), // local | cloud | export
		userFields: text('user_fields').default('{}'), // Record<string, string>

		// ── State ──────────────────────────────────────────────────
		status: text('status').notNull().default('draft'), // draft | generated | published
		generatedFiles: text('generated_files'), // Record<string, string> filename→content
		publishedNandaId: text('published_nanda_id'), // NANDA Index agent_id after publish

		// ── Timestamps ─────────────────────────────────────────────
		createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
		updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
	},
	(t) => [
		index('idx_agents_user_id').on(t.userId),
		index('idx_agents_status').on(t.status),
		index('idx_agents_template_id').on(t.templateId)
	]
);

// ── Agent Wizard Sessions ───────────────────────────────────────────
// Conversational state for the agent builder wizard.
// status: active → confirmed | abandoned
export const agentSessions = sqliteTable(
	'agent_sessions',
	{
		id: text('id').primaryKey(), // nanoid
		userId: text('user_id').references(() => users.id), // null for anonymous

		// ── Conversation state (JSON) ──────────────────────────────
		messages: text('messages').notNull().default('[]'), // ChatMessage[]
		requirements: text('requirements'), // ExtractedRequirements JSON
		recommendation: text('recommendation'), // AgentRecommendation JSON

		// ── Lifecycle ──────────────────────────────────────────────
		status: text('status').notNull().default('active'), // active | confirmed | abandoned
		agentId: text('agent_id').references(() => agents.id), // set after code generation

		// ── Timestamps ─────────────────────────────────────────────
		createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
		updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
	},
	(t) => [
		index('idx_agent_sessions_user_id').on(t.userId),
		index('idx_agent_sessions_status').on(t.status)
	]
);

// ── MCP Project Configurations ──────────────────────────────────────
// Per-user, per-MCP-server credential storage.
// credentialsJson stores encrypted env vars: { ENV_VAR_NAME: encrypted_value }
export const mcpProjectConfigs = sqliteTable(
	'mcp_project_configs',
	{
		id: text('id').primaryKey(), // nanoid
		userId: text('user_id')
			.notNull()
			.references(() => users.id),
		agentId: text('agent_id').references(() => agents.id), // optional — scoped to agent
		serverId: text('server_id').notNull(), // MCP server id from mcp-registry.ts
		credentialsJson: text('credentials_json').notNull().default('{}'), // encrypted env vars

		// ── Timestamps ─────────────────────────────────────────────
		createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
		updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
	},
	(t) => [
		index('idx_mcp_configs_user_id').on(t.userId),
		index('idx_mcp_configs_agent_id').on(t.agentId),
		index('idx_mcp_configs_server_id').on(t.serverId)
	]
);
