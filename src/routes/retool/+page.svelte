<script lang="ts">
	import Navbar from '$lib/components/Navbar.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import Icon from '@iconify/svelte';
	import { goto } from '$app/navigation';
	import { EMPTY_RETOOL_FORM, type RetoolFormData, type ImageAttachment } from '$lib/types/retool';

	let form: RetoolFormData = $state({ ...EMPTY_RETOOL_FORM });
	let errorMsg = $state('');
	let screenshots = $state<ImageAttachment[]>([]);
	let fileInput: HTMLInputElement;

	// Branch detection + URL validation state
	// 'idle'    → untouched
	// 'loading' → fetching branches now
	// 'success' → green glow  — repo accessible, branches listed
	// 'warning' → magenta glow — valid GitHub URL but can't reach it yet (private / needs token)
	// 'error'   → red glow    — repo doesn't exist or URL isn't a valid GitHub URL
	let branches = $state<string[]>([]);
	let urlStatus = $state<'idle' | 'loading' | 'success' | 'warning' | 'error'>('idle');
	let urlStatusMsg = $state('');

	// Step-indicator state for the 4 hardware telemetry cards
	let activeCard = $state<'sys' | 'rte' | 'fal' | 'ai'>('sys');
	let submitting = $state(false);

	function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
		try {
			const u = new URL(url.trim());
			if (u.hostname !== 'github.com') return null;
			const parts = u.pathname.replace(/^\//, '').replace(/\.git$/, '').split('/');
			if (parts.length < 2 || !parts[0] || !parts[1]) return null;
			return { owner: parts[0], repo: parts[1] };
		} catch {
			return null;
		}
	}

	async function fetchBranches() {
		const parsed = parseGitHubUrl(form.repoUrl);
		if (!parsed) {
			urlStatus = 'error';
			urlStatusMsg = 'Not a valid GitHub repository URL.';
			branches = [];
			return;
		}

		urlStatus = 'loading';
		urlStatusMsg = '';
		branches = [];

		try {
			const hasToken = form.github_token.trim().length > 0;
			const headers: Record<string, string> = {
				Accept: 'application/vnd.github+json'
			};
			if (hasToken) {
				headers['Authorization'] = `Bearer ${form.github_token.trim()}`;
			}

			const res = await fetch(
				`https://api.github.com/repos/${parsed.owner}/${parsed.repo}/branches?per_page=100`,
				{ headers }
			);

			if (res.ok) {
				const data: { name: string }[] = await res.json();
				branches = data.map((b) => b.name);

				// Auto-select sensible default
				if (!form.branch || !branches.includes(form.branch)) {
					form.branch =
						branches.find((b) => b === 'main') ??
						branches.find((b) => b === 'master') ??
						branches[0] ??
						'';
				}
				urlStatus = 'success';
				urlStatusMsg = `${branches.length} branch${branches.length === 1 ? '' : 'es'} detected`;
			} else if (res.status === 401 || res.status === 403) {
				// Auth required or forbidden
				if (!hasToken) {
					urlStatus = 'warning';
					urlStatusMsg = 'Private repo — add your GitHub token to unlock branches.';
				} else {
					urlStatus = 'error';
					urlStatusMsg = 'Access denied — token may lack repo scope or you don\'t have access.';
				}
			} else if (res.status === 404) {
				urlStatus = 'error';
				urlStatusMsg = 'Repository not found — check the URL or your token permissions.';
			} else {
				urlStatus = 'warning';
				urlStatusMsg = `GitHub returned ${res.status} — branches couldn't be detected. You can type one manually.`;
			}
		} catch {
			urlStatus = 'warning';
			urlStatusMsg = 'Network error — couldn\'t reach GitHub. You can type a branch manually.';
		}
	}

	function onRepoUrlBlur() {
		const trimmed = form.repoUrl.trim();
		if (!trimmed) { urlStatus = 'idle'; urlStatusMsg = ''; branches = []; return; }
		activeCard = 'rte';
		fetchBranches();
	}

	function onTokenBlur() {
		// Re-fetch if URL is already filled and we haven't succeeded yet
		if (form.github_token.trim() && form.repoUrl.trim() && urlStatus !== 'success') {
			fetchBranches();
		}
	}

	const MAX_FILE_SIZE_MB = 100;

	/** Convert a File to an ImageAttachment (base64). */
	async function fileToAttachment(file: File): Promise<ImageAttachment | null> {
		if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
			errorMsg = `${file.name} exceeds the ${MAX_FILE_SIZE_MB} MB limit.`;
			return null;
		}
		if (!file.type.startsWith('image/')) {
			errorMsg = `${file.name} is not an image file.`;
			return null;
		}
		return new Promise((resolve) => {
			const reader = new FileReader();
			reader.onload = () => {
				const dataUrl = reader.result as string;
				const base64 = dataUrl.split(',')[1];
				resolve({ name: file.name, mimeType: file.type, data: base64 });
			};
			reader.readAsDataURL(file);
		});
	}

	async function handleFiles(files: FileList | File[]) {
		errorMsg = '';
		const arr = Array.from(files);
		const results = await Promise.all(arr.map(fileToAttachment));
		const valid = results.filter((r): r is ImageAttachment => r !== null);
		screenshots = [...screenshots, ...valid];
	}

	function handleFileInput(e: Event) {
		const input = e.target as HTMLInputElement;
		if (input.files) handleFiles(input.files);
		input.value = '';
	}

	function handlePaste(e: ClipboardEvent) {
		const items = e.clipboardData?.items;
		if (!items) return;
		const imageFiles: File[] = [];
		for (const item of Array.from(items)) {
			if (item.kind === 'file' && item.type.startsWith('image/')) {
				const file = item.getAsFile();
				if (file) imageFiles.push(file);
			}
		}
		if (imageFiles.length) handleFiles(imageFiles);
	}

	function removeScreenshot(index: number) {
		screenshots = screenshots.filter((_, i) => i !== index);
	}

	async function handleSubmit() {
		errorMsg = '';
		if (!form.repoUrl.trim()) { errorMsg = 'GitHub repo URL is required.'; return; }
		if (!form.github_token.trim()) { errorMsg = 'GitHub token is required.'; return; }
		if (!form.prompt.trim()) { errorMsg = 'Describe what you want changed.'; return; }

		// Activate AI card animation
		activeCard = 'ai';
		submitting = true;

		// Generate the job ID here so we can navigate before the API responds.
		const jobId = `job-${crypto.randomUUID()}`;

		// Brief pause to show AI radar animation before navigating.
		await new Promise((r) => setTimeout(r, 900));

		// Navigate immediately — the dashboard will poll until the job exists.
		goto(`/dashboard/${jobId}`);

		// Fire the API call in the background (not awaited before navigation).
		fetch('/api/retool', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ ...form, screenshots, job_id: jobId })
		}).catch((e) => {
			console.error('[retool] background submission error:', e);
		});
	}
</script>

<svelte:head>
	<title>Build with Noelle | Noelle</title>
</svelte:head>

<Navbar />

<main class="pt-16 min-h-screen">
	<!-- Background accent -->
	<div class="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] hero-glow pointer-events-none opacity-30"></div>

	<div class="relative container-content py-16 sm:py-24">
		<!-- Header -->
		<div class="text-center mb-10">
			<div class="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand-500/30 bg-brand-500/10 text-brand-300 text-[11px] font-medium mb-5">
				<span class="relative flex h-2 w-2">
					<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
					<span class="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
				</span>
				AI-Powered · PR Mode Only
			</div>
			<h1 class="text-4xl font-medium text-white tracking-tight mb-3">Build with Noelle</h1>
			<p class="text-slate-400 max-w-lg mx-auto text-sm leading-relaxed">
				Paste your GitHub repo, describe what you want changed, and we'll open a PR with the AI-generated results.
			</p>
		</div>

		<!-- ── Hardware Telemetry Step Indicators ── -->
		<div class="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-10">

			<!-- SYS.01 — Real-Time Monitoring -->
			<div
				class="hw-card hw-card-sys flex flex-col w-full rounded-2xl p-5 relative overflow-hidden"
				class:is-active={activeCard === 'sys'}
				class:is-inactive={activeCard !== 'sys'}
				style="background: linear-gradient(to bottom, #3f3f46 0%, #27272a 8%, #18181b 100%); box-shadow: 0 20px 40px -10px rgba(0,0,0,0.9), inset 0 2px 2px rgba(255,255,255,0.15), inset 0 -2px 4px rgba(0,0,0,0.8), inset 0 0 10px rgba(0,0,0,0.5); border: 1px solid #111;"
			>
				<div class="absolute inset-0 opacity-[0.15] pointer-events-none mix-blend-overlay" style="background-image: url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E');"></div>
				<div class="relative z-10 flex justify-between items-center mb-4 pl-1 pr-1 mt-1">
					<span class="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">SYS.01</span>
					<div class="relative w-4 h-4 rounded-full bg-zinc-900 flex items-center justify-center" style="box-shadow: inset 0 2px 4px rgba(0,0,0,1);">
						<div class="relative w-2.5 h-2.5 rounded-full bg-orange-950 border border-black">
							<div class="absolute inset-0 rounded-full bg-gradient-to-br from-orange-300 to-orange-600 transition-opacity duration-500" class:opacity-100={activeCard === 'sys'} class:opacity-0={activeCard !== 'sys'} style="box-shadow: 0 0 8px #f97316;"></div>
						</div>
					</div>
				</div>
				<div class="relative z-10 mb-4 w-full h-28 bg-zinc-950 rounded overflow-hidden border border-black" style="box-shadow: inset 0 8px 16px rgba(0,0,0,1);">
					<div class="absolute inset-0 pointer-events-none z-30" style="background: linear-gradient(to bottom, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 40%, transparent 40%);"></div>
					<div class="absolute inset-0 opacity-20 z-0" style="background-image: linear-gradient(rgba(249,115,22,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(249,115,22,0.4) 1px, transparent 1px); background-size: 10px 10px;"></div>
					<div class="scan-sweep absolute top-0 bottom-0 left-0 w-16 bg-gradient-to-r from-transparent via-orange-500/20 to-transparent z-10 pointer-events-none"></div>
					<svg class="absolute inset-0 w-full h-full z-10 pt-2" preserveAspectRatio="none" viewBox="0 0 100 40">
						<defs>
							<linearGradient id="trace-gradient-sys01" x1="0%" y1="0%" x2="0%" y2="100%">
								<stop offset="0%" stop-color="#f97316" stop-opacity="0.3"></stop>
								<stop offset="100%" stop-color="#f97316" stop-opacity="0.0"></stop>
							</linearGradient>
						</defs>
						<path d="M0,25 L5,26 L10,24 L15,18 L18,28 L22,8 L26,32 L30,22 L35,24 L45,21 L55,23 L60,19 L65,12 L70,25 L80,22 L90,26 L100,24 L100,40 L0,40 Z" fill="url(#trace-gradient-sys01)"></path>
						<path d="M0,25 L5,26 L10,24 L15,18 L18,28 L22,8 L26,32 L30,22 L35,24 L45,21 L55,23 L60,19 L65,12 L70,25 L80,22 L90,26 L100,24" fill="none" stroke="#f97316" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="opacity-80" style="filter: drop-shadow(0 0 4px rgba(249,115,22,1));"></path>
					</svg>
					<div class="absolute top-1.5 left-2 z-20"><span class="text-[8px] font-bold text-orange-500/80 uppercase tracking-widest">Stream.IO</span></div>
					<div class="absolute top-1.5 right-2 z-20 flex items-center gap-1">
						<div class="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_6px_#f97316] animate-pulse"></div>
						<span class="text-[9px] font-mono text-orange-100">LIVE</span>
					</div>
					<div class="absolute bottom-0 inset-x-0 h-5 bg-black/80 border-t border-orange-500/30 z-20 flex items-center justify-between px-2">
						<div class="flex items-center gap-1"><span class="text-[7px] text-zinc-500 font-mono">RX</span><span class="text-[9px] text-zinc-300 font-mono">48.2k</span></div>
						<div class="flex items-center gap-1"><span class="text-[7px] text-zinc-500 font-mono">TX</span><span class="text-[9px] text-zinc-300 font-mono">12.1k</span></div>
						<div class="flex items-center gap-1"><span class="text-[7px] text-zinc-500 font-mono">ERR</span><span class="text-[9px] text-green-400 font-mono">0.00</span></div>
					</div>
				</div>
				<div class="relative z-10 mt-auto">
					<h3 class="text-xs text-zinc-200 font-medium tracking-tight mb-0.5">Real-Time Monitoring</h3>
					<p class="text-[11px] text-zinc-500 leading-relaxed">System telemetry online.</p>
				</div>
			</div>

			<!-- RTE.02 — Adaptive Routing -->
			<div
				class="hw-card hw-card-rte flex flex-col w-full rounded-2xl p-5 relative overflow-hidden"
				class:is-active={activeCard === 'rte'}
				class:is-inactive={activeCard !== 'rte'}
				class:rte-loading={urlStatus === 'loading'}
				class:rte-success={urlStatus === 'success'}
				class:rte-error={urlStatus === 'error' || urlStatus === 'warning'}
				style="background: linear-gradient(to bottom, #3f3f46 0%, #27272a 8%, #18181b 100%); box-shadow: 0 20px 40px -10px rgba(0,0,0,0.9), inset 0 2px 2px rgba(255,255,255,0.15), inset 0 -2px 4px rgba(0,0,0,0.8), inset 0 0 10px rgba(0,0,0,0.5); border: 1px solid #111;"
			>
				<div class="absolute inset-0 opacity-[0.15] pointer-events-none mix-blend-overlay" style="background-image: url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E');"></div>
				<div class="relative z-10 flex justify-between items-center mb-4 pl-1 pr-1 mt-1">
					<span class="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">RTE.02</span>
					<div class="relative w-4 h-4 rounded-full bg-zinc-900 flex items-center justify-center" style="box-shadow: inset 0 2px 4px rgba(0,0,0,1);">
						<div class="relative w-2.5 h-2.5 rounded-full bg-orange-950 border border-black">
							<div class="absolute inset-0 rounded-full bg-gradient-to-br from-orange-300 to-orange-600 transition-opacity duration-500" class:opacity-100={activeCard === 'rte'} class:opacity-0={activeCard !== 'rte'} style="box-shadow: 0 0 8px #f97316;"></div>
						</div>
					</div>
				</div>
				<div class="relative z-10 mb-4 flex gap-2 h-28">
					<div class="w-8 h-full bg-zinc-900 rounded flex flex-col items-center justify-between py-1.5 px-0.5" style="box-shadow: inset 0 2px 4px rgba(0,0,0,0.8);">
						<span class="text-[6px] font-bold text-zinc-500 tracking-wider">LOAD</span>
						<div class="w-full flex-1 mt-1 mb-0.5 flex flex-col justify-between gap-[2px] bg-zinc-950 p-0.5 rounded shadow-inner border border-black">
							<div class="rte-bar rte-bar-5 w-full flex-1 rounded-[1px] transition-all duration-200 bg-red-950 border border-red-900/30"></div>
							<div class="rte-bar rte-bar-4 w-full flex-1 rounded-[1px] transition-all duration-200 bg-orange-950 border border-orange-900/30"></div>
							<div class="rte-bar rte-bar-3 w-full flex-1 rounded-[1px] transition-all duration-200 bg-orange-950 border border-orange-900/30"></div>
							<div class="rte-bar rte-bar-2 w-full flex-1 rounded-[1px] transition-all duration-200 bg-green-950 border border-green-900/30"></div>
							<div class="w-full flex-1 rounded-[1px] bg-green-500 border border-green-400 shadow-[0_0_6px_#22c55e]"></div>
						</div>
					</div>
					<div class="flex-1 h-full bg-zinc-950 rounded relative border border-black overflow-hidden" style="box-shadow: inset 0 8px 16px rgba(0,0,0,1);">
						<div class="absolute inset-0 pointer-events-none z-30" style="background: linear-gradient(to bottom, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 40%, transparent 40%);"></div>
						<div class="absolute inset-0 opacity-20 z-0" style="background-image: linear-gradient(rgba(249,115,22,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(249,115,22,0.4) 1px, transparent 1px); background-size: 8px 8px;"></div>
						<div class="rte-label-a absolute left-1/2 -translate-x-1/2 top-2 flex items-center gap-1 z-20 transition-opacity duration-300">
							<div class="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_4px_#22c55e]"></div>
							<span class="text-[6px] font-mono text-green-400 tracking-wider font-bold">RTE.A ACTIVE</span>
						</div>
						<div class="rte-label-b absolute left-1/2 -translate-x-1/2 bottom-2 flex items-center gap-1 z-20 transition-opacity duration-300 opacity-30">
							<div class="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_4px_#f97316]"></div>
							<span class="text-[6px] font-mono text-orange-400 tracking-wider font-bold">RTE.B ACTIVE</span>
						</div>
						<svg class="absolute inset-0 w-full h-full z-10" viewBox="0 0 200 100" preserveAspectRatio="none">
							<path d="M 20 50 L 60 50 L 90 25 L 160 25" fill="none" stroke="#27272a" stroke-width="3" stroke-linejoin="round"></path>
							<path d="M 60 50 L 90 75 L 160 75" fill="none" stroke="#27272a" stroke-width="3" stroke-linejoin="round"></path>
							<path class="rte-path-a transition-opacity duration-300" d="M 20 50 L 60 50 L 90 25 L 160 25" fill="none" stroke="#22c55e" stroke-width="3" stroke-linejoin="round" style="filter: drop-shadow(0 0 5px rgba(34,197,94,0.8));"></path>
							<path class="rte-path-b transition-opacity duration-300 opacity-0" d="M 20 50 L 60 50 L 90 75 L 160 75" fill="none" stroke="#f97316" stroke-width="3" stroke-linejoin="round" style="filter: drop-shadow(0 0 5px rgba(249,115,22,0.8));"></path>
							<circle cx="20" cy="50" r="4" fill="#27272a" stroke="#71717a" stroke-width="2"></circle>
							<circle cx="60" cy="50" r="2.5" fill="#71717a"></circle>
							<circle cx="160" cy="25" r="4" fill="#27272a" stroke="#71717a" stroke-width="2"></circle>
							<circle cx="160" cy="75" r="4" fill="#27272a" stroke="#71717a" stroke-width="2"></circle>
						</svg>
					</div>
				</div>
				<div class="relative z-10 mt-auto">
					<h3 class="text-xs text-zinc-200 font-medium tracking-tight mb-0.5">Adaptive Routing</h3>
					<p class="text-[11px] text-zinc-500 leading-relaxed">Analyzing signal path…</p>
				</div>
			</div>

			<!-- FAL.03 — Fail-Safe Redundancy -->
			<div
				class="hw-card hw-card-fal flex flex-col w-full rounded-2xl p-5 relative overflow-hidden"
				class:is-active={activeCard === 'fal'}
				class:is-inactive={activeCard !== 'fal'}
				style="background: linear-gradient(to bottom, #3f3f46 0%, #27272a 8%, #18181b 100%); box-shadow: 0 20px 40px -10px rgba(0,0,0,0.9), inset 0 2px 2px rgba(255,255,255,0.15), inset 0 -2px 4px rgba(0,0,0,0.8), inset 0 0 10px rgba(0,0,0,0.5); border: 1px solid #111;"
			>
				<div class="absolute inset-0 opacity-[0.15] pointer-events-none mix-blend-overlay" style="background-image: url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E');"></div>
				<div class="relative z-10 flex justify-between items-center mb-4 pl-1 pr-1 mt-1">
					<span class="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">FAL.03</span>
					<div class="relative w-4 h-4 rounded-full bg-zinc-900 flex items-center justify-center" style="box-shadow: inset 0 2px 4px rgba(0,0,0,1);">
						<div class="relative w-2.5 h-2.5 rounded-full bg-orange-950 border border-black">
							<div class="absolute inset-0 rounded-full bg-gradient-to-br from-orange-300 to-orange-600 transition-opacity duration-500" class:opacity-100={activeCard === 'fal'} class:opacity-0={activeCard !== 'fal'} style="box-shadow: 0 0 8px #f97316;"></div>
						</div>
					</div>
				</div>
				<div class="relative z-10 mb-4 w-full h-28 bg-[#0a0a0c] rounded border border-black overflow-hidden" style="box-shadow: inset 0 8px 16px rgba(0,0,0,1);">
					<div class="absolute inset-0 opacity-[0.25] pointer-events-none" style="background-image: repeating-linear-gradient(45deg, #000 0, #000 2px, transparent 2px, transparent 6px);"></div>
					<div class="absolute top-1/2 left-[4.5rem] right-[4.5rem] h-3 bg-zinc-950 border-t border-b border-black -translate-y-1/2 z-0" style="box-shadow: inset 0 4px 8px rgba(0,0,0,1);"></div>
					<!-- sliding connector block -->
					<div
						class="fal-connector absolute top-1/2 -translate-y-1/2 w-8 h-6 rounded flex flex-col justify-center items-center gap-[2px] z-10"
						style="left: {activeCard === 'fal' ? 'calc(100% - 6.5rem)' : '4.3rem'}; transition: left 0.4s cubic-bezier(0.4,0,0.2,1); background: linear-gradient(to bottom, #71717a 0%, #3f3f46 100%); border: 1px solid #18181b; box-shadow: 0 4px 12px rgba(0,0,0,1), inset 0 1px 1px rgba(255,255,255,0.4);"
					>
						<div class="flex gap-3">
							<div class="w-1.5 h-1.5 rounded-full bg-zinc-900 shadow-[inset_0_1px_2px_rgba(0,0,0,1)]"></div>
							<div class="w-1.5 h-1.5 rounded-full bg-zinc-900 shadow-[inset_0_1px_2px_rgba(0,0,0,1)]"></div>
						</div>
						<div class="w-4 h-[1.5px] bg-black opacity-80"></div>
						<div class="w-4 h-[1.5px] bg-black opacity-80"></div>
					</div>
					<!-- PRI module -->
					<div class="absolute left-2 top-2 bottom-2 w-14 rounded flex flex-col items-center p-1.5 z-20" style="background: linear-gradient(to bottom, #52525b 0%, #3f3f46 10%, #27272a 100%); border: 1px solid #18181b; box-shadow: 6px 0 12px -4px rgba(0,0,0,0.9), inset 0 1px 2px rgba(255,255,255,0.3);">
						<div class="w-full h-1.5 bg-zinc-900 rounded-[1px] mb-1.5"></div>
						<div class="w-3 h-3 rounded-full border border-black/50 mb-1.5 transition-all duration-300"
							class:bg-green-500={activeCard !== 'fal'}
							class:shadow-green={activeCard !== 'fal'}
							class:bg-red-600={activeCard === 'fal'}
							class:shadow-red={activeCard === 'fal'}></div>
						<div class="w-full h-5 bg-zinc-950 rounded border border-black flex items-center justify-center mb-auto shadow-[inset_0_2px_4px_rgba(0,0,0,1)]">
							<span class="text-[9px] font-mono font-bold tracking-wider transition-colors duration-300"
								class:text-green-400={activeCard !== 'fal'}
								class:text-red-500={activeCard === 'fal'}>PRI</span>
						</div>
					</div>
					<!-- SEC module -->
					<div class="absolute right-2 top-2 bottom-2 w-14 rounded flex flex-col items-center p-1.5 z-20" style="background: linear-gradient(to bottom, #52525b 0%, #3f3f46 10%, #27272a 100%); border: 1px solid #18181b; box-shadow: -6px 0 12px -4px rgba(0,0,0,0.9), inset 0 1px 2px rgba(255,255,255,0.3);">
						<div class="w-full h-1.5 bg-zinc-900 rounded-[1px] mb-1.5"></div>
						<div class="w-3 h-3 rounded-full border border-black/50 mb-1.5 transition-all duration-300"
							class:bg-yellow-900={activeCard !== 'fal'}
							class:bg-green-500={activeCard === 'fal'}
							class:shadow-green={activeCard === 'fal'}></div>
						<div class="w-full h-5 bg-zinc-950 rounded border border-black flex items-center justify-center mb-auto shadow-[inset_0_2px_4px_rgba(0,0,0,1)]">
							<span class="text-[9px] font-mono font-bold tracking-wider transition-colors duration-300"
								class:text-yellow-900={activeCard !== 'fal'}
								class:text-green-400={activeCard === 'fal'}>SEC</span>
						</div>
					</div>
				</div>
				<div class="relative z-10 mt-auto">
					<h3 class="text-xs text-zinc-200 font-medium tracking-tight mb-0.5">Fail-Safe Redundancy</h3>
					<p class="text-[11px] text-zinc-500 leading-relaxed">Verifying token & access.</p>
				</div>
			</div>

			<!-- AI.04 — Intelligent Automation -->
			<div
				class="hw-card hw-card-ai flex flex-col w-full rounded-2xl p-5 relative overflow-hidden"
				class:is-active={activeCard === 'ai'}
				class:is-inactive={activeCard !== 'ai'}
				style="background: linear-gradient(to bottom, #3f3f46 0%, #27272a 8%, #18181b 100%); box-shadow: 0 20px 40px -10px rgba(0,0,0,0.9), inset 0 2px 2px rgba(255,255,255,0.15), inset 0 -2px 4px rgba(0,0,0,0.8), inset 0 0 10px rgba(0,0,0,0.5); border: 1px solid #111;"
			>
				<div class="absolute inset-0 opacity-[0.15] pointer-events-none mix-blend-overlay" style="background-image: url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E');"></div>
				<div class="relative z-10 flex justify-between items-center mb-4 pl-1 pr-1 mt-1">
					<span class="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">AI.04</span>
					<div class="relative w-4 h-4 rounded-full bg-zinc-900 flex items-center justify-center" style="box-shadow: inset 0 2px 4px rgba(0,0,0,1);">
						<div class="relative w-2.5 h-2.5 rounded-full bg-orange-950 border border-black">
							<div class="absolute inset-0 rounded-full bg-gradient-to-br from-orange-300 to-orange-600 transition-opacity duration-500" class:opacity-100={activeCard === 'ai'} class:opacity-0={activeCard !== 'ai'} style="box-shadow: 0 0 8px #f97316;"></div>
						</div>
					</div>
				</div>
				<div class="relative z-10 mb-4 flex justify-center items-center h-28">
					<div class="relative w-24 h-24 rounded-full flex items-center justify-center" style="background: linear-gradient(145deg, #52525b 0%, #3f3f46 20%, #27272a 100%); box-shadow: 0 10px 20px -5px rgba(0,0,0,0.9), inset 0 2px 4px rgba(255,255,255,0.3), inset 0 -2px 4px rgba(0,0,0,0.8); border: 1px solid #18181b;">
						<svg class="absolute inset-0 w-full h-full opacity-40" viewBox="0 0 100 100">
							<circle cx="50" cy="50" r="45" fill="none" stroke="#000" stroke-width="2.5" stroke-dasharray="2 4"></circle>
							<circle cx="50" cy="50" r="45" fill="none" stroke="#fff" stroke-width="1" stroke-dasharray="2 4" opacity="0.5" transform="translate(0, 1)"></circle>
						</svg>
						<div class="relative w-16 h-16 rounded-full bg-[#0a0a0c] border border-black overflow-hidden flex items-center justify-center" style="box-shadow: inset 0 8px 16px rgba(0,0,0,1);">
							<div class="absolute inset-0 pointer-events-none z-30" style="background: linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.02) 40%, transparent 40%);"></div>
							<div class="absolute inset-[4px] rounded-full border border-orange-500/20 z-10"></div>
							<div class="absolute inset-[12px] rounded-full border border-orange-500/20 z-10"></div>
							<div class="absolute top-0 bottom-0 left-1/2 w-[1px] bg-orange-500/30 z-10"></div>
							<div class="absolute left-0 right-0 top-1/2 h-[1px] bg-orange-500/30 z-10"></div>
							<div class="radar-sweep absolute inset-0 origin-center z-10 transition-opacity duration-500"
								class:opacity-100={submitting}
								class:opacity-0={!submitting}
								style="background: conic-gradient(from 0deg, transparent 60%, rgba(249,115,22,0.1) 90%, rgba(249,115,22,0.9) 100%); animation: radar-spin 2s linear infinite;"></div>
							<div class="absolute w-1.5 h-1.5 rounded-full bg-orange-500 z-20 shadow-[0_0_6px_#f97316]"></div>
						</div>
						<div class="absolute -right-3 -bottom-1 w-10 h-4 bg-zinc-950 rounded flex items-center justify-center z-20" style="box-shadow: inset 0 2px 4px rgba(0,0,0,1); border: 1px solid #000;">
							<span class="text-[7px] font-mono font-bold tracking-wider transition-colors duration-500"
								class:text-zinc-700={!submitting}
								class:text-green-400={submitting}>CAL.OK</span>
						</div>
					</div>
				</div>
				<div class="relative z-10 mt-auto">
					<h3 class="text-xs text-zinc-200 font-medium tracking-tight mb-0.5">Intelligent Automation</h3>
					<p class="text-[11px] text-zinc-500 leading-relaxed">{submitting ? 'Initiating build sequence…' : 'Ready to build.'}</p>
				</div>
			</div>

		</div>
		<!-- End Hardware Telemetry Step Indicators -->

		<!-- Two-column layout: notes sidebar + form -->
		<div class="flex flex-col lg:flex-row gap-8 items-start justify-center">

			<!-- ── Requirements Sidebar ── -->
			<aside class="lg:sticky lg:top-24 w-full lg:w-64 shrink-0">
				<div class="relative p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
					<!-- Decorative corner accent -->
					<div class="absolute top-0 left-0 w-8 h-8 border-t border-l border-brand-500/30 rounded-tl-2xl pointer-events-none"></div>
					<div class="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-brand-500/20 rounded-br-2xl pointer-events-none"></div>

					<p class="text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-4">Before you begin</p>

					<div class="space-y-4">
						<!-- Repo visibility -->
						<div>
							<p class="text-[15px] font-semibold text-slate-300 leading-snug mb-1">Public or Private?</p>
							<p class="text-[13px] text-slate-500 leading-relaxed">
								Both work — as long as your token has access. Public repos need <span class="font-semibold text-slate-400">public_repo</span> scope; private repos need the full <span class="font-semibold text-slate-400">repo</span> scope.
							</p>
						</div>

						<div class="border-t border-white/[0.05]"></div>

						<!-- Token scopes -->
						<div>
							<p class="text-[15px] font-semibold text-slate-300 leading-snug mb-1">Token Permissions</p>
							<p class="text-[13px] text-slate-500 leading-relaxed">
								Your PAT needs at minimum the <span class="font-semibold text-slate-400">repo</span> scope — this covers cloning, creating a branch, pushing commits, and opening a PR on your behalf.
							</p>
						</div>

						<div class="border-t border-white/[0.05]"></div>

						<!-- Branch protection -->
						<div>
							<p class="text-[15px] font-semibold text-slate-300 leading-snug mb-1">Branch Rules</p>
							<p class="text-[13px] text-slate-500 leading-relaxed">
								Noelle always opens a <span class="font-semibold text-slate-400">new branch</span> and a PR — it never pushes directly to main. Branch protection rules on main are perfectly fine.
							</p>
						</div>

						<div class="border-t border-white/[0.05]"></div>

						<!-- PR requirements -->
						<div>
							<p class="text-[15px] font-semibold text-slate-300 leading-snug mb-1">PR Write Access</p>
							<p class="text-[13px] text-slate-500 leading-relaxed">
								The token must belong to an account with <span class="font-semibold text-slate-400">write</span> (or higher) access to the repo so it can push the branch and open the pull request.
							</p>
						</div>

						<div class="border-t border-white/[0.05]"></div>

						<!-- Security note -->
						<div>
							<p class="text-[15px] font-semibold text-slate-300 leading-snug mb-1">Your Token is Safe</p>
							<p class="text-[13px] text-slate-500 leading-relaxed">
								Tokens are used only for this single operation and are <span class="font-semibold text-slate-400">never stored</span>. Use a fine-grained PAT with an expiry for extra peace of mind.
							</p>
						</div>
					</div>

					<!-- Bottom tip -->
					<div class="mt-5 pt-4 border-t border-white/[0.05]">
						<a
							href="https://github.com/settings/tokens/new?scopes=repo&description=Noelle+AI"
							target="_blank"
							rel="noopener noreferrer"
							class="text-[13px] text-brand-400 hover:text-brand-300 transition-colors"
						>
							→ Generate a token now
						</a>
					</div>
				</div>
			</aside>

		<!-- Form card -->
		<div class="glass-panel rounded-2xl p-8 w-full max-w-2xl">
			<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-5">
				<!-- Repo URL -->
				<div>
					<label for="repoUrl" class="form-label">
						GitHub Repository URL
					</label>
					<input
						id="repoUrl"
						type="url"
						class="form-input repo-url-input"
						class:neon-success={urlStatus === 'success'}
						class:neon-warning={urlStatus === 'warning'}
						class:neon-error={urlStatus === 'error'}
						class:neon-loading={urlStatus === 'loading'}
						placeholder="https://github.com/your-org/your-repo"
						bind:value={form.repoUrl}
						onblur={onRepoUrlBlur}
					/>
					<!-- Status line below the URL input -->
					{#if urlStatus === 'loading'}
						<p class="flex items-center gap-1.5 text-xs text-slate-500 mt-1.5">
							<svg class="animate-spin h-3 w-3 text-brand-400 shrink-0" viewBox="0 0 24 24" fill="none">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
							</svg>
							Scanning repository…
						</p>
					{:else if urlStatus === 'success'}
						<p class="flex items-center gap-1.5 text-xs text-emerald-400 mt-1.5">
							<Icon icon="ph:check-circle-bold" width="13" height="13" class="shrink-0" />
							Connected · {urlStatusMsg}
						</p>
					{:else if urlStatus === 'warning'}
						<p class="flex items-center gap-1.5 text-xs text-fuchsia-400 mt-1.5">
							<Icon icon="ph:warning-bold" width="13" height="13" class="shrink-0" />
							{urlStatusMsg}
						</p>
					{:else if urlStatus === 'error'}
						<p class="flex items-center gap-1.5 text-xs text-red-400 mt-1.5">
							<Icon icon="ph:x-circle-bold" width="13" height="13" class="shrink-0" />
							{urlStatusMsg}
						</p>
					{:else}
						<p class="text-xs text-slate-600 mt-1.5">Must be a public GitHub repo or one your account has access to.</p>
					{/if}
				</div>

				<!-- Branch -->
				<div>
					<label for="branch" class="form-label flex items-center gap-2">
						Branch
						{#if urlStatus === 'success'}
							<span class="inline-flex items-center gap-1 text-[11px] text-emerald-500">
								<Icon icon="ph:git-branch-bold" width="12" height="12" />
								{branches.length} branch{branches.length === 1 ? '' : 'es'} found
							</span>
						{:else if urlStatus === 'warning'}
							<span class="text-[11px] text-fuchsia-500/70">add token to auto-detect</span>
						{:else if urlStatus === 'error'}
							<span class="text-[11px] text-slate-600">type manually</span>
						{/if}
					</label>

					{#if branches.length > 0}
						<select
							id="branch"
							class="form-input bg-[#0d0d0d] appearance-none"
							bind:value={form.branch}
						>
							{#each branches as b}
								<option value={b}>{b}</option>
							{/each}
						</select>
						<p class="text-xs text-slate-600 mt-1.5">
							Noelle will create a new feature branch from <code class="text-slate-400 bg-white/5 px-1 rounded text-[11px]">{form.branch}</code>.
						</p>
					{:else}
						<input
							id="branch"
							type="text"
							class="form-input"
							placeholder="main"
							bind:value={form.branch}
						/>
						{#if urlStatus === 'idle'}
							<p class="text-xs text-slate-600 mt-1.5">Paste your repo URL above to auto-detect branches.</p>
						{/if}
					{/if}
				</div>

				<!-- GitHub Token -->
				<div>
					<label for="github_token" class="form-label flex items-center gap-1.5">
						<Icon icon="ph:key-bold" width="14" height="14" /> GitHub Personal Access Token
					</label>
					<input
						id="github_token"
						type="password"
						class="form-input font-mono tracking-wider"
						placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
						bind:value={form.github_token}
						autocomplete="off"
						onfocus={() => { activeCard = 'fal'; }}
						onblur={onTokenBlur}
					/>
					<p class="text-xs text-slate-600 mt-1.5">
						Needs <code class="text-slate-400 bg-white/5 px-1 rounded text-[11px]">repo</code> scope. Used only to push a branch and open a PR — never stored.
						<a href="https://github.com/settings/tokens/new?scopes=repo&description=Noelle" target="_blank" rel="noopener noreferrer" class="text-brand-400 hover:text-brand-300 underline underline-offset-2 ml-1">Create token →</a>
					</p>
				</div>

				<!-- Prompt -->
				<div>
					<label for="prompt" class="form-label">What do you want changed?</label>
					<div class="relative">
						<textarea
							id="prompt"
							class="form-input min-h-[160px] resize-y pr-12"
							placeholder="e.g. Make the hero section darker with a gradient background. Add a pricing page with three tiers. Fix the mobile hamburger menu animation."
							bind:value={form.prompt}
						onpaste={handlePaste}
						></textarea>
						<!-- Paperclip upload trigger -->
						<button
							type="button"
							title="Attach screenshots (up to {MAX_FILE_SIZE_MB} MB each)"
							onclick={() => fileInput.click()}
							class="absolute bottom-3 right-3 p-1.5 rounded-lg text-slate-500 hover:text-brand-400 hover:bg-brand-500/10 transition-colors disabled:opacity-40"
						>
							<Icon icon="ph:paperclip-bold" width="16" height="16" />
						</button>
					</div>
					<p class="text-xs text-slate-600 mt-1.5">
						Be specific — the more detail, the better the result.
						<span class="text-slate-500">Attach screenshots for Gemini design analysis.</span>
					</p>

					<!-- Hidden file input -->
					<input
						bind:this={fileInput}
						type="file"
						accept="image/*"
						multiple
						class="hidden"
						onchange={handleFileInput}
					/>

					<!-- Screenshot previews -->
					{#if screenshots.length > 0}
						<div class="mt-3 flex flex-wrap gap-2">
							{#each screenshots as img, i}
								<div class="relative group rounded-lg overflow-hidden border border-white/10 w-20 h-20 shrink-0">
									<img
										src="data:{img.mimeType};base64,{img.data}"
										alt={img.name}
										class="w-full h-full object-cover"
									/>
									<button
										type="button"
										onclick={() => removeScreenshot(i)}
										class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
										title="Remove {img.name}"
									>
										<Icon icon="ph:x-bold" width="16" height="16" class="text-white" />
									</button>
								</div>
							{/each}
						</div>
						<p class="text-[11px] text-brand-400 mt-1.5">
							{screenshots.length} screenshot{screenshots.length > 1 ? 's' : ''} attached · Gemini Design Agent will analyze {screenshots.length > 1 ? 'them' : 'it'}
						</p>
					{/if}
				</div>

				<!-- Error -->
				{#if errorMsg}
					<div class="flex items-start gap-2.5 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
						<Icon icon="ph:warning-circle-bold" width="16" height="16" class="mt-0.5 shrink-0" />
						{errorMsg}
					</div>
				{/if}

				<!-- Submit -->
				<button
					type="submit"
					class="btn-secondary w-full gap-2 py-3"
				>
					<Icon icon="ph:paper-plane-right-bold" width="16" height="16" /> Build with Noelle
				</button>
			</form>

			<!-- Mini how-it-works -->
			<div class="mt-8 pt-6 border-t border-white/5">
				<p class="text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-4">How it works</p>
				<div class="grid grid-cols-3 gap-4 text-center">
					{#each [
						{ icon: 'ph:git-repository-bold', label: 'Submit repo + prompt' },
						{ icon: 'ph:robot-bold', label: 'AI builds changes' },
						{ icon: 'ph:git-pull-request-bold', label: 'PR lands in your repo' }
					] as item}
						<div class="text-center">
							<div class="mb-1.5 flex justify-center">
								<div class="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center text-brand-400">
									<Icon icon={item.icon} width="16" height="16" />
								</div>
							</div>
							<p class="text-xs text-slate-500">{item.label}</p>
						</div>
					{/each}
				</div>
			</div>
		</div>
		</div><!-- end flex row -->
	</div><!-- end container-content -->
</main>

<Footer />

<style>
	/* ── Neon holographic border pulse on the repo URL input ── */

	@keyframes neon-pulse-green {
		0%, 100% {
			box-shadow: 0 0 4px #00ffaa55, 0 0 10px #00ffaa44, 0 0 22px #00ffaa22;
			border-color: #00ffaa99;
		}
		50% {
			box-shadow: 0 0 8px #00ffaaaa, 0 0 20px #00ffaa88, 0 0 40px #00ffaa44;
			border-color: #00ffaaee;
		}
	}

	@keyframes neon-pulse-magenta {
		0%, 100% {
			box-shadow: 0 0 4px #ff00ff55, 0 0 10px #ff00ff44, 0 0 22px #ff00ff22;
			border-color: #ff00ff88;
		}
		50% {
			box-shadow: 0 0 8px #ff00ffaa, 0 0 20px #ff00ff77, 0 0 40px #ff00ff33;
			border-color: #ff00ffcc;
		}
	}

	@keyframes neon-pulse-red {
		0%, 100% {
			box-shadow: 0 0 4px #ff003355, 0 0 10px #ff003344, 0 0 22px #ff003322;
			border-color: #ff003388;
		}
		50% {
			box-shadow: 0 0 8px #ff0033aa, 0 0 20px #ff003377, 0 0 40px #ff003333;
			border-color: #ff0033cc;
		}
	}

	@keyframes neon-pulse-loading {
		0%, 100% {
			box-shadow: 0 0 3px #7c3aed44, 0 0 8px #7c3aed33;
			border-color: #7c3aed66;
		}
		50% {
			box-shadow: 0 0 6px #7c3aed88, 0 0 16px #7c3aed55;
			border-color: #7c3aed99;
		}
	}

	.repo-url-input.neon-success {
		animation: neon-pulse-green 2s ease-in-out infinite;
		border-color: #00ffaa99;
	}

	.repo-url-input.neon-warning {
		animation: neon-pulse-magenta 2s ease-in-out infinite;
		border-color: #ff00ff88;
	}

	.repo-url-input.neon-error {
		animation: neon-pulse-red 2s ease-in-out infinite;
		border-color: #ff003388;
	}

	.repo-url-input.neon-loading {
		animation: neon-pulse-loading 1.2s ease-in-out infinite;
		border-color: #7c3aed66;
	}

	/* ── Hardware Telemetry Step Cards ── */
	.hw-card {
		transition: opacity 0.5s ease, transform 0.5s ease;
	}
	.hw-card.is-active {
		opacity: 1;
		transform: scale(1);
	}
	.hw-card.is-inactive {
		opacity: 0.3;
		transform: scale(0.97);
	}

	/* SYS.01: looping scan sweep when active */
	.hw-card-sys.is-active .scan-sweep {
		animation: sys-scan 3s ease-in-out infinite;
	}
	@keyframes sys-scan {
		0%   { transform: translateX(-4rem); }
		100% { transform: translateX(calc(100% + 20rem)); }
	}

	/* RTE.02: load bars animate when active + loading */
	.hw-card-rte.is-active.rte-loading .rte-bar-5 {
		background-color: #ef4444; border-color: #f87171;
		box-shadow: 0 0 6px #ef4444;
		animation: bar-flicker 0.4s ease-in-out infinite alternate;
	}
	.hw-card-rte.is-active.rte-loading .rte-bar-4 {
		background-color: #f97316; border-color: #fb923c;
		box-shadow: 0 0 6px #f97316;
		animation: bar-flicker 0.4s ease-in-out infinite alternate;
		animation-delay: 0.1s;
	}
	.hw-card-rte.is-active.rte-success .rte-bar-5 { background-color: #ef4444; border-color: #f87171; box-shadow: 0 0 6px #ef4444; }
	.hw-card-rte.is-active.rte-success .rte-bar-4 { background-color: #f97316; border-color: #fb923c; box-shadow: 0 0 6px #f97316; }
	.hw-card-rte.is-active.rte-success .rte-bar-3 { background-color: #f97316; border-color: #fb923c; box-shadow: 0 0 6px #f97316; }
	.hw-card-rte.is-active.rte-success .rte-bar-2 { background-color: #22c55e; border-color: #4ade80; box-shadow: 0 0 6px #22c55e; }

	/* RTE route path / label visibility by status */
	.hw-card-rte.rte-loading .rte-path-a { opacity: 0.5; animation: route-flicker 0.5s ease-in-out infinite alternate; }
	.hw-card-rte.rte-loading .rte-path-b { opacity: 0.5; animation: route-flicker 0.5s ease-in-out infinite alternate; animation-delay: 0.25s; }
	.hw-card-rte.rte-loading .rte-label-a { opacity: 0.5; animation: label-flicker 0.5s ease-in-out infinite alternate; }
	.hw-card-rte.rte-loading .rte-label-b { opacity: 0.5; animation: label-flicker 0.5s ease-in-out infinite alternate; animation-delay: 0.25s; }
	.hw-card-rte.rte-success .rte-path-a  { opacity: 1; }
	.hw-card-rte.rte-success .rte-path-b  { opacity: 0; }
	.hw-card-rte.rte-success .rte-label-a { opacity: 1; }
	.hw-card-rte.rte-success .rte-label-b { opacity: 0.3; }
	.hw-card-rte.rte-error .rte-path-a    { opacity: 0; }
	.hw-card-rte.rte-error .rte-path-b    { opacity: 1; }
	.hw-card-rte.rte-error .rte-label-a   { opacity: 0.3; }
	.hw-card-rte.rte-error .rte-label-b   { opacity: 1; }

	@keyframes bar-flicker   { 0% { opacity: 0.6; } 100% { opacity: 1; } }
	@keyframes route-flicker { 0% { opacity: 0.2; } 100% { opacity: 0.9; } }
	@keyframes label-flicker { 0% { opacity: 0.3; } 100% { opacity: 0.8; } }

	/* AI.04: radar spin */
	@keyframes radar-spin {
		from { transform: rotate(0deg); }
		to   { transform: rotate(360deg); }
	}
</style>
