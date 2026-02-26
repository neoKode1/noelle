<script lang="ts">
	import Navbar from '$lib/components/Navbar.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import {
		ArrowLeft,
		CircleCheck,
		ExternalLink,
		GitBranch,
		GitPullRequest,
		LoaderCircle,
		Monitor,
		RefreshCcw,
		TriangleAlert,
		Send
	} from 'lucide-svelte';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { STATUS_CONFIG, PIPELINE_STAGES, type RetoolJob, type JobStatus } from '$lib/types/retool';

	let job: RetoolJob | null = $state(null);
	let loading = $state(true);
	let errorMsg = $state('');
	let refinePrompt = $state('');
	let refineToken = $state('');
	let refining = $state(false);

	const jobId = page.params.id;
	const IN_PROGRESS_STATUSES = ['queued', 'cloning', 'customizing', 'building', 'deploying'];

	async function fetchJob() {
		try {
			const res = await fetch(`/api/jobs/${jobId}`);
			if (!res.ok) throw new Error('Job not found');
			job = await res.json();
		} catch { errorMsg = 'Failed to load job.'; }
		loading = false;
	}

	onMount(() => {
		fetchJob();
		const interval = setInterval(async () => {
			if (job && IN_PROGRESS_STATUSES.includes(job.status)) {
				await fetchJob();
			} else if (job && !IN_PROGRESS_STATUSES.includes(job.status)) {
				clearInterval(interval);
			}
		}, 3000);
		return () => clearInterval(interval);
	});

	let currentStep = $derived.by(() => {
		const j = job as RetoolJob | null;
		return j !== null ? PIPELINE_STAGES.indexOf(j.status as JobStatus) : -1;
	});

	async function handleRefine() {
		if (!job || !refinePrompt.trim() || !refineToken.trim()) return;
		refining = true;
		errorMsg = '';
		try {
			const res = await fetch(`/api/jobs/${job.id}/refine`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ prompt: refinePrompt, github_token: refineToken })
			});
			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				errorMsg = data.message || 'Refine failed';
				return;
			}
			const data = await res.json();
			goto(`/dashboard/${data.id}`);
		} catch { errorMsg = 'Failed to submit refinement.'; }
		finally { refining = false; }
	}
</script>

<svelte:head>
	<title>{job ? `${job.githubOwner}/${job.githubRepo}` : 'Job'} | Noelle</title>
</svelte:head>

<Navbar />

<main class="pt-16 min-h-screen">
	<div class="container-content py-10 sm:py-16">
		<!-- Back link -->
		<a href="/dashboard" class="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-white transition-colors mb-8">
			<ArrowLeft class="w-4 h-4" /> Back to Jobs
		</a>

		{#if loading}
			<div class="glass-panel rounded-2xl text-center py-20">
				<LoaderCircle class="w-8 h-8 text-brand-400 mx-auto mb-3 animate-spin" />
				<p class="text-slate-500 text-sm">Loading job…</p>
			</div>
		{:else if !job}
			<div class="glass-panel rounded-2xl text-center py-20">
				<TriangleAlert class="w-10 h-10 text-red-400 mx-auto mb-3" />
				<p class="text-slate-500 text-sm">{errorMsg || 'Job not found.'}</p>
			</div>
		{:else}
			<!-- Header -->
			<div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
				<div>
					<h1 class="text-xl font-medium text-white flex items-center gap-2 flex-wrap">
						<svg class="w-5 h-5 text-slate-400 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>
						{job.githubOwner}/{job.githubRepo}
						{#if job.branch !== 'main'}
							<span class="text-sm font-normal text-slate-500 flex items-center gap-1"><GitBranch class="w-3.5 h-3.5" />{job.branch}</span>
						{/if}
					</h1>
					<div class="flex items-center flex-wrap gap-3 mt-2">
						<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border {STATUS_CONFIG[job.status].color}">
							{STATUS_CONFIG[job.status].label}
						</span>
						<span class="text-slate-600 text-xs">Created {new Date(job.createdAt).toLocaleDateString()}</span>
						{#if job.refinementCount > 0}
							<span class="text-xs text-slate-600">v{job.refinementCount + 1}</span>
						{/if}
					</div>
				</div>
				<div class="flex gap-2 flex-shrink-0 flex-wrap">
					{#if job.previewUrl}
						<a href={job.previewUrl} target="_blank" rel="noopener noreferrer" class="btn-secondary gap-1.5 text-sm">
							<Monitor class="w-3.5 h-3.5" /> Live Preview
						</a>
					{/if}
					{#if job.prUrl}
						<a href={job.prUrl} target="_blank" rel="noopener noreferrer" class="btn-secondary gap-1.5 text-sm">
							<GitPullRequest class="w-3.5 h-3.5" /> View PR
						</a>
					{/if}
					{#if job.githubRunUrl}
						<a href={job.githubRunUrl} target="_blank" rel="noopener noreferrer" class="btn-ghost text-sm">
							Build Log
						</a>
					{/if}
				</div>
			</div>

			<!-- Pipeline tracker -->
			<div class="glass-panel rounded-xl p-5 mb-6">
				<div class="flex items-center">
					{#each PIPELINE_STAGES as stage, i}
						{@const config = STATUS_CONFIG[stage]}
						<div class="flex-1 flex flex-col items-center text-center">
							<div class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium mb-1.5 transition-colors
								{i <= currentStep ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/30' : 'bg-white/5 text-slate-600 border border-white/10'}">
								{#if i < currentStep}
									<CircleCheck class="w-3.5 h-3.5" />
								{:else}
									{i + 1}
								{/if}
							</div>
							<span class="text-[10px] font-medium transition-colors {i <= currentStep ? 'text-brand-400' : 'text-slate-600'}">{config.label}</span>
						</div>
						{#if i < PIPELINE_STAGES.length - 1}
							<div class="flex-1 h-px mx-1 -mt-4 transition-colors {i < currentStep ? 'bg-brand-500/60' : 'bg-white/5'}"></div>
						{/if}
					{/each}
				</div>
			</div>

			<!-- Two-column layout -->
			<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<!-- Left: Details -->
				<div class="lg:col-span-1 space-y-4">
					<div class="glass-panel rounded-xl p-5">
						<h2 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Prompt</h2>
						<p class="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{job.prompt}</p>
					</div>

					{#if job.aiSummary}
						<div class="glass-panel rounded-xl p-5">
							<h2 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">AI Summary</h2>
							<p class="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{job.aiSummary}</p>
						</div>
					{/if}

					{#if job.status === 'failed' && job.errorMessage}
						<div class="glass-panel rounded-xl p-5 border border-red-500/20 bg-red-500/5">
							<h2 class="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
								<TriangleAlert class="w-3.5 h-3.5" /> Error
							</h2>
							<p class="text-sm text-red-400 leading-relaxed">{job.errorMessage}</p>
						</div>
					{/if}
				</div>

				<!-- Right: Actions -->
				<div class="lg:col-span-2 space-y-5">
					<!-- PR Ready -->
					{#if job.status === 'preview_ready'}
						<div class="glass-panel rounded-xl p-6 border border-emerald-500/20 bg-emerald-500/5">
							<h2 class="text-sm font-medium text-emerald-400 mb-3 flex items-center gap-2">
								<CircleCheck class="w-4 h-4" /> Your PR is ready
							</h2>
							<p class="text-sm text-slate-400 mb-5 leading-relaxed">
								We've pushed a branch with the AI changes and opened a pull request on your repo. Review the diff, approve, and merge through your own pipeline.
							</p>
							<div class="flex flex-wrap gap-3">
								{#if job.prUrl}
									<a href={job.prUrl} target="_blank" rel="noopener noreferrer" class="btn-secondary gap-2 inline-flex text-sm">
										<GitPullRequest class="w-3.5 h-3.5" /> View Pull Request
									</a>
								{/if}
								{#if job.previewUrl}
									<a href={job.previewUrl} target="_blank" rel="noopener noreferrer" class="btn-ghost gap-2 inline-flex text-sm">
										<ExternalLink class="w-3.5 h-3.5" /> Open Live Preview
									</a>
								{/if}
							</div>
						</div>

						<!-- Live Preview iframe (only when a real hosted URL is available) -->
						{#if job.previewUrl}
							<div class="glass-panel rounded-xl overflow-hidden">
								<div class="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06]">
									<div class="flex items-center gap-2 text-xs text-slate-400">
										<Monitor class="w-3.5 h-3.5" />
										<span class="font-mono truncate max-w-xs">{job.previewUrl}</span>
									</div>
									<a href={job.previewUrl} target="_blank" rel="noopener noreferrer" class="text-xs text-slate-500 hover:text-white transition-colors flex items-center gap-1">
										<ExternalLink class="w-3 h-3" /> Open
									</a>
								</div>
								<iframe
									src={job.previewUrl}
									title="Live preview"
									class="w-full h-[520px] border-0 bg-white"
									loading="lazy"
									sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
								></iframe>
							</div>
						{/if}
					{/if}

					<!-- Refine -->
					{#if ['preview_ready', 'deployed', 'failed'].includes(job.status)}
						<div class="glass-panel rounded-xl p-6">
							<h2 class="text-sm font-medium text-white mb-1 flex items-center gap-2">
								<RefreshCcw class="w-4 h-4 text-brand-400" /> Refine
							</h2>
							<p class="text-xs text-slate-500 mb-4 leading-relaxed">
								Submit a new prompt to create a refined version. Your GitHub token is required again.
							</p>
							{#if errorMsg}
								<div class="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-3">{errorMsg}</div>
							{/if}
							<div class="space-y-3">
								<textarea
									class="form-input min-h-[100px] resize-y"
									placeholder="e.g. Make the pricing cards wider and add a dark mode toggle."
									bind:value={refinePrompt}
									disabled={refining}
								></textarea>
								<div>
									<label class="form-label" for="refine-token">GitHub Token</label>
									<input
										id="refine-token"
										type="password"
										class="form-input font-mono"
										placeholder="ghp_xxxxxxxxxxxx"
										bind:value={refineToken}
										disabled={refining}
									/>
								</div>
								<button class="btn-secondary gap-2" onclick={handleRefine} disabled={refining || !refinePrompt.trim() || !refineToken.trim()}>
									{#if refining}
										<LoaderCircle class="w-4 h-4 animate-spin" /> Submitting…
									{:else}
										<Send class="w-4 h-4" /> Submit Refinement
									{/if}
								</button>
							</div>
						</div>
					{/if}

					<!-- In-progress state -->
					{#if IN_PROGRESS_STATUSES.includes(job.status)}
						<div class="glass-panel rounded-xl text-center py-14">
							<LoaderCircle class="w-10 h-10 text-brand-400 mx-auto mb-4 animate-spin" />
							<h2 class="text-base font-medium text-white mb-1">Build in progress</h2>
							<p class="text-sm text-slate-500">Your repo is being retooled. This page will update when the PR is ready.</p>
						</div>
					{/if}
				</div>
			</div>
		{/if}
	</div>
</main>

<Footer />
