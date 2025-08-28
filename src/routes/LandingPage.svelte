<script lang="ts">
  import { goto } from '$app/navigation';

  async function enterDashboard() {
    await goto('/admin');
  }
</script>

<div class="min-h-screen animated-gradient flex items-center justify-center px-4">
  <div class="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold text-gray-800 mb-2">Workplace DNA Analyzer</h1>
      <p class="text-gray-600">Interactive workplace preference analysis platform</p>
    </div>

    <div class="space-y-4">
      <button
        onclick={enterDashboard}
        class="w-full py-4 font-semibold text-lg flex items-center justify-center gap-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        <span class="text-xl">🚀</span>
        <span>Enter Dashboard</span>
      </button>

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
  </div>
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