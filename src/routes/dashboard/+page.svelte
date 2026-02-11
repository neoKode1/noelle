<script lang="ts">
	import Navbar from '$lib/components/Navbar.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import {
		FolderKanban,
		Plus,
		ExternalLink,
		ChevronRight,
		Github,
		GitBranch,
		Loader2
	} from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { STATUS_CONFIG, PIPELINE_STAGES, type RetoolJob, type JobStatus } from '$lib/types/retool';

	let jobs: RetoolJob[] = $state([]);
	let loading = $state(true);

	onMount(async () => {
		try {
			// TODO: Replace with server load function when auth is added
			const res = await fetch('/api/jobs?all=1');
			if (res.ok) jobs = await res.json();
		} catch { /* empty */ }
		loading = false;
	});

	let stats = $derived({
		total: jobs.length,
		active: jobs.filter((j) => !['deployed', 'failed', 'cancelled'].includes(j.status)).length,
		ready: jobs.filter((j) => j.status === 'preview_ready').length
	});

	function pipelineStep(status: JobStatus) {
		return PIPELINE_STAGES.indexOf(status);
	}
</script>

<svelte:head>
	<title>Dashboard | Retools</title>
</svelte:head>

<Navbar />

<main class="pt-16 min-h-screen bg-surface-50 dark:bg-surface-950">
	<div class="container-wide py-8 sm:py-12">
		<!-- Header -->
		<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
			<div>
				<h1 class="text-2xl font-bold text-surface-900 dark:text-white">Your Jobs</h1>
				<p class="text-surface-500 dark:text-surface-400 text-sm mt-1">
					{stats.active} active · {stats.ready} ready · {stats.total} total
				</p>
			</div>
			<a href="/retool" class="btn-primary gap-1 w-fit">
				<Plus class="w-4 h-4" /> Retool a Site
			</a>
		</div>

		<!-- Pipeline overview -->
		<div class="hidden sm:grid grid-cols-5 gap-1 mb-8 bg-surface-200 dark:bg-surface-800 rounded-xl p-1">
			{#each PIPELINE_STAGES as stage}
				{@const config = STATUS_CONFIG[stage]}
				{@const count = jobs.filter((j) => j.status === stage).length}
				<div class="text-center py-2.5 px-2 rounded-lg {count > 0 ? 'bg-white dark:bg-surface-900' : 'bg-transparent'}">
					<div class="text-xs font-medium text-surface-500 dark:text-surface-400">{config.label}</div>
					<div class="text-lg font-bold text-surface-900 dark:text-white">{count}</div>
				</div>
			{/each}
		</div>

		<!-- Loading -->
		{#if loading}
			<div class="card text-center py-16">
				<Loader2 class="w-8 h-8 text-surface-400 mx-auto mb-3 animate-spin" />
				<p class="text-surface-500 dark:text-surface-400">Loading jobs…</p>
			</div>
		<!-- Empty state -->
		{:else if jobs.length === 0}
			<div class="card text-center py-16">
				<FolderKanban class="w-12 h-12 text-surface-300 dark:text-surface-600 mx-auto mb-4" />
				<h2 class="text-lg font-semibold text-surface-900 dark:text-white mb-2">No jobs yet</h2>
				<p class="text-surface-500 dark:text-surface-400 mb-6">Paste a repo URL and describe what you want changed.</p>
				<a href="/retool" class="btn-primary">Retool a Site</a>
			</div>
		{:else}
			<div class="space-y-4">
				{#each jobs as job}
					{@const config = STATUS_CONFIG[job.status]}
					{@const step = pipelineStep(job.status)}
					<a href="/dashboard/{job.id}" class="card-hover block">
						<div class="flex flex-col sm:flex-row sm:items-center gap-4">
							<!-- Status + info -->
							<div class="flex-1 min-w-0">
								<div class="flex items-center gap-2 mb-1.5">
									<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold {config.color}">
										{config.label}
									</span>
									{#if job.refinementCount > 0}
										<span class="text-xs text-surface-400">v{job.refinementCount + 1}</span>
									{/if}
								</div>
								<h3 class="text-base font-semibold text-surface-900 dark:text-white truncate flex items-center gap-1.5">
									<Github class="w-4 h-4 shrink-0" />
									{job.githubOwner}/{job.githubRepo}
									{#if job.branch !== 'main'}
										<span class="text-xs text-surface-400 font-normal flex items-center gap-0.5"><GitBranch class="w-3 h-3" />{job.branch}</span>
									{/if}
								</h3>
								<p class="text-sm text-surface-500 dark:text-surface-400 line-clamp-1 mt-0.5">{job.prompt}</p>
								<p class="text-xs text-surface-400 mt-1.5">{new Date(job.createdAt).toLocaleDateString()}</p>
							</div>
							<!-- Pipeline mini-bar + actions -->
							<div class="flex items-center gap-3 flex-shrink-0">
								<div class="hidden md:flex items-center gap-0.5">
									{#each PIPELINE_STAGES as _, i}
										<div class="w-6 h-1.5 rounded-full {i <= step ? 'bg-brand-500' : 'bg-surface-200 dark:bg-surface-700'}"></div>
									{/each}
								</div>
								{#if job.previewUrl}
									<a href={job.previewUrl} target="_blank" rel="noopener noreferrer" class="btn-ghost text-xs px-2 py-1 gap-0.5" onclick={(e) => e.stopPropagation()}>
										<ExternalLink class="w-3 h-3" /> Preview
									</a>
								{/if}
								<ChevronRight class="w-5 h-5 text-surface-400" />
							</div>
						</div>
					</a>
				{/each}
			</div>
		{/if}
	</div>
</main>

<Footer />
