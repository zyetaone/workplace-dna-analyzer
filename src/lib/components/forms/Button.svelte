<!-- 
	Button.svelte
	Enhanced button component with variants, sizes, and loading states
	Uses children pattern for flexible content
-->
<script lang="ts">
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import type { Snippet } from 'svelte';
	
	interface Props extends Omit<HTMLButtonAttributes, 'class'> {
		children?: Snippet;
		variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost' | 'link';
		size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
		fullWidth?: boolean;
		loading?: boolean;
		loadingText?: string;
		leftIcon?: string;
		rightIcon?: string;
		rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
		class?: string;
	}
	
	let {
		children,
		variant = 'primary',
		size = 'md',
		fullWidth = false,
		loading = false,
		loadingText = 'Loading...',
		leftIcon,
		rightIcon,
		rounded = 'md',
		disabled = false,
		type = 'button',
		class: className = '',
		...rest
	}: Props = $props();
	
	const variantClasses = {
		primary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
		secondary: 'bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-400',
		danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-400',
		success: 'bg-green-500 text-white hover:bg-green-600 focus:ring-green-400',
		ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-400',
		link: 'bg-transparent text-blue-600 hover:text-blue-700 underline focus:ring-blue-400'
	};
	
	const sizeClasses = {
		xs: 'px-2 py-1 text-xs',
		sm: 'px-3 py-1.5 text-sm',
		md: 'px-4 py-2',
		lg: 'px-6 py-3 text-lg',
		xl: 'px-8 py-4 text-xl'
	};
	
	const roundedClasses = {
		none: 'rounded-none',
		sm: 'rounded',
		md: 'rounded-md',
		lg: 'rounded-lg',
		full: 'rounded-full'
	};
	
	$: buttonClass = `
		inline-flex items-center justify-center gap-2
		font-medium transition-all duration-200
		focus:outline-none focus:ring-2 focus:ring-offset-2
		disabled:opacity-50 disabled:cursor-not-allowed
		${variantClasses[variant]}
		${sizeClasses[size]}
		${roundedClasses[rounded]}
		${fullWidth ? 'w-full' : ''}
		${className}
	`.trim();
	
	$: isDisabled = disabled || loading;
</script>

<button
	{type}
	disabled={isDisabled}
	class={buttonClass}
	{...rest}
>
	{#if loading}
		<svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
			<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
			<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
		</svg>
		{#if loadingText}
			<span>{loadingText}</span>
		{/if}
	{:else}
		{#if leftIcon}
			<span>{leftIcon}</span>
		{/if}
		{@render children?.()}
		{#if rightIcon}
			<span>{rightIcon}</span>
		{/if}
	{/if}
</button>