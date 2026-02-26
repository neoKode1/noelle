<script>
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<title>Noelle — Ai webkits</title>
	<meta name="description" content="Noelle is an AI-powered build platform. Describe what you want changed, and Noelle scopes, builds, and opens a PR automatically." />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
</svelte:head>

<div style="min-height: 100vh;">
	{@render children()}
</div>

