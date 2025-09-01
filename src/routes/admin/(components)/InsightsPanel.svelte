<!--
InsightsPanel - Enhanced AI Insights with Tabbed Interface
-->
<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { Card } from '$lib/components/ui';
	import Tabs from '$lib/components/ui/Tabs.svelte';
	import TabList from '$lib/components/ui/TabList.svelte';
	import TabTrigger from '$lib/components/ui/TabTrigger.svelte';
	import TabContent from '$lib/components/ui/TabContent.svelte';
	import type { getSessionStore } from '../admin.svelte.ts';
	import { generateInsights } from '../admin.remote';
	import {
		analyzeWorkplaceData,
		generateConceptWordCloud
	} from '$lib/components/modules/analytics/analysis';
	import DonutChart from '$lib/components/charts/DonutChart.svelte';
	import WordCloud from '$lib/components/charts/WordCloud.svelte';
	import type { Generation } from '$lib/questions';

	interface InsightsPanelProps {
		store: ReturnType<typeof getSessionStore>;
	}

	let { store }: InsightsPanelProps = $props();

	let activeTab = $state('office-dna');

	// Comprehensive workplace analysis
	let comprehensiveAnalysis = $state<any>(null);
	let isAnalyzing = $state(false);

	// Local AI (remote) state
	let aiText = $state<string>('');
	let isLoadingAI = $state(false);
	let aiError = $state<string | null>(null);

	// Update AI store with session data
	$effect(() => {
		if (store.participants) {
			// Perform comprehensive analysis
			performAnalysis();
		}
	});

	const insights = $derived(store.insights);

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
		if (completedCount > 0 && !isLoadingAI && !aiText) {
			void loadAIInsights();
		}
	});

	// Debug: Log AI store state
	async function loadAIInsights() {
		if (!store.session?.id) return;
		isLoadingAI = true;
		aiError = null;
		try {
			const res: any = await generateInsights({ sessionId: store.session.id });
			// RemoteResponse.success wraps; normalize
			aiText = (res && (res.insights || res.answer || '')) as string;
		} catch (e: any) {
			aiError = e?.message || 'Failed to generate insights';
		} finally {
			isLoadingAI = false;
		}
	}
</script>

<Card variant="analytics" class="mb-6">
	{#snippet children()}
		<div class="p-6">
			<div class="mb-6 flex items-center gap-3" in:fly={{ y: 20, duration: 600 }}>
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
							{#if comprehensiveAnalysis && comprehensiveAnalysis.generationChartData && comprehensiveAnalysis.generationChartData.length > 0}
								<div
									class="rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-6"
								>
									<h3 class="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-800">
										<span class="text-2xl">👥</span>
										Generation Distribution
									</h3>
									<div class="flex items-center justify-center">
										<DonutChart
											data={comprehensiveAnalysis.generationChartData}
											variant="generation"
											centerText="Generation"
										/>
									</div>
									<div class="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
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
									variant="concepts"
									concepts={comprehensiveAnalysis.concepts}
									onRefresh={refreshConcepts}
								/>
							{/if}

							<!-- AI Insights -->
							{#if true || store.participants?.filter((p) => p.completed).length > 0}
								<div
									class="rounded-xl border border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50 p-6"
								>
									<h3 class="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-800">
										<span class="text-2xl">🤖</span>
										AI Workplace Analysis
										{#if isLoadingAI}
											<div class="ml-2 flex items-center gap-2">
												<div class="h-2 w-2 animate-pulse rounded-full bg-purple-500"></div>
												<span class="text-sm text-purple-600">Analyzing...</span>
											</div>
										{/if}
									</h3>

									<!-- AI Insights (text) -->
									{#if aiText}
										<div class="whitespace-pre-wrap rounded-lg bg-white/70 p-4 text-gray-700">
											{aiText}
										</div>
									{/if}

									<!-- Loading State -->
									{#if isLoadingAI && !aiText}
										<div class="rounded-lg bg-white/70 p-4" in:fade={{ duration: 300 }}>
											<div class="flex items-center gap-3">
												<div class="flex space-x-1">
													<div class="h-1 w-1 animate-pulse rounded-full bg-purple-500"></div>
													<div
														class="h-1 w-1 animate-pulse rounded-full bg-purple-500"
														style="animation-delay: 0.2s"
													></div>
													<div
														class="h-1 w-1 animate-pulse rounded-full bg-purple-500"
														style="animation-delay: 0.4s"
													></div>
												</div>
												<span class="text-xs text-purple-600">Generating AI insights...</span>
											</div>
										</div>
									{/if}

									<!-- Error State -->
									{#if aiError}
										<div class="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
											<div class="mb-2 flex items-center gap-2">
												<span class="text-red-500">⚠️</span>
												<span class="text-sm font-medium text-red-800">AI Analysis Error</span>
											</div>
											<p class="mb-3 text-sm text-red-700">{aiError}</p>
											<button
												class="text-sm text-red-600 transition-colors hover:text-red-800"
												onclick={loadAIInsights}
											>
												🔄 Try Again
											</button>
										</div>
									{/if}

									<!-- Manual Refresh Button -->
									{#if !isLoadingAI && aiText && !aiError}
										<div class="pt-4 text-center">
											<button
												class="text-sm text-purple-600 transition-colors hover:text-purple-800"
												onclick={loadAIInsights}
											>
												🔄 Refresh Analysis
											</button>
										</div>
									{/if}
								</div>
							{/if}

							<!-- Culture Analysis (existing) -->
							{#if insights}
								<div
									class="rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-teal-50 p-6"
								>
									<h3 class="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-800">
										<span class="text-2xl">🎯</span>
										Statistical Analysis
									</h3>
									<p class="mb-4 text-gray-700">{insights.officeAnalysis.description}</p>
									<div class="grid gap-4 md:grid-cols-3">
										{#each insights.officeAnalysis.recommendations as rec}
											<div class="rounded-lg bg-white/70 p-3 text-sm text-gray-700">
												{rec}
											</div>
										{/each}
									</div>
								</div>
							{/if}

							<!-- Key Metrics -->
							<div class="grid gap-6 md:grid-cols-2">
								<div
									class="rounded-lg border border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50 p-4"
								>
									<div class="mb-2 flex items-center gap-3">
										<div
											class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100"
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
									class="rounded-lg border border-green-200 bg-gradient-to-br from-green-50 to-teal-50 p-4"
								>
									<div class="mb-2 flex items-center gap-3">
										<div
											class="flex h-10 w-10 items-center justify-center rounded-full bg-green-100"
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
				<div class="py-12 text-center" in:fade={{ duration: 600 }}>
					<div
						class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100"
					>
						<svg
							class="h-8 w-8 text-purple-600"
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
					<h3 class="mb-2 text-lg font-medium text-gray-800">AI Insights</h3>
					<p class="mb-4 text-gray-600">
						Complete responses will generate personalized workplace insights
					</p>

					<!-- Manual AI Generation Button -->
					{#if store.participants && store.participants.filter((p) => p.completed).length > 0}
						<button
							class="rounded-lg bg-purple-600 px-4 py-2 text-white transition-colors hover:bg-purple-700"
							onclick={loadAIInsights}
							disabled={isLoadingAI}
						>
							{#if isLoadingAI}
								<span>Generating...</span>
							{:else}
								<span>Generate AI Insights</span>
							{/if}
						</button>
					{/if}

					{#if aiError}
						<div class="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
							<p class="text-sm text-red-700">Error: {aiError}</p>
						</div>
					{/if}
				</div>
			{/if}
		</div>
	{/snippet}
</Card>

<style></style>
