<script lang="ts">
	import type { WizardChatResponse } from '$lib/server/wizard-orchestrator';
	import type { ChatMessage, ExtractedRequirements, AgentRecommendation } from '$lib/types/agent';

	// ── State ────────────────────────────────────────────────────────────────────
	let sessionId = $state<string | null>(null);
	let messages = $state<ChatMessage[]>([]);
	let requirements = $state<ExtractedRequirements | null>(null);
	let recommendation = $state<AgentRecommendation | null>(null);
	// readyToGenerate drives the CTA button in the right panel (via recommendation.ready_to_generate)
	let inputText = $state('');
	let loading = $state(false);
	let error = $state<string | null>(null);

	// Boot message shown before first user turn
	const WELCOME: ChatMessage = {
		role: 'assistant',
		content: "👋 Welcome! I'm the Retools Agent Wizard. Tell me what you'd like to build — a customer support bot, research pipeline, data analyst, code generator, or something else entirely?",
		timestamp: new Date().toISOString()
	};

	let displayMessages = $derived<ChatMessage[]>([WELCOME, ...messages]);

	// ── Chat submit ──────────────────────────────────────────────────────────────
	async function send() {
		const text = inputText.trim();
		if (!text || loading) return;

		inputText = '';
		error = null;
		loading = true;

		// Optimistically add user message
		messages = [...messages, { role: 'user', content: text, timestamp: new Date().toISOString() }];

		try {
			const res = await fetch('/api/wizard/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ message: text, session_id: sessionId })
			});

			if (!res.ok) {
				const { message: msg } = await res.json().catch(() => ({ message: 'Request failed' }));
				throw new Error(msg ?? `HTTP ${res.status}`);
			}

			const data: WizardChatResponse = await res.json();
			sessionId = data.sessionId;
			requirements = data.requirements;
			recommendation = data.recommendation;

			// Replace last optimistic user msg + add assistant reply (server has timestamps)
			messages = [
				...messages.slice(0, -1),
				{ role: 'user', content: text, timestamp: new Date().toISOString() },
				{ role: 'assistant', content: data.reply, timestamp: new Date().toISOString() }
			];
		} catch (e) {
			error = e instanceof Error ? e.message : 'Something went wrong';
			// Remove optimistic message on error
			messages = messages.slice(0, -1);
		} finally {
			loading = false;
		}
	}

	function handleKey(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			send();
		}
	}
</script>

<svelte:head>
	<title>Build an Agent — Retools</title>
</svelte:head>

<div class="min-h-screen bg-[#030304] flex flex-col">
	<!-- Header -->
	<header class="border-b border-white/5 px-6 py-4 flex items-center gap-4">
		<a href="/" aria-label="Back to home" class="text-slate-500 hover:text-white transition-colors">
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
		</a>
		<div>
			<h1 class="text-sm font-semibold text-white">Agent Wizard</h1>
			<p class="text-[11px] text-slate-500">Powered by +12 Monkeys SDK × Cloudflare Workers AI</p>
		</div>
		{#if sessionId}
			<div class="ml-auto flex items-center gap-1.5 text-[11px] text-slate-500">
				<span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
				Session active
			</div>
		{/if}
	</header>

	<!-- Two-panel body -->
	<div class="flex flex-1 overflow-hidden">

		<!-- LEFT: Chat panel -->
		<div class="flex flex-col w-full md:w-1/2 border-r border-white/5">
			<!-- Messages -->
			<div class="flex-1 overflow-y-auto p-6 space-y-4 scroll-smooth" id="chat-scroll">
				{#each displayMessages as msg (msg.timestamp + msg.role)}
					<div class="flex gap-3 {msg.role === 'user' ? 'justify-end' : 'justify-start'}">
						{#if msg.role === 'assistant'}
							<div class="w-7 h-7 rounded-full bg-brand-600/20 border border-brand-500/30 flex items-center justify-center shrink-0 text-[13px]">🤖</div>
						{/if}
						<div class="max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed {msg.role === 'user' ? 'bg-brand-600 text-white rounded-br-sm' : 'bg-white/5 border border-white/8 text-slate-200 rounded-bl-sm'}">
							{msg.content}
						</div>
						{#if msg.role === 'user'}
							<div class="w-7 h-7 rounded-full bg-white/10 border border-white/10 flex items-center justify-center shrink-0 text-[13px]">👤</div>
						{/if}
					</div>
				{/each}

				{#if loading}
					<div class="flex gap-3 justify-start">
						<div class="w-7 h-7 rounded-full bg-brand-600/20 border border-brand-500/30 flex items-center justify-center shrink-0 text-[13px]">🤖</div>
						<div class="bg-white/5 border border-white/8 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1 items-center">
							<span class="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0ms]"></span>
							<span class="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:150ms]"></span>
							<span class="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:300ms]"></span>
						</div>
					</div>
				{/if}

				{#if error}
					<div class="text-red-400 text-xs bg-red-900/20 border border-red-500/20 rounded-xl px-4 py-2">{error}</div>
				{/if}
			</div>

			<!-- Input -->
			<div class="border-t border-white/5 p-4">
				<div class="flex gap-3 items-end">
					<textarea
						bind:value={inputText}
						onkeydown={handleKey}
						placeholder="Describe the agent you want to build…"
						rows="2"
						disabled={loading}
						class="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 resize-none focus:outline-none focus:border-brand-500/50 transition-colors disabled:opacity-50"
					></textarea>
					<button
						onclick={send}
						disabled={loading || !inputText.trim()}
						aria-label="Send message"
						class="w-10 h-10 bg-brand-600 hover:bg-brand-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition-all shrink-0"
					>
						<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14m-7-7l7 7-7 7"/></svg>
					</button>
				</div>
				<p class="text-[10px] text-slate-600 mt-2 px-1">Press Enter to send · Shift+Enter for new line</p>
			</div>
		</div>

		<!-- RIGHT: Live config preview -->
		<div class="hidden md:flex flex-col w-1/2 p-6 gap-6 overflow-y-auto">
			<div>
				<h2 class="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Live Config Preview</h2>

				{#if !requirements && !recommendation}
					<div class="glass-panel rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-3 border-dashed">
						<div class="text-4xl">🧩</div>
						<p class="text-slate-500 text-sm">Your agent configuration will appear here as you chat with the wizard.</p>
					</div>
				{/if}

				{#if requirements}
					<div class="glass-panel rounded-2xl p-5 mb-4">
						<div class="flex items-center gap-2 mb-4">
							<span class="text-lg">📋</span>
							<h3 class="text-sm font-semibold text-white">Extracted Requirements</h3>
						</div>
						<dl class="space-y-2.5 text-sm">
							{#if requirements.use_case}
								<div class="flex gap-2"><dt class="text-slate-500 w-32 shrink-0">Use Case</dt><dd class="text-slate-200">{requirements.use_case}</dd></div>
							{/if}
							{#if requirements.framework}
								<div class="flex gap-2"><dt class="text-slate-500 w-32 shrink-0">Framework</dt><dd class="text-brand-300 font-mono text-xs">{requirements.framework}</dd></div>
							{/if}
							{#if requirements.deployment_preference}
								<div class="flex gap-2"><dt class="text-slate-500 w-32 shrink-0">Deployment</dt><dd class="text-slate-200 capitalize">{requirements.deployment_preference}</dd></div>
							{/if}
							{#if requirements.data_sources?.length}
								<div class="flex gap-2"><dt class="text-slate-500 w-32 shrink-0">Data Sources</dt><dd class="text-slate-200">{requirements.data_sources.join(', ')}</dd></div>
							{/if}
							{#if requirements.output_format}
								<div class="flex gap-2"><dt class="text-slate-500 w-32 shrink-0">Output</dt><dd class="text-slate-200">{requirements.output_format}</dd></div>
							{/if}
						</dl>
					</div>
				{/if}

				{#if recommendation}
					<div class="rounded-2xl p-5 border border-brand-500/30 bg-brand-500/5">
						<div class="flex items-center gap-2 mb-3">
							<span class="text-lg">✨</span>
							<h3 class="text-sm font-semibold text-white">Recommended Template</h3>
							{#if recommendation.ready_to_generate}
								<span class="ml-auto text-[10px] font-bold text-emerald-400 bg-emerald-900/30 border border-emerald-500/30 px-2 py-0.5 rounded-full">Ready</span>
							{/if}
						</div>
						<p class="text-base font-semibold text-brand-300 mb-1">{recommendation.template_name}</p>
						<p class="text-xs text-slate-400 mb-4 leading-relaxed">{recommendation.rationale}</p>
						<div class="flex flex-wrap gap-2 text-[11px] mb-4">
							<span class="px-2 py-0.5 bg-white/5 rounded-full text-slate-400">{recommendation.framework}</span>
							<span class="px-2 py-0.5 bg-white/5 rounded-full text-slate-400">{recommendation.deployment_type}</span>
							<span class="px-2 py-0.5 bg-white/5 rounded-full text-slate-400">{recommendation.estimated_cost}</span>
						</div>
						{#if recommendation.mcp_servers?.length}
							<div class="text-[11px] text-slate-500 mb-1">MCP Servers</div>
							<div class="flex flex-wrap gap-1.5">
								{#each recommendation.mcp_servers as srv}
									<span class="px-2 py-0.5 bg-brand-900/30 border border-brand-500/20 text-brand-300 rounded-full text-[10px] font-mono">{srv}</span>
								{/each}
							</div>
						{/if}
						{#if recommendation.ready_to_generate}
							<button class="mt-5 w-full py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-brand-500/20">
								Generate Agent Package →
							</button>
						{/if}
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>

