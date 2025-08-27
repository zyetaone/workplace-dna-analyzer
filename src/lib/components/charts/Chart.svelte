<!-- 
	Chart.svelte
	Generic Chart Component for Chart.js with enhanced TypeScript support
	Uses attachment pattern for chart lifecycle management
-->
<script lang="ts">
	import Chart from 'chart.js/auto';
	import type { ChartConfiguration, ChartType, ChartOptions, ChartData } from 'chart.js';
	import type { Snippet } from 'svelte';
	
	interface Props<TType extends ChartType = ChartType> {
		config: ChartConfiguration<TType>;
		width?: string;
		height?: string;
		loading?: boolean;
		error?: string | null;
		fallback?: Snippet;
		onChartCreated?: (chart: Chart<TType>) => void;
		onChartUpdated?: (chart: Chart<TType>) => void;
		onChartDestroyed?: () => void;
		responsive?: boolean;
		maintainAspectRatio?: boolean;
		animateOnUpdate?: boolean;
		class?: string;
	}
	
	let { 
		config,
		width = '100%',
		height = '300px',
		loading = false,
		error = null,
		fallback,
		onChartCreated,
		onChartUpdated,
		onChartDestroyed,
		responsive = true,
		maintainAspectRatio = false,
		animateOnUpdate = false,
		class: className = ''
	}: Props = $props();
	
	let canvas = $state<HTMLCanvasElement>();
	let container = $state<HTMLDivElement>();
	let chartInstance: Chart | null = null;
	
	// Attachment function for chart behavior
	function attachChart(node: HTMLCanvasElement) {
		if (!config) return;
		
		// Create chart with merged options
		const mergedConfig: ChartConfiguration = {
			...config,
			options: {
				...config.options,
				responsive,
				maintainAspectRatio
			}
		};
		
		chartInstance = new Chart(node, mergedConfig);
		onChartCreated?.(chartInstance);
		
		// Cleanup function
		return () => {
			onChartDestroyed?.();
			if (chartInstance) {
				chartInstance.destroy();
				chartInstance = null;
			}
		};
	}
	
	// Effect for updating chart when config changes
	$effect(() => {
		if (!chartInstance || !config) return;
		
		// Update existing chart with new config
		chartInstance.data = config.data;
		if (config.options) {
			chartInstance.options = {
				...config.options,
				responsive,
				maintainAspectRatio
			};
		}
		
		const updateMode = animateOnUpdate ? 'normal' : 'none';
		chartInstance.update(updateMode);
		onChartUpdated?.(chartInstance);
	});
	
	// Resize observer for responsive behavior
	$effect(() => {
		if (!container || !chartInstance) return;
		
		const resizeObserver = new ResizeObserver(() => {
			chartInstance?.resize();
		});
		
		resizeObserver.observe(container);
		
		return () => {
			resizeObserver.disconnect();
		};
	});
</script>

<div 
	bind:this={container}
	class="chart-container {className}"
	style="width: {width}; height: {height}; position: relative;"
>
	{#if loading}
		<div class="animate-pulse h-full bg-gray-200 rounded flex items-center justify-center">
			<span class="text-gray-500">Loading chart...</span>
		</div>
	{:else if error}
		<div class="h-full flex items-center justify-center">
			<div class="text-center">
				<p class="text-red-600 mb-2">{error}</p>
				{#if fallback}
					{@render fallback()}
				{/if}
			</div>
		</div>
	{:else if !config}
		<div class="h-full flex items-center justify-center">
			<span class="text-gray-500">No chart data available</span>
		</div>
	{:else}
		<canvas {@attach attachChart}></canvas>
	{/if}
</div>

<style>
	.chart-container {
		display: block;
	}
	
	canvas {
		max-width: 100%;
		max-height: 100%;
	}
</style>