<script lang="ts">
	import type { Participant } from '$lib/server/db/schema';

 	interface Props {
		participants: Participant[];
		onDelete?: (id: string, name: string) => void;
		onCopyLink?: (id: string) => void;
		showActions?: boolean;
		showProgress?: boolean;
		showStatus?: boolean;
		showGeneration?: boolean;
		emptyMessage?: string;
		totalQuestions?: number;
	}

	let {
		participants = [],
		onDelete,
		onCopyLink,
		showActions = true,
		showProgress = true,
		showStatus = true,
		showGeneration = true,
		emptyMessage = 'No participants yet.',
		totalQuestions = 10
	}: Props = $props();

	// Calculate progress percentage
	function getProgress(responses: Record<string, any> | undefined): number {
		const responseCount = Object.keys(responses || {}).length;
		return Math.round((responseCount / totalQuestions) * 100);
	}

	// Format score with proper decimal places
	function formatScore(score: number | undefined): string {
		return score !== undefined ? score.toFixed(1) : '-';
	}
</script>

<div class="w-full">
	{#if participants.length > 0}
		<div class="overflow-x-auto">
			<table class="w-full text-left">
				<thead>
					<tr class="border-b border-gray-200">
						<th class="px-4 py-3 text-gray-700 font-semibold">Name</th>
						{#if showGeneration}
							<th class="px-4 py-3 text-gray-700 font-semibold">Generation</th>
						{/if}
						{#if showProgress}
							<th class="px-4 py-3 text-gray-700 font-semibold">Progress</th>
						{/if}
						{#if showStatus}
							<th class="px-4 py-3 text-gray-700 font-semibold">Status</th>
						{/if}
						{#if showActions}
							<th class="px-4 py-3 text-gray-700 font-semibold">Actions</th>
						{/if}
					</tr>
				</thead>

				<tbody>
					{#each participants as participant (participant.id)}
						{@const progress = getProgress(participant.responses)}
						{@const responseCount = Object.keys(participant.responses || {}).length}
						<tr class="border-b border-gray-100 hover:bg-gray-50">
							<td class="px-4 py-4 font-medium text-gray-900">
								{participant.name || 'Anonymous'}
							</td>

							{#if showGeneration}
								<td class="px-4 py-4 text-sm text-gray-700">
									{participant.generation || '-'}
								</td>
							{/if}

							{#if showProgress}
								<td class="px-4 py-4">
									<div class="flex items-center gap-3">
										<span class="text-sm text-gray-600">{responseCount}/{totalQuestions}</span>
										<div class="w-20 h-2 bg-gray-200 rounded-full">
											<div class="bg-blue-500 h-full rounded-full transition-all" style="width: {progress}%"></div>
										</div>
									</div>
								</td>
							{/if}

							{#if showStatus}
								<td class="px-4 py-4">
									{#if participant.completed}
										<span class="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
											Completed
										</span>
									{:else}
										<span class="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
											In Progress
										</span>
									{/if}
								</td>
							{/if}

							{#if showActions}
								<td class="px-4 py-4">
									<div class="flex gap-2">
										{#if onCopyLink}
											<button
												onclick={() => onCopyLink(participant.id)}
												class="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
												title="Copy link"
												aria-label="Copy participant link"
											>
												<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
														d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
												</svg>
											</button>
										{/if}
										{#if onDelete}
											<button
												onclick={() => onDelete(participant.id, participant.name || 'Anonymous')}
												class="px-3 py-1 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded"
											>
												Delete
											</button>
										{/if}
									</div>
								</td>
							{/if}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{:else}
		<div class="text-center py-8">
			<p class="text-gray-500">{emptyMessage}</p>
		</div>
	{/if}
</div>

<style>
	@media (max-width: 768px) {
		table th,
		table td {
			padding: 0.5rem;
		}
	}
</style>