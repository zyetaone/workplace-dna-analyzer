<!-- @migration-task Error while migrating Svelte code: Expected token >
https://svelte.dev/e/expected_token -->
<script lang="ts">
  import { cn } from '$lib/utils';
  import { fly, scale } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  
  interface StatsCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
    icon?: string;
    color?: 'purple' | 'blue' | 'green' | 'pink' | 'amber';
    loading?: boolean;
    animate?: boolean;
    class?: string;
  }
  
  let { 
    title,
    value,
    subtitle,
    trend,
    trendValue,
    icon,
    color = 'purple',
    loading = false,
    animate = true,
    class: className = ''
  }: StatsCardProps = $props();
  
  const colorSchemes = {
    purple: 'from-purple-500 to-pink-500',
    blue: 'from-blue-500 to-cyan-500',
    green: 'from-green-500 to-emerald-500',
    pink: 'from-pink-500 to-rose-500',
    amber: 'from-amber-500 to-orange-500'
  };
  
  const trendIcons = {
    up: '↗',
    down: '↘',
    neutral: '→'
  };

  // Animated counter effect
  let displayValue = $state(loading ? '...' : value);
  
  $effect(() => {
    if (animate && typeof value === 'number' && !loading) {
      const start = 0;
      const end = value;
      const duration = 1500;
      const startTime = Date.now();
      
      const updateCounter = () => {
        const now = Date.now();
        const progress = Math.min((now - startTime) / duration, 1);
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const current = Math.round(start + (end - start) * easeOutQuart);
        
        displayValue = current.toString();
        
        if (progress < 1) {
          requestAnimationFrame(updateCounter);
        }
      };
      
      requestAnimationFrame(updateCounter);
    } else {
      displayValue = loading ? '...' : value.toString();
    }
  });
</script>

<div 
  class=mergeProps(
    "stats-card-premium relative group",
    className
  )}
  in:fly={{ y: 20, duration: 500, easing: quintOut }}
>
  <!-- Background gradient effect -->
  <div class="absolute inset-0 rounded-2xl bg-gradient-to-br {colorSchemes[color]} opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>
  
  <!-- Card content -->
  <div class="relative z-10">
    <!-- Header -->
    <div class="flex items-start justify-between mb-4">
      <div class="flex items-center gap-3">
        {#if icon}
          <div class="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br {colorSchemes[color]} bg-opacity-20 backdrop-blur-sm flex items-center justify-center text-xl">
            {icon}
          </div>
        {/if}
        <div>
          <h3 class="text-sm font-medium text-slate-400">{title}</h3>
          {#if subtitle}
            <p class="text-xs text-slate-500 mt-0.5">{subtitle}</p>
          {/if}
        </div>
      </div>
      
      {#if trend && trendValue}
        <div class=mergeProps(
          "flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium",
          trend === 'up' && "bg-green-500/10 text-green-400",
          trend === 'down' && "bg-red-500/10 text-red-400",
          trend === 'neutral' && "bg-slate-500/10 text-slate-400"
        )}>
          <span>{trendIcons[trend]}</span>
          <span>{trendValue}</span>
        </div>
      {/if}
    </div>
    
    <!-- Value display -->
    <div class="flex items-baseline gap-2">
      {#if loading}
        <div class="h-10 w-24 skeleton rounded-lg"></div>
      {:else}
        <div 
          class="stats-number text-4xl font-bold bg-gradient-to-br {colorSchemes[color]}"
          style="-webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;"
        >
          {displayValue}
        </div>
      {/if}
    </div>
    
    <!-- Progress bar (optional) -->
    {#if typeof value === 'number' && !loading}
      <div class="mt-4 h-1 bg-slate-700 rounded-full overflow-hidden">
        <div 
          class="h-full bg-gradient-to-r {colorSchemes[color]} rounded-full transition-all duration-1000 ease-out"
          style="width: {Math.min(value, 100)}%"
        ></div>
      </div>
    {/if}
  </div>
  
  <!-- Decorative elements -->
  <div class="absolute -top-1 -right-1 w-20 h-20 bg-gradient-to-br {colorSchemes[color]} opacity-5 rounded-full blur-2xl"></div>
  <div class="absolute -bottom-1 -left-1 w-16 h-16 bg-gradient-to-br {colorSchemes[color]} opacity-5 rounded-full blur-xl"></div>
</div>