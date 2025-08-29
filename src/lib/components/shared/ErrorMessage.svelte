<!-- Unified Error Display Component -->
<script lang="ts">
	interface Props {
		error?: string;
		title?: string;
		variant?: 'inline' | 'screen';
	}
	
	let {
		error = '',
		title = 'Error',
		variant = 'inline'
	}: Props = $props();
</script>

{#if error}
	{#if variant === 'screen'}
		<div class="min-h-screen bg-gray-50 flex items-center justify-center px-4" role="main">
			<div class="bg-white rounded-lg shadow-lg p-8 max-w-md w-full" role="alert" aria-live="assertive">
				<div class="text-red-600 text-5xl text-center mb-4" aria-hidden="true">⚠️</div>
				<h1 class="text-2xl font-bold text-gray-800 mb-2 text-center">{title}</h1>
				<p class="text-gray-600 text-center">{error}</p>
				<div class="mt-6 text-center">
					<button 
						type="button"
						class="text-blue-600 hover:text-blue-800 underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
						onclick={() => window.history.back()}
						aria-label="Go back to previous page"
					>
						← Go Back
					</button>
				</div>
			</div>
		</div>
	{:else}
		<div 
			class="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg" 
			role="alert" 
			aria-live="polite"
		>
			<div class="flex items-center">
				<svg class="w-5 h-5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
					<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
				</svg>
				<p class="font-medium">
					<span class="sr-only">Error: </span>
					{title}: {error}
				</p>
			</div>
		</div>
	{/if}
{/if}