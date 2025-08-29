<!-- @migration-task Error while migrating Svelte code: Expected token >
https://svelte.dev/e/expected_token -->
<script lang="ts">
  import { cn } from '$lib/utils';
  import { fly, fade } from 'svelte/transition';
  import { flip } from 'svelte/animate';
  import { quintOut } from 'svelte/easing';
  
  interface Activity {
    id: string;
    participant: string;
    action: 'joined' | 'answered' | 'completed' | 'skipped';
    question?: number;
    timestamp: Date;
    avatar?: string;
  }
  
  interface LiveActivityFeedProps {
    activities: Activity[];
    maxItems?: number;
    class?: string;
  }
  
  let { 
    activities = [],
    maxItems = 5,
    class: className = ''
  }: LiveActivityFeedProps = $props();
  
  // Get recent activities
  const recentActivities = $derived(
    activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, maxItems)
  );
  
  // Action descriptions and colors
  const actionConfig = {
    joined: {
      text: 'joined the session',
      icon: '👋',
      color: 'from-blue-500 to-cyan-500'
    },
    answered: {
      text: 'answered question',
      icon: '✅',
      color: 'from-green-500 to-emerald-500'
    },
    completed: {
      text: 'completed the quiz',
      icon: '🎉',
      color: 'from-purple-500 to-pink-500'
    },
    skipped: {
      text: 'skipped question',
      icon: '⏭️',
      color: 'from-amber-500 to-orange-500'
    }
  };
  
  // Generate avatar initials
  function getInitials(name: string): string {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
  
  // Format timestamp
  function formatTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 10) return 'just now';
    if (seconds < 60) return `${seconds}s ago`;
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  }
</script>

<div class=mergeProps("space-y-3", className)}>
  <div class="flex items-center justify-between mb-4">
    <h3 class="text-sm font-semibold text-slate-300 flex items-center gap-2">
      <span class="relative">
        <span class="absolute -left-3 top-1/2 -translate-y-1/2 w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
        Live Activity
      </span>
    </h3>
    <span class="text-xs text-slate-500">
      {recentActivities.length} recent
    </span>
  </div>
  
  <div class="space-y-2">
    {#each recentActivities as activity (activity.id)}
      <div
        class="activity-feed-item"
        in:fly={{ x: -20, duration: 500, easing: quintOut }}
        out:fade={{ duration: 300 }}
        animate:flip={{ duration: 400 }}
      >
        <!-- Avatar -->
        <div class="relative">
          <div class="activity-avatar bg-gradient-to-br {actionConfig[activity.action].color}">
            {#if activity.avatar}
              <img src={activity.avatar} alt={activity.participant} class="w-full h-full rounded-full object-cover" />
            {:else}
              <span class="text-xs font-bold">
                {getInitials(activity.participant)}
              </span>
            {/if}
          </div>
          {#if activity.action === 'completed'}
            <div class="activity-pulse"></div>
          {/if}
        </div>
        
        <!-- Content -->
        <div class="flex-1 min-w-0">
          <div class="flex items-start justify-between gap-2">
            <div class="flex-1 min-w-0">
              <p class="text-sm">
                <span class="font-medium text-slate-200">{activity.participant}</span>
                <span class="text-slate-400 ml-1">
                  {actionConfig[activity.action].text}
                  {#if activity.question}
                    <span class="text-purple-400"> #{activity.question}</span>
                  {/if}
                </span>
              </p>
              <p class="text-xs text-slate-500 mt-0.5">
                {formatTime(activity.timestamp)}
              </p>
            </div>
            
            <!-- Action icon -->
            <span class="text-lg" title={actionConfig[activity.action].text}>
              {actionConfig[activity.action].icon}
            </span>
          </div>
        </div>
      </div>
    {/each}
    
    {#if recentActivities.length === 0}
      <div class="text-center py-8 text-slate-500">
        <div class="text-3xl mb-2">🎭</div>
        <p class="text-sm">Waiting for participants...</p>
      </div>
    {/if}
  </div>
</div>