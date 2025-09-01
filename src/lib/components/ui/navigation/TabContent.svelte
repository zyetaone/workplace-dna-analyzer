<!--
  Bits-UI TabContent Wrapper - With proper transition support
-->
<script lang="ts">
	import { Tabs as BitsTabs } from 'bits-ui';
	import { fade, slide } from 'svelte/transition';
	import type { Snippet } from 'svelte';

	interface Props {
		value: string;
		class?: string;
		children?: Snippet;
		/** Enable transitions */
		transitions?: boolean;
	}

	let { children, value, class: className = '', transitions = true }: Props = $props();
</script>

<BitsTabs.Content {value} forceMount>
	{#snippet child({ props, selected })}
		{#if selected}
			<div {...props} class={className} 
				in:fade={{ duration: 200 }} 
				out:fade={{ duration: 150 }}>
				{@render children?.()}
			</div>
		{/if}
	{/snippet}
</BitsTabs.Content>
