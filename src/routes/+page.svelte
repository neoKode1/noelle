<script lang="ts">
	import Navbar from '$lib/components/Navbar.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import { ArrowRight, Github, Cpu, Rocket, Eye, RefreshCcw, Code2, Paintbrush } from 'lucide-svelte';
	type IconComponent = typeof Cpu;

	type StepItem = { step: string; icon: IconComponent; title: string; desc: string };
	const steps: StepItem[] = [
		{ step: '01', icon: Github, title: 'Paste Your Repo', desc: 'Enter your GitHub repo URL and describe what you want changed in plain language.' },
		{ step: '02', icon: Cpu, title: 'AI Builds a Preview', desc: 'Our AI clones your repo, applies your changes, and deploys a live preview you can inspect.' },
		{ step: '03', icon: Rocket, title: 'Approve or Refine', desc: 'Happy? Approve to deploy. Want tweaks? Refine your prompt and we\'ll rebuild instantly.' }
	];

	type UseCaseItem = { icon: IconComponent; title: string; desc: string };
	const useCases: UseCaseItem[] = [
		{ icon: Paintbrush, title: 'Visual Overhauls', desc: 'Update colors, typography, layouts, or make your site mobile-friendly with a single prompt.' },
		{ icon: Code2, title: 'Feature Changes', desc: 'Add new pages, fix bugs, refactor components, or integrate APIs — just describe it.' },
		{ icon: RefreshCcw, title: 'Full Rebuilds', desc: 'Migrate to modern stacks. Describe the end state and let the AI handle the transformation.' },
		{ icon: Eye, title: 'Preview Before Deploy', desc: 'Every change gets a live preview URL. Review and approve before anything touches production.' }
	];

	const trustBadges = ['Powered by Cubicube™', 'Cloudflare Edge', 'AI-Driven Builds', 'Live Preview Deploys'];
</script>

<Navbar />

<main class="pt-16">
	<!-- ═══════════════════════════════════════════════════════════════
	     HERO
	     ═══════════════════════════════════════════════════════════════ -->
	<section class="relative overflow-hidden bg-gradient-to-b from-brand-50 via-white to-white dark:from-surface-900 dark:via-surface-950 dark:to-surface-950">
		<div class="container-content py-24 sm:py-32 text-center">
			<div class="inline-flex items-center gap-2 rounded-full bg-brand-100 dark:bg-brand-950 px-4 py-1.5 text-sm font-medium text-brand-700 dark:text-brand-300 mb-6">
				<Cpu class="w-4 h-4" />
				Powered by Cubicube™
			</div>

			<h1 class="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-surface-900 dark:text-white leading-tight max-w-3xl mx-auto">
				Retool Your Website
				<span class="text-brand-600 dark:text-brand-400">with AI.</span>
			</h1>

			<p class="mt-6 text-lg sm:text-xl text-surface-600 dark:text-surface-400 max-w-2xl mx-auto leading-relaxed">
				Paste your GitHub repo, describe what you want changed, and get a live preview. Approve or refine until it's perfect.
			</p>

			<div class="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
				<a href="/retool" class="btn-primary text-base px-8 py-3 gap-2">
					Retool My Site <ArrowRight class="w-5 h-5" />
				</a>
				<a href="#how-it-works" class="btn-secondary text-base px-8 py-3">
					See How It Works
				</a>
			</div>
		</div>
	</section>

	<!-- ═══════════════════════════════════════════════════════════════
	     HOW IT WORKS
	     ═══════════════════════════════════════════════════════════════ -->
	<section id="how-it-works" class="py-20 sm:py-28 bg-white dark:bg-surface-950">
		<div class="container-content">
			<div class="text-center mb-16">
				<h2 class="text-3xl sm:text-4xl font-bold text-surface-900 dark:text-white">How It Works</h2>
				<p class="mt-4 text-surface-500 dark:text-surface-400 max-w-xl mx-auto">Three steps from repo to retooled site.</p>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
				{#each steps as item}
					<div class="text-center">
						<div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400 mb-5">
							<svelte:component this={item.icon} class="w-7 h-7" />
						</div>
						<div class="text-xs font-bold text-brand-500 uppercase tracking-widest mb-2">Step {item.step}</div>
						<h3 class="text-xl font-semibold text-surface-900 dark:text-white mb-2">{item.title}</h3>
						<p class="text-surface-500 dark:text-surface-400 leading-relaxed">{item.desc}</p>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- ═══════════════════════════════════════════════════════════════
	     USE CASES
	     ═══════════════════════════════════════════════════════════════ -->
	<section id="use-cases" class="py-20 sm:py-28 bg-surface-50 dark:bg-surface-900">
		<div class="container-content">
			<div class="text-center mb-16">
				<h2 class="text-3xl sm:text-4xl font-bold text-surface-900 dark:text-white">What Can You Retool?</h2>
				<p class="mt-4 text-surface-500 dark:text-surface-400 max-w-xl mx-auto">From quick visual tweaks to full-stack rebuilds.</p>
			</div>

			<div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
				{#each useCases as item}
					<div class="card-hover">
						<svelte:component this={item.icon} class="w-8 h-8 text-brand-600 dark:text-brand-400 mb-4" />
						<h3 class="text-lg font-semibold text-surface-900 dark:text-white mb-2">{item.title}</h3>
						<p class="text-sm text-surface-500 dark:text-surface-400 leading-relaxed">{item.desc}</p>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- ═══════════════════════════════════════════════════════════════
	     TRUST / SOCIAL PROOF
	     ═══════════════════════════════════════════════════════════════ -->
	<section class="py-20 sm:py-28 bg-white dark:bg-surface-950">
		<div class="container-narrow text-center">
			<h2 class="text-3xl sm:text-4xl font-bold text-surface-900 dark:text-white mb-6">Built on Proven Infrastructure</h2>
			<p class="text-surface-500 dark:text-surface-400 max-w-xl mx-auto mb-12">
				Retools uses Cubicube's building tools and deployment mechanisms. Every build runs on Cloudflare's global edge.
			</p>

			<div class="grid grid-cols-2 md:grid-cols-4 gap-6">
				{#each trustBadges as badge}
					<div class="card text-center py-6">
						<p class="text-sm font-semibold text-surface-700 dark:text-surface-300">{badge}</p>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- ═══════════════════════════════════════════════════════════════
	     FINAL CTA
	     ═══════════════════════════════════════════════════════════════ -->
	<section class="py-20 sm:py-28 bg-brand-600 dark:bg-brand-700">
		<div class="container-narrow text-center">
			<h2 class="text-3xl sm:text-4xl font-bold text-white mb-4">Ready to Retool?</h2>
			<p class="text-brand-100 max-w-lg mx-auto mb-8">
				Paste your repo, describe the changes, and get a live preview in minutes.
			</p>
			<a href="/retool" class="inline-flex items-center gap-2 bg-white text-brand-700 font-semibold px-8 py-3 rounded-lg hover:bg-brand-50 transition-colors">
				Retool My Site <ArrowRight class="w-5 h-5" />
			</a>
		</div>
	</section>
</main>

<Footer />
