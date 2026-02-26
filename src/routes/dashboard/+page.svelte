<script lang="ts">
	import Navbar from '$lib/components/Navbar.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import { Plus, ChevronRight, GitBranch, LoaderCircle } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { STATUS_CONFIG, PIPELINE_STAGES, type RetoolJob, type JobStatus } from '$lib/types/retool';

	let jobs: RetoolJob[] = $state([]);
	let loading = $state(true);

	onMount(async () => {
		try {
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
	<title>Dashboard | Noelle</title>
</svelte:head>

<Navbar />

<main class="pt-16 min-h-screen">
	<div class="container-wide py-10 sm:py-16">

		<!-- Header -->
		<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
			<div>
				<h1 class="text-2xl font-medium text-white tracking-tight">Your Jobs</h1>
				<p class="text-slate-500 text-sm mt-1">
					{stats.active} active · {stats.ready} ready · {stats.total} total
				</p>
			</div>
			<a href="/retool" class="btn-secondary gap-2 w-fit text-sm">
				<Plus class="w-4 h-4" /> Build with Noelle
			</a>
		</div>

		<!-- Pipeline stats bar -->
		<div class="hidden sm:grid grid-cols-5 gap-1 mb-8 glass-panel rounded-xl p-1">
			{#each PIPELINE_STAGES as stage}
				{@const config = STATUS_CONFIG[stage]}
				{@const count = jobs.filter((j) => j.status === stage).length}
				<div class="text-center py-3 px-2 rounded-lg transition-colors {count > 0 ? 'bg-white/5' : 'bg-transparent'}">
					<div class="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{config.label}</div>
					<div class="text-lg font-medium text-white mt-0.5">{count}</div>
				</div>
			{/each}
		</div>

		<!-- Loading -->
		{#if loading}
			<div class="glass-panel rounded-2xl text-center py-20">
				<LoaderCircle class="w-8 h-8 text-brand-400 mx-auto mb-3 animate-spin" />
				<p class="text-slate-500 text-sm">Loading jobs…</p>
			</div>

		<!-- Empty state -->
		{:else if jobs.length === 0}
			<div class="glass-panel rounded-2xl text-center py-20">
				<div class="text-4xl mb-4">📂</div>
				<h2 class="text-lg font-medium text-white mb-2">No jobs yet</h2>
				<p class="text-slate-500 text-sm mb-8">Paste a repo URL and describe what you want changed.</p>
				<a href="/retool" class="btn-secondary">Build with Noelle</a>
			</div>

		{:else}
			<div class="space-y-3">
				{#each jobs as job}
					{@const config = STATUS_CONFIG[job.status]}
					{@const step = pipelineStep(job.status)}
					<div role="link" tabindex="0" onclick={() => window.location.href = `/dashboard/${job.id}`} onkeydown={(e) => e.key === 'Enter' && (window.location.href = `/dashboard/${job.id}`)} class="block glass-panel rounded-xl p-5 hover:bg-white/5 hover:border-brand-500/20 transition-all duration-200 group cursor-pointer">
						<div class="flex flex-col sm:flex-row sm:items-center gap-4">
							<!-- Info -->
							<div class="flex-1 min-w-0">
								<div class="flex items-center gap-2 mb-2">
									<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border {config.color}">
										{config.label}
									</span>
									{#if job.refinementCount > 0}
										<span class="text-xs text-slate-600">v{job.refinementCount + 1}</span>
									{/if}
								</div>
								<h3 class="text-sm font-medium text-white truncate flex items-center gap-1.5 mb-1">
									<svg class="w-3.5 h-3.5 shrink-0 text-slate-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>
									{job.githubOwner}/{job.githubRepo}
									{#if job.branch !== 'main'}
										<span class="text-[11px] text-slate-500 font-normal flex items-center gap-0.5">
											<GitBranch class="w-3 h-3" />{job.branch}
										</span>
									{/if}
								</h3>
								<p class="text-xs text-slate-500 line-clamp-1">{job.prompt}</p>
								<p class="text-[11px] text-slate-600 mt-1.5">{new Date(job.createdAt).toLocaleDateString()}</p>
							</div>

							<!-- Pipeline mini-bar + action -->
							<div class="flex items-center gap-4 flex-shrink-0">
								<div class="hidden md:flex items-center gap-1">
									{#each PIPELINE_STAGES as _, i}
										<div class="w-5 h-1 rounded-full transition-colors {i <= step ? 'bg-brand-500' : 'bg-white/10'}"></div>
									{/each}
								</div>
								{#if job.previewUrl}
									<a href={job.previewUrl} target="_blank" rel="noopener noreferrer"
										class="text-xs px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-all"
										onclick={(e) => e.stopPropagation()}>
										View PR
									</a>
								{/if}
								<ChevronRight class="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</main>

<Footer />
