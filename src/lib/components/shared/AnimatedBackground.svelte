<script lang="ts">
	interface Props {
		variant?: 'default' | 'subtle' | 'vibrant';
		intensity?: 'low' | 'medium' | 'high';
		showParticles?: boolean;
		class?: string;
		children?: any;
	}

	let { 
		variant = 'default', 
		intensity = 'medium',
		showParticles = true,
		class: className = '',
		children 
	}: Props = $props();

	// Gradient configurations
	const gradients = {
		default: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 25%, #16213e 50%, #0f3460 75%, #1a1a2e 100%)',
		subtle: 'linear-gradient(135deg, #0f0f23 0%, #16213e 50%, #1a1a2e 100%)',
		vibrant: 'linear-gradient(135deg, #0f0f23 0%, #1e3a8a 25%, #7c3aed 50%, #c026d3 75%, #1a1a2e 100%)'
	};

	// Intensity configurations (reduced for better readability)
	const intensityConfig = {
		low: { orbOpacity: '5', particleCount: 1 },
		medium: { orbOpacity: '10', particleCount: 2 },
		high: { orbOpacity: '15', particleCount: 3 }
	};

	const config = intensityConfig[intensity];
</script>

<div 
	class="min-h-screen relative overflow-hidden {className}" 
	style="background: {gradients[variant]}; background-size: 400% 400%; animation: gradientShift 30s ease infinite;"
>
	<!-- Animated orbs layer -->
	<div class="absolute inset-0 pointer-events-none">
		<!-- Primary orb (top-left) - visible but subtle -->
		<div 
			class="absolute top-0 left-0 w-96 h-96 rounded-full blur-3xl {variant === 'default' ? 'bg-blue-500/20' : variant === 'subtle' ? 'bg-blue-600/15' : 'bg-blue-700/25'}"
			style="animation: floatOrb 20s ease-in-out infinite;"
		></div>
		
		<!-- Secondary orb (bottom-right) - visible but subtle -->
		<div 
			class="absolute bottom-0 right-0 w-96 h-96 rounded-full blur-3xl {variant === 'default' ? 'bg-purple-500/20' : variant === 'subtle' ? 'bg-indigo-600/15' : 'bg-purple-700/25'}"
			style="animation: floatOrb 25s ease-in-out infinite; animation-delay: 3s;"
		></div>
		
		<!-- Center orb - visible but subtle -->
		<div 
			class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl"
			style="animation: floatOrb 30s ease-in-out infinite; animation-delay: 6s;"
		></div>

		<!-- Additional floating orbs for depth -->
		<div 
			class="absolute top-1/4 right-1/3 w-80 h-80 rounded-full blur-3xl opacity-20 animate-floatOrb bg-gradient-to-r {variant === 'default' ? 'from-cyan-900/20 to-violet-900/20' : variant === 'subtle' ? 'from-cyan-800/15 to-violet-800/15' : 'from-cyan-700/25 to-violet-700/25'}"
		></div>
		
		<div 
			class="absolute bottom-1/3 left-1/4 w-72 h-72 rounded-full blur-3xl opacity-15 animate-floatOrb bg-gradient-to-r {variant === 'default' ? 'from-indigo-900/15 to-pink-900/15' : variant === 'subtle' ? 'from-indigo-800/10 to-pink-800/10' : 'from-indigo-700/20 to-pink-700/20'}"
			style="animation-delay: 3s;"
		></div>
	</div>

	<!-- Floating particles (optional) -->
	{#if showParticles}
		<div class="absolute inset-0 pointer-events-none">
			{#if config.particleCount >= 1}
				<div 
					class="absolute top-1/4 left-1/4 w-2 h-2 bg-white/20 rounded-full animate-bounce" 
					style="animation-delay: 1s; animation-duration: 3s;"
				></div>
			{/if}
			{#if config.particleCount >= 2}
				<div 
					class="absolute top-3/4 right-1/4 w-1 h-1 bg-blue-400/30 rounded-full animate-bounce" 
					style="animation-delay: 3s; animation-duration: 4s;"
				></div>
			{/if}
			{#if config.particleCount >= 3}
				<div 
					class="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-purple-400/25 rounded-full animate-bounce" 
					style="animation-delay: 5s; animation-duration: 3.5s;"
				></div>
			{/if}
			{#if config.particleCount >= 4}
				<div 
					class="absolute top-1/2 right-1/3 w-1 h-1 bg-cyan-400/25 rounded-full animate-bounce" 
					style="animation-delay: 2s; animation-duration: 4.5s;"
				></div>
			{/if}
			{#if config.particleCount >= 5}
				<div 
					class="absolute bottom-1/2 left-1/2 w-1.5 h-1.5 bg-pink-400/20 rounded-full animate-bounce" 
					style="animation-delay: 4s; animation-duration: 5s;"
				></div>
			{/if}
		</div>
	{/if}

	<!-- Main content with relative positioning -->
	<div class="relative z-10">
		{@render children?.()}
	</div>
</div>

<style>
	/* Gradient shift animation */
	@keyframes gradientShift {
		0% { background-position: 0% 50%; }
		50% { background-position: 100% 50%; }
		100% { background-position: 0% 50%; }
	}

	/* Floating orb animation */
	@keyframes floatOrb {
		0%, 100% { 
			transform: translate(0, 0) scale(1); 
			opacity: 0.15;
		}
		25% { 
			transform: translate(-20px, -30px) scale(1.1); 
			opacity: 0.2;
		}
		50% { 
			transform: translate(30px, -20px) scale(0.95); 
			opacity: 0.12;
		}
		75% { 
			transform: translate(-10px, 20px) scale(1.05); 
			opacity: 0.18;
		}
	}

	/* Prefers reduced motion support */
	@media (prefers-reduced-motion: reduce) {
		div {
			animation: none !important;
		}
	}
</style>