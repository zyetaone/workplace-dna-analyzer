<script lang="ts">
	import { goto } from '$app/navigation';
	import { navigating } from '$app/state';
	import { Button, Card } from '$lib/components';
	
	let isLoggingIn = $state(false);
	
	// Derived loading state that combines navigation and local loading
	let isLoading = $derived(!navigating || isLoggingIn);
	
	// Navigate to admin dashboard
	async function enterDashboard() {
		isLoggingIn = true;
		try {
			await goto('/admin', { invalidateAll: true });
		} finally {
			isLoggingIn = false;
		}
	}
	
</script>

<div class="min-h-screen animated-gradient flex items-center justify-center px-4">
	<Card 
		variant="elevated" 
		size="lg" 
		class="max-w-md w-full"
		title="Workplace DNA Analyzer"
		subtitle="Interactive workplace preference analysis platform"
	>
		<div class="space-y-4">
			<Button
				onclick={enterDashboard}
				disabled={isLoading}
				loading={isLoading}
				class="w-full bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800"
				size="lg"
			>
				{#if !isLoading}
					<span class="text-xl">🚀</span>
				{/if}
				Sign In / Register
			</Button>
			
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
	</Card>
</div>