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
</script>

<svg
	width={currentSize}
	height={currentSize}
	viewBox="0 0 100 100"
	class="transition-all duration-500 {className}"
	aria-label="Mobile Optimized"
	role="img"
>
	{#if gradient}
		<defs>
			<linearGradient id="mobile-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
				<stop offset="0%" stop-color="#10b981" stop-opacity="0.9" />
				<stop offset="50%" stop-color="#06b6d4" stop-opacity="0.9" />
				<stop offset="100%" stop-color="#8b5cf6" stop-opacity="0.9" />
			</linearGradient>
			<filter id="glow-mobile">
				<feGaussianBlur stdDeviation="2" result="coloredBlur"/>
				<feMerge>
					<feMergeNode in="coloredBlur"/>
					<feMergeNode in="SourceGraphic"/>
				</feMerge>
			</filter>
		</defs>
	{/if}

	<!-- Desktop device -->
	<g transform="translate(15, 20)">
		<rect
			x="0"
			y="0"
			width="35"
			height="25"
			rx="2"
			fill="none"
			stroke={gradient ? 'url(#mobile-gradient)' : 'currentColor'}
			stroke-width="1.5"
			fill-opacity="0.1"
		/>
		<rect
			x="3"
			y="3"
			width="29"
			height="19"
			fill={gradient ? 'url(#mobile-gradient)' : 'currentColor'}
			fill-opacity="0.1"
		/>
		<!-- Desktop stand -->
		<rect
			x="15"
			y="25"
			width="5"
			height="5"
			fill={gradient ? 'url(#mobile-gradient)' : 'currentColor'}
			fill-opacity="0.4"
		/>
	</g>

	<!-- Tablet device -->
	<g transform="translate(50, 35)">
		<rect
			x="0"
			y="0"
			width="28"
			height="38"
			rx="3"
			fill="none"
			stroke={gradient ? 'url(#mobile-gradient)' : 'currentColor'}
			stroke-width="2"
			filter={gradient ? 'url(#glow-mobile)' : ''}
		/>
		<rect
			x="3"
			y="5"
			width="22"
			height="28"
			rx="1"
			fill={gradient ? 'url(#mobile-gradient)' : 'currentColor'}
			fill-opacity="0.15"
		/>
		<!-- Home button -->
		<circle
			cx="14"
			cy="35"
			r="1.5"
			fill={gradient ? 'url(#mobile-gradient)' : 'currentColor'}
			fill-opacity="0.6"
		/>
	</g>

	<!-- Phone device (animated) -->
	<g transform="translate(25, 55)" class="animate-[float_3s_ease-in-out_infinite]">
		<rect
			x="0"
			y="0"
			width="18"
			height="32"
			rx="3"
			fill="none"
			stroke={gradient ? 'url(#mobile-gradient)' : 'currentColor'}
			stroke-width="2"
			filter={gradient ? 'url(#glow-mobile)' : ''}
		/>
		<rect
			x="2"
			y="4"
			width="14"
			height="24"
			rx="1"
			fill={gradient ? 'url(#mobile-gradient)' : 'currentColor'}
			fill-opacity="0.2"
		/>
		<!-- Screen content bars -->
		<rect x="4" y="8" width="10" height="2" fill={gradient ? 'url(#mobile-gradient)' : 'currentColor'} fill-opacity="0.4" />
		<rect x="4" y="12" width="7" height="2" fill={gradient ? 'url(#mobile-gradient)' : 'currentColor'} fill-opacity="0.3" />
		<rect x="4" y="16" width="9" height="2" fill={gradient ? 'url(#mobile-gradient)' : 'currentColor'} fill-opacity="0.35" />
		<!-- Home indicator -->
		<rect
			x="7"
			y="29"
			width="4"
			height="1"
			rx="0.5"
			fill={gradient ? 'url(#mobile-gradient)' : 'currentColor'}
			fill-opacity="0.6"
		/>
	</g>

	<!-- Responsive arrows -->
	<g opacity="0.6">
		<path
			d="M45 30 L48 27 L51 30"
			fill="none"
			stroke={gradient ? 'url(#mobile-gradient)' : 'currentColor'}
			stroke-width="1.5"
			stroke-linecap="round"
			stroke-linejoin="round"
			class="animate-pulse"
		/>
		<path
			d="M22 50 L19 53 L22 56"
			fill="none"
			stroke={gradient ? 'url(#mobile-gradient)' : 'currentColor'}
			stroke-width="1.5"
			stroke-linecap="round"
			stroke-linejoin="round"
			class="animate-pulse"
			style="animation-delay: 0.5s"
		/>
		<path
			d="M48 75 L45 78 L48 81"
			fill="none"
			stroke={gradient ? 'url(#mobile-gradient)' : 'currentColor'}
			stroke-width="1.5"
			stroke-linecap="round"
			stroke-linejoin="round"
			class="animate-pulse"
			style="animation-delay: 1s"
		/>
	</g>
</svg>

<style>
	@keyframes float {
		0%, 100% { transform: translateY(0px); }
		50% { transform: translateY(-3px); }
	}
</style>