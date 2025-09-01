<script lang="ts">
	import { Card, Button, StatusIndicator } from '$lib/components';

	interface Participant {
		id: string;
		name: string;
		generation?: string;
		completed: boolean;
		joinedAt: string;
		responses?: number;
	}

	interface ParticipantListProps {
		participants: Participant[];
		onDelete?: (id: string, name: string) => void;
		showActions?: boolean;
		showProgress?: boolean;
		showStatus?: boolean;
		showGeneration?: boolean;
		totalQuestions?: number;
	}

	let {
		participants = [],
		onDelete,
		showActions = false,
		showProgress = false,
		showStatus = true,
		showGeneration = false,
		totalQuestions = 10
	}: ParticipantListProps = $props();

	function getProgressPercentage(participant: Participant): number {
		if (!showProgress || !participant.responses) return 0;
		return Math.round((participant.responses / totalQuestions) * 100);
	}

	function formatJoinTime(joinedAt: string): string {
		try {
			const date = new Date(joinedAt);
			const now = new Date();
			const diffMs = now.getTime() - date.getTime();
			const diffMins = Math.floor(diffMs / (1000 * 60));

			if (diffMins < 1) return 'Just now';
			if (diffMins < 60) return `${diffMins}m ago`;

			const diffHours = Math.floor(diffMins / 60);
			if (diffHours < 24) return `${diffHours}h ago`;

			const diffDays = Math.floor(diffHours / 24);
			return `${diffDays}d ago`;
		} catch {
			return 'Unknown';
		}
	}
</script>

<div class="space-y-3">
	{#each participants as participant (participant.id)}
		<Card variant="default" class="transition-colors hover:bg-slate-800/50">
			{#snippet children()}
				<div class="p-4">
					<div class="flex items-center justify-between">
						<div class="flex flex-1 items-center gap-3">
							<!-- Avatar -->
							<div
								class="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-pink-500 font-semibold text-white"
							>
								{participant.name.charAt(0).toUpperCase()}
							</div>

							<!-- Participant Info -->
							<div class="flex-1">
								<div class="flex items-center gap-2">
									<h3 class="font-medium text-slate-200">{participant.name}</h3>
									{#if showStatus}
										<StatusIndicator
											status={participant.completed ? 'success' : 'active'}
											size="sm"
										/>
									{/if}
								</div>

								<div class="mt-1 flex items-center gap-3 text-sm text-slate-400">
									{#if showGeneration && participant.generation}
										<span>{participant.generation}</span>
									{/if}
									<span>{formatJoinTime(participant.joinedAt)}</span>
								</div>

								{#if showProgress}
									<div class="mt-2">
										<div class="mb-1 flex items-center justify-between text-xs text-slate-400">
											<span>Progress</span>
											<span>{getProgressPercentage(participant)}%</span>
										</div>
										<div class="h-2 w-full rounded-full bg-slate-700">
											<div
												class="h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
												style="width: {getProgressPercentage(participant)}%"
											></div>
										</div>
									</div>
								{/if}
							</div>
						</div>

						<!-- Actions -->
						{#if showActions && onDelete}
							<div class="flex items-center gap-2">
								<Button
									size="sm"
									variant="ghost"
									onclick={() => onDelete(participant.id, participant.name)}
									class="text-red-400 hover:bg-red-500/10 hover:text-red-300"
								>
									<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
										></path>
									</svg>
								</Button>
							</div>
						{/if}
					</div>
				</div>
			{/snippet}
		</Card>
	{:else}
		<div class="text-center py-8">
			<div
				class="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center"
			>
				<svg class="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
					></path>
				</svg>
			</div>
			<h3 class="text-lg font-medium text-slate-300 mb-2">No Participants Yet</h3>
			<p class="text-slate-400">Participants will appear here once they join the session.</p>
		</div>
	{/each}
</div>
