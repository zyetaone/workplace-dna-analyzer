<!-- 
	PageWrapper.svelte
	Main page wrapper component with consistent layout structure
	Uses children pattern for content composition
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	
	interface Props {
		children?: Snippet;
		variant?: 'default' | 'dashboard' | 'presenter' | 'participant';
		maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '7xl' | 'full';
		padding?: 'none' | 'sm' | 'md' | 'lg';
		background?: 'gradient' | 'white' | 'gray' | 'none';
		class?: string;
	}
	
	let {
		children,
		variant = 'default',
		maxWidth = '7xl',
		padding = 'md',
		background = 'gradient',
		class: className = ''
	}: Props = $props();
	
	const maxWidthClasses = {
		sm: 'max-w-sm',
		md: 'max-w-md',
		lg: 'max-w-lg',
		xl: 'max-w-xl',
		'2xl': 'max-w-2xl',
		'4xl': 'max-w-4xl',
		'7xl': 'max-w-7xl',
		full: 'max-w-full'
	};
	
	const paddingClasses = {
		none: '',
		sm: 'px-4 py-2',
		md: 'px-6 py-4',
		lg: 'px-8 py-6'
	};
	
	const backgroundClasses = {
		gradient: 'animated-gradient',
		white: 'bg-white',
		gray: 'bg-gray-50',
		none: ''
	};
	
	const variantClasses = {
		default: 'min-h-screen',
		dashboard: 'min-h-screen',
		presenter: 'min-h-screen overflow-hidden',
		participant: 'min-h-screen'
	};
	
	$: containerClass = `
		${variantClasses[variant]}
		${backgroundClasses[background]}
		${className}
	`.trim();
	
	$: contentClass = `
		${maxWidthClasses[maxWidth]}
		${paddingClasses[padding]}
		mx-auto
	`.trim();
</script>

<div class={containerClass}>
	<div class={contentClass}>
		{@render children?.()}
	</div>
</div>

<style>
	:global(.animated-gradient) {
		background: linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab);
		background-size: 400% 400%;
		animation: gradient 15s ease infinite;
	}
	
	@keyframes gradient {
		0% {
			background-position: 0% 50%;
		}
		50% {
			background-position: 100% 50%;
		}
		100% {
			background-position: 0% 50%;
		}
	}
</style>