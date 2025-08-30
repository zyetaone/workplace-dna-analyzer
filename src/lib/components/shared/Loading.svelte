<!-- Simple Loading Component -->
<script lang="ts">
	let { size = 'md', class: className = '' } = $props();
	
	const sizeClasses = {
		sm: 'h-4 w-4',
		md: 'h-8 w-8',
		lg: 'h-12 w-12'
	};
</script>

<div class="flex items-center justify-center {className}">
	<div class="animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 {sizeClasses[size]}"></div>
</div>