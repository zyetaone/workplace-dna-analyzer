/**
 * Theme Provider component demonstrating Svelte 5 style: directive
 * Dynamically applies CSS custom properties based on theme state
 * 
 * @example
 * ```svelte
 * <ThemeProvider theme="dark" accentColor="#7c3aed">
 *   <App />
 * </ThemeProvider>
 * ```
 */
<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		/** Theme variant */
		theme?: 'light' | 'dark' | 'auto';
		/** Custom accent color */
		accentColor?: string;
		/** Custom background color */
		backgroundColor?: string;
		/** Custom text color */
		textColor?: string;
		/** Font size scale multiplier */
		fontScale?: number;
		/** Border radius scale multiplier */
		radiusScale?: number;
		/** Animation speed multiplier */
		animationSpeed?: number;
		/** Content */
		children?: Snippet;
		/** Additional CSS classes */
		class?: string;
	}

	let {
		theme = 'dark',
		accentColor,
		backgroundColor,
		textColor,
		fontScale = 1,
		radiusScale = 1,
		animationSpeed = 1,
		children,
		class: className = ''
	}: Props = $props();

	// Reactive theme values
	const isDark = $derived(theme === 'dark' || (theme === 'auto' && globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches));
	
	// Dynamic color calculations
	const computedAccentColor = $derived(accentColor || (isDark ? '#7c3aed' : '#6366f1'));
	const computedBackgroundColor = $derived(backgroundColor || (isDark ? '#0f0f23' : '#ffffff'));
	const computedTextColor = $derived(textColor || (isDark ? '#ffffff' : '#1f2937'));
	
	// Scale calculations
	const baseFontSize = $derived(`${16 * fontScale}px`);
	const baseRadius = $derived(`${8 * radiusScale}px`);
	const baseDuration = $derived(`${200 / animationSpeed}ms`);
</script>

<div 
	class={`theme-provider ${className}`}
	class:theme-light={!isDark}
	class:theme-dark={isDark}
	style:--zds-color-primary={computedAccentColor}
	style:--zds-color-background={computedBackgroundColor}
	style:--zds-color-text-primary={computedTextColor}
	style:--zds-text-base={baseFontSize}
	style:--zds-radius-base={baseRadius}
	style:--zds-duration-200={baseDuration}
	style:--font-scale={fontScale}
	style:--radius-scale={radiusScale}
	style:--animation-speed={animationSpeed}
>
	{@render children?.()}
</div>

<style>
	.theme-provider {
		min-height: 100vh;
		transition: 
			background-color var(--zds-duration-200) var(--zds-ease),
			color var(--zds-duration-200) var(--zds-ease);
	}

	.theme-light {
		--zds-color-surface: #f8fafc;
		--zds-color-border: #e2e8f0;
		--zds-color-text-secondary: #64748b;
		--zds-color-text-muted: #94a3b8;
	}

	.theme-dark {
		--zds-color-surface: #1a1a2e;
		--zds-color-border: #27272a;
		--zds-color-text-secondary: #a1a1aa;
		--zds-color-text-muted: #71717a;
	}

	/* Dynamic font scaling */
	:global(.theme-provider h1) {
		font-size: calc(var(--zds-text-base) * 2.5);
	}
	
	:global(.theme-provider h2) {
		font-size: calc(var(--zds-text-base) * 2);
	}
	
	:global(.theme-provider h3) {
		font-size: calc(var(--zds-text-base) * 1.5);
	}

	/* Dynamic radius scaling */
	:global(.theme-provider .btn-base) {
		border-radius: calc(var(--zds-radius-base) * var(--radius-scale));
	}
	
	:global(.theme-provider .card-base) {
		border-radius: calc(var(--zds-radius-base) * 2 * var(--radius-scale));
	}

	/* Dynamic animation scaling */
	:global(.theme-provider *) {
		transition-duration: calc(var(--zds-duration-200) / var(--animation-speed)) !important;
	}
</style>