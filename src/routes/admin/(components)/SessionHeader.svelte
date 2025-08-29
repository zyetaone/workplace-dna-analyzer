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
      return { 
        text: 'Active', 
        class: 'bg-green-100 text-green-700 border-green-200',
        icon: '●'
      };
    }
    return { 
      text: 'Ended', 
      class: 'bg-red-100 text-red-700 border-red-200',
      icon: '●'
    };
  });


</script>

<div class="flex items-center justify-between flex-wrap gap-4">
  <div>
    <h1 class="text-2xl font-bold text-gray-900">{store.session?.name || 'Loading...'}</h1>
    <div class="flex items-center gap-3 mt-2">
      <span class="px-3 py-1 text-sm font-mono bg-gray-100 text-gray-700 rounded-lg border border-gray-200 font-semibold">
        {store.session?.code || '...'}
      </span>
      <span class="px-3 py-1 text-xs font-medium rounded-full border {statusConfig().class} flex items-center gap-1">
        <span class="text-xs">{statusConfig().icon}</span>
        {statusConfig().text}
      </span>
      <span class="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded-full border border-purple-200">
        {store.participants?.length || 0} participants
      </span>
    </div>
  </div>

  <div class="flex items-center gap-3">
    <Button onclick={onRefresh} disabled={store.loading} variant="secondary">
      <svg class="w-4 h-4 mr-2 {store.loading ? 'animate-spin' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h5M20 20v-5h-5" /><path d="M4 9a9 9 0 0114.13-4.4M20 15a9 9 0 01-14.13 4.4" /></svg>
      {store.loading ? 'Refreshing...' : 'Refresh'}
    </Button>
    <Button onclick={onEndSession} variant="destructive">
      End Session
    </Button>
  </div>
</div>
