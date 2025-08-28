<script lang="ts">
	import type { GenerationOption } from '$lib/questions';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { getPresenterState } from './presenter.svelte';
	import { JoinForm, Card } from '$lib/components';
	
	// Get presenter state instance
	const presenter = getPresenterState(page.params.code);

	// Validate session code format before proceeding
	$effect(() => {
		const code = page.params.code;
		if (code && !/^[A-Z0-9]{6}$/.test(code)) {
			// Invalid session code format - redirect to home
			goto('/');
			return;
		}
	});

	onMount(async () => {
		const code = page.params.code;
		if (code && /^[A-Z0-9]{6}$/.test(code)) {
			presenter.loadSession(code);
		}
	});
	
	// Handle join form submission
	async function handleJoin(name: string, generation: GenerationOption) {
		const result = await presenter.joinSession(name, generation);
		if (result.success && result.redirect) {
			goto(result.redirect);
		}
	}
</script>

<div class="min-h-screen animated-gradient flex items-center justify-center px-4">
	<Card 
		variant="elevated" 
		size="lg" 
		class="max-w-md w-full"
		loading={presenter.loading}
	>
		{#if presenter.loading}
			<!-- Simple loading state -->
			<div class="text-center">
				<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto"></div>
				<p class="mt-4 text-gray-600">Loading session...</p>
			</div>
		{:else if presenter.error}
			<!-- Error state -->
			<div class="text-center">
				<h2 class="text-xl text-gray-700 mb-4">Unable to Join</h2>
				<p class="text-red-600">{presenter.error}</p>
			</div>
		{:else if presenter.session}
			<!-- Join form -->
			<JoinForm
				session={presenter.session}
				bind:participantName={presenter.participantName}
				isJoining={presenter.isJoining}
				joinError={presenter.joinError}
				onJoin={handleJoin}
			/>
		{/if}
	</Card>
</div>