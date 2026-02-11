<script>
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<title>Retools — Retool Your Software. Automatically.</title>
	<meta name="description" content="Submit a retooling request and our AI-powered system scopes, builds, and deploys the solution." />
</svelte:head>

{@render children()}

