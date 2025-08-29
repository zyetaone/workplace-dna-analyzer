<script lang="ts">
	import type { GenerationOption } from '$lib/questions';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { getQuizState } from './quiz.svelte.ts';
	import { Card, StatusIndicator, Loading, ErrorScreen } from '$lib/components';
	import JoinForm from '../(components)/JoinForm.svelte';
	import QuizContainer from '../(components)/QuizContainer.svelte';
	import CompletionScreen from '../(components)/CompletionScreen.svelte';
	import { fade, fly } from 'svelte/transition';

	// Get quiz state instance
	const quiz = getQuizState(page.params.code);

	// Determine current view based on URL and participant state
	const currentView = $derived.by(() => {
		const url = page.url.pathname;
		const hasParticipant = quiz.participant;

		if (url.includes('/complete')) return 'complete';
		if (url.includes('/quiz') || hasParticipant) return 'quiz';
		return 'join';
	});

	// Track if user has started typing name
	let hasStartedTyping = $state(false);

	// Track join progress for micro-feedback
	let isJoining = $state(false);

	// Validate session code and load session
	$effect(() => {
		const code = page.params.code;
		if (!code || !/^[A-Z0-9]+-[0-9]{6}$/.test(code)) {
			goto('/');
			return;
		}

		// Load session for join view, or participant data for quiz/complete views
		if (currentView === 'join') {
			quiz.loadSession(code);
		} else if (currentView === 'quiz' && quiz.participant?.id) {
			quiz.loadQuizState(code, quiz.participant.id);
		} else if (currentView === 'complete') {
			quiz.loadCompletionResults(code);
		}
	});

	// Handle join form submission with enhanced feedback
	async function handleJoin(name: string, generation: GenerationOption) {
		isJoining = true;
		try {
			const result = await quiz.joinSession(name, generation);
			if (result.success && 'participant' in result) {
				// Store participant ID in localStorage for persistence
				localStorage.setItem(`participant_${page.params.code}`, result.participant.id);

				// Small delay for success animation
				await new Promise((resolve) => setTimeout(resolve, 300));
				goto(`/${page.params.code}/quiz`);
			}
		} catch (error) {
			console.error('Join failed:', error);
			// Error is handled in quiz state
		} finally {
			isJoining = false;
		}
	}
</script>

{#if currentView === 'join'}
	<div
		class="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/10 to-slate-900 flex items-center justify-center px-4 py-8"
	>
		<!-- Animated background orbs for welcoming atmosphere -->
		<div class="floating-orbs">
			<div class="orb orb-1"></div>
			<div class="orb orb-2"></div>
			<div class="orb orb-3"></div>
		</div>

		<div class="max-w-md w-full">
			<!-- Welcome header with session info -->
			{#if quiz.session}
				<div class="text-center mb-8" in:fade={{ delay: 100, duration: 600 }}>
					<!-- Animated welcome icon -->
					<div
						class="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full mb-6 pulse-glow"
					>
						<div
							class="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center"
						>
							<svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
								></path>
							</svg>
						</div>
					</div>

					<!-- Welcoming message -->
					<h1 class="text-display text-white mb-2">Welcome!</h1>
					<p class="text-body text-secondary mb-2">
						You're joining: <span class="gradient-text-zyeta">{quiz.session.name}</span>
					</p>
					<p class="text-sm text-slate-400">
						Discover your ideal workplace preferences in just 5 minutes
					</p>
				</div>
			{/if}

			<Card
				variant="elevated"
				size="lg"
				class="w-full backdrop-blur-xl bg-white/5 border border-white/10 shadow-2xl transform transition-all duration-500 hover:scale-[1.01]"
				loading={false}
			>
				{#if quiz.loading}
					<!-- Friendly loading state -->
					<div class="text-center py-12" in:fade={{ duration: 300 }}>
						<div
							class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full mb-4 pulse-glow"
						>
							<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
						</div>
						<h3 class="text-heading-2 text-primary mb-2">Getting Everything Ready</h3>
						<p class="text-slate-400">Setting up your personalized experience...</p>
						<div class="mt-6 flex justify-center gap-2">
							<div
								class="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
								style="animation-delay: 0ms"
							></div>
							<div
								class="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
								style="animation-delay: 150ms"
							></div>
							<div
								class="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
								style="animation-delay: 300ms"
							></div>
						</div>
					</div>
				{:else if quiz.error}
					<!-- Friendly error state -->
					<div class="text-center py-12" in:fade={{ duration: 300 }}>
						<div
							class="inline-flex items-center justify-center w-16 h-16 bg-amber-500/20 rounded-full mb-4"
						>
							<svg
								class="w-8 h-8 text-amber-400"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
								></path>
							</svg>
						</div>
						<h3 class="text-heading-2 text-danger mb-2">Oops! Something went wrong</h3>
						<p class="text-slate-400 mb-6 px-6">
							{quiz.error || "We couldn't connect to the session. This might be temporary."}
						</p>
						<button
							onclick={() => location.reload()}
							class="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-105"
						>
							<div class="flex items-center gap-2">
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
									></path>
								</svg>
								<span>Refresh & Try Again</span>
							</div>
						</button>
					</div>
				{:else if quiz.session}
					<!-- Join form container -->
					<div class="space-y-6" in:fly={{ y: 20, duration: 500, delay: 200 }}>
						<JoinForm
							session={quiz.session}
							bind:participantName={quiz.participantName}
							{isJoining}
							joinError={quiz.error}
							onJoin={handleJoin}
							onNameInput={() => (hasStartedTyping = true)}
						/>
					</div>
				{:else}
					<!-- Loading initial session -->
					<div class="text-center py-12">
						<div
							class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full mb-4 pulse-glow"
						>
							<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
						</div>
						<h3 class="text-heading-2 text-primary mb-2">Connecting to Session</h3>
						<p class="text-slate-400">Just a moment...</p>
					</div>
				{/if}
			</Card>

			<!-- Trust indicators and footer -->
			<div class="mt-8 space-y-4" in:fade={{ delay: 400, duration: 600 }}>
				<!-- Trust badges -->
				<div class="flex items-center justify-center gap-4 text-xs text-slate-500">
					<div class="flex items-center gap-1">
						<svg
							class="w-4 h-4 text-green-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
							></path>
						</svg>
						<span>100% Anonymous</span>
					</div>
					<div class="flex items-center gap-1">
						<svg
							class="w-4 h-4 text-blue-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
							></path>
						</svg>
						<span>5 minutes</span>
					</div>
					<div class="flex items-center gap-1">
						<svg
							class="w-4 h-4 text-purple-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
							></path>
						</svg>
						<span>10 preference indicators</span>
					</div>
				</div>

				<!-- Branding -->
				<div class="text-center">
					<p class="text-xs text-slate-500">
						Powered by <span class="gradient-text-zyeta">Zyeta DX</span>
					</p>
				</div>
			</div>
		</div>
	</div>
{:else if currentView === 'quiz'}
	<!-- Quiz view -->
	<QuizContainer />
{:else if currentView === 'complete'}
	<!-- Completion view -->
	<div
		class="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center px-4"
	>
		<!-- Animated background orbs -->
		<div class="floating-orbs">
			<div class="orb orb-1"></div>
			<div class="orb orb-2"></div>
			<div class="orb orb-3"></div>
			<div class="orb orb-4"></div>
		</div>

		{#if quiz.loading}
			<Loading variant="screen" message="Preparing your workplace DNA analysis..." />
		{:else if quiz.error}
			<ErrorScreen title="Unable to Load Results" message={quiz.error} />
		{:else if quiz.completionData}
			<CompletionScreen
				participantName={quiz.participant?.name || 'Participant'}
				scores={quiz.completionData.scores || {
					collaboration: 0,
					formality: 0,
					tech: 0,
					wellness: 0
				}}
				onViewInsights={() => goto(`/admin/${page.params.code}`)}
				onRestartAssessment={() => goto(`/${page.params.code}`)}
			/>
		{:else}
			<div class="glass-card rounded-3xl p-12">
				<div class="text-center">
					<div class="w-16 h-16 mx-auto mb-4">
						<div
							class="w-full h-full rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin"
						></div>
					</div>
					<p class="text-body text-secondary">Loading your results...</p>
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
{/if}

<!-- Footer with branding -->
<div class="text-center mt-6">
	<p class="text-xs text-slate-500">
		Powered by <span class="gradient-text-zyeta">Zyeta DX</span>
	</p>
</div>
