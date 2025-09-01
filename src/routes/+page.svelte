<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button, Card } from '$lib/components/ui';

	// Get server-loaded data
	let { data } = $props();
	let appName = $derived(data?.appName || 'Zyeta DX');
	let tagline = $derived(data?.tagline || 'Workplace Experience Platform');
	let description = $derived(
		data?.description ||
			"Discover your team's workplace DNA and unlock actionable insights with a clean, fast experience."
	);

	const enterDashboard = () => goto('/admin');
</script>

<div class="flex min-h-screen items-center justify-center px-6">
	<Card variant="analytics" class="w-full max-w-xl p-8 text-center">
		{#snippet children()}
			<div
				class="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 text-xl font-black text-white"
			>
				Z
			</div>
			<h1 class="text-2xl font-bold">
				{appName.split(' ')[0]}<span
					class="bg-gradient-to-r from-cyan-500 to-purple-600 bg-clip-text text-transparent"
					>{appName.split(' ')[1]}</span
				>
			</h1>
			<p class="mt-2 text-sm text-gray-600">{tagline}</p>
			<p class="mt-6 text-gray-700">{description}</p>
			<div class="mt-8 flex items-center justify-center gap-3">
				<Button onclick={enterDashboard}>Get Started</Button>
				<Button variant="outline" onclick={enterDashboard}>Admin</Button>
			</div>
		{/snippet}
	</Card>
</div>
