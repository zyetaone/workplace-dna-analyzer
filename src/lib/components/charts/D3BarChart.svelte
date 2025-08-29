<!-- Simple Bar Chart Component -->
<script lang="ts">
	import { onMount } from 'svelte';

	interface Props {
		scores: { label: string; value: number }[];
		width?: number;
		height?: number;
		class?: string;
	}

	let { scores = [], width = 400, height = 300, class: className = '' }: Props = $props();

	let chartContainer: HTMLDivElement;

	onMount(() => {
		// Simple chart rendering logic
		if (chartContainer && scores.length > 0) {
			renderChart();
		}
	});

	function renderChart() {
		// Clear existing chart
		if (chartContainer) {
			chartContainer.innerHTML = '';
		}

		// Create simple bar chart with divs
		const maxValue = Math.max(...scores.map(s => s.value));
		
		const chartHtml = `
			<div class="bar-chart-simple" style="height: ${height}px; display: flex; align-items: flex-end; gap: 8px; padding: 16px;">
				${scores.map(item => `
					<div class="bar-group" style="flex: 1; display: flex; flex-direction: column; align-items: center;">
						<div 
							class="bar" 
							style="
								width: 100%;
								height: ${(item.value / maxValue) * (height - 60)}px;
								background: linear-gradient(135deg, #667eea, #a78bfa);
								border-radius: 4px 4px 0 0;
								transition: all 0.3s ease;
							"
						></div>
						<div class="bar-label" style="margin-top: 8px; font-size: 12px; color: #94a3b8; text-align: center;">
							${item.label}
						</div>
						<div class="bar-value" style="font-size: 14px; font-weight: 600; color: #f1f5f9;">
							${item.value}%
						</div>
					</div>
				`).join('')}
			</div>
		`;

		if (chartContainer) {
			chartContainer.innerHTML = chartHtml;
		}
	}

	$effect(() => {
		if (scores && scores.length > 0 && chartContainer) {
			renderChart();
		}
	});
</script>

<div bind:this={chartContainer} class="d3-bar-chart {className}" style="width: {width}px;">
	<!-- Chart will be rendered here -->
</div>

<style>
	.d3-bar-chart {
		background: rgba(255, 255, 255, 0.05);
		border-radius: 12px;
		backdrop-filter: blur(10px);
		border: 1px solid rgba(255, 255, 255, 0.1);
		overflow: hidden;
	}

	:global(.bar-chart-simple .bar:hover) {
		filter: brightness(1.2);
		transform: translateY(-4px);
	}

	:global(.bar-chart-simple) {
		position: relative;
	}
</style>