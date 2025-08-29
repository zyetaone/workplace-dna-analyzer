<!--
Generation Donut Chart - Shows generation distribution
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import * as d3 from 'd3';

	interface ChartData {
		label: string;
		value: number;
		color: string;
	}

	interface Props {
		data: ChartData[];
		width?: number;
		height?: number;
	}

	let { data, width = 300, height = 300 }: Props = $props();

	let svg: SVGSVGElement;
	let tooltip: HTMLDivElement;

	// Chart dimensions
	const margin = 40;
	const radius = Math.min(width, height) / 2 - margin;

	// Color scale
	const color = d3
		.scaleOrdinal()
		.domain(data.map((d) => d.label))
		.range(data.map((d) => d.color));

	onMount(() => {
		if (data.length > 0) {
			drawChart();
		}
	});

	$effect(() => {
		if (data.length > 0) {
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
			.innerRadius(radius * 0.6) // Donut hole
			.outerRadius(radius);

		// Create arcs
		const arcs = g.selectAll('arc').data(pie(data)).enter().append('g').attr('class', 'arc');

		// Add paths
		arcs
			.append('path')
			.attr('d', arc)
			.attr('fill', (d) => color(d.data.label) as string)
			.attr('stroke', '#ffffff')
			.attr('stroke-width', 2)
			.attr('class', 'arc') // Add the arc class
			.style('cursor', 'pointer')
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

		// Add labels
		arcs
			.append('text')
			.attr('transform', (d) => `translate(${arc.centroid(d)})`)
			.attr('text-anchor', 'middle')
			.attr('font-size', '12px')
			.attr('font-weight', 'bold')
			.attr('fill', '#ffffff')
			.text((d) => (d.data.value > 5 ? `${d.data.value}%` : ''));

		// Add center text
		g.append('text')
			.attr('text-anchor', 'middle')
			.attr('dy', '-0.5em')
			.attr('font-size', '16px')
			.attr('font-weight', 'bold')
			.attr('fill', '#374151')
			.text('Generation');

		g.append('text')
			.attr('text-anchor', 'middle')
			.attr('dy', '0.5em')
			.attr('font-size', '16px')
			.attr('font-weight', 'bold')
			.attr('fill', '#374151')
			.text('Distribution');
	}

	function showTooltip(event: MouseEvent, data: ChartData) {
		const tooltipElement = d3.select(tooltip);
		tooltipElement
			.style('opacity', 1)
			.style('left', event.pageX + 10 + 'px')
			.style('top', event.pageY - 10 + 'px').html(`
				<div class="bg-gray-800 text-white px-3 py-2 rounded-lg shadow-lg">
					<div class="font-semibold">${data.label}</div>
					<div class="text-sm">${data.value}% of workforce</div>
				</div>
			`);
	}

	function hideTooltip() {
		d3.select(tooltip).style('opacity', 0);
	}
</script>

<div class="relative">
	<svg bind:this={svg}></svg>

	<!-- Tooltip -->
	<div
		bind:this={tooltip}
		class="absolute pointer-events-none opacity-0 z-10 transition-opacity duration-200"
	></div>
</div>

<style>
	.arc:hover {
		filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
	}

	.arc {
		transition: all 0.2s ease;
	}
</style>
