<script lang="ts">
	interface Props {
		size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
		gradient?: boolean;
		class?: string;
	}

	let { size = 'md', gradient = true, class: className = '' }: Props = $props();

	const sizes = { 
		sm: 32, 
		md: 48, 
		lg: 96,    // Increased from 64
		xl: 128,   // New size
		'2xl': 160 // New size (5x of sm)
	};
	const currentSize = sizes[size];

	// Animated bar heights
	let barHeights = $state([65, 45, 75, 55, 80]);
	
	$effect(() => {
		const interval = setInterval(() => {
			barHeights = barHeights.map(() => 30 + Math.random() * 50);
		}, 2000);
		return () => clearInterval(interval);
	});
</script>

<svg
	width={currentSize}
	height={currentSize}
	viewBox="0 0 100 100"
	class="transition-all duration-500 {className}"
	aria-label="Real-time Analytics"
	role="img"
>
	{#if gradient}
		<defs>
			<linearGradient id="analytics-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
				<stop offset="0%" stop-color="#38bdf8" stop-opacity="0.9" />
				<stop offset="50%" stop-color="#818cf8" stop-opacity="0.9" />
				<stop offset="100%" stop-color="#c084fc" stop-opacity="0.9" />
			</linearGradient>
			<filter id="glow-analytics">
				<feGaussianBlur stdDeviation="2" result="coloredBlur"/>
				<feMerge>
					<feMergeNode in="coloredBlur"/>
					<feMergeNode in="SourceGraphic"/>
				</feMerge>
			</filter>
		</defs>
	{/if}

	<!-- Monitor frame -->
	<rect
		x="10"
		y="15"
		width="80"
		height="55"
		rx="4"
		fill="none"
		stroke={gradient ? 'url(#analytics-gradient)' : 'currentColor'}
		stroke-width="2"
		filter={gradient ? 'url(#glow-analytics)' : ''}
	/>

	<!-- Monitor screen -->
	<rect
		x="14"
		y="19"
		width="72"
		height="47"
		rx="2"
		fill={gradient ? 'url(#analytics-gradient)' : 'currentColor'}
		fill-opacity="0.05"
	/>

	<!-- Chart bars with animation -->
	{#each barHeights as height, i}
		<rect
			x={20 + i * 12}
			y={66 - height * 0.4}
			width="8"
			height={height * 0.4}
			rx="1"
			fill={gradient ? 'url(#analytics-gradient)' : 'currentColor'}
			fill-opacity={0.3 + i * 0.15}
			class="transition-all duration-1000 ease-out"
		/>
	{/each}

	<!-- Trend line -->
	<polyline
		points="20,45 32,38 44,42 56,35 68,30 80,28"
		fill="none"
		stroke={gradient ? 'url(#analytics-gradient)' : 'currentColor'}
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
		stroke-dasharray="100"
		stroke-dashoffset="100"
		class="animate-[draw_2s_ease-out_forwards]"
	/>

	<!-- Data points -->
	{#each [20, 32, 44, 56, 68, 80] as x, i}
		<circle
			cx={x}
			cy={45 - i * 3}
			r="2"
			fill={gradient ? 'url(#analytics-gradient)' : 'currentColor'}
			class="animate-pulse"
			style="animation-delay: {i * 0.2}s"
		/>
	{/each}

	<!-- Monitor stand -->
	<rect
		x="45"
		y="70"
		width="10"
		height="15"
		fill={gradient ? 'url(#analytics-gradient)' : 'currentColor'}
		fill-opacity="0.6"
	/>
	<ellipse
		cx="50"
		cy="85"
		rx="15"
		ry="3"
		fill={gradient ? 'url(#analytics-gradient)' : 'currentColor'}
		fill-opacity="0.4"
	/>

	<!-- Status indicator -->
	<circle
		cx="50"
		cy="75"
		r="2"
		fill="#10b981"
		class="animate-pulse"
	/>
</svg>

<style>
	@keyframes draw {
		to {
			stroke-dashoffset: 0;
		}
	}
</style>