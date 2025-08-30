<!--
ParticipantCard - Clean Card-Based Component
-->
<script lang="ts">
	import Card from './Card.svelte';
	import Button from './Button.svelte';
	import type { Participant } from '$lib/server/db/schema';

	interface Props {
		participant: Participant;
		onDelete?: (id: string, name: string) => void;
		showScores?: boolean;
	}

	let { participant, onDelete, showScores = false }: Props = $props();

	const responseCount = $derived(Object.keys(participant.responses || {}).length);
	const progressPercentage = $derived(Math.round((responseCount / 7) * 100));

	const statusConfig = $derived(() => {
		if (participant.completed) {
			return { text: 'Completed', class: 'status-active' };
		}
		return { text: 'In Progress', class: 'status-pending' };
	});
</script>

<Card variant="default" hoverable={true} class="mb-4">
	{#snippet children()}
		<!-- Header -->
		<div class="flex items-start justify-between mb-4">
			<div>
				<h3 class="text-lg font-semibold text-gray-900">{participant.name}</h3>
				{#if participant.generation}
					<p class="text-sm text-gray-600">{participant.generation}</p>
				{/if}
			</div>

			<span class="px-3 py-1 text-xs font-medium rounded-full {statusConfig().class}">
				{statusConfig().text}
			</span>
		</div>

		<!-- Progress -->
		<div class="mb-4">
			<div class="flex items-center justify-between text-sm mb-2">
				<span class="text-gray-600">Progress</span>
				<span class="text-gray-500">{responseCount}/7 questions</span>
			</div>
			<div class="progress-clean">
				<div class="progress-fill" style="width: {progressPercentage}%"></div>
			</div>
			<div class="text-right mt-1">
				<span class="text-xs text-gray-500">{progressPercentage}% complete</span>
			</div>
		</div>

		<!-- Scores -->
		{#if showScores && participant.preferenceScores}
			<div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
				<div class="text-center p-3 bg-blue-50 rounded-lg">
					<div class="text-lg font-bold text-blue-600">
						{participant.preferenceScores.collaboration?.toFixed(1) || '-'}
					</div>
					<div class="text-xs text-gray-600">Collaboration</div>
				</div>
				<div class="text-center p-3 bg-purple-50 rounded-lg">
					<div class="text-lg font-bold text-purple-600">
						{participant.preferenceScores.formality?.toFixed(1) || '-'}
					</div>
					<div class="text-xs text-gray-600">Formality</div>
				</div>
				<div class="text-center p-3 bg-green-50 rounded-lg">
					<div class="text-lg font-bold text-green-600">
						{participant.preferenceScores.tech?.toFixed(1) || '-'}
					</div>
					<div class="text-xs text-gray-600">Technology</div>
				</div>
				<div class="text-center p-3 bg-teal-50 rounded-lg">
					<div class="text-lg font-bold text-teal-600">
						{participant.preferenceScores.wellness?.toFixed(1) || '-'}
					</div>
					<div class="text-xs text-gray-600">Wellness</div>
				</div>
			</div>
		{/if}

		<!-- Actions -->
		{#if onDelete}
			<div class="flex justify-end pt-3 border-t border-gray-100">
				<Button
					variant="destructive"
					size="sm"
					onclick={() => onDelete?.(participant.id, participant.name)}
				>
					Delete Participant
				</Button>
			</div>
		{/if}
	{/snippet}
</Card>
