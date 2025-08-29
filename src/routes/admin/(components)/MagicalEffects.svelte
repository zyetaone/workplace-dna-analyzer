<script lang="ts">
  import { onMount } from 'svelte';

  interface MagicalEffectsProps {
    participantCount: number;
    completedCount: number;
    milestones?: number[];
  }

  let { 
    participantCount = 0, 
    completedCount = 0, 
    milestones = [1, 5, 10, 25, 50, 100] 
  }: MagicalEffectsProps = $props();

  let confetti: any = null;
  let previousCompleted = $state(0);
  let previousParticipants = $state(0);

  onMount(async () => {
    try {
      const confettiModule = await import('canvas-confetti');
      confetti = confettiModule.default;
    } catch (error) {
      console.warn('Canvas confetti not available:', error);
    }
  });

  // Watch for milestone achievements
  $effect(() => {
    if (completedCount > previousCompleted && confetti) {
      // Check for milestone
      const reachedMilestone = milestones.find(m => 
        previousCompleted < m && completedCount >= m
      );

      if (reachedMilestone) {
        triggerMilestoneConfetti(reachedMilestone);
      } else if (completedCount > previousCompleted) {
        triggerCompletionEffect();
      }
      
      previousCompleted = completedCount;
    }
  });

  // Watch for new participants
  $effect(() => {
    if (participantCount > previousParticipants && confetti) {
      triggerJoinEffect();
      previousParticipants = participantCount;
    }
  });

  function triggerJoinEffect() {
    if (!confetti) return;

    confetti({
      particleCount: 30,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#3b82f6', '#8b5cf6', '#06b6d4'],
      shapes: ['circle'],
      scalar: 0.8,
      drift: 0.1
    });
  }

  function triggerCompletionEffect() {
    if (!confetti) return;

    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.7 },
      colors: ['#10b981', '#34d399', '#6ee7b7'],
      shapes: ['circle', 'square'],
      scalar: 1.0
    });
  }

  function triggerMilestoneConfetti(milestone: number) {
    if (!confetti) return;

    // Major milestone celebration
    const duration = milestone >= 50 ? 3000 : 2000;
    const particleCount = Math.min(150, milestone * 2);

    // Multiple bursts for big milestones
    const burstCount = milestone >= 25 ? 3 : 2;
    
    for (let i = 0; i < burstCount; i++) {
      setTimeout(() => {
        confetti({
          particleCount: particleCount / burstCount,
          spread: 120,
          origin: { 
            x: 0.5 + (Math.random() - 0.5) * 0.4,
            y: 0.3 + Math.random() * 0.4 
          },
          colors: ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'],
          shapes: ['circle', 'square'],
          scalar: 1.2,
          drift: 0.2,
          gravity: 0.8,
          ticks: duration / 50
        });
      }, i * 200);
    }

    // Show milestone message
    showMilestoneMessage(milestone);
  }

  function showMilestoneMessage(milestone: number) {
    // This could trigger a toast notification or modal
    const event = new CustomEvent('milestone-reached', {
      detail: { milestone, completedCount, participantCount }
    });
    window.dispatchEvent(event);
  }

  // Manual trigger for testing
  export function celebrate(type: 'join' | 'complete' | 'milestone' = 'complete', value?: number) {
    if (type === 'join') {
      triggerJoinEffect();
    } else if (type === 'complete') {
      triggerCompletionEffect();
    } else if (type === 'milestone' && value) {
      triggerMilestoneConfetti(value);
    }
  }
</script>

<!-- Hidden component - purely for effects -->
<div style="display: none;" aria-hidden="true"></div>