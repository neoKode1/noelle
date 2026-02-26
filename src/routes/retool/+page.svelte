<script lang="ts">
	import Navbar from '$lib/components/Navbar.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import Icon from '@iconify/svelte';
	import { goto } from '$app/navigation';
	import { EMPTY_RETOOL_FORM, type RetoolFormData, type ImageAttachment } from '$lib/types/retool';

	let form: RetoolFormData = $state({ ...EMPTY_RETOOL_FORM });
	let submitting = $state(false);
	let errorMsg = $state('');
	let screenshots = $state<ImageAttachment[]>([]);
	let fileInput: HTMLInputElement;

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

		submitting = true;
		try {
			const res = await fetch('/api/retool', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ...form, screenshots })
			});
			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				errorMsg = data.message || `Error ${res.status}`;
				return;
			}
			const { id } = await res.json();
			goto(`/dashboard/${id}`);
		} catch (e) {
			errorMsg = 'Network error. Please try again.';
		} finally {
			submitting = false;
		}
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
			<h1 class="text-4xl font-medium text-white tracking-tight mb-3">Retool Your Site</h1>
			<p class="text-slate-400 max-w-lg mx-auto text-sm leading-relaxed">
				Paste your GitHub repo, describe what you want changed, and we'll open a PR with the AI-generated results.
			</p>
		</div>

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
						class="form-input"
						placeholder="https://github.com/your-org/your-repo"
						bind:value={form.repoUrl}
						disabled={submitting}
					/>
					<p class="text-xs text-slate-600 mt-1.5">Must be a public GitHub repo or one your account has access to.</p>
				</div>

				<!-- Branch -->
				<div>
					<label for="branch" class="form-label">Branch</label>
					<input
						id="branch"
						type="text"
						class="form-input"
						placeholder="main"
						bind:value={form.branch}
						disabled={submitting}
					/>
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
						disabled={submitting}
						autocomplete="off"
					/>
					<p class="text-xs text-slate-600 mt-1.5">
						Needs <code class="text-slate-400 bg-white/5 px-1 rounded text-[11px]">repo</code> scope. Used only to push a branch and open a PR — never stored.
						<a href="https://github.com/settings/tokens/new?scopes=repo&description=Retools" target="_blank" rel="noopener noreferrer" class="text-brand-400 hover:text-brand-300 underline underline-offset-2 ml-1">Create token →</a>
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
							disabled={submitting}
							onpaste={handlePaste}
						></textarea>
						<!-- Paperclip upload trigger -->
						<button
							type="button"
							title="Attach screenshots (up to {MAX_FILE_SIZE_MB} MB each)"
							onclick={() => fileInput.click()}
							disabled={submitting}
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
					disabled={submitting}
				>
					{#if submitting}
						<Icon icon="ph:spinner-bold" width="16" height="16" class="animate-spin" /> Dispatching build…
					{:else}
						<Icon icon="ph:paper-plane-right-bold" width="16" height="16" /> Retool My Site
					{/if}
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

