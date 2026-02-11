-- Retools: Initial Schema
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
	id TEXT PRIMARY KEY,
	email TEXT NOT NULL UNIQUE,
	name TEXT,
	company_name TEXT,
	role TEXT,
	company_size TEXT,
	industry TEXT,
	created_at INTEGER NOT NULL,
	updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS projects (
	id TEXT PRIMARY KEY,
	user_id TEXT NOT NULL REFERENCES users(id),
	status TEXT NOT NULL DEFAULT 'submitted',
	company_name TEXT,
	existing_url TEXT,
	tech_stack TEXT,
	hosting_provider TEXT,
	has_codebase_access INTEGER,
	codebase_url TEXT,
	has_brand_assets INTEGER,
	categories TEXT,
	description TEXT,
	reference_urls TEXT,
	timeline TEXT,
	budget TEXT,
	compliance TEXT,
	approval_level TEXT,
	created_at INTEGER NOT NULL,
	updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS project_scopes (
	id TEXT PRIMARY KEY,
	project_id TEXT NOT NULL REFERENCES projects(id),
	summary TEXT,
	estimated_hours REAL,
	estimated_cost REAL,
	recommended_approach TEXT,
	raw_ai_output TEXT,
	approved_at INTEGER,
	created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS tasks (
	id TEXT PRIMARY KEY,
	scope_id TEXT NOT NULL REFERENCES project_scopes(id),
	project_id TEXT NOT NULL REFERENCES projects(id),
	title TEXT NOT NULL,
	description TEXT,
	status TEXT NOT NULL DEFAULT 'pending',
	"order" INTEGER NOT NULL DEFAULT 0,
	estimated_hours REAL,
	created_at INTEGER NOT NULL,
	completed_at INTEGER
);

CREATE TABLE IF NOT EXISTS deployments (
	id TEXT PRIMARY KEY,
	project_id TEXT NOT NULL REFERENCES projects(id),
	environment TEXT NOT NULL,
	url TEXT NOT NULL,
	status TEXT NOT NULL DEFAULT 'pending',
	commit_sha TEXT,
	created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS messages (
	id TEXT PRIMARY KEY,
	project_id TEXT NOT NULL REFERENCES projects(id),
	sender TEXT NOT NULL,
	content TEXT NOT NULL,
	created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS assets (
	id TEXT PRIMARY KEY,
	project_id TEXT NOT NULL REFERENCES projects(id),
	file_name TEXT NOT NULL,
	file_type TEXT NOT NULL,
	file_size INTEGER NOT NULL,
	r2_key TEXT NOT NULL,
	uploaded_by TEXT NOT NULL REFERENCES users(id),
	created_at INTEGER NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_project_scopes_project_id ON project_scopes(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_scope_id ON tasks(scope_id);
CREATE INDEX IF NOT EXISTS idx_deployments_project_id ON deployments(project_id);
CREATE INDEX IF NOT EXISTS idx_messages_project_id ON messages(project_id);
CREATE INDEX IF NOT EXISTS idx_assets_project_id ON assets(project_id);

