<script lang="ts">
  import Button from "$lib/components/ui/Button.svelte";
  import type { getSessionStore } from "../admin.svelte.ts";

  interface SessionHeaderProps {
    store: ReturnType<typeof getSessionStore>;
    onRefresh: () => void;
    onEndSession: () => void;
  }

  let { store, onRefresh, onEndSession }: SessionHeaderProps = $props();

  const statusConfig = $derived(() => {
    if (store.session?.isActive) {
      return { text: '● Active', class: 'text-green-500' };
    }
    return { text: '● Ended', class: 'text-red-500' };
  });
</script>

<div class="flex items-center justify-between">
  <div>
    <h1 class="text-2xl font-bold text-slate-900 dark:text-white">{store.session?.name || 'Loading...'}</h1>
    <div class="flex items-center gap-3 mt-1">
      <span class="px-3 py-1 text-sm font-mono bg-slate-200 dark:bg-gray-700 text-slate-700 dark:text-slate-300 rounded-lg border dark:border-gray-600">
        {store.session?.code || '...'}
      </span>
      <span class="px-3 py-1 text-xs font-medium rounded-full {statusConfig().class}">
        {statusConfig().text}
      </span>
    </div>
  </div>

  <div class="flex items-center gap-3">
    <Button onclick={onRefresh} disabled={store.isLoading} variant="secondary">
      <svg class="w-4 h-4 mr-2 {store.isLoading ? 'animate-spin' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h5M20 20v-5h-5" /><path d="M4 9a9 9 0 0114.13-4.4M20 15a9 9 0 01-14.13 4.4" /></svg>
      {store.isLoading ? 'Refreshing...' : 'Refresh'}
    </Button>
    <Button onclick={onEndSession} variant="destructive">
      End Session
    </Button>
  </div>
</div>
