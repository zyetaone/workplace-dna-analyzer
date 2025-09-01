/**
 * Modern Card component demonstrating Svelte 5 patterns:
 * - style: directive for CSS custom properties
 * - class: directive for conditional classes  
 * - mergeProps from bits-ui for prop composition
 * - Array-based class composition
 * 
 * @example
 * ```svelte
 * <ModernCard 
 *   variant="glass" 
 *   accentColor="#7c3aed"
 *   glowIntensity={0.8}
 *   interactive
 * >
 *   <h3>Modern Design</h3>
 *   <p>Using latest Svelte 5 patterns</p>
 * </ModernCard>
 * ```
 */
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { mergeProps } from 'bits-ui';

	interface Props {
		/** Card variant */
		variant?: 'default' | 'glass' | 'elevated' | 'interactive';
		/** Interactive state */
		interactive?: boolean;
		/** Loading state */
		loading?: boolean;
		/** Error state */
		error?: boolean;
		/** Success state */
		success?: boolean;
		/** Custom accent color */
		accentColor?: string;
		/** Background opacity (0-1) */
		backgroundOpacity?: number;
		/** Border radius scale */
		radiusScale?: number;
		/** Glow intensity (0-1) */
		glowIntensity?: number;
		/** Animation speed multiplier */
		animationSpeed?: number;
		/** Content */
		children?: Snippet;
		/** Additional classes */
		class?: string;
		/** Click handler */
		onclick?: () => void;
		/** Custom styles */
		style?: string;
		/** ARIA label */
		'aria-label'?: string;
	}

	let {
		variant = 'default',
		interactive = false,
		loading = false,
		error = false,
		success = false,
		accentColor = '#7c3aed',
		backgroundOpacity = 0.05,
		radiusScale = 1,
		glowIntensity = 0.5,
		animationSpeed = 1,
		children,
		class: className = '',
		onclick,
		style = '',
		'aria-label': ariaLabel,
		...restProps
	}: Props = $props();

	// Base classes using array composition (Svelte 5 native)
	const baseClasses = $derived(() => {
		const base = 'card-base';
		const variantClass = variant === 'glass' ? 'card-glass' : 
			variant === 'elevated' ? 'card-elevated' : 
			variant === 'interactive' || interactive ? 'card-interactive' : 
			'card-default';
		
		return [base, variantClass, className].filter(Boolean);
	});

	// Conditional states using class: directive
	const isClickable = $derived(!!onclick || interactive);
	const hasGlow = $derived(glowIntensity > 0);
	const isAnimated = $derived(animationSpeed !== 0);

	// Merge props using bits-ui utility
	const mergedProps = $derived(() =>
		mergeProps(restProps, {
			class: baseClasses(),
			onclick: onclick || (interactive ? () => {} : undefined),
			role: isClickable ? 'button' : undefined,
			tabindex: isClickable ? 0 : undefined,
			'aria-label': ariaLabel || (isClickable ? 'Interactive card' : undefined)
		})
	);

	// Dynamic CSS custom properties using style: directive
	const glowColor = $derived(`${accentColor}${Math.round(glowIntensity * 255).toString(16).padStart(2, '0')}`);
	const animationDuration = $derived(`${200 / animationSpeed}ms`);
</script>

<div 
	{...mergedProps()}
	{style}
	style:--card-accent-color={accentColor}
	style:--card-bg-opacity={backgroundOpacity}
	style:--card-radius-scale={radiusScale}
	style:--card-glow-color={glowColor}
	style:--card-animation-duration={animationDuration}
	class:loading
	class:error
	class:success
	class:interactive={isClickable}
	class:has-glow={hasGlow}
	class:animated={isAnimated}
	class:pointer-events-none={loading}
	class:cursor-pointer={isClickable}
	class:transform={isAnimated}
	class:transition-all={isAnimated}
	class:duration-[var(--card-animation-duration)]={isAnimated}
	class:hover:scale-[1.02]={isClickable && isAnimated}
	class:active:scale-[0.98]={isClickable && isAnimated}
>
	{#if loading}
		<div class="loading-overlay">
			<div class="loading-spinner"></div>
		</div>
	{:else}
		{@render children?.()}
	{/if}
</div>

<style>
	/* CSS custom properties integration */
	.card-base {
		background-color: color-mix(in srgb, var(--card-accent-color) calc(var(--card-bg-opacity) * 100%), transparent);
		border-radius: calc(var(--zds-radius-xl) * var(--card-radius-scale));
		transition-duration: var(--card-animation-duration);
	}

	.has-glow {
		box-shadow: 0 0 24px var(--card-glow-color);
	}

	.error {
		--card-accent-color: var(--zds-color-error);
		border-color: var(--zds-color-error);
	}

	.success {
		--card-accent-color: var(--zds-color-success);
		border-color: var(--zds-color-success);
	}

	.loading {
		position: relative;
		overflow: hidden;
	}

	/* Hover effects using CSS custom properties */
	.interactive:hover {
		background-color: color-mix(in srgb, var(--card-accent-color) calc(var(--card-bg-opacity) * 150%), transparent);
		box-shadow: 
			var(--zds-shadow-lg),
			0 0 32px var(--card-glow-color);
	}

	.interactive:active {
		background-color: color-mix(in srgb, var(--card-accent-color) calc(var(--card-bg-opacity) * 200%), transparent);
	}

	/* Responsive design with CSS custom properties */
	@media (max-width: 768px) {
		.card-base {
			border-radius: calc(var(--zds-radius-lg) * var(--card-radius-scale));
		}
	}

	/* Animation performance optimization */
	@media (prefers-reduced-motion: reduce) {
		.card-base {
			--card-animation-duration: 0ms;
		}
		
		.interactive:hover {
			transform: none !important;
		}
	}

	/* High contrast mode */
	@media (prefers-contrast: high) {
		.card-base {
			border: 2px solid var(--card-accent-color);
		}
	}
</style>