<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { Card, Button } from '$lib/components';
	import confetti from 'canvas-confetti';
	import { getSessionActivities } from '../../../../activities/activities/activities.remote';

	// Import unified results component
	import ResultsView from '$lib/components/modules/activities/components/ResultsView.svelte';

	// All activities now use the same results component
	const ResultsComponent = ResultsView;

	// Quiz type mapping for results display
	const activityTypes = {
		'workplace-preference': 'assessment' as const,
		'pulse-survey': 'survey' as const,
		'team-health': 'survey' as const
	};

	let scores = $state<any>(null);
	let responses = $state<any>(null);
	let nextActivity = $state<any>(null);
	let autoRedirectCountdown = $state<number>(5);
	let redirectInterval = $state<NodeJS.Timeout | null>(null);
	let sessionCode = $state<string>('');

	onMount(async () => {
		sessionCode = page.params.code as string;

		// Get data from navigation state or localStorage
		const navState = history.state?.usr;
		if (navState?.scores) {
			scores = navState.scores;
			responses = navState.responses;
		} else {
			// Try to load from localStorage as fallback
			const savedData = localStorage.getItem(
				`activity_result_${sessionCode}_${page.params.activitySlug}`
			);
			if (savedData) {
				const parsed = JSON.parse(savedData);
				scores = parsed.scores;
				responses = parsed.responses;
			}
		}

		// Find next available activity
		await findNextActivity();

		// All activities use the same component now
		const activitySlug = page.params.activitySlug as string;

		// Trigger celebration
		if (scores) {
			setTimeout(() => {
				confetti({
					particleCount: 100,
					spread: 70,
					origin: { y: 0.6 }
				});
			}, 500);
		}

		// TODO: Trigger completion check for auto-progression
		// This will be implemented via server action or quiz store completion handler

		// Start auto-redirect countdown if there's a next activity
		if (nextActivity) {
			startAutoRedirect();
		}
	});

	// Find the next available activity
	async function findNextActivity() {
		try {
			const sessionActivities = await getSessionActivities({ sessionCode });
			const currentSlug = page.params.activitySlug as string;

			const availableActivities = sessionActivities.activities
				.filter((row: any) => row.sessionActivity.isActive)
				.sort((a: any, b: any) => a.sessionActivity.order - b.sessionActivity.order);

			const currentIndex = availableActivities.findIndex(
				(row: any) => row.activity.slug === currentSlug
			);

			if (currentIndex >= 0 && currentIndex < availableActivities.length - 1) {
				nextActivity = availableActivities[currentIndex + 1].activity;
			}
		} catch (error) {
			console.error('Failed to find next activity:', error);
		}
	}

	// Start auto-redirect countdown
	function startAutoRedirect() {
		redirectInterval = setInterval(() => {
			autoRedirectCountdown--;
			if (autoRedirectCountdown <= 0) {
				if (redirectInterval) {
					clearInterval(redirectInterval);
				}
				gotoNextActivity();
			}
		}, 1000);
	}

	// Go to next activity
	function gotoNextActivity() {
		if (nextActivity) {
			goto(`/${sessionCode}/activity/${nextActivity.slug}`);
		}
	}

	// Cancel auto-redirect
	function cancelAutoRedirect() {
		if (redirectInterval) {
			clearInterval(redirectInterval);
			redirectInterval = null;
		}
	}

	function viewMoreActivities() {
		cancelAutoRedirect();
		goto(`/${sessionCode}/activities`);
	}

	function backToSession() {
		cancelAutoRedirect();
		goto(`/${sessionCode}`);
	}

	// Cleanup on unmount
	import { onDestroy } from 'svelte';
	onDestroy(() => {
		cancelAutoRedirect();
	});
</script>

<div class="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-8">
	<div class="container mx-auto max-w-4xl px-4">
		{#if scores}
			<div class="space-y-6">
				<ResultsView
					result={{
						overallScore: scores.overallScore || responses?.length || 0,
						sentiment: scores.sentiment || 'neutral',
						responses: responses || [],
						scores: scores.scores || {},
						insights: scores.insights || [],
						profile: scores.profile
					}}
					showDetails={true}
					quizType={activityTypes[page.params.activitySlug as keyof typeof activityTypes]}
					onClose={backToSession}
					onRestart={viewMoreActivities}
				/>

				{#if nextActivity}
					<!-- Next Activity Preview -->
					<Card class="border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50 p-6">
						<div class="text-center">
							<div class="mb-4">
								<div
									class="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600"
								>
									<svg
										class="h-6 w-6 text-white"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M13 7l5 5m0 0l-5 5m5-5H6"
										></path>
									</svg>
								</div>
								<h3 class="text-lg font-semibold text-gray-900">Next Activity</h3>
								<p class="text-sm text-gray-600">
									Auto-redirecting in <span class="font-bold text-blue-600"
										>{autoRedirectCountdown}</span
									> seconds
								</p>
							</div>

							<div class="mb-4 rounded-lg bg-white p-4 shadow-sm">
								<h4 class="font-medium text-gray-900">{nextActivity.name}</h4>
								<p class="text-sm text-gray-600">{nextActivity.config?.description || ''}</p>
							</div>

							<div class="flex justify-center gap-3">
								<Button
									onclick={gotoNextActivity}
									variant="primary"
									class="bg-gradient-to-r from-blue-500 to-purple-600"
								>
									Start Next Activity
								</Button>
								<Button onclick={cancelAutoRedirect} variant="outline">Stay Here</Button>
							</div>
						</div>
					</Card>
				{:else}
					<!-- All Activities Completed -->
					<Card class="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-6">
						<div class="text-center">
							<div class="mb-4">
								<div
									class="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-600"
								>
									<svg
										class="h-6 w-6 text-white"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
										></path>
									</svg>
								</div>
								<h3 class="text-lg font-semibold text-gray-900">All Activities Completed!</h3>
								<p class="text-sm text-gray-600">
									You've finished all available activities for this session.
								</p>
							</div>

							<Button
								onclick={viewMoreActivities}
								variant="primary"
								class="bg-gradient-to-r from-green-500 to-emerald-600"
							>
								View Results
							</Button>
						</div>
					</Card>
				{/if}
			</div>
		{:else}
			<Card class="p-8 text-center">
				<h2 class="mb-4 text-2xl font-bold text-gray-900">No Results Found</h2>
				<p class="mb-6 text-gray-600">It looks like you haven't completed this activity yet.</p>
				<Button onclick={backToSession}>Back to Session</Button>
			</Card>
		{/if}
	</div>
</div>

<style></style>
