<script lang="ts">
	import { fade } from 'svelte/transition';
	
	interface Props {
		content: string;
		position?: 'top' | 'bottom' | 'left' | 'right';
		children?: any;
	}
	
	let { 
		content, 
		position = 'top',
		children
	}: Props = $props();
	
	let visible = $state(false);
	let tooltipRef = $state<HTMLElement>();
	
	const positionClasses = {
		top: 'bottom-full mb-2 left-1/2 -translate-x-1/2',
		bottom: 'top-full mt-2 left-1/2 -translate-x-1/2',
		left: 'right-full mr-2 top-1/2 -translate-y-1/2',
		right: 'left-full ml-2 top-1/2 -translate-y-1/2'
	};
	
	const arrowClasses = {
		top: 'top-full left-1/2 -translate-x-1/2 border-t-gray-800',
		bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-800',
		left: 'left-full top-1/2 -translate-y-1/2 border-l-gray-800',
		right: 'right-full top-1/2 -translate-y-1/2 border-r-gray-800'
	};
</script>

<div 
	class="relative inline-block"
	role="tooltip"
	onmouseenter={() => visible = true}
	onmouseleave={() => visible = false}
>
	{#if children}
		{@render children()}
	{/if}
	
	{#if visible && content}
		<div
			bind:this={tooltipRef}
			class="absolute z-50 px-2 py-1 text-xs text-white bg-gray-800 rounded whitespace-nowrap pointer-events-none {positionClasses[position]}"
			in:fade={{ duration: 200 }}
			out:fade={{ duration: 150 }}
		>
			{content}
			<div class="absolute w-0 h-0 border-4 border-transparent {arrowClasses[position]}"></div>
		</div>
	{/if}
</div>