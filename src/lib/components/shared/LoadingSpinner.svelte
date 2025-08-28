<!-- Unified Loading Spinner Component -->
<script lang="ts">
	interface Props {
		size?: 'sm' | 'md' | 'lg';
		color?: 'white' | 'gray' | 'blue';
		message?: string;
		class?: string;
	}
	
	let { 
		size = 'md',
		color = 'gray',
		message,
		class: className = ''
	}: Props = $props();
	
	const sizeClasses = {
		sm: 'h-4 w-4 border',
		md: 'h-8 w-8 border-2',
		lg: 'h-12 w-12 border-2'
	};
	
	const colorClasses = {
		white: 'border-white border-t-transparent',
		gray: 'border-gray-600 border-t-transparent',
		blue: 'border-blue-600 border-t-transparent'
	};
</script>

<div class="text-center {className}">
	<div class="animate-spin rounded-full {sizeClasses[size]} {colorClasses[color]} mx-auto"></div>
	{#if message}
		<p class="mt-4 text-gray-600">{message}</p>
	{/if}
</div>