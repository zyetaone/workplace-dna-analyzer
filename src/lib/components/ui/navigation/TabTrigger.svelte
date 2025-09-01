<script lang="ts">
	import { Tabs as BitsTabs } from 'bits-ui';
	import type { Snippet } from 'svelte';

	interface Props {
		value: string;
		disabled?: boolean;
		class?: string;
		children?: Snippet;
	}

	let { children, value, disabled = false, class: className = '' }: Props = $props();
</script>

<BitsTabs.Trigger
	{value}
	{disabled}
	class="flex flex-1 items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-medium text-slate-400
	transition-all hover:bg-slate-700/50 hover:text-white
	data-[state=active]:scale-105 data-[state=active]:transform data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-600
	data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg {className}"
>
	{@render children?.()}
</BitsTabs.Trigger>
