<!-- Simple Progress Component -->
<script lang="ts">
	interface ProgressProps {
		value?: number;
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
		color = 'gradient'
	}: ProgressProps = $props();

	const colorClasses = {
		blue: 'bg-blue-500',
		green: 'bg-green-500',
		amber: 'bg-amber-400',
		purple: 'bg-purple-500',
		gradient: 'bg-gradient-to-r from-purple-500 to-pink-500'
	};

	const percentage = $derived(Math.min(100, Math.round((value / max) * 100)));
</script>

<div class="w-full {className}">
	{#if showLabel}
		<div class="flex items-center justify-between mb-1">
			<span class="text-sm font-medium text-slate-300">Progress</span>
			<span class="text-sm text-slate-400">{percentage}%</span>
		</div>
	{/if}
	<div class="relative h-3 w-full overflow-hidden rounded-full bg-slate-800/50 backdrop-blur-sm">
		<div
			class="h-full transition-all duration-500 ease-out rounded-full shadow-lg shadow-purple-500/20 {colorClasses[
				color
			]}"
			style="width: {percentage}%"
		></div>
	</div>
</div>
