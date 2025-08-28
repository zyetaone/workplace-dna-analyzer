<!-- Bits UI Progress Component -->
<script lang="ts">
	import { Progress } from 'bits-ui';
	
	interface ProgressProps {
		value: number;
		max?: number;
		class?: string;
		showLabel?: boolean;
		color?: 'blue' | 'green' | 'amber' | 'purple' | 'gradient';
	}
	
	let { 
		value = 0,
		max = 100,
		class: className = '',
		showLabel = false,
		color = 'blue'
	}: ProgressProps = $props();
	
	const colorClasses = {
		blue: 'bg-blue-500',
		green: 'bg-green-500',
		amber: 'bg-amber-400',
		purple: 'bg-purple-500',
		gradient: 'bg-gradient-to-r from-blue-500 to-purple-500'
	};
	
	const percentage = $derived(Math.round((value / max) * 100));
</script>

<div class="w-full {className}">
	<div class="flex items-center justify-between mb-1">
		{#if showLabel}
			<span class="text-sm font-medium text-gray-700">Progress</span>
			<span class="text-sm text-gray-600">{percentage}%</span>
		{/if}
	</div>
	<Progress.Root {value} {max} class="h-3 bg-gray-200 rounded-full overflow-hidden">
		<div 
			class="h-full {colorClasses[color]} transition-all duration-500 ease-out rounded-full"
			style="width: {percentage}%">
		</div>
	</Progress.Root>
</div>