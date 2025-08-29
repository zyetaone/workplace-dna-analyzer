<!-- @migration-task Error while migrating Svelte code: Expected token >
https://svelte.dev/e/expected_token -->
<!-- Bits UI Progress Component with mergeProps -->
<script lang="ts">
	import { Progress, mergeProps } from 'bits-ui';
	import { cn } from '$lib/utils/index';
	
	interface ProgressProps {
		value?: number;
		max?: number;
		class?: string;
		showLabel?: boolean;
		color?: 'blue' | 'green' | 'amber' | 'purple' | 'gradient';
		[key: string]: any; // Allow additional props to be passed through
	}
	
	let { 
		value = 0,
		max = 100,
		class: className = '',
		showLabel = false,
		color = 'gradient',
		...restProps
	}: ProgressProps = $props();
	
	const colorClasses = {
		blue: 'bg-blue-500',
		green: 'bg-green-500',
		amber: 'bg-amber-400',
		purple: 'bg-purple-500',
		gradient: 'bg-gradient-to-r from-purple-500 to-pink-500'
	};
	
	const percentage = $derived(Math.min(100, Math.round((value / max) * 100)));
	
	// Merge default props with user-provided props
	const rootProps = $derived(mergeProps(
		{
			value,
			max,
			class: "relative h-3 w-full overflow-hidden rounded-full bg-slate-800/50 backdrop-blur-sm"
		},
		restProps
	));
</script>

<div class="w-full {className}">
	{#if showLabel}
		<div class="flex items-center justify-between mb-1">
			<span class="text-sm font-medium text-slate-300">Progress</span>
			<span class="text-sm text-slate-400">{percentage}%</span>
		</div>
	{/if}
	<Progress.Root {...rootProps}>
		<Progress.Indicator 
			class=mergeProps(
				"h-full transition-all duration-500 ease-out rounded-full shadow-lg",
				colorClasses[color],
				"shadow-purple-500/20"
			)}
			style="transform: translateX(-{100 - percentage}%)"
		/>
	</Progress.Root>
</div>