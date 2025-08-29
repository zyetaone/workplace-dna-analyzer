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

<div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
  <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
    {#each stats as stat}
      <Tooltip content={stat.tooltip}>
        <div class="bg-gray-50 p-4 rounded-xl border border-gray-100 hover:bg-gray-100 hover:border-gray-200 transition-all cursor-help">
          <div class="text-3xl font-bold {stat.color} mb-1">{stat.value}</div>
          <div class="text-xs text-gray-600 font-medium uppercase tracking-wide">{stat.label}</div>
        </div>
      </Tooltip>
    {/each}
  </div>

  <!-- Enhanced Progress Bar -->
  <div class="relative">
    <div class="flex justify-between text-xs text-gray-600 mb-2">
      <span>Completion Progress</span>
      <span class="font-semibold">{analytics.responseRate}%</span>
    </div>
    <div class="bg-gray-200 rounded-full h-3 overflow-hidden">
      <div class="bg-gradient-to-r from-purple-500 to-purple-600 h-full rounded-full transition-all duration-500 relative" style="width: {analytics.responseRate}%">
        <div class="absolute inset-0 bg-white opacity-20 animate-pulse"></div>
      </div>
    </div>
  </div>

  {#if analytics.totalCount > 0}
    <div class="flex items-center justify-center mt-4 text-sm">
      <div class="flex items-center gap-4">
        <span class="text-gray-600">
          <span class="font-semibold text-gray-800">{analytics.completedCount}</span> of <span class="font-semibold text-gray-800">{analytics.totalCount}</span> completed
        </span>
        <div class="h-4 w-px bg-gray-300"></div>
        <span class="text-purple-600 font-semibold">
          {analytics.responseRate}% response rate
        </span>
      </div>
    </div>
  {:else}
    <div class="text-center mt-4 py-3 bg-amber-50 rounded-lg border border-amber-200">
      <span class="text-sm text-amber-700 font-medium">Waiting for participants to join...</span>
    </div>
  {/if}
</div>