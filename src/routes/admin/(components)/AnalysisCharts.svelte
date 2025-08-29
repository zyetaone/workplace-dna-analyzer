<script lang="ts">
	import { Card, WordCloud } from '$lib/components';
	import DonutChart from '$lib/components/charts/DonutChart.svelte';
	import D3BarChart from '$lib/components/charts/D3BarChart.svelte';
	import D3RadarChart from '$lib/components/charts/D3RadarChart.svelte';
	import { createDonutData, createRadarData } from '$lib/components/charts/chart-config';
	import type { getSessionStore } from '../admin.svelte.ts';
	import { getWorkplaceDNA } from '$lib/utils/scoring';
	import { fly } from 'svelte/transition';

	interface AnalysisChartsProps {
		store: ReturnType<typeof getSessionStore>;
	}

	let { store }: AnalysisChartsProps = $props();

	const analytics = $derived(store.analytics());

	// Generation distribution data for donut chart
	const generationDonutData = $derived(() => {
		if (!analytics.generationDistribution) return null;
		const genColors: Record<string, string> = {
			'Gen Z': '#ec4899',
			Millennial: '#8b5cf6',
			'Gen X': '#6366f1',
			'Baby Boomer': '#14b8a6'
		};
		return createDonutData(analytics.generationDistribution, genColors);
	});

	// Average preference scores for radar chart
	const averageScores = $derived(() => {
		if (!analytics.preferenceScores) return null;
		return createRadarData(
			analytics.preferenceScores as unknown as Record<string, number>,
			'Team Average'
		);
	});

	// Workplace DNA profile data
	const workplaceDnaData = $derived(() => {
		const profiles: Record<string, number> = {};
		store.participants?.forEach((p) => {
			if (p.completed && p.preferenceScores) {
				const dna = getWorkplaceDNA(p.preferenceScores);
				profiles[dna] = (profiles[dna] || 0) + 1;
			}
		});
		return profiles;
	});

	// Word cloud data for conceptual trends
	const wordCloudData = $derived(() => analytics.wordCloudData || []);
</script>

<!--

  // Generation distribution data for donut chart
  const generationDonutData = $derived(() => {
    const counts: Record<string, number> = {};
    if (store.participants?.length > 0) {
      store.participants.forEach(p => {
        if (p.generation) {
          counts[p.generation] = (counts[p.generation] || 0) + 1;
        }
      });
    }

    if (Object.keys(counts).length === 0) return null;

    // Use generation-specific colors
    const genColors: Record<string, string> = {
      'Gen Z': '#ec4899',
      'Millennial': '#8b5cf6',
      'Gen X': '#6366f1',
      'Baby Boomer': '#14b8a6'
    };

    return createDonutData(counts, genColors);
  });

  // Average preference scores for radar chart
  const averageScores = $derived(() => {
    const completed = store.participants?.filter(p => p.completed && p.preferenceScores) || [];
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

    const averages = {
      collaboration: Math.round(totals.collaboration / completed.length),
      formality: Math.round(totals.formality / completed.length),
      tech: Math.round(totals.tech / completed.length),
      wellness: Math.round(totals.wellness / completed.length)
    };

    return createRadarData(averages, 'Team Average');
  });

  // Workplace DNA profile data
  const workplaceDnaData = $derived(() => {
    const completed = store.participants?.filter(p => p.completed && p.preferenceScores) || [];
    if (completed.length === 0) return {};

    const profiles: Record<string, number> = {};

    completed.forEach(p => {
      const scores = p.preferenceScores;
      if (!scores) return;

      // Determine primary trait based on highest score
      let primaryTrait = 'Balanced';
      let maxScore = 0;

      if (scores.collaboration > maxScore) {
        maxScore = scores.collaboration;
        primaryTrait = 'Collaborative';
      }
      if (scores.formality > maxScore) {
        maxScore = scores.formality;
        primaryTrait = 'Structured';
      }
      if (scores.tech > maxScore) {
        maxScore = scores.tech;
        primaryTrait = 'Digital-First';
      }
      if (scores.wellness > maxScore) {
        maxScore = scores.wellness;
        primaryTrait = 'Wellness-Focused';
      }

      // Handle ties by checking if all scores are similar
      const scoreValues = [scores.collaboration, scores.formality, scores.tech, scores.wellness];
      const range = Math.max(...scoreValues) - Math.min(...scoreValues);
      if (range < 20) {
        primaryTrait = 'Balanced';
      }

      profiles[primaryTrait] = (profiles[primaryTrait] || 0) + 1;
    });

    return profiles;
  });

  // Word cloud data for conceptual trends
  const wordCloudData = $derived(() => {
    const completed = store.participants?.filter(p => p.completed) || [];
    if (completed.length === 0) return [];

    // Generate word frequencies based on participant data
    const wordFreq: Record<string, number> = {};

    // Add generation terms with higher weight
    completed.forEach(p => {
      if (p.generation) {
        wordFreq[p.generation] = (wordFreq[p.generation] || 0) + 4;
      }
    });

    // Add preference keywords based on scores
    completed.forEach(p => {
      const scores = p.preferenceScores;
      if (!scores) return;

      // Add trait keywords based on high scores
      if (scores.collaboration > 70) {
        wordFreq['Collaboration'] = (wordFreq['Collaboration'] || 0) + 2;
        wordFreq['Teamwork'] = (wordFreq['Teamwork'] || 0) + 1;
      }
      if (scores.formality > 70) {
        wordFreq['Structure'] = (wordFreq['Structure'] || 0) + 2;
        wordFreq['Process'] = (wordFreq['Process'] || 0) + 1;
      }
      if (scores.tech > 70) {
        wordFreq['Technology'] = (wordFreq['Technology'] || 0) + 2;
        wordFreq['Digital'] = (wordFreq['Digital'] || 0) + 1;
      }
      if (scores.wellness > 70) {
        wordFreq['Wellness'] = (wordFreq['Wellness'] || 0) + 2;
        wordFreq['Balance'] = (wordFreq['Balance'] || 0) + 1;
      }
    });

    // Add DNA profile terms
    Object.entries(workplaceDnaData()).forEach(([trait, count]) => {
      if (count > 0) {
        wordFreq[trait] = (wordFreq[trait] || 0) + count;
      }
    });

    // Convert to word cloud format
    return Object.entries(wordFreq).map(([text, count]) => ({
      text,
      size: Math.min(50, 20 + count * 4) // Scale size based on frequency
    }));
  });
</script>

<!-- Enhanced Analytics Section -->
<div class="mb-8">
	<div class="flex items-center gap-3 mb-6" in:fly={{ y: 20, duration: 600 }}>
		<h2 class="text-heading-2">Real-Time Analytics</h2>
		<div class="live-pulse-enhanced"></div>
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		<!-- Generation Distribution Card -->
		<Card variant="elevated" class="chart-entering stagger-1">
			{#snippet children()}
				<div class="chart-container">
					{#if generationDonutData()}
						<DonutChart data={generationDonutData()} variant="generation" />
					{:else}
						<div class="flex flex-col items-center justify-center h-full text-center">
							<svg
								class="w-12 h-12 text-gray-400 mb-3"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
								/>
							</svg>
							<p class="text-gray-500 text-sm">No participant data yet</p>
						</div>
					{/if}
				</div>
			{/snippet}
		</Card>

		<!-- Average Preferences Card -->
		<Card variant="elevated" class="chart-entering stagger-2">
			{#snippet children()}
				<div class="chart-container">
					{#if averageScores()}
						<D3RadarChart data={averageScores()} />
					{:else}
						<div class="flex flex-col items-center justify-center h-full text-center">
							<svg
								class="w-12 h-12 text-gray-400 mb-3"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
								/>
							</svg>
							<p class="text-gray-500 text-sm">No completed responses yet</p>
						</div>
					{/if}
				</div>
			{/snippet}
		</Card>

		<!-- Workplace DNA Profile Card -->
		<Card variant="elevated" class="chart-entering stagger-3">
			{#snippet children()}
				<div class="chart-container">
					{#if Object.keys(workplaceDnaData()).length > 0}
						<D3BarChart
							scores={Object.entries(workplaceDnaData()).map(([label, value]) => ({
								label,
								value
							}))}
						/>
					{:else}
						<div class="flex flex-col items-center justify-center h-full text-center">
							<svg
								class="w-12 h-12 text-gray-400 mb-3"
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
							<p class="text-gray-500 text-sm">Complete quiz to see DNA profile</p>
						</div>
					{/if}
				</div>
			{/snippet}
		</Card>

		<!-- Conceptual Trends Cloud Card -->
		<Card variant="elevated" class="chart-entering stagger-4">
			{#snippet children()}
				<div class="chart-container">
					{#if wordCloudData().length > 0}
						<WordCloud words={wordCloudData()} height={250} />
					{:else}
						<div class="flex flex-col items-center justify-center h-full text-center">
							<svg
								class="w-12 h-12 text-gray-400 mb-3"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M13 10V3L4 14h7v7l9-11h-7z"
								/>
							</svg>
							<p class="text-gray-500 text-sm">Trends will appear as participants join</p>
						</div>
					{/if}
				</div>
			{/snippet}
		</Card>
	</div>
</div>
