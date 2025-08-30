<!-- Simple Progress Component -->
<script lang="ts">
	let { value = 0, max = 100, class: className = '' } = $props();
	
	const percentage = $derived(Math.round((value / max) * 100));
</script>

<div class="w-full bg-gray-200 rounded-full h-2.5 {className}">
	<div 
		class="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
		style="width: {percentage}%"
	></div>
</div>