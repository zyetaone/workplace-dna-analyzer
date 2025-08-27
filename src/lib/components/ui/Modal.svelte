<!-- 
	Modal.svelte
	Accessible modal component with children pattern
	Implements focus trap and keyboard navigation
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	
	interface Props {
		children?: Snippet;
		header?: Snippet;
		footer?: Snippet;
		open?: boolean;
		title?: string;
		size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
		closeOnEscape?: boolean;
		closeOnOutsideClick?: boolean;
		showCloseButton?: boolean;
		preventScroll?: boolean;
		onClose?: () => void;
		class?: string;
	}
	
	let {
		children,
		header,
		footer,
		open = $bindable(false),
		title,
		size = 'md',
		closeOnEscape = true,
		closeOnOutsideClick = true,
		showCloseButton = true,
		preventScroll = true,
		onClose,
		class: className = ''
	}: Props = $props();
	
	let modalElement = $state<HTMLDivElement>();
	let previousFocus: HTMLElement | null = null;
	
	const sizeClasses = {
		sm: 'max-w-sm',
		md: 'max-w-md',
		lg: 'max-w-lg',
		xl: 'max-w-xl',
		full: 'max-w-full mx-4'
	};
	
	// Handle modal open/close
	$effect(() => {
		if (open) {
			// Store previous focus
			previousFocus = document.activeElement as HTMLElement;
			
			// Prevent body scroll
			if (preventScroll) {
				document.body.style.overflow = 'hidden';
			}
			
			// Focus first focusable element
			setTimeout(() => {
				const focusable = modalElement?.querySelector<HTMLElement>(
					'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
				);
				focusable?.focus();
			}, 50);
		} else {
			// Restore body scroll
			if (preventScroll) {
				document.body.style.overflow = '';
			}
			
			// Restore previous focus
			previousFocus?.focus();
		}
		
		return () => {
			if (preventScroll) {
				document.body.style.overflow = '';
			}
		};
	});
	
	// Focus trap attachment
	function focusTrap(node: HTMLElement) {
		const focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
		let firstFocusable: HTMLElement | null = null;
		let lastFocusable: HTMLElement | null = null;
		
		const updateFocusables = () => {
			const focusables = node.querySelectorAll<HTMLElement>(focusableElements);
			firstFocusable = focusables[0] || null;
			lastFocusable = focusables[focusables.length - 1] || null;
		};
		
		updateFocusables();
		
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Tab') {
				if (!firstFocusable || !lastFocusable) return;
				
				if (e.shiftKey) {
					// Backward tab
					if (document.activeElement === firstFocusable) {
						e.preventDefault();
						lastFocusable.focus();
					}
				} else {
					// Forward tab
					if (document.activeElement === lastFocusable) {
						e.preventDefault();
						firstFocusable.focus();
					}
				}
			}
		};
		
		node.addEventListener('keydown', handleKeyDown);
		
		// Update focusables when content changes
		const observer = new MutationObserver(updateFocusables);
		observer.observe(node, { childList: true, subtree: true });
		
		return () => {
			node.removeEventListener('keydown', handleKeyDown);
			observer.disconnect();
		};
	}
	
	function handleClose() {
		open = false;
		onClose?.();
	}
	
	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Escape' && closeOnEscape) {
			handleClose();
		}
	}
	
	function handleBackdropClick(e: MouseEvent) {
		if (closeOnOutsideClick && e.target === e.currentTarget) {
			handleClose();
		}
	}
</script>

{#if open}
	<!-- Backdrop -->
	<div
		class="fixed inset-0 z-50 overflow-y-auto"
		aria-labelledby="modal-title"
		role="dialog"
		aria-modal="true"
		onkeydown={handleKeyDown}
	>
		<!-- Background overlay -->
		<div
			class="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
			onclick={handleBackdropClick}
		></div>
		
		<!-- Modal container -->
		<div class="flex min-h-screen items-center justify-center p-4">
			<!-- Modal content -->
			<div
				bind:this={modalElement}
				{@attach focusTrap}
				class="relative bg-white rounded-lg shadow-xl {sizeClasses[size]} w-full transform transition-all {className}"
			>
				<!-- Header -->
				{#if header || title || showCloseButton}
					<div class="flex items-start justify-between p-5 border-b border-gray-200">
						{#if header}
							{@render header()}
						{:else if title}
							<h3 id="modal-title" class="text-lg font-semibold text-gray-900">
								{title}
							</h3>
						{/if}
						
						{#if showCloseButton}
							<button
								onclick={handleClose}
								class="ml-auto -mr-2 -mt-2 p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 rounded"
								aria-label="Close modal"
							>
								<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						{/if}
					</div>
				{/if}
				
				<!-- Body -->
				<div class="p-6">
					{@render children?.()}
				</div>
				
				<!-- Footer -->
				{#if footer}
					<div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
						{@render footer()}
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	/* Ensure modal is above other content */
	:global(body.modal-open) {
		overflow: hidden;
	}
</style>