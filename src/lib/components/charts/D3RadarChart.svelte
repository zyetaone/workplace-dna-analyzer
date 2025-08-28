<!-- Simple D3 Radar Chart -->
<script lang="ts">
	import { onMount } from 'svelte';
	import * as d3 from 'd3';
	
	let { data, height = 400, class: className = '' } = $props();
	
	let container: HTMLDivElement;
	
	onMount(() => {
		if (!data || !container) return;
		
		// Check for proper data structure
		if (!data.data?.labels || !data.data?.datasets?.[0]?.data) {
			console.warn('D3RadarChart: Invalid data structure', data);
			return;
		}
		
		const width = container.clientWidth;
		const radius = Math.min(width, height) / 2 - 40;
		
		const svg = d3.select(container)
			.append('svg')
			.attr('width', width)
			.attr('height', height);
		
		const g = svg.append('g')
			.attr('transform', `translate(${width/2},${height/2})`);
		
		const labels = data.data.labels;
		const dataset = data.data.datasets[0];
		const angleSlice = Math.PI * 2 / labels.length;
		
		// Scales
		const rScale = d3.scaleLinear()
			.range([0, radius])
			.domain([0, 10]);
		
		// Grid circles
		const levels = 5;
		for (let level = 1; level <= levels; level++) {
			g.append('circle')
				.attr('r', radius / levels * level)
				.style('fill', 'none')
				.style('stroke', '#CDCDCD')
				.style('stroke-opacity', 0.5);
		}
		
		// Axis lines
		const axis = g.selectAll('.axis')
			.data(labels)
			.enter()
			.append('g')
			.attr('class', 'axis');
		
		axis.append('line')
			.attr('x1', 0)
			.attr('y1', 0)
			.attr('x2', (d, i) => rScale(10) * Math.cos(angleSlice * i - Math.PI / 2))
			.attr('y2', (d, i) => rScale(10) * Math.sin(angleSlice * i - Math.PI / 2))
			.style('stroke', '#CDCDCD')
			.style('stroke-width', '1px');
		
		// Axis labels
		axis.append('text')
			.attr('x', (d, i) => rScale(10.5) * Math.cos(angleSlice * i - Math.PI / 2))
			.attr('y', (d, i) => rScale(10.5) * Math.sin(angleSlice * i - Math.PI / 2))
			.style('font-size', '12px')
			.attr('text-anchor', 'middle')
			.text(d => d);
		
		// Data area
		const radarLine = d3.lineRadial()
			.radius(d => rScale(d as number))
			.angle((d, i) => i * angleSlice)
			.curve(d3.curveLinearClosed);
		
		g.append('path')
			.datum(dataset.data)
			.attr('d', radarLine as any)
			.style('fill', dataset.backgroundColor || '#3B82F6')
			.style('fill-opacity', 0.4)
			.style('stroke', dataset.borderColor || '#3B82F6')
			.style('stroke-width', '2px');
	});
</script>

<div bind:this={container} class="w-full {className}"></div>