<script lang="ts">
	import '../app.css';
	import { Tooltip } from 'bits-ui';
	import { Loading } from '$lib/components';
	import AppProvider from '$lib/components/providers/AppProvider.svelte';

	let { children } = $props<{ children: any }>();
</script>

<svelte:boundary onerror={(error, reset) => console.error('Application Error:', error)}>
	{#snippet pending()}
		<Loading message="Loading application..." />
	{/snippet}

	<Tooltip.Provider>
		<AppProvider>
			<!-- Main Content -->
			<div class="min-h-screen">
				{@render children?.()}
			</div>
		</AppProvider>
	</Tooltip.Provider>

	{#snippet failed(error, reset)}
		<div class="flex min-h-screen items-center justify-center bg-gray-50 px-4" role="main">
			<div
				class="w-full max-w-md rounded-lg bg-white p-8 shadow-lg"
				role="alert"
				aria-live="assertive"
			>
				<div class="mb-4 text-center text-5xl text-red-600" aria-hidden="true">⚠️</div>
				<h1 class="mb-2 text-center text-2xl font-bold text-gray-800">Application Error</h1>
				<p class="mb-6 text-center text-gray-600">
					{error && typeof error === 'object' && 'message' in error
						? (error as Error).message
						: 'An unexpected error occurred'}
				</p>
				<div class="text-center">
					<button
						type="button"
						class="text-blue-600 underline hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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
