<!--
  QR Code Component with SVG generation
-->
<script lang="ts">
  import QR from 'qr';

  interface Props {
    url: string;
    size?: number;
    sessionCode?: string;
  }

  let { url, size = 200, sessionCode }: Props = $props();

  // Generate QR code data  
  let qrSvg = $derived(() => {
    try {
      // QR library - simple call, let it handle the defaults
      const code = (QR as any)(url);
      return code;
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      return null;
    }
  });
</script>

{#if qrSvg}
  <div class="flex flex-col items-center space-y-4">
    <div 
      class="p-4 bg-white rounded-xl border-2 border-gray-200 shadow-sm"
      style="width: {size + 32}px; height: {size + 32}px;"
    >
      <div 
        class="w-full h-full flex items-center justify-center"
        style="width: {size}px; height: {size}px;"
      >
        {@html qrSvg}
      </div>
    </div>
    
    {#if sessionCode}
      <div class="text-center">
        <p class="text-sm text-gray-600 mb-1">Session Code</p>
        <p class="text-2xl font-bold text-gray-900 tracking-wider">{sessionCode}</p>
      </div>
    {/if}
  </div>
{:else}
  <div 
    class="flex items-center justify-center bg-gray-100 rounded-xl border-2 border-gray-200"
    style="width: {size + 32}px; height: {size + 32}px;"
  >
    <p class="text-gray-500 text-sm">Failed to generate QR code</p>
  </div>
{/if}

<style>
  /* Ensure QR code SVG scales properly */
  :global(svg) {
    width: 100% !important;
    height: 100% !important;
  }
</style>