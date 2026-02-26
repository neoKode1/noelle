<script lang="ts">
	import { onMount } from 'svelte';

	onMount(() => {
		if (typeof window === 'undefined') return;

		// Load UnicornStudio runtime (idempotent — skips if already loaded)
		if (!(window as any).UnicornStudio) {
			(window as any).UnicornStudio = { isInitialized: false };
			const script = document.createElement('script');
			script.src =
				'https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v1.4.29/dist/unicornStudio.umd.js';
			script.onload = () => {
				if (!(window as any).UnicornStudio.isInitialized) {
					(window as any).UnicornStudio.init();
					(window as any).UnicornStudio.isInitialized = true;
				}
			};
			(document.head || document.body).appendChild(script);
		} else if ((window as any).UnicornStudio.isInitialized === false) {
			(window as any).UnicornStudio.init();
			(window as any).UnicornStudio.isInitialized = true;
		}
	});
</script>

<!--
  Fixed full-screen UnicornStudio background.
  Sits at z-index -10 (behind all page content).

  Layers (bottom → top):
  1. UnicornStudio WebGL scene  (50% opacity)
  2. Color-blend overlay        (#030304 @ 50% + indigo/navy gradient @ 30%)
  3. Bottom fade-out mask       (transitions into page bg)
-->
<div
	class="unicorn-bg"
	aria-hidden="true"
>
	<!-- 1. Scene -->
	<div class="unicorn-scene" style="opacity: 1;">
		<div
			data-us-project="ILgOO23w4wEyPQOKyLO4"
			class="absolute inset-0"
		></div>
	</div>

	<!-- 2. Dark blend overlay — locks colours to our palette -->
	<div class="unicorn-blend"></div>

	<!-- 3. Bottom fade — content sections sit on solid #030304 -->
	<div class="unicorn-fade"></div>
</div>

<style>
	/* Wrapper */
	.unicorn-bg {
		position: fixed;
		inset: 0;
		width: 100%;
		height: 100vh;
		z-index: -10;
		pointer-events: none;
		overflow: hidden;
	}

	/* Scene shell */
	.unicorn-scene {
		position: absolute;
		inset: 0;
	}

	/* Blend: light tint only — let the scene breathe */
	.unicorn-blend {
		position: absolute;
		inset: 0;
		background:
			/* Nexartis navy top-left glow */
			radial-gradient(ellipse 60% 50% at 20% 10%, rgba(10, 18, 69, 0.25) 0%, transparent 70%),
			/* Indigo brand mid-centre glow */
			radial-gradient(ellipse 50% 40% at 70% 40%, rgba(99, 102, 241, 0.10) 0%, transparent 65%);
	}

	/* Fade the scene out at the bottom so sections blend seamlessly */
	.unicorn-fade {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: 45vh;
		background: linear-gradient(to bottom, transparent 0%, #030304 100%);
	}
</style>

