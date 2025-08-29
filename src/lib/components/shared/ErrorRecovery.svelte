<!-- Smart Error Recovery Component with User-Friendly Messaging -->
<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import Button from '$lib/components/ui/Button.svelte';
	import { tooltip } from '$lib/utils/attachments';
	
	interface Props {
		error: string | Error | null;
		context?: 'quiz' | 'admin' | 'connection' | 'data';
		onRetry?: () => void | Promise<void>;
		onDismiss?: () => void;
		showDetails?: boolean;
		autoRetry?: boolean;
		retryDelay?: number;
	}
	
	let {
		error,
		context = 'data',
		onRetry,
		onDismiss,
		showDetails = false,
		autoRetry = false,
		retryDelay = 5000
	}: Props = $props();
	
	// Parse error message
	const errorMessage = $derived(() => {
		if (!error) return '';
		if (typeof error === 'string') return error;
		return error.message || 'An unexpected error occurred';
	});
	
	// User-friendly error messages based on context
	const friendlyMessage = $derived(() => {
		const msg = errorMessage().toLowerCase();
		
		// Connection errors
		if (msg.includes('network') || msg.includes('fetch') || context === 'connection') {
			return {
				title: 'Connection Issue',
				message: "We're having trouble connecting to the server",
				icon: '🌐',
				suggestions: [
					'Check your internet connection',
					'Refresh the page',
					'Try again in a moment'
				]
			};
		}
		
		// Session errors
		if (msg.includes('session') || msg.includes('not found')) {
			return {
				title: 'Session Not Found',
				message: 'The session you\'re looking for doesn\'t exist or has ended',
				icon: '🔍',
				suggestions: [
					'Double-check the session code',
					'Ask the presenter for a new code',
					'Return to the home page'
				]
			};
		}
		
		// Quiz errors
		if (context === 'quiz' || msg.includes('quiz')) {
			return {
				title: 'Quiz Issue',
				message: 'There was a problem with the quiz',
				icon: '📝',
				suggestions: [
					'Try refreshing the page',
					'Check with the presenter',
					'Your progress has been saved'
				]
			};
		}
		
		// Data errors
		if (msg.includes('save') || msg.includes('submit')) {
			return {
				title: 'Saving Issue',
				message: 'We couldn\'t save your response',
				icon: '💾',
				suggestions: [
					'Your answer is still selected',
					'Try submitting again',
					'Check your connection'
				]
			};
		}
		
		// Default
		return {
			title: 'Something Went Wrong',
			message: 'An unexpected error occurred',
			icon: '⚠️',
			suggestions: [
				'Try refreshing the page',
				'Check your internet connection',
				'Contact support if the issue persists'
			]
		};
	});
	
	// Auto-retry logic
	let retryCount = $state(0);
	let retryTimer = $state<NodeJS.Timeout | null>(null);
	let isRetrying = $state(false);
	let countdown = $state(0);
	
	$effect(() => {
		if (autoRetry && error && onRetry && retryCount < 3) {
			countdown = Math.floor(retryDelay / 1000);
			
			const countdownInterval = setInterval(() => {
				countdown--;
				if (countdown <= 0) {
					clearInterval(countdownInterval);
				}
			}, 1000);
			
			retryTimer = setTimeout(async () => {
				isRetrying = true;
				retryCount++;
				await onRetry();
				isRetrying = false;
			}, retryDelay);
			
			return () => {
				if (retryTimer) clearTimeout(retryTimer);
				clearInterval(countdownInterval);
			};
		}
	});
	
	// Manual retry
	async function handleRetry() {
		if (!onRetry) return;
		
		isRetrying = true;
		retryCount++;
		
		try {
			await onRetry();
		} finally {
			isRetrying = false;
		}
	}
	
	// Dismiss error
	function handleDismiss() {
		if (retryTimer) {
			clearTimeout(retryTimer);
			retryTimer = null;
		}
		onDismiss?.();
	}
</script>

{#if error}
	<div 
		class="error-recovery"
		in:fly={{ y: 20, duration: 500 }}
		out:fade={{ duration: 300 }}
		role="alert"
		aria-live="assertive"
		aria-atomic="true"
	>
		<!-- Error Icon -->
		<div class="error-icon">
			<span class="text-4xl">{friendlyMessage().icon}</span>
		</div>
		
		<!-- Error Content -->
		<div class="error-content">
			<h3 class="error-title">
				{friendlyMessage().title}
			</h3>
			
			<p class="error-message">
				{friendlyMessage().message}
			</p>
			
			<!-- Suggestions -->
			<div class="error-suggestions">
				<p class="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
					What you can try:
				</p>
				<ul class="space-y-1">
					{#each friendlyMessage().suggestions as suggestion}
						<li class="flex items-start gap-2">
							<span class="text-purple-500 mt-0.5">•</span>
							<span class="text-sm text-gray-600 dark:text-gray-300">
								{suggestion}
							</span>
						</li>
					{/each}
				</ul>
			</div>
			
			<!-- Technical Details (collapsible) -->
			{#if showDetails}
				<details class="error-details">
					<summary class="cursor-pointer text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
						Technical details
					</summary>
					<pre class="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-x-auto">
{errorMessage()}
					</pre>
				</details>
			{/if}
			
			<!-- Auto-retry indicator -->
			{#if autoRetry && countdown > 0 && retryCount < 3}
				<div class="auto-retry-indicator">
					<div class="flex items-center gap-2">
						<svg class="animate-spin h-4 w-4 text-purple-600" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
						</svg>
						<span class="text-sm text-gray-600 dark:text-gray-400">
							Retrying in {countdown} seconds... (Attempt {retryCount + 1}/3)
						</span>
					</div>
				</div>
			{/if}
			
			<!-- Actions -->
			<div class="error-actions">
				{#if onRetry}
					<Button
						onclick={handleRetry}
						disabled={isRetrying}
						loading={isRetrying}
						variant="primary"
						size="sm"
						{@attach tooltip('Try the action again')}
					>
						{isRetrying ? 'Retrying...' : 'Try Again'}
					</Button>
				{/if}
				
				{#if onDismiss}
					<Button
						onclick={handleDismiss}
						variant="outline"
						size="sm"
						{@attach tooltip('Close this message')}
					>
						Dismiss
					</Button>
				{/if}
				
				<Button
					onclick={() => window.location.reload()}
					variant="ghost"
					size="sm"
					{@attach tooltip('Reload the entire page')}
				>
					Refresh Page
				</Button>
			</div>
		</div>
	</div>
{/if}

<style>
	.error-recovery {
		@apply relative max-w-md mx-auto;
		@apply bg-white dark:bg-gray-800 rounded-xl shadow-lg;
		@apply border border-red-200 dark:border-red-800;
		@apply p-6 space-y-4;
	}
	
	.error-icon {
		@apply flex justify-center mb-4;
		animation: shake 0.5s ease-out;
	}
	
	.error-content {
		@apply space-y-3;
	}
	
	.error-title {
		@apply text-lg font-semibold text-gray-800 dark:text-gray-100;
		@apply text-center;
	}
	
	.error-message {
		@apply text-sm text-gray-600 dark:text-gray-300;
		@apply text-center;
	}
	
	.error-suggestions {
		@apply mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg;
	}
	
	.error-details {
		@apply mt-3;
	}
	
	.auto-retry-indicator {
		@apply mt-3 p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg;
		@apply flex items-center justify-center;
	}
	
	.error-actions {
		@apply flex gap-2 justify-center mt-4;
		@apply flex-wrap;
	}
	
	@keyframes shake {
		0%, 100% { transform: translateX(0); }
		10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
		20%, 40%, 60%, 80% { transform: translateX(5px); }
	}
	
	/* Reduced motion support */
	@media (prefers-reduced-motion: reduce) {
		.error-icon {
			animation: none;
		}
	}
</style>