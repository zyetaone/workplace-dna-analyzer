<script lang="ts">
	import * as d3 from 'd3';
	import { onMount } from 'svelte';

	interface ChartProps {
		config: {
			type: 'bar' | 'pie' | 'doughnut' | 'radar' | 'polarArea';
			data: {
				labels: string[];
				datasets: Array<{
					data: number[];
					backgroundColor?: string[];
					borderColor?: string[];
					label?: string;
				}>;
			};
			options?: any;
		};
		height?: string;
		width?: string;
	}

	let { config, height = '400px', width = '100%' }: ChartProps = $props();
	let container = $state<HTMLDivElement>();

	// Color schemes
	const defaultColors = [
		'#3B82F6', '#EF4444', '#10B981', '#F59E0B',
		'#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
	];

	function createChart() {
		if (!container || !config?.data) return;

		// Clear previous chart
		d3.select(container).selectAll('*').remove();

		const margin = { top: 20, right: 20, bottom: 40, left: 40 };
		const containerWidth = container.clientWidth;
		const containerHeight = parseInt(height) || 400;
		const chartWidth = containerWidth - margin.left - margin.right;
		const chartHeight = containerHeight - margin.top - margin.bottom;

		const svg = d3.select(container)
			.append('svg')
			.attr('width', containerWidth)
			.attr('height', containerHeight);

		const g = svg.append('g')
			.attr('transform', `translate(${margin.left},${margin.top})`);

		switch (config.type) {
			case 'bar':
				createBarChart(g, chartWidth, chartHeight);
				break;
			case 'pie':
			case 'doughnut':
				createPieChart(g, chartWidth, chartHeight, config.type === 'doughnut');
				break;
			case 'radar':
				createRadarChart(g, chartWidth, chartHeight);
				break;
			case 'polarArea':
				createPolarAreaChart(g, chartWidth, chartHeight);
				break;
		}
	}

	function createBarChart(g: any, width: number, height: number) {
		const data = config.data.labels.map((label, i) => ({
			label,
			value: config.data.datasets[0]?.data[i] || 0
		}));

		const x = d3.scaleBand()
			.domain(data.map(d => d.label))
			.range([0, width])
			.padding(0.1);

		const y = d3.scaleLinear()
			.domain([0, d3.max(data, d => d.value) || 0])
			.nice()
			.range([height, 0]);

		// X axis
		g.append('g')
			.attr('transform', `translate(0,${height})`)
			.call(d3.axisBottom(x))
			.selectAll('text')
			.style('text-anchor', 'middle')
			.style('font-size', '12px')
			.style('fill', '#6B7280');

		// Y axis
		g.append('g')
			.call(d3.axisLeft(y))
			.selectAll('text')
			.style('font-size', '12px')
			.style('fill', '#6B7280');

		// Bars
		g.selectAll('.bar')
			.data(data)
			.enter().append('rect')
			.attr('class', 'bar')
			.attr('x', (d: any) => x(d.label) || 0)
			.attr('width', x.bandwidth())
			.attr('y', (d: any) => y(d.value))
			.attr('height', (d: any) => height - y(d.value))
			.attr('fill', (d: any, i: number) => config.data.datasets[0]?.backgroundColor?.[i] || defaultColors[i % defaultColors.length])
			.attr('rx', 4)
			.style('opacity', 0.8)
			.on('mouseover', function() {
				d3.select(this).style('opacity', 1);
			})
			.on('mouseout', function() {
				d3.select(this).style('opacity', 0.8);
			});

		// Value labels on top of bars
		g.selectAll('.label')
			.data(data)
			.enter().append('text')
			.attr('class', 'label')
			.attr('x', (d: any) => (x(d.label) || 0) + x.bandwidth() / 2)
			.attr('y', (d: any) => y(d.value) - 5)
			.attr('text-anchor', 'middle')
			.style('font-size', '12px')
			.style('fill', '#374151')
			.style('font-weight', 'bold')
			.text((d: any) => d.value);
	}

	function createPieChart(g: any, width: number, height: number, isDoughnut = false) {
		const radius = Math.min(width, height) / 2;
		const innerRadius = isDoughnut ? radius * 0.4 : 0;

		g.attr('transform', `translate(${width / 2},${height / 2})`);

		const pie = d3.pie<number>()
			.value(d => d)
			.sort(null);

		const arc = d3.arc()
			.innerRadius(innerRadius)
			.outerRadius(radius);

		const data = config.data.datasets[0]?.data || [];

		const arcs = g.selectAll('.arc')
			.data(pie(data))
			.enter().append('g')
			.attr('class', 'arc');

		arcs.append('path')
			.attr('d', arc)
			.attr('fill', (d: any, i: number) => config.data.datasets[0]?.backgroundColor?.[i] || defaultColors[i % defaultColors.length])
			.style('opacity', 0.8)
			.on('mouseover', function() {
				d3.select(this).style('opacity', 1);
			})
			.on('mouseout', function() {
				d3.select(this).style('opacity', 0.8);
			});

		// Labels
		arcs.append('text')
			.attr('transform', (d: any) => `translate(${arc.centroid(d)})`)
			.attr('text-anchor', 'middle')
			.style('font-size', '12px')
			.style('fill', 'white')
			.style('font-weight', 'bold')
			.text((d: any, i: number) => config.data.labels[i]);
	}

	function createRadarChart(g: any, width: number, height: number) {
		const radius = Math.min(width, height) / 2;
		const centerX = width / 2;
		const centerY = height / 2;

		g.attr('transform', `translate(${centerX},${centerY})`);

		const labels = config.data.labels;
		const data = config.data.datasets[0]?.data || [];
		const maxValue = Math.max(...data, 10);

		// Create scales
		const angleSlice = (Math.PI * 2) / labels.length;

		// Draw grid circles
		const levels = 5;
		for (let i = 1; i <= levels; i++) {
			g.append('circle')
				.attr('cx', 0)
				.attr('cy', 0)
				.attr('r', (radius / levels) * i)
				.style('fill', 'none')
				.style('stroke', '#e5e7eb')
				.style('stroke-width', 1);
		}

		// Draw axis lines
		labels.forEach((label: string, i: number) => {
			const angle = angleSlice * i - Math.PI / 2;
			const x = radius * Math.cos(angle);
			const y = radius * Math.sin(angle);

			g.append('line')
				.attr('x1', 0)
				.attr('y1', 0)
				.attr('x2', x)
				.attr('y2', y)
				.style('stroke', '#e5e7eb')
				.style('stroke-width', 1);

			// Add labels
			g.append('text')
				.attr('x', x * 1.1)
				.attr('y', y * 1.1)
				.attr('text-anchor', 'middle')
				.attr('dominant-baseline', 'central')
				.style('font-size', '12px')
				.style('fill', '#374151')
				.text(label);
		});

		// Draw data polygon
		const lineGenerator = d3.line()
			.x((d: any, i: number) => {
				const angle = angleSlice * i - Math.PI / 2;
				return (radius * d / maxValue) * Math.cos(angle);
			})
			.y((d: any, i: number) => {
				const angle = angleSlice * i - Math.PI / 2;
				return (radius * d / maxValue) * Math.sin(angle);
			})
			.curve(d3.curveLinearClosed);

		g.append('path')
			.datum(data)
			.attr('d', lineGenerator)
			.style('fill', config.data.datasets[0]?.backgroundColor?.[0] || defaultColors[0])
			.style('fill-opacity', 0.3)
			.style('stroke', config.data.datasets[0]?.borderColor?.[0] || defaultColors[0])
			.style('stroke-width', 2);

		// Add data points
		data.forEach((value: number, i: number) => {
			const angle = angleSlice * i - Math.PI / 2;
			const x = (radius * value / maxValue) * Math.cos(angle);
			const y = (radius * value / maxValue) * Math.sin(angle);

			g.append('circle')
				.attr('cx', x)
				.attr('cy', y)
				.attr('r', 4)
				.style('fill', config.data.datasets[0]?.borderColor?.[0] || defaultColors[0])
				.style('stroke', 'white')
				.style('stroke-width', 2);
		});
	}

	function createPolarAreaChart(g: any, width: number, height: number) {
		const radius = Math.min(width, height) / 2;
		g.attr('transform', `translate(${width / 2},${height / 2})`);

		const data = config.data.datasets[0]?.data || [];
		const maxValue = Math.max(...data);

		const angleSlice = (Math.PI * 2) / data.length;

		data.forEach((value: number, i: number) => {
			const startAngle = angleSlice * i;
			const endAngle = angleSlice * (i + 1);
			const currentRadius = (value / maxValue) * radius;

			const arc = d3.arc()
				.innerRadius(0)
				.outerRadius(currentRadius)
				.startAngle(startAngle)
				.endAngle(endAngle);

			g.append('path')
				.attr('d', arc)
				.attr('fill', config.data.datasets[0]?.backgroundColor?.[i] || defaultColors[i % defaultColors.length])
				.style('opacity', 0.8)
				.on('mouseover', function() {
					d3.select(this).style('opacity', 1);
				})
				.on('mouseout', function() {
					d3.select(this).style('opacity', 0.8);
				});
		});
	}

	onMount(() => {
		createChart();
	});

	// Recreate chart when config changes
	$effect(() => {
		if (container && config) {
			createChart();
		}
	});
</script>

<div bind:this={container} style="width: {width}; height: {height};" class="chart-container"></div>

<style>
	.chart-container {
		overflow: visible;
	}
</style>