<!-- 
	LoadingScreen.svelte
	Loading state component with children pattern for custom content
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	
	interface Props {
		children?: Snippet;
		title?: string;
		message?: string;
		maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
		variant?: 'default' | 'inline' | 'skeleton';
		showSpinner?: boolean;
		spinnerSize?: 'sm' | 'md' | 'lg';
		class?: string;
	}
	
	let { 
		children,
		title = 'Loading...',
		message = 'Please wait while we load your data...',
		maxWidth = 'md',
		variant = 'default',
		showSpinner = true,
		spinnerSize = 'md',
		class: className = ''
	}: Props = $props();
	
	const maxWidthClasses = {
		sm: 'max-w-sm',
		md: 'max-w-md',
		lg: 'max-w-lg',
		xl: 'max-w-xl',
		'2xl': 'max-w-2xl'
	};
	
	const spinnerSizes = {
		sm: 'h-6 w-6',
		md: 'h-8 w-8',
		lg: 'h-12 w-12'
	};
</script>

{#if variant === 'default'}
	<!-- Full screen loading with animated gradient background -->
	<div class="min-h-screen animated-gradient flex items-center justify-center px-4 {className}">
		<div class="bg-white rounded-lg shadow-xl p-8 {maxWidthClasses[maxWidth]} w-full">
			{#if showSpinner}
				<div class="flex justify-center mb-4">
					<div class="animate-spin rounded-full {spinnerSizes[spinnerSize]} border-b-2 border-gray-600"></div>
				</div>
			{/if}
			<h1 class="text-2xl font-bold text-gray-800 mb-4 text-center">{title}</h1>
			<p class="text-gray-600 text-center">{message}</p>
			{#if children}
				<div class="mt-4">
					{@render children()}
				</div>
			{/if}
		</div>
	</div>
{:else if variant === 'inline'}
	<!-- Inline loading for use within existing containers -->
	<div class="bg-white rounded-lg shadow-lg p-8 {className}">
		{#if showSpinner}
			<div class="flex justify-center mb-4">
				<div class="animate-spin rounded-full {spinnerSizes[spinnerSize]} border-b-2 border-gray-600"></div>
			</div>
		{/if}
		<p class="text-gray-600 text-center">{message}</p>
		{#if children}
			<div class="mt-4">
				{@render children()}
			</div>
		{/if}
	</div>
{:else if variant === 'skeleton'}
	<!-- Skeleton loading placeholder -->
	<div class="animate-pulse space-y-4 {className}">
		{#if children}
			{@render children()}
		{:else}
			<div class="h-4 bg-gray-200 rounded w-full"></div>
			<div class="h-4 bg-gray-200 rounded w-3/4"></div>
			<div class="h-4 bg-gray-200 rounded w-1/2"></div>
		{/if}
	</div>
{/if}