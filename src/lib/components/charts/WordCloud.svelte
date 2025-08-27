<!-- D3 Word Cloud Component using {@attach} -->
<script lang="ts">
	import * as d3 from 'd3';
	import cloud from 'd3-cloud';
	
	interface WordData {
		text: string;
		size: number;
	}
	
	interface Props {
		words: WordData[];
		width?: number;
		height?: number;
		class?: string;
	}
	
	let { 
		words = [],
		width = 500,
		height = 400,
		class: className = ''
	}: Props = $props();
	
	// Color mapping for conceptual words
	const colorMap: Record<string, string> = {
		'Collaborative': '#3b82f6',
		'Digital-First': '#10b981',
		'Wellness-Focused': '#ef4444',
		'Structured': '#f59e0b',
		'Technology': '#10b981',
		'Wellness': '#ef4444',
		'Collaboration': '#3b82f6',
		'Structure': '#f59e0b',
		'Millennial': '#8b5cf6',
		'Gen Z': '#ec4899',
		'Gen X': '#6366f1',
		'Baby Boomer': '#14b8a6'
	};
	
	function getColor(text: string): string {
		return colorMap[text] || '#6b7280';
	}
	
	// Word cloud attachment function
	function wordCloudAttachment(container: HTMLDivElement) {
		let resizeObserver: ResizeObserver | null = null;
		
		function drawWordCloud() {
			// Clear existing content
			d3.select(container).selectAll('*').remove();
			
			if (!words || words.length === 0) return;
			
			// Get actual container dimensions
			const containerRect = container.getBoundingClientRect();
			const actualWidth = containerRect.width || width;
			const actualHeight = containerRect.height || height;
			
			// Create SVG
			const svg = d3.select(container)
				.append('svg')
				.attr('width', actualWidth)
				.attr('height', actualHeight);
			
			// Create group for centering
			const g = svg.append('g')
				.attr('transform', `translate(${actualWidth/2},${actualHeight/2})`);
			
			// Draw function
			function draw(cloudWords: any[]) {
				const text = g.selectAll('text')
					.data(cloudWords)
					.enter().append('text')
					.style('font-size', d => `${d.size}px`)
					.style('font-family', 'Impact, Arial Black, sans-serif')
					.style('font-weight', 'bold')
					.style('fill', d => getColor(d.text))
					.style('cursor', 'pointer')
					.attr('text-anchor', 'middle')
					.attr('transform', d => `translate(${d.x},${d.y})rotate(${d.rotate})`)
					.text(d => d.text)
					.style('opacity', 0);
				
				// Add hover interactions
				text.on('mouseover', function(event, d) {
					d3.select(this)
						.transition()
						.duration(200)
						.style('font-size', `${d.size * 1.2}px`)
						.style('opacity', 1);
				})
				.on('mouseout', function(event, d) {
					d3.select(this)
						.transition()
						.duration(200)
						.style('font-size', `${d.size}px`)
						.style('opacity', 0.9);
				});
				
				// Fade in animation
				text.transition()
					.duration(600)
					.style('opacity', 0.9);
			}
			
			// Create word cloud layout
			const layout = cloud()
				.size([actualWidth, actualHeight])
				.words(words.map(d => ({ text: d.text, size: d.size })))
				.padding(5)
				.rotate(() => ~~(Math.random() * 2) * 90) // 0 or 90 degrees
				.font('Impact')
				.fontSize(d => d.size || 20)
				.on('end', draw);
			
			layout.start();
		}
		
		// Initial draw
		drawWordCloud();
		
		// Set up resize observer
		resizeObserver = new ResizeObserver(() => {
			const rect = container.getBoundingClientRect();
			if (rect.width > 0 && rect.height > 0) {
				drawWordCloud();
			}
		});
		resizeObserver.observe(container);
		
		// Effect to redraw when props change
		$effect(() => {
			words;
			width;
			height;
			drawWordCloud();
		});
		
		return () => {
			// Cleanup function
			if (resizeObserver) {
				resizeObserver.disconnect();
			}
			d3.select(container).selectAll('*').remove();
		};
	}
</script>

{#if !words || words.length === 0}
	<div 
		class="word-cloud-container {className}"
		style="width: 100%; height: {height}px; position: relative;"
	>
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