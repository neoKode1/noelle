<script lang="ts">
	import { Wrench } from 'lucide-svelte';
</script>

<footer class="bg-surface-900 dark:bg-surface-950 text-surface-400 border-t border-surface-800">
	<div class="container-wide py-12">
		<div class="grid grid-cols-1 md:grid-cols-4 gap-8">
			<!-- Brand -->
			<div class="md:col-span-1">
				<div class="flex items-center gap-2 text-white font-bold text-lg mb-3">
					<Wrench class="w-5 h-5 text-brand-400" />
					Retools
				</div>
				<p class="text-sm leading-relaxed">
					Paste your repo, describe what you want changed. Powered by Cubicube™.
				</p>
			</div>

			<!-- Product -->
			<div>
				<h4 class="text-white font-semibold text-sm mb-3">Product</h4>
				<ul class="space-y-2 text-sm">
					<li><a href="/#how-it-works" class="hover:text-white transition-colors">How It Works</a></li>
					<li><a href="/retool" class="hover:text-white transition-colors">Retool a Site</a></li>
					<li><a href="/dashboard" class="hover:text-white transition-colors">Dashboard</a></li>
				</ul>
			</div>

			<!-- Company -->
			<div>
				<h4 class="text-white font-semibold text-sm mb-3">Company</h4>
				<ul class="space-y-2 text-sm">
					<li><a href="/legal/privacy" class="hover:text-white transition-colors">Privacy</a></li>
					<li><a href="/legal/terms" class="hover:text-white transition-colors">Terms</a></li>
				</ul>
			</div>

			<!-- Contact -->
			<div>
				<h4 class="text-white font-semibold text-sm mb-3">Contact</h4>
				<ul class="space-y-2 text-sm">
					<li><a href="mailto:hello@retools.dev" class="hover:text-white transition-colors">hello@retools.dev</a></li>
				</ul>
			</div>
		</div>

		<div class="mt-10 pt-6 border-t border-surface-800 text-center text-xs text-surface-500">
			&copy; {new Date().getFullYear()} Retools. All rights reserved.
		</div>
	</div>
</footer>

