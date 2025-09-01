/**
 * Button component matching bits-ui canonical style
 * Uses native Svelte 5 class arrays - no mergeProps needed
 */
<script lang="ts">
	import { Button } from 'bits-ui';
	import type { Snippet } from 'svelte';

	interface Props extends Button.RootProps {
		/** Button visual variant */
		variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'destructive' | 'glass';
		/** Button size */
		size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
		/** Button content */
		children?: Snippet;
		/** Show loading spinner and disable button */
		loading?: boolean;
	}

	let {
		class: className,
		variant = 'primary',
		size = 'md',
		loading = false,
		children,
		...restProps
	}: Props = $props();
</script>

<Button.Root
	class={[
		// Variant classes from zds.css
		variant === 'primary' && 'btn-primary',
		variant === 'secondary' && 'btn-secondary', 
		variant === 'ghost' && 'btn-ghost',
		variant === 'outline' && 'btn-outline',
		variant === 'destructive' && 'btn-destructive',
		variant === 'glass' && 'btn-glass',
		// Size classes
		size === 'xs' && 'btn-xs',
		size === 'sm' && 'btn-sm', 
		size === 'md' && 'btn-md',
		size === 'lg' && 'btn-lg',
		size === 'xl' && 'btn-xl',
		// Loading state
		loading && 'pointer-events-none opacity-75',
		// Custom classes
		className
	]}
	disabled={loading || restProps.disabled}
	{...restProps}
>
	{#if loading}
		<svg
			class="mr-2 h-4 w-4 animate-spin"
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
		>
			<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
			<path
				class="opacity-75"
				fill="currentColor"
				d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
			></path>
		</svg>
	{/if}
	{@render children?.()}
</Button.Root>