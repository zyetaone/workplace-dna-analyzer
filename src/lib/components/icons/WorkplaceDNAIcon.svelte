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
	aria-label="Workplace DNA"
	role="img"
>
	{#if gradient}
		<defs>
			<linearGradient id="dna-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
				<stop offset="0%" stop-color="#fb923c" stop-opacity="0.9" />
				<stop offset="50%" stop-color="#ec4899" stop-opacity="0.9" />
				<stop offset="100%" stop-color="#a855f7" stop-opacity="0.9" />
			</linearGradient>
			<linearGradient id="dna-gradient-2" x1="0%" y1="0%" x2="100%" y2="100%">
				<stop offset="0%" stop-color="#06b6d4" stop-opacity="0.7" />
				<stop offset="100%" stop-color="#8b5cf6" stop-opacity="0.7" />
			</linearGradient>
			<filter id="glow-dna">
				<feGaussianBlur stdDeviation="2" result="coloredBlur"/>
				<feMerge>
					<feMergeNode in="coloredBlur"/>
					<feMergeNode in="SourceGraphic"/>
				</feMerge>
			</filter>
		</defs>
	{/if}

	<!-- Office building silhouette -->
	<g opacity="0.3">
		<rect x="20" y="60" width="60" height="35" rx="2" 
			fill={gradient ? 'url(#dna-gradient)' : 'currentColor'} 
			fill-opacity="0.2" />
		<!-- Windows -->
		<rect x="25" y="65" width="8" height="8" fill={gradient ? 'url(#dna-gradient)' : 'currentColor'} fill-opacity="0.4" />
		<rect x="37" y="65" width="8" height="8" fill={gradient ? 'url(#dna-gradient)' : 'currentColor'} fill-opacity="0.4" />
		<rect x="49" y="65" width="8" height="8" fill={gradient ? 'url(#dna-gradient)' : 'currentColor'} fill-opacity="0.4" />
		<rect x="61" y="65" width="8" height="8" fill={gradient ? 'url(#dna-gradient)' : 'currentColor'} fill-opacity="0.4" />
		<rect x="25" y="77" width="8" height="8" fill={gradient ? 'url(#dna-gradient)' : 'currentColor'} fill-opacity="0.3" />
		<rect x="37" y="77" width="8" height="8" fill={gradient ? 'url(#dna-gradient)' : 'currentColor'} fill-opacity="0.3" />
		<rect x="49" y="77" width="8" height="8" fill={gradient ? 'url(#dna-gradient)' : 'currentColor'} fill-opacity="0.3" />
		<rect x="61" y="77" width="8" height="8" fill={gradient ? 'url(#dna-gradient)' : 'currentColor'} fill-opacity="0.3" />
	</g>

	<!-- DNA Double Helix -->
	<g filter={gradient ? 'url(#glow-dna)' : ''}>
		<!-- First helix strand -->
		<path
			d="M 30,15 Q 40,25 50,35 T 70,55 Q 60,65 50,75 T 30,95"
			fill="none"
			stroke={gradient ? 'url(#dna-gradient)' : 'currentColor'}
			stroke-width="2.5"
			stroke-linecap="round"
			opacity="0.9"
			class="animate-[pulse_3s_ease-in-out_infinite]"
		/>
		
		<!-- Second helix strand -->
		<path
			d="M 70,15 Q 60,25 50,35 T 30,55 Q 40,65 50,75 T 70,95"
			fill="none"
			stroke={gradient ? 'url(#dna-gradient-2)' : 'currentColor'}
			stroke-width="2.5"
			stroke-linecap="round"
			opacity="0.9"
			class="animate-[pulse_3s_ease-in-out_infinite]"
			style="animation-delay: 1.5s"
		/>

		<!-- Connection bars -->
		{#each [25, 35, 45, 55, 65, 75] as y, i}
			<line
				x1={35 + (i % 2 === 0 ? 0 : 30)}
				y1={y}
				x2={65 - (i % 2 === 0 ? 30 : 0)}
				y2={y}
				stroke={gradient ? 'url(#dna-gradient)' : 'currentColor'}
				stroke-width="1.5"
				opacity="0.5"
				class="animate-[fade_3s_ease-in-out_infinite]"
				style="animation-delay: {i * 0.2}s"
			/>
		{/each}

		<!-- Data nodes -->
		{#each [30, 50, 70] as x}
			{#each [25, 45, 65, 85] as y, i}
				<circle
					cx={x + (i % 2 === 0 ? -5 : 5)}
					cy={y}
					r="2"
					fill={gradient ? 'url(#dna-gradient)' : 'currentColor'}
					opacity="0.8"
					class="animate-pulse"
					style="animation-delay: {i * 0.3}s"
				/>
			{/each}
		{/each}
	</g>

	<!-- Person silhouette in center -->
	<g transform="translate(50, 50)">
		<circle
			cx="0"
			cy="-5"
			r="5"
			fill={gradient ? 'url(#dna-gradient)' : 'currentColor'}
			fill-opacity="0.4"
		/>
		<path
			d="M -8,0 Q -8,8 -6,12 L 6,12 Q 8,8 8,0 Q 8,-2 5,-3 L -5,-3 Q -8,-2 -8,0"
			fill={gradient ? 'url(#dna-gradient)' : 'currentColor'}
			fill-opacity="0.4"
		/>
	</g>
</svg>

<style>
	@keyframes fade {
		0%, 100% { opacity: 0.3; }
		50% { opacity: 0.8; }
	}
</style>