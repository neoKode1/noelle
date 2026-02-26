<script lang="ts">
	import Icon from '@iconify/svelte';
	const currentYear = new Date().getFullYear();
</script>

<style>
	.footer-link {
		transition: color 0.3s ease;
	}
	.footer-link:hover {
		color: white;
	}
</style>

<!-- Nexartis corporate footer -->
<footer class="text-white relative overflow-hidden">
	<!-- Gradient background matching Nexartis brand -->
	<div class="absolute inset-0 bg-gradient-to-b from-[#0a1245] to-[#050a2e]"></div>
	<!-- Subtle top glow -->
	<div class="absolute top-0 left-1/4 w-96 h-96 bg-[#101d6e]/20 rounded-full blur-3xl pointer-events-none"></div>

	<div class="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 py-20 relative z-10">
		<div class="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">

			<!-- Brand column -->
			<div class="lg:col-span-5">
				<div class="max-w-md">
					<!-- Nexartis + Noelle lockup -->
					<div class="mb-8">
						<div class="flex items-center gap-3 mb-2">
							<!-- Nexartis wordmark in Nexartis navy style -->
							<span class="text-white font-bold text-lg tracking-tight uppercase" style="font-family: 'Inter', system-ui, sans-serif; letter-spacing: 0.08em;">NEXARTIS</span>
							<span class="text-white/30 text-lg">×</span>
							<!-- Noelle badge -->
							<div class="flex items-center gap-1.5">
								<div class="w-5 h-5 rounded bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-[9px] font-bold">N</div>
								<span class="text-white font-semibold tracking-tight uppercase text-sm">Noelle</span>
							</div>
						</div>
						<p class="text-white/30 text-xs tracking-widest uppercase" style="font-family: 'Roboto', sans-serif;">A Nexartis Technology Product</p>
					</div>

					<p class="text-white/60 text-sm leading-relaxed" style="font-family: 'Roboto', sans-serif;">
						Nexartis provides the scalable infrastructure and AI tools that allow teams to retool
						their software automatically — every idea is buildable, every change is reviewable,
						every deployment is verifiable.
					</p>

					<!-- Social icons -->
					<div class="flex space-x-4 mt-8">
						<a href="https://twitter.com/NEXARTIS_" target="_blank" rel="noopener noreferrer"
							class="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:bg-white/10 hover:text-white hover:border-white/20 transition-all"
							aria-label="Follow Nexartis on X (Twitter)">
							<Icon icon="simple-icons:x" width="16" height="16" />
						</a>
						<a href="https://linkedin.com/company/nexartis" target="_blank" rel="noopener noreferrer"
							class="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:bg-white/10 hover:text-white hover:border-white/20 transition-all"
							aria-label="Follow Nexartis on LinkedIn">
							<Icon icon="simple-icons:linkedin" width="16" height="16" />
						</a>
					</div>
				</div>
			</div>

			<!-- Right columns -->
			<div class="lg:col-span-7">
				<div class="grid grid-cols-1 sm:grid-cols-3 gap-8 lg:gap-10">

					<!-- Product column -->
					<div>
						<h3 class="text-xs font-medium mb-6 uppercase tracking-widest text-white/40" style="font-family: 'Roboto', sans-serif;">Product</h3>
						<ul class="space-y-3">
							<li><a href="/#how-it-works" class="footer-link text-white/60 text-sm" style="font-family: 'Roboto', sans-serif;">How It Works</a></li>
							<li><a href="/#use-cases" class="footer-link text-white/60 text-sm" style="font-family: 'Roboto', sans-serif;">Use Cases</a></li>
							<li><a href="/retool" class="footer-link text-white/60 text-sm" style="font-family: 'Roboto', sans-serif;">Retool a Site</a></li>
							<li><a href="/dashboard" class="footer-link text-white/60 text-sm" style="font-family: 'Roboto', sans-serif;">Dashboard</a></li>
						</ul>
					</div>

					<!-- Ecosystem column -->
					<div>
						<h3 class="text-xs font-medium mb-6 uppercase tracking-widest text-white/40" style="font-family: 'Roboto', sans-serif;">Ecosystem</h3>
						<ul class="space-y-3">
							<li>
								<a href="https://nexartis.com" target="_blank" rel="noopener noreferrer" class="footer-link text-white/60 text-sm" style="font-family: 'Roboto', sans-serif;">Nexartis</a>
							</li>
							<li>
								<a href="https://nexartis.com" target="_blank" rel="noopener noreferrer" class="footer-link text-white/60 text-sm" style="font-family: 'Roboto', sans-serif;">Noelle Engine</a>
							</li>
							<li><a href="https://helixpods.ai/" target="_blank" rel="noopener noreferrer" class="footer-link text-white/60 text-sm" style="font-family: 'Roboto', sans-serif;">Helix Command Center</a></li>
							<li><a href="https://www.cloudflare.com/" target="_blank" rel="noopener noreferrer" class="footer-link text-white/60 text-sm" style="font-family: 'Roboto', sans-serif;">Cloudflare</a></li>
						</ul>
					</div>

					<!-- Trust & Legal column -->
					<div>
						<h3 class="text-xs font-medium mb-6 uppercase tracking-widest text-white/40" style="font-family: 'Roboto', sans-serif;">Trust & Legal</h3>
						<ul class="space-y-3">
							<li><a href="https://nexartis.com/privacy" target="_blank" rel="noopener noreferrer" class="footer-link text-white/60 text-sm" style="font-family: 'Roboto', sans-serif;">Privacy Policy</a></li>
							<li><a href="https://nexartis.com/transparency" target="_blank" rel="noopener noreferrer" class="footer-link text-white/60 text-sm" style="font-family: 'Roboto', sans-serif;">Statement of Transparency</a></li>
							<li><a href="https://nexartis.com/ai-ethics" target="_blank" rel="noopener noreferrer" class="footer-link text-white/60 text-sm" style="font-family: 'Roboto', sans-serif;">AI Ethics</a></li>
							<li><a href="mailto:hello@noelle.ai" class="footer-link text-white/60 text-sm" style="font-family: 'Roboto', sans-serif;">hello@noelle.ai</a></li>
						</ul>
					</div>

				</div>
			</div>
		</div>

		<!-- Copyright bar -->
		<div class="mt-16 pt-8 border-t border-white/10">
			<div class="flex flex-col sm:flex-row justify-between items-center gap-4">
				<p class="text-white/40 text-xs" style="font-family: 'Roboto', sans-serif;">
					Copyright &copy; {currentYear} Nexartis LLC. All rights reserved.
				</p>
				<p class="text-white/30 text-xs" style="font-family: 'Roboto', sans-serif;">
					Noelle is built on Nexartis Technology Stacks
				</p>
			</div>
		</div>
	</div>
</footer>

