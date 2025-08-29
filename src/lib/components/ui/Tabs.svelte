<!--
  Bits-UI Tabs Wrapper - Enhanced with our styling
-->
<script lang="ts">
	import { Tabs as BitsTabs } from 'bits-ui';
	import type { Snippet } from 'svelte';

	interface TabsProps {
		value?: string;
		onValueChange?: (value: string) => void;
		orientation?: 'horizontal' | 'vertical';
		activationMode?: 'automatic' | 'manual';
		disabled?: boolean;
		loop?: boolean;
		children?: Snippet;
	}

	let {
		children,
		value = $bindable(''),
		onValueChange,
		orientation = 'horizontal',
		activationMode = 'automatic',
		disabled = false,
		loop = true
	}: TabsProps = $props();
</script>

<BitsTabs.Root
	bind:value
	{onValueChange}
	{orientation}
	{activationMode}
	{disabled}
	{loop}
	class="w-full"
>
	{@render children?.()}
</BitsTabs.Root>
