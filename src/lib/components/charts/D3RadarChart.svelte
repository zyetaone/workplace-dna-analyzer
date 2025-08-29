<!-- D3 Radar Chart Component -->
<script lang="ts">
	import { onMount } from 'svelte';

	interface Props {
		data: any;
		width?: number;
		height?: number;
		class?: string;
	}

	let { data, width = 400, height = 300, class: className = '' }: Props = $props();

	let chartContainer: HTMLDivElement;

	onMount(() => {
		if (chartContainer && data) {
			renderChart();
		}
	});

	function renderChart() {
		if (!chartContainer || !data) return;

		// Clear existing chart
		chartContainer.innerHTML = '';

		// Extract data from the structure created by createRadarData
		const labels = data.data?.labels || [];
		const datasets = data.data?.datasets || [];

		if (labels.length === 0 || datasets.length === 0) return;

		const dataset = datasets[0];
		const values = dataset.data || [];
		const maxValue = Math.max(...values);

		// Calculate radar chart geometry
		const centerX = width / 2;
		const centerY = height / 2;
		const radius = Math.min(centerX, centerY) - 40;

		// Create SVG
		const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		svg.setAttribute('width', width.toString());
		svg.setAttribute('height', height.toString());
		svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
		svg.style.background = 'transparent';

		// Draw grid lines
		const numPoints = labels.length;
		const angleStep = (Math.PI * 2) / numPoints;

		// Draw concentric circles
		for (let i = 1; i <= 5; i++) {
			const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
			circle.setAttribute('cx', centerX.toString());
			circle.setAttribute('cy', centerY.toString());
			circle.setAttribute('r', ((radius * i) / 5).toString());
			circle.setAttribute('fill', 'none');
			circle.setAttribute('stroke', 'rgba(255, 255, 255, 0.1)');
			circle.setAttribute('stroke-width', '1');
			svg.appendChild(circle);
		}

		// Draw axis lines
		for (let i = 0; i < numPoints; i++) {
			const angle = i * angleStep - Math.PI / 2;
			const x = centerX + Math.cos(angle) * radius;
			const y = centerY + Math.sin(angle) * radius;

			const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
			line.setAttribute('x1', centerX.toString());
			line.setAttribute('y1', centerY.toString());
			line.setAttribute('x2', x.toString());
			line.setAttribute('y2', y.toString());
			line.setAttribute('stroke', 'rgba(255, 255, 255, 0.2)');
			line.setAttribute('stroke-width', '1');
			svg.appendChild(line);

			// Add labels
			const labelX = centerX + Math.cos(angle) * (radius + 20);
			const labelY = centerY + Math.sin(angle) * (radius + 20);

			const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
			text.setAttribute('x', labelX.toString());
			text.setAttribute('y', labelY.toString());
			text.setAttribute('text-anchor', 'middle');
			text.setAttribute('dominant-baseline', 'middle');
			text.setAttribute('fill', '#94a3b8');
			text.setAttribute('font-size', '12');
			text.setAttribute('font-family', 'system-ui, sans-serif');
			text.textContent = labels[i];
			svg.appendChild(text);
		}

		// Draw data polygon
		if (values.length > 0) {
			const points: string[] = [];

			for (let i = 0; i < numPoints; i++) {
				const angle = i * angleStep - Math.PI / 2;
				const value = values[i] || 0;
				const distance = (value / maxValue) * radius;
				const x = centerX + Math.cos(angle) * distance;
				const y = centerY + Math.sin(angle) * distance;
				points.push(`${x},${y}`);
			}

			// Close the polygon
			if (points.length > 0) {
				points.push(points[0]);
			}

			const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
			polygon.setAttribute('points', points.join(' '));
			polygon.setAttribute('fill', dataset.backgroundColor || 'rgba(59, 130, 246, 0.4)');
			polygon.setAttribute('stroke', dataset.borderColor || '#3b82f6');
			polygon.setAttribute('stroke-width', (dataset.borderWidth || 2).toString());
			polygon.setAttribute('stroke-linejoin', 'round');
			svg.appendChild(polygon);
		}

		chartContainer.appendChild(svg);
	}

	$effect(() => {
		if (data && chartContainer) {
			renderChart();
		}
	});
</script>

<div
	bind:this={chartContainer}
	class="d3-radar-chart {className}"
	style="width: {width}px; height: {height}px;"
>
	<!-- Chart will be rendered here -->
</div>

<style>
	.d3-radar-chart {
		background: rgba(255, 255, 255, 0.05);
		border-radius: 12px;
		backdrop-filter: blur(10px);
		border: 1px solid rgba(255, 255, 255, 0.1);
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
	}
</style>
