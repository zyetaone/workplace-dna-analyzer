<script lang="ts">
  import StatsCardPremium from '$lib/components/ui/StatsCardPremium.svelte';
  import { fly } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  
  interface StatsGridProps {
    store: any;
    class?: string;
  }
  
  let { store, class: className = '' }: StatsGridProps = $props();
  
  // Calculate real-time stats
  const stats = $derived({
    active: store.participants?.filter((p: any) => !p.completed).length || 0,
    completed: store.participants?.filter((p: any) => p.completed).length || 0,
    completionRate: store.participants?.length 
      ? Math.round((store.participants.filter((p: any) => p.completed).length / store.participants.length) * 100)
      : 0,
    avgScore: store.participants?.filter((p: any) => p.completed).length
      ? Math.round(
          store.participants
            .filter((p: any) => p.completed && p.preferenceScores)
            .reduce((sum: number, p: any) => {
              const scores = Object.values(p.preferenceScores || {}) as number[];
              return sum + (scores.reduce((a, b) => a + b, 0) / scores.length);
            }, 0) / store.participants.filter((p: any) => p.completed).length
        )
      : 0
  });
  
  // Calculate trends (mock data for demo)
  const trends = {
    active: { direction: 'up' as const, value: '+3' },
    completed: { direction: 'up' as const, value: '+12%' },
    completionRate: { direction: stats.completionRate > 50 ? 'up' as const : 'down' as const, value: `${stats.completionRate > 50 ? '+' : '-'}5%` },
    avgScore: { direction: 'neutral' as const, value: '±0' }
  };
</script>

<div class={className}>
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
    <div in:fly={{ y: 20, duration: 500, easing: quintOut }}>
      <StatsCardPremium
        title="Active Now"
        value={stats.active}
        subtitle="Currently taking quiz"
        icon="🎯"
        color="green"
        trend={trends.active.direction}
        trendValue={trends.active.value}
        animate={true}
      />
    </div>
    
    <div in:fly={{ y: 20, delay: 100, duration: 500, easing: quintOut }}>
      <StatsCardPremium
        title="Completed"
        value={stats.completed}
        subtitle="Finished quiz"
        icon="✅"
        color="purple"
        trend={trends.completed.direction}
        trendValue={trends.completed.value}
        animate={true}
      />
    </div>
    
    <div in:fly={{ y: 20, delay: 200, duration: 500, easing: quintOut }}>
      <StatsCardPremium
        title="Completion Rate"
        value={`${stats.completionRate}%`}
        subtitle="Success rate"
        icon="📊"
        color="blue"
        trend={trends.completionRate.direction}
        trendValue={trends.completionRate.value}
      />
    </div>
    
    <div in:fly={{ y: 20, delay: 300, duration: 500, easing: quintOut }}>
      <StatsCardPremium
        title="Avg Score"
        value={`${stats.avgScore}%`}
        subtitle="Preference alignment"
        icon="⭐"
        color="amber"
        trend={trends.avgScore.direction}
        trendValue={trends.avgScore.value}
      />
    </div>
  </div>
  
  <!-- Live Activity Indicator -->
  <div class="mt-6 p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="relative">
          <div class="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
          <div class="absolute inset-0 w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
        </div>
        <span class="text-sm font-medium text-green-400">
          Session Active • {stats.active} participants online
        </span>
      </div>
      <span class="text-xs text-slate-400">
        Auto-refresh enabled
      </span>
    </div>
  </div>
</div>