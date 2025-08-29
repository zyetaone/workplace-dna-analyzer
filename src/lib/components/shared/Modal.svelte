<!--
  Simple Modal Component
-->
<script lang="ts">
	import { fade, scale } from 'svelte/transition';
  import type { Snippet } from 'svelte';

  interface Props {
    open?: boolean;
    title?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    children?: Snippet;
  }

  let {
    open = $bindable(false),
    title = '',
    size = 'md',
    children
  }: Props = $props();

  let modalRef = $state<HTMLElement>();

  // Size classes mapping
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  // Close modal function
  function closeModal() {
    open = false;
  }
</script>

{#if open}
  <!-- Backdrop -->
  <div
    class="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4"
    onclick={closeModal}
    onkeydown={(e) => e.key === 'Escape' && closeModal()}
    transition:fade={{ duration: 200 }}
    role="button"
    tabindex="-1"
  >
    <!-- Modal Content -->
    <div
      bind:this={modalRef}
      class="bg-white rounded-xl shadow-2xl {sizeClasses[size]} w-full max-h-[90vh] overflow-hidden"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.key === 'Escape' && closeModal()}
      transition:scale={{ duration: 200, start: 0.95 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
      tabindex="-1"
    >
      <!-- Header -->
      {#if title}
        <div class="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 id="modal-title" class="text-xl font-semibold text-gray-900">
            {title}
          </h2>
          <button
            type="button"
            class="text-gray-400 hover:text-gray-600 transition-colors"
            onclick={closeModal}
            aria-label="Close modal"
            data-close
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      {/if}

      <!-- Body -->
      <div class="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
        {@render children?.()}
      </div>
    </div>
  </div>
{/if}

<style>
  /* Custom modal animations */
  .backdrop-blur-sm {
    backdrop-filter: blur(4px);
  }
</style>