<script lang="ts">
	import { Wrench } from 'lucide-svelte';

	let mobileOpen = $state(false);
</script>

<nav class="fixed top-0 inset-x-0 z-50 bg-white/80 dark:bg-surface-950/80 backdrop-blur-lg border-b border-surface-200 dark:border-surface-800">
	<div class="container-wide flex items-center justify-between h-16">
		<!-- Logo -->
		<a href="/" class="flex items-center gap-2 font-bold text-xl text-surface-900 dark:text-white">
			<Wrench class="w-6 h-6 text-brand-600" />
			Retools
		</a>

		<!-- Desktop links -->
		<div class="hidden md:flex items-center gap-8 text-sm font-medium text-surface-600 dark:text-surface-400">
			<a href="/#how-it-works" class="hover:text-brand-600 transition-colors">How It Works</a>
			<a href="/#use-cases" class="hover:text-brand-600 transition-colors">Use Cases</a>
			<a href="/dashboard" class="hover:text-brand-600 transition-colors">Dashboard</a>
		</div>

		<!-- CTA -->
		<div class="hidden md:flex items-center gap-3">
			<a href="/auth" class="btn-ghost text-sm">Sign In</a>
			<a href="/retool" class="btn-primary text-sm">Retool Your Site</a>
		</div>

		<!-- Mobile toggle -->
		<button class="md:hidden p-2" onclick={() => mobileOpen = !mobileOpen}>
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
		<div class="md:hidden border-t border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-950 p-4 space-y-3">
			<a href="/#how-it-works" class="block text-sm font-medium text-surface-600 dark:text-surface-400" onclick={() => mobileOpen = false}>How It Works</a>
			<a href="/#use-cases" class="block text-sm font-medium text-surface-600 dark:text-surface-400" onclick={() => mobileOpen = false}>Use Cases</a>
			<a href="/dashboard" class="block text-sm font-medium text-surface-600 dark:text-surface-400" onclick={() => mobileOpen = false}>Dashboard</a>
			<hr class="border-surface-200 dark:border-surface-800" />
			<a href="/auth" class="block text-sm font-medium text-surface-600 dark:text-surface-400">Sign In</a>
			<a href="/retool" class="btn-primary text-sm w-full text-center">Retool Your Site</a>
		</div>
	{/if}
</nav>

