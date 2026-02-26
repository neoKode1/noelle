import type { ImageAttachment } from './orchestration';

/**
 * Retools Deployment Contract - Schema Version 1
 *
 * This contract defines the message format for Retools PR generation jobs.
 * Retools creates PRs
 * on user repositories using their GitHub token.
 *
 * This file is shared between:
 * - Retools SvelteKit app (enqueues messages)
 * - Retools Builder Queue (consumes messages)
 */

export const RETOOLS_SCHEMA_VERSION = 1;

/**
 * Retools Deployment Message
 *
 * Enqueued by the Retools SvelteKit app when a user submits a retool job.
 * Consumed by the builder queue worker, which triggers the Retools Builder Engine
 * GitHub Actions workflow.
 */
export interface RetoolsDeploymentMessage {
	// Schema version for forward compatibility
	schema_version: 1;

	// Job identification
	job_id: string; // Format: "job-{uuid}"
	timestamp: string; // ISO 8601 timestamp

	// GitHub repository to modify
	repo_url: string; // Full GitHub URL: https://github.com/owner/repo
	branch: string; // Target branch (auto-detected if not provided)

	// User's GitHub token (used for checkout, push, PR creation)
	// This is passed through to the builder engine and never logged
	github_token: string;

	// AI prompt describing the changes to make
	prompt: string;

	// User information (for PR attribution)
	user_email?: string;
	user_name?: string;

	/**
	 * Optional screenshots/images attached by the user.
	 * Forwarded to the Gemini Design Agent for visual analysis.
	 * Base64-encoded; mimeType must be image/png | image/jpeg | image/webp | image/gif.
	 */
	image_attachments?: ImageAttachment[];

	/**
	 * Enriched prompt produced by the Claude Orchestrator after consulting sub-agents.
	 * When present, the builder engine should prefer this over the raw `prompt`.
	 */
	orchestrated_prompt?: string;
}

/**
 * Builder Webhook Callback Payload
 *
 * Sent by the retools-engine GitHub Actions workflow to /api/webhooks/builder
 * as the job progresses through pipeline stages.
 */
export interface BuilderWebhookPayload {
	job_id: string;
	status: 'queued' | 'cloning' | 'customizing' | 'building' | 'deploying' | 'preview_ready' | 'failed';

	/** GitHub Pull Request URL for the AI-generated changes. */
	pr_url?: string;

	/**
	 * Live hosted preview URL (Vercel/Netlify/etc.) for the deployed PR branch.
	 * Set when the deployment platform auto-generates a preview for the PR.
	 */
	preview_url?: string;

	/** GitHub Actions run ID for the builder workflow. */
	github_run_id?: string | number;

	/** Link to the GitHub Actions run (used for "Build Log" button). */
	github_run_url?: string;

	/** Error or status message (used on failure). */
	message?: string;
}

