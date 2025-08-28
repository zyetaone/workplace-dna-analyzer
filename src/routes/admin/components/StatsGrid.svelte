<!--
StatsGrid - Clean Card-Based Layout
-->
<script lang="ts">
  import Card from "$lib/components/ui/Card.svelte";
  import Tooltip from "$lib/components/ui/Tooltip.svelte";
  import type { SimpleSessionStore } from "$lib/state/simple-session-store.svelte";

  interface StatsGridProps {
    store: SimpleSessionStore;
  }

  let { store }: StatsGridProps = $props();

  // Calculate average time for completed participants
  const avgTime = $derived.by(() => {
    if (!store.participants || store.participants.length === 0) return "N/A";
    const completed = store.participants.filter(p => p.completed && p.completedAt && p.joinedAt);
    if (completed.length === 0) return "N/A";

    const times = completed.map(p => {
      const start = new Date(p.joinedAt).getTime();
      const end = new Date(p.completedAt!).getTime();
      return end - start;
    });

    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const minutes = Math.floor(avg / 60000);
    const seconds = Math.floor((avg % 60000) / 1000);

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  });

  // Stats data with icons and colors
  const stats = $derived(() => [
    {
      label: "Total",
      value: store.participants?.length || 0,
      color: "text-blue-600",
      tooltip: "Total number of participants who joined"
    },
    {
      label: "Completed",
      value: store.stats?.completed || 0,
      color: "text-green-600",
      tooltip: "Participants who completed the quiz"
    },
    {
      label: "In Progress",
      value: Math.max(0, (store.stats?.total || 0) - (store.stats?.completed || 0)),
      color: "text-amber-600",
      tooltip: "Participants currently taking the quiz"
    },
    {
      label: "Avg Time",
      value: avgTime,
      color: "text-purple-600",
      tooltip: "Average time to complete the quiz"
    }
  ]);
</script>

<Card variant="stats" class="mb-6">
  {#snippet children()}
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
      {#each stats as stat}
        <Tooltip content={stat.tooltip}>
          <div class="text-center cursor-help p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <div class="text-2xl font-bold {stat.color}">{stat.value}</div>
            <div class="text-sm text-gray-600 font-medium">{stat.label}</div>
          </div>
        </Tooltip>
      {/each}
    </div>

    <!-- Progress Bar -->
    <div class="progress-clean">
      <div class="progress-fill" style="width: {store.participants?.length ? ((store.stats?.completed || 0) / store.participants.length) * 100 : 0}%"></div>
    </div>

    {#if store.participants?.length}
      <div class="text-center mt-2">
        <span class="text-sm text-gray-600">
          {store.stats?.completed || 0} of {store.participants.length} completed
        </span>
      </div>
    {:else}
      <div class="text-center mt-2">
        <span class="text-sm text-gray-500">Waiting for participants to join...</span>
      </div>
    {/if}
  {/snippet}
</Card>