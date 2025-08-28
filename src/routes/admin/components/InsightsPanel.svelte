<!--
InsightsPanel - Enhanced AI Insights with Tabbed Interface
-->
<script lang="ts">
  import { fade, fly } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import Card from "$lib/components/ui/Card.svelte";
  import { Tabs } from 'bits-ui';
  import OfficeLayoutPlanner from "$lib/components/OfficeLayoutPlanner.svelte";
  import CreativeGenerator from "$lib/components/CreativeGenerator.svelte";
  import type { SimpleSessionStore } from "$lib/state/simple-session-store.svelte";
  import { generateInsights } from '../../../routes/admin/[code]/ai-insights.remote';

  interface InsightsPanelProps {
    store: SimpleSessionStore;
  }

  let { store }: InsightsPanelProps = $props();

  let activeTab = $state('office-dna');
  let officePrompt = $state('');
  let layoutPrompt = $state('');
  let creativePrompt = $state('');

  // AI Streaming state
  let streamingInsights = $state<string[]>([]);
  let isLoadingInsights = $state(false);
  let streamingComplete = $state(false);
  let currentInsightIndex = $state(0);

  // Enhanced insights data
  const generationData = $derived(() => {
    const counts: Record<string, number> = {};
    if (store.participants && Array.isArray(store.participants)) {
      store.participants.forEach(p => {
        if (p.generation) {
          counts[p.generation] = (counts[p.generation] || 0) + 1;
        }
      });
    }
    return counts;
  });

  const averageScores = $derived(() => {
    if (!store.participants || !Array.isArray(store.participants)) return null;
    const completed = store.participants.filter(p => p.completed && p.preferenceScores);
    if (completed.length === 0) return null;

    const totals = { collaboration: 0, formality: 0, tech: 0, wellness: 0 };
    completed.forEach(p => {
      if (p.preferenceScores) {
        totals.collaboration += p.preferenceScores.collaboration || 0;
        totals.formality += p.preferenceScores.formality || 0;
        totals.tech += p.preferenceScores.tech || 0;
        totals.wellness += p.preferenceScores.wellness || 0;
      }
    });

    return {
      collaboration: Math.round(totals.collaboration / completed.length),
      formality: Math.round(totals.formality / completed.length),
      tech: Math.round(totals.tech / completed.length),
      wellness: Math.round(totals.wellness / completed.length)
    };
  });

  // AI-generated insights
  const insights = $derived(() => {
    if (!averageScores()) return null;

    const scores = averageScores();
    const topPreference = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
    const generation = Object.entries(generationData()).sort((a, b) => b[1] - a[1])[0];

    return {
      topPreference: {
        trait: topPreference[0],
        score: topPreference[1],
        label: getPreferenceLabel(topPreference[0])
      },
      generation: generation ? generation[0] : null,
      recommendations: generateRecommendations(scores),
      officeAnalysis: generateOfficeAnalysis(scores, generationData()),
      layoutSuggestions: generateLayoutSuggestions(scores)
    };
  });

  function generateOfficeAnalysis(scores: any, generations: any) {
    const dominantTraits = Object.entries(scores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([trait, score]) => ({ trait, score }));

    const genBreakdown = Object.entries(generations)
      .map(([gen, count]) => `${count} ${gen}`)
      .join(', ');

    return {
      culture: dominantTraits[0]?.trait || 'Balanced',
      description: `This team shows strong ${dominantTraits[0]?.trait.toLowerCase()} tendencies with ${dominantTraits[0]?.score}% preference. The ${genBreakdown} demographic suggests a ${dominantTraits[0]?.trait.toLowerCase()}-oriented workplace culture.`,
      recommendations: [
        `Create ${dominantTraits[0]?.trait.toLowerCase()}-focused spaces`,
        `Implement ${dominantTraits[1]?.trait.toLowerCase()} initiatives`,
        `Design for ${genBreakdown} preferences`
      ]
    };
  }

  function generateLayoutSuggestions(scores: any) {
    const suggestions = [];

    if (scores.collaboration > 70) {
      suggestions.push({
        type: 'Open Layout',
        description: 'Large collaborative spaces with movable furniture',
        zones: ['Team areas', 'Whiteboard walls', 'Flexible seating']
      });
    }

    if (scores.tech > 70) {
      suggestions.push({
        type: 'Tech-Forward',
        description: 'Modern workstations with advanced technology integration',
        zones: ['Charging stations', 'Video conferencing pods', 'Smart lighting']
      });
    }

    if (scores.wellness > 70) {
      suggestions.push({
        type: 'Wellness-Centric',
        description: 'Spaces designed for physical and mental wellbeing',
        zones: ['Quiet zones', 'Standing desks', 'Natural lighting areas']
      });
    }

    return suggestions;
  }

  function getPreferenceLabel(trait: string): string {
    const labels = {
      collaboration: 'Team Collaboration',
      formality: 'Structured Environment',
      tech: 'Digital Innovation',
      wellness: 'Work-Life Balance'
    };
    return labels[trait as keyof typeof labels] || trait;
  }

  function generateRecommendations(scores: any) {
    const recommendations = [];

    if (scores.tech > 70) {
      recommendations.push({
        icon: '💻',
        text: 'Invest in cutting-edge digital tools and training programs',
        priority: 'high'
      });
    }

    if (scores.collaboration > 70) {
      recommendations.push({
        icon: '🤝',
        text: 'Create more collaborative workspaces and team-building activities',
        priority: 'high'
      });
    }

    if (scores.wellness > 70) {
      recommendations.push({
        icon: '🌱',
        text: 'Focus on work-life balance with flexible schedules and wellness programs',
        priority: 'high'
      });
    }

    if (scores.formality < 40) {
      recommendations.push({
        icon: '🎯',
        text: 'Consider more flexible policies and casual work environment',
        priority: 'medium'
      });
    }

    return recommendations.slice(0, 3); // Top 3 recommendations
  }

  // Streaming AI insights functionality
  async function loadStreamingInsights() {
    if (!store.session || isLoadingInsights) return;
    
    isLoadingInsights = true;
    streamingInsights = [];
    currentInsightIndex = 0;
    streamingComplete = false;

    try {
      const result = await generateInsights({ code: store.session.code });
      
      if (result.success && result.insights) {
        // Simulate streaming effect by displaying insights one by one
        for (let i = 0; i < result.insights.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 800)); // 800ms delay between insights
          streamingInsights = [...streamingInsights, result.insights[i].content];
          currentInsightIndex = i;
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
    const completedCount = store.participants?.filter(p => p.completed).length || 0;
    if (completedCount > 0 && !isLoadingInsights && streamingInsights.length === 0) {
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
        <Tabs.Root bind:value={activeTab} class="w-full">
          <Tabs.List class="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
            <Tabs.Trigger
              value="office-dna"
              class="flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              🏢 Office DNA
            </Tabs.Trigger>
            <Tabs.Trigger
              value="layout-planner"
              class="flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              📐 Layout Planner
            </Tabs.Trigger>
            <Tabs.Trigger
              value="creative-brainstorm"
              class="flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              🎨 Creative Studio
            </Tabs.Trigger>
          </Tabs.List>

          <!-- Office DNA Tab -->
          <Tabs.Content value="office-dna" class="tab-content" data-state="active">
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

                {#if insights().generation}
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
                {/if}
              </div>
            </div>
          </Tabs.Content>

          <!-- Layout Planner Tab -->
          <Tabs.Content value="layout-planner" class="tab-content" data-state="inactive">
            <OfficeLayoutPlanner />
          </Tabs.Content>

          <!-- Creative Brainstorm Tab -->
          <Tabs.Content value="creative-brainstorm" class="tab-content" data-state="inactive">
            <CreativeGenerator />
          </Tabs.Content>
        </Tabs.Root>
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