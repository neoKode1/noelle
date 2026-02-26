<script lang="ts">
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
							<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
								<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
							</svg>
						</a>
						<a href="https://linkedin.com/company/nexartis" target="_blank" rel="noopener noreferrer"
							class="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:bg-white/10 hover:text-white hover:border-white/20 transition-all"
							aria-label="Follow Nexartis on LinkedIn">
							<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
								<path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
							</svg>
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

