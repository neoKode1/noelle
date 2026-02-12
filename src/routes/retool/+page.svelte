<script lang="ts">
	import Navbar from '$lib/components/Navbar.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import { Github, Send, Loader2, ArrowRight, AlertCircle, KeyRound } from 'lucide-svelte';
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
	<title>Retool Your Site | Retools</title>
</svelte:head>

<Navbar />

<main class="pt-16 min-h-screen bg-surface-50 dark:bg-surface-950">
	<div class="container-narrow py-12 sm:py-20">
		<!-- Header -->
		<div class="text-center mb-10">
			<h1 class="text-3xl sm:text-4xl font-extrabold text-surface-900 dark:text-white">
				Retool Your Site
			</h1>
			<p class="mt-3 text-surface-500 dark:text-surface-400 max-w-lg mx-auto">
				Paste your GitHub repo, describe what you want changed, and we'll open a PR with the results.
			</p>
		</div>

		<!-- Form -->
		<div class="card max-w-2xl mx-auto">
			<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
				<!-- Repo URL -->
				<div class="mb-5">
					<label for="repoUrl" class="form-label flex items-center gap-1.5">
						<Github class="w-4 h-4" /> GitHub Repository URL
					</label>
					<input
						id="repoUrl"
						type="url"
						class="form-input"
						placeholder="https://github.com/your-org/your-repo"
						bind:value={form.repoUrl}
						disabled={submitting}
					/>
					<p class="text-xs text-surface-400 mt-1">Must be a public GitHub repository (or one your account has access to).</p>
				</div>

				<!-- Branch -->
				<div class="mb-5">
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
				<div class="mb-5">
					<label for="github_token" class="form-label flex items-center gap-1.5">
						<KeyRound class="w-4 h-4" /> GitHub Personal Access Token
					</label>
					<input
						id="github_token"
						type="password"
						class="form-input font-mono"
						placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
						bind:value={form.github_token}
						disabled={submitting}
						autocomplete="off"
					/>
					<p class="text-xs text-surface-400 mt-1">A PAT with <code class="text-xs">repo</code> scope. Used to push a branch and open a PR on your behalf. Never stored.</p>
				</div>

				<!-- Prompt -->
				<div class="mb-6">
					<label for="prompt" class="form-label">What do you want changed?</label>
					<textarea
						id="prompt"
						class="form-input min-h-[160px]"
						placeholder="e.g. Make the hero section darker with a gradient background. Add a pricing page with three tiers. Fix the mobile hamburger menu animation."
						bind:value={form.prompt}
						disabled={submitting}
					></textarea>
					<p class="text-xs text-surface-400 mt-1">Be as specific as you'd like — the more detail, the better the result.</p>
				</div>

				<!-- Error -->
				{#if errorMsg}
					<div class="flex items-start gap-2 p-3 mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm">
						<AlertCircle class="w-4 h-4 mt-0.5 shrink-0" />
						{errorMsg}
					</div>
				{/if}

				<!-- Submit -->
				<button
					type="submit"
					class="btn-primary w-full gap-2 text-base py-3"
					disabled={submitting}
				>
					{#if submitting}
						<Loader2 class="w-5 h-5 animate-spin" /> Dispatching build…
					{:else}
						<Send class="w-5 h-5" /> Retool My Site
					{/if}
				</button>
			</form>

			<!-- How it works mini -->
			<div class="mt-8 pt-6 border-t border-surface-200 dark:border-surface-700">
				<p class="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-3">How it works</p>
				<div class="grid grid-cols-3 gap-4 text-center text-xs text-surface-500 dark:text-surface-400">
					<div>
						<div class="text-2xl mb-1">1</div>
						<p>Submit repo + prompt</p>
					</div>
					<div>
						<div class="text-2xl mb-1">2</div>
						<p>AI builds your changes</p>
					</div>
					<div>
						<div class="text-2xl mb-1">3</div>
						<p>PR lands in your repo</p>
					</div>
				</div>
			</div>
		</div>
	</div>
</main>

<Footer />

