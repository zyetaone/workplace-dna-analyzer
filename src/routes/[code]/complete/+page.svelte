<script lang="ts">
	import { page } from '$app/state';
	import { navigating } from '$app/state';
	import { getPresenterState } from '../presenter.svelte';
	import { LoadingSpinner, ErrorScreen, ScoreDisplay, Card } from '$lib/components';
	// Removed complex effect helpers - using simple effects instead

	// Get presenter state instance for this session
	const presenter = getPresenterState(page.params.code);
	let showConfetti = $state(false);
	let completionData = $derived(presenter.completionData);
	
	// Show loading during navigation (useful for slow devices)
	let showLoadingState = $derived(presenter.loading || !!navigating);

	// Simple effect for loading completion results
	$effect(() => {
		const code = page.params.code;
		const participantId = presenter.participant?.id;

		// Validate session code format
		if (!code || !/^[A-Z0-9]{6}$/.test(code)) {
			goto('/');
			return;
		}

		if (participantId) {
			presenter.loadCompletionResults(code, participantId);
		}
	});
	
	// Simple confetti trigger
	$effect(() => {
		if (completionData && !showConfetti) {
			showConfetti = true;
		}
	});
</script>


<div class="min-h-screen animated-gradient flex items-center justify-center px-4">
	{#if showLoadingState}
		<div class="bg-white rounded-lg shadow-lg max-w-md w-full p-8">
			<h2 class="text-xl font-semibold text-gray-800 text-center mb-4">Loading Results...</h2>
			<LoadingSpinner message="Preparing your workplace DNA analysis..." />
		</div>
	{:else if presenter.error}
		<ErrorScreen
			title="Unable to Load Results"
			message={presenter.error}
		/>
	{:else}
		<Card variant="elevated" size="lg" class="max-w-2xl w-full">
			{#snippet children()}
				<div class="text-center mb-8">
					<div class="text-6xl mb-4">🎉</div>
					<h1 class="text-3xl font-bold text-gray-800 mb-2">Quiz Complete!</h1>
					<p class="text-gray-600">Thank you for participating!</p>
				</div>
				
				<div class="bg-gray-50 rounded-lg p-6 mb-6">
					<h2 class="text-xl font-semibold text-gray-800 mb-3">Your Workplace DNA</h2>
					<p class="text-2xl font-bold text-gray-700">{completionData?.workplaceDNA || 'Loading...'}</p>
				</div>
				
				{#if completionData?.scores}
					<div class="mb-6">
						<ScoreDisplay
							scores={completionData.scores}
							maxScore={10}
							variant="cards"
							animated={true}
							showLabels={true}
							showValues={true}
							showProgress={true}
						/>
					</div>
				{/if}
				
				<div class="text-center">
					<p class="text-gray-600 text-sm">
						Your responses have been successfully recorded and will help shape our future workplace.
					</p>
				</div>
			{/snippet}
		</Card>
	{/if}
</div>