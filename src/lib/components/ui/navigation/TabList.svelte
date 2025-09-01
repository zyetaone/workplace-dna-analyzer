<script lang="ts">
	import { Tabs as BitsTabs } from 'bits-ui';
	import type { Snippet } from 'svelte';

	interface Props {
		class?: string;
		children?: Snippet;
	}

	let { children, class: className = '' }: Props = $props();
</script>

<BitsTabs.List
	class="flex space-x-1 rounded-xl border border-slate-700/50 bg-slate-800/50 p-1 backdrop-blur-sm {className}"
>
	{@render children?.()}
</BitsTabs.List>
