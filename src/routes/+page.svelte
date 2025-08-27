<script lang="ts">
	import { goto } from '$app/navigation';
	import { login } from './auth.remote';
	
	let isLoggingIn = $state(false);
	
	// Auto-login for POC
	async function enterDashboard() {
		isLoggingIn = true;
		try {
			// No password needed for POC
			await login({});
			await goto('/dashboard', { invalidateAll: true });
		} catch (err: any) {
			console.error('Login failed:', err);
			// Try again with direct navigation
			await goto('/dashboard');
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
				disabled={isLoggingIn}
				class="w-full py-4 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg hover:from-gray-700 hover:to-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg flex items-center justify-center gap-3"
			>
				{#if isLoggingIn}
					<div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
					<span>Entering Dashboard...</span>
				{:else}
					<span class="text-xl">🚀</span>
					<span>Enter Dashboard</span>
				{/if}
			</button>
			
			<div class="text-center">
				<p class="text-sm text-gray-500">
					POC Version - No authentication required
				</p>
			</div>
		</div>
		
		<div class="mt-8 pt-6 border-t border-gray-200">
			<div class="space-y-2 text-sm text-gray-600">
				<p class="font-semibold">Features:</p>
				<ul class="list-disc list-inside space-y-1 text-left">
					<li>Real-time survey responses</li>
					<li>Live analytics dashboard</li>
					<li>QR code generation for participants</li>
					<li>Workplace DNA profiling</li>
				</ul>
			</div>
		</div>
	</div>
</div>