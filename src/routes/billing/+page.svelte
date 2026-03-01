<script lang="ts">
	import Navbar from '$lib/components/Navbar.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import Icon from '@iconify/svelte';

	let loading = $state<'annual' | 'payg' | null>(null);
	let errorMsg = $state('');

	async function startCheckout(type: 'annual' | 'payg') {
		loading = type;
		errorMsg = '';
		try {
			const res = await fetch('/api/billing/checkout', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ type })
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
			loading = null;
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
				You've used your 5 free deployments. Keep shipping with a plan that fits.
			</p>
		</div>

		<!-- Plans grid -->
		<div class="grid sm:grid-cols-2 gap-5 mb-8">
			<!-- Annual plan -->
			<div class="glass-panel rounded-2xl p-7 border-orange-500/30 flex flex-col">
				<div class="flex items-center gap-2 mb-4">
					<div class="w-9 h-9 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
						<Icon icon="ph:crown-bold" width="18" height="18" class="text-orange-400" />
					</div>
					<span class="text-white font-medium">Annual</span>
					<span class="ml-auto text-xs px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 font-mono border border-orange-500/20">Best value</span>
				</div>
				<div class="mb-1">
					<span class="text-4xl font-bold text-white">$15</span>
					<span class="text-slate-400 text-sm ml-1">/ year</span>
				</div>
				<p class="text-slate-500 text-xs mb-5">~$1.25 / month · billed annually</p>
				<ul class="space-y-2 mb-6 flex-1">
					{#each ['Unlimited deployments', 'Priority build queue', 'Full AI pipeline (Claude + Gemini)', 'Email support'] as feat}
						<li class="flex items-center gap-2 text-slate-300 text-sm">
							<Icon icon="ph:check-circle-bold" width="14" height="14" class="text-orange-400 shrink-0" />
							{feat}
						</li>
					{/each}
				</ul>
				<button
					class="btn-secondary w-full gap-2 justify-center"
					onclick={() => startCheckout('annual')}
					disabled={loading !== null}
				>
					{#if loading === 'annual'}
						<Icon icon="ph:spinner-bold" width="16" height="16" class="animate-spin" /> Processing…
					{:else}
						Get Annual Access <Icon icon="ph:arrow-right-bold" width="16" height="16" />
					{/if}
				</button>
			</div>

			<!-- Pay-per-use -->
			<div class="glass-panel rounded-2xl p-7 flex flex-col">
				<div class="flex items-center gap-2 mb-4">
					<div class="w-9 h-9 rounded-lg bg-slate-700/50 border border-slate-600/30 flex items-center justify-center">
						<Icon icon="ph:coins-bold" width="18" height="18" class="text-slate-300" />
					</div>
					<span class="text-white font-medium">Pay-per-use</span>
				</div>
				<div class="mb-1">
					<span class="text-4xl font-bold text-white">$5</span>
					<span class="text-slate-400 text-sm ml-1">/ run</span>
				</div>
				<p class="text-slate-500 text-xs mb-5">One additional deployment, no subscription</p>
				<ul class="space-y-2 mb-6 flex-1">
					{#each ['Single extra deployment', 'Full AI pipeline', 'No commitment'] as feat}
						<li class="flex items-center gap-2 text-slate-300 text-sm">
							<Icon icon="ph:check-circle-bold" width="14" height="14" class="text-slate-400 shrink-0" />
							{feat}
						</li>
					{/each}
				</ul>
				<button
					class="btn-ghost w-full gap-2 justify-center"
					onclick={() => startCheckout('payg')}
					disabled={loading !== null}
				>
					{#if loading === 'payg'}
						<Icon icon="ph:spinner-bold" width="16" height="16" class="animate-spin" /> Processing…
					{:else}
						Buy One Run <Icon icon="ph:arrow-right-bold" width="16" height="16" />
					{/if}
				</button>
			</div>
		</div>

		{#if errorMsg}
			<p class="text-center text-red-400 text-sm">{errorMsg}</p>
		{/if}

		<p class="text-center text-xs text-slate-600 mt-4">
			Payments processed securely by <span class="text-slate-400">Stripe</span>. Cancel annual at any time.
		</p>
	</div>
</main>

<Footer />

