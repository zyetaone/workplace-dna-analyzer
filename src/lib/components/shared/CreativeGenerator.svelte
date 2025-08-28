<script lang="ts">
  import { fade, fly } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';

  let keywords = $state('');
  let generatedConcepts = $state<string[]>([]);
  let isGenerating = $state(false);
  let selectedConcept = $state<string | null>(null);

  const exampleKeywords = [
    'collaboration', 'technology', 'wellness', 'flexibility',
    'innovation', 'sustainability', 'diversity', 'growth'
  ];

  function addKeyword(keyword: string) {
    if (!keywords.includes(keyword)) {
      keywords = keywords ? `${keywords}, ${keyword}` : keyword;
    }
  }

  async function generateConcepts() {
    if (!keywords.trim()) return;

    isGenerating = true;
    selectedConcept = null;

    // Simulate AI generation delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    const keywordArray = keywords.split(',').map(k => k.trim().toLowerCase());
    generatedConcepts = generateMockConcepts(keywordArray);
    isGenerating = false;
  }

  function generateMockConcepts(keywords: string[]): string[] {
    const concepts = [
      `The "${keywords[0] || 'Dynamic'} Hub" - A flexible workspace that adapts to your team's ${keywords[1] || 'collaborative'} nature`,
      `The "${keywords[2] || 'Wellness'} Oasis" - Where ${keywords[0] || 'work'} meets ${keywords[3] || 'balance'} in perfect harmony`,
      `The "${keywords[1] || 'Tech'} Nexus" - Connecting ${keywords[0] || 'people'} through ${keywords[2] || 'innovation'} and shared purpose`,
      `The "${keywords[3] || 'Growth'} Garden" - Cultivating ${keywords[0] || 'ideas'} in a space designed for ${keywords[1] || 'evolution'}`
    ];

    return concepts.slice(0, Math.min(4, concepts.length));
  }

  function selectConcept(concept: string) {
    selectedConcept = selectedConcept === concept ? null : concept;
  }
</script>

<div class="creative-generator" in:fade={{ duration: 600 }}>
  <!-- Input Section -->
  <div class="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200 p-6 mb-6">
    <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
      <span class="text-2xl">🎨</span>
      Creative Brainstorm Studio
    </h3>

    <div class="space-y-4">
      <div>
        <label for="keywords-input" class="block text-sm font-medium text-gray-700 mb-2">
          Enter keywords from your team's responses:
        </label>
        <textarea
          id="keywords-input"
          bind:value={keywords}
          placeholder="e.g., collaboration, technology, wellness, flexibility..."
          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
          rows="3"
          aria-describedby="keywords-help"
        ></textarea>
        <p id="keywords-help" class="text-xs text-gray-500 mt-1">
          Separate keywords with commas for better AI suggestions
        </p>
      </div>

      <!-- Quick Keyword Suggestions -->
      <div>
        <p class="text-sm text-gray-600 mb-2">Quick suggestions:</p>
        <div class="flex flex-wrap gap-2">
          {#each exampleKeywords as keyword}
            <button
              onclick={() => addKeyword(keyword)}
              class="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm hover:bg-purple-200 transition-colors"
            >
              + {keyword}
            </button>
          {/each}
        </div>
      </div>

      <button
        onclick={generateConcepts}
        disabled={!keywords.trim() || isGenerating}
        class="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
      >
        {#if isGenerating}
          <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          Generating Ideas...
        {:else}
          ✨ Generate Concepts
        {/if}
      </button>
    </div>
  </div>

  <!-- Results Section -->
  {#if generatedConcepts.length > 0}
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6" in:fly={{ y: 20, duration: 500 }}>
      <!-- Generated Concepts -->
      <div class="bg-white rounded-xl border border-gray-200 p-6">
        <h4 class="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span class="text-2xl">💡</span>
          AI-Generated Concepts
        </h4>

        <div class="space-y-3">
          {#each generatedConcepts as concept, index}
            <button
              class="p-4 border border-gray-200 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md hover:border-purple-300 {selectedConcept === concept ? 'bg-purple-50 border-purple-300 shadow-md' : 'bg-gray-50'} text-left w-full"
              onclick={() => selectConcept(concept)}
              onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectConcept(concept); } }}
              aria-label="Select concept: {concept}"
              aria-pressed={selectedConcept === concept}
              in:fly={{ x: -20, duration: 400, delay: index * 100 }}
            >
              <p class="text-sm text-gray-700">{concept}</p>
              {#if selectedConcept === concept}
                <div class="mt-2">
                  <span class="px-3 py-1 bg-purple-600 text-white rounded text-xs">
                    ✓ Selected
                  </span>
                </div>
              {/if}
            </button>
            
            {#if selectedConcept === concept}
              <div class="mt-2 flex justify-end">
                <button
                  class="px-3 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200 transition-colors"
                  onclick={(e) => { e.stopPropagation(); /* Add modify logic here */ }}
                  aria-label="Modify this concept"
                >
                  Modify
                </button>
              </div>
            {/if}
          {/each}
        </div>
      </div>

      <!-- 3D Visualization Preview -->
      <div class="bg-white rounded-xl border border-gray-200 p-6">
        <h4 class="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span class="text-2xl">🏗️</span>
          3D Layout Preview
        </h4>

        {#if selectedConcept}
          <div
            class="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 relative overflow-hidden"
            in:scale={{ duration: 500 }}
          >
            <!-- Animated background pattern -->
            <div class="absolute inset-0 opacity-10">
              <div class="grid grid-cols-8 grid-rows-6 gap-1 h-full">
                {#each Array(48).fill(0) as _, i}
                  <div
                    class="bg-gray-400 rounded-sm animate-pulse"
                    style="animation-delay: {i * 0.1}s"
                  ></div>
                {/each}
              </div>
            </div>

            <div class="text-center z-10">
              <div class="text-6xl mb-4">🏢</div>
              <h5 class="font-semibold text-gray-800 mb-2">3D Preview Ready</h5>
              <p class="text-sm text-gray-600 mb-4">
                Interactive 3D model of your selected concept
              </p>
              <button class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium">
                View in 3D
              </button>
            </div>
          </div>
        {:else}
          <div class="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
            <div class="text-center">
              <div class="text-4xl mb-4">🎯</div>
              <h5 class="font-semibold text-gray-800 mb-2">Select a Concept</h5>
              <p class="text-sm text-gray-600">
                Choose a concept from the left to see its 3D preview
              </p>
            </div>
          </div>
        {/if}

        <!-- Additional Options -->
        <div class="mt-4 space-y-2">
          <button class="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
            Export Layout
          </button>
          <button class="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
            Share with Team
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .creative-generator {
    min-height: 400px;
  }

  textarea::placeholder {
    color: #9ca3af;
  }

  .animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 0.1;
    }
    50% {
      opacity: 0.3;
    }
  }
</style>