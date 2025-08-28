<script lang="ts">
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { getSessionStore } from '$lib/state/simple-session-store.svelte';
  import { Button, Card, ConfirmationDialog } from '$lib/components';

  // Import admin-specific components
  import SessionHeader from './SessionHeader.svelte';
  import StatsGrid from './StatsGrid.svelte';
  import ParticipantManager from './ParticipantManager.svelte';
  import AnalysisCharts from './AnalysisCharts.svelte';
  import InsightsPanel from './InsightsPanel.svelte';

  // Get simple session store for this session
  const sessionCode = page.params.code;

  // Validate session code format
  $effect(() => {
    if (!sessionCode || !/^[A-Z0-9]{6}$/.test(sessionCode)) {
      goto('/admin');
      return;
    }
  });

  const store = getSessionStore(sessionCode);

  // Dialog states
  let showEndDialog = $state(false);
  let showDeleteDialog = $state(false);
  let deleteTarget = $state<{ id: string; name: string } | null>(null);

  // Actions
  async function handleEndSession() {
    const result = await store.end();
    if (result.success) {
      showEndDialog = false;
      goto('/admin');
    }
  }

  function handleDeleteParticipant(id: string, name: string) {
    deleteTarget = { id, name };
    showDeleteDialog = true;
  }

  async function confirmDeleteParticipant() {
    if (!deleteTarget) return;

    const result = await store.removeParticipant(deleteTarget.id);
    if (result.success) {
      showDeleteDialog = false;
      deleteTarget = null;
    }
  }
</script>

<div class="min-h-screen bg-gray-50">
  <!-- Session Header -->
  <SessionHeader
    {store}
    onEndSession={() => showEndDialog = true}
  />

  <!-- Main Content -->
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Left Column - Stats and Participants -->
      <div class="lg:col-span-2 space-y-8">
        <!-- Stats Overview -->
        <StatsGrid {store} />

        <!-- Participant Management -->
        <ParticipantManager
          store={store}
          onDelete={handleDeleteParticipant}
        />
      </div>

      <!-- Right Column - Charts and Insights -->
      <div class="space-y-8">
        <!-- Analysis Charts -->
        <AnalysisCharts {store} />

        <!-- AI Insights -->
        <InsightsPanel {store} />
      </div>
    </div>
  </div>

  <!-- End Session Dialog -->
  <ConfirmationDialog
    bind:open={showEndDialog}
    title="End Session"
    message="Are you sure you want to end this session? This action cannot be undone."
    confirmText="End Session"
    onConfirm={handleEndSession}
  />

  <!-- Delete Participant Dialog -->
  <ConfirmationDialog
    bind:open={showDeleteDialog}
    title="Remove Participant"
    message={deleteTarget ? `Are you sure you want to remove ${deleteTarget.name} from this session?` : ''}
    confirmText="Remove"
    onConfirm={confirmDeleteParticipant}
  />
</div>