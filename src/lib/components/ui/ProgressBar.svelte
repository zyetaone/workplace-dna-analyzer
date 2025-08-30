<!--
ProgressBar.svelte - Flexible progress bar component
Supports multiple variants, animations, and accessibility features
-->

<script lang="ts">
	import { cva, type VariantProps } from 'class-variance-authority';
	import { cn } from '$lib/utils/cn';

	// Define progress bar variants using CVA
	const progressBarVariants = cva(
		'relative h-2 w-full overflow-hidden rounded-full bg-slate-800/50 backdrop-blur-sm transition-all duration-300',
		{
			variants: {
				variant: {
					default: 'bg-slate-800/50',
					light: 'bg-gray-200',
					glass: 'bg-slate-900/30 backdrop-blur-xl',
					minimal: 'bg-transparent border border-slate-700/50'
				},
				size: {
					sm: 'h-1',
					md: 'h-2',
					lg: 'h-3',
					xl: 'h-4'
				}
			},
			defaultVariants: {
				variant: 'default',
				size: 'md'
			}
		}
	);

	const progressFillVariants = cva('h-full transition-all duration-500 ease-out rounded-full', {
		variants: {
			color: {
				blue: 'bg-blue-500',
				green: 'bg-green-500',
				amber: 'bg-amber-400',
				purple: 'bg-purple-500',
				pink: 'bg-pink-500',
				gradient: 'bg-gradient-to-r from-purple-500 to-pink-500',
				rainbow:
					'bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500'
			},
			animated: {
				true: 'animate-pulse',
				false: ''
			}
		},
		defaultVariants: {
			color: 'gradient',
			animated: false
		}
	});

	type ProgressBarVariants = VariantProps<typeof progressBarVariants>;
	type ProgressFillVariants = VariantProps<typeof progressFillVariants>;

	interface Props extends ProgressBarVariants, ProgressFillVariants {
		value?: number;
		max?: number;
		showLabel?: boolean;
		labelPosition?: 'top' | 'bottom' | 'inside';
		class?: string;
		'aria-label'?: string;
	}

	let {
		variant = 'default',
		size = 'md',
		color = 'gradient',
		animated = false,
		value = 0,
		max = 100,
		showLabel = false,
		labelPosition = 'top',
		class: className = '',
		'aria-label': ariaLabel
	}: Props = $props();

	// Calculate percentage and ensure it's within bounds
	const percentage = $derived(Math.min(100, Math.max(0, Math.round((value / max) * 100))));

	// Generate component classes
	let containerClass = $derived(cn(progressBarVariants({ variant, size }), className));
	let fillClass = $derived(progressFillVariants({ color, animated }));

	// Default aria-label if not provided
	const defaultAriaLabel = $derived(ariaLabel || `Progress: ${percentage}%`);
</script>

<div class="w-full">
	{#if showLabel && labelPosition === 'top'}
		<div class="flex items-center justify-between mb-2">
			<span class="text-sm font-medium text-slate-300">Progress</span>
			<span class="text-sm text-slate-400">{percentage}%</span>
		</div>
	{/if}

	<div
		class={containerClass}
		role="progressbar"
		aria-valuenow={percentage}
		aria-valuemin="0"
		aria-valuemax="100"
		aria-label={defaultAriaLabel}
	>
		<div class={fillClass} style="width: {percentage}%"></div>

		{#if showLabel && labelPosition === 'inside'}
			<div class="absolute inset-0 flex items-center justify-center">
				<span class="text-xs font-medium text-white drop-shadow-sm">
					{percentage}%
				</span>
			</div>
		{/if}
	</div>

	{#if showLabel && labelPosition === 'bottom'}
		<div class="flex items-center justify-between mt-2">
			<span class="text-sm font-medium text-slate-300">Progress</span>
			<span class="text-sm text-slate-400">{percentage}%</span>
		</div>
	{/if}
</div>
