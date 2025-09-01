/**
 * Meter component using canonical bits-ui patterns
 * For displaying static measurements within a known range (scores, capacity, etc.)
 * Different from Progress which tracks task completion
 */
<script lang="ts">
	import { Meter } from 'bits-ui';
	import type { Snippet } from 'svelte';

	interface Props extends Meter.RootProps {
		/** Meter size */
		size?: 'sm' | 'md' | 'lg';
		/** Meter color based on value ranges */
		color?: 'primary' | 'success' | 'warning' | 'error' | 'auto';
		/** Show value label */
		showLabel?: boolean;
		/** Custom label content */
		label?: Snippet;
		/** Value text for screen readers */
		valueText?: string;
		/** Additional CSS classes */
		class?: string;
	}

	let {
		value = 0,
		min = 0,
		max = 100,
		size = 'md',
		color = 'auto',
		showLabel = false,
		label,
		valueText,
		class: className = '',
		...restProps
	}: Props = $props();

	// Calculate percentage and determine auto color
	const percentage = $derived(Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100)));
	
	// Auto color based on percentage thresholds
	const autoColor = $derived(() => {
		if (color !== 'auto') return color;
		if (percentage >= 90) return 'error';
		if (percentage >= 75) return 'warning';
		if (percentage >= 25) return 'success';
		return 'primary';
	});

	// Generate unique ID for accessibility
	const labelId = `meter-label-${Math.random().toString(36).slice(2, 9)}`;

	// Meter container classes using native Svelte 5 arrays
	const containerClass = $derived(() => [
		'progress-container', // Reuse ZDS progress container styles
		size === 'sm' && 'h-1',
		size === 'md' && 'h-2',
		size === 'lg' && 'h-3',
		className
	]);

	// Meter fill classes using native Svelte 5 arrays
	const fillClass = $derived(() => [
		'progress-fill', // Reuse ZDS progress fill styles
		autoColor() === 'primary' && 'bg-gradient-to-r from-purple-500 to-purple-600',
		autoColor() === 'success' && 'bg-gradient-to-r from-green-500 to-green-600',
		autoColor() === 'warning' && 'bg-gradient-to-r from-amber-500 to-amber-600',
		autoColor() === 'error' && 'bg-gradient-to-r from-red-500 to-red-600'
	]);

	// Default value text for accessibility
	const defaultValueText = $derived(() => 
		valueText || `${value} out of ${max} (${Math.round(percentage)}%)`
	);
</script>

<div class="w-full">
	{#if showLabel || label}
		<div id={labelId} class="mb-2 flex items-center justify-between">
			{#if label}
				{@render label()}
			{:else if showLabel}
				<span class="text-sm font-medium text-white">Level</span>
				<span class="text-sm text-gray-400">{value}/{max}</span>
			{/if}
		</div>
	{/if}

	<Meter.Root
		{value}
		{min}
		{max}
		class={containerClass()}
		aria-labelledby={showLabel || label ? labelId : undefined}
		aria-valuetext={defaultValueText()}
		{...restProps}
	>
		<div class={fillClass()} style="width: {percentage}%"></div>
	</Meter.Root>
</div>