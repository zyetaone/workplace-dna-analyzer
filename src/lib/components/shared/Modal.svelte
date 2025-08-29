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
		description?: string;
		preventClose?: boolean;
	}

	let {
		open = $bindable(false),
		title = '',
		size = 'md',
		children,
		description,
		preventClose = false
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
		if (!preventClose) {
			open = false;
		}
	}

	// Handle escape key
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && !preventClose) {
			open = false;
		}
	}
</script>

{#if open}
  <!-- Backdrop -->
  <div
    class="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4"
    transition:fade={{ duration: 200 }}
    onclick={closeModal}
    onkeydown={handleKeydown}
    role="dialog"
    aria-modal="true"
    tabindex="-1"
  >
    <!-- Modal Content -->
    <div
      bind:this={modalRef}
      class="bg-white rounded-xl shadow-2xl {sizeClasses[size]} w-full max-h-[90vh] overflow-hidden z-50"
      transition:scale={{ duration: 200, start: 0.95 }}
      role="document"
    >
      <!-- Header -->
      {#if title}
        <div class="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 class="text-xl font-semibold text-gray-900">
            {title}
          </h2>
          {#if !preventClose}
            <button 
              class="text-gray-400 hover:text-gray-600 transition-colors"
              onclick={closeModal}
              aria-label="Close modal"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          {/if}
        </div>
      {/if}

      <!-- Description -->
      {#if description}
        <div class="px-6 py-2 text-sm text-gray-600">
          {description}
        </div>
      {/if}

      <!-- Body -->
      <div class="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
        {@render children?.()}
      </div>
    </div>
  </div>
{/if}

<!--
  USAGE EXAMPLES:

  // Basic modal
  <Modal bind:open={showModal} title="Confirm Action">
    <p>Are you sure you want to proceed?</p>
    <div class="flex justify-end gap-2 mt-4">
      <Button variant="outline" onclick={() => showModal = false}>Cancel</Button>
      <Button onclick={handleConfirm}>Confirm</Button>
    </div>
  </Modal>

  // Modal with description and prevent close
  <Modal
    bind:open={showImportantModal}
    title="Important Notice"
    description="This action cannot be undone"
    preventClose={true}
  >
    <p>Critical information that requires user acknowledgment.</p>
    <Button onclick={() => showImportantModal = false} class="mt-4">
      I Understand
    </Button>
  </Modal>
-->

<style>
  /* Enhanced modal animations with portal benefits */
  .backdrop-blur-sm {
    backdrop-filter: blur(4px);
  }

  /* Portal-specific styling for better z-index management */
  :global(.modal-portal) {
    z-index: 9999;
  }
</style>
