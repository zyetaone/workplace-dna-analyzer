<script lang="ts">
	import { Card, Button } from '$lib/components/ui';
	import type { getSessionStore } from '../admin.svelte.ts';

	interface ParticipantManagerProps {
		store: ReturnType<typeof getSessionStore>;
		onDelete: (id: string, name: string) => void;
		totalQuestions?: number;
	}

	let { store, onDelete, totalQuestions = 10 }: ParticipantManagerProps = $props();
</script>

<Card variant="participant">
	{#snippet children()}
		<div class="p-6">
			<h2 class="mb-4 text-xl font-semibold">Participants</h2>
			{#if store.participants && store.participants.length > 0}
				<div class="space-y-2">
					{#each store.participants as participant}
						<div
							class="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4"
						>
							<div class="flex items-center gap-4">
								<div>
									<div class="font-medium">{participant.name || 'Anonymous'}</div>
									{#if participant.generation}
										<div class="text-sm text-gray-500">{participant.generation}</div>
									{/if}
								</div>
								{#if participant.completed}
									<span
										class="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800"
									>
										Completed
									</span>
								{:else}
									<span
										class="rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800"
									>
										In Progress
									</span>
								{/if}
							</div>
							{#if onDelete}
								<button
									onclick={() => onDelete(participant.id, participant.name || 'Anonymous')}
									class="text-red-600 hover:text-red-800"
									type="button"
								>
									Remove
								</button>
							{/if}
						</div>
					{/each}
				</div>
			{:else}
				<div class="py-12 text-center">
					<div
						class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100"
					>
						<svg
							class="h-8 w-8 text-gray-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
							/>
						</svg>
					</div>
					<h3 class="mb-2 text-lg font-medium text-gray-800">No Participants Yet</h3>
					<p class="text-gray-600">Share the session code to get started!</p>
				</div>
			{/if}
		</div>
	{/snippet}
</Card>

<style></style>
