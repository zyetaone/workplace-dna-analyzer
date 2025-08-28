<script lang="ts">
  import { fade, fly } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import type { SimpleSessionStore } from '$lib/state/simple-session-store.svelte';

  interface LiveStatsSectionProps {
    store: SimpleSessionStore;
  }

  let { store }: LiveStatsSectionProps = $props();

  // Animated counter values and change indicators
  let animatedActiveCount = $state(0);
  let animatedCompletedCount = $state(0);
  let animatedCompletionRate = $state(0);
  
  // Change indicators for visual feedback
  let activeChanged = $state(false);
  let completedChanged = $state(false);
  let rateChanged = $state(false);

  // Update animated values when store changes
  $effect(() => {
    const active = store.participants?.filter(p => !p.completed).length || 0;
    const completed = store.participants?.filter(p => p.completed).length || 0;
    const total = store.participants?.length || 0;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Animate to new values
    animateValue(animatedActiveCount, active, 'active');
    animateValue(animatedCompletedCount, completed, 'completed');
    animateValue(animatedCompletionRate, rate, 'rate');
  });

  function animateValue(current: any, target: number, type: string) {
    if (current === target) return;

    // Trigger change indicator
    if (type === 'active') activeChanged = true;
    else if (type === 'completed') completedChanged = true;
    else if (type === 'rate') rateChanged = true;
    
    // Reset change indicator after animation
    setTimeout(() => {
      if (type === 'active') activeChanged = false;
      else if (type === 'completed') completedChanged = false;
      else if (type === 'rate') rateChanged = false;
    }, 2000);

    const duration = target > current ? 1200 : 800; // Slower when increasing
    const start = current;
    const startTime = Date.now();

    function update() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Enhanced easing - bouncy for increases, smooth for decreases
      let easeProgress;
      if (target > start) {
        // Bounce effect for increases (celebrations)
        const c1 = 1.70158;
        const c2 = c1 * 1.525;
        easeProgress = progress < 0.5
          ? (Math.pow(2 * progress, 2) * ((c2 + 1) * 2 * progress - c2)) / 2
          : (Math.pow(2 * progress - 2, 2) * ((c2 + 1) * (progress * 2 - 2) + c2) + 2) / 2;
      } else {
        // Smooth ease-out for decreases
        easeProgress = 1 - Math.pow(1 - progress, 3);
      }

      const newValue = Math.round(start + (target - start) * easeProgress);

      if (type === 'active') animatedActiveCount = newValue;
      else if (type === 'completed') animatedCompletedCount = newValue;
      else if (type === 'rate') animatedCompletionRate = newValue;

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }

    requestAnimationFrame(update);
  }

  // Stats data
  const stats = $derived(() => {
    const total = store.participants?.length || 0;
    const completed = store.participants?.filter(p => p.completed).length || 0;
    const active = total - completed;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      active,
      completed,
      completionRate,
      averageProgress: total > 0 ? Math.round(
        (store.participants?.reduce((sum, p) => sum + Object.keys(p.responses || {}).length, 0) || 0) / total * 10
      ) : 0
    };
  });
</script>

<div class="live-stats-section">
  <!-- Header -->
  <div
    class="text-center mb-8"
    in:fly={{ y: 30, duration: 600, easing: quintOut }}
  >
    <h2 class="text-heading-1 mb-2">Live Session Stats</h2>
    <p class="text-body text-gray-600">Real-time participant activity and progress</p>
  </div>

  <!-- Main Stats Grid -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
    <!-- Total Participants -->
    <div
      class="stats-card card-hover-lift bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200"
      in:fly={{ y: 20, duration: 600, delay: 100, easing: quintOut }}
    >
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-blue-700 mb-1">Total Joined</p>
          <p class="text-3xl font-bold text-blue-900 counter-number">
            {stats.total}
          </p>
        </div>
        <div class="text-blue-500">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
          </svg>
        </div>
      </div>
    </div>

    <!-- Active Participants -->
    <div
      class="stats-card card-hover-lift bg-gradient-to-br from-green-50 to-green-100 border-green-200 {activeChanged ? 'stats-card-updated' : ''}"
      in:fly={{ y: 20, duration: 600, delay: 200, easing: quintOut }}
    >
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-green-700 mb-1">Currently Active</p>
          <p class="text-3xl font-bold text-green-900 counter-number counter-pulse">
            {animatedActiveCount}
          </p>
        </div>
        <div class="text-green-500">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
          </svg>
        </div>
      </div>
    </div>

    <!-- Completed Quizzes -->
    <div
      class="stats-card card-hover-lift bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 {completedChanged ? 'stats-card-updated' : ''}"
      in:fly={{ y: 20, duration: 600, delay: 300, easing: quintOut }}
    >
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-purple-700 mb-1">Completed</p>
          <p class="text-3xl font-bold text-purple-900 counter-number">
            {animatedCompletedCount}
          </p>
        </div>
        <div class="text-purple-500">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
      </div>
    </div>

    <!-- Completion Rate -->
    <div
      class="stats-card card-hover-lift bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 {rateChanged ? 'stats-card-updated' : ''}"
      in:fly={{ y: 20, duration: 600, delay: 400, easing: quintOut }}
    >
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-orange-700 mb-1">Completion Rate</p>
          <p class="text-3xl font-bold text-orange-900 counter-number">
            {animatedCompletionRate}%
          </p>
        </div>
        <div class="text-orange-500">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
          </svg>
        </div>
      </div>
    </div>
  </div>

  <!-- Progress Visualization -->
  <div
    class="bg-white rounded-xl border border-gray-200 p-6 card-hover-lift"
    in:fade={{ duration: 800, delay: 500 }}
  >
    <h3 class="text-lg font-semibold text-gray-800 mb-4">Session Progress</h3>

    <!-- Overall Progress Bar -->
    <div class="mb-6">
      <div class="flex justify-between items-center mb-2">
        <span class="text-sm font-medium text-gray-700">Overall Completion</span>
        <span class="text-sm text-gray-500">{animatedCompletionRate}%</span>
      </div>
      <div class="progress-clean progress-animated">
        <div
          class="progress-fill bg-gradient-to-r from-blue-500 to-purple-600"
          style="width: {animatedCompletionRate}%"
        ></div>
      </div>
    </div>

    <!-- Detailed Breakdown -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="text-center">
        <div class="text-2xl font-bold text-blue-600 mb-1">{stats.active}</div>
        <div class="text-sm text-gray-600">In Progress</div>
      </div>
      <div class="text-center">
        <div class="text-2xl font-bold text-purple-600 mb-1">{stats.completed}</div>
        <div class="text-sm text-gray-600">Finished</div>
      </div>
      <div class="text-center">
        <div class="text-2xl font-bold text-green-600 mb-1">{stats.averageProgress}%</div>
        <div class="text-sm text-gray-600">Avg Progress</div>
      </div>
    </div>
  </div>
</div>

<style>
  .stats-card {
    padding: 1.5rem;
    border-radius: 0.75rem;
    border: 1px solid #e5e7eb;
  }

  .counter-number {
    transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .counter-pulse {
    animation: counter-pulse 2s ease-in-out infinite;
  }

  @keyframes counter-pulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.1); opacity: 0.8; }
  }

  .progress-clean {
    height: 8px;
    background: #f3f4f6;
    border-radius: 4px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    border-radius: 4px;
    transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .progress-animated {
    position: relative;
    overflow: hidden;
  }

  .progress-animated::after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
    animation: progress-shine 2s infinite;
  }

  @keyframes progress-shine {
    0% { left: -100%; }
    100% { left: 100%; }
  }

  .card-hover-lift {
    transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1),
                box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .card-hover-lift:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1),
                0 10px 10px -5px rgba(0, 0, 0, 0.04);
  }

  /* Enhanced update effect */
  .stats-card-updated {
    animation: stats-glow 2s ease-in-out;
    transform: scale(1.02);
  }

  @keyframes stats-glow {
    0% {
      box-shadow: 0 0 0 rgba(59, 130, 246, 0);
      transform: scale(1);
    }
    25% {
      box-shadow: 0 0 20px rgba(59, 130, 246, 0.4);
      transform: scale(1.02);
    }
    75% {
      box-shadow: 0 0 15px rgba(59, 130, 246, 0.2);
      transform: scale(1.01);
    }
    100% {
      box-shadow: 0 0 0 rgba(59, 130, 246, 0);
      transform: scale(1);
    }
  }
</style>