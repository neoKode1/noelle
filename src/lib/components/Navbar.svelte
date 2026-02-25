<script lang="ts">
	let mobileOpen = $state(false);
</script>

<nav class="fixed top-0 w-full z-50 border-b border-white/5 bg-[#030304]/80 backdrop-blur-md transition-all duration-300">
	<div class="container-wide flex items-center justify-between h-16">
		<!-- Logo -->
		<a href="/" class="flex items-center gap-2 group">
			<div class="w-6 h-6 rounded bg-gradient-to-tr from-brand-500 to-purple-500 flex items-center justify-center text-white text-[10px] font-semibold tracking-tighter">R</div>
			<span class="text-white font-medium tracking-tight text-sm group-hover:opacity-80 transition-opacity uppercase">Retools</span>
		</a>

		<!-- Desktop links -->
		<div class="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
			<a href="/#how-it-works" class="hover:text-white transition-colors">How It Works</a>
			<a href="/#use-cases" class="hover:text-white transition-colors">Use Cases</a>
			<a href="/dashboard" class="hover:text-white transition-colors">Dashboard</a>
		</div>

		<!-- CTA -->
		<div class="hidden md:flex items-center gap-3">
			<a href="/auth" class="text-slate-400 hover:text-white text-sm font-medium transition-colors">Sign In</a>
			<a href="/retool" class="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-medium rounded-full transition-all duration-300 shadow-lg shadow-brand-500/20">
				Retool My Site
			</a>
		</div>

		<!-- Mobile toggle -->
		<button class="md:hidden p-2 text-slate-400 hover:text-white transition-colors" onclick={() => mobileOpen = !mobileOpen}>
			<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				{#if mobileOpen}
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				{:else}
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
				{/if}
			</svg>
		</button>
	</div>

	<!-- Mobile menu -->
	{#if mobileOpen}
		<div class="md:hidden border-t border-white/5 bg-[#030304]/95 backdrop-blur-md p-4 space-y-3">
			<a href="/#how-it-works" class="block text-sm font-medium text-slate-400 hover:text-white transition-colors" onclick={() => mobileOpen = false}>How It Works</a>
			<a href="/#use-cases" class="block text-sm font-medium text-slate-400 hover:text-white transition-colors" onclick={() => mobileOpen = false}>Use Cases</a>
			<a href="/dashboard" class="block text-sm font-medium text-slate-400 hover:text-white transition-colors" onclick={() => mobileOpen = false}>Dashboard</a>
			<hr class="border-white/5" />
			<a href="/auth" class="block text-sm font-medium text-slate-400 hover:text-white transition-colors">Sign In</a>
			<a href="/retool" class="block text-center px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium rounded-full transition-all">Retool My Site</a>
		</div>
	{/if}
</nav>

