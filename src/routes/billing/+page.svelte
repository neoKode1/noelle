<script lang="ts">
	import Navbar from '$lib/components/Navbar.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import Icon from '@iconify/svelte';

	let loading = $state(false);
	let errorMsg = $state('');

	async function startCheckout() {
		loading = true;
		errorMsg = '';
		try {
			const res = await fetch('/api/billing/checkout', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' }
			});
			const data = await res.json() as { url?: string; error?: string };
			if (res.status === 401) {
				window.location.href = '/auth';
				return;
			}
			if (data.url) {
				window.location.href = data.url;
			} else {
				errorMsg = data.error ?? 'Something went wrong. Please try again.';
			}
		} catch {
			errorMsg = 'Network error. Please try again.';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Upgrade | Noelle</title>
</svelte:head>

<Navbar />

<main class="pt-16 min-h-screen flex items-center justify-center relative overflow-hidden">
	<div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] hero-glow pointer-events-none opacity-30"></div>

	<div class="relative z-10 w-full max-w-2xl mx-auto px-4 py-16">
		<!-- Header -->
		<div class="text-center mb-12">
			<div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-mono tracking-widest uppercase mb-5">
				<Icon icon="ph:lightning-bold" width="12" height="12" /> Upgrade
			</div>
			<h1 class="text-3xl sm:text-4xl font-semibold text-white tracking-tight mb-3">Unlock Noelle</h1>
			<p class="text-slate-400 text-base max-w-sm mx-auto">
				You've used your 5 free deployments. Subscribe to keep shipping.
			</p>
		</div>

		<!-- Single plan -->
		<div class="max-w-sm mx-auto mb-8">
			<div class="glass-panel rounded-2xl p-8 border-orange-500/30 flex flex-col items-center text-center">
				<div class="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-5">
					<Icon icon="ph:crown-bold" width="22" height="22" class="text-orange-400" />
				</div>

				<div class="mb-1">
					<span class="text-5xl font-bold text-white">$19.99</span>
					<span class="text-slate-400 text-base ml-1">/ month</span>
				</div>
				<p class="text-slate-500 text-xs mb-7">Billed monthly · cancel anytime</p>

				<ul class="space-y-2.5 mb-8 w-full text-left">
					{#each ['Unlimited deployments', 'Priority build queue', 'Full AI pipeline (Claude + Gemini)', 'Email support'] as feat}
						<li class="flex items-center gap-2.5 text-slate-300 text-sm">
							<Icon icon="ph:check-circle-bold" width="15" height="15" class="text-orange-400 shrink-0" />
							{feat}
						</li>
					{/each}
				</ul>

				<button
					class="btn-secondary w-full gap-2 justify-center"
					onclick={startCheckout}
					disabled={loading}
				>
					{#if loading}
						<Icon icon="ph:spinner-bold" width="16" height="16" class="animate-spin" /> Processing…
					{:else}
						Subscribe Now <Icon icon="ph:arrow-right-bold" width="16" height="16" />
					{/if}
				</button>
			</div>
		</div>

		{#if errorMsg}
			<p class="text-center text-red-400 text-sm">{errorMsg}</p>
		{/if}

		<p class="text-center text-xs text-slate-600 mt-4">
			Payments processed securely by <span class="text-slate-400">Stripe</span>. Cancel anytime.
		</p>
	</div>
</main>

<Footer />

