<!--
  Bits-UI TabList Wrapper - Enhanced styling
-->
<script lang="ts">
	import { Tabs as BitsTabs } from 'bits-ui';
	import type { Snippet } from 'svelte';

	interface TabListProps {
		class?: string;
		children?: Snippet;
	}

	let { children, class: className = '' }: TabListProps = $props();
</script>

<BitsTabs.List
	class="flex space-x-1 bg-slate-800/50 p-1 rounded-xl backdrop-blur-sm border border-slate-700/50 {className}"
>
	{@render children?.()}
</BitsTabs.List>
