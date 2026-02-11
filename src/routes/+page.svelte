<script lang="ts">
	import Navbar from '$lib/components/Navbar.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import { ArrowRight, MessageSquareText, Cpu, Rocket, Paintbrush, Blocks, LayoutDashboard, RefreshCcw, Plug, Check } from 'lucide-svelte';
	type IconComponent = typeof MessageSquareText;

	type StepItem = { step: string; icon: IconComponent; title: string; desc: string };
	const steps: StepItem[] = [
		{ step: '01', icon: MessageSquareText, title: 'Describe', desc: 'Tell us what you need through our guided intake wizard. Share your site, reference URLs, and requirements.' },
		{ step: '02', icon: Cpu, title: 'We Build', desc: 'Our AI agents analyze your request, generate a scope, and build the solution with human-in-the-loop review.' },
		{ step: '03', icon: Rocket, title: 'We Deploy', desc: 'Preview, approve, and go live. Track progress in your dashboard and communicate with our system in real time.' }
	];

	type UseCaseItem = { icon: IconComponent; title: string; desc: string };
	const useCases: UseCaseItem[] = [
		{ icon: Paintbrush, title: 'Style & Visual Changes', desc: 'Modernize your look, update branding, make it mobile-friendly, or match a reference design.' },
		{ icon: Blocks, title: 'Feature Addition', desc: 'Add dashboards, auth, booking systems, search, filtering, or any custom feature you describe.' },
		{ icon: LayoutDashboard, title: 'Internal Tools', desc: 'Build IT ticket systems, inventory trackers, shift management, or reporting dashboards.' },
		{ icon: RefreshCcw, title: 'Full Rebuild', desc: 'Migrate from WordPress or legacy systems to a modern, scalable stack.' },
		{ icon: Plug, title: 'Integrations & APIs', desc: 'Connect to Slack, Stripe, Salesforce, or sync data between any systems.' },
		{ icon: Cpu, title: 'Workflow Automation', desc: 'Automate manual processes, create triggers, and build smart pipelines.' }
	];

	type PricingTier = { name: string; price: string; desc: string; features: string[]; cta: string; featured: boolean };
	const tiers: PricingTier[] = [
		{
			name: 'Quick Fix', price: '$499', desc: 'Style changes, branding updates, mobile optimization',
			features: ['Visual & style changes', 'Branding refresh', 'Mobile responsive', '48-hour turnaround', '1 revision round'],
			cta: 'Get Started', featured: false
		},
		{
			name: 'Feature Build', price: '$2,499', desc: 'New features, internal tools, dashboards',
			features: ['Everything in Quick Fix', 'Custom feature development', 'Database setup', 'Authentication & roles', '3 revision rounds', 'Priority support'],
			cta: 'Start Building', featured: true
		},
		{
			name: 'Full Retool', price: 'Custom', desc: 'Complete rebuilds, migrations, complex systems',
			features: ['Everything in Feature Build', 'Full-stack rebuild', 'Data migration', 'Third-party integrations', 'Ongoing support', 'Dedicated project lead'],
			cta: 'Contact Us', featured: false
		}
	];

	const trustBadges = ['Cloudflare Edge', 'AI-Powered Scoping', 'Preview Deploys', 'SOC2 Ready'];
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
				AI-Powered Software Retooling
			</div>

			<h1 class="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-surface-900 dark:text-white leading-tight max-w-3xl mx-auto">
				Retool Your Software.
				<span class="text-brand-600 dark:text-brand-400">Automatically.</span>
			</h1>

			<p class="mt-6 text-lg sm:text-xl text-surface-600 dark:text-surface-400 max-w-2xl mx-auto leading-relaxed">
				Describe what you need — a style refresh, a new feature, an internal tool, or a full rebuild. Our agentic system scopes, builds, and deploys it.
			</p>

			<div class="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
				<a href="/intake" class="btn-primary text-base px-8 py-3 gap-2">
					Start a Project <ArrowRight class="w-5 h-5" />
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
				<p class="mt-4 text-surface-500 dark:text-surface-400 max-w-xl mx-auto">Three steps from idea to deployed solution.</p>
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

			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
	     PRICING
	     ═══════════════════════════════════════════════════════════════ -->
	<section id="pricing" class="py-20 sm:py-28 bg-white dark:bg-surface-950">
		<div class="container-content">
			<div class="text-center mb-16">
				<h2 class="text-3xl sm:text-4xl font-bold text-surface-900 dark:text-white">Simple, Transparent Pricing</h2>
				<p class="mt-4 text-surface-500 dark:text-surface-400 max-w-xl mx-auto">Pay for what you need. No hidden fees.</p>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
				{#each tiers as tier}
					<div class="card relative {tier.featured ? 'border-brand-500 dark:border-brand-400 ring-1 ring-brand-500/20' : ''}">
						{#if tier.featured}
							<div class="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-xs font-semibold px-3 py-1 rounded-full">Most Popular</div>
						{/if}
						<h3 class="text-lg font-semibold text-surface-900 dark:text-white">{tier.name}</h3>
						<div class="mt-3">
							<span class="text-4xl font-extrabold text-surface-900 dark:text-white">{tier.price}</span>
							{#if tier.price !== 'Custom'}
								<span class="text-surface-500 dark:text-surface-400 text-sm"> / project</span>
							{/if}
						</div>
						<p class="mt-2 text-sm text-surface-500 dark:text-surface-400">{tier.desc}</p>

						<ul class="mt-6 space-y-3">
							{#each tier.features as feature}
								<li class="flex items-start gap-2 text-sm text-surface-600 dark:text-surface-300">
									<Check class="w-4 h-4 text-brand-500 mt-0.5 shrink-0" />
									{feature}
								</li>
							{/each}
						</ul>

						<a href="/intake" class="mt-8 block text-center {tier.featured ? 'btn-primary' : 'btn-secondary'} w-full">
							{tier.cta}
						</a>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- ═══════════════════════════════════════════════════════════════
	     TRUST / SOCIAL PROOF
	     ═══════════════════════════════════════════════════════════════ -->
	<section class="py-20 sm:py-28 bg-surface-50 dark:bg-surface-900">
		<div class="container-narrow text-center">
			<h2 class="text-3xl sm:text-4xl font-bold text-surface-900 dark:text-white mb-6">Built on Proven Technology</h2>
			<p class="text-surface-500 dark:text-surface-400 max-w-xl mx-auto mb-12">
				Powered by Cloudflare's global edge network and state-of-the-art AI. Your projects are fast, secure, and reliable.
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
				Tell us what you need and get a project scope within 24 hours.
			</p>
			<a href="/intake" class="inline-flex items-center gap-2 bg-white text-brand-700 font-semibold px-8 py-3 rounded-lg hover:bg-brand-50 transition-colors">
				Start Your Project <ArrowRight class="w-5 h-5" />
			</a>
		</div>
	</section>
</main>

<Footer />

