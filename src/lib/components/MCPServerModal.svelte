<script lang="ts">
	import type { MCPServerEntry } from '$lib/types/mcp';
	import { MCP_CATEGORY_LABELS } from '$lib/types/mcp';

	interface Props {
		server: MCPServerEntry | null;
		onClose: () => void;
	}

	let { server, onClose }: Props = $props();

	let copied = $state<string | null>(null);

	function copy(text: string, key: string) {
		navigator.clipboard.writeText(text).then(() => {
			copied = key;
			setTimeout(() => (copied = null), 2000);
		});
	}

	function handleBackdrop(e: MouseEvent) {
		if (e.target === e.currentTarget) onClose();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onClose();
	}

	$effect(() => {
		if (server) {
			document.addEventListener('keydown', handleKeydown);
			document.body.style.overflow = 'hidden';
		} else {
			document.removeEventListener('keydown', handleKeydown);
			document.body.style.overflow = '';
		}
		return () => {
			document.removeEventListener('keydown', handleKeydown);
			document.body.style.overflow = '';
		};
	});

	const commandPreview = $derived(
		server ? `${server.command ?? 'npx'} ${(server.args ?? []).join(' ')}` : ''
	);
</script>

{#if server}
	<!-- Backdrop -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-50 flex items-end sm:items-center justify-end bg-black/60 backdrop-blur-sm"
		onclick={handleBackdrop}
	>
		<!-- Slide-over panel -->
		<div class="relative w-full sm:w-[520px] h-full sm:h-auto sm:max-h-[90vh] bg-[#08080c] border-l border-white/10 shadow-2xl overflow-y-auto flex flex-col">
			<!-- Header -->
			<div class="sticky top-0 z-10 bg-[#08080c]/95 backdrop-blur-md border-b border-white/8 px-6 py-4 flex items-start gap-4">
				<span class="text-3xl leading-none mt-0.5" role="img" aria-label={server.name}>{server.icon ?? '🔌'}</span>
				<div class="flex-1 min-w-0">
					<div class="flex items-center gap-2 flex-wrap">
						<h2 class="text-lg font-semibold text-white truncate">{server.name}</h2>
						{#if server.isOfficial}
							<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30 shrink-0">OFFICIAL</span>
						{/if}
					</div>
					<span class="text-xs text-slate-500">{MCP_CATEGORY_LABELS[server.category]}</span>
				</div>
				<button onclick={onClose} class="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors" aria-label="Close">
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
				</button>
			</div>

			<!-- Body -->
			<div class="flex-1 px-6 py-5 space-y-6">
				<!-- Description -->
				<p class="text-slate-300 text-sm leading-relaxed">{server.description}</p>

				<!-- Tags -->
				{#if server.tags.length}
					<div class="flex flex-wrap gap-1.5">
						{#each server.tags as tag}
							<span class="px-2 py-0.5 rounded-full text-[11px] bg-white/5 border border-white/8 text-slate-400">{tag}</span>
						{/each}
					</div>
				{/if}

				<!-- Command -->
				{#if server.command}
					<div>
						<div class="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-2">Run Command</div>
						<div class="flex items-center gap-2 bg-[#0d0d14] border border-white/8 rounded-lg px-3 py-2.5 font-mono text-xs text-emerald-300">
							<span class="flex-1 truncate">{commandPreview}</span>
							<button onclick={() => copy(commandPreview, 'cmd')} class="shrink-0 text-slate-500 hover:text-white transition-colors" aria-label="Copy command">
								{#if copied === 'cmd'}<span class="text-emerald-400 text-[10px]">Copied!</span>{:else}<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>{/if}
							</button>
						</div>
					</div>
				{/if}

				<!-- NPM Package -->
				{#if server.npmPackage}
					<div>
						<div class="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-2">NPM Package</div>
						<div class="flex items-center gap-2 bg-[#0d0d14] border border-white/8 rounded-lg px-3 py-2.5 font-mono text-xs text-slate-300">
							<span class="flex-1 truncate">{server.npmPackage}</span>
							<button onclick={() => copy(`npm install ${server!.npmPackage}`, 'npm')} class="shrink-0 text-slate-500 hover:text-white transition-colors" aria-label="Copy install command">
								{#if copied === 'npm'}<span class="text-emerald-400 text-[10px]">Copied!</span>{:else}<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>{/if}
							</button>
						</div>
					</div>
				{/if}

				<!-- Required Env Vars -->
				{#if server.requiredEnv.length}
					<div>
						<div class="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-2">Required Variables</div>
						<div class="space-y-1.5">
							{#each server.requiredEnv as envKey}
								<div class="flex items-center gap-2 bg-red-950/20 border border-red-500/15 rounded-lg px-3 py-2">
									<span class="font-mono text-xs text-red-300 flex-1">{envKey}</span>
									<button onclick={() => copy(envKey, envKey)} class="text-slate-500 hover:text-white transition-colors" aria-label="Copy variable name">
										{#if copied === envKey}<span class="text-emerald-400 text-[10px]">✓</span>{:else}<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>{/if}
									</button>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Optional Env Vars -->
				{#if server.optionalEnv.length}
					<div>
						<div class="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-2">Optional Variables</div>
						<div class="space-y-1.5">
							{#each server.optionalEnv as envKey}
								<div class="flex items-center gap-2 bg-white/3 border border-white/8 rounded-lg px-3 py-2">
									<span class="font-mono text-xs text-slate-400 flex-1">{envKey}</span>
									<button onclick={() => copy(envKey, `opt-${envKey}`)} class="text-slate-500 hover:text-white transition-colors" aria-label="Copy variable name">
										{#if copied === `opt-${envKey}`}<span class="text-emerald-400 text-[10px]">✓</span>{:else}<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>{/if}
									</button>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>

			<!-- Footer CTA -->
			<div class="sticky bottom-0 bg-[#08080c]/95 backdrop-blur-md border-t border-white/8 px-6 py-4 flex items-center gap-3">
				<a
					href="/agents/new?mcp={server.id}"
					class="flex-1 text-center py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold rounded-full transition-all duration-300 shadow-lg shadow-brand-500/20"
				>
					Add to Agent →
				</a>
				{#if server.documentationUrl}
					<a
						href={server.documentationUrl}
						target="_blank"
						rel="noopener noreferrer"
						class="px-4 py-2.5 bg-white/5 border border-white/10 text-slate-300 hover:text-white text-sm font-medium rounded-full transition-all duration-300"
					>
						Docs ↗
					</a>
				{/if}
			</div>
		</div>
	</div>
{/if}

