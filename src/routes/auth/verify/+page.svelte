<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import Icon from '@iconify/svelte';

	type VerifyState = 'loading' | 'redirecting' | 'error';
	let status = $state<VerifyState>('loading');
	let errorMsg = $state('');

	onMount(() => {
		const token = page.url.searchParams.get('token') ?? '';

		if (!token) {
			status = 'error';
			errorMsg = 'No sign-in token found in this link. Please request a new one.';
			return;
		}

		// Redirect to the server-side verify handler — it sets the session cookie and
		// redirects to /retool on success, or /auth?error=... on failure.
		status = 'redirecting';
		window.location.href = `/api/auth/verify?token=${encodeURIComponent(token)}`;
	});
</script>

<svelte:head>
	<title>Verifying Sign-In | Noelle</title>
</svelte:head>

<main class="min-h-screen flex items-center justify-center relative overflow-hidden">
	<!-- Background glow -->
	<div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] hero-glow pointer-events-none opacity-30"></div>

	<div class="relative z-10 w-full max-w-sm mx-auto px-4 text-center">
		{#if status === 'loading' || status === 'redirecting'}
			<div class="glass-panel rounded-2xl p-10 flex flex-col items-center gap-5">
				<div class="w-14 h-14 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
					<Icon icon="ph:spinner-bold" width="28" height="28" class="text-brand-400 animate-spin" />
				</div>
				<div>
					<h1 class="text-white font-medium text-lg mb-1">Verifying your link…</h1>
					<p class="text-slate-500 text-sm">Hang tight — signing you in now.</p>
				</div>
			</div>
		{:else}
			<div class="glass-panel rounded-2xl p-10 flex flex-col items-center gap-5">
				<div class="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
					<Icon icon="ph:warning-circle-bold" width="28" height="28" class="text-red-400" />
				</div>
				<div>
					<h1 class="text-white font-medium text-lg mb-2">Link invalid</h1>
					<p class="text-slate-400 text-sm leading-relaxed mb-6">{errorMsg}</p>
					<a href="/auth" class="btn-secondary text-sm gap-2 inline-flex items-center">
						<Icon icon="ph:arrow-left-bold" width="14" height="14" />
						Request a new link
					</a>
				</div>
			</div>
		{/if}
	</div>
</main>

