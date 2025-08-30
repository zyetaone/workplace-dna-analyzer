<!-- D3 Word Cloud Component -->
<script lang="ts">
	import * as d3 from 'd3';
	import cloud from 'd3-cloud';

	interface WordData {
		text: string;
		size: number;
	}

	let { 
		words = [],
		width = 500,
		height = 400,
		class: className = ''
	}: { words: WordData[]; width?: number; height?: number; class?: string } = $props();

	const colorMap = {
		'Collaborative': '#3b82f6', 'Digital-First': '#10b981', 'Wellness-Focused': '#ef4444',
		'Structured': '#f59e0b', 'Technology': '#10b981', 'Wellness': '#ef4444',
		'Collaboration': '#3b82f6', 'Structure': '#f59e0b', 'Millennial': '#8b5cf6',
		'Gen Z': '#ec4899', 'Gen X': '#6366f1', 'Baby Boomer': '#14b8a6'
	} as const;

	function wordCloudAttachment(container: HTMLDivElement) {
		let resizeObserver: ResizeObserver | null = null;
		
		function drawWordCloud() {
			d3.select(container).selectAll('*').remove();
			if (!words?.length) return;
			
			const rect = container.getBoundingClientRect();
			const w = rect.width || width;
			const h = rect.height || height;
			
			const svg = d3.select(container)
				.append('svg')
				.attr('width', w)
				.attr('height', h);
			
			const g = svg.append('g')
				.attr('transform', `translate(${w/2},${h/2})`);
			
			function draw(cloudWords: any[]) {
				g.selectAll('text')
					.data(cloudWords)
					.enter().append('text')
					.style('font', d => `bold ${d.size}px Impact, Arial Black, sans-serif`)
					.style('fill', d => colorMap[d.text as keyof typeof colorMap] || '#6b7280')
					.style('cursor', 'pointer')
					.attr('text-anchor', 'middle')
					.attr('transform', d => `translate(${d.x},${d.y})rotate(${d.rotate})`)
					.text(d => d.text)
					.style('opacity', 0)
					.on('mouseover', function(event, d) {
						d3.select(this).transition().duration(200)
							.style('font-size', `${d.size * 1.2}px`).style('opacity', 1);
					})
					.on('mouseout', function(event, d) {
						d3.select(this).transition().duration(200)
							.style('font-size', `${d.size}px`).style('opacity', 0.9);
					})
					.transition().duration(600).style('opacity', 0.9);
			}
			
			cloud()
				.size([w, h])
				.words(words.map(d => ({ text: d.text, size: d.size })))
				.padding(5)
				.rotate(() => ~~(Math.random() * 2) * 90)
				.font('Impact')
				.fontSize(d => d.size || 20)
				.on('end', draw)
				.start();
		}
		
		drawWordCloud();
		
		resizeObserver = new ResizeObserver(() => {
			const rect = container.getBoundingClientRect();
			if (rect.width > 0 && rect.height > 0) drawWordCloud();
		});
		resizeObserver.observe(container);
		
		$effect(() => {
			words; width; height;
			drawWordCloud();
		});
		
		return () => {
			resizeObserver?.disconnect();
			d3.select(container).selectAll('*').remove();
		};
	}
</script>

{#if !words?.length}
	<div class="word-cloud-container {className}" style="width: 100%; height: {height}px; position: relative;">
		<div class="flex items-center justify-center h-full">
			<p class="text-gray-500">No data available</p>
		</div>
	</div>
{:else}
	<div 
		{@attach wordCloudAttachment}
		class="word-cloud-container {className}"
		style="width: 100%; height: {height}px; position: relative;"
	></div>
{/if}

<style>
	.word-cloud-container {
		display: block;
		min-height: 200px;
	}
</style>