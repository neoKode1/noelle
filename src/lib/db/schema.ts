import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

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

