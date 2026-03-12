<script lang="ts">
	import Navbar from '$lib/components/Navbar.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import Icon from '@iconify/svelte';

	// ── State ──────────────────────────────────────────────────────────────────
	let repoUrl   = $state('');
	let outputType = $state<'mcp' | 'sdk'>('mcp');
	let loading    = $state(false);
	let error      = $state('');
	let result     = $state<null | {
		repo_name: string;
		repo_owner: string;
		repo_description: string;
		primary_language: string;
		package: {
			project_name: string;
			framework: string;
			summary: string;
			setup_instructions: string[];
			env_vars: string[];
			files: { path: string; content: string; language: string }[];
		};
	}>(null);

	let activeFile  = $state('');
	let copiedFile  = $state('');

	// ── Helpers ────────────────────────────────────────────────────────────────
	function selectFile(path: string) { activeFile = path; }

	function activeContent() {
		return result?.package.files.find((f) => f.path === activeFile)?.content ?? '';
	}

	async function copyFile(path: string, content: string) {
		try {
			await navigator.clipboard.writeText(content);
			copiedFile = path;
			setTimeout(() => { copiedFile = ''; }, 2000);
		} catch { /* ignore */ }
	}

	function downloadAll() {
		if (!result) return;
		result.package.files.forEach((f) => {
			const blob = new Blob([f.content], { type: 'text/plain' });
			const a = document.createElement('a');
			a.href = URL.createObjectURL(blob);
			a.download = f.path.split('/').pop() ?? f.path;
			a.click();
			URL.revokeObjectURL(a.href);
		});
	}

	// ── Generate ───────────────────────────────────────────────────────────────
	async function generate() {
		error = '';
		result = null;
		loading = true;
		try {
			const res = await fetch('/api/mcp/generate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ repo_url: repoUrl, output_type: outputType })
			});
			const data = await res.json();
			if (!res.ok) {
				if (res.status === 401) { error = 'Please sign in to use MCP generation.'; }
				else { error = data.error ?? 'Generation failed. Try again.'; }
				return;
			}
			result = data;
			activeFile = data.package?.files?.[0]?.path ?? '';
		} catch {
			error = 'Network error. Please try again.';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>MCP Server Generator | Noelle</title>
	<meta name="description" content="Generate an MCP server or SDK wrapper for any GitHub repo." />
</svelte:head>

<Navbar />

<main class="pt-16 min-h-screen">
	<div class="container-wide py-10 sm:py-16 max-w-5xl">

		<!-- Header -->
		<div class="mb-10">
			<h1 class="text-3xl sm:text-4xl font-semibold text-white mb-2">MCP Server Generator</h1>
			<p class="text-slate-400 text-base">
				Paste any GitHub repo URL and get a fully functional
				<a href="https://modelcontextprotocol.io" target="_blank" rel="noopener" class="text-brand-400 hover:text-brand-300 underline underline-offset-2">MCP server</a>
				or SDK wrapper — powered by <a href="https://plus12monkeys.com" target="_blank" rel="noopener" class="text-brand-400 hover:text-brand-300 underline underline-offset-2">+12 Monkeys</a>.
			</p>
		</div>

		<!-- Input form -->
		<div class="card-glass p-6 rounded-2xl mb-8 space-y-5">
			<div class="flex flex-col sm:flex-row gap-3">
				<input
					type="url"
					bind:value={repoUrl}
					placeholder="https://github.com/owner/repo"
					class="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition"
					disabled={loading}
					onkeydown={(e) => { if (e.key === 'Enter' && repoUrl.trim()) generate(); }}
				/>

				<!-- Output type toggle -->
				<div class="flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1 shrink-0">
					{#each (['mcp', 'sdk'] as const) as type}
						<button
							onclick={() => outputType = type}
							class="px-4 py-2 rounded-lg text-sm font-medium transition-all {outputType === type ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'}"
						>{type.toUpperCase()}</button>
					{/each}
				</div>

				<button
					onclick={generate}
					disabled={loading || !repoUrl.trim()}
					class="px-6 py-3 bg-brand-600 hover:bg-brand-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-brand-500/20 flex items-center gap-2 shrink-0"
				>
					{#if loading}
						<Icon icon="ph:spinner-gap-bold" width="16" height="16" class="animate-spin" />
						Generating…
					{:else}
						<Icon icon="ph:code-bold" width="16" height="16" />
						Generate
					{/if}
				</button>
			</div>

			{#if error}
				<p class="text-red-400 text-sm flex items-center gap-2">
					<Icon icon="ph:warning-circle-bold" width="16" height="16" />
					{error}
				</p>
			{/if}
		</div>

		<!-- Results -->
		{#if result}
			<!-- Repo metadata -->
			<div class="card-glass p-5 rounded-2xl mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div>
					<p class="text-white font-semibold">{result.repo_owner}/{result.repo_name}</p>
					<p class="text-slate-400 text-sm mt-0.5">{result.repo_description || 'No description'}</p>
					<div class="flex gap-3 mt-2 text-xs text-slate-500">
						<span>📦 {result.package.project_name}</span>
						<span>·</span>
						<span>🔧 {result.package.framework}</span>
						<span>·</span>
						<span>💬 {result.primary_language}</span>
					</div>
				</div>
				<button
					onclick={downloadAll}
					class="shrink-0 flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-medium rounded-xl transition-all"
				>
					<Icon icon="ph:download-simple-bold" width="16" height="16" />
					Download All
				</button>
			</div>

			<!-- File explorer + viewer -->
			<div class="card-glass rounded-2xl overflow-hidden flex flex-col md:flex-row" style="min-height:420px">
				<!-- File tree -->
				<div class="md:w-52 shrink-0 border-b md:border-b-0 md:border-r border-white/10 p-3 space-y-0.5">
					{#each result.package.files as file}
						<button
							onclick={() => selectFile(file.path)}
							class="w-full text-left px-3 py-2 rounded-lg text-xs font-mono truncate transition-all
								{activeFile === file.path ? 'bg-brand-600/30 text-brand-300' : 'text-slate-400 hover:text-white hover:bg-white/5'}"
						>{file.path}</button>
					{/each}
				</div>

				<!-- File content -->
				<div class="flex-1 flex flex-col min-w-0">
					<div class="flex items-center justify-between px-4 py-3 border-b border-white/10 gap-2">
						<span class="text-xs font-mono text-slate-400 truncate">{activeFile}</span>
						<button
							onclick={() => copyFile(activeFile, activeContent())}
							class="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-medium rounded-lg transition-all"
						>
							{#if copiedFile === activeFile}
								<Icon icon="ph:check-bold" width="12" height="12" class="text-green-400" />
								Copied
							{:else}
								<Icon icon="ph:copy-bold" width="12" height="12" />
								Copy
							{/if}
						</button>
					</div>
					<pre class="flex-1 overflow-auto p-4 text-xs text-slate-300 font-mono leading-relaxed"><code>{activeContent()}</code></pre>
				</div>
			</div>

			<!-- Setup instructions -->
			{#if result.package.setup_instructions?.length}
				<div class="card-glass p-5 rounded-2xl mt-4">
					<h3 class="text-sm font-semibold text-white mb-3 flex items-center gap-2">
						<Icon icon="ph:book-open-bold" width="16" height="16" class="text-brand-400" />
						Setup Instructions
					</h3>
					<ol class="space-y-1.5">
						{#each result.package.setup_instructions as step, i}
							<li class="text-sm text-slate-400 flex gap-3">
								<span class="text-brand-500 font-mono shrink-0">{i + 1}.</span>
								<span>{step}</span>
							</li>
						{/each}
					</ol>
				</div>
			{/if}
		{/if}

	</div>
</main>

<Footer />

