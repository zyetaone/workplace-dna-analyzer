<!--
 UNIFIED D3 Word Cloud Component with multiple variants -->
<script lang="ts">
	import { onMount } from 'svelte';
	import * as d3 from 'd3';
	import cloud from 'd3-cloud';

	interface WordData {
		text: string;
		size: number;
	}

	interface Concept {
		text: string;
		size: number;
		category: string;
		confidence: number;
	}

	interface Props {
		/** Word data - supports both simple words and concepts */
		words?: WordData[];
		concepts?: Concept[];
		/** Chart dimensions */
		width?: number;
		height?: number;
		/** Visual variant */
		variant?: 'simple' | 'concepts';
		/** Refresh callback for concepts variant */
		onRefresh?: () => void;
		/** Custom class */
		class?: string;
	}

	let {
		words = [],
		concepts = [],
		width = 500,
		height = 400,
		variant = 'simple',
		onRefresh,
		class: className = ''
	}: Props = $props();

	let svg = $state<SVGSVGElement>();
	let container = $state<HTMLDivElement>();
	let isLoading = $state(false);

	// Color mappings
	const simpleColorMap = {
		Collaborative: '#3b82f6',
		'Digital-First': '#10b981',
		'Wellness-Focused': '#ef4444',
		Structured: '#f59e0b',
		Technology: '#10b981',
		Wellness: '#ef4444',
		Collaboration: '#3b82f6',
		Structure: '#f59e0b',
		Millennial: '#8b5cf6',
		'Gen Z': '#ec4899',
		'Gen X': '#6366f1',
		'Baby Boomer': '#14b8a6'
	} as const;

	const categoryColors: Record<string, string> = {
		collaboration: '#3B82F6',
		technology: '#10B981',
		wellness: '#F59E0B',
		innovation: '#EF4444',
		creativity: '#8B5CF6',
		flexibility: '#06B6D4',
		productivity: '#84CC16'
	};

	// Normalize data based on variant
	const normalizedWords = $derived(() => {
		if (variant === 'concepts' && concepts.length > 0) {
			return concepts.map((concept) => ({
				text: concept.text,
				size: Math.max(12, Math.min(60, concept.size * 3)),
				category: concept.category,
				confidence: concept.confidence
			}));
		} else if (variant === 'simple' && words.length > 0) {
			return words.map((word) => ({
				text: word.text,
				size: word.size,
				category: word.text,
				confidence: 1
			}));
		}
		return [];
	});

	// Initialize word cloud for concepts variant
	onMount(() => {
		if (variant === 'concepts' && normalizedWords.length > 0) {
			generateWordCloud(container);
		}
	});

	$effect(() => {
		if (variant === 'concepts' && normalizedWords.length > 0) {
			generateWordCloud(container);
		}
	});
	function generateWordCloud(container: HTMLDivElement) {
		let resizeObserver: ResizeObserver | null = null;

		function drawWordCloud() {
			d3.select(container).selectAll('*').remove();
			if (!normalizedWords?.length) return;

			const rect = container.getBoundingClientRect();
			const w = rect.width || width;
			const h = rect.height || height;

			const svgElement = d3.select(container).append('svg').attr('width', w).attr('height', h);

			const g = svgElement.append('g').attr('transform', `translate(${w / 2},${h / 2})`);

			function draw(cloudWords: any[]) {
				const text = g
					.selectAll('text')
					.data(cloudWords)
					.enter()
					.append('text')
					.style('font-size', (d) => `${d.size}px`)
					.style(
						'font-family',
						variant === 'concepts' ? 'Inter, sans-serif' : 'Impact, Arial Black, sans-serif'
					)
					.style('fill', (d) => {
						if (variant === 'concepts') {
							const category = (d as any).category;
							return categoryColors[category] || '#6B7280';
						} else {
							return simpleColorMap[(d as any).text as keyof typeof simpleColorMap] || '#6b7280';
						}
					})
					.attr('text-anchor', 'middle')
					.attr('transform', (d) => `translate(${d.x},${d.y})rotate(${d.rotate})`)
					.style('cursor', 'pointer')
					.text((d) => d.text)
					.on('mouseover', function (event, d) {
						// Highlight word
						d3.select(this)
							.transition()
							.duration(200)
							.style('opacity', 0.7)
							.style('font-weight', 'bold');

						if (variant === 'concepts') {
							showTooltip(event, d);
						}
					})
					.on('mouseout', function () {
						// Remove highlight
						d3.select(this)
							.transition()
							.duration(200)
							.style('opacity', 1)
							.style('font-weight', 'normal');

						if (variant === 'concepts') {
							hideTooltip();
						}
					})
					.on('click', function (event, d) {
						if (variant === 'concepts') {
							// Copy concept to clipboard
							navigator.clipboard.writeText((d as any).text);
							showNotification('Concept copied to clipboard!');
						}
					});

				if (variant === 'simple') {
					text.style('opacity', 0).transition().duration(600).style('opacity', 0.9);
				}
			}

			cloud()
				.size([w, h])
				.words(
					normalizedWords().map((d) => ({
						text: d.text,
						size: d.size,
						category: d.category,
						confidence: d.confidence
					}))
				)
				.padding(5)
				.rotate(() => (Math.random() > 0.5 ? 0 : 90))
				.font(variant === 'concepts' ? 'Inter' : 'Impact')
				.fontSize((d) => (d as any).size)
				.on('end', draw)
				.start();
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

		drawWordCloud();

		resizeObserver = new ResizeObserver(() => {
			const rect = container.getBoundingClientRect();
			if (rect.width > 0 && rect.height > 0) drawWordCloud();
		});
		resizeObserver.observe(container);

		$effect(() => {
			normalizedWords;
			width;
			height;
			drawWordCloud();
		});

		return () => {
			resizeObserver?.disconnect();
			d3.select(container).selectAll('*').remove();
		};
	}

	async function handleRefresh() {
		if (onRefresh) {
			isLoading = true;
			await onRefresh();
			isLoading = false;
		}
	}
</script>

{#if variant === 'concepts'}
	<div
		bind:this={container}
		class="relative rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 p-6 {className}"
	>
		<div class="mb-4 flex items-center justify-between">
			<div>
				<h3 class="mb-1 text-lg font-semibold text-gray-800">AI-Generated Concepts</h3>
				<p class="text-sm text-gray-600">Click any concept to copy it</p>
			</div>

			{#if onRefresh}
				<button
					onclick={handleRefresh}
					disabled={isLoading}
					class="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
				>
					{#if isLoading}
						<div
							class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
						></div>
					{:else}
						<span>🔄</span>
					{/if}
					Refresh Concepts
				</button>
			{/if}
		</div>

		{#if normalizedWords.length === 0}
			<div class="flex h-64 items-center justify-center text-gray-500">
				<div class="text-center">
					<div class="mb-2 text-4xl">💭</div>
					<p>No concepts generated yet</p>
					<p class="text-sm">Complete some quiz responses to see AI-generated concepts</p>
				</div>
			</div>
		{:else}
			<svg bind:this={svg} class="h-64 w-full"></svg>

			<div class="mt-4 flex flex-wrap gap-2">
				{#each Object.entries(categoryColors) as [category, color]}
					<div class="flex items-center gap-1 text-xs">
						<div class="h-3 w-3 rounded" style="background-color: {color}"></div>
						<span class="capitalize">{category}</span>
					</div>
				{/each}
			</div>
		{/if}
	</div>
{:else if normalizedWords.length === 0}
	<div
		class="word-cloud-container {className}"
		style="width: 100%; height: {height}px; position: relative;"
	>
		<div class="flex h-full items-center justify-center">
			<p class="text-gray-500">No data available</p>
		</div>
	</div>
{:else}
	<div
		{@attach generateWordCloud}
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
