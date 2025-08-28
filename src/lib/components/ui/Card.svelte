<!-- Unified Card component to replace duplicate card patterns throughout the app -->
<script lang="ts">
	import type { Snippet } from 'svelte';
	
	interface Props {
		// Content
		title?: string;
		subtitle?: string;
		
		// Layout & styling
		size?: 'sm' | 'md' | 'lg';
		variant?: 'default' | 'elevated' | 'outlined' | 'filled' | 'stats';
		
		// Interaction
		hoverable?: boolean;
		clickable?: boolean;
		loading?: boolean;
		
		// Custom styling
		class?: string;
		headerClass?: string;
		bodyClass?: string;
		
		// Snippets
		children: Snippet;
		header?: Snippet;
		actions?: Snippet;
	}
	
	let { 
		title,
		subtitle,
		size = 'md',
		variant = 'default',
		hoverable = false,
		clickable = false,
		loading = false,
		class: className = '',
		headerClass = '',
		bodyClass = '',
		children,
		header,
		actions
	}: Props = $props();
	
	// Size variants
	const sizeClasses = {
		sm: 'p-4',
		md: 'p-6', 
		lg: 'p-8'
	};
	
	// Variant styles
	const variantClasses = {
		default: 'bg-white border border-gray-200 shadow-sm',
		elevated: 'bg-white shadow-lg',
		outlined: 'bg-white border-2 border-gray-300 shadow-none',
		filled: 'bg-gray-50 border border-gray-200 shadow-sm',
		stats: 'bg-gray-50 border border-gray-200 shadow-sm'
	};
	
	// Interactive states
	const interactionClasses = $derived(() => {
		let classes = [];
		if (hoverable || clickable) classes.push('transition-shadow duration-200');
		if (hoverable) classes.push('hover:shadow-xl');
		if (clickable) classes.push('cursor-pointer hover:shadow-lg');
		return classes.join(' ');
	});
	
	const cardClasses = $derived(() => {
		return `rounded-lg ${variantClasses[variant]} ${interactionClasses()} ${className}`.trim();
	});
</script>

<div class={cardClasses}>
	<!-- Loading overlay -->
	{#if loading}
		<div class="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
			<div class="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div>
		</div>
	{/if}
	
	<!-- Header section -->
	{#if header || title || subtitle}
		<div class="border-b border-gray-200 {headerClass}">
			{#if header}
				{@render header()}
			{:else if title || subtitle}
				<div class="pb-4 {size === 'sm' ? 'px-4 pt-4' : size === 'md' ? 'px-6 pt-6' : 'px-8 pt-8'}">
					{#if title}
						<h3 class="text-xl font-semibold text-gray-800 mb-1">{title}</h3>
					{/if}
					{#if subtitle}
						<p class="text-gray-600">{subtitle}</p>
					{/if}
				</div>
			{/if}
		</div>
	{/if}
	
 	<!-- Body content -->
 	<div class="{title || subtitle || header ? (size === 'sm' ? 'p-4' : size === 'md' ? 'p-6' : 'p-8') : sizeClasses[size]} {bodyClass}">
 		{#if children}
 			{@render children()}
 		{/if}
 	</div>

 	<!-- Actions section -->
 	{#if actions}
 		<div class="border-t border-gray-100 px-6 py-4 bg-gray-50 rounded-b-lg">
 			{@render actions()}
 		</div>
 	{/if}
</div>