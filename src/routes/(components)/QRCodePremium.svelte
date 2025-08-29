<!-- @migration-task Error while migrating Svelte code: Expected token >
https://svelte.dev/e/expected_token -->
<script lang="ts">
  import { cn } from '$lib/utils';
  import QRCode from './QRCode.svelte';
  import { scale, fade } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  
  interface QRCodePremiumProps {
    url: string;
    code: string;
    title?: string;
    subtitle?: string;
    size?: number;
    showInstructions?: boolean;
    class?: string;
  }
  
  let { 
    url,
    code,
    title = 'Join This Session',
    subtitle = 'Scan QR code or enter code',
    size = 280,
    showInstructions = true,
    class: className = ''
  }: QRCodePremiumProps = $props();
  
  let copied = $state(false);
  
  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      copied = true;
      setTimeout(() => copied = false, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }
  
  // Instructions for different devices
  const instructions = [
    { icon: '📱', text: 'Open camera on your phone' },
    { icon: '📷', text: 'Point at the QR code' },
    { icon: '🔗', text: 'Tap the notification to join' }
  ];
</script>

<div 
  class=mergeProps(
    "qr-display-premium",
    className
  )}
  in:scale={{ duration: 500, easing: quintOut }}
>
  <!-- Header -->
  <div class="text-center mb-6">
    <h2 class="text-2xl font-bold gradient-text mb-2">{title}</h2>
    <p class="text-slate-400">{subtitle}</p>
  </div>
  
  <!-- QR Code Container -->
  <div class="relative mx-auto" style="width: fit-content;">
    <div class="qr-wrapper relative">
      <!-- Scanning animation line -->
      <div class="qr-scan-line"></div>
      
      <!-- QR Code -->
      <QRCode text={url} size={size} />
      
      <!-- Corner decorations -->
      <div class="absolute -top-2 -left-2 w-6 h-6 border-t-2 border-l-2 border-purple-500 rounded-tl-lg"></div>
      <div class="absolute -top-2 -right-2 w-6 h-6 border-t-2 border-r-2 border-purple-500 rounded-tr-lg"></div>
      <div class="absolute -bottom-2 -left-2 w-6 h-6 border-b-2 border-l-2 border-purple-500 rounded-bl-lg"></div>
      <div class="absolute -bottom-2 -right-2 w-6 h-6 border-b-2 border-r-2 border-purple-500 rounded-br-lg"></div>
    </div>
    
    <!-- Glow effect -->
    <div class="absolute inset-0 -z-10 blur-3xl opacity-20">
      <div class="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl"></div>
    </div>
  </div>
  
  <!-- Session Code -->
  <div class="mt-8 text-center">
    <p class="text-sm text-slate-400 mb-2">Or enter code manually:</p>
    <button
      onclick={copyCode}
      class="group relative inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 hover:border-purple-400/50 transition-all duration-300"
    >
      <span class="text-2xl font-mono font-bold gradient-text tracking-wider">
        {code}
      </span>
      <div class="flex items-center gap-2">
        {#if copied}
          <span class="text-green-400 text-sm" in:fade={{ duration: 200 }}>
            Copied!
          </span>
        {/if}
        <svg 
          class=mergeProps(
            "w-5 h-5 transition-all duration-300",
            copied ? "text-green-400" : "text-slate-400 group-hover:text-purple-400"
          )}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
        </svg>
      </div>
    </button>
  </div>
  
  <!-- Instructions -->
  {#if showInstructions}
    <div class="mt-8 pt-8 border-t border-slate-700/50">
      <h3 class="text-sm font-semibold text-slate-400 mb-4 text-center">How to Join</h3>
      <div class="grid grid-cols-3 gap-4">
        {#each instructions as instruction, i}
          <div 
            class="text-center"
            in:scale={{ delay: i * 100, duration: 400, easing: quintOut }}
          >
            <div class="text-2xl mb-2">{instruction.icon}</div>
            <p class="text-xs text-slate-500">{instruction.text}</p>
          </div>
        {/each}
      </div>
    </div>
  {/if}
  
  <!-- Live indicator -->
  <div class="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/30">
    <span class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
    <span class="text-xs text-green-400 font-medium">Session Active</span>
  </div>
</div>