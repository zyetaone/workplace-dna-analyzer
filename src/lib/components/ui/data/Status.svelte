<script lang="ts">
	import { mergeProps } from 'bits-ui';

	interface Props {
		/** Status type */
		status?: 'active' | 'inactive' | 'pending' | 'completed' | 'error' | 'warning' | 'success';
		/** Visual variant */
		variant?: 'badge' | 'indicator' | 'dot' | 'pill';
		/** Custom label (uses default if not provided) */
		label?: string;
		/** Size variant */
		size?: 'sm' | 'md' | 'lg';
		/** Enable pulse animation */
		pulse?: boolean;
		/** Additional CSS classes */
		class?: string;
	}

	let {
		status = 'active',
		variant = 'badge',
		label,
		size = 'md',
		pulse = false,
		class: className = ''
	}: Props = $props();

	// Status colors
	const statusColors = {
		active: 'bg-green-100 text-green-800 border-green-200',
		inactive: 'bg-gray-100 text-gray-800 border-gray-200',
		pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
		completed: 'bg-blue-100 text-blue-800 border-blue-200',
		error: 'bg-red-100 text-red-800 border-red-200',
		warning: 'bg-orange-100 text-orange-800 border-orange-200',
		success: 'bg-emerald-100 text-emerald-800 border-emerald-200'
	};

	// Dot colors for indicator variant
	const dotColors = {
		active: 'bg-green-500',
		inactive: 'bg-gray-400',
		pending: 'bg-yellow-500',
		completed: 'bg-blue-500',
		error: 'bg-red-500',
		warning: 'bg-orange-500',
		success: 'bg-emerald-500'
	};

	// Size classes
	const sizeClasses = {
		sm: {
			badge: 'px-2 py-0.5 text-xs',
			indicator: 'h-2 w-2',
			dot: 'h-2 w-2',
			pill: 'px-2 py-0.5 text-xs'
		},
		md: {
			badge: 'px-2.5 py-1 text-sm',
			indicator: 'h-3 w-3',
			dot: 'h-3 w-3',
			pill: 'px-3 py-1 text-sm'
		},
		lg: {
			badge: 'px-3 py-1.5 text-base',
			indicator: 'h-4 w-4',
			dot: 'h-4 w-4',
			pill: 'px-4 py-1.5 text-base'
		}
	};

	// Default labels
	const defaultLabels = {
		active: 'Active',
		inactive: 'Inactive',
		pending: 'Pending',
		completed: 'Completed',
		error: 'Error',
		warning: 'Warning',
		success: 'Success'
	};

	const displayLabel = label || defaultLabels[status];

	// Create merged props for different variants
	const badgeProps = $derived(
		mergeProps(
			{
				class: `inline-flex items-center rounded-md border font-medium ${statusColors[status]} ${sizeClasses[size].badge}`
			},
			{ class: className }
		)
	);

	const indicatorProps = $derived(
		mergeProps({ class: 'inline-flex items-center gap-2' }, { class: className })
	);

	const dotProps = $derived(
		mergeProps(
			{
				class: `inline-flex rounded-full ${sizeClasses[size].dot} ${dotColors[status]} ${pulse ? 'animate-pulse' : ''}`
			},
			{ class: className }
		)
	);

	const pillProps = $derived(
		mergeProps(
			{
				class: `inline-flex items-center rounded-full font-medium ${statusColors[status]} ${sizeClasses[size].pill}`
			},
			{ class: className }
		)
	);
</script>

{#if variant === 'badge'}
	<span {...badgeProps}>
		{#if pulse && status === 'active'}
			<span class="relative mr-1.5 inline-flex h-2 w-2 rounded-full">
				<span
					class="absolute inline-flex h-full w-full animate-ping rounded-full {dotColors[
						status
					]} opacity-75"
				></span>
				<span class="relative inline-flex h-2 w-2 rounded-full {dotColors[status]}"></span>
			</span>
		{/if}
		{displayLabel}
	</span>
{:else if variant === 'indicator'}
	<div {...indicatorProps}
		<span class="relative inline-flex rounded-full {sizeClasses[size].indicator}">
			{#if pulse}
				<span
					class="absolute inline-flex h-full w-full animate-ping rounded-full {dotColors[
						status
					]} opacity-75"
				></span>
			{/if}
			<span
				class="relative inline-flex rounded-full {sizeClasses[size].indicator} {dotColors[status]}"
			></span>
		</span>
		{#if displayLabel}
			<span class="text-sm text-gray-700">{displayLabel}</span>
		{/if}
	</div>
{:else if variant === 'dot'}
	<span {...dotProps}></span>
{:else if variant === 'pill'}
	<span {...pillProps}
		{displayLabel}
	</span>
{/if}
