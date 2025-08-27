<!--
	StatCard.svelte
	Reusable statistics card component for dashboard metrics
-->

<script lang="ts">
	interface Props {
		title: string;
		value: number | string;
		subtitle?: string;
		icon?: string;
		trend?: {
			value: number;
			direction: 'up' | 'down' | 'neutral';
		};
		colorClass?: string;
		bgClass?: string;
		loading?: boolean;
		animate?: boolean;
	}
	
	let { 
		title, 
		value, 
		subtitle,
		icon,
		trend,
		colorClass = 'text-gray-700',
		bgClass = 'bg-gray-50',
		loading = false,
		animate = false
	}: Props = $props();
	
	function getTrendIcon(direction: 'up' | 'down' | 'neutral') {
		switch (direction) {
			case 'up': return '↑';
			case 'down': return '↓';
			default: return '→';
		}
	}
	
	function getTrendColor(direction: 'up' | 'down' | 'neutral') {
		switch (direction) {
			case 'up': return 'text-green-600';
			case 'down': return 'text-red-600';
			default: return 'text-gray-600';
		}
	}
</script>

<div class="flex justify-between items-center p-4 {bgClass} rounded">
	<div class="flex-1">
		<span class="{colorClass}">{title}</span>
		{#if subtitle}
			<p class="text-xs text-gray-500 mt-1">{subtitle}</p>
		{/if}
	</div>
	
	<div class="text-right">
		{#if loading}
			<div class="animate-pulse bg-gray-300 h-8 w-20 rounded"></div>
		{:else}
			<div class="flex items-center gap-2">
				{#if icon}
					<span class="text-2xl">{icon}</span>
				{/if}
				<span class="text-3xl font-bold {colorClass} {animate ? 'animate-pulse' : ''}">
					{value}
				</span>
				{#if trend}
					<span class="text-sm {getTrendColor(trend.direction)}">
						{getTrendIcon(trend.direction)}
						{Math.abs(trend.value)}%
					</span>
				{/if}
			</div>
		{/if}
	</div>
</div>