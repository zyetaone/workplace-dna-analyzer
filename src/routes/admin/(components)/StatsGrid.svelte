<script lang="ts">
	import { Card, Tooltip } from '$lib/components';
	import type { getSessionStore } from '../admin.svelte.ts';

	interface StatsGridProps {
		store: ReturnType<typeof getSessionStore>;
	}

	let { store }: StatsGridProps = $props();

	const analytics = $derived(store.analytics());

	// Stats data with icons and colors
	const stats = $derived([
		{
			label: 'Total',
			value: (analytics.totalCount || 0).toString(),
			color: 'text-blue-600',
			tooltip: 'Total number of participants who joined'
		},
		{
			label: 'Completed',
			value: (analytics.completedCount || 0).toString(),
			color: 'text-green-600',
			tooltip: 'Participants who completed the quiz'
		},
		{
			label: 'In Progress',
			value: (analytics.activeCount || 0).toString(),
			color: 'text-amber-600',
			tooltip: 'Participants currently taking the quiz'
		},
		{
			label: 'Response Rate',
			value: `${analytics.responseRate || 0}%`,
			color: 'text-purple-600',
			tooltip: 'Percentage of participants who completed the quiz'
		}
	]);
</script>

<Card variant="stats">
	{#snippet children()}
		<div class="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
			{#each stats as stat}
				<Tooltip content={stat.tooltip}>
					<div class="cursor-help rounded-lg p-2 text-center transition-colors hover:bg-gray-100">
						<div class="text-2xl font-bold {stat.color}">{stat.value}</div>
						<div class="text-sm font-medium text-gray-600">{stat.label}</div>
					</div>
				</Tooltip>
			{/each}
		</div>

		<!-- Progress Bar -->
		<div class="progress-container">
			<div class="progress-fill" style="width: {analytics.responseRate}%"></div>
		</div>

		{#if analytics.totalCount > 0}
			<div class="mt-2 text-center">
				<span class="text-sm text-gray-600">
					{analytics.completedCount} of {analytics.totalCount} completed ({analytics.responseRate}%)
				</span>
			</div>
		{:else}
			<div class="mt-2 text-center">
				<span class="text-sm text-gray-500">Waiting for participants to join...</span>
			</div>
		{/if}
	{/snippet}
</Card>

<style></style>
