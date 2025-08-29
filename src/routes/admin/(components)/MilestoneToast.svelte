<script lang="ts">
  import { onMount } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';

  let toasts = $state<Array<{
    id: string;
    milestone: number;
    message: string;
    timestamp: number;
  }>>([]);

  onMount(() => {
    // Listen for milestone events
    const handleMilestone = (event: CustomEvent) => {
      const { milestone, completedCount } = event.detail;
      addToast(milestone, completedCount);
    };

    window.addEventListener('milestone-reached', handleMilestone as EventListener);
    return () => window.removeEventListener('milestone-reached', handleMilestone as EventListener);
  });

  function addToast(milestone: number, completedCount: number) {
    const messages = {
      1: "First participant completed! 🎉",
      5: "5 participants completed! Great momentum! 🚀",
      10: "Double digits! 10 completions achieved! ⭐",
      25: "Quarter century! 25 amazing participants! 🎊",
      50: "Half a hundred! Incredible engagement! 🔥",
      100: "Century milestone! This is phenomenal! 👑"
    };

    const message = messages[milestone as keyof typeof messages] || 
                   `${milestone} participants completed! Outstanding! 🎯`;

    const toast = {
      id: `toast-${Date.now()}`,
      milestone,
      message,
      timestamp: Date.now()
    };

    toasts = [...toasts, toast];

    // Auto-remove after 5 seconds
    setTimeout(() => {
      removeToast(toast.id);
    }, 5000);
  }

  function removeToast(id: string) {
    toasts = toasts.filter(t => t.id !== id);
  }

  function getMilestoneColor(milestone: number): string {
    if (milestone >= 100) return 'from-purple-500 to-pink-500';
    if (milestone >= 50) return 'from-blue-500 to-purple-500';
    if (milestone >= 25) return 'from-green-500 to-blue-500';
    if (milestone >= 10) return 'from-yellow-500 to-orange-500';
    if (milestone >= 5) return 'from-orange-500 to-red-500';
    return 'from-blue-500 to-green-500';
  }
</script>

<!-- Toast Container -->
<div class="toast-container">
  {#each toasts as toast (toast.id)}
    <div
      class="milestone-toast bg-gradient-to-r {getMilestoneColor(toast.milestone)}"
      in:fly={{ x: 300, duration: 400, easing: quintOut }}
      out:fly={{ x: 300, duration: 300, easing: quintOut }}
    >
      <div class="toast-content">
        <div class="toast-icon">
          {#if toast.milestone >= 100}
            👑
          {:else if toast.milestone >= 50}
            🔥
          {:else if toast.milestone >= 25}
            🎊
          {:else if toast.milestone >= 10}
            ⭐
          {:else if toast.milestone >= 5}
            🚀
          {:else}
            🎉
          {/if}
        </div>
        <div class="toast-text">
          <div class="toast-title">Milestone Reached!</div>
          <div class="toast-message">{toast.message}</div>
        </div>
        <button
          class="toast-close"
          onclick={() => removeToast(toast.id)}
          aria-label="Dismiss notification"
        >
          ✕
        </button>
      </div>
      
      <!-- Progress bar animation -->
      <div class="toast-progress">
        <div class="toast-progress-bar"></div>
      </div>
    </div>
  {/each}
</div>

<style>
  .toast-container {
    position: fixed;
    top: 1rem;
    right: 1rem;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    max-width: 400px;
    pointer-events: none;
  }

  .milestone-toast {
    position: relative;
    border-radius: 0.75rem;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    backdrop-filter: blur(10px);
    overflow: hidden;
    pointer-events: auto;
  }

  .toast-content {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    color: white;
    position: relative;
    z-index: 2;
  }

  .toast-icon {
    font-size: 1.75rem;
    flex-shrink: 0;
    animation: bounce 0.6s ease-in-out;
  }

  @keyframes bounce {
    0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
    40% { transform: translateY(-8px); }
    60% { transform: translateY(-4px); }
  }

  .toast-text {
    flex: 1;
    min-width: 0;
  }

  .toast-title {
    font-weight: 600;
    font-size: 0.875rem;
    margin-bottom: 0.25rem;
    opacity: 0.95;
  }

  .toast-message {
    font-size: 0.8125rem;
    opacity: 0.9;
    line-height: 1.3;
  }

  .toast-close {
    background: rgba(255, 255, 255, 0.2);
    border: none;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 0.75rem;
    cursor: pointer;
    transition: background-color 0.2s;
    flex-shrink: 0;
  }

  .toast-close:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  .toast-progress {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: rgba(255, 255, 255, 0.2);
    overflow: hidden;
  }

  .toast-progress-bar {
    height: 100%;
    background: rgba(255, 255, 255, 0.6);
    width: 100%;
    transform: translateX(-100%);
    animation: progress 5s linear forwards;
  }

  @keyframes progress {
    to {
      transform: translateX(0);
    }
  }

  @media (max-width: 640px) {
    .toast-container {
      left: 1rem;
      right: 1rem;
      max-width: none;
    }
    
    .toast-content {
      padding: 0.75rem;
      gap: 0.5rem;
    }
    
    .toast-icon {
      font-size: 1.5rem;
    }
    
    .toast-title {
      font-size: 0.8125rem;
    }
    
    .toast-message {
      font-size: 0.75rem;
    }
  }
</style>