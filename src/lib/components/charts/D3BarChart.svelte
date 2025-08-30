<!-- Simple D3 Bar Chart -->
<script lang="ts">
	import { onMount } from 'svelte';
	import * as d3 from 'd3';
	
	let { scores, height = 400, class: className = '' } = $props();
	
	let container: HTMLDivElement;
	
	onMount(() => {
		if (!scores || !container || Object.keys(scores).length === 0) return;
		
		const data = Object.entries(scores).map(([key, value]) => ({
			category: key.charAt(0).toUpperCase() + key.slice(1),
			value: typeof value === 'number' ? value : 0
		}));
		
		const margin = { top: 20, right: 30, bottom: 40, left: 60 };
		const width = container.clientWidth - margin.left - margin.right;
		const adjustedHeight = height - margin.top - margin.bottom;
		
		const svg = d3.select(container)
			.append('svg')
			.attr('width', width + margin.left + margin.right)
			.attr('height', height);
		
		const g = svg.append('g')
			.attr('transform', `translate(${margin.left},${margin.top})`);
		
		const x = d3.scaleBand()
			.range([0, width])
			.padding(0.3)
			.domain(data.map(d => d.category));
		
		const y = d3.scaleLinear()
			.range([adjustedHeight, 0])
			.domain([0, 10]);
		
		// Bars
		g.selectAll('.bar')
			.data(data)
			.enter().append('rect')
			.attr('class', 'bar')
			.attr('x', d => x(d.category)!)
			.attr('y', d => y(d.value))
			.attr('width', x.bandwidth())
			.attr('height', d => adjustedHeight - y(d.value))
			.attr('fill', '#3B82F6');
		
		// X axis
		g.append('g')
			.attr('transform', `translate(0,${adjustedHeight})`)
			.call(d3.axisBottom(x));
		
		// Y axis
		g.append('g')
			.call(d3.axisLeft(y));
	});
</script>

<div bind:this={container} class="w-full {className}"></div>