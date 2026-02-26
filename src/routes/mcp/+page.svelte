<script lang="ts">
	import Navbar from '$lib/components/Navbar.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import UnicornBackground from '$lib/components/UnicornBackground.svelte';
	import Icon from '@iconify/svelte';
	import MCPServerModal from '$lib/components/MCPServerModal.svelte';
	import { listServers, getCategories } from '$lib/data/mcp-registry';
	import { MCP_CATEGORY_LABELS } from '$lib/types/mcp';
	import type { MCPServerEntry, MCPCategory } from '$lib/types/mcp';

	// ── State ──────────────────────────────────────────────────────────────────
	let search = $state('');
	let activeCategory = $state<MCPCategory | 'all'>('all');
	let officialOnly = $state(false);
	let selectedServer = $state<MCPServerEntry | null>(null);

	const categories = getCategories();

	// ── Derived filtered list ───────────────────────────────────────────────
	const filtered = $derived(
		listServers({
			category: activeCategory === 'all' ? undefined : activeCategory,
			search: search.trim() || undefined,
			officialOnly
		})
	);

	function selectServer(s: MCPServerEntry) {
		selectedServer = s;
	}

	function closeModal() {
		selectedServer = null;
	}

	// Category pill display label
	function catLabel(cat: MCPCategory | 'all') {
		if (cat === 'all') return 'All';
		return MCP_CATEGORY_LABELS[cat];
	}
</script>

<svelte:head>
	<title>MCP Server Browser — Noelle</title>
	<meta name="description" content="Browse 30+ Model Context Protocol servers. Connect your AI agents to databases, dev tools, APIs, and more." />
</svelte:head>

<UnicornBackground />
<Navbar />

<main class="pt-16 min-h-screen">

	<!-- ═══ HERO ═══ -->
	<section class="pt-24 pb-12 relative">
		<div class="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] pointer-events-none"
			style="background: radial-gradient(ellipse 60% 50% at 50% 0%, rgba(99,102,241,0.15) 0%, transparent 70%);">
		</div>
		<div class="container-wide relative z-10 text-center">
			<div class="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand-500/30 bg-brand-500/10 text-brand-300 text-[11px] font-medium mb-6">
				<span class="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse"></span>
				Model Context Protocol Catalog
			</div>
			<h1 class="text-4xl md:text-6xl font-medium tracking-tight text-white mb-4">
				MCP Server Browser
			</h1>
			<p class="text-slate-400 text-lg max-w-2xl mx-auto mb-10">
				Connect your AI agents to any tool. Browse official and community MCP servers — databases, APIs, dev tools, and more.
			</p>

			<!-- Search -->
			<div class="max-w-xl mx-auto relative">
				<div class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
					<Icon icon="ph:magnifying-glass-bold" width="16" height="16" />
				</div>
				<input
					type="search"
					placeholder="Search servers, tools, databases…"
					bind:value={search}
					class="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-full text-white placeholder-slate-500 text-sm focus:outline-none focus:border-brand-500/50 focus:bg-white/8 transition-all"
				/>
			</div>
		</div>
	</section>

	<!-- ═══ FILTERS + GRID ═══ -->
	<section class="pb-24">
		<div class="container-wide">

			<!-- Filter bar -->
			<div class="flex flex-wrap items-center gap-2 mb-8">
				<!-- Category pills -->
				{#each ['all', ...categories] as cat}
					<button
						onclick={() => activeCategory = cat as MCPCategory | 'all'}
						class="px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 {activeCategory === cat
							? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20'
							: 'bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10'}"
					>
						{catLabel(cat as MCPCategory | 'all')}
					</button>
				{/each}

				<!-- Spacer -->
				<div class="flex-1"></div>

				<!-- Official toggle -->
				<label class="flex items-center gap-2 cursor-pointer text-xs text-slate-400 hover:text-white transition-colors select-none">
					<input type="checkbox" bind:checked={officialOnly} class="sr-only" />
					<div class="w-8 h-4.5 rounded-full transition-colors {officialOnly ? 'bg-brand-600' : 'bg-white/10'} relative">
						<div class="absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full bg-white transition-transform {officialOnly ? 'translate-x-3.5' : 'translate-x-0'}"></div>
					</div>
					Official only
				</label>

				<!-- Count -->
				<span class="text-xs text-slate-500">{filtered.length} server{filtered.length !== 1 ? 's' : ''}</span>
			</div>

			<!-- Grid -->
			{#if filtered.length === 0}
				<div class="text-center py-24 text-slate-500">
					<div class="mb-4 flex justify-center">
						<div class="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500">
							<Icon icon="ph:magnifying-glass-bold" width="28" height="28" />
						</div>
					</div>
					<p class="text-lg font-medium text-slate-400">No servers match your search</p>
					<p class="text-sm mt-1">Try adjusting your filters or search term</p>
				</div>
			{:else}
				<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
					{#each filtered as server (server.id)}
						<button
							onclick={() => selectServer(server)}
							class="group text-left glass-panel rounded-xl p-5 hover:border-brand-500/30 hover:bg-white/5 transition-all duration-200 flex flex-col gap-3 cursor-pointer"
						>
							<!-- Icon + official badge -->
							<div class="flex items-start justify-between gap-2">
								<span class="text-2xl leading-none" role="img" aria-label={server.name}>{server.icon ?? '🔌'}</span>
								{#if server.isOfficial}
									<span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-brand-500/20 text-brand-300 border border-brand-500/20 shrink-0 mt-0.5">OFFICIAL</span>
								{/if}
							</div>

							<!-- Name -->
							<div>
								<h3 class="text-sm font-semibold text-white group-hover:text-brand-200 transition-colors leading-tight">{server.name}</h3>
								<p class="text-xs text-slate-500 mt-0.5">{MCP_CATEGORY_LABELS[server.category]}</p>
							</div>

							<!-- Description -->
							<p class="text-xs text-slate-400 leading-relaxed line-clamp-2 flex-1">{server.description}</p>

							<!-- Tags -->
							{#if server.tags.length}
								<div class="flex flex-wrap gap-1">
									{#each server.tags.slice(0, 3) as tag}
										<span class="px-1.5 py-0.5 rounded text-[10px] bg-white/5 text-slate-500">{tag}</span>
									{/each}
									{#if server.tags.length > 3}
										<span class="px-1.5 py-0.5 rounded text-[10px] text-slate-600">+{server.tags.length - 3}</span>
									{/if}
								</div>
							{/if}

							<!-- Env count pill -->
							{#if server.requiredEnv.length}
								<div class="flex items-center gap-1 text-[10px] text-red-400/70">
									<Icon icon="ph:key-bold" width="12" height="12" />
									{server.requiredEnv.length} env var{server.requiredEnv.length !== 1 ? 's' : ''} required
								</div>
							{/if}
						</button>
					{/each}
				</div>
			{/if}
		</div>
	</section>

</main>

<Footer />

<!-- Server detail slide-over -->
<MCPServerModal server={selectedServer} onClose={closeModal} />

