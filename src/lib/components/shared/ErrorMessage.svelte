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
		<div class="min-h-screen bg-gray-50 flex items-center justify-center px-4">
			<div class="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
				<div class="text-red-600 text-5xl text-center mb-4">⚠️</div>
				<h1 class="text-2xl font-bold text-gray-800 mb-2 text-center">{title}</h1>
				<p class="text-gray-600 text-center">{error}</p>
			</div>
		</div>
	{:else}
		<div class="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
			<p class="font-medium">{title}: {error}</p>
		</div>
	{/if}
{/if}