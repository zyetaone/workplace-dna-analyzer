<script>
	import "../app.css";

	let { children } = $props();
</script>

<svelte:head>
	<title>Zyeta DX - Workplace Experience Platform</title>
	<meta
		name="description"
		content="Transform workplace insights with real-time engagement and analytics powered by Zyeta DX"
	/>
	<link
		href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>
<svelte:boundary>
	<div class="animated-gradient min-h-screen">
		{@render children?.()}
	</div>
</svelte:boundary>

<style>
	:global(body) {
		margin: 0;
		font-family:
			"Inter",
			system-ui,
			-apple-system,
			sans-serif;
	}
</style>
