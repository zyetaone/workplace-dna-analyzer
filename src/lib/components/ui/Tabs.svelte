<!--
  Simple Tabs Component - Replacement for bits-ui
-->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Snippet } from 'svelte';

  interface TabsProps {
    value?: string;
    onValueChange?: (value: string) => void;
    children?: Snippet;
  }

  let { children, value = $bindable(''), onValueChange }: TabsProps = $props();

  const dispatch = createEventDispatcher();

  function selectTab(newValue: string) {
    value = newValue;
    onValueChange?.(newValue);
    dispatch('change', { value: newValue });
  }
</script>

<div class="tabs-container">
  {@render children?.()}
</div>

<style>
  .tabs-container {
    width: 100%;
  }
</style>