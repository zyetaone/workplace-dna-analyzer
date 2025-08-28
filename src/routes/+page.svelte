<script lang="ts">
	import { goto } from '$app/navigation';
	import { navigating } from '$app/stores';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
	
	let isLoggingIn = $state(false);
	
	// Derived loading state that combines navigation and local loading
	let isLoading = $derived(!!$navigating || isLoggingIn);
	
	// Navigate to admin dashboard
	async function enterDashboard() {
		isLoggingIn = true;
		try {
			// Navigate to admin dashboard
			await goto('/admin', { invalidateAll: true });
		} finally {
			isLoggingIn = false;
		}
	}
	
	// Optional: Auto-enter on mount
	$effect(() => {
		// Uncomment to auto-redirect
		// enterDashboard();
	});
</script>

<div class="min-h-screen animated-gradient flex items-center justify-center px-4">
	<div class="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
		<h1 class="text-3xl font-bold text-gray-800 mb-2 text-center">Workplace DNA Analyzer</h1>
		<p class="text-gray-600 mb-8 text-center">Interactive workplace preference analysis platform</p>
		
		<div class="space-y-4">
			<button
				onclick={enterDashboard}
				disabled={isLoading}
				class="w-full py-4 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg hover:from-gray-700 hover:to-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg flex items-center justify-center gap-3"
			>
				{#if isLoading}
					<LoadingSpinner size="md" color="white" />
					<span>{$navigating ? 'Navigating...' : 'Entering Dashboard...'}</span>
				{:else}
					<span class="text-xl">🚀</span>
					<span>Sign In / Register</span>
				{/if}
			</button>
			
			<div class="text-center">
				<p class="text-sm text-gray-500">
					Secure authentication required
				</p>
			</div>
		</div>
		
		<div class="mt-8 pt-6 border-t border-gray-200">
			<div class="space-y-2 text-sm text-gray-600">
				<p class="font-semibold">Features:</p>
				<ul class="list-disc list-inside space-y-1 text-left">
					<li>Secure user authentication</li>
					<li>Real-time survey responses</li>
					<li>Live analytics dashboard</li>
					<li>QR code generation for participants</li>
					<li>Workplace DNA profiling</li>
				</ul>
			</div>
		</div>
	</div>
</div>