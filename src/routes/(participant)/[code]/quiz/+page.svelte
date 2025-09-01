<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { Loading } from '$lib/components';
	import { getSessionActivities } from '../../activities/activities/activities.remote';

	let redirecting = $state(true);
	let redirectTarget = $state('');

	onMount(async () => {
		const sessionCode = page.params.code as string;

		// Validate session code
		if (!sessionCode || !/^[A-Z0-9]+-[0-9]{6}$/.test(sessionCode)) {
			goto('/');
			return;
		}

		// Check for participant
		const participantId = localStorage.getItem(`participant_${sessionCode}`);
		if (!participantId) {
			goto(`/${sessionCode}`);
			return;
		}

		try {
			// Check which activities are enabled for this session
			const sessionActivitiesResult = await getSessionActivities({ sessionCode });

			if (sessionActivitiesResult.activities && sessionActivitiesResult.activities.length > 0) {
				// Prefer workplace-preference; otherwise first enabled activity
				const workplacePref = sessionActivitiesResult.activities.find(
					(a) => a.activity.slug === 'workplace-preference' && a.sessionActivity?.isActive
				);

				if (workplacePref) {
					redirectTarget = `/${sessionCode}/activity/workplace-preference`;
				} else {
					const firstEnabled = sessionActivitiesResult.activities.find(
						(a) => a.sessionActivity?.isActive
					);
					redirectTarget = firstEnabled
						? `/${sessionCode}/activity/${firstEnabled.activity.slug}`
						: `/${sessionCode}/activities`;
				}
			} else {
				// Fallback to workplace preference
				redirectTarget = `/${sessionCode}/activity/workplace-preference`;
			}

			// Perform redirect after a short delay for smooth UX
			setTimeout(() => {
				goto(redirectTarget);
			}, 1500);
		} catch (error) {
			console.error('Failed to determine redirect target:', error);
			// Fallback redirect
			setTimeout(() => {
				goto(`/${sessionCode}/activity/workplace-preference`);
			}, 1500);
		}
	});
</script>

{#if redirecting}
	<div
		class="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50"
	>
		<div class="text-center">
			<div class="mb-4">
				<div
					class="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-blue-600"
				>
					<svg class="h-6 w-6 animate-spin text-white" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
						></circle>
						<path
							class="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
						></path>
					</svg>
				</div>
			</div>
			<h2 class="mb-2 text-xl font-semibold text-gray-900">Updating to Enhanced Experience</h2>
			<p class="mb-4 text-gray-600">Redirecting to the improved activity system...</p>
			{#if redirectTarget}
				<p class="text-sm text-gray-500">
					Destination: {redirectTarget.split('/').pop()?.replace('-', ' ')}
				</p>
			{/if}
			<div class="mt-4">
				<Loading message="Preparing your enhanced experience..." />
			</div>
		</div>
	</div>
{:else}
	<!-- This should never render due to redirect -->
	<div class="flex min-h-screen items-center justify-center">
		<p class="text-gray-600">Redirecting...</p>
	</div>
{/if}

<style></style>
