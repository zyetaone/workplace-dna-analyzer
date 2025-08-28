<!-- D3 Chart Wrapper Component -->
<script lang="ts">
	import D3BarChart from './D3BarChart.svelte';
	import D3DonutChart from './D3DonutChart.svelte';
	import D3RadarChart from './D3RadarChart.svelte';

	// Define ChartConfig type based on usage
	interface ChartConfig {
		type: 'bar' | 'doughnut' | 'radar';
		scores?: Record<string, number>;
		data?: any;
	}

	interface ChartProps {
		config: ChartConfig;
		height?: string;
		width?: string;
		class?: string;
	}

	let { config, height = '400px', width = '100%', class: className = '' }: ChartProps = $props();

	// Parse height to get numeric value for D3 components
	const numericHeight = parseInt(height) || 400;
</script>

<!-- Render appropriate D3 chart based on config type -->
{#if !config}
	<div class="flex items-center justify-center {className}" style="height: {height}; width: {width};">
		<p class="text-gray-500">No chart configuration provided</p>
	</div>
{:else if config.type === 'bar' && config.scores}
	<D3BarChart 
		scores={config.scores}
		height={numericHeight}
		class={className}
	/>
{:else if config.type === 'doughnut' && config.data}
	<D3DonutChart 
		data={config.data}
		height={numericHeight}
		class={className}
	/>
{:else if config.type === 'radar' && config.data}
	<D3RadarChart 
		data={config.data}
		height={numericHeight}
		class={className}
	/>
{:else}
	<!-- Fallback for any other chart types or missing data -->
	<div class="flex items-center justify-center {className}" style="height: {height}; width: {width};">
		<p class="text-gray-500">
			{#if config && !config.data && !config.scores}
				No data available for chart
			{:else}
				Chart type not supported
			{/if}
		</p>
	</div>
{/if}