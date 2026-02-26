<script lang="ts">
	import Navbar from '$lib/components/Navbar.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import { Send, LoaderCircle, CircleAlert, KeyRound } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { EMPTY_RETOOL_FORM, type RetoolFormData } from '$lib/types/retool';

	let form: RetoolFormData = $state({ ...EMPTY_RETOOL_FORM });
	let submitting = $state(false);
	let errorMsg = $state('');

	async function handleSubmit() {
		errorMsg = '';
		if (!form.repoUrl.trim()) { errorMsg = 'GitHub repo URL is required.'; return; }
		if (!form.github_token.trim()) { errorMsg = 'GitHub token is required.'; return; }
		if (!form.prompt.trim()) { errorMsg = 'Describe what you want changed.'; return; }

		submitting = true;
		try {
			const res = await fetch('/api/retool', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(form)
			});
			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				errorMsg = data.message || `Error ${res.status}`;
				return;
			}
			const { id } = await res.json();
			goto(`/dashboard/${id}`);
		} catch (e) {
			errorMsg = 'Network error. Please try again.';
		} finally {
			submitting = false;
		}
	}
</script>

<svelte:head>
	<title>Build with Noelle | Noelle</title>
</svelte:head>

<Navbar />

<main class="pt-16 min-h-screen">
	<!-- Background accent -->
	<div class="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] hero-glow pointer-events-none opacity-30"></div>

	<div class="relative container-narrow py-16 sm:py-24">
		<!-- Header -->
		<div class="text-center mb-10">
			<div class="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand-500/30 bg-brand-500/10 text-brand-300 text-[11px] font-medium mb-5">
				<span class="relative flex h-2 w-2">
					<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
					<span class="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
				</span>
				AI-Powered · PR Mode Only
			</div>
			<h1 class="text-4xl font-medium text-white tracking-tight mb-3">Retool Your Site</h1>
			<p class="text-slate-400 max-w-lg mx-auto text-sm leading-relaxed">
				Paste your GitHub repo, describe what you want changed, and we'll open a PR with the AI-generated results.
			</p>
		</div>

		<!-- Form card -->
		<div class="glass-panel rounded-2xl p-8 max-w-2xl mx-auto">
			<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-5">
				<!-- Repo URL -->
				<div>
					<label for="repoUrl" class="form-label">
						GitHub Repository URL
					</label>
					<input
						id="repoUrl"
						type="url"
						class="form-input"
						placeholder="https://github.com/your-org/your-repo"
						bind:value={form.repoUrl}
						disabled={submitting}
					/>
					<p class="text-xs text-slate-600 mt-1.5">Must be a public GitHub repo or one your account has access to.</p>
				</div>

				<!-- Branch -->
				<div>
					<label for="branch" class="form-label">Branch</label>
					<input
						id="branch"
						type="text"
						class="form-input"
						placeholder="main"
						bind:value={form.branch}
						disabled={submitting}
					/>
				</div>

				<!-- GitHub Token -->
				<div>
					<label for="github_token" class="form-label flex items-center gap-1.5">
						<KeyRound class="w-3.5 h-3.5" /> GitHub Personal Access Token
					</label>
					<input
						id="github_token"
						type="password"
						class="form-input font-mono tracking-wider"
						placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
						bind:value={form.github_token}
						disabled={submitting}
						autocomplete="off"
					/>
					<p class="text-xs text-slate-600 mt-1.5">
						Needs <code class="text-slate-400 bg-white/5 px-1 rounded text-[11px]">repo</code> scope. Used only to push a branch and open a PR — never stored.
						<a href="https://github.com/settings/tokens/new?scopes=repo&description=Retools" target="_blank" rel="noopener noreferrer" class="text-brand-400 hover:text-brand-300 underline underline-offset-2 ml-1">Create token →</a>
					</p>
				</div>

				<!-- Prompt -->
				<div>
					<label for="prompt" class="form-label">What do you want changed?</label>
					<textarea
						id="prompt"
						class="form-input min-h-[160px] resize-y"
						placeholder="e.g. Make the hero section darker with a gradient background. Add a pricing page with three tiers. Fix the mobile hamburger menu animation."
						bind:value={form.prompt}
						disabled={submitting}
					></textarea>
					<p class="text-xs text-slate-600 mt-1.5">Be specific — the more detail, the better the result.</p>
				</div>

				<!-- Error -->
				{#if errorMsg}
					<div class="flex items-start gap-2.5 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
						<CircleAlert class="w-4 h-4 mt-0.5 shrink-0" />
						{errorMsg}
					</div>
				{/if}

				<!-- Submit -->
				<button
					type="submit"
					class="btn-secondary w-full gap-2 py-3"
					disabled={submitting}
				>
					{#if submitting}
						<LoaderCircle class="w-4 h-4 animate-spin" /> Dispatching build…
					{:else}
						<Send class="w-4 h-4" /> Retool My Site
					{/if}
				</button>
			</form>

			<!-- Mini how-it-works -->
			<div class="mt-8 pt-6 border-t border-white/5">
				<p class="text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-4">How it works</p>
				<div class="grid grid-cols-3 gap-4 text-center">
					{#each [['📋', 'Submit repo + prompt'], ['🤖', 'AI builds changes'], ['🚀', 'PR lands in your repo']] as [emoji, label]}
						<div class="text-center">
							<div class="text-xl mb-1">{emoji}</div>
							<p class="text-xs text-slate-500">{label}</p>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</div>
</main>

<Footer />

