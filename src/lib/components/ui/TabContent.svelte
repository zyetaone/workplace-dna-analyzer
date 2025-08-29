<!--
  TabContent Component - Content for individual tab
-->
<script lang="ts">
  import { getContext } from 'svelte';
  import type { Snippet } from 'svelte';

  interface TabContentProps {
    value: string;
    class?: string;
    children?: Snippet;
  }

  let { children, value, class: className = '' }: TabContentProps = $props();

  const tabsContext = getContext('tabs') as {
    value: string;
  };

  const isActive = $derived(tabsContext?.value === value);
</script>

{#if isActive}
  <div class="tab-content {className}" role="tabpanel">
    {@render children?.()}
  </div>
{/if}