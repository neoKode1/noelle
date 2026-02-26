<script>
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<title>Retools — Retool Your Software. Automatically.</title>
	<meta name="description" content="Submit a retooling request and our AI-powered system scopes, builds, and deploys the solution." />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
</svelte:head>

<div style="min-height: 100vh;">
	{@render children()}
</div>

