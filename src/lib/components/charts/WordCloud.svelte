<!--
	UNIFIED D3 WORD CLOUD COMPONENT
	Consolidates WordCloud and ConceptWordCloud with variant system
-->
<script lang="ts">
	import * as d3 from 'd3';
	import cloud from 'd3-cloud';

	interface WordData {
		text: string;
		size: number;
	}

	interface ConceptData extends WordData {
		category: string;
		confidence: number;
	}

	interface Props {
		/** Word data - supports both formats */
		words?: WordData[];
		concepts?: ConceptData[];
		/** Chart dimensions */
		width?: number;
		height?: number;
		/** Visual variant */
		variant?: 'simple' | 'concept';
		/** Show tooltips (concept variant) */
		showTooltips?: boolean;
		/** Enable click to copy (concept variant) */
		enableCopy?: boolean;
		/** Custom color map */
		colorMap?: Record<string, string>;
		/** On refresh callback (concept variant) */
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
		showTooltips = variant === 'concept',
		enableCopy = variant === 'concept',
		colorMap: customColorMap,
		onRefresh,
		class: className = ''
	}: Props = $props();

	// Default color maps
	const defaultColorMap = {
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

	const conceptColorMap: Record<string, string> = {
		collaboration: '#3B82F6',
		technology: '#10B981',
		wellness: '#F59E0B',
		innovation: '#EF4444',
		creativity: '#8B5CF6',
		flexibility: '#06B6D4',
		productivity: '#84CC16'
	};

	// Use appropriate color map
	const colorMap = customColorMap || (variant === 'concept' ? conceptColorMap : defaultColorMap);

	// Normalize data based on variant
	let normalizedData = $derived(() => {
		if (variant === 'concept' && concepts.length > 0) {
			return concepts.map((concept) => ({
				text: concept.text,
				size: Math.max(12, Math.min(60, concept.size * 3)),
				category: concept.category,
				confidence: concept.confidence
			}));
		} else if (words.length > 0) {
			return words.map((word) => ({
				text: word.text,
				size: word.size
			}));
		}
		return [];
	});

	let svg = $state<SVGSVGElement>();
	let container: HTMLDivElement;
	let tooltip = $state<HTMLDivElement>();
	let isLoading = $state(false);

	// Draw word cloud
	$effect(() => {
		if (normalizedData.length > 0) {
			drawWordCloud();
		}
	});

	function drawWordCloud() {
		if (normalizedData.length === 0) return;

		// Clear previous content
		d3.select(svg).selectAll('*').remove();

		const svgElement = d3.select(svg).attr('width', width).attr('height', height);

		const g = svgElement.append('g').attr('transform', `translate(${width / 2}, ${height / 2})`);

		function draw(cloudWords: any[]) {
			const text = g
				.selectAll('text')
				.data(cloudWords)
				.enter()
				.append('text')
				.style('font-size', (d) => `${d.size}px`)
				.style(
					'font-family',
					variant === 'concept' ? 'Inter, sans-serif' : 'Impact, Arial Black, sans-serif'
				)
				.style('fill', (d) => {
					if (variant === 'concept') {
						const category = (d as any).category;
						return colorMap[category] || '#6B7280';
					} else {
						return colorMap[d.text as keyof typeof colorMap] || '#6b7280';
					}
				})
				.attr('text-anchor', 'middle')
				.attr('transform', (d) => `translate(${d.x}, ${d.y}) rotate(${d.rotate})`)
				.text((d) => d.text)
				.style('cursor', showTooltips || enableCopy ? 'pointer' : 'default');

			// Add interactions for concept variant
			if (showTooltips || enableCopy) {
				text
					.on('mouseover', function (event, d) {
						// Highlight word
						d3.select(this)
							.transition()
							.duration(200)
							.style('opacity', 0.7)
							.style('font-weight', 'bold');

						if (showTooltips) {
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

						if (showTooltips) {
							hideTooltip();
						}
					})
					.on('click', function (event, d) {
						if (enableCopy) {
							navigator.clipboard.writeText((d as any).text);
							showNotification('Concept copied to clipboard!');
						}
					});
			} else {
				// Simple variant interactions
				text
					.on('mouseover', function (event, d) {
						d3.select(this)
							.transition()
							.duration(200)
							.style('font-size', `${d.size * 1.2}px`)
							.style('opacity', 1);
					})
					.on('mouseout', function (event, d) {
						d3.select(this)
							.transition()
							.duration(200)
							.style('font-size', `${d.size}px`)
							.style('opacity', 0.9);
					});
			}

			// Fade in animation
			text.style('opacity', 0).transition().duration(600).style('opacity', 0.9);
		}

		// Create word cloud layout
		const layout = cloud()
			.size([width - 40, height - 40])
			.words(normalizedData)
			.padding(5)
			.rotate(() => (Math.random() > 0.5 ? 0 : 90))
			.font(variant === 'concept' ? 'Inter' : 'Impact')
			.fontSize((d) => (d as any).size || 20)
			.on('end', draw);

		layout.start();
	}

	function showTooltip(event: MouseEvent, data: any) {
		if (!tooltip) return;

		const tooltipElement = d3.select(tooltip);
		tooltipElement
			.style('opacity', 1)
			.style('left', event.offsetX + 10 + 'px')
			.style('top', event.offsetY - 10 + 'px').html(`
				<div class="bg-gray-800 text-white px-3 py-2 rounded-lg shadow-lg border border-gray-600">
					<div class="text-sm">
						<div class="font-semibold">${data.text}</div>
						<div class="text-xs opacity-80">Category: ${data.category}</div>
						<div class="text-xs opacity-80">Confidence: ${Math.round(data.confidence * 100)}%</div>
						<div class="text-xs opacity-60 mt-1">Click to copy</div>
					</div>
				</div>
			`);
	}

	function hideTooltip() {
		if (tooltip) {
			d3.select(tooltip).style('opacity', 0);
		}
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
	class="relative bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 {className}"
>
	{#if variant === 'concept'}
		<!-- Concept variant header -->
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
	{/if}

	{#if normalizedData.length === 0}
		<div class="flex items-center justify-center h-64 text-gray-500">
			<div class="text-center">
				<div class="text-4xl mb-2">💭</div>
				<p>No {variant === 'concept' ? 'concepts' : 'data'} available</p>
				{#if variant === 'concept'}
					<p class="text-sm">Complete some quiz responses to see AI-generated concepts</p>
				{/if}
			</div>
		</div>
	{:else}
		<svg bind:this={svg} class="w-full h-64"></svg>

		<!-- Tooltip for concept variant -->
		{#if showTooltips}
			<div
				bind:this={tooltip}
				class="absolute pointer-events-none opacity-0 z-10 transition-opacity duration-200"
			></div>
		{/if}

		<!-- Color legend for concept variant -->
		{#if variant === 'concept'}
			<div class="mt-4 flex flex-wrap gap-2">
				{#each Object.entries(conceptColorMap) as [category, color]}
					<div class="flex items-center gap-1 text-xs">
						<div class="w-3 h-3 rounded" style="background-color: {color}"></div>
						<span class="capitalize">{category}</span>
					</div>
				{/each}
			</div>
		{/if}
	{/if}
</div>

<style>
	/* Custom font for concept variant */
	@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
</style>
