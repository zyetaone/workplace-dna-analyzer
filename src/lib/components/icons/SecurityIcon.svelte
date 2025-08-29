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
	aria-label="Secure Authentication"
	role="img"
>
	{#if gradient}
		<defs>
			<linearGradient id="security-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
				<stop offset="0%" stop-color="#06b6d4" stop-opacity="0.9" />
				<stop offset="50%" stop-color="#8b5cf6" stop-opacity="0.9" />
				<stop offset="100%" stop-color="#ec4899" stop-opacity="0.9" />
			</linearGradient>
			<filter id="glow">
				<feGaussianBlur stdDeviation="3" result="coloredBlur"/>
				<feMerge>
					<feMergeNode in="coloredBlur"/>
					<feMergeNode in="SourceGraphic"/>
				</feMerge>
			</filter>
		</defs>
	{/if}

	<!-- Shield base -->
	<path
		d="M50 10 L75 25 L75 55 Q75 85 50 90 Q25 85 25 55 L25 25 Z"
		fill={gradient ? 'url(#security-gradient)' : 'currentColor'}
		fill-opacity="0.1"
		stroke={gradient ? 'url(#security-gradient)' : 'currentColor'}
		stroke-width="2"
		filter={gradient ? 'url(#glow)' : ''}
	/>

	<!-- Lock icon -->
	<g transform="translate(50, 50)">
		<!-- Lock body -->
		<rect
			x="-12"
			y="-5"
			width="24"
			height="18"
			rx="3"
			fill={gradient ? 'url(#security-gradient)' : 'currentColor'}
			fill-opacity="0.8"
		/>
		<!-- Lock shackle -->
		<path
			d="M -9,-5 L -9,-12 Q -9,-20 0,-20 Q 9,-20 9,-12 L 9,-5"
			fill="none"
			stroke={gradient ? 'url(#security-gradient)' : 'currentColor'}
			stroke-width="3"
			stroke-linecap="round"
		/>
		<!-- Keyhole -->
		<circle
			cx="0"
			cy="3"
			r="3"
			fill={gradient ? '#1e293b' : 'white'}
			fill-opacity="0.9"
		/>
		<rect
			x="-1.5"
			y="3"
			width="3"
			height="6"
			fill={gradient ? '#1e293b' : 'white'}
			fill-opacity="0.9"
		/>
	</g>

	<!-- Animated security lines -->
	<g opacity="0.5">
		<path
			d="M15 30 L20 35"
			stroke={gradient ? 'url(#security-gradient)' : 'currentColor'}
			stroke-width="1"
			stroke-linecap="round"
			class="animate-pulse"
		/>
		<path
			d="M85 30 L80 35"
			stroke={gradient ? 'url(#security-gradient)' : 'currentColor'}
			stroke-width="1"
			stroke-linecap="round"
			class="animate-pulse"
			style="animation-delay: 0.5s"
		/>
		<path
			d="M15 60 L20 65"
			stroke={gradient ? 'url(#security-gradient)' : 'currentColor'}
			stroke-width="1"
			stroke-linecap="round"
			class="animate-pulse"
			style="animation-delay: 1s"
		/>
		<path
			d="M85 60 L80 65"
			stroke={gradient ? 'url(#security-gradient)' : 'currentColor'}
			stroke-width="1"
			stroke-linecap="round"
			class="animate-pulse"
			style="animation-delay: 1.5s"
		/>
	</g>
</svg>