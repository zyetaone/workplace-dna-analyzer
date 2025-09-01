<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { Card, Button } from '$lib/components';

	// Get server-loaded data
	let { data } = $props();
	let activities = $derived(data?.activities || []);
	let activityProgress = $derived(data?.activityProgress || new Map());
	let sessionCode = $derived(data?.sessionCode || '');
	let participantName = $derived(data?.participantName || 'Participant');
	let participantId = $derived(data?.participantId || null);

	let eventSource: EventSource | null = $state(null);
	let lastActivityUpdate = $state<Date | null>(null);

	onMount(async () => {
		// Set up real-time SSE connection for activity updates
		setupRealtimeConnection();
	});

	// Set up SSE connection for real-time activity updates
	function setupRealtimeConnection() {
		if (eventSource) {
			eventSource.close();
		}

		eventSource = new EventSource(`/admin/sse/${sessionCode}`);

		eventSource.onmessage = (event) => {
			try {
				const data = JSON.parse(event.data);

				if (data.type === 'activity_update') {
					handleActivityUpdate(data);
				} else if (data.type === 'session_update') {
					handleSessionUpdate(data);
				}
			} catch (error) {
				console.error('Failed to parse SSE message:', error);
			}
		};

		eventSource.onerror = (error) => {
			console.error('SSE connection error:', error);
			// Attempt to reconnect after a delay
			setTimeout(() => {
				if (eventSource?.readyState === EventSource.CLOSED) {
					setupRealtimeConnection();
				}
			}, 5000);
		};

		eventSource.onopen = () => {
			console.log('SSE connection established for session:', sessionCode);
		};
	}

	// Handle real-time activity updates
	function handleActivityUpdate(data: any) {
		console.log('Activity update received:', data);
		lastActivityUpdate = new Date();

		// Show notification for new activity
		if (data.isActive && !data.adminTriggered) {
			showActivityNotification(data.activityName, 'enabled');
		}
	}

	// Handle session-wide updates
	function handleSessionUpdate(data: any) {
		// Update activity stats if available
		if (data.activityStats) {
			console.log('Session activity stats:', data.activityStats);
		}
	}

	// Show notification for activity changes
	function showActivityNotification(activityName: string, action: string) {
		// Create a temporary notification element
		const notification = document.createElement('div');
		notification.className =
			'fixed top-4 right-4 z-50 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg transform transition-transform duration-300 translate-x-full';
		notification.innerHTML = `
      <div class="flex items-center gap-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <span class="font-medium">New Activity Available!</span>
      </div>
      <p class="text-sm mt-1">${activityName} has been ${action}</p>
    `;

		document.body.appendChild(notification);

		// Animate in
		setTimeout(() => {
			notification.classList.remove('translate-x-full');
		}, 100);

		// Remove after 5 seconds
		setTimeout(() => {
			notification.classList.add('translate-x-full');
			setTimeout(() => {
				document.body.removeChild(notification);
			}, 300);
		}, 5000);
	}

	// Cleanup on unmount
	import { onDestroy } from 'svelte';
	onDestroy(() => {
		if (eventSource) {
			eventSource.close();
		}
	});

	function startActivity(slug: string) {
		goto(`/${sessionCode}/activity/${slug}`);
	}
</script>

<div class="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-8">
	<div class="container mx-auto max-w-6xl px-4">
		<!-- Header -->
		<div class="mb-12 text-center">
			<h1 class="mb-4 text-4xl font-bold text-gray-900">
				Welcome back, {participantName}!
			</h1>
			<p class="mb-4 text-xl text-gray-600">Activity Status Overview</p>
			<p class="text-sm text-gray-500">Click on any available activity to get started</p>
			<div class="mt-4 flex items-center justify-center gap-4">
				<div class="inline-flex items-center rounded-full bg-white px-4 py-2 shadow-sm">
					<span class="text-sm text-gray-500">Session Code:</span>
					<span class="ml-2 font-mono font-bold text-purple-600">{sessionCode}</span>
				</div>
				{#if lastActivityUpdate}
					<div
						class="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-sm text-green-700"
					>
						<div class="h-2 w-2 animate-pulse rounded-full bg-green-500"></div>
						<span>Live Updates Active</span>
					</div>
				{/if}
			</div>
		</div>

		<!-- Activity Grid -->
		<div class="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
			{#each activities as activity}
				<Card class="relative overflow-hidden transition-shadow duration-300 hover:shadow-xl">
					<!-- Gradient Header -->
					<div class="h-2 bg-gradient-to-r {activity.color}"></div>

					<div class="p-6">
						<!-- Icon and Title -->
						<div class="mb-4 flex items-start gap-4">
							<div class="text-4xl">{activity.icon}</div>
							<div class="flex-1">
								<div class="mb-1 flex items-center gap-2">
									<h3 class="text-xl font-bold text-gray-900">
										{activity.name}
									</h3>
									{#if activity.category === 'legacy'}
										<span
											class="inline-flex items-center rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-800"
										>
											Legacy
										</span>
									{/if}
								</div>
								<p class="mb-2 text-sm text-gray-600">
									{activity.description}
								</p>
								<!-- Status and Type Badges -->
								{#snippet statusBadges(activity)}
									{@const progress = activityProgress.get(activity.slug)}
									<div class="mb-2 flex items-center gap-2">
										{#if progress?.participantActivity?.isCompleted}
											<span
												class="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800"
											>
												<svg
													class="mr-1 h-3 w-3"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
												>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M5 13l4 4L19 7"
													></path>
												</svg>
												Completed
											</span>
										{:else if progress?.participantActivity}
											<span
												class="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800"
											>
												<svg
													class="mr-1 h-3 w-3"
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
												In Progress ({progress.participantActivity.progress || 0}%)
											</span>
										{:else}
											<span
												class="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800"
											>
												<svg
													class="mr-1 h-3 w-3"
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
												Available
											</span>
										{/if}
										<span
											class="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium
												{activity.type === 'assessment'
												? 'bg-blue-100 text-blue-800'
												: activity.type === 'survey'
													? 'bg-green-100 text-green-800'
													: activity.type === 'interactive'
														? 'bg-purple-100 text-purple-800'
														: 'bg-gray-100 text-gray-800'}"
										>
											{activity.type}
										</span>
									</div>
								{/snippet}
							</div>
						</div>

						<!-- Metadata -->
						<div class="mb-6 flex items-center gap-4 text-sm text-gray-500">
							<div class="flex items-center gap-1">
								<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
								<span>{activity.estimatedTime} min</span>
							</div>
							<div class="flex items-center gap-1">
								<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
									/>
								</svg>
								<span>{activity.questions} questions</span>
							</div>
						</div>

						<!-- Start Button -->
						<Button
							onclick={() => startActivity(activity.slug)}
							variant="primary"
							class="w-full bg-gradient-to-r {activity.color} hover:opacity-90"
						>
							Start Activity
						</Button>
					</div>
				</Card>
			{/each}
		</div>

		<!-- Footer -->
	</div>
</div>

<style></style>
