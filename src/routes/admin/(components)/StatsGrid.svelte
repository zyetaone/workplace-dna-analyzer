<script lang="ts">
  import Card from "$lib/components/ui/Card.svelte";
  import Tooltip from "$lib/components/ui/Tooltip.svelte";
  import type { getSessionStore } from "../admin.svelte.ts";

  interface StatsGridProps {
    store: ReturnType<typeof getSessionStore>;
  }

  let { store }: StatsGridProps = $props();

  const analytics = $derived(store.analytics());

  // Stats data with icons and colors
  const stats = $derived([
    {
      label: "Total",
      value: (analytics.totalCount || 0).toString(),
      color: "text-blue-600",
      tooltip: "Total number of participants who joined"
    },
    {
      label: "Completed",
      value: (analytics.completedCount || 0).toString(),
      color: "text-green-600",
      tooltip: "Participants who completed the quiz"
    },
    {
      label: "In Progress",
      value: (analytics.activeCount || 0).toString(),
      color: "text-amber-600",
      tooltip: "Participants currently taking the quiz"
    },
    {
      label: "Response Rate",
      value: `${analytics.responseRate || 0}%`,
      color: "text-purple-600",
      tooltip: "Percentage of participants who completed the quiz"
    }
  ]);
</script>

<Card variant="stats">
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
    <div class="bg-gray-200 rounded-full h-2.5">
      <div class="bg-gradient-to-r from-cyan-500 to-purple-600 h-2.5 rounded-full" style="width: {analytics.responseRate}%"></div>
    </div>

    {#if analytics.totalCount > 0}
      <div class="text-center mt-2">
        <span class="text-sm text-gray-600">
          {analytics.completedCount} of {analytics.totalCount} completed ({analytics.responseRate}%)
        </span>
      </div>
    {:else}
      <div class="text-center mt-2">
        <span class="text-sm text-gray-500">Waiting for participants to join...</span>
      </div>
    {/if}
  {/snippet}
</Card>