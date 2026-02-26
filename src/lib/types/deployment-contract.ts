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
}

