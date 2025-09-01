/**
 * Interactive D3.js bar chart component with tooltips and animations.
 *
 * @example
 * ```svelte
 * <BarChart scores={{ math: 85, science: 92, history: 78 }} height={300} />
 *
 * <BarChart
 *   data={{
 *     labels: ['Q1', 'Q2', 'Q3'],
 *     datasets: [{ label: 'Sales', data: [100, 150, 200] }]
 *   }}
 * />
 * ```
 */
<script lang="ts">
	import { onMount } from 'svelte';
	import * as d3 from 'd3';

	interface Props {
		/** Simple scores object for basic bar charts */
		scores?: Record<string, number>;
		/** Chart.js-style data for complex charts */
		data?: {
			labels: string[];
			datasets: Array<{
				label: string;
				data: number[];
				backgroundColor?: string | string[];
				borderColor?: string | string[];
			}>;
		};
		/** Chart height */
		height?: number | string;
		/** Additional CSS classes */
		class?: string;
	}

	let { scores, data, height = 400, class: className = '' }: Props = $props();

	let container: HTMLDivElement;
	let svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
	let tooltip: d3.Selection<HTMLDivElement, unknown, HTMLElement, any>;

	// Default colors matching Chart.js style
	const defaultColors = [
		'rgba(99, 102, 241, 0.8)',
		'rgba(168, 85, 247, 0.8)',
		'rgba(236, 72, 153, 0.8)',
		'rgba(251, 146, 60, 0.8)',
		'rgba(34, 197, 94, 0.8)',
		'rgba(14, 165, 233, 0.8)'
	];

	function drawChart() {
		if (!container) return;

		// Clear previous chart
		d3.select(container).selectAll('*').remove();

		let chartData: Array<{ category: string; value: number; dataset?: string }> = [];
		let datasets: string[] = [];

		if (scores) {
			// Simple scores object
			chartData = Object.entries(scores).map(([key, value]) => ({
				category: key.charAt(0).toUpperCase() + key.slice(1),
				value: typeof value === 'number' ? value : 0
			}));
		} else if (data) {
			// Chart.js style data
			datasets = data.datasets.map((d) => d.label);
			data.labels.forEach((label, labelIndex) => {
				data.datasets.forEach((dataset, datasetIndex) => {
					chartData.push({
						category: label,
						value: dataset.data[labelIndex] || 0,
						dataset: dataset.label
					});
				});
			});
		}

		if (chartData.length === 0) return;

		const margin = { top: 40, right: 30, bottom: 60, left: 80 };
		const containerWidth = container.clientWidth;
		const containerHeight = typeof height === 'string' ? parseInt(height) : height;
		const width = containerWidth - margin.left - margin.right;
		const adjustedHeight = containerHeight - margin.top - margin.bottom;

		// Create SVG
		svg = d3
			.select(container)
			.append('svg')
			.attr('width', containerWidth)
			.attr('height', containerHeight);

		const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

		// Create tooltip
		tooltip = d3
			.select('body')
			.append('div')
			.attr('class', 'chart-tooltip')
			.style('position', 'absolute')
			.style('visibility', 'hidden')
			.style('background', 'rgba(15, 23, 42, 0.9)')
			.style('color', '#f1f5f9')
			.style('padding', '12px')
			.style('border-radius', '8px')
			.style('font-size', '12px')
			.style('pointer-events', 'none')
			.style('z-index', '1000');

		if (datasets.length > 0) {
			// Grouped bar chart for multiple datasets
			const categories = [...new Set(chartData.map((d) => d.category))];

			const x0 = d3.scaleBand().domain(categories).range([0, width]).padding(0.3);

			const x1 = d3.scaleBand().domain(datasets).range([0, x0.bandwidth()]).padding(0.05);

			const y = d3
				.scaleLinear()
				.domain([0, (d3.max(chartData, (d) => d.value) as number) * 1.1])
				.nice()
				.range([adjustedHeight, 0]);

			// Draw bars
			const categoryGroups = g
				.selectAll('.category-group')
				.data(categories)
				.enter()
				.append('g')
				.attr('class', 'category-group')
				.attr('transform', (d) => `translate(${x0(d)},0)`);

			categoryGroups
				.selectAll('rect')
				.data((d) =>
					datasets.map((dataset, i) => ({
						dataset,
						value:
							chartData.find((item) => item.category === d && item.dataset === dataset)?.value || 0,
						category: d,
						color: defaultColors[i % defaultColors.length]
					}))
				)
				.enter()
				.append('rect')
				.attr('x', (d) => x1(d.dataset)!)
				.attr('y', adjustedHeight)
				.attr('width', x1.bandwidth())
				.attr('height', 0)
				.attr('fill', (d) => d.color)
				.attr('rx', 4)
				.on('mouseover', function (event, d) {
					tooltip
						.style('visibility', 'visible')
						.html(`<strong>${d.dataset}</strong><br/>${d.category}: ${d.value.toFixed(1)}`);
					d3.select(this).style('opacity', 0.8);
				})
				.on('mousemove', function (event) {
					tooltip.style('top', event.pageY - 10 + 'px').style('left', event.pageX + 10 + 'px');
				})
				.on('mouseout', function () {
					tooltip.style('visibility', 'hidden');
					d3.select(this).style('opacity', 1);
				})
				.transition()
				.duration(800)
				.delay((d, i) => i * 50)
				.attr('y', (d) => y(d.value))
				.attr('height', (d) => adjustedHeight - y(d.value));

			// X axis
			g.append('g')
				.attr('class', 'x-axis')
				.attr('transform', `translate(0,${adjustedHeight})`)
				.call(d3.axisBottom(x0))
				.selectAll('text')
				.style('fill', '#64748b')
				.style('font-size', '11px');

			// Y axis
			g.append('g')
				.attr('class', 'y-axis')
				.call(d3.axisLeft(y).ticks(6))
				.selectAll('text')
				.style('fill', '#64748b')
				.style('font-size', '11px');

			// Legend
			if (datasets.length > 1) {
				const legend = svg
					.append('g')
					.attr('class', 'legend')
					.attr('transform', `translate(${margin.left}, 10)`);

				const legendItems = legend
					.selectAll('.legend-item')
					.data(datasets)
					.enter()
					.append('g')
					.attr('class', 'legend-item')
					.attr('transform', (d, i) => `translate(${i * 120}, 0)`);

				legendItems
					.append('rect')
					.attr('width', 12)
					.attr('height', 12)
					.attr('fill', (d, i) => defaultColors[i % defaultColors.length])
					.attr('rx', 2);

				legendItems
					.append('text')
					.attr('x', 16)
					.attr('y', 9)
					.text((d) => d)
					.style('font-size', '12px')
					.style('fill', '#64748b');
			}
		} else {
			// Simple bar chart
			const x = d3
				.scaleBand()
				.range([0, width])
				.padding(0.3)
				.domain(chartData.map((d) => d.category));

			const y = d3
				.scaleLinear()
				.range([adjustedHeight, 0])
				.domain([0, (d3.max(chartData, (d) => d.value) as number) * 1.1])
				.nice();

			// Bars with animation
			g.selectAll('.bar')
				.data(chartData)
				.enter()
				.append('rect')
				.attr('class', 'bar')
				.attr('x', (d) => x(d.category)!)
				.attr('y', adjustedHeight)
				.attr('width', x.bandwidth())
				.attr('height', 0)
				.attr('fill', (d, i) => defaultColors[i % defaultColors.length])
				.attr('rx', 4)
				.on('mouseover', function (event, d) {
					tooltip.style('visibility', 'visible').html(`${d.category}: ${d.value.toFixed(1)}`);
					d3.select(this).style('opacity', 0.8);
				})
				.on('mousemove', function (event) {
					tooltip.style('top', event.pageY - 10 + 'px').style('left', event.pageX + 10 + 'px');
				})
				.on('mouseout', function () {
					tooltip.style('visibility', 'hidden');
					d3.select(this).style('opacity', 1);
				})
				.transition()
				.duration(800)
				.delay((d, i) => i * 100)
				.attr('y', (d) => y(d.value))
				.attr('height', (d) => adjustedHeight - y(d.value));

			// X axis
			g.append('g')
				.attr('class', 'x-axis')
				.attr('transform', `translate(0,${adjustedHeight})`)
				.call(d3.axisBottom(x))
				.selectAll('text')
				.style('fill', '#64748b')
				.style('font-size', '11px');

			// Y axis
			g.append('g')
				.attr('class', 'y-axis')
				.call(d3.axisLeft(y).ticks(6))
				.selectAll('text')
				.style('fill', '#64748b')
				.style('font-size', '11px');
		}

		// Grid lines
		g.append('g')
			.attr('class', 'grid')
			.attr('transform', `translate(0,${adjustedHeight})`)
			.call(
				d3
					.axisBottom(d3.scaleBand().range([0, width]).domain([]))
					.tickSize(-adjustedHeight)
					.tickFormat(() => '')
			)
			.style('stroke-dasharray', '3,3')
			.style('opacity', 0.3);

		// Style axes
		g.selectAll('.domain').style('stroke', '#94a3b8');
		g.selectAll('.tick line').style('stroke', '#94a3b8');
	}

	onMount(() => {
		drawChart();

		// Handle resize
		const resizeObserver = new ResizeObserver(() => {
			drawChart();
		});
		resizeObserver.observe(container);

		return () => {
			resizeObserver.disconnect();
			// Clean up tooltip
			if (tooltip) {
				tooltip.remove();
			}
		};
	});

	// Redraw on data change
	$effect(() => {
		if (scores || data) {
			drawChart();
		}
	});
</script>

<div
	bind:this={container}
	class="w-full {className}"
	style="height: {typeof height === 'string' ? height : `${height}px`}"
></div>

<style>
	:global(.chart-tooltip) {
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}
	:global(.grid line) {
		stroke: rgba(148, 163, 184, 0.1);
	}
	:global(.grid path) {
		stroke-width: 0;
	}
</style>
