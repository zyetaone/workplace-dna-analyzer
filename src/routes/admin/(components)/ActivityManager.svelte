<script lang="ts">
	import { page } from '$app/state';
	import { Card, Button, Input, Select, ConfirmationDialog } from '$lib/components';
	import { fade, fly } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import {
		toggleActivityRealtime,
		updateCompletionThreshold,
		toggleActivityAutoProgression,
		manualActivityProgression,
		getRealtimeActivityStatus,
		getActivityProgressionHistory
	} from '../activity-control.remote';

	// Get session code from URL
	const sessionCode = page.params.code;

	// Activity data
	let activities: any[] = $state([]);
	let progressionHistory: any[] = $state([]);
	let loading = $state(false);
	let error = $state<string | null>(null);

	// Dialog states
	let showThresholdDialog = $state(false);
	let showProgressionDialog = $state(false);
	let selectedActivity = $state<any>(null);
	let newThreshold = $state(80);
	let progressionTarget = $state<string>('');

	// Load activity data
	async function loadActivityData() {
		try {
			loading = true;
			error = null;

			const [statusResult, historyResult] = await Promise.all([
				getRealtimeActivityStatus({ sessionCode }),
				getActivityProgressionHistory({ sessionCode })
			]);

			if (statusResult.success) {
				activities = statusResult.activities || [];
			}

			if (historyResult.success) {
				progressionHistory = historyResult.history || [];
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load activity data';
		} finally {
			loading = false;
		}
	}

	// Toggle activity active state
	async function toggleActivity(activitySlug: string, isActive: boolean) {
		try {
			const result = await toggleActivityRealtime({
				sessionCode,
				activitySlug,
				isActive: !isActive,
				adminTriggered: true
			});

			if (result.success) {
				await loadActivityData(); // Refresh data
			} else {
				error = result.error || 'Failed to toggle activity';
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to toggle activity';
		}
	}

	// Update completion threshold
	async function updateThreshold() {
		if (!selectedActivity) return;

		try {
			const result = await updateCompletionThreshold({
				sessionCode,
				activitySlug: selectedActivity.slug,
				threshold: newThreshold
			});

			if (result.success) {
				showThresholdDialog = false;
				selectedActivity = null;
				await loadActivityData(); // Refresh data
			} else {
				error = result.error || 'Failed to update threshold';
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to update threshold';
		}
	}

	// Toggle auto-progression
	async function toggleAutoProgression(activitySlug: string, enabled: boolean) {
		try {
			const result = await toggleActivityAutoProgression({
				sessionCode,
				activitySlug,
				enabled
			});

			if (result.success) {
				await loadActivityData(); // Refresh data
			} else {
				error = result.error || 'Failed to toggle auto-progression';
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to toggle auto-progression';
		}
	}

	// Manual progression
	async function triggerManualProgression() {
		if (!progressionTarget) return;

		try {
			const result = await manualActivityProgression({
				sessionCode,
				fromActivitySlug: progressionTarget
			});

			if (result.success) {
				showProgressionDialog = false;
				progressionTarget = '';
				await loadActivityData(); // Refresh data
			} else {
				error = result.error || 'Failed to trigger progression';
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to trigger progression';
		}
	}

	// Open threshold dialog
	function openThresholdDialog(activity: any) {
		selectedActivity = activity;
		newThreshold = activity.completionThreshold;
		showThresholdDialog = true;
	}

	// Open progression dialog
	function openProgressionDialog(activity: any) {
		selectedActivity = activity;
		progressionTarget = activity.slug;
		showProgressionDialog = true;
	}

	// Load data on mount
	$effect(() => {
		if (sessionCode) {
			loadActivityData();
		}
	});

	// Get activity status color
	function getStatusColor(activity: any) {
		if (!activity.isActive) return 'text-gray-400';
		if (activity.completionRate >= activity.completionThreshold) return 'text-green-400';
		if (activity.inProgressCount > 0) return 'text-yellow-400';
		return 'text-blue-400';
	}

	// Get activity status text
	function getStatusText(activity: any) {
		if (!activity.isActive) return 'Inactive';
		if (activity.completionRate >= activity.completionThreshold) return 'Ready to Progress';
		if (activity.inProgressCount > 0) return 'In Progress';
		return 'Waiting';
	}
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h2 class="text-2xl font-bold text-white">Activity Management</h2>
			<p class="text-slate-400">Monitor completion and control activity progression</p>
		</div>
		<div class="flex gap-3">
			<Button variant="secondary" size="sm" onclick={loadActivityData} disabled={loading}>
				{loading ? 'Loading...' : 'Refresh'}
			</Button>
			<Button variant="primary" size="sm" onclick={() => (showProgressionDialog = true)}>
				Manual Progression
			</Button>
		</div>
	</div>

	{#if error}
		<div class="rounded-lg border border-red-500/20 bg-red-500/10 p-4">
			<p class="text-red-400">{error}</p>
		</div>
	{/if}

	<!-- Activities Grid -->
	<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
		{#each activities as activity (activity.slug)}
			<Card class="relative overflow-hidden">
				<div class="p-6">
					<!-- Activity Header -->
					<div class="mb-4 flex items-start justify-between">
						<div>
							<h3 class="text-lg font-semibold text-white">{activity.name}</h3>
							<p class="text-sm capitalize text-slate-400">{activity.type}</p>
						</div>
						<div class="flex items-center gap-2">
							<span
								class={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(activity)} bg-current/10`}
							>
								{getStatusText(activity)}
							</span>
						</div>
					</div>

					<!-- Progress Stats -->
					<div class="mb-4 space-y-2">
						<div class="flex justify-between text-sm">
							<span class="text-slate-400">Completion</span>
							<span class="text-white">{activity.completionRate}%</span>
						</div>
						<div class="h-2 rounded-full bg-slate-700">
							<div
								class="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
								style="width: {activity.completionRate}%"
							></div>
						</div>
						<div class="flex justify-between text-xs text-slate-400">
							<span>{activity.completedCount} completed</span>
							<span>{activity.totalCount} total</span>
						</div>
					</div>

					<!-- Threshold Info -->
					<div class="mb-4 rounded-lg bg-slate-800/50 p-3">
						<div class="flex items-center justify-between">
							<span class="text-sm text-slate-400">Threshold</span>
							<span class="text-sm font-medium text-white">{activity.completionThreshold}%</span>
						</div>
						<div class="mt-1 flex items-center gap-2">
							<span class="text-xs text-slate-500">Auto-progression:</span>
							<span
								class={`text-xs ${activity.autoProgressionEnabled ? 'text-green-400' : 'text-red-400'}`}
							>
								{activity.autoProgressionEnabled ? 'Enabled' : 'Disabled'}
							</span>
						</div>
					</div>

					<!-- Action Buttons -->
					<div class="flex flex-wrap gap-2">
						<Button
							variant={activity.isActive ? 'secondary' : 'primary'}
							size="sm"
							onclick={() => toggleActivity(activity.slug, activity.isActive)}
						>
							{activity.isActive ? 'Disable' : 'Enable'}
						</Button>

						<Button variant="outline" size="sm" onclick={() => openThresholdDialog(activity)}>
							Threshold
						</Button>

						<Button
							variant="outline"
							size="sm"
							onclick={() => toggleAutoProgression(activity.slug, !activity.autoProgressionEnabled)}
						>
							{activity.autoProgressionEnabled ? 'Disable Auto' : 'Enable Auto'}
						</Button>

						{#if activity.completionRate >= activity.completionThreshold}
							<Button variant="primary" size="sm" onclick={() => openProgressionDialog(activity)}>
								Progress
							</Button>
						{/if}
					</div>
				</div>
			</Card>
		{/each}
	</div>

	<!-- Progression History -->
	{#if progressionHistory.length > 0}
		<Card>
			<div class="p-6">
				<h3 class="mb-4 text-lg font-semibold text-white">Progression History</h3>
				<div class="space-y-3">
					{#each progressionHistory.slice(0, 10) as event (event.id)}
						<div class="flex items-center justify-between rounded-lg bg-slate-800/50 p-3">
							<div class="flex items-center gap-3">
								<div class="h-2 w-2 rounded-full bg-green-500"></div>
								<div>
									<p class="text-sm text-white">
										Activity progressed ({event.completionRate}% completion)
									</p>
									<p class="text-xs text-slate-400">
										{new Date(event.createdAt).toLocaleString()}
									</p>
								</div>
							</div>
							<div class="text-right">
								<p class="text-xs text-slate-400">Threshold: {event.thresholdUsed}%</p>
								<p class="text-xs capitalize text-slate-500">{event.triggerType}</p>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</Card>
	{/if}
</div>

<!-- Threshold Update Dialog -->
<ConfirmationDialog
	bind:open={showThresholdDialog}
	title="Update Completion Threshold"
	message="Set the completion percentage required to auto-enable the next activity."
	onConfirm={updateThreshold}
	onCancel={() => {
		showThresholdDialog = false;
		selectedActivity = null;
	}}
>
	<div class="mb-4">
		<label class="mb-2 block text-sm font-medium text-slate-300"> Completion Threshold (%) </label>
		<Input type="number" min="50" max="95" bind:value={newThreshold} placeholder="80" />
		<p class="mt-1 text-xs text-slate-500">Range: 50% - 95%</p>
	</div>
</ConfirmationDialog>

<!-- Manual Progression Dialog -->
<ConfirmationDialog
	bind:open={showProgressionDialog}
	title="Manual Activity Progression"
	message="Force progression to the next activity regardless of completion threshold."
	onConfirm={triggerManualProgression}
	onCancel={() => {
		showProgressionDialog = false;
		progressionTarget = '';
	}}
>
	<div class="mb-4">
		<p class="text-sm text-slate-300">This will manually enable the next activity in sequence.</p>
	</div>
</ConfirmationDialog>

<style>
	/* Custom styles if needed */
</style>
