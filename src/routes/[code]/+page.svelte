<script lang="ts">
	import type { GenerationOption } from '$lib/questions';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { getQuizState } from './quiz.svelte.ts';
	import { Card, StatusIndicator, LoadingScreen, ErrorScreen } from '$lib/components';
	import JoinForm from '../(components)/JoinForm.svelte';
	import QuizContainer from '../(components)/QuizContainer.svelte';
	import CompletionScreen from '../(components)/CompletionScreen.svelte';

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

	// Handle join form submission
	async function handleJoin(name: string, generation: GenerationOption) {
		try {
			const result = await quiz.joinSession(name, generation);
			if (result.success && 'participant' in result) {
				// Store participant ID in localStorage for persistence
				localStorage.setItem(`participant_${page.params.code}`, result.participant.id);
				goto(`/${page.params.code}/quiz`);
			}
		} catch (error) {
			console.error('Join failed:', error);
			// Handle error gracefully
		}
	}
</script>

{#if currentView === 'join'}
	<div class="min-h-screen animated-gradient flex items-center justify-center px-4 py-8">
		<div class="max-w-md w-full">
			<!-- Header with session info -->
			{#if quiz.session}
				<div class="text-center mb-6">
					<div
						class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mb-4"
					>
						<svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
							></path>
						</svg>
					</div>
					<h1 class="text-2xl font-bold gradient-text mb-2">Join Workplace Quiz</h1>
					<p class="text-slate-400">
						Session: <span class="font-semibold text-slate-200">{quiz.session.name}</span>
					</p>
				</div>
			{/if}

			<Card
				variant="elevated"
				size="lg"
				class="w-full backdrop-blur-xl bg-white/5 border border-white/10 shadow-2xl"
				loading={quiz.loading}
			>
				{#if quiz.loading}
					<!-- Enhanced loading state -->
					<div class="text-center py-8">
						<div
							class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full mb-4"
						>
							<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
						</div>
						<h3 class="text-lg font-semibold text-slate-200 mb-2">Loading Session</h3>
						<p class="text-slate-400">Preparing your personalized quiz experience...</p>
						<div class="mt-4">
							<StatusIndicator status="loading" message="Connecting to session..." />
						</div>
					</div>
				{:else if quiz.error}
					<!-- Enhanced error state -->
					<div class="text-center py-8">
						<div
							class="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-full mb-4"
						>
							<svg
								class="w-8 h-8 text-red-400"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
								></path>
							</svg>
						</div>
						<h3 class="text-lg font-semibold text-red-400 mb-2">Unable to Join Session</h3>
						<p class="text-slate-400 mb-4">{quiz.error}</p>
						<div class="mb-4">
							<StatusIndicator status="error" message="Connection failed" />
						</div>
						<button
							onclick={() => location.reload()}
							class="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors duration-200"
						>
							Try Again
						</button>
					</div>
				{:else if quiz.session}
					<!-- Enhanced join form -->
					<div class="space-y-6">
						<div class="text-center">
							<h2 class="text-xl font-semibold text-slate-200 mb-2">Ready to Start?</h2>
							<p class="text-slate-400 text-sm">
								Complete this quick assessment to discover your workplace preferences
							</p>
						</div>

						<JoinForm
							session={quiz.session}
							bind:participantName={quiz.participantName}
							isJoining={quiz.loading}
							joinError={quiz.error}
							onJoin={handleJoin}
						/>

						<!-- Session stats preview -->
						<div
							class="mt-6 p-4 bg-slate-800/30 backdrop-blur-sm rounded-xl border border-slate-600/30"
						>
							<div class="flex items-center justify-center gap-2 text-sm text-slate-400">
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
									></path>
								</svg>
								<span>10 questions • 5-10 minutes</span>
							</div>
						</div>
					</div>
				{:else}
					<!-- No session state -->
					<div class="text-center py-8">
						<div
							class="inline-flex items-center justify-center w-16 h-16 bg-slate-500/20 rounded-full mb-4"
						>
							<svg
								class="w-8 h-8 text-slate-400"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.467-.881-6.08-2.33"
								></path>
							</svg>
						</div>
						<h3 class="text-lg font-semibold text-slate-400 mb-2">Session Not Found</h3>
						<p class="text-slate-500 mb-4">Please check your session code and try again</p>
						<div class="mb-4">
							<StatusIndicator status="warning" message="Invalid session code" />
						</div>
					</div>
				{/if}
			</Card>

			<!-- Footer with branding -->
			<div class="text-center mt-6">
				<p class="text-xs text-slate-500">
					Powered by <span class="font-semibold gradient-text">Zyeta DX</span>
				</p>
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
			<LoadingScreen
				show={true}
				variant="modal"
				message="Preparing your workplace DNA analysis..."
			/>
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
				onRestartQuiz={() => goto(`/${page.params.code}`)}
			/>
		{:else}
			<div class="glass-card rounded-3xl p-12">
				<div class="text-center">
					<div class="w-16 h-16 mx-auto mb-4">
						<div
							class="w-full h-full rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin"
						></div>
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
{/if}

<!-- Footer with branding -->
<div class="text-center mt-6">
	<p class="text-xs text-slate-500">
		Powered by <span class="font-semibold gradient-text">Zyeta DX</span>
	</p>
</div>
