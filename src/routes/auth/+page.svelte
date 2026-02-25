<script lang="ts">
	import Navbar from '$lib/components/Navbar.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import { ArrowRight, LoaderCircle } from 'lucide-svelte';

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

<main class="pt-16 min-h-screen flex items-center justify-center relative overflow-hidden">
	<!-- Background glow -->
	<div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] hero-glow pointer-events-none opacity-40"></div>

	<div class="relative z-10 w-full max-w-md mx-auto px-4 py-12">
		{#if sent}
			<!-- Success state -->
			<div class="glass-panel rounded-2xl p-10 text-center">
				<div class="text-5xl mb-5">✉️</div>
				<h1 class="text-xl font-medium text-white mb-2">Check your email</h1>
				<p class="text-slate-400 text-sm leading-relaxed mb-6">
					We sent a magic link to <strong class="text-white">{email}</strong>. Click it to sign in.
				</p>
				<button type="button" class="btn-ghost text-sm" onclick={() => { sent = false; email = ''; }}>
					Use a different email
				</button>
			</div>
		{:else}
			<!-- Sign-in card -->
			<div class="glass-panel rounded-2xl p-8">
				<!-- Logo -->
				<div class="flex flex-col items-center mb-8">
					<div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-500 to-purple-500 flex items-center justify-center text-white font-semibold text-base mb-4 shadow-lg shadow-brand-500/30">R</div>
					<h1 class="text-xl font-medium text-white tracking-tight">Sign in to Retools</h1>
					<p class="text-slate-500 text-sm mt-1">Enter your email — we'll send a magic link.</p>
				</div>

				<form onsubmit={(e) => { e.preventDefault(); handleLogin(); }} class="space-y-4">
					<div>
						<label for="email" class="form-label">Email address</label>
						<input
							id="email"
							type="email"
							class="form-input"
							placeholder="you@company.com"
							bind:value={email}
							required
							disabled={sending}
						/>
					</div>

					<button type="submit" class="btn-secondary w-full gap-2 mt-2" disabled={sending || !email.trim()}>
						{#if sending}
							<LoaderCircle class="w-4 h-4 animate-spin" /> Sending…
						{:else}
							Send Magic Link <ArrowRight class="w-4 h-4" />
						{/if}
					</button>
				</form>

				<p class="text-xs text-slate-600 text-center mt-6">
					By signing in you agree to our
					<a href="/legal/terms" class="text-slate-400 hover:text-white transition-colors underline underline-offset-2">Terms</a> and
					<a href="/legal/privacy" class="text-slate-400 hover:text-white transition-colors underline underline-offset-2">Privacy Policy</a>.
				</p>
			</div>
		{/if}
	</div>
</main>

<Footer />

