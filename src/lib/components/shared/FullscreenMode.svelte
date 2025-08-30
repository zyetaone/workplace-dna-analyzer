<script lang="ts">
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';

  import type { Snippet } from 'svelte';

  interface FullscreenModeProps {
    isFullscreen?: boolean;
    onToggle?: (isFullscreen: boolean) => void;
    children?: Snippet;
  }

  let { isFullscreen = false, onToggle, children }: FullscreenModeProps = $props();

  let isSupported = $state(false);
  let element: HTMLElement;

  onMount(() => {
    isSupported = !!(document.fullscreenElement !== undefined || 
                     (document as any).webkitFullscreenElement !== undefined ||
                     (document as any).mozFullScreenElement !== undefined);

    // Listen for fullscreen changes
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement
      );
      
      if (isCurrentlyFullscreen !== isFullscreen) {
        onToggle?.(isCurrentlyFullscreen);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
    };
  });

  async function toggleFullscreen() {
    if (!isSupported) return;

    try {
      if (!isFullscreen) {
        // Enter fullscreen
        if (element.requestFullscreen) {
          await element.requestFullscreen();
        } else if ((element as any).webkitRequestFullscreen) {
          await (element as any).webkitRequestFullscreen();
        } else if ((element as any).mozRequestFullScreen) {
          await (element as any).mozRequestFullScreen();
        }
      } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
          await (document as any).mozCancelFullScreen();
        }
      }
    } catch (error) {
      console.warn('Fullscreen operation failed:', error);
    }
  }

  // Keyboard shortcut (F11 or F key)
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'F11' || (event.key === 'f' && event.ctrlKey)) {
      event.preventDefault();
      toggleFullscreen();
    }
    if (event.key === 'Escape' && isFullscreen) {
      toggleFullscreen();
    }
  }
</script>

<div bind:this={element} class="fullscreen-container" class:fullscreen={isFullscreen}>
  <!-- Fullscreen content -->
  {@render children?.()}

  <!-- Fullscreen Controls -->
  {#if isSupported}
    <div class="fullscreen-controls" class:visible={isFullscreen || true}>
      <button
        class="fullscreen-btn"
        onclick={toggleFullscreen}
        aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        title={isFullscreen ? 'Exit fullscreen (ESC)' : 'Enter fullscreen (F11)'}
        in:fade={{ duration: 300 }}
      >
        {#if isFullscreen}
          <!-- Exit fullscreen icon -->
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        {:else}
          <!-- Enter fullscreen icon -->
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/>
          </svg>
        {/if}
        <span class="btn-text">
          {isFullscreen ? 'Exit' : 'Fullscreen'}
        </span>
      </button>

      <!-- Keyboard shortcuts hint -->
      {#if !isFullscreen}
        <div class="keyboard-hint" in:fade={{ duration: 300, delay: 500 }}>
          <kbd>F11</kbd> or <kbd>Ctrl</kbd>+<kbd>F</kbd>
        </div>
      {/if}
    </div>
  {/if}

  <!-- Fullscreen overlay for enhanced experience -->
  {#if isFullscreen}
    <div class="fullscreen-overlay" in:fade={{ duration: 500 }}>
      <!-- Exit hint -->
      <div class="exit-hint">
        Press <kbd>ESC</kbd> to exit fullscreen
      </div>
    </div>
  {/if}
</div>

<svelte:window onkeydown={handleKeydown} />

<style>
  .fullscreen-container {
    position: relative;
    width: 100%;
    height: 100%;
  }

  .fullscreen-container.fullscreen {
    background: #f8fafc;
    padding: 2rem;
  }

  .fullscreen-controls {
    position: fixed;
    top: 1rem;
    right: 1rem;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.5rem;
  }

  .fullscreen-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(59, 130, 246, 0.2);
    border-radius: 0.75rem;
    color: #374151;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .fullscreen-btn:hover {
    background: rgba(59, 130, 246, 0.05);
    border-color: rgba(59, 130, 246, 0.3);
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
  }

  .fullscreen-btn:active {
    transform: translateY(0);
  }

  .btn-text {
    white-space: nowrap;
  }

  .keyboard-hint {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.75rem;
    color: #6b7280;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(8px);
    padding: 0.375rem 0.75rem;
    border-radius: 0.5rem;
    border: 1px solid rgba(156, 163, 175, 0.2);
  }

  kbd {
    font-family: ui-monospace, SFMono-Regular, monospace;
    font-size: 0.75rem;
    padding: 0.125rem 0.25rem;
    background: #f3f4f6;
    border: 1px solid #d1d5db;
    border-radius: 0.25rem;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }

  .fullscreen-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    z-index: 999;
  }

  .exit-hint {
    position: absolute;
    bottom: 2rem;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    border-radius: 2rem;
    font-size: 0.875rem;
    font-weight: 500;
    backdrop-filter: blur(10px);
    animation: pulse-hint 3s ease-in-out infinite;
  }

  .exit-hint kbd {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.3);
    color: white;
  }

  @keyframes pulse-hint {
    0%, 100% { opacity: 0.7; }
    50% { opacity: 1; }
  }

  /* Hide scrollbars in fullscreen */
  .fullscreen-container.fullscreen :global(body) {
    overflow: hidden;
  }

  /* Enhance fullscreen experience */
  @media (display-mode: fullscreen) {
    .fullscreen-container {
      background: #f8fafc;
    }
  }

  /* Mobile adaptations */
  @media (max-width: 768px) {
    .fullscreen-controls {
      top: 0.5rem;
      right: 0.5rem;
    }

    .fullscreen-btn {
      padding: 0.5rem;
    }

    .btn-text {
      display: none;
    }

    .keyboard-hint {
      display: none;
    }
  }
</style>