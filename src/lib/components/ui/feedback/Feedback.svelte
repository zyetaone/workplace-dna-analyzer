<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		type?: 'loading' | 'error' | 'empty' | 'success' | 'warning' | 'info';
		title?: string;
		message?: string;
		size?: 'sm' | 'md' | 'lg' | 'full';
		icon?: Snippet;
		actions?: Snippet;
		class?: string;
		centered?: boolean;
	}

	let {
		type = 'loading',
		title,
		message,
		size = 'md',
		icon,
		actions,
		class: className = '',
		centered = true
	}: Props = $props();

	// Default icons and messages
	const defaults = {
		loading: {
			icon: '⏳',
			title: 'Loading...',
			message: 'Please wait while we fetch your data'
		},
		error: {
			icon: '❌',
			title: 'Something went wrong',
			message: 'An error occurred. Please try again.'
		},
		empty: {
			icon: '📭',
			title: 'No data found',
			message: 'There is no data to display'
		},
		success: {
			icon: '✅',
			title: 'Success!',
			message: 'Operation completed successfully'
		},
		warning: {
			icon: '⚠️',
			title: 'Warning',
			message: 'Please review this information'
		},
		info: {
			icon: 'ℹ️',
			title: 'Information',
			message: "Here's something you should know"
		}
	};

	const displayTitle = title || defaults[type].title;
	const displayMessage = message || defaults[type].message;

	// Size classes
	const sizeClasses = {
		sm: 'p-4 max-w-sm',
		md: 'p-8 max-w-md',
		lg: 'p-12 max-w-lg',
		full: 'p-16 w-full'
	};

	// Type-specific colors
	const typeColors = {
		loading: 'text-gray-600',
		error: 'text-red-600',
		empty: 'text-gray-500',
		success: 'text-green-600',
		warning: 'text-orange-600',
		info: 'text-blue-600'
	};
</script>

<div
	class="feedback-container {sizeClasses[size]} {centered ? 'mx-auto text-center' : ''} {className}"
	role={type === 'error' ? 'alert' : 'status'}
	aria-live={type === 'error' ? 'assertive' : 'polite'}
>
	{#if type === 'loading'}
		<div class="loading-spinner">
			<svg
				class="mx-auto mb-4 h-12 w-12 animate-spin text-indigo-600"
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
			>
				<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
				></circle>
				<path
					class="opacity-75"
					fill="currentColor"
					d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
				></path>
			</svg>
		</div>
	{:else if icon}
		<div class="custom-icon mb-4">
			{@render icon()}
		</div>
	{:else}
		<div class="default-icon mb-4 text-4xl">
			{defaults[type].icon}
		</div>
	{/if}

	<h3 class="mb-2 text-lg font-semibold {typeColors[type]}">
		{displayTitle}
	</h3>

	{#if displayMessage}
		<p class="mb-4 text-sm text-gray-600">
			{displayMessage}
		</p>
	{/if}

	{#if actions}
		<div class="actions mt-6">
			{@render actions()}
		</div>
	{/if}

	{#if type === 'error' && import.meta.env.DEV}
		<details class="mt-4 text-left">
			<summary class="cursor-pointer text-xs text-gray-500 hover:text-gray-700">
				Show details
			</summary>
			<pre class="mt-2 overflow-auto rounded bg-gray-100 p-2 text-xs">{message}</pre>
		</details>
	{/if}
</div>

<style>
	.feedback-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	.loading-spinner {
		display: inline-block;
	}

	.actions {
		display: flex;
		gap: 0.5rem;
		justify-content: center;
		flex-wrap: wrap;
	}
</style>
