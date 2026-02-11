<script lang="ts">
	import Navbar from '$lib/components/Navbar.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import {
		FolderKanban,
		Clock,
		CheckCircle2,
		AlertCircle,
		Rocket,
		Ban,
		Plus,
		ExternalLink,
		MessageSquare,
		ChevronRight
	} from 'lucide-svelte';
	import { CATEGORY_LABELS, type RequestCategory } from '$lib/types/intake';

	// ── Types ──────────────────────────────────────────────────────────
	type ProjectStatus = 'submitted' | 'scoping' | 'in_progress' | 'review' | 'deployed' | 'cancelled';

	interface Project {
		id: string;
		companyName: string;
		description: string;
		categories: RequestCategory[];
		status: ProjectStatus;
		createdAt: string;
		updatedAt: string;
		previewUrl?: string;
		messageCount: number;
	}

	// ── Status config ─────────────────────────────────────────────────
	const STATUS_CONFIG: Record<ProjectStatus, { label: string; color: string; icon: typeof Clock }> = {
		submitted: { label: 'Submitted', color: 'bg-surface-200 text-surface-600 dark:bg-surface-700 dark:text-surface-300', icon: Clock },
		scoping: { label: 'Scoping', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400', icon: AlertCircle },
		in_progress: { label: 'In Progress', color: 'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-400', icon: FolderKanban },
		review: { label: 'Review', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400', icon: MessageSquare },
		deployed: { label: 'Deployed', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400', icon: Rocket },
		cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400', icon: Ban }
	};

	const PIPELINE: ProjectStatus[] = ['submitted', 'scoping', 'in_progress', 'review', 'deployed'];

	// ── Demo data (replaced by server load later) ─────────────────────
	let projects: Project[] = $state([
		{
			id: 'proj_001',
			companyName: 'Acme Corp',
			description: 'Rebuild our internal inventory dashboard with real-time stock tracking and automated reorder alerts.',
			categories: ['internal_tool', 'integration_api'],
			status: 'in_progress',
			createdAt: '2026-02-08',
			updatedAt: '2026-02-10',
			previewUrl: 'https://acme-inventory.retools-preview.dev',
			messageCount: 4
		},
		{
			id: 'proj_002',
			companyName: 'Bloom Studio',
			description: 'Update brand colors, typography, and add a new portfolio gallery section.',
			categories: ['style_visual', 'feature_addition'],
			status: 'scoping',
			createdAt: '2026-02-10',
			updatedAt: '2026-02-11',
			messageCount: 1
		},
		{
			id: 'proj_003',
			companyName: 'NovaPay',
			description: 'Full platform retool — migrate from legacy PHP to modern SvelteKit with Stripe integration.',
			categories: ['full_retool', 'integration_api'],
			status: 'submitted',
			createdAt: '2026-02-11',
			updatedAt: '2026-02-11',
			messageCount: 0
		}
	]);

	// ── Stats ──────────────────────────────────────────────────────────
	let stats = $derived({
		total: projects.length,
		active: projects.filter((p) => !['deployed', 'cancelled'].includes(p.status)).length,
		deployed: projects.filter((p) => p.status === 'deployed').length
	});

	function pipelineStep(status: ProjectStatus) {
		return PIPELINE.indexOf(status);
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
				<h1 class="text-2xl font-bold text-surface-900 dark:text-white">Your Projects</h1>
				<p class="text-surface-500 dark:text-surface-400 text-sm mt-1">
					{stats.active} active · {stats.deployed} deployed · {stats.total} total
				</p>
			</div>
			<a href="/intake" class="btn-primary gap-1 w-fit">
				<Plus class="w-4 h-4" /> New Project
			</a>
		</div>

		<!-- Pipeline overview (mini Kanban) -->
		<div class="hidden sm:grid grid-cols-5 gap-1 mb-8 bg-surface-200 dark:bg-surface-800 rounded-xl p-1">
			{#each PIPELINE as pipeStatus}
				{@const config = STATUS_CONFIG[pipeStatus]}
				{@const count = projects.filter((p) => p.status === pipeStatus).length}
				<div class="text-center py-2.5 px-2 rounded-lg {count > 0 ? 'bg-white dark:bg-surface-900' : 'bg-transparent'}">
					<div class="text-xs font-medium text-surface-500 dark:text-surface-400">{config.label}</div>
					<div class="text-lg font-bold text-surface-900 dark:text-white">{count}</div>
				</div>
			{/each}
		</div>

		<!-- Project cards -->
		{#if projects.length === 0}
			<div class="card text-center py-16">
				<FolderKanban class="w-12 h-12 text-surface-300 dark:text-surface-600 mx-auto mb-4" />
				<h2 class="text-lg font-semibold text-surface-900 dark:text-white mb-2">No projects yet</h2>
				<p class="text-surface-500 dark:text-surface-400 mb-6">Submit your first project to get started.</p>
				<a href="/intake" class="btn-primary">Start a Project</a>
			</div>
		{:else}
			<div class="space-y-4">
				{#each projects as project}
					{@const config = STATUS_CONFIG[project.status]}
					{@const Icon = config.icon}
					{@const step = pipelineStep(project.status)}
					<a href="/dashboard/{project.id}" class="card-hover block">
						<div class="flex flex-col sm:flex-row sm:items-center gap-4">
							<!-- Status + info -->
							<div class="flex-1 min-w-0">
								<div class="flex items-center gap-2 mb-1.5">
									<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold {config.color}">
										<Icon class="w-3 h-3" /> {config.label}
									</span>
									{#if project.messageCount > 0}
										<span class="text-xs text-surface-400 flex items-center gap-0.5">
											<MessageSquare class="w-3 h-3" /> {project.messageCount}
										</span>
									{/if}
								</div>
								<h3 class="text-base font-semibold text-surface-900 dark:text-white truncate">{project.companyName}</h3>
								<p class="text-sm text-surface-500 dark:text-surface-400 line-clamp-1 mt-0.5">{project.description}</p>
								<div class="flex flex-wrap gap-1.5 mt-2">
									{#each project.categories as cat}
										<span class="text-[11px] font-medium px-1.5 py-0.5 rounded bg-surface-100 dark:bg-surface-800 text-surface-500 dark:text-surface-400">{CATEGORY_LABELS[cat]}</span>
									{/each}
								</div>
							</div>
							<!-- Pipeline mini-bar + arrow -->
							<div class="flex items-center gap-3 flex-shrink-0">
								<div class="hidden md:flex items-center gap-0.5">
									{#each PIPELINE as _, i}
										<div class="w-6 h-1.5 rounded-full {i <= step ? 'bg-brand-500' : 'bg-surface-200 dark:bg-surface-700'}"></div>
									{/each}
								</div>
								{#if project.previewUrl}
									<a href={project.previewUrl} target="_blank" rel="noopener noreferrer" class="btn-ghost text-xs px-2 py-1 gap-0.5" onclick={(e) => e.stopPropagation()}>
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

