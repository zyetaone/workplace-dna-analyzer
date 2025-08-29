<!--
  Demo component showcasing {@attach ...} utilities
-->
<script lang="ts">
  import {
    intersectionObserver,
    clickOutside,
    focusTrap,
    resizeObserver,
    autoResize,
    scrollListener,
    copyToClipboard,
    longPress
  } from '$lib/utils/attachments';
  import Tooltip from '$lib/components/ui/Tooltip.svelte';
  import Modal from './Modal.svelte';

  let showModal = $state(false);
  let tooltipContent = $state('Click to copy session code!');
  let copySuccess = $state(false);
  let scrollY = $state(0);
  let windowSize = $state({ width: 0, height: 0 });
  let textareaValue = $state('This textarea will auto-resize as you type...');
  let longPressCount = $state(0);

  // Intersection observer demo
  function handleIntersection(entry: IntersectionObserverEntry) {
    if (entry.isIntersecting) {
      console.log('Element is now visible!');
    }
  }

  // Resize observer demo
  function handleResize(entry: ResizeObserverEntry) {
    windowSize.width = entry.contentRect.width;
    windowSize.height = entry.contentRect.height;
  }

  // Scroll listener demo
  function handleScroll(y: number) {
    scrollY = y;
  }

  // Copy to clipboard demo
  function handleCopySuccess() {
    copySuccess = true;
    setTimeout(() => copySuccess = false, 2000);
  }

  function handleCopyError(error: Error) {
    console.error('Copy failed:', error);
  }

  // Long press demo
  function handleLongPress() {
    longPressCount++;
  }
</script>

<div class="p-8 space-y-8">
  <h1 class="text-3xl font-bold text-center mb-8">
    Attachment Utilities Demo
  </h1>

  <!-- Intersection Observer Demo -->
  <div class="bg-blue-50 p-6 rounded-lg">
    <h2 class="text-xl font-semibold mb-4">Intersection Observer</h2>
    <p class="text-gray-600 mb-4">
      Scroll down to see the intersection observer in action. When this element becomes visible, it logs to console.
    </p>
    <div
      class="bg-blue-200 p-4 rounded"
      {@attach intersectionObserver(handleIntersection, { threshold: 0.5 })}
    >
      👀 Watch the console when this element comes into view!
    </div>
  </div>

  <!-- Resize Observer Demo -->
  <div class="bg-green-50 p-6 rounded-lg">
    <h2 class="text-xl font-semibold mb-4">Resize Observer</h2>
    <p class="text-gray-600 mb-4">
      Resize your browser window to see the dimensions update in real-time.
    </p>
    <div
      class="bg-green-200 p-4 rounded resize-both min-h-[100px] min-w-[200px]"
      {@attach resizeObserver(handleResize)}
    >
      <p>Window size: {windowSize.width} × {windowSize.height}</p>
      <p class="text-sm text-gray-600 mt-2">Try resizing this box!</p>
    </div>
  </div>

  <!-- Scroll Listener Demo -->
  <div class="bg-purple-50 p-6 rounded-lg">
    <h2 class="text-xl font-semibold mb-4">Scroll Listener</h2>
    <p class="text-gray-600 mb-4">
      Scroll the page to see the scroll position update (debounced for performance).
    </p>
    <div
      class="bg-purple-200 p-4 rounded"
      {@attach scrollListener(handleScroll, 100)}
    >
      Current scroll position: {scrollY}px
    </div>
  </div>

  <!-- Auto-resize Textarea Demo -->
  <div class="bg-yellow-50 p-6 rounded-lg">
    <h2 class="text-xl font-semibold mb-4">Auto-resize Textarea</h2>
    <p class="text-gray-600 mb-4">
      This textarea automatically adjusts its height as you type.
    </p>
    <textarea
      class="w-full p-3 border border-gray-300 rounded resize-none"
      placeholder="Type here to see auto-resize in action..."
      bind:value={textareaValue}
      {@attach autoResize(60)}
    ></textarea>
  </div>

  <!-- Copy to Clipboard Demo -->
  <div class="bg-indigo-50 p-6 rounded-lg">
    <h2 class="text-xl font-semibold mb-4">Copy to Clipboard</h2>
    <p class="text-gray-600 mb-4">
      Click the button to copy text to clipboard.
    </p>
    <Tooltip content={tooltipContent}>
      <button
        type="button"
        class="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition-colors"
        {@attach copyToClipboard('SESSION-CODE-12345', handleCopySuccess, handleCopyError)}
      >
        {copySuccess ? '✅ Copied!' : '📋 Copy Session Code'}
      </button>
    </Tooltip>
  </div>

  <!-- Long Press Demo -->
  <div class="bg-red-50 p-6 rounded-lg">
    <h2 class="text-xl font-semibold mb-4">Long Press</h2>
    <p class="text-gray-600 mb-4">
      Press and hold the button for 500ms to trigger the action.
    </p>
    <button
      type="button"
      class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
      {@attach longPress(handleLongPress, 500)}
    >
      Long Press Count: {longPressCount}
    </button>
  </div>

  <!-- Modal Demo -->
  <div class="bg-gray-50 p-6 rounded-lg">
    <h2 class="text-xl font-semibold mb-4">Modal with Focus Trap & Click Outside</h2>
    <p class="text-gray-600 mb-4">
      This modal demonstrates focus trapping and click-outside-to-close functionality.
    </p>
    <button
      type="button"
      class="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900 transition-colors"
      onclick={() => showModal = true}
    >
      Open Modal
    </button>

    <Modal
      bind:open={showModal}
      title="Attachment Utilities Demo"
      size="md"
    >
      <div class="space-y-4">
        <p>This modal uses:</p>
        <ul class="list-disc list-inside space-y-1">
          <li><strong>Focus Trap:</strong> Tab navigation is contained within the modal</li>
          <li><strong>Click Outside:</strong> Click the backdrop to close</li>
          <li><strong>Escape Key:</strong> Press Escape to close</li>
          <li><strong>Accessibility:</strong> Proper ARIA attributes and roles</li>
        </ul>
        <div class="flex gap-3 pt-4">
          <button
            type="button"
            class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            onclick={() => showModal = false}
          >
            Close
          </button>
          <button
            type="button"
            class="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            onclick={() => showModal = false}
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  </div>

  <!-- Usage Examples -->
  <div class="bg-gray-100 p-6 rounded-lg">
    <h2 class="text-xl font-semibold mb-4">Usage Examples</h2>
    <div class="space-y-4 text-sm">
      <div>
        <h3 class="font-medium text-gray-800">Intersection Observer:</h3>
        <code class="block bg-gray-800 text-green-400 p-2 rounded mt-1">
          {@html `{@attach intersectionObserver(callback, { threshold: 0.5 })}`}
        </code>
      </div>

      <div>
        <h3 class="font-medium text-gray-800">Click Outside:</h3>
        <code class="block bg-gray-800 text-green-400 p-2 rounded mt-1">
          {@html '{@attach clickOutside(() => closeModal())}'}
        </code>
      </div>

      <div>
        <h3 class="font-medium text-gray-800">Focus Trap:</h3>
        <code class="block bg-gray-800 text-green-400 p-2 rounded mt-1">
          {@html '{@attach focusTrap()}'}  
        </code>
      </div>

      <div>
        <h3 class="font-medium text-gray-800">Auto-resize Textarea:</h3>
        <code class="block bg-gray-800 text-green-400 p-2 rounded mt-1">
          {@html '{@attach autoResize(40)}'}
        </code>
      </div>
    </div>
  </div>
</div>

<style>
  .resize-both {
    resize: both;
  }
</style>