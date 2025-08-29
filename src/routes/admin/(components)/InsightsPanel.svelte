<!--
InsightsPanel - Enhanced AI Insights with Tabbed Interface
-->
<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import Card from '$lib/components/ui/Card.svelte';
	import Tabs from '$lib/components/ui/Tabs.svelte';
	import TabList from '$lib/components/ui/TabList.svelte';
	import TabTrigger from '$lib/components/ui/TabTrigger.svelte';
	import TabContent from '$lib/components/ui/TabContent.svelte';
	import type { getSessionStore } from '../admin.svelte.ts';
	import { getAISessionStore } from '../ai.svelte';
	import { analyzeWorkplaceData, generateConceptWordCloud } from '$lib/utils/analysis';
	import DonutChart from '$lib/components/charts/DonutChart.svelte';
	import WordCloud from '$lib/components/charts/WordCloud.svelte';
	import type { Generation } from '$lib/questions';

	interface InsightsPanelProps {
		store: ReturnType<typeof getSessionStore>;
	}

	let { store }: InsightsPanelProps = $props();

	let activeTab = $state('office-dna');

	// Get AI session store
	const aiStore = getAISessionStore(store.session?.code || '');

	// Comprehensive workplace analysis
	let comprehensiveAnalysis = $state<any>(null);
	let isAnalyzing = $state(false);

	// Update AI store with session data
	$effect(() => {
		if (store.session) {
			aiStore.updateSession(store.session);
		}
		if (store.participants) {
			aiStore.updateParticipants(store.participants);
			// Perform comprehensive analysis
			performAnalysis();
		}
	});

	const insights = $derived(store.insights);
	const aiInsights = $derived(aiStore.insights);
	const isLoadingAI = $derived(aiStore.loading);
	const aiError = $derived(aiStore.error);

	// Perform comprehensive workplace analysis
	async function performAnalysis() {
		if (!store.participants || store.participants.length === 0) return;

		isAnalyzing = true;
		try {
			// Convert participants to analysis format
			const participantsForAnalysis = store.participants.map((p) => ({
				id: p.id,
				name: p.name || 'Anonymous',
				generation: (p.generation || 'Millennials') as Generation,
				responses: p.responses || {},
				preferenceScores: p.preferenceScores || {
					collaboration: 5,
					formality: 5,
					tech: 5,
					wellness: 5
				},
				completed: p.completed
			}));

			comprehensiveAnalysis = analyzeWorkplaceData(participantsForAnalysis);
		} catch (error) {
			console.error('Analysis error:', error);
		} finally {
			isAnalyzing = false;
		}
	}

	// Refresh concept word cloud
	async function refreshConcepts() {
		if (!comprehensiveAnalysis) return;

		try {
			comprehensiveAnalysis.concepts = await generateConceptWordCloud(comprehensiveAnalysis);
		} catch (error) {
			console.error('Concept refresh error:', error);
		}
	}

	// Load AI insights when there are completed participants
	$effect(() => {
		const completedCount = store.participants?.filter((p) => p.completed).length || 0;
		if (completedCount > 0 && !isLoadingAI && aiInsights.length === 0) {
			console.log('🎯 Generating AI insights for completed participants...');
			aiStore.generateInsights();
		}
	});

	// Monitor AI insights generation
	$effect(() => {
		const completedCount = store.participants?.filter((p) => p.completed).length || 0;
		if (completedCount > 0 && !isLoadingAI && aiInsights.length === 0) {
			console.log('🎯 Auto-generating AI insights for', completedCount, 'completed participants');
		}
	});
</script>

<Card variant="elevated" class="mb-6">
	{#snippet children()}
		<div class="p-6">
			<div class="flex items-center gap-3 mb-6" in:fly={{ y: 20, duration: 600 }}>
				<h2 class="text-2xl font-bold text-gray-900">ZYETA AI Insights</h2>
				<div class="live-pulse-enhanced"></div>
			</div>

			{#if insights}
				<Tabs bind:value={activeTab}>
					<TabList class="mb-6">
						<TabTrigger value="office-dna">🏢 Office DNA</TabTrigger>
					</TabList>

					<!-- Office DNA Tab -->
					<TabContent value="office-dna" class="tab-content">
						<div class="space-y-6">
							<!-- Generation Analysis -->
							{#if comprehensiveAnalysis && comprehensiveAnalysis.generationChartData.length > 0}
								<div
									class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200"
								>
									<h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
										<span class="text-2xl">👥</span>
										Generation Distribution
									</h3>
									<div class="flex items-center justify-center">
										<DonutChart
											data={comprehensiveAnalysis.generationChartData}
											variant="generation"
										/>
									</div>
									<div class="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
										{#each comprehensiveAnalysis.generationBreakdown as gen}
											<div class="text-center">
												<div class="text-2xl font-bold text-blue-600">{gen.percentage}%</div>
												<div class="text-sm text-gray-600">{gen.generation}</div>
												<div class="text-xs text-gray-500">{gen.count} people</div>
											</div>
										{/each}
									</div>
								</div>
							{/if}

							<!-- Concept Word Cloud -->
							{#if comprehensiveAnalysis && comprehensiveAnalysis.concepts.length > 0}
								<WordCloud
									variant="concept"
									concepts={comprehensiveAnalysis.concepts}
									onRefresh={refreshConcepts}
								/>
							{/if}

							<!-- AI Insights -->
							{#if true || store.participants?.filter((p) => p.completed).length > 0}
								<div
									class="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-200"
								>
									<h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
										<span class="text-2xl">🤖</span>
										AI Workplace Analysis
										{#if isLoadingAI}
											<div class="flex items-center gap-2 ml-2">
												<div class="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
												<span class="text-sm text-purple-600">Analyzing...</span>
											</div>
										{/if}
									</h3>

									<!-- AI Insights -->
									<div class="space-y-3">
										{#each aiInsights as insight, index}
											<div
												class="bg-white/70 rounded-lg p-4 text-gray-700"
												in:fly={{ y: 20, duration: 500, delay: index * 100 }}
											>
												<div class="flex items-start gap-3">
													<div class="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
													<div class="flex-1">
														<div class="flex items-center justify-between mb-1">
															<h4 class="font-medium text-sm text-gray-800">{insight.title}</h4>
															<span class="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded">
																{Math.round(insight.confidence * 100)}% confidence
															</span>
														</div>
														<p class="text-sm leading-relaxed mb-2">{insight.content}</p>
														<p class="text-xs text-purple-700 font-medium">
															{insight.recommendation}
														</p>
													</div>
												</div>
											</div>
										{/each}

										<!-- Loading State -->
										{#if isLoadingAI && aiInsights.length === 0}
											<div class="bg-white/70 rounded-lg p-4" in:fade={{ duration: 300 }}>
												<div class="flex items-center gap-3">
													<div class="flex space-x-1">
														<div class="w-1 h-1 bg-purple-500 rounded-full animate-pulse"></div>
														<div
															class="w-1 h-1 bg-purple-500 rounded-full animate-pulse"
															style="animation-delay: 0.2s"
														></div>
														<div
															class="w-1 h-1 bg-purple-500 rounded-full animate-pulse"
															style="animation-delay: 0.4s"
														></div>
													</div>
													<span class="text-xs text-purple-600">Generating AI insights...</span>
												</div>
											</div>
										{/if}

										<!-- Error State -->
										{#if aiError}
											<div class="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
												<div class="flex items-center gap-2 mb-2">
													<span class="text-red-500">⚠️</span>
													<span class="text-sm font-medium text-red-800">AI Analysis Error</span>
												</div>
												<p class="text-sm text-red-700 mb-3">{aiError}</p>
												<button
													class="text-sm text-red-600 hover:text-red-800 transition-colors"
													onclick={() => aiStore.generateInsights()}
												>
													🔄 Try Again
												</button>
											</div>
										{/if}

										<!-- Manual Refresh Button -->
										{#if !isLoadingAI && aiInsights.length > 0 && !aiError}
											<div class="text-center pt-4">
												<button
													class="text-sm text-purple-600 hover:text-purple-800 transition-colors"
													onclick={() => aiStore.generateInsights()}
												>
													🔄 Refresh Analysis
												</button>
											</div>
										{/if}
									</div>
								</div>
							{/if}

							<!-- Culture Analysis (existing) -->
							{#if aiInsights.length > 0}
								<div
									class="bg-gradient-to-r from-blue-50 to-teal-50 rounded-xl p-6 border border-blue-200"
								>
									<h3 class="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
										<span class="text-2xl">🎯</span>
										Statistical Analysis
									</h3>
									<p class="text-gray-700 mb-4">{insights.officeAnalysis.description}</p>
									<div class="grid md:grid-cols-3 gap-4">
										{#each insights.officeAnalysis.recommendations as rec}
											<div class="bg-white/70 rounded-lg p-3 text-sm text-gray-700">
												{rec}
											</div>
										{/each}
									</div>
								</div>
							{/if}

							<!-- Key Metrics -->
							<div class="grid md:grid-cols-2 gap-6">
								<div
									class="p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-200"
								>
									<div class="flex items-center gap-3 mb-2">
										<div
											class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center"
										>
											<span class="text-xl">🎯</span>
										</div>
										<div>
											<h4 class="font-semibold text-gray-800">Top Preference</h4>
											<p class="text-sm text-gray-600">{insights.topPreference.label}</p>
										</div>
									</div>
									<div class="text-2xl font-bold text-blue-600">
										{insights.topPreference.score}%
									</div>
								</div>

								<div
									class="p-4 bg-gradient-to-br from-green-50 to-teal-50 rounded-lg border border-green-200"
								>
									<div class="flex items-center gap-3 mb-2">
										<div
											class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center"
										>
											<span class="text-xl">👥</span>
										</div>
										<div>
											<h4 class="font-semibold text-gray-800">Dominant Generation</h4>
											<p class="text-sm text-gray-600">Most represented group</p>
										</div>
									</div>
									<div class="text-lg font-bold text-green-600">
										{comprehensiveAnalysis?.dominantGeneration || 'N/A'}
									</div>
								</div>
							</div>
						</div>
					</TabContent>
				</Tabs>
			{:else}
				<div class="text-center py-12" in:fade={{ duration: 600 }}>
					<div
						class="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4"
					>
						<svg
							class="w-8 h-8 text-purple-600"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
							/>
						</svg>
					</div>
					<h3 class="text-lg font-medium text-gray-800 mb-2">AI Insights</h3>
					<p class="text-gray-600 mb-4">
						Complete responses will generate personalized workplace insights
					</p>

					{#if aiError}
						<div class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
							<p class="text-red-700 text-sm">Error: {aiError}</p>
							<button
								class="mt-2 text-sm text-red-600 hover:text-red-800 underline"
								onclick={() => aiStore.generateInsights()}
							>
								Try Again
							</button>
						</div>
					{/if}

					{#if aiError}
						<div class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
							<p class="text-red-700 text-sm">Error: {aiError}</p>
						</div>
					{/if}
				</div>
			{/if}
		</div>
	{/snippet}
</Card>
