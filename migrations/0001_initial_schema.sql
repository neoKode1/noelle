-- Retools: Initial Schema — Prompt-Driven Retooling
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
	id TEXT PRIMARY KEY,
	email TEXT NOT NULL UNIQUE,
	name TEXT,
	github_username TEXT,
	created_at INTEGER NOT NULL,
	updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS retool_jobs (
	id TEXT PRIMARY KEY,
	user_id TEXT NOT NULL REFERENCES users(id),

	-- Repository info
	github_owner TEXT NOT NULL,
	github_repo TEXT NOT NULL,
	branch TEXT NOT NULL DEFAULT 'main',

	-- User prompt
	prompt TEXT NOT NULL,

	-- Deployment state
	status TEXT NOT NULL DEFAULT 'queued',
	preview_url TEXT,
	production_url TEXT,
	deployment_id TEXT,
	github_run_id TEXT,
	github_run_url TEXT,

	-- AI output
	ai_summary TEXT,
	error_message TEXT,

	-- Refinement chain
	parent_job_id TEXT,
	refinement_count INTEGER NOT NULL DEFAULT 0,

	-- Timestamps
	created_at INTEGER NOT NULL,
	updated_at INTEGER NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_retool_jobs_user_id ON retool_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_retool_jobs_status ON retool_jobs(status);
CREATE INDEX IF NOT EXISTS idx_retool_jobs_deployment_id ON retool_jobs(deployment_id);
CREATE INDEX IF NOT EXISTS idx_retool_jobs_parent_job_id ON retool_jobs(parent_job_id);

