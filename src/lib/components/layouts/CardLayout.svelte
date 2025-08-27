<!-- 
	CardLayout.svelte
	Reusable card layout component with header, body, and footer sections
	Supports various styles and configurations
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	
	interface Props {
		children?: Snippet;
		header?: Snippet;
		footer?: Snippet;
		title?: string;
		subtitle?: string;
		variant?: 'default' | 'elevated' | 'bordered' | 'flat';
		padding?: 'none' | 'sm' | 'md' | 'lg';
		class?: string;
		headerClass?: string;
		bodyClass?: string;
		footerClass?: string;
	}
	
	let {
		children,
		header,
		footer,
		title,
		subtitle,
		variant = 'default',
		padding = 'md',
		class: className = '',
		headerClass = '',
		bodyClass = '',
		footerClass = ''
	}: Props = $props();
	
	const variantClasses = {
		default: 'bg-white rounded-lg shadow-lg',
		elevated: 'bg-white rounded-lg shadow-xl hover:shadow-2xl transition-shadow',
		bordered: 'bg-white rounded-lg border border-gray-200',
		flat: 'bg-white'
	};
	
	const paddingClasses = {
		none: '',
		sm: 'p-4',
		md: 'p-6',
		lg: 'p-8'
	};
	
	$: cardClass = `
		${variantClasses[variant]}
		overflow-hidden
		${className}
	`.trim();
</script>

<article class={cardClass}>
	<!-- Header -->
	{#if header || title}
		<header class="border-b border-gray-100 {paddingClasses[padding]} {headerClass}">
			{#if header}
				{@render header()}
			{:else if title}
				<div>
					<h3 class="text-xl font-semibold text-gray-800">
						{title}
					</h3>
					{#if subtitle}
						<p class="text-sm text-gray-600 mt-1">
							{subtitle}
						</p>
					{/if}
				</div>
			{/if}
		</header>
	{/if}
	
	<!-- Body -->
	<div class="{paddingClasses[padding]} {bodyClass}">
		{@render children?.()}
	</div>
	
	<!-- Footer -->
	{#if footer}
		<footer class="border-t border-gray-100 bg-gray-50 {paddingClasses[padding]} {footerClass}">
			{@render footer()}
		</footer>
	{/if}
</article>