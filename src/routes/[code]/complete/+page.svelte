<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { getPresenterState } from '../quiz.svelte.ts';
	import { LoadingScreen, ErrorScreen } from '$lib/components';
	import CompletionScreen from '../../(components)/CompletionScreen.svelte';
	
	// Get presenter state instance for this session
	const presenter = getPresenterState(page.params.code);
	let showConfetti = $state(false);
	let completionData = $derived(presenter.completionData);

	// Simple validation and loading
	$effect(() => {
		const code = page.params.code;
		const participantId = presenter.participant?.id;

		if (!code || !/^[A-Z0-9]+-[0-9]{6}$/.test(code)) {
			goto('/');
			return;
		}

		if (participantId) {
			presenter.loadCompletionResults(code);
			showConfetti = true;
		}
	});
</script>


<div class="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center px-4">
	<!-- Animated background orbs -->
	<div class="floating-orbs">
		<div class="orb orb-1"></div>
		<div class="orb orb-2"></div>
		<div class="orb orb-3"></div>
		<div class="orb orb-4"></div>
	</div>

 	{#if presenter.loading}
 		<LoadingScreen
 			show={true}
 			variant="modal"
 			message="Preparing your workplace DNA analysis..."
 		/>
 	{:else if presenter.error}
		<ErrorScreen
			title="Unable to Load Results"
			message={presenter.error}
		/>
	{:else if completionData}
		<CompletionScreen
			participantName={presenter.participant?.name || 'Participant'}
			scores={completionData.scores || { collaboration: 0, formality: 0, tech: 0, wellness: 0 }}
			totalScore={completionData.totalScore || 0}
			rank={completionData.rank}
			totalParticipants={completionData.totalParticipants}
			onViewInsights={() => goto(`/admin/${page.params.code}`)}
			onRestartQuiz={() => goto(`/${page.params.code}`)}
		/>
	{:else}
		<div class="glass-card rounded-3xl p-12">
			<div class="text-center">
				<div class="w-16 h-16 mx-auto mb-4">
					<div class="w-full h-full rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin"></div>
				</div>
				<p class="text-lg text-slate-300">Loading your results...</p>
			</div>
		</div>
	{/if}
</div>

<style>
	.glass-card {
		background: rgba(255, 255, 255, 0.05);
		backdrop-filter: blur(20px);
		border: 1px solid rgba(255, 255, 255, 0.1);
		box-shadow: 
			0 20px 60px rgba(0, 0, 0, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.1);
	}
</style>