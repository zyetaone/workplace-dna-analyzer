<script lang="ts">
  import { onMount } from 'svelte';

  interface SoundNotificationsProps {
    participantCount: number;
    completedCount: number;
    enabled?: boolean;
    volume?: number;
  }

  let { 
    participantCount = 0, 
    completedCount = 0, 
    enabled = true,
    volume = 0.3 
  }: SoundNotificationsProps = $props();

  let audioContext: AudioContext | null = null;
  let previousParticipants = $state(0);
  let previousCompleted = $state(0);
  let isMuted = $state(false);

  onMount(() => {
    // Initialize Web Audio API
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
    }

    // Load user preference
    const stored = localStorage.getItem('presenter-sounds-muted');
    isMuted = stored === 'true';

    return () => {
      if (audioContext) {
        audioContext.close();
      }
    };
  });

  // Watch for changes
  $effect(() => {
    if (enabled && !isMuted && audioContext && audioContext.state === 'running') {
      if (participantCount > previousParticipants) {
        playJoinSound();
        previousParticipants = participantCount;
      }
      
      if (completedCount > previousCompleted) {
        playCompleteSound();
        previousCompleted = completedCount;
      }
    }
  });

  function createOscillator(frequency: number, duration: number, type: OscillatorType = 'sine'): void {
    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.type = type;

    // Envelope
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
  }

  function playJoinSound() {
    if (!audioContext) return;
    
    // Pleasant ascending chime
    createOscillator(523, 0.2, 'sine'); // C5
    setTimeout(() => createOscillator(659, 0.2, 'sine'), 100); // E5
    setTimeout(() => createOscillator(784, 0.3, 'sine'), 150); // G5
  }

  function playCompleteSound() {
    if (!audioContext) return;
    
    // Success sound - major chord
    createOscillator(523, 0.4, 'triangle'); // C5
    createOscillator(659, 0.4, 'triangle'); // E5
    createOscillator(784, 0.4, 'triangle'); // G5
    
    // Add a little sparkle
    setTimeout(() => createOscillator(1047, 0.2, 'sine'), 200); // C6
  }

  async function toggleMute() {
    isMuted = !isMuted;
    localStorage.setItem('presenter-sounds-muted', isMuted.toString());

    // Resume audio context if needed
    if (!isMuted && audioContext && audioContext.state === 'suspended') {
      try {
        await audioContext.resume();
      } catch (error) {
        console.warn('Failed to resume audio context:', error);
      }
    }

    // Play test sound when unmuting
    if (!isMuted) {
      setTimeout(() => playJoinSound(), 100);
    }
  }

  // Manual triggers for testing
  export function testJoinSound() { playJoinSound(); }
  export function testCompleteSound() { playCompleteSound(); }
</script>

<!-- Sound Control Button -->
<button
  class="sound-toggle"
  onclick={toggleMute}
  aria-label={isMuted ? 'Enable sound notifications' : 'Disable sound notifications'}
  title={isMuted ? 'Sound notifications are off' : 'Sound notifications are on'}
>
  {#if isMuted}
    <!-- Muted icon -->
    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clip-rule="evenodd"/>
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"/>
    </svg>
  {:else}
    <!-- Sound icon -->
    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/>
    </svg>
  {/if}
</button>

<style>
  .sound-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    padding: 0;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(59, 130, 246, 0.2);
    border-radius: 50%;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .sound-toggle:hover {
    background: rgba(59, 130, 246, 0.05);
    border-color: rgba(59, 130, 246, 0.3);
    color: #3b82f6;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .sound-toggle:active {
    transform: translateY(0);
  }
</style>