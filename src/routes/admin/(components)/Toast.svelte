<script lang="ts" module>
	export interface ToastMessage {
		id: string;
		title: string;
		description?: string;
		variant?: 'success' | 'error' | 'info' | 'warning';
		duration?: number;
	}

	// Global toast state using Svelte 5 runes
	let toasts = $state<ToastMessage[]>([]);

	export function showToast(message: Omit<ToastMessage, 'id'>) {
		const id = crypto.randomUUID();
		const toast: ToastMessage = {
			id,
			duration: 3000,
			variant: 'info',
			...message
		};

		toasts.push(toast);

		// Auto-remove after duration
		setTimeout(() => {
			removeToast(id);
		}, toast.duration);

		return id;
	}

	function removeToast(id: string) {
		const index = toasts.findIndex((t) => t.id === id);
		if (index > -1) {
			toasts.splice(index, 1);
		}
	}
</script>

<script lang="ts">
	import { fly } from 'svelte/transition';

	// Toast variant styles
	function getVariantStyles(variant: string) {
		const styles = {
			success: 'bg-green-500 text-white border-green-600',
			error: 'bg-red-500 text-white border-red-600',
			warning: 'bg-amber-500 text-white border-amber-600',
			info: 'bg-gray-800 text-white border-gray-900'
		};
		return styles[variant as keyof typeof styles] || styles.info;
	}

	// Toast icons
	function getVariantIcon(variant: string) {
		const icons = {
			success: '✓',
			error: '✕',
			warning: '⚠',
			info: 'ℹ'
		};
		return icons[variant as keyof typeof icons] || icons.info;
	}
</script>

<!-- Toast snippet for reusable toast item -->
{#snippet toastItem(toast: ToastMessage)}
	<div
		in:fly={{ y: 30, duration: 300 }}
		out:fly={{ y: -30, duration: 300 }}
		class="pointer-events-auto flex w-full items-start gap-3 rounded-lg border-2 p-4 shadow-lg sm:min-w-[320px] sm:max-w-md {getVariantStyles(
			toast.variant || 'info'
		)}"
	>
		<span class="mt-0.5 flex-shrink-0 text-xl">
			{getVariantIcon(toast.variant || 'info')}
		</span>
		<div class="min-w-0 flex-1">
			<p class="text-sm font-semibold leading-tight">{toast.title}</p>
			{#if toast.description}
				<p class="mt-1 text-sm leading-tight opacity-90">{toast.description}</p>
			{/if}
		</div>
		<button
			onclick={() => removeToast(toast.id)}
			class="flex-shrink-0 rounded p-0.5 opacity-70 transition-opacity hover:bg-white hover:bg-opacity-20 hover:opacity-100"
			aria-label="Dismiss notification"
		>
			<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M6 18L18 6M6 6l12 12"
				/>
			</svg>
		</button>
	</div>
{/snippet}

<!-- Toast container with responsive positioning -->
<div class="pointer-events-none fixed bottom-4 left-4 right-4 z-50 sm:left-auto">
	<div class="flex max-w-full flex-col items-end gap-2 sm:max-w-md">
		{#each toasts as toast (toast.id)}
			{@render toastItem(toast)}
		{/each}
	</div>
</div>

<style></style>
