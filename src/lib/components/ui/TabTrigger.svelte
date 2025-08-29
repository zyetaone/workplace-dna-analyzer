<!--
  TabTrigger Component - Individual tab button
-->
<script lang="ts">
  import { getContext } from 'svelte';
  import type { Snippet } from 'svelte';

  interface TabTriggerProps {
    value: string;
    disabled?: boolean;
    class?: string;
    children?: Snippet;
  }

  let { children, value, disabled = false, class: className = '' }: TabTriggerProps = $props();

  const tabsContext = getContext('tabs') as {
    value: string;
    selectTab: (value: string) => void;
  };

  function handleClick() {
    if (!disabled && tabsContext) {
      tabsContext.selectTab(value);
    }
  }

  const isActive = $derived(tabsContext?.value === value);
</script>

<button
  {disabled}
  onclick={handleClick}
  class="flex-1 px-6 py-3 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2
    {isActive
      ? 'bg-gradient-to-r from-cyan-600 to-purple-600 text-white shadow-lg transform scale-105'
      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'} {className}"
  role="tab"
  aria-selected={isActive}
  tabindex={isActive ? 0 : -1}
>
  {@render children?.()}
</button>