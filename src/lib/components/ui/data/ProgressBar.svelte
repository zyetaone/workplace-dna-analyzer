/**
 * Progress Bar component using canonical bits-ui patterns
 * Follows Svelte 5 runes and bits-ui Progress primitive
 */
<script lang="ts">
	import { Progress } from 'bits-ui';
	import type { Snippet } from 'svelte';

	interface Props extends Progress.RootProps {
		/** Progress bar size */
		size?: 'sm' | 'md' | 'lg';
		/** Progress bar color */
		color?: 'primary' | 'blue' | 'green' | 'gray';
		/** Show percentage label */
		showLabel?: boolean;
		/** Progress label content */
		label?: Snippet;
		/** Additional CSS classes */
		class?: string;
	}

	let {
		value = 0,
		max = 100,
		size = 'md',
		color = 'primary',
		showLabel = false,
		label,
		class: className = '',
		...restProps
	}: Props = $props();

	// Calculate percentage for display
	const percentage = $derived(
		value === null ? 0 : Math.min(100, Math.max(0, Math.round((value / max) * 100)))
	);

	// Generate unique ID for accessibility
	const labelId = `progress-label-${Math.random().toString(36).slice(2, 9)}`;

	// Progress container classes using native Svelte 5 arrays
	const containerClass = $derived(() => [
		'progress-container',
		size === 'sm' && 'h-1',
		size === 'md' && 'h-2',
		size === 'lg' && 'h-3',
		className
	]);

	// Progress fill classes using native Svelte 5 arrays
	const fillClass = $derived(() => [
		'progress-bar',
		color === 'primary' && 'from-purple-500 to-purple-600',
		color === 'blue' && 'from-blue-500 to-blue-600',
		color === 'green' && 'from-green-500 to-green-600',
		color === 'gray' && 'from-gray-500 to-gray-600'
	]);
</script>

<div class="w-full">
	{#if showLabel || label}
		<div id={labelId} class="mb-2 flex items-center justify-between">
			{#if label}
				{@render label()}
			{:else if showLabel}
				<span class="text-sm font-medium text-white">Progress</span>
				<span class="text-sm text-gray-400">{percentage}%</span>
			{/if}
		</div>
	{/if}

	<Progress.Root
		{value}
		{max}
		class={containerClass()}
		aria-labelledby={showLabel || label ? labelId : undefined}
		{...restProps}
	>
		<div class={fillClass()} style="width: {percentage}%"></div>
	</Progress.Root>
</div>