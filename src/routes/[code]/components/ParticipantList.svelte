<script lang="ts">
	import type { Participant } from '$lib/types';
	
	interface Props {
		participants: Participant[];
		onDelete?: (id: string, name: string) => void;
		showActions?: boolean;
		showProgress?: boolean;
		showStatus?: boolean;
		showGeneration?: boolean;
		showScores?: boolean;
	}
	
	let {
		participants = [],
		onDelete,
		showActions = false,
		showProgress = true,
		showStatus = true,
		showGeneration = true,
		showScores = false
	}: Props = $props();
	
	function getProgress(responses: Record<number, any> | undefined): number {
		const responseCount = Object.keys(responses || {}).length;
		return Math.round((responseCount / 7) * 100);
	}
</script>

<div class="w-full">
	{#if participants.length > 0}
		<div class="overflow-x-auto">
			<table class="min-w-full divide-y divide-gray-200">
				<thead class="bg-gray-50">
					<tr>
						<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
						{#if showGeneration}
							<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Generation</th>
						{/if}
						{#if showProgress}
							<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
						{/if}
						{#if showStatus}
							<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
						{/if}
						{#if showScores}
							<th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Collab</th>
							<th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Formal</th>
							<th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Tech</th>
							<th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Wellness</th>
						{/if}
						{#if showActions && onDelete}
							<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
						{/if}
					</tr>
				</thead>
				
				<tbody class="bg-white divide-y divide-gray-200">
					{#each participants as participant (participant.id)}
						{@const progress = getProgress(participant.responses)}
						{@const responseCount = Object.keys(participant.responses || {}).length}
						<tr class="hover:bg-gray-50">
							<td class="px-4 py-4 font-medium text-gray-900">
								{participant.name}
							</td>
							
							{#if showGeneration}
								<td class="px-4 py-4 text-sm text-gray-700">
									{participant.generation || '-'}
								</td>
							{/if}
							
							{#if showProgress}
								<td class="px-4 py-4">
									<div class="flex items-center gap-2">
										<span class="text-sm text-gray-600">{responseCount}/7</span>
										<div class="w-16 h-2 bg-gray-200 rounded-full">
											<div class="bg-blue-500 h-full rounded-full transition-all" style="width: {progress}%"></div>
										</div>
									</div>
								</td>
							{/if}
							
							{#if showStatus}
								<td class="px-4 py-4">
									{#if participant.completed}
										<span class="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
											Completed
										</span>
									{:else}
										<span class="inline-flex px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
											In Progress
										</span>
									{/if}
								</td>
							{/if}
							
							{#if showScores}
								<td class="px-4 py-4 text-sm text-center font-medium text-blue-600">
									{participant.preferenceScores?.collaboration?.toFixed(1) || '-'}
								</td>
								<td class="px-4 py-4 text-sm text-center font-medium text-purple-600">
									{participant.preferenceScores?.formality?.toFixed(1) || '-'}
								</td>
								<td class="px-4 py-4 text-sm text-center font-medium text-green-600">
									{participant.preferenceScores?.tech?.toFixed(1) || '-'}
								</td>
								<td class="px-4 py-4 text-sm text-center font-medium text-teal-600">
									{participant.preferenceScores?.wellness?.toFixed(1) || '-'}
								</td>
							{/if}
							
							{#if showActions && onDelete}
								<td class="px-4 py-4">
									<button
										class="px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded"
										onclick={() => onDelete?.(participant.id, participant.name)}
									>
										Delete
									</button>
								</td>
							{/if}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{:else}
		<div class="text-center py-8">
			<p class="text-gray-500">No participants yet.</p>
		</div>
	{/if}
</div>
