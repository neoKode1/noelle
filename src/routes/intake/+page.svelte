<script lang="ts">
	import Navbar from '$lib/components/Navbar.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import { ArrowLeft, ArrowRight, Send } from 'lucide-svelte';
	import {
		EMPTY_INTAKE,
		STEP_LABELS,
		INDUSTRIES,
		CATEGORY_LABELS,
		type IntakeFormData,
		type RequestCategory,
		type CompanySize,
		type Timeline,
		type BudgetRange,
		type ComplianceReq,
		type ApprovalLevel
	} from '$lib/types/intake';

	let step = $state(0);
	let form: IntakeFormData = $state({ ...EMPTY_INTAKE, referenceUrls: [''] });
	let submitting = $state(false);
	let submitted = $state(false);

	const totalSteps = STEP_LABELS.length;

	function next() {
		if (step < totalSteps - 1) step++;
	}
	function prev() {
		if (step > 0) step--;
	}

	function toggleCategory(cat: RequestCategory) {
		if (form.categories.includes(cat)) {
			form.categories = form.categories.filter((c) => c !== cat);
		} else {
			form.categories = [...form.categories, cat];
		}
	}

	function addReferenceUrl() {
		form.referenceUrls = [...form.referenceUrls, ''];
	}

	function removeReferenceUrl(i: number) {
		form.referenceUrls = form.referenceUrls.filter((_, idx) => idx !== i);
	}

	async function handleSubmit() {
		submitting = true;
		try {
			const res = await fetch('/api/intake', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(form)
			});
			if (res.ok) submitted = true;
		} finally {
			submitting = false;
		}
	}
</script>

<Navbar />

<main class="pt-16 min-h-screen bg-surface-50 dark:bg-surface-950">
	<div class="container-narrow py-12 sm:py-16">
		{#if submitted}
			<!-- ── Success ────────────────────────────────────────── -->
			<div class="card text-center py-12">
				<div class="text-5xl mb-4">🎉</div>
				<h1 class="text-2xl font-bold text-surface-900 dark:text-white mb-2">Project Submitted</h1>
				<p class="text-surface-500 dark:text-surface-400 mb-6">We'll review your request and get back to you within 24 hours.</p>
				<a href="/dashboard" class="btn-primary">Go to Dashboard</a>
			</div>
		{:else}
			<!-- ── Progress bar ───────────────────────────────────── -->
			<div class="mb-8">
				<div class="flex items-center justify-between mb-2">
					<span class="text-sm font-medium text-surface-600 dark:text-surface-400">Step {step + 1} of {totalSteps}</span>
					<span class="text-sm font-medium text-brand-600 dark:text-brand-400">{STEP_LABELS[step]}</span>
				</div>
				<div class="w-full bg-surface-200 dark:bg-surface-800 rounded-full h-2">
					<div
						class="bg-brand-600 h-2 rounded-full transition-all duration-300"
						style="width: {((step + 1) / totalSteps) * 100}%"
					></div>
				</div>
			</div>

			<div class="card">
				<!-- ════════════════════════════════════════════════
				     STEP 1: Identity & Context
				     ════════════════════════════════════════════════ -->
				{#if step === 0}
					<h2 class="text-xl font-semibold text-surface-900 dark:text-white mb-6">Tell Us About You</h2>
					<div class="space-y-5">
						<div>
							<label for="companyName" class="form-label">Company Name</label>
							<input id="companyName" type="text" class="form-input" bind:value={form.companyName} placeholder="Acme Corp" />
						</div>
						<div>
							<label for="role" class="form-label">Your Role / Department</label>
							<input id="role" type="text" class="form-input" bind:value={form.role} placeholder="e.g. IT Manager, Marketing Lead, CTO" />
						</div>
						<div>
							<label class="form-label">Company Size</label>
							<div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
								{#each [
									['solo', 'Solo / Freelancer'],
									['small', 'Small Team (2-20)'],
									['medium', 'Mid-size (21-200)'],
									['enterprise', 'Enterprise (200+)']
								] as [value, label]}
									<button
										type="button"
										class="px-3 py-2 rounded-lg border text-sm font-medium transition-colors
											{form.companySize === value
												? 'border-brand-500 bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300'
												: 'border-surface-300 dark:border-surface-600 text-surface-600 dark:text-surface-400 hover:border-brand-300'}"
										onclick={() => form.companySize = value as CompanySize}
									>
										{label}
									</button>
								{/each}
							</div>
						</div>
						<div>
							<label for="industry" class="form-label">Industry</label>
							<select id="industry" class="form-input" bind:value={form.industry}>
								<option value="">Select your industry…</option>
								{#each INDUSTRIES as ind}
									<option value={ind}>{ind}</option>
								{/each}
							</select>
						</div>
					</div>
				{/if}

				<!-- ════════════════════════════════════════════════
				     STEP 2: Current State
				     ════════════════════════════════════════════════ -->
				{#if step === 1}
					<h2 class="text-xl font-semibold text-surface-900 dark:text-white mb-6">What Do You Have Now?</h2>
					<div class="space-y-5">
						<div>
							<label for="existingUrl" class="form-label">Existing Website / App URL</label>
							<input id="existingUrl" type="url" class="form-input" bind:value={form.existingUrl} placeholder="https://yoursite.com" />
						</div>
						<div>
							<label for="techStack" class="form-label">Tech Stack (if known)</label>
							<input id="techStack" type="text" class="form-input" bind:value={form.techStack} placeholder="e.g. WordPress, React, Django… or 'Not sure'" />
						</div>
						<div>
							<label for="hosting" class="form-label">Hosting Provider (if known)</label>
							<input id="hosting" type="text" class="form-input" bind:value={form.hostingProvider} placeholder="e.g. AWS, Vercel, GoDaddy, 'I don't know'" />
						</div>
						<div>
							<label class="form-label">Do you have access to your codebase?</label>
							<div class="flex gap-3">
								{#each [[true, 'Yes'], [false, 'No / My dev team manages it']] as [val, label]}
									<button
										type="button"
										class="flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors
											{form.hasCodebaseAccess === val
												? 'border-brand-500 bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300'
												: 'border-surface-300 dark:border-surface-600 text-surface-600 dark:text-surface-400 hover:border-brand-300'}"
										onclick={() => form.hasCodebaseAccess = val as boolean}
									>
										{label}
									</button>
								{/each}
							</div>
						</div>
						{#if form.hasCodebaseAccess}
							<div>
								<label for="codebaseUrl" class="form-label">GitHub / GitLab Repo URL</label>
								<input id="codebaseUrl" type="url" class="form-input" bind:value={form.codebaseUrl} placeholder="https://github.com/your-org/repo" />
							</div>
						{/if}
						<div>
							<label class="form-label">Do you have brand guidelines or assets?</label>
							<div class="flex gap-3">
								{#each [[true, 'Yes'], [false, 'No']] as [val, label]}
									<button
										type="button"
										class="flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors
											{form.hasBrandAssets === val
												? 'border-brand-500 bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300'
												: 'border-surface-300 dark:border-surface-600 text-surface-600 dark:text-surface-400 hover:border-brand-300'}"
										onclick={() => form.hasBrandAssets = val as boolean}
									>
										{label}
									</button>
								{/each}
							</div>
						</div>
					</div>
				{/if}

				<!-- ════════════════════════════════════════════════
				     STEP 3: What You Want
				     ════════════════════════════════════════════════ -->
				{#if step === 2}
					<h2 class="text-xl font-semibold text-surface-900 dark:text-white mb-6">What Do You Want?</h2>
					<div class="space-y-5">
						<div>
							<label class="form-label">Select all categories that apply</label>
							<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
								{#each Object.entries(CATEGORY_LABELS) as [key, label]}
									<button
										type="button"
										class="text-left px-4 py-3 rounded-lg border text-sm font-medium transition-colors
											{form.categories.includes(key as RequestCategory)
												? 'border-brand-500 bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300'
												: 'border-surface-300 dark:border-surface-600 text-surface-600 dark:text-surface-400 hover:border-brand-300'}"
										onclick={() => toggleCategory(key as RequestCategory)}
									>
										{label}
									</button>
								{/each}
							</div>
						</div>
						<div>
							<label for="description" class="form-label">Describe what you need</label>
							<textarea id="description" class="form-input min-h-[120px]" bind:value={form.description} placeholder="Be as specific as you'd like. What problem are you solving? What does the ideal result look like?"></textarea>
						</div>
						<div>
							<label class="form-label">Reference URLs (optional)</label>
							{#each form.referenceUrls as _url, i}
								<div class="flex gap-2 mb-2">
									<input type="url" class="form-input" bind:value={form.referenceUrls[i]} placeholder="https://example.com" />
									{#if form.referenceUrls.length > 1}
										<button type="button" class="btn-ghost text-sm px-2 text-red-500" onclick={() => removeReferenceUrl(i)}>✕</button>
									{/if}
								</div>
							{/each}
							<button type="button" class="text-sm text-brand-600 dark:text-brand-400 font-medium hover:underline" onclick={addReferenceUrl}>+ Add another URL</button>
						</div>
					</div>
				{/if}

				<!-- ════════════════════════════════════════════════
				     STEP 4: Priority & Constraints
				     ════════════════════════════════════════════════ -->
				{#if step === 3}
					<h2 class="text-xl font-semibold text-surface-900 dark:text-white mb-6">Priority & Constraints</h2>
					<div class="space-y-5">
						<div>
							<label class="form-label">Timeline</label>
							<div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
								{#each [
									['asap', 'ASAP'],
									['this_week', 'This Week'],
									['this_month', 'This Month'],
									['no_rush', 'No Rush']
								] as [value, label]}
									<button
										type="button"
										class="px-3 py-2 rounded-lg border text-sm font-medium transition-colors
											{form.timeline === value
												? 'border-brand-500 bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300'
												: 'border-surface-300 dark:border-surface-600 text-surface-600 dark:text-surface-400 hover:border-brand-300'}"
										onclick={() => form.timeline = value as Timeline}
									>
										{label}
									</button>
								{/each}
							</div>
						</div>
						<div>
							<label class="form-label">Budget Range</label>
							<div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
								{#each [
									['under_500', 'Under $500'],
									['500_2500', '$500 – $2,500'],
									['2500_10000', '$2,500 – $10,000'],
									['10000_plus', '$10,000+'],
									['unsure', 'Not Sure']
								] as [value, label]}
									<button
										type="button"
										class="px-3 py-2 rounded-lg border text-sm font-medium transition-colors
											{form.budget === value
												? 'border-brand-500 bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300'
												: 'border-surface-300 dark:border-surface-600 text-surface-600 dark:text-surface-400 hover:border-brand-300'}"
										onclick={() => form.budget = value as BudgetRange}
									>
										{label}
									</button>
								{/each}
							</div>
						</div>
						<div>
							<label class="form-label">Compliance / Security Requirements</label>
							<div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
								{#each [
									['hipaa', 'HIPAA'],
									['soc2', 'SOC2'],
									['pci', 'PCI DSS'],
									['none', 'None'],
									['unsure', 'Not Sure']
								] as [value, label]}
									<button
										type="button"
										class="px-3 py-2 rounded-lg border text-sm font-medium transition-colors
											{form.compliance.includes(value as ComplianceReq)
												? 'border-brand-500 bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300'
												: 'border-surface-300 dark:border-surface-600 text-surface-600 dark:text-surface-400 hover:border-brand-300'}"
										onclick={() => {
											const v = value as ComplianceReq;
											form.compliance = form.compliance.includes(v)
												? form.compliance.filter(c => c !== v)
												: [...form.compliance, v];
										}}
									>
										{label}
									</button>
								{/each}
							</div>
						</div>
						<div>
							<label class="form-label">Who needs to approve this?</label>
							<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
								{#each [
									['just_me', 'Just Me'],
									['manager', 'My Manager'],
									['legal_it', 'Legal / IT Review']
								] as [value, label]}
									<button
										type="button"
										class="px-3 py-2 rounded-lg border text-sm font-medium transition-colors
											{form.approvalLevel === value
												? 'border-brand-500 bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300'
												: 'border-surface-300 dark:border-surface-600 text-surface-600 dark:text-surface-400 hover:border-brand-300'}"
										onclick={() => form.approvalLevel = value as ApprovalLevel}
									>
										{label}
									</button>
								{/each}
							</div>
						</div>
					</div>
				{/if}

				<!-- ════════════════════════════════════════════════
				     STEP 5: Review & Submit
				     ════════════════════════════════════════════════ -->
				{#if step === 4}
					<h2 class="text-xl font-semibold text-surface-900 dark:text-white mb-6">Review Your Request</h2>
					<div class="space-y-4 text-sm">
						<div class="grid grid-cols-2 gap-x-4 gap-y-2">
							<span class="text-surface-500 dark:text-surface-400">Company</span>
							<span class="text-surface-900 dark:text-white font-medium">{form.companyName || '—'}</span>
							<span class="text-surface-500 dark:text-surface-400">Role</span>
							<span class="text-surface-900 dark:text-white font-medium">{form.role || '—'}</span>
							<span class="text-surface-500 dark:text-surface-400">Size</span>
							<span class="text-surface-900 dark:text-white font-medium">{form.companySize || '—'}</span>
							<span class="text-surface-500 dark:text-surface-400">Industry</span>
							<span class="text-surface-900 dark:text-white font-medium">{form.industry || '—'}</span>
						</div>
						<hr class="border-surface-200 dark:border-surface-700" />
						<div class="grid grid-cols-2 gap-x-4 gap-y-2">
							<span class="text-surface-500 dark:text-surface-400">Existing URL</span>
							<span class="text-surface-900 dark:text-white font-medium">{form.existingUrl || '—'}</span>
							<span class="text-surface-500 dark:text-surface-400">Tech Stack</span>
							<span class="text-surface-900 dark:text-white font-medium">{form.techStack || '—'}</span>
						</div>
						<hr class="border-surface-200 dark:border-surface-700" />
						<div>
							<span class="text-surface-500 dark:text-surface-400 block mb-1">Categories</span>
							<div class="flex flex-wrap gap-2">
								{#each form.categories as cat}
									<span class="inline-flex px-2 py-1 rounded-md bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300 text-xs font-medium">{CATEGORY_LABELS[cat]}</span>
								{/each}
								{#if form.categories.length === 0}
									<span class="text-surface-400">None selected</span>
								{/if}
							</div>
						</div>
						<div>
							<span class="text-surface-500 dark:text-surface-400 block mb-1">Description</span>
							<p class="text-surface-900 dark:text-white whitespace-pre-wrap">{form.description || '—'}</p>
						</div>
						<hr class="border-surface-200 dark:border-surface-700" />
						<div class="grid grid-cols-2 gap-x-4 gap-y-2">
							<span class="text-surface-500 dark:text-surface-400">Timeline</span>
							<span class="text-surface-900 dark:text-white font-medium">{form.timeline || '—'}</span>
							<span class="text-surface-500 dark:text-surface-400">Budget</span>
							<span class="text-surface-900 dark:text-white font-medium">{form.budget || '—'}</span>
							<span class="text-surface-500 dark:text-surface-400">Approval</span>
							<span class="text-surface-900 dark:text-white font-medium">{form.approvalLevel || '—'}</span>
						</div>
					</div>
				{/if}

				<!-- ══════════════ Navigation ══════════════ -->
				<div class="flex justify-between mt-8 pt-6 border-t border-surface-200 dark:border-surface-700">
					{#if step > 0}
						<button type="button" class="btn-ghost gap-1" onclick={prev}>
							<ArrowLeft class="w-4 h-4" /> Back
						</button>
					{:else}
						<div></div>
					{/if}

					{#if step < totalSteps - 1}
						<button type="button" class="btn-primary gap-1" onclick={next}>
							Continue <ArrowRight class="w-4 h-4" />
						</button>
					{:else}
						<button type="button" class="btn-primary gap-1" onclick={handleSubmit} disabled={submitting}>
							<Send class="w-4 h-4" /> {submitting ? 'Submitting…' : 'Submit Project'}
						</button>
					{/if}
				</div>
			</div>
		{/if}
	</div>
</main>

<Footer />

