<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { Card, Button } from '$lib/components/ui';

	// Import the new simplified Quiz component
	import Quiz from '$lib/components/Quiz.svelte';

	// Get server-loaded data
	let { data } = $props();
	let questions = $derived(data?.questions || []);
	let activity = $derived(data?.activity || null);
	let progress = $derived(data?.progress || null);
	let activitySlug = $derived(data?.activitySlug || '');
	let participantId = $derived(data?.participantId || null);
	let isActivityAvailable = $derived(data?.isActivityAvailable || false);
	let sessionCode = $derived(data?.sessionCode || '');
	let participantName = $derived(data?.participantName || '');

	// Handle activity completion
	async function handleComplete(result: any) {
		console.log('Quiz completed:', result);

		// Navigate to results page or show results inline
		// For now, just log the result
		// goto(`/${page.params.code}/activity/${page.params.activitySlug}/results`, {
		//   state: { result }
		// });
	}
</script>

{#if !isActivityAvailable}
	<!-- Coming Soon State -->
	<div class="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-8">
		<div class="container mx-auto max-w-4xl px-4">
			<div class="text-center">
				<Card class="p-8">
					<div class="mb-6">
						<div
							class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600"
						>
							<svg class="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
								></path>
							</svg>
						</div>
						<h1 class="mb-2 text-3xl font-bold text-gray-900">Coming Soon</h1>
						<p class="text-gray-600">
							This activity is not yet available. The facilitator will enable it when ready.
						</p>
					</div>

					<div class="flex flex-col gap-4 sm:flex-row sm:justify-center">
						<Button
							onclick={() => goto(`/${sessionCode}/activities`)}
							variant="secondary"
							class="w-full sm:w-auto"
						>
							View All Activities
						</Button>
						<Button
							onclick={() => goto(`/${sessionCode}`)}
							variant="outline"
							class="w-full sm:w-auto"
						>
							Back to Session
						</Button>
					</div>
				</Card>
			</div>
		</div>
	</div>
{:else if activity && questions.length > 0}
	<div class="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-8">
		<div class="container mx-auto max-w-4xl px-4">
			<!-- Activity Header -->
			<div class="mb-8 text-center">
				<h1 class="mb-2 text-3xl font-bold text-gray-900">{activity.name}</h1>
				<p class="text-gray-600">{activity.config?.description || ''}</p>
			</div>

			<!-- Activity Progress Navigation -->
			<div class="mb-6">
				<div class="flex items-center justify-between">
					<Button
						onclick={() => goto(`/${sessionCode}/activities`)}
						variant="outline"
						class="text-sm"
					>
						<svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M10 19l-7-7m0 0l7-7m-7 7h18"
							></path>
						</svg>
						All Activities
					</Button>
					<div class="text-sm text-gray-500">
						Session: <span class="font-medium text-gray-700">{sessionCode}</span>
					</div>
				</div>
			</div>

			<!-- New Quiz Component -->
			<Quiz
				{questions}
				options={{
					type: activitySlug === 'workplace-preference' ? 'assessment' : 'survey',
					allowSkip: true,
					showProgress: true
				}}
				action={`?/completeQuiz`}
			/>
		</div>
	</div>
{:else}
	<div class="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-8">
		<div class="container mx-auto max-w-4xl px-4">
			<Card class="p-8 text-center">
				<h1 class="mb-4 text-2xl font-bold text-gray-900">Activity Not Available</h1>
				<p class="mb-6 text-gray-600">
					This activity is not available or has not been configured properly.
				</p>
				<Button onclick={() => goto(`/${sessionCode}/activities`)} variant="primary">
					Back to Activities
				</Button>
			</Card>
		</div>
	</div>
{/if}
tyle>

<style></style>
