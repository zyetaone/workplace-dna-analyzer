<!-- Bits UI Tooltip Component -->
<script lang="ts">
	import { Tooltip } from 'bits-ui';
	// Bits UI v1 doesn't support transition props directly
	import type { Snippet } from 'svelte';
	
	interface TooltipProps {
		content: string;
		side?: 'top' | 'right' | 'bottom' | 'left';
		delayDuration?: number;
		children: Snippet;
	}
	
	let { 
		content,
		side = 'top',
		delayDuration = 200,
		children
	}: TooltipProps = $props();
</script>

<Tooltip.Root {delayDuration}>
	<Tooltip.Trigger class="inline-flex">
		{@render children()}
	</Tooltip.Trigger>
	<Tooltip.Content
		{side}
		sideOffset={5}
		class="z-50 overflow-hidden rounded-md bg-gray-900 px-3 py-1.5 text-xs text-white shadow-md"
	>
		{content}
	</Tooltip.Content>
</Tooltip.Root>