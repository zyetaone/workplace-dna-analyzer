<script lang="ts">
	import type { Participant } from '$lib/types';
	
	interface Props {
		participants: Participant[];
		onDelete?: (id: string, name: string) => void;
		onCopyLink?: (id: string) => void;
		showActions?: boolean;
		showProgress?: boolean;
		showStatus?: boolean;
		showGeneration?: boolean;
		showScores?: boolean;
		showId?: boolean;
		showLink?: boolean;
		emptyMessage?: string;
		className?: string;
	}
	
	let {
		participants = [],
		onDelete,
		onCopyLink,
		showActions = true,
		showProgress = true,
		showStatus = true,
		showGeneration = true,
		showScores = false,
		showId = true,
		showLink = true,
		emptyMessage = 'No participants yet.',
		className = ''
	}: Props = $props();
	
	// Calculate progress percentage
	function getProgress(responses: Record<number, any> | undefined): { count: number; percentage: number } {
		const responseCount = Object.keys(responses || {}).length;
		const totalQuestions = 7;
		return {
			count: responseCount,
			percentage: (responseCount / totalQuestions) * 100
		};
	}
	
	// Format score with proper decimal places
	function formatScore(score: number | undefined): string {
		return score !== undefined ? score.toFixed(1) : '-';
	}
	
	// Truncate ID for display
	function truncateId(id: string): string {
		return `${id.substring(0, 8)}...`;
	}
</script>

<div class="w-full {className}">
	{#if participants && participants.length > 0}
		<div class="overflow-x-auto">
			<table class="w-full text-left max-md:text-sm">
				<thead>
					<tr class="border-b border-gray-200">
						<th class="px-3 py-3 text-gray-700 font-semibold max-md:px-2 max-md:py-2">Name</th>
						{#if showId}
							<th class="px-3 py-3 text-gray-700 font-semibold max-md:px-2 max-md:py-2">ID</th>
						{/if}
						{#if showGeneration}
							<th class="px-3 py-3 text-gray-700 font-semibold max-md:px-2 max-md:py-2">Generation</th>
						{/if}
						{#if showProgress}
							<th class="px-3 py-3 text-gray-700 font-semibold max-md:px-2 max-md:py-2">Progress</th>
						{/if}
						{#if showStatus}
							<th class="px-3 py-3 text-gray-700 font-semibold max-md:px-2 max-md:py-2">Status</th>
						{/if}
						{#if showScores}
							<th class="px-3 py-3 text-gray-700 font-semibold max-md:px-2 max-md:py-2" colspan="4">Preference Scores</th>
						{/if}
						{#if showLink && onCopyLink}
							<th class="px-3 py-3 text-gray-700 font-semibold max-md:px-2 max-md:py-2">Link</th>
						{/if}
						{#if showActions && onDelete}
							<th class="px-3 py-3 text-gray-700 font-semibold max-md:px-2 max-md:py-2">Actions</th>
						{/if}
					</tr>
					{#if showScores}
						<tr class="border-b border-gray-100">
							<th class={showId ? 'max-md:px-2 max-md:py-2' : 'max-md:px-2 max-md:py-2'} colspan={showId ? 5 : 4}></th>
							<th class="px-2 py-2 text-xs text-gray-500 text-center max-md:px-2 max-md:py-2">Collab</th>
							<th class="px-2 py-2 text-xs text-gray-500 text-center max-md:px-2 max-md:py-2">Formal</th>
							<th class="px-2 py-2 text-xs text-gray-500 text-center max-md:px-2 max-md:py-2">Tech</th>
							<th class="px-2 py-2 text-xs text-gray-500 text-center max-md:px-2 max-md:py-2">Wellness</th>
							{#if (showLink && onCopyLink) || (showActions && onDelete)}
								<th class={ (showLink && onCopyLink ? 'max-md:px-2 max-md:py-2' : '') + (showActions && onDelete ? ' max-md:px-2 max-md:py-2' : '')} colspan={(showLink && onCopyLink ? 1 : 0) + (showActions && onDelete ? 1 : 0)}></th>
							{/if}
						</tr>
					{/if}
				</thead>
				
				{#snippet participantRow(participant: Participant)}
					{@const progress = getProgress(participant.responses)}
					<tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors">
						<!-- Name -->
						<td class="px-3 py-3 font-medium text-gray-900 max-md:px-2 max-md:py-2">
							{participant.name}
						</td>
						
						<!-- ID -->
						{#if showId}
							<td class="px-3 py-3 text-xs text-gray-500 font-mono max-md:px-2 max-md:py-2">
								{truncateId(participant.id)}
							</td>
						{/if}
						
						<!-- Generation -->
						{#if showGeneration}
							<td class="px-3 py-3 text-gray-700 max-md:px-2 max-md:py-2">
								{participant.generation || '-'}
							</td>
						{/if}
						
						<!-- Progress -->
						{#if showProgress}
							<td class="px-3 py-3 max-md:px-2 max-md:py-2">
								<div class="flex items-center gap-3">
									<span class="text-sm text-gray-600 min-w-[3rem]">
										{progress.count} / 7
									</span>
									<div class="w-20 bg-gray-200 rounded-full h-2">
										<div 
											class="bg-gradient-to-r from-gray-500 to-gray-600 h-2 rounded-full transition-all duration-300"
											style="width: {progress.percentage}%"
										></div>
									</div>
								</div>
							</td>
						{/if}
						
						<!-- Status -->
						{#if showStatus}
							<td class="px-3 py-3 max-md:px-2 max-md:py-2">
								{#if participant.completed}
									<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
										Completed
									</span>
								{:else}
									<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
										In Progress
									</span>
								{/if}
							</td>
						{/if}
						
						<!-- Preference Scores -->
						{#if showScores}
							<td class="px-2 py-3 text-center text-sm font-medium text-blue-600 max-md:px-2 max-md:py-2">
								{formatScore(participant.preferenceScores?.collaboration)}
							</td>
							<td class="px-2 py-3 text-center text-sm font-medium text-amber-600 max-md:px-2 max-md:py-2">
								{formatScore(participant.preferenceScores?.formality)}
							</td>
							<td class="px-2 py-3 text-center text-sm font-medium text-green-600 max-md:px-2 max-md:py-2">
								{formatScore(participant.preferenceScores?.tech)}
							</td>
							<td class="px-2 py-3 text-center text-sm font-medium text-red-600 max-md:px-2 max-md:py-2">
								{formatScore(participant.preferenceScores?.wellness)}
							</td>
						{/if}
						
						<!-- Copy Link -->
						{#if showLink && onCopyLink}
							<td class="px-3 py-3 max-md:px-2 max-md:py-2">
								<button
									onclick={() => onCopyLink?.(participant.id)}
									class="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
									title="Copy participant link"
									aria-label="Copy participant link"
								>
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
											d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
									</svg>
								</button>
							</td>
						{/if}
						
						<!-- Actions -->
						{#if showActions && onDelete}
							<td class="px-3 py-3 max-md:px-2 max-md:py-2">
								<button
									onclick={() => onDelete?.(participant.id, participant.name)}
									class="px-3 py-1.5 bg-red-500 text-white text-sm font-medium rounded hover:bg-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
									title="Delete participant"
									aria-label="Delete {participant.name}"
								>
									Delete
								</button>
							</td>
						{/if}
					</tr>
				{/snippet}
				
				<tbody>
					{#each participants as participant (participant.id)}
						{@render participantRow(participant)}
					{/each}
				</tbody>
			</table>
		</div>
	{:else}
		<!-- Empty State -->
		<div class="text-center py-12">
			<svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
					d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
			</svg>
			<p class="mt-4 text-gray-500">{emptyMessage}</p>
		</div>
	{/if}
</div>
