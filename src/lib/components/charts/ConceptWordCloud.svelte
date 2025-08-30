<!--
Concept Word Cloud - Shows AI-generated workplace concepts
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import * as d3 from 'd3';
	import cloud from 'd3-cloud';

	interface Concept {
		text: string;
		size: number;
		category: string;
		confidence: number;
	}

	interface Props {
		concepts: Concept[];
		width?: number;
		height?: number;
		onRefresh?: () => void;
	}

	let { concepts, width = 600, height = 400, onRefresh }: Props = $props();

	let svg = $state<SVGSVGElement>();
	let container: HTMLDivElement;
	let isLoading = $state(false);

	// Color scale for categories
	const categoryColors: Record<string, string> = {
		collaboration: '#3B82F6',
		technology: '#10B981',
		wellness: '#F59E0B',
		innovation: '#EF4444',
		creativity: '#8B5CF6',
		flexibility: '#06B6D4',
		productivity: '#84CC16'
	};

	onMount(() => {
		if (concepts.length > 0) {
			generateWordCloud();
		}
	});

	$effect(() => {
		if (concepts.length > 0) {
			generateWordCloud();
		}
	});

	async function generateWordCloud() {
		if (concepts.length === 0) return;

		isLoading = true;

		// Clear previous cloud
		d3.select(svg).selectAll('*').remove();

		const svgElement = d3.select(svg).attr('width', width).attr('height', height);

		const g = svgElement.append('g').attr('transform', `translate(${width / 2}, ${height / 2})`);

		// Prepare words for cloud
		const words = concepts.map((concept) => ({
			text: concept.text,
			size: Math.max(12, Math.min(60, concept.size * 3)),
			category: concept.category,
			confidence: concept.confidence
		}));

		// Create word cloud layout
		const layout = cloud()
			.size([width - 40, height - 40])
			.words(words)
			.padding(5)
			.rotate(() => (Math.random() > 0.5 ? 0 : 90))
			.font('Inter')
			.fontSize((d) => (d as any).size)
			.on('end', draw);

		layout.start();

		function draw(words: any[]) {
			const text = g
				.selectAll('text')
				.data(words)
				.enter()
				.append('text')
				.style('font-size', (d) => `${d.size}px`)
				.style('font-family', 'Inter, sans-serif')
				.style('fill', (d) => {
					const category = (d as any).category;
					return categoryColors[category] || '#6B7280';
				})
				.attr('text-anchor', 'middle')
				.attr('transform', (d) => `translate(${d.x}, ${d.y}) rotate(${d.rotate})`)
				.style('cursor', 'pointer')
				.text((d) => d.text)
				.on('mouseover', function (event, d) {
					// Highlight word
					d3.select(this)
						.transition()
						.duration(200)
						.style('opacity', 0.7)
						.style('font-weight', 'bold');

					// Show tooltip
					showTooltip(event, d);
				})
				.on('mouseout', function () {
					// Remove highlight
					d3.select(this)
						.transition()
						.duration(200)
						.style('opacity', 1)
						.style('font-weight', 'normal');

					// Hide tooltip
					hideTooltip();
				})
				.on('click', function (event, d) {
					// Copy concept to clipboard
					navigator.clipboard.writeText((d as any).text);
					showNotification('Concept copied to clipboard!');
				});

			isLoading = false;
		}
	}

	function showTooltip(event: MouseEvent, data: any) {
		// Create tooltip
		const tooltip = d3
			.select(container)
			.append('div')
			.attr(
				'class',
				'absolute bg-gray-800 text-white px-3 py-2 rounded-lg shadow-lg pointer-events-none z-10'
			)
			.style('left', event.offsetX + 10 + 'px')
			.style('top', event.offsetY - 10 + 'px').html(`
				<div class="text-sm">
					<div class="font-semibold">${data.text}</div>
					<div class="text-xs opacity-80">Category: ${data.category}</div>
					<div class="text-xs opacity-80">Confidence: ${Math.round(data.confidence * 100)}%</div>
					<div class="text-xs opacity-60 mt-1">Click to copy</div>
				</div>
			`);

		// Remove tooltip after 3 seconds
		setTimeout(() => {
			tooltip.remove();
		}, 3000);
	}

	function hideTooltip() {
		d3.select(container).selectAll('.absolute').remove();
	}

	function showNotification(message: string) {
		const notification = d3
			.select(container)
			.append('div')
			.attr(
				'class',
				'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-20'
			)
			.text(message);

		setTimeout(() => {
			notification.remove();
		}, 2000);
	}

	async function handleRefresh() {
		if (onRefresh) {
			isLoading = true;
			await onRefresh();
			isLoading = false;
		}
	}
</script>

<div
	bind:this={container}
	class="relative bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6"
>
	<div class="flex items-center justify-between mb-4">
		<div>
			<h3 class="text-lg font-semibold text-gray-800">AI-Generated Concepts</h3>
			<p class="text-sm text-gray-600">Click any concept to copy it</p>
		</div>

		{#if onRefresh}
			<button
				onclick={handleRefresh}
				disabled={isLoading}
				class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
			>
				{#if isLoading}
					<div
						class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
					></div>
				{:else}
					<span>🔄</span>
				{/if}
				Refresh Concepts
			</button>
		{/if}
	</div>

	{#if concepts.length === 0}
		<div class="flex items-center justify-center h-64 text-gray-500">
			<div class="text-center">
				<div class="text-4xl mb-2">💭</div>
				<p>No concepts generated yet</p>
				<p class="text-sm">Complete some quiz responses to see AI-generated concepts</p>
			</div>
		</div>
	{:else}
		<svg bind:this={svg} class="w-full h-64"></svg>

		<div class="mt-4 flex flex-wrap gap-2">
			{#each Object.entries(categoryColors) as [category, color]}
				<div class="flex items-center gap-1 text-xs">
					<div class="w-3 h-3 rounded" style="background-color: {color}"></div>
					<span class="capitalize">{category}</span>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	/* Custom font for word cloud */
	@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
</style>
