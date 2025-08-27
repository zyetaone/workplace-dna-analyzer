<script lang="ts" module>
	export interface ToastMessage {
		id: string;
		title: string;
		description?: string;
		variant?: 'success' | 'error' | 'info' | 'warning';
		duration?: number;
	}
	
	let toasts = $state<ToastMessage[]>([]);
	
	export function showToast(message: Omit<ToastMessage, 'id'>) {
		const id = Math.random().toString(36).substr(2, 9);
		const toast: ToastMessage = {
			id,
			duration: 3000,
			variant: 'info',
			...message
		};
		
		toasts = [...toasts, toast];
		
		// Auto-remove after duration
		setTimeout(() => {
			removeToast(id);
		}, toast.duration);
	}
	
	export function removeToast(id: string) {
		toasts = toasts.filter(t => t.id !== id);
	}
</script>

<script lang="ts">
	import { flip } from 'svelte/animate';
	import { fly, fade } from 'svelte/transition';
	
	// Toast attachment for portal behavior
	function toastPortal(node: HTMLElement) {
		// Move to body for proper z-index stacking
		document.body.appendChild(node);
		
		return () => {
			// Cleanup on destroy
			node.remove();
		};
	}
	
	function getToastStyles(variant: string) {
		switch (variant) {
			case 'success':
				return 'bg-green-500 text-white';
			case 'error':
				return 'bg-red-500 text-white';
			case 'warning':
				return 'bg-amber-500 text-white';
			default:
				return 'bg-gray-800 text-white';
		}
	}
	
	function getToastIcon(variant: string) {
		switch (variant) {
			case 'success':
				return '✓';
			case 'error':
				return '✕';
			case 'warning':
				return '⚠';
			default:
				return 'ℹ';
		}
	}
</script>

<!-- Toast Container with portal attachment -->
<div 
	class="fixed bottom-4 right-4 z-50 pointer-events-none"
	{@attach toastPortal}
>
	<div class="space-y-2">
		{#each toasts as toast (toast.id)}
			<div
				animate:flip={{ duration: 200 }}
				transition:fly={{ y: 30, duration: 200 }}
				class="pointer-events-auto"
			>
				<div 
					class="flex items-start gap-3 p-4 rounded-lg shadow-lg min-w-[300px] max-w-md {getToastStyles(toast.variant || 'info')}"
				>
					<span class="text-xl flex-shrink-0">
						{getToastIcon(toast.variant || 'info')}
					</span>
					<div class="flex-1 min-w-0">
						<p class="font-medium">{toast.title}</p>
						{#if toast.description}
							<p class="text-sm opacity-90 mt-1">{toast.description}</p>
						{/if}
					</div>
					<button
						onclick={() => removeToast(toast.id)}
						class="flex-shrink-0 opacity-70 hover:opacity-100 transition"
						aria-label="Dismiss"
					>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>
			</div>
		{/each}
	</div>
</div>

<style>
	/* Ensure proper stacking */
	:global(.toast-portal) {
		z-index: 9999;
	}
</style>