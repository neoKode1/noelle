<script lang="ts">
	import Navbar from '$lib/components/Navbar.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import {
		ArrowLeft,
		CheckCircle2,
		Github,
		GitBranch,
		Loader2,
		RefreshCcw,
		AlertTriangle,
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

		// Poll every 3 seconds while the job is in progress
		const interval = setInterval(async () => {
			if (job && IN_PROGRESS_STATUSES.includes(job.status)) {
				await fetchJob();
			} else if (job && !IN_PROGRESS_STATUSES.includes(job.status)) {
				clearInterval(interval);
			}
		}, 3000);

		return () => clearInterval(interval);
	});

	let currentStep = $derived(job ? PIPELINE_STAGES.indexOf(job.status as JobStatus) : -1);

	async function handleRefine() {
		if (!job || !refinePrompt.trim()) return;
		refining = true;
		try {
			const res = await fetch(`/api/jobs/${job.id}/refine`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ prompt: refinePrompt })
			});
			if (!res.ok) throw new Error('Refine failed');
			const data = await res.json();
			goto(`/dashboard/${data.id}`);
		} catch { errorMsg = 'Failed to submit refinement.'; }
		refining = false;
	}
</script>

<svelte:head>
	<title>{job ? `${job.githubOwner}/${job.githubRepo}` : 'Job'} | Retools</title>
</svelte:head>

<Navbar />

<main class="pt-16 min-h-screen bg-surface-50 dark:bg-surface-950">
	<div class="container-content py-8 sm:py-12">
		<!-- Back link -->
		<a href="/dashboard" class="inline-flex items-center gap-1 text-sm text-surface-500 dark:text-surface-400 hover:text-brand-600 dark:hover:text-brand-400 mb-6">
			<ArrowLeft class="w-4 h-4" /> Back to Jobs
		</a>

		{#if loading}
			<div class="card text-center py-16">
				<Loader2 class="w-8 h-8 text-surface-400 mx-auto mb-3 animate-spin" />
				<p class="text-surface-500">Loading job…</p>
			</div>
		{:else if !job}
			<div class="card text-center py-16">
				<AlertTriangle class="w-10 h-10 text-red-400 mx-auto mb-3" />
				<p class="text-surface-500">{errorMsg || 'Job not found.'}</p>
			</div>
		{:else}
			<!-- Header -->
			<div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
				<div>
					<h1 class="text-2xl font-bold text-surface-900 dark:text-white flex items-center gap-2">
						<Github class="w-6 h-6" />
						{job.githubOwner}/{job.githubRepo}
						{#if job.branch !== 'main'}
							<span class="text-sm font-normal text-surface-400 flex items-center gap-0.5"><GitBranch class="w-4 h-4" />{job.branch}</span>
						{/if}
					</h1>
					<div class="flex items-center gap-3 mt-2">
						<span class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold {STATUS_CONFIG[job.status].color}">
							{STATUS_CONFIG[job.status].label}
						</span>
						<span class="text-surface-400 text-sm">Created {new Date(job.createdAt).toLocaleDateString()}</span>
						{#if job.refinementCount > 0}
							<span class="text-xs text-surface-400">v{job.refinementCount + 1}</span>
						{/if}
					</div>
				</div>
				<div class="flex gap-2">
					{#if job.previewUrl}
						<a href={job.previewUrl} target="_blank" rel="noopener noreferrer" class="btn-primary gap-1 text-sm">
							<Github class="w-4 h-4" /> View PR
						</a>
					{/if}
					{#if job.githubRunUrl}
						<a href={job.githubRunUrl} target="_blank" rel="noopener noreferrer" class="btn-ghost gap-1 text-sm">
							Build Log
						</a>
					{/if}
				</div>
			</div>

			<!-- Pipeline tracker -->
			<div class="card mb-6">
				<div class="flex items-center justify-between">
					{#each PIPELINE_STAGES as stage, i}
						{@const config = STATUS_CONFIG[stage]}
						<div class="flex-1 flex flex-col items-center text-center">
							<div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mb-1
								{i <= currentStep
									? 'bg-brand-600 text-white'
									: 'bg-surface-200 dark:bg-surface-700 text-surface-400 dark:text-surface-500'}">
								{#if i < currentStep}
									<CheckCircle2 class="w-4 h-4" />
								{:else}
									{i + 1}
								{/if}
							</div>
							<span class="text-[11px] font-medium
								{i <= currentStep
									? 'text-brand-600 dark:text-brand-400'
									: 'text-surface-400 dark:text-surface-500'}">{config.label}</span>
						</div>
						{#if i < PIPELINE_STAGES.length - 1}
							<div class="flex-1 h-0.5 mx-1 -mt-4
								{i < currentStep ? 'bg-brand-500' : 'bg-surface-200 dark:bg-surface-700'}"></div>
						{/if}
					{/each}
				</div>
			</div>

			<!-- Two-column layout -->
			<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<!-- Left: Job details -->
				<div class="lg:col-span-1 space-y-6">
					<div class="card">
						<h2 class="text-sm font-semibold text-surface-900 dark:text-white mb-3">Prompt</h2>
						<p class="text-sm text-surface-600 dark:text-surface-400 leading-relaxed whitespace-pre-wrap">{job.prompt}</p>
					</div>

					{#if job.aiSummary}
						<div class="card">
							<h2 class="text-sm font-semibold text-surface-900 dark:text-white mb-2">AI Summary</h2>
							<p class="text-sm text-surface-600 dark:text-surface-400 leading-relaxed whitespace-pre-wrap">{job.aiSummary}</p>
						</div>
					{/if}

					{#if job.status === 'failed' && job.errorMessage}
						<div class="card border-red-300 dark:border-red-700">
							<h2 class="text-sm font-semibold text-red-600 dark:text-red-400 mb-2 flex items-center gap-1.5">
								<AlertTriangle class="w-4 h-4" /> Error
							</h2>
							<p class="text-sm text-red-600 dark:text-red-400">{job.errorMessage}</p>
						</div>
					{/if}
				</div>

				<!-- Right: Actions -->
				<div class="lg:col-span-2 space-y-6">
					<!-- PR Ready -->
					{#if job.status === 'preview_ready'}
						<div class="card border-emerald-300 dark:border-emerald-700">
							<h2 class="text-sm font-semibold text-emerald-700 dark:text-emerald-400 mb-3 flex items-center gap-1.5">
								<CheckCircle2 class="w-4 h-4" /> Your PR is ready
							</h2>
							<p class="text-sm text-surface-600 dark:text-surface-400 mb-4">
								We've pushed a branch with the AI changes and opened a pull request on your repo. Review the PR, then merge and deploy through your own pipeline.
							</p>
							{#if job.previewUrl}
								<a href={job.previewUrl} target="_blank" rel="noopener noreferrer" class="btn-primary gap-1 inline-flex">
									<Github class="w-4 h-4" /> View Pull Request
								</a>
							{/if}
						</div>
					{/if}

					<!-- Refine -->
					{#if ['preview_ready', 'deployed', 'failed'].includes(job.status)}
						<div class="card">
							<h2 class="text-sm font-semibold text-surface-900 dark:text-white mb-3 flex items-center gap-1.5">
								<RefreshCcw class="w-4 h-4 text-brand-500" /> Refine
							</h2>
							<p class="text-sm text-surface-500 dark:text-surface-400 mb-3">
								Submit a new prompt to create a refined version.
							</p>
							<textarea
								class="form-input min-h-[100px] mb-3"
								placeholder="e.g. The hero looks great, but make the pricing cards wider and add a dark mode toggle."
								bind:value={refinePrompt}
								disabled={refining}
							></textarea>
							<button class="btn-secondary gap-1" onclick={handleRefine} disabled={refining || !refinePrompt.trim()}>
								{#if refining}
									<Loader2 class="w-4 h-4 animate-spin" /> Submitting…
								{:else}
									<Send class="w-4 h-4" /> Submit Refinement
								{/if}
							</button>
						</div>
					{/if}

					<!-- Info card for in-progress states -->
					{#if ['queued', 'cloning', 'customizing', 'building', 'deploying'].includes(job.status)}
						<div class="card text-center py-12">
							<Loader2 class="w-10 h-10 text-brand-500 mx-auto mb-4 animate-spin" />
							<h2 class="text-lg font-semibold text-surface-900 dark:text-white mb-2">Build in progress</h2>
							<p class="text-sm text-surface-500 dark:text-surface-400">
								Your repo is being retooled. This page will update when the PR is ready.
							</p>
						</div>
					{/if}
				</div>
			</div>
		{/if}
	</div>
</main>

<Footer />
