import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// ── Users ──────────────────────────────────────────────────────────
export const users = sqliteTable('users', {
	id: text('id').primaryKey(), // nanoid
	email: text('email').notNull().unique(),
	name: text('name'),
	companyName: text('company_name'),
	role: text('role'),
	companySize: text('company_size'), // solo | small | medium | enterprise
	industry: text('industry'),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});

// ── Projects (submitted intake requests) ───────────────────────────
export const projects = sqliteTable('projects', {
	id: text('id').primaryKey(), // nanoid
	userId: text('user_id').notNull().references(() => users.id),
	status: text('status').notNull().default('submitted'), // submitted | scoping | in_progress | review | deployed | cancelled
	// Intake data
	companyName: text('company_name'),
	existingUrl: text('existing_url'),
	techStack: text('tech_stack'),
	hostingProvider: text('hosting_provider'),
	hasCodebaseAccess: integer('has_codebase_access', { mode: 'boolean' }),
	codebaseUrl: text('codebase_url'),
	hasBrandAssets: integer('has_brand_assets', { mode: 'boolean' }),
	categories: text('categories'), // JSON array of RequestCategory
	description: text('description'),
	referenceUrls: text('reference_urls'), // JSON array
	timeline: text('timeline'),
	budget: text('budget'),
	compliance: text('compliance'), // JSON array
	approvalLevel: text('approval_level'),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});

// ── Project Scopes (AI-generated breakdown) ────────────────────────
export const projectScopes = sqliteTable('project_scopes', {
	id: text('id').primaryKey(),
	projectId: text('project_id').notNull().references(() => projects.id),
	summary: text('summary'),
	estimatedHours: real('estimated_hours'),
	estimatedCost: real('estimated_cost'),
	recommendedApproach: text('recommended_approach'),
	rawAiOutput: text('raw_ai_output'), // Full AI response for audit
	approvedAt: integer('approved_at', { mode: 'timestamp' }),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});

// ── Tasks (individual work items within a scope) ──────────────────
export const tasks = sqliteTable('tasks', {
	id: text('id').primaryKey(),
	scopeId: text('scope_id').notNull().references(() => projectScopes.id),
	projectId: text('project_id').notNull().references(() => projects.id),
	title: text('title').notNull(),
	description: text('description'),
	status: text('status').notNull().default('pending'), // pending | in_progress | done | blocked
	order: integer('order').notNull().default(0),
	estimatedHours: real('estimated_hours'),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	completedAt: integer('completed_at', { mode: 'timestamp' })
});

// ── Deployments (preview + production URLs) ────────────────────────
export const deployments = sqliteTable('deployments', {
	id: text('id').primaryKey(),
	projectId: text('project_id').notNull().references(() => projects.id),
	environment: text('environment').notNull(), // preview | production
	url: text('url').notNull(),
	status: text('status').notNull().default('pending'), // pending | building | live | failed
	commitSha: text('commit_sha'),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});

// ── Messages (communication thread per project) ───────────────────
export const messages = sqliteTable('messages', {
	id: text('id').primaryKey(),
	projectId: text('project_id').notNull().references(() => projects.id),
	sender: text('sender').notNull(), // 'user' | 'system' | 'agent'
	content: text('content').notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});

// ── Assets (uploaded files, screenshots, brand materials) ─────────
export const assets = sqliteTable('assets', {
	id: text('id').primaryKey(),
	projectId: text('project_id').notNull().references(() => projects.id),
	fileName: text('file_name').notNull(),
	fileType: text('file_type').notNull(),
	fileSize: integer('file_size').notNull(),
	r2Key: text('r2_key').notNull(), // R2 object key
	uploadedBy: text('uploaded_by').notNull().references(() => users.id),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});

