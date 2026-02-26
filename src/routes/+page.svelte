<script lang="ts">
	import Navbar from '$lib/components/Navbar.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import UnicornBackground from '$lib/components/UnicornBackground.svelte';
	import { onMount } from 'svelte';

	onMount(() => {
		const observer = new IntersectionObserver(
			(entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('active'); }),
			{ threshold: 0.1 }
		);
		document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
		return () => observer.disconnect();
	});
</script>

<UnicornBackground />
<Navbar />

<main class="pt-16">

	<!-- ═══ HERO ═══ -->
	<section class="relative pt-32 pb-12 md:pt-48 md:pb-24 overflow-hidden">
		<div class="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[800px] hero-glow pointer-events-none opacity-60"></div>
		<div class="container-wide relative z-10">
			<div class="flex flex-col items-center text-center max-w-4xl mx-auto">

				<!-- Badge -->
				<div class="reveal inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand-500/30 bg-brand-500/10 text-brand-300 text-[11px] font-medium mb-8">
					<span class="relative flex h-2 w-2">
						<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
						<span class="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
					</span>
					AI-Powered PR Generation
				</div>

				<h1 class="reveal delay-100 text-5xl md:text-7xl font-medium tracking-tight mb-6 leading-[1.1] title-gradient">
					Retool Your Website<br>with AI.
				</h1>

				<p class="reveal delay-200 text-lg md:text-xl text-slate-400 max-w-2xl mb-10 leading-relaxed font-light">
					Paste your GitHub repo, describe what you want changed, and get a PR with the results. Review, merge, ship.
				</p>

				<div class="reveal delay-300 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
					<a href="/retool" class="w-full sm:w-auto group relative px-8 py-3.5 bg-white text-black text-sm font-semibold rounded-full hover:bg-slate-100 transition-all duration-300 shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)] inline-flex items-center justify-center gap-2">
						Retool My Site
						<svg class="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
					</a>
					<a href="#how-it-works" class="w-full sm:w-auto px-8 py-3.5 bg-white/5 border border-white/10 text-white text-sm font-semibold rounded-full hover:bg-white/10 transition-all duration-300 inline-flex items-center justify-center">
						See How It Works
					</a>
				</div>

				<!-- Trust bar -->
				<div class="mt-12 reveal delay-300 flex items-center gap-2 bg-white/5 border border-white/5 rounded-full px-4 py-1.5">
					<div class="flex text-yellow-400 gap-0.5 text-xs">★★★★★</div>
					<span class="text-xs text-slate-300">Powered by <span class="text-white font-medium">Cubicube™</span> · Cloudflare Edge · AI-Driven Builds</span>
				</div>
			</div>

			<!-- Hero visual: AI flow -->
			<div class="mt-20 relative group reveal delay-300" style="perspective: 2000px;">
				<div class="relative w-full max-w-5xl mx-auto glass-panel rounded-xl p-1 shadow-2xl transition-transform duration-700 ease-out overflow-hidden border-t border-white/10"
					role="presentation"
					style="transform: perspective(1000px) rotateX(12deg);"
					onmouseenter={(e) => (e.currentTarget as HTMLElement).style.transform = 'perspective(1000px) rotateX(0deg)'}
					onmouseleave={(e) => (e.currentTarget as HTMLElement).style.transform = 'perspective(1000px) rotateX(12deg)'}>
					<div class="bg-[#0A0A0C] rounded-lg overflow-hidden border border-white/5 h-[380px] md:h-[480px] relative">
						<div class="absolute inset-0 z-10 p-8 flex flex-col justify-center items-center gap-6">

							<!-- Input nodes -->
							<div class="flex gap-10">
								<div class="glass-panel px-4 py-2 rounded-lg flex items-center gap-2 border-dashed border-white/20">
									<svg class="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>
									<span class="text-xs text-slate-300">GitHub Repo</span>
								</div>
								<div class="glass-panel px-4 py-2 rounded-lg flex items-center gap-2 border-dashed border-white/20">
									<svg class="w-4 h-4 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
									<span class="text-xs text-slate-300">Your Prompt</span>
								</div>
							</div>

							<!-- Connector -->
							<div class="h-8 w-px bg-gradient-to-b from-white/20 to-brand-500/50"></div>

							<!-- Core node -->
							<div class="relative w-full max-w-2xl bg-[#0F0F11] border border-white/10 rounded-xl p-5 shadow-2xl">
								<div class="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-brand-600 rounded-full text-[10px] text-white border border-brand-400 font-medium tracking-wide shadow-lg shadow-brand-500/30">RETOOLS AI CORE</div>
								<div class="grid grid-cols-3 gap-4 mt-2">
									<div class="bg-white/5 rounded-lg p-3 border border-white/5">
										<div class="text-[10px] text-slate-400 uppercase tracking-wider mb-2">Cloning</div>
										<div class="h-1.5 bg-white/10 rounded-full"><div class="w-3/4 h-full bg-brand-500 rounded-full"></div></div>
									</div>
									<div class="bg-white/5 rounded-lg p-3 border border-white/5 flex flex-col items-center justify-center">
										<div class="w-7 h-7 rounded-full bg-brand-500/20 border border-brand-500/40 flex items-center justify-center mb-1 animate-pulse">
											<svg class="w-4 h-4 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
										</div>
										<span class="text-[10px] text-brand-200 text-center">AI Applying</span>
									</div>
									<div class="bg-white/5 rounded-lg p-3 border border-white/5">
										<div class="text-[10px] text-slate-400 uppercase tracking-wider mb-2">PR Ready</div>
										<div class="bg-emerald-500/20 text-emerald-100 px-2 py-1 rounded-lg text-[9px] text-center">Branch pushed ✓</div>
									</div>
								</div>
							</div>

							<!-- Connector -->
							<div class="h-8 w-px bg-gradient-to-b from-brand-500/50 to-white/20"></div>

							<!-- Result -->
							<div class="glass-panel px-6 py-2.5 rounded-full flex items-center gap-3 border border-emerald-500/30 bg-emerald-500/5 shadow-[0_0_15px_-3px_rgba(16,185,129,0.2)]">
								<span class="flex h-2 w-2 relative"><span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></span>
								<span class="text-xs font-medium text-emerald-300">Pull Request Opened</span>
							</div>
						</div>
					</div>
				</div>
				<div class="absolute -bottom-10 left-0 right-0 h-20 bg-gradient-to-t from-[#030304] to-transparent z-20"></div>
			</div>
		</div>
	</section>

	<!-- ═══ HOW IT WORKS ═══ -->
	<section id="how-it-works" class="py-24 border-y border-white/5 bg-[#050507]">
		<div class="container-wide">
			<h2 class="text-3xl font-medium text-center text-white mb-16 tracking-tight reveal">How It Works</h2>
			<div class="grid grid-cols-1 md:grid-cols-3 gap-8">
				{#each [
					{ step: '01', emoji: '📋', title: 'Paste Your Repo', desc: 'Enter your GitHub repo URL and describe what you want changed in plain language.' },
					{ step: '02', emoji: '🤖', title: 'AI Builds the Changes', desc: 'Our AI clones your repo, applies your changes, and pushes a branch with the result.' },
					{ step: '03', emoji: '🚀', title: 'Review & Merge', desc: 'A PR lands in your repo. Review the diff, approve, and merge through your own pipeline.' }
				] as item}
					<div class="glass-panel p-8 rounded-2xl reveal delay-100 group hover:border-brand-500/30 transition-colors text-center">
						<div class="text-3xl mb-4">{item.emoji}</div>
						<div class="text-xs font-bold text-brand-400 uppercase tracking-widest mb-3">Step {item.step}</div>
						<h3 class="text-lg font-medium text-white mb-2">{item.title}</h3>
						<p class="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- ═══ USE CASES ═══ -->
	<section id="use-cases" class="py-24 bg-white/[0.01]">
		<div class="container-wide">
			<h2 class="text-3xl font-medium text-white mb-12 tracking-tight reveal">What Can You Retool?</h2>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
				{#each [
					{ emoji: '🎨', title: 'Visual Overhauls', desc: 'Update colors, typography, layouts, or make your site mobile-friendly with a single prompt.' },
					{ emoji: '⚙️', title: 'Feature Changes', desc: 'Add new pages, fix bugs, refactor components, or integrate APIs — just describe it.' },
					{ emoji: '🔄', title: 'Full Rebuilds', desc: 'Migrate to modern stacks. Describe the end state and let the AI handle the transformation.' },
					{ emoji: '👁️', title: 'PR Before Production', desc: 'Every change opens a PR in your repo. Review the diff before anything touches main.' }
				] as item}
					<div class="group reveal delay-100 glass-panel p-6 rounded-xl hover:bg-white/5 transition-colors flex items-start gap-4">
						<div class="w-10 h-10 rounded-lg bg-brand-500/10 flex items-center justify-center flex-shrink-0 text-lg">{item.emoji}</div>
						<div>
							<h3 class="font-medium text-white mb-1">{item.title}</h3>
							<p class="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
						</div>
					</div>
				{/each}
			</div>

			<!-- Infrastructure highlight -->
			<div class="mt-20 bg-gradient-to-r from-brand-900/20 to-purple-900/20 border border-white/10 rounded-2xl p-8 text-center reveal">
				<h3 class="text-2xl font-medium text-white mb-2">Built on Proven Infrastructure</h3>
				<p class="text-brand-200 font-medium mb-4">Every build runs on Cloudflare's global edge.</p>
				<p class="text-slate-400 text-sm max-w-2xl mx-auto mb-8">
					Retools uses Cubicube's building tools. AI clones your repo, applies changes, validates the build, and opens a PR — all automatically.
				</p>
				<div class="flex flex-wrap justify-center gap-3">
					{#each ['Powered by Cubicube™', 'Cloudflare Edge', 'AI-Driven Builds', 'Auto PR Generation'] as badge}
						<span class="px-4 py-1.5 rounded-full glass-panel text-xs text-slate-300 border border-white/10">{badge}</span>
					{/each}
				</div>
			</div>
		</div>
	</section>

	<!-- ═══ MCP TEASER ═══ -->
	<section class="py-24 border-y border-white/5 bg-[#050507]">
		<div class="container-wide">
			<div class="flex flex-col md:flex-row items-center gap-12">
				<!-- Text -->
				<div class="flex-1 reveal">
					<div class="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand-500/30 bg-brand-500/10 text-brand-300 text-[11px] font-medium mb-5">
						<span class="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse"></span>
						Powered by +12 Monkeys SDK
					</div>
					<h2 class="text-3xl md:text-4xl font-medium tracking-tight text-white mb-4">
						Build AI Agents.<br>Connect Any Tool.
					</h2>
					<p class="text-slate-400 leading-relaxed mb-8 max-w-lg">
						Browse 30+ Model Context Protocol (MCP) servers — databases, APIs, dev tools, and more. Configure your agent's toolset in minutes, no boilerplate required.
					</p>
					<div class="flex flex-wrap gap-3">
						<a href="/mcp" class="px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold rounded-full transition-all duration-300 shadow-lg shadow-brand-500/20 inline-flex items-center gap-2">
							Browse MCP Servers
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
						</a>
						<a href="/agents/new" class="px-6 py-3 bg-white/5 border border-white/10 text-white text-sm font-semibold rounded-full hover:bg-white/10 transition-all duration-300 inline-flex items-center gap-2">
							Build an Agent →
						</a>
					</div>
				</div>

				<!-- Server preview cards -->
				<div class="flex-1 grid grid-cols-2 gap-3 reveal delay-100">
					{#each [
						{ icon: '🐘', name: 'PostgreSQL', cat: 'Data & Databases', official: true },
						{ icon: '🐙', name: 'GitHub', cat: 'Dev Tools', official: true },
						{ icon: '🔍', name: 'Brave Search', cat: 'Search', official: true },
						{ icon: '📊', name: 'Google Sheets', cat: 'Productivity', official: false },
						{ icon: '🧠', name: 'Memory', cat: 'AI & ML', official: true },
						{ icon: '🔓', name: 'Breach Intel', cat: 'Intelligence', official: false }
					] as s}
						<div class="glass-panel rounded-xl p-4 flex items-start gap-3 hover:border-brand-500/25 transition-colors">
							<span class="text-xl leading-none mt-0.5">{s.icon}</span>
							<div class="min-w-0">
								<div class="flex items-center gap-1.5">
									<span class="text-xs font-semibold text-white truncate">{s.name}</span>
									{#if s.official}<span class="text-[9px] font-bold text-brand-400 shrink-0">✓</span>{/if}
								</div>
								<span class="text-[10px] text-slate-500">{s.cat}</span>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</section>

	<!-- ═══ FINAL CTA ═══ -->
	<section class="py-24 relative overflow-hidden">
		<div class="absolute bottom-0 left-0 w-64 h-64 bg-brand-600/10 blur-[100px] pointer-events-none"></div>
		<div class="absolute top-0 right-0 w-64 h-64 bg-emerald-600/10 blur-[100px] pointer-events-none"></div>
		<div class="container-narrow text-center relative z-10 reveal">
			<h2 class="text-4xl md:text-5xl font-medium text-white tracking-tight mb-6">Ready to Retool?</h2>
			<p class="text-slate-400 max-w-2xl mx-auto mb-10">
				Paste your repo, describe the changes, and get a live PR in minutes. No deployments, no risk — just a pull request.
			</p>
			<div class="flex flex-col sm:flex-row items-center justify-center gap-4">
				<a href="/retool" class="w-full sm:w-auto px-8 py-3.5 bg-white text-black text-sm font-semibold rounded-full hover:bg-slate-200 transition-all duration-300 inline-flex items-center justify-center gap-2">
					Retool My Site
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
				</a>
				<a href="/dashboard" class="w-full sm:w-auto px-8 py-3.5 bg-white/5 border border-white/10 text-white text-sm font-semibold rounded-full hover:bg-white/10 transition-all duration-300 inline-flex items-center justify-center">
					View Dashboard
				</a>
			</div>
		</div>
	</section>

</main>

<Footer />
