<script lang="ts">
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

	let mobileOpen = $state(false);
	let scrolled = $state(false);

	const links = [
		{ href: '/#how-it-works', label: 'How It Works' },
		{ href: '/#use-cases',    label: 'Use Cases'    },
		{ href: '/mcp',           label: 'MCP Servers'  },
		{ href: '/agents/new',    label: 'Build Agent'  },
		{ href: '/dashboard',     label: 'Dashboard'    },
	];

	onMount(() => {
		const onScroll = () => { scrolled = window.scrollY > 80; };
		window.addEventListener('scroll', onScroll, { passive: true });
		return () => window.removeEventListener('scroll', onScroll);
	});
</script>

<!-- ── Top bar ── -->
<nav class="fixed top-0 w-full z-50 border-b border-white/5 bg-transparent transition-all duration-300">
	<div class="container-wide flex items-center justify-between h-16">

		<!-- Logo -->
		<a href="/" class="flex items-center group">
			<span class="text-white font-medium tracking-tight text-[1.75rem] group-hover:opacity-80 transition-opacity lowercase">noelle</span>
		</a>

		<!-- Desktop center links — fade + slide up when scrolled -->
		<div class="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400 transition-all duration-500
			{scrolled ? 'opacity-0 -translate-y-3 pointer-events-none' : 'opacity-100 translate-y-0'}">
			{#each links as link}
				<a href={link.href} class="hover:text-white transition-colors">{link.label}</a>
			{/each}
		</div>

		<!-- CTA -->
		<div class="hidden md:flex items-center gap-3">
			<a href="/auth" class="text-slate-400 hover:text-white text-sm font-medium transition-colors">Sign In</a>
			<a href="/retool" class="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-medium rounded-full transition-all duration-300 shadow-lg shadow-brand-500/20">
				Build with Noelle
			</a>
		</div>

		<!-- Mobile toggle -->
		<button class="md:hidden p-2 text-slate-400 hover:text-white transition-colors"
			onclick={() => mobileOpen = !mobileOpen}
			aria-label={mobileOpen ? 'Close menu' : 'Open menu'}>
			{#if mobileOpen}
				<Icon icon="ph:x-bold" width="24" height="24" />
			{:else}
				<Icon icon="ph:list-bold" width="24" height="24" />
			{/if}
		</button>
	</div>

	<!-- Mobile menu -->
	{#if mobileOpen}
		<div class="md:hidden border-t border-white/5 bg-black/80 backdrop-blur-md p-4 space-y-3">
			{#each links as link}
				<a href={link.href}
					class="block text-sm font-medium text-slate-400 hover:text-white transition-colors"
					onclick={() => mobileOpen = false}>{link.label}</a>
			{/each}
			<hr class="border-white/5" />
			<a href="/auth" class="block text-sm font-medium text-slate-400 hover:text-white transition-colors">Sign In</a>
			<a href="/retool" class="block text-center px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium rounded-full transition-all">Build with Noelle</a>
		</div>
	{/if}
</nav>

<!-- ── Floating side nav — slides in from left on scroll ── -->
<aside class="fixed left-4 top-1/2 -translate-y-1/2 z-40 hidden md:flex flex-col transition-all duration-500
	{scrolled ? 'opacity-100 translate-x-0 pointer-events-auto' : 'opacity-0 -translate-x-6 pointer-events-none'}">
	<div class="flex flex-col gap-0.5 bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-1.5 shadow-xl shadow-black/40">
		{#each links as link}
			<a href={link.href}
				class="px-3 py-2 text-[11px] font-medium text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200 whitespace-nowrap tracking-wide">
				{link.label}
			</a>
		{/each}
	</div>
</aside>

