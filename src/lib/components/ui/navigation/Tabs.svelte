<script lang="ts">
	import { Tabs as BitsTabs } from 'bits-ui';
	import type { Snippet } from 'svelte';

	interface Props {
		/** Currently active tab value (bindable) */
		value?: string;
		/** Callback when tab changes */
		onValueChange?: (value: string) => void;
		/** Tab orientation */
		orientation?: 'horizontal' | 'vertical';
		/** How tabs are activated */
		activationMode?: 'automatic' | 'manual';
		/** Whether tabs are disabled */
		disabled?: boolean;
		/** Whether to loop through tabs */
		loop?: boolean;
		/** Additional CSS classes */
		class?: string;
		/** Tab content */
		children?: Snippet;
	}

	let {
		children,
		value = $bindable(''),
		onValueChange,
		orientation = 'horizontal',
		activationMode = 'automatic',
		disabled = false,
		loop = true,
		class: className = ''
	}: Props = $props();
</script>

<!-- 
Tab navigation component with multiple panels.

Example:
<Tabs bind:value={activeTab}>
  <TabList>
    <TabTrigger value="tab1">Tab 1</TabTrigger>
    <TabTrigger value="tab2">Tab 2</TabTrigger>
  </TabList>
  <TabContent value="tab1">Content 1</TabContent>
  <TabContent value="tab2">Content 2</TabContent>
</Tabs>
-->

<BitsTabs.Root
	bind:value
	{onValueChange}
	{orientation}
	{activationMode}
	{disabled}
	{loop}
	class={`w-full ${className}`}
>
	{@render children?.()}
</BitsTabs.Root>
