<script lang="ts">
	import Navbar from '$lib/components/Navbar.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import {
		ArrowLeft,
		Clock,
		CheckCircle2,
		AlertCircle,
		FolderKanban,
		Rocket,
		MessageSquare,
		ExternalLink,
		FileText,
		Send
	} from 'lucide-svelte';
	import { CATEGORY_LABELS, type RequestCategory } from '$lib/types/intake';
	import { page } from '$app/state';

	type ProjectStatus = 'submitted' | 'scoping' | 'in_progress' | 'review' | 'deployed' | 'cancelled';

	const PIPELINE: { key: ProjectStatus; label: string }[] = [
		{ key: 'submitted', label: 'Submitted' },
		{ key: 'scoping', label: 'Scoping' },
		{ key: 'in_progress', label: 'Building' },
		{ key: 'review', label: 'Review' },
		{ key: 'deployed', label: 'Deployed' }
	];

	interface Message {
		id: string;
		sender: 'user' | 'system' | 'agent';
		content: string;
		createdAt: string;
	}

	// ── Demo data (replaced by server load later) ─────────────────────
	let status: ProjectStatus = $state('in_progress');
	let companyName = 'Acme Corp';
	let description = 'Rebuild our internal inventory dashboard with real-time stock tracking and automated reorder alerts.';
	let categories: RequestCategory[] = ['internal_tool', 'integration_api'];
	let timeline = 'this_month';
	let budget = '2500_10000';
	let previewUrl = 'https://acme-inventory.retools-preview.dev';
	let createdAt = '2026-02-08';

	let messages: Message[] = $state([
		{ id: 'm1', sender: 'system', content: 'Project submitted. Our AI is generating the initial scope…', createdAt: '2026-02-08 10:00' },
		{ id: 'm2', sender: 'agent', content: 'Scope generated. Estimated 24 hours of work across 8 tasks. We recommend SvelteKit + D1 with Cloudflare Workers for real-time inventory tracking.', createdAt: '2026-02-08 10:05' },
		{ id: 'm3', sender: 'user', content: 'Looks great — approved! Please proceed.', createdAt: '2026-02-08 14:30' },
		{ id: 'm4', sender: 'system', content: 'Scope approved. Build started. Preview deploy will be available shortly.', createdAt: '2026-02-08 14:31' }
	]);

	let newMessage = $state('');

	function sendMessage() {
		if (!newMessage.trim()) return;
		messages = [...messages, {
			id: `m${messages.length + 1}`,
			sender: 'user',
			content: newMessage.trim(),
			createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
		}];
		newMessage = '';
	}

	let currentStep = $derived(PIPELINE.findIndex((p) => p.key === status));
</script>

<svelte:head>
	<title>{companyName} | Retools Dashboard</title>
</svelte:head>

<Navbar />

<main class="pt-16 min-h-screen bg-surface-50 dark:bg-surface-950">
	<div class="container-content py-8 sm:py-12">
		<!-- Back link -->
		<a href="/dashboard" class="inline-flex items-center gap-1 text-sm text-surface-500 dark:text-surface-400 hover:text-brand-600 dark:hover:text-brand-400 mb-6">
			<ArrowLeft class="w-4 h-4" /> Back to Projects
		</a>

		<!-- Header -->
		<div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
			<div>
				<h1 class="text-2xl font-bold text-surface-900 dark:text-white">{companyName}</h1>
				<p class="text-surface-500 dark:text-surface-400 text-sm mt-1">Submitted {createdAt}</p>
			</div>
			{#if previewUrl}
				<a href={previewUrl} target="_blank" rel="noopener noreferrer" class="btn-secondary gap-1 w-fit text-sm">
					<ExternalLink class="w-4 h-4" /> View Preview
				</a>
			{/if}
		</div>

		<!-- Pipeline tracker -->
		<div class="card mb-6">
			<div class="flex items-center justify-between">
				{#each PIPELINE as pstep, i}
					<div class="flex-1 flex flex-col items-center text-center">
						<div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mb-1
							{i <= currentStep
								? 'bg-brand-600 text-white'
								: 'bg-surface-200 dark:bg-surface-700 text-surface-400 dark:text-surface-500'}">
							{#if i < currentStep}
								<CheckCircle2 class="w-4 h-4" />
							{:else}
								{i + 1}
							{/if}
						</div>
						<span class="text-[11px] font-medium
							{i <= currentStep
								? 'text-brand-600 dark:text-brand-400'
								: 'text-surface-400 dark:text-surface-500'}">{pstep.label}</span>
					</div>
					{#if i < PIPELINE.length - 1}
						<div class="flex-1 h-0.5 mx-1 -mt-4
							{i < currentStep ? 'bg-brand-500' : 'bg-surface-200 dark:bg-surface-700'}"></div>
					{/if}
				{/each}
			</div>
		</div>

		<!-- Two-column layout -->
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
			<!-- Left: Project details -->
			<div class="lg:col-span-1 space-y-6">
				<div class="card">
					<h2 class="text-sm font-semibold text-surface-900 dark:text-white mb-3 flex items-center gap-1.5">
						<FileText class="w-4 h-4 text-brand-500" /> Project Details
					</h2>
					<dl class="space-y-3 text-sm">
						<div>
							<dt class="text-surface-500 dark:text-surface-400">Categories</dt>
							<dd class="flex flex-wrap gap-1 mt-0.5">
								{#each categories as cat}
									<span class="text-[11px] font-medium px-1.5 py-0.5 rounded bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300">{CATEGORY_LABELS[cat]}</span>
								{/each}
							</dd>
						</div>
						<div>
							<dt class="text-surface-500 dark:text-surface-400">Timeline</dt>
							<dd class="text-surface-900 dark:text-white font-medium">{timeline}</dd>
						</div>
						<div>
							<dt class="text-surface-500 dark:text-surface-400">Budget</dt>
							<dd class="text-surface-900 dark:text-white font-medium">{budget}</dd>
						</div>
					</dl>
				</div>
				<div class="card">
					<h2 class="text-sm font-semibold text-surface-900 dark:text-white mb-2">Description</h2>
					<p class="text-sm text-surface-600 dark:text-surface-400 leading-relaxed">{description}</p>
				</div>
			</div>

			<!-- Right: Messages / Activity -->
			<div class="lg:col-span-2">
				<div class="card flex flex-col" style="min-height: 400px;">
					<h2 class="text-sm font-semibold text-surface-900 dark:text-white mb-4 flex items-center gap-1.5">
						<MessageSquare class="w-4 h-4 text-brand-500" /> Activity
					</h2>
					<!-- Message list -->
					<div class="flex-1 space-y-3 overflow-y-auto mb-4">
						{#each messages as msg}
							<div class="flex gap-3 {msg.sender === 'user' ? 'flex-row-reverse' : ''}">
								<div class="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold
									{msg.sender === 'user' ? 'bg-brand-100 dark:bg-brand-900 text-brand-600 dark:text-brand-400' :
									 msg.sender === 'agent' ? 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400' :
									 'bg-surface-200 dark:bg-surface-700 text-surface-500 dark:text-surface-400'}">
									{msg.sender === 'user' ? 'Y' : msg.sender === 'agent' ? 'AI' : '⚡'}
								</div>
								<div class="max-w-[75%] px-3 py-2 rounded-lg text-sm
									{msg.sender === 'user' ? 'bg-brand-600 text-white' : 'bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300'}">
									<p>{msg.content}</p>
									<span class="block text-[10px] mt-1 opacity-60">{msg.createdAt}</span>
								</div>
							</div>
						{/each}
					</div>
					<!-- Compose -->
					<div class="flex gap-2 border-t border-surface-200 dark:border-surface-700 pt-3">
						<input type="text" class="form-input flex-1" placeholder="Type a message…" bind:value={newMessage}
							onkeydown={(e) => { if (e.key === 'Enter') sendMessage(); }} />
						<button type="button" class="btn-primary px-3" onclick={sendMessage} disabled={!newMessage.trim()}>
							<Send class="w-4 h-4" />
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>
</main>

<Footer />

