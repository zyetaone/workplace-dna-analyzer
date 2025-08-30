<script lang="ts">
	import '../app.css';
	import { Tooltip } from 'bits-ui';
	import Loading from '$lib/components/ui/Loading.svelte';

	let { children } = $props<{ children: any }>();
</script>

<svelte:boundary onerror={(error, reset) => console.error('Application Error:', error)}>
	{#snippet pending()}
		<Loading message="Loading application..." variant="screen" />
	{/snippet}

	<Tooltip.Provider>
		<!-- Main Content -->
		<div class="min-h-screen">
			{@render children?.()}
		</div>
	</Tooltip.Provider>

	{#snippet failed(error, reset)}
		<div class="min-h-screen bg-gray-50 flex items-center justify-center px-4" role="main">
			<div
				class="bg-white rounded-lg shadow-lg p-8 max-w-md w-full"
				role="alert"
				aria-live="assertive"
			>
				<div class="text-red-600 text-5xl text-center mb-4" aria-hidden="true">⚠️</div>
				<h1 class="text-2xl font-bold text-gray-800 mb-2 text-center">Application Error</h1>
				<p class="text-gray-600 text-center mb-6">
					{error && typeof error === 'object' && 'message' in error
						? (error as Error).message
						: 'An unexpected error occurred'}
				</p>
				<div class="text-center">
					<button
						type="button"
						class="text-blue-600 hover:text-blue-800 underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
						onclick={reset}
						aria-label="Try again"
					>
						Try Again
					</button>
				</div>
			</div>
		</div>
	{/snippet}
</svelte:boundary>

<style>
	:global(body) {
		margin: 0;
		font-family:
			'Inter',
			system-ui,
			-apple-system,
			sans-serif;
	}
</style>
