<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { appState } from '$lib/state/app.svelte';
	import { Card, Status as StatusIndicator, Feedback } from '$lib/components/ui';
	import JoinForm from '$lib/components/modules/session/JoinForm.svelte';
	import { getSessionActivities } from '../activities/activities/activities.remote';

	// Get quiz state instance
	const quiz = appState.getQuizState(page.params.code);

	// Determine current view based on URL and participant state
	const currentView = $derived.by(() => {
		const url = page.url.pathname;
		const hasParticipant = quiz.participant;

		if (url.includes('/complete')) return 'complete';
		if (url.includes('/quiz') || hasParticipant) return 'quiz';
		return 'join';
	});

	// Redirect legacy quiz/complete to unified routes
	$effect(() => {
		if (currentView === 'quiz') {
			goto(`/${page.params.code}/activity/workplace-preference`);
		}
		if (currentView === 'complete') {
			goto(`/${page.params.code}/complete`);
		}
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

	import type { GenerationOption } from '$lib/questions';
	// Handle join form submission
	async function handleJoin(name: string, generation: GenerationOption) {
		try {
			const result = await quiz.joinSession(name, generation as any);
			if (result.success && 'participant' in result) {
				// Store participant ID in localStorage for persistence
				localStorage.setItem(`participant_${page.params.code}`, result.participant.id);
				// Store participant name for activities page
				localStorage.setItem(`participant_name_${page.params.code}`, name);

				// Get first available activity and redirect directly to it
				try {
					const sessionActivities = await getSessionActivities({ sessionCode: page.params.code });
					const availableActivities = sessionActivities.activities
						.filter((row: any) => row.sessionActivity.isActive)
						.sort((a: any, b: any) => a.sessionActivity.order - b.sessionActivity.order);

					if (availableActivities.length > 0) {
						const firstActivity = availableActivities[0].activity.slug;
						goto(`/${page.params.code}/activity/${firstActivity}`);
					} else {
						// Fallback to activities overview if no activities available
						goto(`/${page.params.code}/activities`);
					}
				} catch (activityError) {
					console.error('Failed to load activities:', activityError);
					// Fallback to activities overview
					goto(`/${page.params.code}/activities`);
				}
			}
		} catch (error) {
			console.error('Join failed:', error);
			// Handle error gracefully
		}
	}
</script>

{#if currentView === 'join'}
	<div class="animated-gradient flex min-h-screen items-center justify-center px-4 py-8">
		<div class="w-full max-w-md">
			<!-- Header with session info -->
			{#if quiz.session}
				<div class="mb-6 text-center">
					<div
						class="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500"
					>
						<svg class="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
							></path>
						</svg>
					</div>
					<h1 class="gradient-text mb-2 text-2xl font-bold">Join Workplace Quiz</h1>
					<p class="text-slate-400">
						Session: <span class="font-semibold text-slate-200">{quiz.session.name}</span>
					</p>
				</div>
			{/if}

			<Card
				variant="analytics"
				class="w-full border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl"
			>
				{#if quiz.loading}
					<!-- Enhanced loading state -->
					<div class="py-8 text-center">
						<div
							class="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20"
						>
							<div class="h-8 w-8 animate-spin rounded-full border-b-2 border-purple-400"></div>
						</div>
						<h3 class="mb-2 text-lg font-semibold text-slate-200">Loading Session</h3>
						<p class="text-slate-400">Preparing your personalized quiz experience...</p>
						<div class="mt-4">
							<StatusIndicator status="pending" label="Connecting to session..." />
						</div>
					</div>
				{:else if quiz.error}
					<UnifiedFeedback type="error" message={quiz.error}>
						<button
							onclick={() => location.reload()}
							class="rounded-lg bg-red-500/20 px-4 py-2 text-red-400 transition-colors duration-200 hover:bg-red-500/30"
						>
							Try Again
						</button>
					</UnifiedFeedback>
				{:else if quiz.session}
					<!-- Enhanced join form -->
					<div class="space-y-6">
						<div class="text-center">
							<h2 class="mb-2 text-xl font-semibold text-slate-200">Ready to Start?</h2>
							<p class="text-sm text-slate-400">
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
							class="mt-6 rounded-xl border border-slate-600/30 bg-slate-800/30 p-4 backdrop-blur-sm"
						>
							<div class="flex items-center justify-center gap-2 text-sm text-slate-400">
								<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
					<div class="py-8 text-center">
						<div
							class="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-slate-500/20"
						>
							<svg
								class="h-8 w-8 text-slate-400"
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
						<h3 class="mb-2 text-lg font-semibold text-slate-400">Session Not Found</h3>
						<p class="mb-4 text-slate-500">Please check your session code and try again</p>
						<div class="mb-4">
							<StatusIndicator status="warning" label="Invalid session code" />
						</div>
					</div>
				{/if}
			</Card>

			<!-- Footer with branding -->
			<div class="mt-6 text-center">
				<p class="text-xs text-slate-500">
					Powered by <span class="gradient-text font-semibold">Zyeta DX</span>
				</p>
			</div>
		</div>
	</div>
{:else if currentView === 'quiz'}
	<!-- Legacy quiz path redirects; show a lightweight placeholder -->
	<UnifiedFeedback type="loading" message="Opening quiz..." />
{:else if currentView === 'complete'}
	<!-- Legacy completion path redirects; show a lightweight placeholder -->
	<UnifiedFeedback type="loading" message="Preparing results..." />
{/if}

<!-- Footer with branding -->
<div class="mt-6 text-center">
	<p class="text-xs text-slate-500">
		Powered by <span class="gradient-text font-semibold">Zyeta DX</span>
	</p>
</div>
>
