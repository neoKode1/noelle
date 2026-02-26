<script lang="ts">
	import Icon from '@iconify/svelte';
	let mobileOpen = $state(false);
</script>

<nav class="fixed top-0 w-full z-50 border-b border-white/5 bg-transparent transition-all duration-300">
	<div class="container-wide flex items-center justify-between h-16">
		<!-- Logo -->
		<a href="/" class="flex items-center group">
			<span class="text-white font-medium tracking-tight text-[1.75rem] group-hover:opacity-80 transition-opacity lowercase">noelle</span>
		</a>

		<!-- Desktop links -->
		<div class="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
			<a href="/#how-it-works" class="hover:text-white transition-colors">How It Works</a>
			<a href="/#use-cases" class="hover:text-white transition-colors">Use Cases</a>
			<a href="/mcp" class="hover:text-white transition-colors">MCP Servers</a>
			<a href="/agents/new" class="hover:text-white transition-colors">Build Agent</a>
			<a href="/dashboard" class="hover:text-white transition-colors">Dashboard</a>
		</div>

		<!-- CTA -->
		<div class="hidden md:flex items-center gap-3">
			<a href="/auth" class="text-slate-400 hover:text-white text-sm font-medium transition-colors">Sign In</a>
			<a href="/retool" class="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-medium rounded-full transition-all duration-300 shadow-lg shadow-brand-500/20">
				Build with Noelle
			</a>
		</div>

		<!-- Mobile toggle -->
		<button class="md:hidden p-2 text-slate-400 hover:text-white transition-colors" onclick={() => mobileOpen = !mobileOpen} aria-label={mobileOpen ? 'Close menu' : 'Open menu'}>
			{#if mobileOpen}
				<Icon icon="ph:x-bold" width="24" height="24" />
			{:else}
				<Icon icon="ph:list-bold" width="24" height="24" />
			{/if}
		</button>
	</div>

	<!-- Mobile menu -->
	{#if mobileOpen}
		<div class="md:hidden border-t border-white/5 bg-transparent p-4 space-y-3">
			<a href="/#how-it-works" class="block text-sm font-medium text-slate-400 hover:text-white transition-colors" onclick={() => mobileOpen = false}>How It Works</a>
			<a href="/#use-cases" class="block text-sm font-medium text-slate-400 hover:text-white transition-colors" onclick={() => mobileOpen = false}>Use Cases</a>
			<a href="/mcp" class="block text-sm font-medium text-slate-400 hover:text-white transition-colors" onclick={() => mobileOpen = false}>MCP Servers</a>
			<a href="/agents/new" class="block text-sm font-medium text-slate-400 hover:text-white transition-colors" onclick={() => mobileOpen = false}>Build Agent</a>
			<a href="/dashboard" class="block text-sm font-medium text-slate-400 hover:text-white transition-colors" onclick={() => mobileOpen = false}>Dashboard</a>
			<hr class="border-white/5" />
			<a href="/auth" class="block text-sm font-medium text-slate-400 hover:text-white transition-colors">Sign In</a>
			<a href="/retool" class="block text-center px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium rounded-full transition-all">Build with Noelle</a>
		</div>
	{/if}
</nav>

