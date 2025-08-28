<!-- Simple D3 Donut Chart -->
<script lang="ts">
	import { onMount } from 'svelte';
	import * as d3 from 'd3';
	
	let { data, height = 400, class: className = '' } = $props();
	
	let container: HTMLDivElement;
	
	onMount(() => {
		if (!data?.data?.labels || !data?.data?.datasets?.[0] || !container) return;
		
		const width = container.clientWidth;
		const radius = Math.min(width, height) / 2;
		
		const svg = d3.select(container)
			.append('svg')
			.attr('width', width)
			.attr('height', height);
		
		const g = svg.append('g')
			.attr('transform', `translate(${width/2},${height/2})`);
		
		const color = d3.scaleOrdinal()
			.domain(data.data.labels)
			.range(data.data.datasets[0].backgroundColor);
		
		const pie = d3.pie()
			.value(d => d);
		
		const arc = d3.arc()
			.innerRadius(radius * 0.6)
			.outerRadius(radius);
		
		const arcs = g.selectAll('arc')
			.data(pie(data.data.datasets[0].data))
			.enter()
			.append('g');
		
		arcs.append('path')
			.attr('d', arc as any)
			.attr('fill', (d, i) => data.data.datasets[0].backgroundColor[i]);
		
		// Add labels
		arcs.append('text')
			.attr('transform', d => `translate(${arc.centroid(d as any)})`)
			.attr('text-anchor', 'middle')
			.text((d, i) => data.data.labels[i])
			.style('fill', 'white')
			.style('font-size', '12px');
	});
</script>

<div bind:this={container} class="w-full {className}"></div>