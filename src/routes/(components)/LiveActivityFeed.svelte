<script lang="ts">
  import { fly } from 'svelte/transition';

  interface Activity {
    id: string;
    participant: string;
    action: 'joined' | 'answered' | 'completed' | 'skipped';
    timestamp: Date;
    question?: number;
  }

  interface LiveActivityFeedProps {
    activities?: Activity[];
    maxItems?: number;
  }

  let { activities = [], maxItems = 10 }: LiveActivityFeedProps = $props();

  // Sort activities by timestamp (newest first)
  const sortedActivities = $derived(
    [...activities]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, maxItems)
  );

  // Format relative time
  function formatTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (seconds < 60) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  }

  // Get action icon and color
  function getActionInfo(action: Activity['action']) {
    switch (action) {
      case 'joined':
        return { icon: '👋', color: 'text-green-400', bgColor: 'bg-green-500/10' };
      case 'answered':
        return { icon: '✅', color: 'text-blue-400', bgColor: 'bg-blue-500/10' };
      case 'completed':
        return { icon: '🎉', color: 'text-purple-400', bgColor: 'bg-purple-500/10' };
      case 'skipped':
        return { icon: '⏭️', color: 'text-yellow-400', bgColor: 'bg-yellow-500/10' };
      default:
        return { icon: '📝', color: 'text-gray-400', bgColor: 'bg-gray-500/10' };
    }
  }

  // Get action text
  function getActionText(activity: Activity): string {
    switch (activity.action) {
      case 'joined':
        return 'joined the session';
      case 'answered':
        return `answered question ${activity.question}`;
      case 'completed':
        return 'completed the quiz';
      case 'skipped':
        return `skipped question ${activity.question}`;
      default:
        return 'performed an action';
    }
  }
</script>

<div class="bg-slate-800/30 backdrop-blur-sm rounded-xl border border-slate-600/30 p-4">
  <div class="flex items-center justify-between mb-4">
    <h3 class="text-lg font-semibold text-slate-200 flex items-center gap-2">
      <svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
      </svg>
      Live Activity
    </h3>
    <div class="flex items-center gap-2">
      <div class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
      <span class="text-xs text-green-400 font-medium">Live</span>
    </div>
  </div>

  <div class="space-y-3 max-h-80 overflow-y-auto">
    {#each sortedActivities as activity, index (activity.id)}
      {@const actionInfo = getActionInfo(activity.action)}
      <div
        class="flex items-start gap-3 p-3 rounded-lg {actionInfo.bgColor} border border-slate-600/20 transition-all duration-300 hover:scale-[1.02]"
        in:fly={{ x: -20, delay: index * 50, duration: 400 }}
      >
        <div class="flex-shrink-0 w-8 h-8 rounded-full bg-slate-700/50 flex items-center justify-center text-sm">
          {actionInfo.icon}
        </div>

        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between">
            <p class="text-sm text-slate-200 font-medium truncate">
              {activity.participant}
            </p>
            <span class="text-xs text-slate-400 flex-shrink-0 ml-2">
              {formatTime(activity.timestamp)}
            </span>
          </div>
          <p class="text-xs text-slate-400 mt-1">
            {getActionText(activity)}
          </p>
        </div>
      </div>
    {/each}

    {#if sortedActivities.length === 0}
      <div class="text-center py-8">
        <div class="text-3xl mb-2">📊</div>
        <p class="text-slate-400 text-sm">No activity yet</p>
        <p class="text-slate-500 text-xs mt-1">Activity will appear here as participants join and answer questions</p>
      </div>
    {/if}
  </div>
</div>