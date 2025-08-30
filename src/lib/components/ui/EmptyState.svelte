<!--
EmptyState.svelte - Reusable component for empty state patterns
Standardizes empty state UI across the application
-->

<script lang="ts">
	import { cva, type VariantProps } from 'class-variance-authority';
	import { cn } from '$lib/utils/cn';

	// Define empty state variants using CVA
	const emptyStateVariants = cva(
		'flex flex-col items-center justify-center p-8 text-center rounded-lg border-2 border-dashed transition-all duration-300',
		{
			variants: {
				variant: {
					default: 'border-slate-700/50 bg-slate-900/20 text-slate-400',
					light: 'border-gray-300 bg-gray-50 text-gray-500',
					glass: 'border-slate-700/30 bg-slate-900/10 backdrop-blur-sm text-slate-300',
					minimal: 'border-transparent bg-transparent text-slate-500'
				},
				size: {
					sm: 'p-4 min-h-[120px]',
					md: 'p-8 min-h-[200px]',
					lg: 'p-12 min-h-[300px]'
				}
			},
			defaultVariants: {
				variant: 'default',
				size: 'md'
			}
		}
	);

	type EmptyStateVariants = VariantProps<typeof emptyStateVariants>;

	interface Props extends EmptyStateVariants {
		title: string;
		description?: string;
		icon?: string;
		action?: {
			label: string;
			onclick: () => void;
			variant?: 'default' | 'secondary' | 'outline' | 'ghost';
		};
		class?: string;
	}

	let {
		variant = 'default',
		size = 'md',
		title,
		description = '',
		icon = '📭',
		action,
		class: className = ''
	}: Props = $props();

	// Generate empty state classes
	let emptyStateClass = $derived(cn(emptyStateVariants({ variant, size }), className));
</script>

<div class={emptyStateClass}>
	{#if icon}
		<div class="text-4xl mb-4 opacity-60">
			{icon}
		</div>
	{/if}

	<h3 class="text-lg font-semibold mb-2 text-current">
		{title}
	</h3>

	{#if description}
		<p class="text-sm opacity-75 max-w-md leading-relaxed">
			{description}
		</p>
	{/if}

	{#if action}
		<div class="mt-6">
			<button
				onclick={action.onclick}
				class={cn(
					'px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200',
					action.variant === 'secondary' && 'bg-slate-700 text-slate-200 hover:bg-slate-600',
					action.variant === 'outline' &&
						'border border-slate-600 text-slate-300 hover:bg-slate-800',
					action.variant === 'ghost' && 'text-slate-300 hover:bg-slate-800',
					(!action.variant || action.variant === 'default') &&
						'bg-slate-800 text-slate-100 hover:bg-slate-700'
				)}
			>
				{action.label}
			</button>
		</div>
	{/if}
</div>
