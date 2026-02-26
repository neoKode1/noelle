<script lang="ts">
	import Navbar from '$lib/components/Navbar.svelte';
	import Footer from '$lib/components/Footer.svelte';
</script>

<svelte:head>
	<title>Privacy Policy | Noelle</title>
</svelte:head>

<Navbar />

<main class="pt-16 min-h-screen">
	<div class="container-content max-w-3xl py-16 sm:py-24">
		<h1 class="text-3xl font-medium text-white mb-2">Privacy Policy</h1>
		<p class="text-sm text-slate-500 mb-10">Last updated: February 2026</p>

		<div class="prose prose-invert prose-slate max-w-none space-y-8 text-sm text-slate-400 leading-relaxed">
			<section>
				<h2 class="text-base font-semibold text-white mb-2">1. Information We Collect</h2>
				<p>When you use Noelle, we collect your email address (for sign-in), GitHub repository information (owner, repo name, branch), the prompts you provide, and job status/results. We do not sell your data to third parties.</p>
			</section>

			<section>
				<h2 class="text-base font-semibold text-white mb-2">2. How We Use Your Information</h2>
				<p>We use your information to authenticate you, execute build jobs, track job status, and improve the Service. Your prompts and repository information are used solely to generate the requested code changes.</p>
			</section>

			<section>
				<h2 class="text-base font-semibold text-white mb-2">3. GitHub Tokens</h2>
				<p>GitHub personal access tokens you provide are used transiently during a build job to create branches, push code, and open pull requests. Tokens are not stored in our database after job completion.</p>
			</section>

			<section>
				<h2 class="text-base font-semibold text-white mb-2">4. Data Storage</h2>
				<p>Job records (status, prompts, PR links) are stored in a Cloudflare D1 database. Email addresses are stored for authentication purposes. We use industry-standard security practices to protect your data.</p>
			</section>

			<section>
				<h2 class="text-base font-semibold text-white mb-2">5. Third-Party Services</h2>
				<p>Noelle uses Anthropic (Claude) and Google (Gemini) AI APIs to process your requests. Your prompts and repository context are sent to these providers to generate code. Please review their respective privacy policies.</p>
			</section>

			<section>
				<h2 class="text-base font-semibold text-white mb-2">6. Your Rights</h2>
				<p>You may request deletion of your data by contacting us. We will delete your job records and email address within 30 days of a verified request.</p>
			</section>

			<section>
				<h2 class="text-base font-semibold text-white mb-2">7. Contact</h2>
				<p>For privacy-related questions, contact us at <a href="mailto:hello@thenoelle.app" class="text-brand-400 hover:text-brand-300 underline underline-offset-2">hello@thenoelle.app</a>.</p>
			</section>
		</div>
	</div>
</main>

<Footer />

