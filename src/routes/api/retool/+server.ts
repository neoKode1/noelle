/**
 * POST /api/retool
 *
 * Accepts a GitHub repo URL + prompt, creates a retool job,
 * and dispatches the Pegasus workflow via GitHub Actions workflow_dispatch.
 */
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { parseGitHubUrl } from '$lib/types/retool';

const PEGASUS_REPO_OWNER = 'Nexartis';
const PEGASUS_REPO_NAME = 'pegasus-horizon-breakthrough';
const PEGASUS_WORKFLOW_FILE = 'deploy-worker.yml';
const DEPLOYMENT_SCHEMA_VERSION = 8;

export const POST: RequestHandler = async ({ request, platform }) => {
	const env = platform?.env;
	if (!env?.DB) throw error(503, 'Database not available');

	const body = await request.json();
	const { repoUrl, branch = 'main', prompt } = body;

	// ── Validate inputs ──────────────────────────────────────────
	if (!repoUrl || typeof repoUrl !== 'string') throw error(400, 'repoUrl is required');
	if (!prompt || typeof prompt !== 'string') throw error(400, 'prompt is required');

	const parsed = parseGitHubUrl(repoUrl);
	if (!parsed) throw error(400, 'Invalid GitHub URL. Expected: https://github.com/owner/repo');

	// ── Generate IDs ─────────────────────────────────────────────
	const jobId = crypto.randomUUID().replace(/-/g, '').slice(0, 21);
	const deploymentId = `rt_${jobId}`;
	const now = Date.now();

	// ── Insert job into DB ───────────────────────────────────────
	await env.DB.prepare(
		`INSERT INTO retool_jobs (id, user_id, github_owner, github_repo, branch, prompt, status, deployment_id, created_at, updated_at)
		 VALUES (?, ?, ?, ?, ?, ?, 'queued', ?, ?, ?)`
	)
		.bind(jobId, 'anonymous', parsed.owner, parsed.repo, branch, prompt, deploymentId, now, now)
		.run();

	// ── Build Pegasus deployment payload ─────────────────────────
	const domain = `${parsed.repo}-${jobId.slice(0, 8)}`;
	const deploymentPayload = {
		deployment_id: deploymentId,
		dispatch_namespace: 'retools-dispatch-namespace',
		domain: `${domain}.cubicubes.ai`,
		is_real_domain: false, // Preview → sandbox *.cubicubes.ai
		cubicube_id: null,
		base_type: null,
		base_ref: null,
		user_email: 'retools@nexartis.com',
		user_name: 'Retools',
		template_repo: {
			owner: parsed.owner,
			name: parsed.repo,
			ref: branch
		},
		addon_cubes: [],
		custom_cube_bundle: null,
		ai_prompt: prompt,
		ai_mode: 'pegasus_hb',
		schema_version: DEPLOYMENT_SCHEMA_VERSION,
		timestamp: new Date().toISOString()
	};

	// ── Get webhook URL for Pegasus callbacks ────────────────────
	const baseUrl = env.VITE_BASE_URL || 'https://retools.dev';
	const webhookUrl = `${baseUrl}/api/webhooks/pegasus`;

	// ── Dispatch GitHub Actions workflow ──────────────────────────
	let githubRunUrl: string | null = null;
	try {
		const githubPat = await env.GITHUB_PAT.get();
		const dispatchUrl = `https://api.github.com/repos/${PEGASUS_REPO_OWNER}/${PEGASUS_REPO_NAME}/actions/workflows/${PEGASUS_WORKFLOW_FILE}/dispatches`;

		const dispatchRes = await fetch(dispatchUrl, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${githubPat}`,
				Accept: 'application/vnd.github.v3+json',
				'Content-Type': 'application/json',
				'User-Agent': 'Retools/1.0'
			},
			body: JSON.stringify({
				ref: 'main',
				inputs: {
					branch_name: `retools-${domain}`,
					environment: 'pegasus-horizon-breakthrough',
					webhook_url: webhookUrl,
					deployment_payload: JSON.stringify(deploymentPayload),
					max_repair_attempts: '3'
				}
			})
		});

		if (!dispatchRes.ok) {
			const errText = await dispatchRes.text();
			console.error('GitHub dispatch failed:', dispatchRes.status, errText);
			// Update job as failed
			await env.DB.prepare(
				`UPDATE retool_jobs SET status = 'failed', error_message = ?, updated_at = ? WHERE id = ?`
			)
				.bind(`GitHub dispatch failed: ${dispatchRes.status}`, Date.now(), jobId)
				.run();
			throw error(502, 'Failed to dispatch build workflow');
		}

		githubRunUrl = `https://github.com/${PEGASUS_REPO_OWNER}/${PEGASUS_REPO_NAME}/actions`;
	} catch (e) {
		if (e && typeof e === 'object' && 'status' in e) throw e; // Re-throw SvelteKit errors
		console.error('Dispatch error:', e);
		await env.DB.prepare(
			`UPDATE retool_jobs SET status = 'failed', error_message = ?, updated_at = ? WHERE id = ?`
		)
			.bind(`Dispatch error: ${String(e)}`, Date.now(), jobId)
			.run();
		throw error(500, 'Internal error dispatching build');
	}

	// ── Update job with run URL ──────────────────────────────────
	if (githubRunUrl) {
		await env.DB.prepare(
			`UPDATE retool_jobs SET github_run_url = ?, updated_at = ? WHERE id = ?`
		)
			.bind(githubRunUrl, Date.now(), jobId)
			.run();
	}

	return json({ id: jobId, deploymentId, status: 'queued' }, { status: 201 });
};

