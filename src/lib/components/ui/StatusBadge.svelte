<!--
StatusBadge.svelte - Compact status indicator badges
Perfect for inline status display in tables, cards, and lists
-->

<script lang="ts">
	import { cva, type VariantProps } from 'class-variance-authority';
	import { cn } from '$lib/utils/cn';
	import type { Snippet } from 'svelte';

	// Define status badge variants using CVA
	const statusBadgeVariants = cva(
		'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full transition-colors duration-200',
		{
			variants: {
				variant: {
					success: 'bg-green-500/10 text-green-600 border border-green-500/20',
					error: 'bg-red-500/10 text-red-600 border border-red-500/20',
					warning: 'bg-amber-500/10 text-amber-600 border border-amber-500/20',
					info: 'bg-blue-500/10 text-blue-600 border border-blue-500/20',
					neutral: 'bg-slate-500/10 text-slate-600 border border-slate-500/20',
					loading: 'bg-purple-500/10 text-purple-600 border border-purple-500/20',
					// Light theme variants
					lightSuccess: 'bg-green-100 text-green-800 border border-green-200',
					lightError: 'bg-red-100 text-red-800 border border-red-200',
					lightWarning: 'bg-amber-100 text-amber-800 border border-amber-200',
					lightInfo: 'bg-blue-100 text-blue-800 border border-blue-200'
				},
				size: {
					sm: 'px-2 py-0.5 text-xs',
					md: 'px-2.5 py-1 text-xs',
					lg: 'px-3 py-1.5 text-sm'
				}
			},
			defaultVariants: {
				variant: 'neutral',
				size: 'md'
			}
		}
	);

	type StatusBadgeVariants = VariantProps<typeof statusBadgeVariants>;

	interface Props extends StatusBadgeVariants {
		status: string;
		showIcon?: boolean;
		class?: string;
		children?: Snippet;
	}

	let {
		variant = 'neutral',
		size = 'md',
		status,
		showIcon = false,
		class: className = '',
		children
	}: Props = $props();

	// Status configuration with icons
	const statusConfig = {
		success: { icon: '●', variant: 'success' },
		error: { icon: '●', variant: 'error' },
		warning: { icon: '●', variant: 'warning' },
		info: { icon: '●', variant: 'info' },
		loading: { icon: '⏳', variant: 'loading' },
		active: { icon: '●', variant: 'success' },
		inactive: { icon: '●', variant: 'neutral' },
		pending: { icon: '●', variant: 'warning' },
		completed: { icon: '●', variant: 'success' },
		failed: { icon: '●', variant: 'error' }
	};

	// Get status configuration, fallback to neutral
	const config = statusConfig[status.toLowerCase()] || { icon: '●', variant: 'neutral' };

	// Override variant if status-specific variant exists
	const badgeVariant = config.variant || variant;

	// Generate badge classes
	let badgeClass = $derived(cn(statusBadgeVariants({ variant: badgeVariant, size }), className));
</script>

<span class={badgeClass} role="status" aria-label="Status: {status}">
	{#if showIcon}
		<span class="text-current" aria-hidden="true">{config.icon}</span>
	{/if}
	<span>
		{@render children?.()}
		{#if !children}{status}{/if}
	</span>
</span>
