<script lang="ts">
	import Navbar from '$lib/components/Navbar.svelte';
	import Footer from '$lib/components/Footer.svelte';
</script>

<svelte:head>
	<title>Terms of Service | Noelle</title>
</svelte:head>

<Navbar />

<main class="pt-16 min-h-screen">
	<div class="container-content max-w-3xl py-16 sm:py-24">
		<h1 class="text-3xl font-medium text-white mb-2">Terms of Service</h1>
		<p class="text-sm text-slate-500 mb-10">Last updated: February 2026</p>

		<div class="prose prose-invert prose-slate max-w-none space-y-8 text-sm text-slate-400 leading-relaxed">
			<section>
				<h2 class="text-base font-semibold text-white mb-2">1. Acceptance of Terms</h2>
				<p>By accessing or using Noelle ("the Service"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.</p>
			</section>

			<section>
				<h2 class="text-base font-semibold text-white mb-2">2. Description of Service</h2>
				<p>Noelle is an AI-powered code generation platform that creates pull requests on your GitHub repositories based on natural language instructions. The Service is provided as-is and is subject to change at any time.</p>
			</section>

			<section>
				<h2 class="text-base font-semibold text-white mb-2">3. Your Responsibilities</h2>
				<p>You are responsible for any code generated and merged into your repositories. You must review all pull requests before merging. You must not use the Service to generate malicious, illegal, or harmful code.</p>
			</section>

			<section>
				<h2 class="text-base font-semibold text-white mb-2">4. GitHub Tokens</h2>
				<p>You provide GitHub personal access tokens to authorize the Service to act on your behalf. Noelle stores tokens only for the duration of a build job and does not persist them beyond that scope.</p>
			</section>

			<section>
				<h2 class="text-base font-semibold text-white mb-2">5. Limitation of Liability</h2>
				<p>Noelle and its operators are not liable for any damages arising from code changes made to your repositories. Use the Service at your own risk. Always review generated pull requests before merging.</p>
			</section>

			<section>
				<h2 class="text-base font-semibold text-white mb-2">6. Changes to Terms</h2>
				<p>We may update these Terms at any time. Continued use of the Service after changes constitutes your acceptance of the revised Terms.</p>
			</section>

			<section>
				<h2 class="text-base font-semibold text-white mb-2">7. Contact</h2>
				<p>For questions about these Terms, contact us at <a href="mailto:hello@thenoelle.app" class="text-brand-400 hover:text-brand-300 underline underline-offset-2">hello@thenoelle.app</a>.</p>
			</section>
		</div>
	</div>
</main>

<Footer />

