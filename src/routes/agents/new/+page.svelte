<script lang="ts">
	import type { WizardChatResponse } from '$lib/server/wizard-orchestrator';
	import type { ChatMessage, ExtractedRequirements, AgentRecommendation } from '$lib/types/agent';
	import type { ImageAttachment } from '$lib/types/retool';
	import Icon from '@iconify/svelte';
	import { goto } from '$app/navigation';

	// ── State ────────────────────────────────────────────────────────────────────
	let sessionId = $state<string | null>(null);
	let messages = $state<ChatMessage[]>([]);
	let requirements = $state<ExtractedRequirements | null>(null);
	let recommendation = $state<AgentRecommendation | null>(null);
	let inputText = $state('');
	let loading = $state(false);
	let error = $state<string | null>(null);
	let screenshots = $state<ImageAttachment[]>([]);
	let fileInput: HTMLInputElement;

	const MAX_FILE_SIZE_MB = 20;

	// Boot message shown before first user turn
	const WELCOME: ChatMessage = {
		role: 'assistant',
		content: "👋 Welcome! I'm the Noelle Agent Wizard. Tell me what you'd like to build — a customer support bot, research pipeline, data analyst, code generator, or something else entirely?",
		timestamp: new Date().toISOString()
	};

	let displayMessages = $derived<ChatMessage[]>([WELCOME, ...messages]);

	// ── File helpers ─────────────────────────────────────────────────────────────
	async function fileToAttachment(file: File): Promise<ImageAttachment | null> {
		if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
			error = `${file.name} exceeds the ${MAX_FILE_SIZE_MB} MB limit.`;
			return null;
		}
		if (!file.type.startsWith('image/')) {
			error = `${file.name} is not an image file.`;
			return null;
		}
		return new Promise((resolve) => {
			const reader = new FileReader();
			reader.onload = () => {
				const dataUrl = reader.result as string;
				resolve({ name: file.name, mimeType: file.type, data: dataUrl.split(',')[1] });
			};
			reader.readAsDataURL(file);
		});
	}

	async function handleFiles(files: FileList | File[]) {
		error = null;
		const results = await Promise.all(Array.from(files).map(fileToAttachment));
		screenshots = [...screenshots, ...results.filter((r): r is ImageAttachment => r !== null)];
	}

	function handleFileInput(e: Event) {
		const input = e.target as HTMLInputElement;
		if (input.files) handleFiles(input.files);
		input.value = '';
	}

	function handlePaste(e: ClipboardEvent) {
		const imageFiles: File[] = [];
		for (const item of Array.from(e.clipboardData?.items ?? [])) {
			if (item.kind === 'file' && item.type.startsWith('image/')) {
				const file = item.getAsFile();
				if (file) imageFiles.push(file);
			}
		}
		if (imageFiles.length) handleFiles(imageFiles);
	}

	function removeScreenshot(index: number) {
		screenshots = screenshots.filter((_, i) => i !== index);
	}

	// ── Chat submit ──────────────────────────────────────────────────────────────
	async function send() {
		const text = inputText.trim();
		if ((!text && screenshots.length === 0) || loading) return;

		const sentScreenshots = [...screenshots];
		inputText = '';
		screenshots = [];
		error = null;
		loading = true;

		// Optimistically add user message
		messages = [...messages, { role: 'user', content: text || `[${sentScreenshots.length} image${sentScreenshots.length > 1 ? 's' : ''} attached]`, timestamp: new Date().toISOString() }];

		try {
			const res = await fetch('/api/wizard/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ message: text || 'I have attached some reference images.', session_id: sessionId, screenshots: sentScreenshots })
			});

			if (!res.ok) {
				const { message: msg } = await res.json().catch(() => ({ message: 'Request failed' }));
				throw new Error(msg ?? `HTTP ${res.status}`);
			}

			const data: WizardChatResponse = await res.json();
			sessionId = data.sessionId;
			requirements = data.requirements;
			recommendation = data.recommendation;

			messages = [
				...messages.slice(0, -1),
				{ role: 'user', content: text || `[${sentScreenshots.length} image${sentScreenshots.length > 1 ? 's' : ''} attached]`, timestamp: new Date().toISOString() },
				{ role: 'assistant', content: data.reply, timestamp: new Date().toISOString() }
			];
		} catch (e) {
			error = e instanceof Error ? e.message : 'Something went wrong';
			messages = messages.slice(0, -1);
			screenshots = sentScreenshots; // restore on error
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

	function generateAgentPackage() {
		if (!recommendation) return;
		// Pre-fill the prompt with the wizard's recommendation rationale so
		// the user lands on /retool with context already prepared.
		const prompt = encodeURIComponent(
			`Build a ${recommendation.template_name} agent.\n\n${recommendation.rationale}\n\nFramework: ${recommendation.framework}\nDeployment: ${recommendation.deployment_type}\n${recommendation.mcp_servers?.length ? `MCP Servers: ${recommendation.mcp_servers.join(', ')}` : ''}`
		);
		goto(`/retool?prompt=${prompt}`);
	}
</script>

<svelte:head>
	<title>Build an Agent — Noelle</title>
</svelte:head>

<div class="min-h-screen bg-[#030304] flex flex-col">
	<!-- Header -->
	<header class="border-b border-white/5 px-6 py-4 flex items-center gap-4">
		<a href="/" aria-label="Back to home" class="text-slate-500 hover:text-white transition-colors">
			<Icon icon="ph:arrow-left-bold" width="20" height="20" />
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
							<div class="w-7 h-7 rounded-full bg-brand-600/20 border border-brand-500/30 flex items-center justify-center shrink-0 text-brand-300">
								<Icon icon="ph:robot-bold" width="14" height="14" />
							</div>
						{/if}
						<div class="max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed {msg.role === 'user' ? 'bg-brand-600 text-white rounded-br-sm' : 'bg-white/5 border border-white/8 text-slate-200 rounded-bl-sm'}">
							{msg.content}
						</div>
						{#if msg.role === 'user'}
							<div class="w-7 h-7 rounded-full bg-white/10 border border-white/10 flex items-center justify-center shrink-0 text-slate-300">
								<Icon icon="ph:user-bold" width="14" height="14" />
							</div>
						{/if}
					</div>
				{/each}

				{#if loading}
					<div class="flex gap-3 justify-start">
						<div class="w-7 h-7 rounded-full bg-brand-600/20 border border-brand-500/30 flex items-center justify-center shrink-0 text-brand-300">
							<Icon icon="ph:robot-bold" width="14" height="14" />
						</div>
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

				<!-- Screenshot thumbnails -->
				{#if screenshots.length > 0}
					<div class="flex flex-wrap gap-2 mb-3">
						{#each screenshots as img, i}
							<div class="relative group w-14 h-14 rounded-lg overflow-hidden border border-white/10 shrink-0">
								<img
									src="data:{img.mimeType};base64,{img.data}"
									alt={img.name}
									class="w-full h-full object-cover"
								/>
								<button
									type="button"
									onclick={() => removeScreenshot(i)}
									title="Remove {img.name}"
									class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
								>
									<Icon icon="ph:x-bold" width="14" height="14" class="text-white" />
								</button>
							</div>
						{/each}
						<p class="self-end text-[10px] text-brand-400 pb-1">
							{screenshots.length} image{screenshots.length > 1 ? 's' : ''} · Gemini will analyze {screenshots.length > 1 ? 'them' : 'it'}
						</p>
					</div>
				{/if}

				<!-- Input row -->
				<div class="flex gap-2 items-end">
					<!-- Paperclip button -->
					<button
						type="button"
						title="Attach images (up to {MAX_FILE_SIZE_MB} MB each)"
						onclick={() => fileInput.click()}
						disabled={loading}
						class="w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 hover:text-brand-400 hover:bg-brand-500/10 border border-white/8 transition-colors disabled:opacity-40 shrink-0"
					>
						<Icon icon="ph:paperclip-bold" width="16" height="16" />
					</button>

					<textarea
						bind:value={inputText}
						onkeydown={handleKey}
						onpaste={handlePaste}
						placeholder="Describe the agent you want to build…"
						rows="2"
						disabled={loading}
						class="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 resize-none focus:outline-none focus:border-brand-500/50 transition-colors disabled:opacity-50"
					></textarea>

					<button
						onclick={send}
						disabled={loading || (!inputText.trim() && screenshots.length === 0)}
						aria-label="Send message"
						class="w-10 h-10 bg-brand-600 hover:bg-brand-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition-all shrink-0"
					>
						<Icon icon="ph:paper-plane-right-bold" width="16" height="16" class="text-white" />
					</button>
				</div>

				<!-- Hidden file input -->
				<input
					bind:this={fileInput}
					type="file"
					accept="image/*"
					multiple
					class="hidden"
					onchange={handleFileInput}
				/>

				<p class="text-[10px] text-slate-600 mt-2 px-1">Press Enter to send · Shift+Enter for new line · Paste or 📎 to attach images</p>
			</div>
		</div>

		<!-- RIGHT: Live config preview -->
		<div class="hidden md:flex flex-col w-1/2 p-6 gap-6 overflow-y-auto">
			<div>
				<h2 class="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Live Config Preview</h2>

				{#if !requirements && !recommendation}
					<div class="glass-panel rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-3 border-dashed">
						<div class="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500">
							<Icon icon="ph:puzzle-piece-bold" width="28" height="28" />
						</div>
						<p class="text-slate-500 text-sm">Your agent configuration will appear here as you chat with the wizard.</p>
					</div>
				{/if}

				{#if requirements}
					<div class="glass-panel rounded-2xl p-5 mb-4">
						<div class="flex items-center gap-2 mb-4">
							<div class="w-6 h-6 rounded-md bg-brand-500/10 flex items-center justify-center text-brand-400">
								<Icon icon="ph:clipboard-text-bold" width="14" height="14" />
							</div>
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
							<div class="w-6 h-6 rounded-md bg-amber-500/10 flex items-center justify-center text-amber-400">
								<Icon icon="ph:sparkle-bold" width="14" height="14" />
							</div>
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
							<button
								onclick={generateAgentPackage}
								class="mt-5 w-full py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-brand-500/20"
							>
								Generate Agent Package →
							</button>
						{/if}
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>

