<script lang="ts">
	import Navbar from '$lib/components/Navbar.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import { Mail, ArrowRight } from 'lucide-svelte';

	let email = $state('');
	let sent = $state(false);
	let sending = $state(false);

	async function handleLogin() {
		if (!email.trim()) return;
		sending = true;
		try {
			// TODO: wire to real auth endpoint
			await new Promise((r) => setTimeout(r, 1000));
			sent = true;
		} finally {
			sending = false;
		}
	}
</script>

<svelte:head>
	<title>Sign In | Retools</title>
</svelte:head>

<Navbar />

<main class="pt-16 min-h-screen bg-surface-50 dark:bg-surface-950 flex items-center justify-center">
	<div class="container-narrow py-12 sm:py-16">
		<div class="card max-w-md mx-auto text-center">
			{#if sent}
				<div class="py-8">
					<div class="text-4xl mb-4">✉️</div>
					<h1 class="text-xl font-bold text-surface-900 dark:text-white mb-2">Check your email</h1>
					<p class="text-surface-500 dark:text-surface-400 text-sm">
						We sent a magic link to <strong class="text-surface-700 dark:text-surface-200">{email}</strong>. Click it to sign in.
					</p>
					<button type="button" class="btn-ghost text-sm mt-6" onclick={() => { sent = false; email = ''; }}>
						Use a different email
					</button>
				</div>
			{:else}
				<div class="py-6">
					<div class="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400 mb-4">
						<Mail class="w-6 h-6" />
					</div>
					<h1 class="text-xl font-bold text-surface-900 dark:text-white mb-1">Sign in to Retools</h1>
					<p class="text-surface-500 dark:text-surface-400 text-sm mb-6">Enter your email and we'll send you a magic link.</p>

					<form onsubmit={(e) => { e.preventDefault(); handleLogin(); }} class="space-y-4">
						<input
							type="email"
							class="form-input text-center"
							placeholder="you@company.com"
							bind:value={email}
							required
						/>
						<button type="submit" class="btn-primary w-full gap-1" disabled={sending || !email.trim()}>
							{sending ? 'Sending…' : 'Send Magic Link'} <ArrowRight class="w-4 h-4" />
						</button>
					</form>

					<p class="text-xs text-surface-400 mt-4">
						By signing in you agree to our <a href="/legal/terms" class="underline hover:text-brand-500">Terms</a> and
						<a href="/legal/privacy" class="underline hover:text-brand-500">Privacy Policy</a>.
					</p>
				</div>
			{/if}
		</div>
	</div>
</main>

<Footer />

