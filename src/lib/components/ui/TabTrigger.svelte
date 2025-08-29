<!--
  Bits-UI TabTrigger Wrapper - Enhanced styling
-->
<script lang="ts">
	import { Tabs as BitsTabs } from 'bits-ui';
	import type { Snippet } from 'svelte';

	interface TabTriggerProps {
		value: string;
		disabled?: boolean;
		class?: string;
		children?: Snippet;
	}

	let { children, value, disabled = false, class: className = '' }: TabTriggerProps = $props();
</script>

<BitsTabs.Trigger
	{value}
	{disabled}
	class="flex-1 px-6 py-3 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2
    data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-600 data-[state=active]:to-purple-600
    data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:transform data-[state=active]:scale-105
    text-slate-400 hover:text-white hover:bg-slate-700/50 {className}"
>
	{@render children?.()}
</BitsTabs.Trigger>
