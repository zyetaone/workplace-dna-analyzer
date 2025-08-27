<!-- Generic Chart Component for Chart.js -->
<script lang="ts">
	import Chart from 'chart.js/auto';
	import type { ChartConfiguration, ChartType } from 'chart.js';
	
	interface Props {
		config: ChartConfiguration;
		width?: string;
		height?: string;
		class?: string;
	}
	
	let { 
		config,
		width = '100%',
		height = '300px',
		class: className = ''
	}: Props = $props();
	
	let canvas = $state<HTMLCanvasElement>();
	let container = $state<HTMLDivElement>();
	let chartInstance: Chart | null = null;
	
	// Single unified effect for complete chart lifecycle management
	$effect(() => {
		// Early return if prerequisites not met
		if (!canvas || !config) return;
		
		// If chart already exists, update it instead of recreating
		if (chartInstance) {
			// Update existing chart with new config
			chartInstance.data = config.data;
			if (config.options) {
				chartInstance.options = {
					...config.options,
					responsive: true,
					maintainAspectRatio: false
				};
			}
			chartInstance.update('none'); // 'none' for no animation on reactive updates
			return; // Exit early since we're just updating
		}
		
		// Create new chart instance
		chartInstance = new Chart(canvas, {
			...config,
			options: {
				...config.options,
				responsive: true,
				maintainAspectRatio: false
			}
		});
		
		// Set up resize observer if container is available
		let resizeObserver: ResizeObserver | null = null;
		if (container) {
			resizeObserver = new ResizeObserver(() => {
				chartInstance?.resize();
			});
			resizeObserver.observe(container);
		}
		
		// Cleanup function runs when component unmounts
		return () => {
			resizeObserver?.disconnect();
			if (chartInstance) {
				chartInstance.destroy();
				chartInstance = null;
			}
		};
	});
</script>

<div 
	bind:this={container}
	class="chart-container {className}"
	style="width: {width}; height: {height}; position: relative;"
>
	{#if !config}
		<div class="animate-pulse h-full bg-gray-200 rounded flex items-center justify-center">
			<span class="text-gray-500">Loading chart...</span>
		</div>
	{:else}
		<canvas bind:this={canvas}></canvas>
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