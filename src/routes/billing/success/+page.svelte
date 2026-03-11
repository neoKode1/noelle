<script lang="ts">
	import Navbar from '$lib/components/Navbar.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import Icon from '@iconify/svelte';
</script>

<svelte:head>
	<title>Payment Successful | Noelle</title>
</svelte:head>

<Navbar />

<main class="pt-16 min-h-screen flex items-center justify-center relative overflow-hidden">
	<div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] hero-glow pointer-events-none opacity-30"></div>

	<div class="relative z-10 w-full max-w-md mx-auto px-4 py-16 text-center">
		<div class="glass-panel rounded-2xl p-10">
			<div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 mb-6">
				<Icon icon="ph:check-circle-bold" width="36" height="36" class="text-orange-400" />
			</div>

			<div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-mono tracking-widest uppercase mb-5">
				<span class="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse"></span>
				PAYMENT CONFIRMED
			</div>

			<h1 class="text-2xl font-semibold text-white mb-2">You're all set!</h1>
			<p class="text-slate-400 text-sm leading-relaxed mb-8">
				Your plan is now active. Head back to Noelle and start deploying.
			</p>

			<a href="/retool" class="btn-secondary inline-flex gap-2 items-center">
				Start Building <Icon icon="ph:arrow-right-bold" width="16" height="16" />
			</a>

			<p class="text-xs text-slate-600 mt-6">
				Questions? <a href="mailto:hello@thenoelle.app" class="text-slate-400 hover:text-white transition-colors underline underline-offset-2">hello@thenoelle.app</a>
			</p>
		</div>
	</div>
</main>

<Footer />

