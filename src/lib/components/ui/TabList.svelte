<!--
  TabList Component - Container for tab triggers
-->
<script lang="ts">
  import type { Snippet } from 'svelte';

  interface TabListProps {
    class?: string;
    children?: Snippet;
  }

  let { children, class: className = '' }: TabListProps = $props();
</script>

<div class="flex space-x-1 bg-slate-800/50 p-1 rounded-xl backdrop-blur-sm border border-slate-700/50 {className}" role="tablist">
  {@render children?.()}
</div>