<script lang="ts">
  import { Card, Button } from '$lib/components';

  interface Props {
    title?: string;
    message?: string;
    showHomeButton?: boolean;
    showRetryButton?: boolean;
    onRetry?: () => void;
  }

  let {
    title = 'Invalid Session',
    message = 'The session code you entered is not valid. Please check the code and try again.',
    showHomeButton = true,
    showRetryButton = false,
    onRetry
  }: Props = $props();
</script>

<div class="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
  <Card variant="elevated" class="max-w-md w-full text-center">
    <div class="mb-6">
      <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
        </svg>
      </div>
      <h1 class="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
      <p class="text-gray-600">{message}</p>
    </div>

    <div class="space-y-3">
      {#if showRetryButton && onRetry}
        <Button onclick={onRetry} variant="default" class="w-full">
          Try Again
        </Button>
      {/if}

      {#if showHomeButton}
        <a href="/" class="inline-flex items-center justify-center gap-2 font-medium rounded-lg px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 transition-all duration-200 w-full">
          Go to Home
        </a>
      {/if}
    </div>

    <div class="mt-6 p-4 bg-blue-50 rounded-lg">
      <p class="text-sm text-blue-800">
        <strong>Session codes</strong> are 6-character codes consisting of uppercase letters and numbers (e.g., ABC123).
      </p>
    </div>
  </Card>
</div>