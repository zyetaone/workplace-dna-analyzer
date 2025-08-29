<script lang="ts">
	import { Button as ButtonPrimitive } from 'bits-ui';
	import { mergeProps } from '$lib/utils/merge-props';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	type Props = {
		variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'glass';
		size?: 'sm' | 'md' | 'lg' | 'xl';
		loading?: boolean;
		fullWidth?: boolean;
		children?: any;
	} & HTMLButtonAttributes;

	let {
		variant = 'primary',
		size = 'md',
		loading = false,
		fullWidth = false,
		children,
		class: className,
		disabled,
		...restProps
	}: Props = $props();

	// Size classes using Tailwind utilities
	const sizeClasses = {
		sm: 'btn-padding-sm text-sm',
		md: 'btn-padding text-base',
		lg: 'btn-padding-lg text-lg',
		xl: 'px-8 py-4 text-xl'
	};

	// Build data attributes for styling
	const dataAttrs = {
		'data-button': '',
		'data-variant': variant,
		'data-size': size,
		'data-loading': loading || undefined,
		'data-disabled': disabled || loading || undefined
	};

	// Merge all props properly
	const buttonProps = mergeProps(
		{
			class: `
				${sizeClasses[size]}
				${fullWidth ? 'w-full' : ''}
				${className || ''}
			`.trim(),
			disabled: disabled || loading,
			...dataAttrs
		},
		restProps
	);
</script>

<ButtonPrimitive.Root {...buttonProps}>
	{#if loading}
		<span class="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white mr-2"></span>
	{/if}
	{@render children?.()}
</ButtonPrimitive.Root>