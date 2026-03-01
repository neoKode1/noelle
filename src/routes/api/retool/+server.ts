/**
 * POST /api/retool
 *
 * Accepts a GitHub repo URL + prompt (+ optional image attachments),
 * immediately enqueues a RetoolsDeploymentMessage v1 to the builder queue
 * so the job ID is returned within ~2 seconds. The multi-agent orchestration
 * pipeline (Claude → Gemini → Claude) runs in the background via
 * platform.context.waitUntil() and updates the DB record when complete.
 */
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { parseGitHubUrl } from '$lib/types/retool';
import type { ImageAttachment } from '$lib/types/orchestration';
import { RETOOLS_SCHEMA_VERSION, type RetoolsDeploymentMessage } from '$lib/types/deployment-contract';
import { getDB } from '$lib/server/db';
import { sendToQueue } from '$lib/server/queue';
import { runOrchestration } from '$lib/server/agents/orchestrator';

// Keep a generous max duration for the background orchestration work.
export const config = { maxDuration: 300 };

const FREE_LIMIT = 5;

export const POST: RequestHandler = async ({ request, platform, locals }) => {
	const db = getDB();

	// ── Auth gate ────────────────────────────────────────────────────────────
	const user = locals.user;
	if (!user) return json({ error: 'auth_required' }, { status: 401 });

	// ── Usage check ──────────────────────────────────────────────────────────
	const adminEmails = (process.env.ADMIN_EMAILS ?? '')
		.split(',')
		.map((e) => e.trim().toLowerCase())
		.filter(Boolean);
	const isAdmin = adminEmails.includes(user.email.toLowerCase());

	if (!isAdmin) {
		const fresh = await db
			.prepare(`SELECT usage_count, plan FROM users WHERE id = ?`)
			.bind(user.id)
			.first<{ usage_count: number; plan: string }>();
		const plan = fresh?.plan ?? 'free';
		const usageCount = fresh?.usage_count ?? 0;
		if (plan === 'free' && usageCount >= FREE_LIMIT) {
			return json({ error: 'usage_limit', upgradeUrl: '/billing' }, { status: 402 });
		}
	}

	const body = await request.json();
	const {
		repoUrl,
		branch,
		prompt,
		github_token: githubToken,
		screenshots,
		job_id: clientJobId
	}: {
		repoUrl: string;
		branch?: string;
		prompt: string;
		github_token: string;
		screenshots?: ImageAttachment[];
		job_id?: string;
	} = body;

	// ── Validate inputs ──────────────────────────────────────────
	if (!repoUrl || typeof repoUrl !== 'string') throw error(400, 'repoUrl is required');
	if (!prompt || typeof prompt !== 'string') throw error(400, 'prompt is required');
	if (!githubToken || typeof githubToken !== 'string') throw error(400, 'github_token is required');

	const parsed = parseGitHubUrl(repoUrl);
	if (!parsed) throw error(400, 'Invalid GitHub URL. Expected: https://github.com/owner/repo');

	// ── Validate GitHub token has repo access + detect default branch ─
	let resolvedBranch = typeof branch === 'string' && branch ? branch : '';
	try {
		const repoCheck = await fetch(
			`https://api.github.com/repos/${parsed.owner}/${parsed.repo}`,
			{
				headers: {
					Authorization: `token ${githubToken}`,
					Accept: 'application/vnd.github.v3+json',
					'User-Agent': 'Noelle-API'
				}
			}
		);
		if (repoCheck.status === 401) throw error(401, 'Invalid GitHub token');
		if (repoCheck.status === 403) throw error(403, 'GitHub token lacks repo access');
		if (repoCheck.status === 404) throw error(404, 'Repository not found or token lacks access');
		if (!repoCheck.ok) throw error(502, `GitHub API error: ${repoCheck.status}`);

		// Auto-detect default branch when the caller didn't specify one
		if (!resolvedBranch) {
			const repoData = await repoCheck.json();
			resolvedBranch = repoData.default_branch || 'main';
		}
	} catch (e: unknown) {
		// Re-throw SvelteKit errors (from our throw error() calls above)
		if (e && typeof e === 'object' && 'status' in e) throw e;
		throw error(502, 'Failed to validate GitHub token');
	}

	// Final fallback (should never happen, but safety net)
	if (!resolvedBranch) resolvedBranch = 'main';

	const images = Array.isArray(screenshots) ? screenshots : [];
	const imageAttachments: ImageAttachment[] | undefined = images.length > 0 ? images : undefined;

	// ── Resolve job ID ───────────────────────────────────────────
	// Use the client-provided ID (pre-generated for instant navigation) or create one.
	const jobId =
		typeof clientJobId === 'string' && /^job-[0-9a-f-]{36}$/.test(clientJobId)
			? clientJobId
			: `job-${crypto.randomUUID()}`;
	const now = Date.now();

	// ── Persist job to D1 immediately ────────────────────────────
	// This must happen before we return so the dashboard page can load the job.
	try {
		await db.prepare(
			`INSERT INTO retool_jobs (id, user_id, github_owner, github_repo, branch, prompt, status, created_at, updated_at)
			 VALUES (?, ?, ?, ?, ?, ?, 'queued', ?, ?)`
		)
			.bind(jobId, user.id, parsed.owner, parsed.repo, resolvedBranch, prompt, now, now)
			.run();
	} catch (e) {
		console.error('[db] Failed to persist job to D1:', e);
		throw error(500, `Database error: ${e instanceof Error ? e.message : String(e)}`);
	}

	// ── Build base RetoolsDeploymentMessage v1 (raw prompt) ──────
	// We send this immediately so the queue doesn't wait on orchestration.
	const deploymentMessage: RetoolsDeploymentMessage = {
		schema_version: RETOOLS_SCHEMA_VERSION,
		job_id: jobId,
		timestamp: new Date().toISOString(),
		repo_url: repoUrl,
		branch: resolvedBranch,
		github_token: githubToken,
		prompt: prompt,
		orchestrated_prompt: undefined,
		image_attachments: imageAttachments,
		user_email: user.email,
		user_name: user.email.split('@')[0]
	};

	// ── Send to builder queue immediately ────────────────────────
	try {
		await sendToQueue(deploymentMessage);
	} catch (e) {
		console.error('Queue send error:', e);
		await db.prepare(
			`UPDATE retool_jobs SET status = 'failed', error_message = ?, updated_at = ? WHERE id = ?`
		)
			.bind(`Queue error: ${String(e)}`, Date.now(), jobId)
			.run();
		throw error(500, 'Failed to enqueue deployment');
	}

	// ── Increment usage count (non-admin free users only) ────────
	if (!isAdmin) {
		await db
			.prepare(`UPDATE users SET usage_count = usage_count + 1, updated_at = ? WHERE id = ?`)
			.bind(Date.now(), user.id)
			.run();
	}

	// ── Run AI orchestration in the background ───────────────────
	// We fire-and-forget the multi-agent pipeline so it doesn't block the
	// response. If it produces an aiSummary we store it on the job record
	// for display in the dashboard detail view.
	const orchestrationTask = runOrchestration(prompt, images)
		.then(async (result) => {
			console.info(
				`[orchestrator] plan: ${result.plan.tasks.map((t) => t.role).join(' → ')}`
			);
			if (result.synthesized) {
				await db.prepare(
					`UPDATE retool_jobs SET ai_summary = ?, updated_at = ? WHERE id = ?`
				)
					.bind(result.synthesized, Date.now(), jobId)
					.run();
			}
		})
		.catch((e) => {
			console.warn('[orchestrator] background task failed:', e);
		});

	// Use platform.context.waitUntil if available (Cloudflare Pages / Vercel)
	// so the runtime keeps the function alive until orchestration completes.
	const ctx = (platform as { context?: { waitUntil?: (p: Promise<unknown>) => void } } | undefined)
		?.context;
	if (ctx?.waitUntil) {
		ctx.waitUntil(orchestrationTask);
	}

	return json({ id: jobId, status: 'queued' }, { status: 201 });
};

