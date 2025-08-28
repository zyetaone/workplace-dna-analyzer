<!--
ParticipantManager - Enhanced with Live Feed & Better UX
-->
<script lang="ts">
  import Card from "$lib/components/ui/Card.svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import { Dialog } from 'bits-ui';
  import { ParticipantList } from "$lib/components";
  import type { SimpleSessionStore } from "$lib/state/simple-session-store.svelte";

  interface ParticipantManagerProps {
    store: SimpleSessionStore;
    onDelete: (id: string, name: string) => void;
  }

  let { store, onDelete }: ParticipantManagerProps = $props();
  let showParticipantsModal = $state(false);

  // Live participant stats
  const participantStats = $derived(() => {
    const participants = store.participants || [];
    const completed = store.stats?.completed || 0;
    const inProgress = Math.max(0, (store.stats?.total || 0) - completed);

    return {
      total: participants.length,
      completed,
      inProgress,
      completionRate: participants.length > 0 ? Math.round((completed / participants.length) * 100) : 0
    };
  });

  // Recent participants (last 5)
  const recentParticipants = $derived(() => {
    const participants = store.participants || [];
    return participants
      .sort((a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime())
      .slice(0, 5);
  });
</script>

<Card variant="elevated" class="mb-6">
  {#snippet children()}
    <!-- Stats Overview -->
    <div class="grid grid-cols-3 gap-4 mb-6">
      <div class="text-center p-3 bg-blue-50 rounded-lg">
        <div class="text-2xl font-bold text-blue-600">{participantStats.total}</div>
        <div class="text-sm text-gray-600">Total</div>
      </div>
      <div class="text-center p-3 bg-green-50 rounded-lg">
        <div class="text-2xl font-bold text-green-600">{participantStats.completed}</div>
        <div class="text-sm text-gray-600">Completed</div>
      </div>
      <div class="text-center p-3 bg-amber-50 rounded-lg">
        <div class="text-2xl font-bold text-amber-600">{participantStats.inProgress}</div>
        <div class="text-sm text-gray-600">In Progress</div>
      </div>
    </div>

    <!-- Recent Participants Preview -->
    {#if recentParticipants.length > 0}
      <div class="mb-4">
        <h4 class="text-sm font-medium text-gray-700 mb-3">Recent Participants</h4>
        <div class="space-y-2">
          {#each recentParticipants as participant}
            <div class="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span class="text-sm font-medium text-blue-600">
                    {participant.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <div class="text-sm font-medium text-gray-800">{participant.name}</div>
                  {#if participant.generation}
                    <div class="text-xs text-gray-500">{participant.generation}</div>
                  {/if}
                </div>
              </div>
              <div class="flex items-center gap-2">
                <span class="px-2 py-1 text-xs rounded-full {participant.completed ? 'status-active' : 'status-pending'}">
                  {participant.completed ? 'Done' : 'Active'}
                </span>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- View All Button -->
    <div class="flex justify-center">
      <Button
        onclick={() => showParticipantsModal = true}
        variant="outline"
      >
        View All Participants ({participantStats.total})
      </Button>
    </div>
  {/snippet}
</Card>

<!-- Enhanced Participants Dialog -->
<Dialog bind:open={showParticipantsModal}>
  {#snippet title()}
    <div class="flex items-center gap-2">
      <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
      </svg>
      Session Participants
    </div>
  {/snippet}

  {#snippet description()}
    View and manage all session participants
  {/snippet}

  {#snippet content()}
    <div class="max-h-[70vh] overflow-y-auto">
      {#if store.participants && store.participants.length > 0}
        <!-- Stats Header -->
        <div class="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-lg">
          <div class="grid grid-cols-4 gap-4 text-center">
            <div>
              <div class="text-lg font-bold text-blue-600">{participantStats.total}</div>
              <div class="text-xs text-gray-600">Total</div>
            </div>
            <div>
              <div class="text-lg font-bold text-green-600">{participantStats.completed}</div>
              <div class="text-xs text-gray-600">Completed</div>
            </div>
            <div>
              <div class="text-lg font-bold text-amber-600">{participantStats.inProgress}</div>
              <div class="text-xs text-gray-600">In Progress</div>
            </div>
            <div>
              <div class="text-lg font-bold text-purple-600">{participantStats.completionRate}%</div>
              <div class="text-xs text-gray-600">Completion</div>
            </div>
          </div>
          <Button
            onclick={async () => { await store.refresh(); }}
            variant="outline"
            size="sm"
          >
            ↻ Refresh
          </Button>
        </div>

        <!-- Participants List -->
        <div class="border border-gray-200 rounded-lg overflow-hidden">
          <ParticipantList
            participants={store.participants}
            onDelete={onDelete}
            showActions={true}
            showProgress={true}
            showStatus={true}
            showGeneration={true}
            showScores={true}
          />
        </div>
      {:else}
        <div class="text-center py-12">
          <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
          </div>
          <h3 class="text-lg font-medium text-gray-800 mb-2">No Participants Yet</h3>
          <p class="text-gray-600">Share the session code to get started!</p>
        </div>
      {/if}
    </div>
  {/snippet}
</Dialog>