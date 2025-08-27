<!-- 
	GridLayout.svelte
	Responsive grid layout component for organizing cards and content
	Supports various column configurations and gap sizes
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	
	interface Props {
		children?: Snippet;
		cols?: {
			default?: 1 | 2 | 3 | 4;
			sm?: 1 | 2 | 3 | 4;
			md?: 1 | 2 | 3 | 4;
			lg?: 1 | 2 | 3 | 4 | 5 | 6;
			xl?: 1 | 2 | 3 | 4 | 5 | 6;
		};
		gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
		class?: string;
	}
	
	let {
		children,
		cols = { default: 1, md: 2, lg: 3 },
		gap = 'md',
		class: className = ''
	}: Props = $props();
	
	const gapClasses = {
		none: 'gap-0',
		sm: 'gap-2',
		md: 'gap-4',
		lg: 'gap-6',
		xl: 'gap-8'
	};
	
	// Build responsive grid classes
	let gridClasses = $derived(() => {
		const classes = ['grid', gapClasses[gap]];
		
		// Default columns
		if (cols.default) {
			classes.push(`grid-cols-${cols.default}`);
		}
		
		// Responsive columns
		if (cols.sm) classes.push(`sm:grid-cols-${cols.sm}`);
		if (cols.md) classes.push(`md:grid-cols-${cols.md}`);
		if (cols.lg) classes.push(`lg:grid-cols-${cols.lg}`);
		if (cols.xl) classes.push(`xl:grid-cols-${cols.xl}`);
		
		return classes.join(' ');
	});
</script>

<div class="{gridClasses()} {className}">
	{@render children?.()}
</div>