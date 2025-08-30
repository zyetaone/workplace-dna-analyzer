<!-- Simple Stats Card Component -->
<script lang="ts">
	let { 
		title, 
		value, 
		subtitle, 
		icon, 
		variant = 'default',
		class: className = '' 
	} = $props();
	
	const variantClasses = {
		default: 'bg-white border-gray-200',
		primary: 'bg-blue-50 border-blue-200',
		success: 'bg-green-50 border-green-200',
		warning: 'bg-yellow-50 border-yellow-200',
		danger: 'bg-red-50 border-red-200'
	};
</script>

<div class="p-6 rounded-lg border {variantClasses[variant]} {className}">
	{#if icon}
		<div class="flex items-center mb-2">
			<span class="text-2xl mr-3">{icon}</span>
			<h3 class="text-sm font-medium text-gray-600">{title}</h3>
		</div>
	{:else}
		<h3 class="text-sm font-medium text-gray-600 mb-2">{title}</h3>
	{/if}
	
	<div class="text-2xl font-bold text-gray-900 mb-1">{value}</div>
	
	{#if subtitle}
		<p class="text-sm text-gray-500">{subtitle}</p>
	{/if}
</div>