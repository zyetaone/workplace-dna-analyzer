<!--
SessionHeader - Enhanced with Large QR Code
-->
<script lang="ts">
  import Card from "$lib/components/ui/Card.svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import { QRCode } from "$lib/components";
  import type { SimpleSessionStore } from "$lib/state/simple-session-store.svelte";

  interface SessionHeaderProps {
    store: SimpleSessionStore;
    onEndSession: () => void;
  }

  let { store, onEndSession }: SessionHeaderProps = $props();

  const statusConfig = $derived(() => {
    if (store.session?.isActive) {
      return { text: '● Active', class: 'status-active' };
    }
    return { text: '● Paused', class: 'status-inactive' };
  });
</script>

<Card variant="elevated" class="mb-6">
  {#snippet children()}
    <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
      <!-- Session Info & Controls -->
      <div class="flex-1">
        <div class="flex items-center gap-3 mb-4">
          <h1 class="text-heading-2">{store.session?.name}</h1>
          <span class="px-3 py-1 text-sm font-mono bg-gray-100 text-gray-700 rounded-lg">
            {store.session?.code}
          </span>
          <span class="px-3 py-1 text-xs font-medium rounded-full {statusConfig().class}">
            {statusConfig().text}
          </span>
        </div>

        <div class="flex flex-wrap gap-3">
          <Button
            onclick={async () => { await store.toggleActive(); }}
            variant={store.session?.isActive ? "secondary" : "default"}
          >
            {store.session?.isActive ? "Pause Session" : "Resume Session"}
          </Button>
          <Button
            onclick={async () => { await store.refresh(); }}
            disabled={store.loading}
            variant="outline"
          >
            ↻ Refresh
          </Button>
          <Button
            onclick={onEndSession}
            variant="destructive"
          >
            End Session
          </Button>
        </div>
      </div>

      <!-- Enhanced QR Code Section -->
      <div class="flex-shrink-0">
        <div class="qr-container">
          <div class="text-center mb-3">
            <h3 class="text-lg font-semibold text-gray-800 mb-2">Join the Session</h3>
            <p class="text-sm text-gray-600">Scan QR code or click link</p>
          </div>
          <div class="flex justify-center mb-3">
            <QRCode
              url={`${window.location.origin}/${store.session?.code}`}
              size={200}
              class="qr-large"
            />
          </div>
          <div class="text-center">
            <a
              href={`${window.location.origin}/${store.session?.code}`}
              target="_blank"
              class="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
              </svg>
              Open Participant View
            </a>
          </div>
        </div>
      </div>
    </div>
  {/snippet}
</Card>