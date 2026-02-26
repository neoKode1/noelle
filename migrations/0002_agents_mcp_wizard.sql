-- Retools: +12 Monkeys Integration — Agent Builder, MCP Registry, Wizard Sessions
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Agents ──────────────────────────────────────────────────────────────────
-- Each row = one agent configuration built via the +12 Monkeys wizard.
-- status: draft → generated → published

CREATE TABLE IF NOT EXISTS agents (
	id TEXT PRIMARY KEY,
	user_id TEXT NOT NULL REFERENCES users(id),

	-- Identity
	name TEXT NOT NULL,
	description TEXT,
	template_id TEXT NOT NULL,
	framework TEXT NOT NULL,

	-- Configuration (JSON blobs)
	mcp_servers TEXT NOT NULL DEFAULT '[]',
	deployment_type TEXT NOT NULL DEFAULT 'local',
	user_fields TEXT DEFAULT '{}',

	-- State
	status TEXT NOT NULL DEFAULT 'draft',
	generated_files TEXT,
	published_nanda_id TEXT,

	-- Timestamps
	created_at INTEGER NOT NULL,
	updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_agents_user_id ON agents(user_id);
CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);
CREATE INDEX IF NOT EXISTS idx_agents_template_id ON agents(template_id);

-- ── Agent Wizard Sessions ────────────────────────────────────────────────────
-- Conversational state for the agent builder wizard.
-- status: active → confirmed | abandoned

CREATE TABLE IF NOT EXISTS agent_sessions (
	id TEXT PRIMARY KEY,
	user_id TEXT REFERENCES users(id),

	-- Conversation state (JSON blobs)
	messages TEXT NOT NULL DEFAULT '[]',
	requirements TEXT,
	recommendation TEXT,

	-- Lifecycle
	status TEXT NOT NULL DEFAULT 'active',
	agent_id TEXT REFERENCES agents(id),

	-- Timestamps
	created_at INTEGER NOT NULL,
	updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_agent_sessions_user_id ON agent_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_status ON agent_sessions(status);

-- ── MCP Project Configurations ───────────────────────────────────────────────
-- Per-user, per-server credential storage (env vars, encrypted at app layer).

CREATE TABLE IF NOT EXISTS mcp_project_configs (
	id TEXT PRIMARY KEY,
	user_id TEXT NOT NULL REFERENCES users(id),
	agent_id TEXT REFERENCES agents(id),
	server_id TEXT NOT NULL,
	credentials_json TEXT NOT NULL DEFAULT '{}',

	-- Timestamps
	created_at INTEGER NOT NULL,
	updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_mcp_configs_user_id ON mcp_project_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_mcp_configs_agent_id ON mcp_project_configs(agent_id);
CREATE INDEX IF NOT EXISTS idx_mcp_configs_server_id ON mcp_project_configs(server_id);

