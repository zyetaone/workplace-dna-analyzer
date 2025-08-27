<script lang="ts">
	interface Props {
		title?: string;
		message?: string;
		maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
		variant?: 'default' | 'inline';
	}
	
	let { 
		title = 'Error',
		message = 'Something went wrong. Please try again.',
		maxWidth = 'md',
		variant = 'default'
	}: Props = $props();
	
	const maxWidthClasses = {
		sm: 'max-w-sm',
		md: 'max-w-md',
		lg: 'max-w-lg',
		xl: 'max-w-xl',
		'2xl': 'max-w-2xl'
	};
</script>

{#if variant === 'default'}
	<!-- Full screen error with animated gradient background -->
	<div class="min-h-screen animated-gradient flex items-center justify-center px-4">
		<div class="bg-white rounded-lg shadow-xl p-8 {maxWidthClasses[maxWidth]} w-full">
			<h1 class="text-2xl font-bold text-gray-800 mb-4">{title}</h1>
			<p class="text-gray-600">{message}</p>
		</div>
	</div>
{:else}
	<!-- Inline error for use within existing containers -->
	<div class="bg-white rounded-lg shadow-lg p-8">
		<h2 class="text-xl font-bold text-gray-800 mb-2">{title}</h2>
		<p class="text-gray-600">{message}</p>
	</div>
{/if}