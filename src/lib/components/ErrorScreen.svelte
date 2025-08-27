<!-- 
	ErrorScreen.svelte
	Error state component with children pattern for custom actions
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	
	interface Props {
		children?: Snippet;
		title?: string;
		message?: string;
		error?: Error | null;
		showDetails?: boolean;
		maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
		variant?: 'default' | 'inline' | 'toast';
		severity?: 'error' | 'warning' | 'info';
		onRetry?: () => void;
		onDismiss?: () => void;
		class?: string;
	}
	
	let { 
		children,
		title = 'Error',
		message = 'Something went wrong. Please try again.',
		error = null,
		showDetails = false,
		maxWidth = 'md',
		variant = 'default',
		severity = 'error',
		onRetry,
		onDismiss,
		class: className = ''
	}: Props = $props();
	
	const maxWidthClasses = {
		sm: 'max-w-sm',
		md: 'max-w-md',
		lg: 'max-w-lg',
		xl: 'max-w-xl',
		'2xl': 'max-w-2xl'
	};
	
	const severityConfig = {
		error: {
			bgColor: 'bg-red-50',
			borderColor: 'border-red-200',
			titleColor: 'text-red-800',
			textColor: 'text-red-600',
			icon: '❌'
		},
		warning: {
			bgColor: 'bg-yellow-50',
			borderColor: 'border-yellow-200',
			titleColor: 'text-yellow-800',
			textColor: 'text-yellow-600',
			icon: '⚠️'
		},
		info: {
			bgColor: 'bg-blue-50',
			borderColor: 'border-blue-200',
			titleColor: 'text-blue-800',
			textColor: 'text-blue-600',
			icon: 'ℹ️'
		}
	};
	
	const config = severityConfig[severity];
	let showErrorDetails = $state(false);
</script>

{#if variant === 'default'}
	<!-- Full screen error with animated gradient background -->
	<div class="min-h-screen animated-gradient flex items-center justify-center px-4 {className}">
		<div class="bg-white rounded-lg shadow-xl p-8 {maxWidthClasses[maxWidth]} w-full">
			<div class="text-center">
				<span class="text-4xl mb-4 block">{config.icon}</span>
				<h1 class="text-2xl font-bold {config.titleColor} mb-4">{title}</h1>
				<p class="{config.textColor} mb-6">{message}</p>
				
				{#if error && showDetails}
					<button
						onclick={() => showErrorDetails = !showErrorDetails}
						class="text-sm text-gray-500 hover:text-gray-700 underline mb-4"
					>
						{showErrorDetails ? 'Hide' : 'Show'} error details
					</button>
					
					{#if showErrorDetails}
						<pre class="bg-gray-100 p-4 rounded text-left text-xs overflow-x-auto mb-4">
							{error.stack || error.message}
						</pre>
					{/if}
				{/if}
				
				<div class="flex gap-3 justify-center">
					{#if onRetry}
						<button
							onclick={onRetry}
							class="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium"
						>
							Try Again
						</button>
					{/if}
					{#if onDismiss}
						<button
							onclick={onDismiss}
							class="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
						>
							Dismiss
						</button>
					{/if}
				</div>
				
				{#if children}
					<div class="mt-6">
						{@render children()}
					</div>
				{/if}
			</div>
		</div>
	</div>
{:else if variant === 'inline'}
	<!-- Inline error for use within existing containers -->
	<div class="{config.bgColor} border {config.borderColor} rounded-lg p-6 {className}">
		<div class="flex items-start">
			<span class="text-xl mr-3">{config.icon}</span>
			<div class="flex-1">
				<h2 class="text-lg font-semibold {config.titleColor} mb-2">{title}</h2>
				<p class="{config.textColor}">{message}</p>
				
				{#if error && showDetails && showErrorDetails}
					<pre class="mt-3 bg-white bg-opacity-50 p-3 rounded text-xs overflow-x-auto">
						{error.message}
					</pre>
				{/if}
				
				{#if onRetry || onDismiss || (error && showDetails)}
					<div class="flex gap-3 mt-4">
						{#if error && showDetails}
							<button
								onclick={() => showErrorDetails = !showErrorDetails}
								class="text-sm {config.textColor} hover:underline"
							>
								{showErrorDetails ? 'Hide' : 'Show'} details
							</button>
						{/if}
						{#if onRetry}
							<button
								onclick={onRetry}
								class="text-sm {config.textColor} font-medium hover:underline"
							>
								Retry
							</button>
						{/if}
						{#if onDismiss}
							<button
								onclick={onDismiss}
								class="text-sm {config.textColor} hover:underline"
							>
								Dismiss
							</button>
						{/if}
					</div>
				{/if}
				
				{#if children}
					<div class="mt-4">
						{@render children()}
					</div>
				{/if}
			</div>
		</div>
	</div>
{:else if variant === 'toast'}
	<!-- Toast notification style -->
	<div class="fixed bottom-4 right-4 z-50 {className}">
		<div class="{config.bgColor} border {config.borderColor} rounded-lg shadow-lg p-4 max-w-sm">
			<div class="flex items-start">
				<span class="text-lg mr-3">{config.icon}</span>
				<div class="flex-1">
					<h3 class="font-medium {config.titleColor}">{title}</h3>
					<p class="text-sm {config.textColor} mt-1">{message}</p>
				</div>
				{#if onDismiss}
					<button
						onclick={onDismiss}
						class="ml-3 text-gray-400 hover:text-gray-600"
						aria-label="Dismiss"
					>
						<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				{/if}
			</div>
			{#if children}
				<div class="mt-3">
					{@render children()}
				</div>
			{/if}
		</div>
	</div>
{/if}