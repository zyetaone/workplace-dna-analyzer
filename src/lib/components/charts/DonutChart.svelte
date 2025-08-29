<!--
	UNIFIED D3 DONUT CHART COMPONENT
	Consolidates D3DonutChart and GenerationDonutChart with variant system
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import * as d3 from 'd3';

	// Support both data formats
	interface ChartData {
		label: string;
		value: number;
		color: string;
	}

	interface ChartJSData {
		data: {
			labels: string[];
			datasets: Array<{
				data: number[];
				backgroundColor: string[];
			}>;
		};
	}

	interface Props {
		/** Chart data - supports both formats */
		data: ChartData[] | ChartJSData;
		/** Chart width */
		width?: number;
		/** Chart height */
		height?: number;
		/** Visual variant */
		variant?: 'simple' | 'interactive' | 'generation';
		/** Show center text (generation variant) */
		centerText?: string;
		/** Show tooltips on hover */
		showTooltips?: boolean;
		/** Custom class */
		class?: string;
		/** Inner radius ratio (0-1) */
		innerRadius?: number;
		/** Show percentage labels */
		showPercentages?: boolean;
		/** Minimum percentage to show label */
		minPercentageForLabel?: number;
	}

	let {
		data,
		width = 300,
		height = 300,
		variant = 'simple',
		centerText,
		showTooltips = variant === 'interactive' || variant === 'generation',
		class: className = '',
		innerRadius = 0.6,
		showPercentages = variant === 'generation',
		minPercentageForLabel = 5
	}: Props = $props();

	let svg: SVGSVGElement;
	let tooltip = $state<HTMLDivElement>();

	// Chart dimensions
	const margin = 40;
	const radius = Math.min(width, height) / 2 - margin;

	// Normalize data to ChartData format
	$effect(() => {
		if (data && Array.isArray(data)) {
			// Already ChartData format
			normalizedData = data;
		} else if (data && 'data' in data) {
			// Convert from ChartJS format
			const chartJSData = data as ChartJSData;
			normalizedData = chartJSData.data.labels.map((label, i) => ({
				label,
				value: chartJSData.data.datasets[0].data[i],
				color: chartJSData.data.datasets[0].backgroundColor[i]
			}));
		}
	});

	let normalizedData: ChartData[] = [];

	// Color scale
	const color = d3
		.scaleOrdinal()
		.domain(normalizedData.map((d) => d.label))
		.range(normalizedData.map((d) => d.color));

	onMount(() => {
		if (normalizedData.length > 0) {
			drawChart();
		}
	});

	$effect(() => {
		if (normalizedData.length > 0) {
			drawChart();
		}
	});

	function drawChart() {
		// Clear previous chart
		d3.select(svg).selectAll('*').remove();

		const svgElement = d3.select(svg).attr('width', width).attr('height', height);

		const g = svgElement.append('g').attr('transform', `translate(${width / 2}, ${height / 2})`);

		// Create pie generator
		const pie = d3
			.pie<ChartData>()
			.value((d) => d.value)
			.sort(null);

		// Create arc generator
		const arc = d3
			.arc<d3.PieArcDatum<ChartData>>()
			.innerRadius(radius * innerRadius)
			.outerRadius(radius);

		// Create arcs
		const arcs = g
			.selectAll('arc')
			.data(pie(normalizedData))
			.enter()
			.append('g')
			.attr('class', 'arc');

		// Add paths
		const paths = arcs
			.append('path')
			.attr('d', arc)
			.attr('fill', (d) => color(d.data.label) as string)
			.attr('stroke', variant === 'generation' ? '#ffffff' : 'none')
			.attr('stroke-width', variant === 'generation' ? 2 : 0)
			.attr('class', 'arc-path')
			.style('cursor', showTooltips ? 'pointer' : 'default');

		// Add interactivity for interactive/generation variants
		if (showTooltips) {
			paths
				.on('mouseover', function (event, d) {
					// Highlight
					d3.select(this).transition().duration(200).attr('transform', 'scale(1.05)');

					// Show tooltip
					showTooltip(event, d.data);
				})
				.on('mouseout', function () {
					// Remove highlight
					d3.select(this).transition().duration(200).attr('transform', 'scale(1)');

					// Hide tooltip
					hideTooltip();
				});
		}

		// Add labels
		if (showPercentages) {
			arcs
				.append('text')
				.attr('transform', (d) => `translate(${arc.centroid(d)})`)
				.attr('text-anchor', 'middle')
				.attr('font-size', '12px')
				.attr('font-weight', 'bold')
				.attr('fill', '#ffffff')
				.text((d) => (d.data.value > minPercentageForLabel ? `${d.data.value}%` : ''));
		} else {
			// Simple labels for basic variant
			arcs
				.append('text')
				.attr('transform', (d) => `translate(${arc.centroid(d)})`)
				.attr('text-anchor', 'middle')
				.attr('font-size', '12px')
				.attr('fill', '#ffffff')
				.text((d, i) => normalizedData[i].label);
		}

		// Add center text for generation variant
		if (variant === 'generation' && centerText) {
			const centerGroup = g.append('g').attr('class', 'center-text');

			centerGroup
				.append('text')
				.attr('text-anchor', 'middle')
				.attr('dy', '-0.5em')
				.attr('font-size', '16px')
				.attr('font-weight', 'bold')
				.attr('fill', '#374151')
				.text(centerText);

			centerGroup
				.append('text')
				.attr('text-anchor', 'middle')
				.attr('dy', '0.5em')
				.attr('font-size', '14px')
				.attr('font-weight', '500')
				.attr('fill', '#6b7280')
				.text('Distribution');
		}
	}

	function showTooltip(event: MouseEvent, data: ChartData) {
		if (!tooltip) return;

		const tooltipElement = d3.select(tooltip);
		tooltipElement
			.style('opacity', 1)
			.style('left', event.pageX + 10 + 'px')
			.style('top', event.pageY - 10 + 'px').html(`
				<div class="bg-gray-800 text-white px-3 py-2 rounded-lg shadow-lg border border-gray-600">
					<div class="font-semibold text-sm">${data.label}</div>
					<div class="text-xs text-gray-300">${data.value}${variant === 'generation' ? '%' : ''}</div>
				</div>
			`);
	}

	function hideTooltip() {
		if (tooltip) {
			d3.select(tooltip).style('opacity', 0);
		}
	}
</script>

<div class="relative {className}">
	<svg bind:this={svg}></svg>

	<!-- Tooltip for interactive variants -->
	{#if showTooltips}
		<div
			bind:this={tooltip}
			class="absolute pointer-events-none opacity-0 z-10 transition-opacity duration-200"
		></div>
	{/if}
</div>

<style>
	.arc-path {
		transition: all 0.2s ease;
	}

	/* Center text styling */
	.center-text {
		pointer-events: none;
	}

	/* Responsive adjustments */
	@media (max-width: 640px) {
		svg {
			width: 100%;
			height: auto;
		}
	}
</style>
