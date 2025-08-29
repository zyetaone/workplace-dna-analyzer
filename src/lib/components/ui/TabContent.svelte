<!--
  Bits-UI TabContent Wrapper - Enhanced styling
-->
<script lang="ts">
	import { Tabs as BitsTabs } from 'bits-ui';
	import type { Snippet } from 'svelte';

	interface TabContentProps {
		value: string;
		class?: string;
		children?: Snippet;
	}

	let { children, value, class: className = '' }: TabContentProps = $props();
</script>

<BitsTabs.Content {value} class={className}>
	{@render children?.()}
</BitsTabs.Content>
