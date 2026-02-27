<script lang="ts">
	import Navbar from '$lib/components/Navbar.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import Icon from '@iconify/svelte';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { STATUS_CONFIG, PIPELINE_STAGES, type RetoolJob, type JobStatus } from '$lib/types/retool';

	let job: RetoolJob | null = $state(null);
	let loading = $state(true);
	let queuing = $state(false); // true while job record hasn't been created yet
	let errorMsg = $state('');
	let refinePrompt = $state('');
	let refineToken = $state('');
	let refining = $state(false);
	let approving = $state(false);
	let approveError = $state('');
	let retryToken = $state('');
	let retrying = $state(false);
	let retryError = $state('');
	let dismissing = $state(false);

	const jobId = page.params.id;
	const IN_PROGRESS_STATUSES = ['queued', 'cloning', 'customizing', 'building', 'deploying'];
	const TERMINAL_STATUSES = ['deployed', 'failed', 'cancelled'];

	async function fetchJob() {
		try {
			const res = await fetch(`/api/jobs/${jobId}`);
			if (res.status === 404) {
				// Job record not created yet — keep polling silently.
				queuing = true;
				loading = false;
				return;
			}
			if (!res.ok) throw new Error('Job not found');
			queuing = false;
			job = await res.json();
		} catch { errorMsg = 'Failed to load job.'; }
		loading = false;
	}

	onMount(() => {
		let timer: ReturnType<typeof setTimeout>;

		// Adaptive polling: 2s while building, 15s while waiting for PR merge.
		// Stops entirely once the job reaches a terminal state.
		function scheduleNext() {
			const status = job?.status;
			if (status && TERMINAL_STATUSES.includes(status)) return; // terminal — stop
			if (!status && !queuing) return; // error state — stop

			const delay = !status || queuing || IN_PROGRESS_STATUSES.includes(status) ? 2000 : 15000;
			timer = setTimeout(async () => {
				await fetchJob();
				scheduleNext();
			}, delay);
		}

		// Await the first fetch before starting the poll loop so that
		// `queuing` and `job` are already set when scheduleNext runs its guard.
		fetchJob().then(() => scheduleNext());

		return () => clearTimeout(timer);
	});

	let currentStep = $derived.by(() => {
		const j = job as RetoolJob | null;
		if (!j) return -1;
		// When the job has reached a terminal state, push past the last stage so
		// all gears render as "done" (no active gear, no animate-ping, no fast spin).
		if (TERMINAL_STATUSES.includes(j.status)) return PIPELINE_STAGES.length;
		return PIPELINE_STAGES.indexOf(j.status as JobStatus);
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

	async function handleApprove() {
		if (!job || approving) return;
		approving = true;
		approveError = '';
		try {
			const res = await fetch(`/api/jobs/${job.id}/approve`, { method: 'POST' });
			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				approveError = data.message || 'Approval failed';
				return;
			}
			job = await res.json();
		} catch { approveError = 'Failed to approve job.'; }
		finally { approving = false; }
	}

	async function handleRetry() {
		if (!job || retrying || !retryToken.trim()) return;
		retrying = true;
		retryError = '';
		try {
			const res = await fetch(`/api/jobs/${job.id}/retry`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ github_token: retryToken })
			});
			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				retryError = data.message || 'Retry failed';
				return;
			}
			const data = await res.json();
			goto(`/dashboard/${data.id}`);
		} catch { retryError = 'Failed to submit retry.'; }
		finally { retrying = false; }
	}

	async function handleDismiss() {
		if (!job || dismissing) return;
		if (!confirm('Remove this job from the dashboard?')) return;
		dismissing = true;
		try {
			const res = await fetch(`/api/jobs/${job.id}`, { method: 'DELETE' });
			if (res.ok) goto('/dashboard');
		} catch { /* ignore */ }
		finally { dismissing = false; }
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
			<Icon icon="ph:arrow-left-bold" width="16" height="16" /> Back to Jobs
		</a>

		{#if loading}
			<div class="rounded-2xl relative overflow-hidden text-center py-20" style="background: linear-gradient(to bottom, #3f3f46 0%, #27272a 8%, #18181b 100%); box-shadow: 0 20px 40px -10px rgba(0,0,0,0.9), inset 0 2px 2px rgba(255,255,255,0.15), inset 0 -2px 4px rgba(0,0,0,0.8); border: 1px solid #111;">
				<div class="absolute inset-0 opacity-[0.15] pointer-events-none mix-blend-overlay" style="background-image: url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E');"></div>
				<div class="relative z-10">
					<div class="w-8 h-8 mx-auto mb-3 rounded-full border border-orange-500/30 animate-spin" style="border-top-color: #f97316; box-shadow: 0 0 8px rgba(249,115,22,0.3);"></div>
					<p class="text-zinc-500 text-sm font-mono tracking-wider">Loading job…</p>
				</div>
			</div>
		{:else if queuing}
			<div class="rounded-2xl relative overflow-hidden text-center py-20" style="background: linear-gradient(to bottom, #3f3f46 0%, #27272a 8%, #18181b 100%); box-shadow: 0 20px 40px -10px rgba(0,0,0,0.9), inset 0 2px 2px rgba(255,255,255,0.15), inset 0 -2px 4px rgba(0,0,0,0.8); border: 1px solid #111;">
				<div class="absolute inset-0 opacity-[0.15] pointer-events-none mix-blend-overlay" style="background-image: url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E');"></div>
				<div class="absolute inset-0 opacity-10 pointer-events-none" style="background-image: linear-gradient(rgba(249,115,22,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(249,115,22,0.4) 1px, transparent 1px); background-size: 14px 14px;"></div>
				<div class="relative z-10">
					<div class="w-8 h-8 mx-auto mb-3 rounded-full border border-orange-500/30 animate-spin" style="border-top-color: #f97316; box-shadow: 0 0 8px rgba(249,115,22,0.3);"></div>
					<span class="block text-[8px] font-mono text-orange-500/60 tracking-[0.3em] uppercase font-bold mb-2">SYS.INIT // QUEUING</span>
					<p class="text-white text-sm font-medium mb-1">Creating job…</p>
					<p class="text-zinc-500 text-xs">Queuing your build. You'll see the pipeline in a moment.</p>
				</div>
			</div>
		{:else if !job}
			<div class="rounded-2xl relative overflow-hidden text-center py-20" style="background: linear-gradient(to bottom, #3f3f46 0%, #27272a 8%, #18181b 100%); box-shadow: 0 20px 40px -10px rgba(0,0,0,0.9), inset 0 2px 2px rgba(255,255,255,0.15), inset 0 -2px 4px rgba(0,0,0,0.8); border: 1px solid #111;">
				<div class="absolute inset-0 opacity-[0.15] pointer-events-none mix-blend-overlay" style="background-image: url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E');"></div>
				<div class="relative z-10">
					<div class="w-10 h-10 mx-auto mb-3 rounded-full flex items-center justify-center" style="background: linear-gradient(145deg, #52525b 0%, #27272a 100%); border: 1px solid #18181b; box-shadow: inset 0 2px 4px rgba(0,0,0,0.8);">
						<div class="w-4 h-4 rounded-full bg-red-500/30 border border-red-900/50" style="box-shadow: 0 0 6px rgba(239,68,68,0.3);"></div>
					</div>
					<p class="text-zinc-400 text-sm font-mono">{errorMsg || 'Job not found.'}</p>
				</div>
			</div>
		{:else}
			<!-- Header -->
			<div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
				<div>
					<h1 class="text-xl font-medium text-white flex items-center gap-2 flex-wrap">
						<svg class="w-5 h-5 text-slate-400 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>
						{job.githubOwner}/{job.githubRepo}
						{#if job.branch !== 'main'}
							<span class="text-sm font-normal text-slate-500 flex items-center gap-1"><Icon icon="ph:git-branch-bold" width="14" height="14" />{job.branch}</span>
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
							<Icon icon="ph:monitor-bold" width="14" height="14" /> Live Preview
						</a>
					{/if}
					{#if job.prUrl}
						<a href={job.prUrl} target="_blank" rel="noopener noreferrer" class="btn-secondary gap-1.5 text-sm">
							<Icon icon="ph:git-pull-request-bold" width="14" height="14" /> View PR
						</a>
					{/if}
					{#if job.githubRunUrl}
						<a href={job.githubRunUrl} target="_blank" rel="noopener noreferrer" class="btn-ghost text-sm">
							Build Log
						</a>
					{/if}
					{#if TERMINAL_STATUSES.includes(job.status)}
						<button
							onclick={handleDismiss}
							disabled={dismissing}
							class="btn-ghost text-sm text-slate-500 hover:text-red-400 transition-colors">
							{dismissing ? 'Removing…' : 'Dismiss'}
						</button>
					{/if}
				</div>
			</div>

			<!-- Pipeline tracker — Noelle aesthetic -->
			<div class="rounded-2xl mb-6 relative overflow-hidden" style="background: linear-gradient(to bottom, #3f3f46 0%, #27272a 8%, #18181b 100%); box-shadow: 0 20px 40px -10px rgba(0,0,0,0.9), inset 0 2px 2px rgba(255,255,255,0.15), inset 0 -2px 4px rgba(0,0,0,0.8), inset 0 0 10px rgba(0,0,0,0.5); border: 1px solid #111;">
				<!-- Noise texture -->
				<div class="absolute inset-0 opacity-[0.15] pointer-events-none mix-blend-overlay" style="background-image: url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E');"></div>

				<!-- Panel header -->
				<div class="relative z-10 flex justify-between items-center px-5 pt-4 pb-3 border-b border-zinc-800/80">
					<div class="flex items-center gap-2.5">
						<div class="flex items-center justify-center w-4 h-4 rounded-full bg-zinc-900 border border-black shadow-[inset_0_1px_2px_rgba(255,255,255,0.1)]">
							<div class="w-1.5 h-1.5 bg-zinc-600 rounded-full shadow-[inset_0_1px_1px_rgba(0,0,0,1)] relative">
								<div class="absolute inset-0 m-auto w-full h-[0.5px] bg-black rotate-45"></div>
							</div>
						</div>
						<span class="text-[9px] font-mono text-zinc-500 tracking-[0.2em] uppercase font-bold" style="text-shadow: 0 1px 1px rgba(0,0,0,1);">BUILD.PIPELINE // AUTO</span>
					</div>
					<div class="flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] bg-zinc-950 border border-black shadow-[inset_0_2px_4px_rgba(0,0,0,1),_0_1px_1px_rgba(255,255,255,0.05)]">
						{#if job.status === 'failed'}
							<div class="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_6px_#ef4444]"></div>
							<span class="text-[9px] font-mono text-red-400 tracking-widest uppercase font-bold" style="text-shadow: 0 0 4px rgba(239,68,68,0.4);">Build.Failed</span>
						{:else if job.status === 'deployed'}
							<div class="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399,inset_0_1px_1px_rgba(255,255,255,0.8)]"></div>
							<span class="text-[9px] font-mono text-emerald-400 tracking-widest uppercase font-bold" style="text-shadow: 0 0 4px rgba(52,211,153,0.4);">Sys.Deployed</span>
						{:else if job.status === 'preview_ready' || job.status === 'approved'}
							<div class="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_6px_#22c55e,inset_0_1px_1px_rgba(255,255,255,0.8)] animate-pulse"></div>
							<span class="text-[9px] font-mono text-green-400 tracking-widest uppercase font-bold" style="text-shadow: 0 0 4px rgba(34,197,94,0.4);">Build.Ready</span>
						{:else}
							<div class="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_6px_#f97316,inset_0_1px_1px_rgba(255,255,255,0.8)] animate-pulse"></div>
							<span class="text-[9px] font-mono text-orange-400 tracking-widest uppercase font-bold" style="text-shadow: 0 0 4px rgba(249,115,22,0.4);">Sys.Running</span>
						{/if}
					</div>
				</div>

				<!-- Steps — Gear Chain -->
				<div class="relative z-10 flex items-end justify-between px-3 sm:px-5 py-5 overflow-x-auto">
					{#each PIPELINE_STAGES as stage, i}
						{@const done = i < currentStep}
						{@const active = i === currentStep}
						{@const gearColor = done ? '#f97316' : active ? '#fdba74' : '#3f3f46'}
						{@const gearGlow = done ? 'drop-shadow(0 0 5px rgba(249,115,22,0.7))' : active ? 'drop-shadow(0 0 10px rgba(249,115,22,1))' : 'none'}
						{@const shortLabel = (['QUEUE','CLONE','AI.EDIT','BUILD','PUSH','PR.RDY','LIVE'])[i] ?? stage}
						{@const isTerminal = job !== null && TERMINAL_STATUSES.includes(job.status)}
						{@const spinClass = !isTerminal && (done || active) ? (i % 2 === 0 ? 'gear-cw' : 'gear-ccw') : ''}
						{@const spinDuration = active ? '1.8s' : '5s'}

						<div class="flex flex-col items-center text-center shrink-0 px-0.5">
							<!-- Gear indicator -->
							<div class="relative flex items-center justify-center mb-2">
								<div class="origin-center {spinClass}"
									style="color: {gearColor}; filter: {gearGlow}; animation-duration: {spinDuration};">
									<Icon icon="ph:gear-six-bold" width="36" height="36" />
								</div>
								{#if active}
									<div class="absolute -inset-1 rounded-full border border-orange-500/40 animate-ping pointer-events-none" style="animation-duration: 2s;"></div>
								{/if}
							</div>
							<span class="text-[7px] font-mono font-bold text-zinc-700 tracking-widest mb-0.5">{String(i + 1).padStart(2, '0')}</span>
							<span class="text-[8px] font-mono uppercase tracking-wider font-bold leading-tight {done ? 'text-orange-500' : active ? 'text-orange-300' : 'text-zinc-700'}"
								style="{done || active ? 'text-shadow: 0 0 4px rgba(249,115,22,0.4);' : ''}">{shortLabel}</span>
						</div>

						{#if i < PIPELINE_STAGES.length - 1}
							<div class="shrink-0 self-center pb-8 flex-1 min-w-[4px] max-w-[20px]">
								<div class="h-px w-full {i < currentStep ? 'bg-orange-500/40' : 'bg-zinc-800'}"
									style="{i < currentStep ? 'box-shadow: 0 0 3px rgba(249,115,22,0.5);' : ''}"></div>
							</div>
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
								<Icon icon="ph:warning-bold" width="14" height="14" /> Error
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
								<Icon icon="ph:check-circle-bold" width="16" height="16" /> Your PR is ready
							</h2>
							<p class="text-sm text-slate-400 mb-5 leading-relaxed">
								We've pushed a branch with the AI changes and opened a pull request on your repo. Review the diff, approve, and merge through your own pipeline.
							</p>
							<div class="flex flex-wrap gap-3">
								{#if job.prUrl}
									<a href={job.prUrl} target="_blank" rel="noopener noreferrer" class="btn-secondary gap-2 inline-flex text-sm">
										<Icon icon="ph:git-pull-request-bold" width="14" height="14" /> View Pull Request
									</a>
								{/if}
								{#if job.previewUrl}
									<a href={job.previewUrl} target="_blank" rel="noopener noreferrer" class="btn-ghost gap-2 inline-flex text-sm">
										<Icon icon="ph:arrow-square-out-bold" width="14" height="14" /> Open Live Preview
									</a>
								{/if}
								<button
									onclick={handleApprove}
									disabled={approving}
									class="btn-primary gap-2 inline-flex text-sm"
								>
									{#if approving}
										<Icon icon="ph:spinner-bold" width="14" height="14" class="animate-spin" /> Approving…
									{:else}
										<Icon icon="ph:check-circle-bold" width="14" height="14" /> Approve & Deploy
									{/if}
								</button>
							</div>
							{#if approveError}
								<p class="mt-3 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{approveError}</p>
							{/if}
						</div>

						<!-- Live Preview iframe (only when a real hosted URL is available) -->
						{#if job.previewUrl}
							<div class="glass-panel rounded-xl overflow-hidden">
								<div class="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06]">
									<div class="flex items-center gap-2 text-xs text-slate-400">
										<Icon icon="ph:monitor-bold" width="14" height="14" />
										<span class="font-mono truncate max-w-xs">{job.previewUrl}</span>
									</div>
									<a href={job.previewUrl} target="_blank" rel="noopener noreferrer" class="text-xs text-slate-500 hover:text-white transition-colors flex items-center gap-1">
										<Icon icon="ph:arrow-square-out-bold" width="12" height="12" /> Open
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

					<!-- Deployed celebration -->
					{#if job.status === 'deployed'}
						<div class="rounded-2xl relative overflow-hidden" style="background: linear-gradient(to bottom, #064e3b 0%, #022c22 40%, #18181b 100%); box-shadow: 0 20px 40px -10px rgba(0,0,0,0.9), inset 0 2px 2px rgba(255,255,255,0.1), inset 0 -2px 4px rgba(0,0,0,0.8); border: 1px solid #064e3b;">
							<div class="absolute inset-0 opacity-[0.08] pointer-events-none mix-blend-overlay" style="background-image: url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E');"></div>
							<div class="absolute inset-0 opacity-[0.06] pointer-events-none" style="background-image: linear-gradient(rgba(52,211,153,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(52,211,153,0.5) 1px, transparent 1px); background-size: 14px 14px;"></div>
							<div class="relative z-10 p-8 text-center">
								<div class="w-14 h-14 mx-auto mb-5 rounded-full flex items-center justify-center" style="background: linear-gradient(145deg, #065f46 0%, #022c22 100%); box-shadow: 0 0 24px rgba(52,211,153,0.4), inset 0 2px 2px rgba(255,255,255,0.2); border: 1px solid #064e3b;">
									<Icon icon="ph:check-fat-bold" width="24" height="24" class="text-emerald-400" style="filter: drop-shadow(0 0 6px rgba(52,211,153,0.8));" />
								</div>
								<span class="block text-[8px] font-mono text-emerald-500/70 tracking-[0.35em] uppercase font-bold mb-2">SYS.COMPLETE // MERGED</span>
								<h2 class="text-xl font-semibold text-white mb-2" style="text-shadow: 0 0 20px rgba(52,211,153,0.3);">Changes Deployed</h2>
								<p class="text-sm text-emerald-200/60 mb-6">The PR was merged and your code is live.</p>
								<div class="flex flex-wrap gap-3 justify-center">
									{#if job.productionUrl}
										<a href={job.productionUrl} target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-emerald-900 bg-emerald-400 hover:bg-emerald-300 transition-colors" style="box-shadow: 0 0 12px rgba(52,211,153,0.3);">
											<Icon icon="ph:rocket-launch-bold" width="14" height="14" /> View Production
										</a>
									{/if}
									{#if job.prUrl}
										<a href={job.prUrl} target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-emerald-300 border border-emerald-700/50 hover:border-emerald-500 transition-colors bg-emerald-900/20">
											<Icon icon="ph:git-merge-bold" width="14" height="14" /> Merged PR
										</a>
									{/if}
								</div>
							</div>
						</div>
					{/if}

					<!-- Retry (failed only) -->
					{#if job.status === 'failed'}
						<div class="glass-panel rounded-xl p-6 border border-red-500/20">
							<h2 class="text-sm font-medium text-white mb-1 flex items-center gap-2">
								<Icon icon="ph:arrow-counter-clockwise-bold" width="16" height="16" class="text-red-400" /> Retry
							</h2>
							<p class="text-xs text-slate-500 mb-4 leading-relaxed">
								Re-queue this job with the same prompt and repo. Provide your GitHub token to start a fresh build.
							</p>
							{#if retryError}
								<div class="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-3">{retryError}</div>
							{/if}
							<div class="space-y-3">
								<div>
									<label class="form-label" for="retry-token">GitHub Token</label>
									<input
										id="retry-token"
										type="password"
										class="form-input font-mono"
										placeholder="ghp_xxxxxxxxxxxx"
										bind:value={retryToken}
										disabled={retrying}
									/>
								</div>
								<button class="btn-secondary gap-2" onclick={handleRetry} disabled={retrying || !retryToken.trim()}>
									{#if retrying}
										<Icon icon="ph:spinner-bold" width="16" height="16" class="animate-spin" /> Retrying…
									{:else}
										<Icon icon="ph:arrow-counter-clockwise-bold" width="16" height="16" /> Retry Build
									{/if}
								</button>
							</div>
						</div>
					{/if}

					<!-- Refine -->
					{#if ['preview_ready', 'deployed', 'failed'].includes(job.status)}
						<div class="glass-panel rounded-xl p-6">
							<h2 class="text-sm font-medium text-white mb-1 flex items-center gap-2">
								<Icon icon="ph:arrows-counter-clockwise-bold" width="16" height="16" class="text-brand-400" /> Refine
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
										<Icon icon="ph:spinner-bold" width="16" height="16" class="animate-spin" /> Submitting…
									{:else}
										<Icon icon="ph:paper-plane-right-bold" width="16" height="16" /> Submit Refinement
									{/if}
								</button>
							</div>
						</div>
					{/if}

					<!-- In-progress state — Noelle aesthetic -->
					{#if IN_PROGRESS_STATUSES.includes(job.status)}
						<div class="rounded-2xl relative overflow-hidden py-12 px-6 text-center" style="background: linear-gradient(to bottom, #3f3f46 0%, #27272a 8%, #18181b 100%); box-shadow: 0 20px 40px -10px rgba(0,0,0,0.9), inset 0 2px 2px rgba(255,255,255,0.15), inset 0 -2px 4px rgba(0,0,0,0.8), inset 0 0 10px rgba(0,0,0,0.5); border: 1px solid #111;">
							<!-- Noise texture -->
							<div class="absolute inset-0 opacity-[0.15] pointer-events-none mix-blend-overlay" style="background-image: url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E');"></div>
							<!-- Orange grid -->
							<div class="absolute inset-0 opacity-10 z-0 pointer-events-none" style="background-image: linear-gradient(rgba(249,115,22,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(249,115,22,0.4) 1px, transparent 1px); background-size: 14px 14px; background-position: -1px -1px;"></div>

							<div class="relative z-10 flex flex-col items-center">
								<!-- Radar-style indicator -->
								<div class="relative w-16 h-16 mb-5">
									<div class="absolute inset-0 rounded-full border border-orange-500/20"></div>
									<div class="absolute inset-[8px] rounded-full border border-orange-500/20"></div>
									<div class="absolute top-0 bottom-0 left-1/2 w-[1px] bg-orange-500/20"></div>
									<div class="absolute left-0 right-0 top-1/2 h-[1px] bg-orange-500/20"></div>
									<div class="absolute inset-0 origin-center rounded-full animate-spin" style="background: conic-gradient(from 0deg, transparent 65%, rgba(249,115,22,0.2) 85%, rgba(249,115,22,0.85) 100%); animation-duration: 2s;"></div>
									<div class="absolute inset-0 flex items-center justify-center">
										<div class="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-[0_0_10px_#f97316,inset_0_1px_2px_rgba(255,255,255,0.8)]"></div>
									</div>
								</div>

								<span class="block text-[8px] font-mono text-orange-500/70 tracking-[0.3em] uppercase font-bold mb-2" style="text-shadow: 0 0 4px rgba(249,115,22,0.3);">AI.ENGINE // ACTIVE</span>
								<h2 class="text-base font-medium text-white mb-1" style="text-shadow: 0 1px 2px rgba(0,0,0,0.8);">Build in progress</h2>
								<p class="text-sm text-zinc-400">Your repo is being retooled. This page will update when the PR is ready.</p>
							</div>
						</div>
					{/if}
				</div>
			</div>
		{/if}
	</div>
</main>

<Footer />


<style>
	@keyframes gear-cw {
		from { transform: rotate(0deg); }
		to   { transform: rotate(360deg); }
	}
	@keyframes gear-ccw {
		from { transform: rotate(0deg); }
		to   { transform: rotate(-360deg); }
	}
	.gear-cw  { animation: gear-cw  3s linear infinite; }
	.gear-ccw { animation: gear-ccw 3s linear infinite; }
</style>
