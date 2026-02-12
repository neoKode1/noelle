/** ── Retool Job Types ────────────────────────────────────────── */

export type JobStatus =
	| 'queued'
	| 'cloning'
	| 'customizing'
	| 'building'
	| 'deploying'
	| 'preview_ready'
	| 'approved'
	| 'deployed'
	| 'failed'
	| 'cancelled';

export interface RetoolJob {
	id: string;
	userId: string;
	githubOwner: string;
	githubRepo: string;
	branch: string;
	prompt: string;
	status: JobStatus;
	previewUrl: string | null;
	productionUrl: string | null;
	deploymentId: string | null;
	githubRunId: string | null;
	githubRunUrl: string | null;
	aiSummary: string | null;
	errorMessage: string | null;
	parentJobId: string | null;
	refinementCount: number;
	createdAt: string;
	updatedAt: string;
}

export interface RetoolFormData {
	repoUrl: string;
	branch: string;
	prompt: string;
	github_token: string;
}

export const EMPTY_RETOOL_FORM: RetoolFormData = {
	repoUrl: '',
	branch: 'main',
	prompt: '',
	github_token: ''
};

/** Status display config for UI badges and icons. */
export const STATUS_CONFIG: Record<JobStatus, { label: string; color: string }> = {
	queued: { label: 'Queued', color: 'bg-surface-200 text-surface-600 dark:bg-surface-700 dark:text-surface-300' },
	cloning: { label: 'Cloning', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' },
	customizing: { label: 'AI Customizing', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400' },
	building: { label: 'Building', color: 'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-400' },
	deploying: { label: 'Pushing', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' },
	preview_ready: { label: 'PR Ready', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' },
	approved: { label: 'Approved', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' },
	deployed: { label: 'Deployed', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' },
	failed: { label: 'Failed', color: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400' },
	cancelled: { label: 'Cancelled', color: 'bg-surface-200 text-surface-500 dark:bg-surface-700 dark:text-surface-400' }
};

/** Pipeline stages shown in the tracker UI. */
export const PIPELINE_STAGES: JobStatus[] = [
	'queued', 'cloning', 'customizing', 'building', 'deploying', 'preview_ready'
];

/** Parse a GitHub URL into owner + repo. Returns null if invalid. */
export function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
	try {
		const cleaned = url.replace(/\.git$/, '').replace(/\/$/, '');
		const match = cleaned.match(/github\.com\/([^/]+)\/([^/]+)/);
		if (!match) return null;
		return { owner: match[1], repo: match[2] };
	} catch {
		return null;
	}
}

