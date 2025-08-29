<!--
InsightsPanel - Enhanced AI Insights with Tabbed Interface
-->
<script lang="ts">
  import { fade, fly } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import Card from "$lib/components/ui/Card.svelte";
  import Tabs from "$lib/components/ui/Tabs.svelte";
  import TabList from "$lib/components/ui/TabList.svelte";
  import TabTrigger from "$lib/components/ui/TabTrigger.svelte";
  import TabContent from "$lib/components/ui/TabContent.svelte";
  import OfficeLayoutPlanner from "./OfficeLayoutPlanner.svelte";
  import CreativeGenerator from "./CreativeGenerator.svelte";
  import type { getSessionStore } from "../admin.svelte.ts";
  import { getStreamingInsights } from '../[code]/ai.remote';

  interface InsightsPanelProps {
    store: ReturnType<typeof getSessionStore>;
  }

  let { store }: InsightsPanelProps = $props();

  let activeTab = $state('office-dna');

  // AI Streaming state
  let streamingInsights = $state<string[]>([]);
  let isLoadingInsights = $state(false);
  let streamingComplete = $state(false);

  const insights = $derived(store.insights);

  // Streaming AI insights functionality
  async function loadStreamingInsights() {
    if (!store.session || isLoadingInsights) return;
    
    isLoadingInsights = true;
    streamingInsights = [];
    streamingComplete = false;

    try {
      const result = await getStreamingInsights({ code: store.session.code });
      
      if (result.insights) {
        // Simulate streaming effect by displaying insights one by one
        for (let i = 0; i < result.insights.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 800)); // 800ms delay between insights
          streamingInsights = [...streamingInsights, result.insights[i].content];
        }
        streamingComplete = true;
      }
    } catch (error) {
      console.error('Failed to load streaming insights:', error);
    } finally {
      isLoadingInsights = false;
    }
  }

  // Auto-load insights when there are completed participants
  $effect(() => {
    if (store.hasCompletedParticipants && !isLoadingInsights && streamingInsights.length === 0) {
      loadStreamingInsights();
    }
  });
</script>

<Card variant="elevated" class="mb-6">
  {#snippet children()}
    <div class="p-6">
      <div class="flex items-center gap-3 mb-6" in:fly={{ y: 20, duration: 600 }}>
        <h2 class="text-heading-2">AI-Powered Insights</h2>
        <div class="live-pulse-enhanced"></div>
      </div>

      {#if insights()}
        <Tabs bind:value={activeTab} class="w-full">
          <TabList class="mb-6">
            <TabTrigger value="office-dna">
              🏢 Office DNA
            </TabTrigger>
            <TabTrigger value="layout-planner">
              📐 Layout Planner
            </TabTrigger>
            <TabTrigger value="creative-brainstorm">
              🎨 Creative Studio
            </TabTrigger>
          </TabList>

          <!-- Office DNA Tab -->
          <TabContent value="office-dna" class="tab-content">
            <div class="space-y-6">

              <!-- AI Streaming Insights -->
              {#if store.participants?.filter(p => p.completed).length > 0}
                <div class="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-200">
                  <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <span class="text-2xl">🤖</span>
                    AI Workplace Analysis
                    {#if isLoadingInsights}
                      <div class="flex items-center gap-2 ml-2">
                        <div class="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                        <span class="text-sm text-purple-600">Analyzing...</span>
                      </div>
                    {/if}
                  </h3>

                  <!-- Streaming Insights -->
                  <div class="space-y-3">
                    {#each streamingInsights as insight, index}
                      <div
                        class="bg-white/70 rounded-lg p-4 text-gray-700"
                        in:fly={{ y: 20, duration: 500, delay: index * 100 }}
                      >
                        <div class="flex items-start gap-3">
                          <div class="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                          <p class="text-sm leading-relaxed">{insight}</p>
                        </div>
                      </div>
                    {/each}

                    <!-- Typing Indicator -->
                    {#if isLoadingInsights && streamingInsights.length > 0}
                      <div
                        class="bg-white/70 rounded-lg p-4"
                        in:fade={{ duration: 300 }}
                      >
                        <div class="flex items-center gap-3">
                          <div class="flex space-x-1">
                            <div class="w-1 h-1 bg-purple-500 rounded-full animate-pulse"></div>
                            <div class="w-1 h-1 bg-purple-500 rounded-full animate-pulse" style="animation-delay: 0.2s"></div>
                            <div class="w-1 h-1 bg-purple-500 rounded-full animate-pulse" style="animation-delay: 0.4s"></div>
                          </div>
                          <span class="text-xs text-purple-600">Generating insight...</span>
                        </div>
                      </div>
                    {/if}

                    <!-- Manual Refresh Button -->
                    {#if streamingComplete}
                      <div class="text-center pt-4">
                        <button
                          class="text-sm text-purple-600 hover:text-purple-800 transition-colors"
                          onclick={() => loadStreamingInsights()}
                        >
                          🔄 Refresh Analysis
                        </button>
                      </div>
                    {/if}
                  </div>
                </div>
              {/if}

              <!-- Culture Analysis (existing) -->
              {#if insights()}
                <div class="bg-gradient-to-r from-blue-50 to-teal-50 rounded-xl p-6 border border-blue-200">
                  <h3 class="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <span class="text-2xl">🎯</span>
                    Statistical Analysis
                  </h3>
                  <p class="text-gray-700 mb-4">{insights().officeAnalysis.description}</p>
                  <div class="grid md:grid-cols-3 gap-4">
                    {#each insights().officeAnalysis.recommendations as rec}
                      <div class="bg-white/70 rounded-lg p-3 text-sm text-gray-700">
                        {rec}
                      </div>
                    {/each}
                  </div>
                </div>
              {/if}

              <!-- Key Metrics -->
              <div class="grid md:grid-cols-2 gap-6">
                <div class="p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                  <div class="flex items-center gap-3 mb-2">
                    <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span class="text-xl">🎯</span>
                    </div>
                    <div>
                      <h4 class="font-semibold text-gray-800">Top Preference</h4>
                      <p class="text-sm text-gray-600">{insights().topPreference.label}</p>
                    </div>
                  </div>
                  <div class="text-2xl font-bold text-blue-600">{insights().topPreference.score}%</div>
                </div>

                <div class="p-4 bg-gradient-to-br from-green-50 to-teal-50 rounded-lg border border-green-200">
                  <div class="flex items-center gap-3 mb-2">
                    <div class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <span class="text-xl">👥</span>
                    </div>
                    <div>
                      <h4 class="font-semibold text-gray-800">Dominant Generation</h4>
                      <p class="text-sm text-gray-600">Most represented group</p>
                    </div>
                  </div>
                  <div class="text-lg font-bold text-green-600">{insights().generation}</div>
                </div>
              </div>
            </div>
          </TabContent>

          <!-- Layout Planner Tab -->
          <TabContent value="layout-planner" class="tab-content">
            <OfficeLayoutPlanner />
          </TabContent>

          <!-- Creative Brainstorm Tab -->
          <TabContent value="creative-brainstorm" class="tab-content">
            <CreativeGenerator />
          </TabContent>
        </Tabs>
      {:else}
        <div class="text-center py-12" in:fade={{ duration: 600 }}>
          <div class="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
            </svg>
          </div>
          <h3 class="text-lg font-medium text-gray-800 mb-2">AI Insights Coming Soon</h3>
          <p class="text-gray-600">Complete responses will generate personalized workplace insights</p>
        </div>
      {/if}
    </div>
  {/snippet}
</Card>