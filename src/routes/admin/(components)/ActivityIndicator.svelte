<script lang="ts">
  import { onMount } from 'svelte';
  import { fade, scale } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';

  interface ActivityIndicatorProps {
    participantCount: number;
    completedCount: number;
    isActive?: boolean;
  }

  let { participantCount = 0, completedCount = 0, isActive = false }: ActivityIndicatorProps = $props();

  let particles = $state<Array<{ id: string; x: number; y: number; delay: number }>>([]);
  let showBurst = $state(false);

  // Previous values for comparison
  let previousParticipantCount = $state(0);
  let previousCompletedCount = $state(0);

  // Activity pulse state
  let activityPulse = $state(false);

  // Watch for changes and trigger effects
  $effect(() => {
    // New participant joined
    if (participantCount > previousParticipantCount) {
      triggerJoinEffect();
      previousParticipantCount = participantCount;
    }

    // Quiz completed
    if (completedCount > previousCompletedCount) {
      triggerCompletionEffect();
      previousCompletedCount = completedCount;
    }
  });

  // Periodic activity pulse
  $effect(() => {
    if (isActive) {
      const interval = setInterval(() => {
        activityPulse = true;
        setTimeout(() => activityPulse = false, 1000);
      }, 3000);
      return () => clearInterval(interval);
    }
  });

  function triggerJoinEffect() {
    // Generate particles for join effect
    const newParticles = Array.from({ length: 5 }, (_, i) => ({
      id: `join-${Date.now()}-${i}`,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: i * 100
    }));

    particles = [...particles, ...newParticles];

    // Remove particles after animation
    setTimeout(() => {
      particles = particles.filter(p => !p.id.startsWith(`join-${Date.now()}`));
    }, 2000);
  }

  function triggerCompletionEffect() {
    showBurst = true;
    setTimeout(() => showBurst = false, 1500);

    // Add completion particles
    const completionParticles = Array.from({ length: 8 }, (_, i) => ({
      id: `complete-${Date.now()}-${i}`,
      x: 50 + (Math.random() - 0.5) * 60,
      y: 50 + (Math.random() - 0.5) * 60,
      delay: i * 50
    }));

    particles = [...particles, ...completionParticles];

    setTimeout(() => {
      particles = particles.filter(p => !p.id.startsWith(`complete-${Date.now()}`));
    }, 2000);
  }
</script>

<div class="activity-indicator" class:active={isActive}>
  <!-- Main Activity Pulse -->
  <div 
    class="activity-pulse"
    class:pulsing={activityPulse}
  >
    <div class="pulse-ring"></div>
    <div class="pulse-dot"></div>
  </div>

  <!-- Floating Particles -->
  {#each particles as particle (particle.id)}
    <div
      class="activity-particle"
      style="left: {particle.x}%; top: {particle.y}%;"
      in:scale={{ duration: 500, delay: particle.delay, easing: quintOut }}
      out:fade={{ duration: 300 }}
    >
      {#if particle.id.includes('join')}
        <span class="particle-icon">👋</span>
      {:else if particle.id.includes('complete')}
        <span class="particle-icon">✨</span>
      {/if}
    </div>
  {/each}

  <!-- Completion Burst -->
  {#if showBurst}
    <div 
      class="completion-burst"
      in:scale={{ duration: 600, easing: quintOut }}
      out:fade={{ duration: 400 }}
    >
      🎉
    </div>
  {/if}

  <!-- Activity Stats -->
  <div class="activity-stats">
    <div class="stat-item">
      <span class="stat-label">Live</span>
      <span class="stat-value">{participantCount}</span>
    </div>
    <div class="stat-divider"></div>
    <div class="stat-item">
      <span class="stat-label">Done</span>
      <span class="stat-value">{completedCount}</span>
    </div>
  </div>
</div>

<style>
  .activity-indicator {
    position: relative;
    width: 120px;
    height: 120px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto;
  }

  .activity-pulse {
    position: absolute;
    width: 60px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .pulse-ring {
    position: absolute;
    width: 100%;
    height: 100%;
    border: 2px solid #3b82f6;
    border-radius: 50%;
    opacity: 0;
    transform: scale(0.8);
  }

  .pulse-dot {
    width: 16px;
    height: 16px;
    background: linear-gradient(45deg, #3b82f6, #8b5cf6);
    border-radius: 50%;
    position: relative;
    z-index: 2;
  }

  .activity-pulse.pulsing .pulse-ring {
    animation: pulse-ring 1s ease-out;
  }

  .activity-pulse.pulsing .pulse-dot {
    animation: pulse-dot 1s ease-out;
  }

  @keyframes pulse-ring {
    0% {
      opacity: 0;
      transform: scale(0.8);
    }
    50% {
      opacity: 0.8;
      transform: scale(1.2);
    }
    100% {
      opacity: 0;
      transform: scale(1.8);
    }
  }

  @keyframes pulse-dot {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.3);
    }
    100% {
      transform: scale(1);
    }
  }

  .activity-particle {
    position: absolute;
    pointer-events: none;
    z-index: 10;
  }

  .particle-icon {
    font-size: 1.5rem;
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
    animation: float 2s ease-in-out;
  }

  @keyframes float {
    0% {
      transform: translateY(0) rotate(0deg);
      opacity: 0;
    }
    50% {
      opacity: 1;
    }
    100% {
      transform: translateY(-30px) rotate(360deg);
      opacity: 0;
    }
  }

  .completion-burst {
    position: absolute;
    font-size: 3rem;
    z-index: 15;
    pointer-events: none;
  }

  .activity-stats {
    position: absolute;
    bottom: -40px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 12px;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    padding: 8px 16px;
    border-radius: 20px;
    border: 1px solid rgba(59, 130, 246, 0.2);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }

  .stat-label {
    font-size: 0.6rem;
    color: #6b7280;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .stat-value {
    font-size: 1.1rem;
    font-weight: bold;
    color: #1f2937;
  }

  .stat-divider {
    width: 1px;
    height: 24px;
    background: rgba(107, 114, 128, 0.3);
  }

  .activity-indicator.active .pulse-dot {
    background: linear-gradient(45deg, #10b981, #3b82f6);
    box-shadow: 0 0 20px rgba(16, 185, 129, 0.3);
  }
</style>