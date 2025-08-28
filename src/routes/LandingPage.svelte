<script lang="ts">
  import { goto } from '$app/navigation';
  import { Card, Button } from '$lib/components';

  async function enterDashboard() {
    await goto('/admin');
  }
</script>

<div class="min-h-screen animated-gradient flex items-center justify-center px-4">
  <Card variant="elevated" size="lg" class="max-w-md w-full" title="Workplace DNA Analyzer" subtitle="Interactive workplace preference analysis platform">
    {#snippet children()}
      <div class="space-y-4">
        <Button
          onclick={enterDashboard}
          class="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
          size="lg"
        >
          <span class="text-xl">🚀</span>
          Enter Dashboard
        </Button>

        <div class="text-center">
          <p class="text-sm text-gray-500">
            No authentication required - open access
          </p>
        </div>
      </div>

      <div class="mt-8 pt-6 border-t border-gray-200">
        <div class="space-y-2 text-sm text-gray-600">
          <p class="font-semibold">Features:</p>
          <ul class="list-disc list-inside space-y-1 text-left">
            <li>Simple session-based access</li>
            <li>Real-time survey responses</li>
            <li>Live analytics dashboard</li>
            <li>QR code generation for participants</li>
            <li>Workplace DNA profiling</li>
          </ul>
        </div>
      </div>
    {/snippet}
  </Card>
</div>

<style>
  .animated-gradient {
    background: linear-gradient(-45deg, #667eea, #764ba2, #f093fb, #f5576c);
    background-size: 400% 400%;
    animation: gradient 15s ease infinite;
  }

  @keyframes gradient {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
</style>