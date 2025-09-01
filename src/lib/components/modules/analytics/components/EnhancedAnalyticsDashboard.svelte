<!--
Enhanced Analytics Dashboard
Real-time analytics with activity tracking, session progress, and participant journeys
-->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { fade, slide } from 'svelte/transition';
	import { Card } from '$lib/components';
	import Tabs from '$lib/components/ui/Tabs.svelte';
	import TabList from '$lib/components/ui/TabList.svelte';
	import TabTrigger from '$lib/components/ui/TabTrigger.svelte';
	import TabContent from '$lib/components/ui/TabContent.svelte';
	// import ActivityProgressChart from './ActivityProgressChart.svelte'; // TODO: Component not yet created
	// import ParticipantJourneyMap from './ParticipantJourneyMap.svelte'; // TODO: Component not yet created
	import RealTimeStats from './RealTimeStats.svelte';
	// import EngagementHeatmap from './EngagementHeatmap.svelte'; // TODO: Component not yet created
	// import TrendLineChart from './TrendLineChart.svelte'; // TODO: Component not yet created
	import type {
		RealTimeSessionAnalytics,
		EnhancedActivityMetrics
	} from '../server/enhanced-analytics-engine';

	interface EnhancedAnalyticsDashboardProps {
		sessionCode: string;
		title?: string;
		refreshInterval?: number;
		showJourneyMap?: boolean;
		showEngagementHeatmap?: boolean;
	}

	let {
		sessionCode,
		title = 'Enhanced Analytics Dashboard',
		refreshInterval = 5000,
		showJourneyMap = true,
		showEngagementHeatmap = true
	}: EnhancedAnalyticsDashboardProps = $props();

	let analyticsData: RealTimeSessionAnalytics | null = $state(null);
	let activityMetrics: EnhancedActivityMetrics[] = $state([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let activeTab = $state('overview');
	let refreshTimer: number | null = $state(null);

	// Load analytics data
	async function loadAnalyticsData() {
		try {
			loading = true;
			error = null;

			// In production, this would call the enhanced analytics API
			// For now, we'll simulate the data structure
			const mockData = await generateMockRealTimeData();
			analyticsData = mockData;

			// Load activity-specific metrics
			const mockActivityMetrics = await generateMockActivityMetrics();
			activityMetrics = mockActivityMetrics;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load analytics data';
			console.error('Analytics error:', err);
		} finally {
			loading = false;
		}
	}

	// Start real-time updates
	function startRealTimeUpdates() {
		if (refreshTimer) {
			clearInterval(refreshTimer);
		}
		refreshTimer = setInterval(loadAnalyticsData, refreshInterval);
	}

	// Stop real-time updates
	function stopRealTimeUpdates() {
		if (refreshTimer) {
			clearInterval(refreshTimer);
			refreshTimer = null;
		}
	}

	// Manual refresh
	function refreshData() {
		loadAnalyticsData();
	}

	// Export data
	function exportData() {
		if (!analyticsData) return;

		const exportData = {
			session: analyticsData.session,
			liveStats: analyticsData.liveStats,
			activityProgress: analyticsData.activityProgress,
			participantJourneys: analyticsData.participantJourneys,
			exportedAt: new Date().toISOString()
		};

		const blob = new Blob([JSON.stringify(exportData, null, 2)], {
			type: 'application/json'
		});

		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `analytics-${sessionCode}-${new Date().toISOString().split('T')[0]}.json`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}

	onMount(() => {
		loadAnalyticsData();
		startRealTimeUpdates();
	});

	onDestroy(() => {
		stopRealTimeUpdates();
	});

	// Mock data generators (replace with actual API calls)
	async function generateMockRealTimeData(): Promise<RealTimeSessionAnalytics> {
		await new Promise((resolve) => setTimeout(resolve, 500));

		return {
			session: {
				id: 'session-123',
				code: sessionCode,
				name: 'Team Building Workshop',
				isActive: true
			},
			liveStats: {
				currentParticipants: 24,
				activeParticipants: 18,
				completedParticipants: 6,
				averageEngagement: 78,
				peakConcurrency: 32
			},
			activityProgress: [
				{
					activityId: 'activity-1',
					activityName: 'Icebreaker Quiz',
					totalParticipants: 24,
					completedParticipants: 22,
					inProgressParticipants: 2,
					averageProgress: 92,
					averageTimeSpent: 180,
					completionRate: 92
				},
				{
					activityId: 'activity-2',
					activityName: 'Personality Assessment',
					totalParticipants: 24,
					completedParticipants: 15,
					inProgressParticipants: 7,
					averageProgress: 68,
					averageTimeSpent: 420,
					completionRate: 62
				},
				{
					activityId: 'activity-3',
					activityName: 'Team Preferences Survey',
					totalParticipants: 24,
					completedParticipants: 6,
					inProgressParticipants: 12,
					averageProgress: 35,
					averageTimeSpent: 240,
					completionRate: 25
				}
			],
			participantJourneys: [
				{
					participantId: 'p1',
					name: 'Alice Johnson',
					currentActivity: 'personality-assessment',
					progress: 75,
					timeSpent: 480,
					engagementScore: 85,
					lastActivity: 'icebreaker-quiz',
					journey: [
						{
							activitySlug: 'icebreaker-quiz',
							startedAt: '2024-01-01T10:00:00Z',
							completedAt: '2024-01-01T10:05:00Z',
							timeSpent: 300,
							score: 8.5,
							engagement: 90
						},
						{
							activitySlug: 'personality-assessment',
							startedAt: '2024-01-01T10:10:00Z',
							completedAt: null,
							timeSpent: 480,
							score: 7.2,
							engagement: 85
						}
					]
				}
			],
			recentEvents: [
				{
					id: 'event-1',
					sessionId: 'session-123',
					participantId: 'p1',
					activityId: 'activity-2',
					eventType: 'complete_question',
					eventData: { questionId: 'q5', timeSpent: 45 },
					timestamp: new Date().toISOString()
				}
			]
		};
	}

	async function generateMockActivityMetrics(): Promise<EnhancedActivityMetrics[]> {
		await new Promise((resolve) => setTimeout(resolve, 300));

		return [
			{
				activity: {
					id: 'activity-1',
					slug: 'icebreaker-quiz',
					name: 'Icebreaker Quiz',
					type: 'quiz'
				},
				participation: {
					totalParticipants: 24,
					completedParticipants: 22,
					completionRate: 92,
					averageProgress: 95,
					dropoffRate: 8,
					engagementScore: 88
				},
				performance: {
					averageCompletionTime: 245,
					medianCompletionTime: 220,
					timeDistribution: {
						bins: [0, 300, 600, 900],
						counts: [18, 4, 2, 0],
						percentiles: { p25: 180, p50: 220, p75: 280, p90: 320, p95: 350 }
					},
					responseQualityScore: 82,
					questionDifficultyBreakdown: [
						{
							questionId: 'q1',
							completionRate: 100,
							averageTime: 25,
							skipRate: 0,
							difficulty: 'easy'
						}
					]
				},
				trends: {
					completionTrend: [
						{ timestamp: '2024-01-01T09:00:00Z', value: 2 },
						{ timestamp: '2024-01-01T09:30:00Z', value: 8 },
						{ timestamp: '2024-01-01T10:00:00Z', value: 22 }
					],
					engagementTrend: [
						{ timestamp: '2024-01-01T09:00:00Z', value: 75 },
						{ timestamp: '2024-01-01T09:30:00Z', value: 82 },
						{ timestamp: '2024-01-01T10:00:00Z', value: 88 }
					],
					timeSpentTrend: [
						{ timestamp: '2024-01-01T09:00:00Z', value: 200 },
						{ timestamp: '2024-01-01T09:30:00Z', value: 240 },
						{ timestamp: '2024-01-01T10:00:00Z', value: 245 }
					]
				},
				demographics: {
					completionByGeneration: {
						Millennials: { total: 12, completed: 11, completionRate: 92, averageTime: 240 },
						'Gen Z': { total: 8, completed: 8, completionRate: 100, averageTime: 220 },
						'Gen X': { total: 4, completed: 3, completionRate: 75, averageTime: 280 }
					},
					engagementByGeneration: {
						Millennials: 85,
						'Gen Z': 92,
						'Gen X': 78
					}
				}
			}
		];
	}
</script>

<Card variant="analytics" class="mb-6">
	{#snippet children()}
		<div class="p-6">
			<!-- Header -->
			<div class="mb-6 flex items-center justify-between" in:slide={{ duration: 600 }}>
				<div class="flex items-center gap-3">
					<h2 class="text-2xl font-bold text-gray-900">{title}</h2>
					<div class="relative">
						<div class="absolute top-1/2 left-1/2 w-2 h-2 bg-green-500 rounded-full transform -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
					</div>
				</div>

				<div class="flex items-center gap-3">
					<!-- Refresh Status -->
					<div class="flex items-center gap-2 text-sm text-gray-600">
						<div class="h-2 w-2 animate-pulse rounded-full bg-green-500"></div>
						<span>Live Updates</span>
					</div>

					<!-- Action Buttons -->
					<button
						class="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-blue-700"
						onclick={refreshData}
						disabled={loading}
					>
						{loading ? 'Refreshing...' : '🔄 Refresh'}
					</button>

					<button
						class="rounded-lg bg-green-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-green-700"
						onclick={exportData}
						disabled={!analyticsData}
					>
						📊 Export Data
					</button>
				</div>
			</div>

			<!-- Error State -->
			{#if error}
				<div
					class="mb-6 rounded-lg border border-red-200 bg-red-50 p-4"
					in:fade={{ duration: 300 }}
				>
					<div class="flex items-center gap-2">
						<span class="text-red-500">⚠️</span>
						<span class="text-sm font-medium text-red-800">Analytics Error</span>
					</div>
					<p class="mt-2 text-sm text-red-700">{error}</p>
					<button
						class="mt-3 text-sm text-red-600 transition-colors hover:text-red-800"
						onclick={refreshData}
					>
						🔄 Try Again
					</button>
				</div>
			{/if}

			<!-- Loading State -->
			{#if loading && !analyticsData}
				<div class="py-12 text-center" in:fade={{ duration: 300 }}>
					<div
						class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100"
					>
						<div
							class="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"
						></div>
					</div>
					<h3 class="mb-2 text-lg font-medium text-gray-800">Loading Analytics</h3>
					<p class="text-gray-600">Fetching real-time data...</p>
				</div>
			{/if}

			<!-- Analytics Content -->
			{#if analyticsData}
				<Tabs bind:value={activeTab}>
					<TabList class="mb-6">
						<TabTrigger value="overview">📊 Overview</TabTrigger>
						<TabTrigger value="activities">🎯 Activities</TabTrigger>
						<TabTrigger value="participants">👥 Participants</TabTrigger>
						<TabTrigger value="trends">📈 Trends</TabTrigger>
						{#if showEngagementHeatmap}
							<TabTrigger value="engagement">🔥 Engagement</TabTrigger>
						{/if}
					</TabList>

					<!-- Overview Tab -->
					<TabContent value="overview" class="">
						<div class="space-y-6">
							<!-- Real-time Stats -->
							<RealTimeStats {analyticsData} />

							<!-- Activity Progress Overview -->
							<div class="grid gap-6 md:grid-cols-2">
								<!-- ActivityProgressChart - TODO: Component not implemented yet -->
						<Card class="p-4">
							<p class="text-sm text-gray-500">Activity Progress Chart - Coming Soon</p>
						</Card>
								<!-- TrendLineChart - TODO: Component not implemented yet -->
					<Card class="p-4">
						<p class="text-sm text-gray-500">Trend Line Chart - Coming Soon</p>
					</Card>
					<!--TrendLineChart
									data={analyticsData.activityProgress.map((a) => ({
										label: a.activityName,
										value: a.completionRate
									}))}
									title="Completion Rates"
								/>
							</div>
						</div>
					</TabContent>

					<!-- Activities Tab -->
					<TabContent value="activities" class="">
						<div class="space-y-6">
							{#each activityMetrics as activity}
								<div class="rounded-xl border border-gray-200 bg-white p-6">
									<div class="mb-4 flex items-center justify-between">
										<h3 class="text-lg font-semibold text-gray-900">{activity.activity.name}</h3>
										<div class="flex items-center gap-2">
											<span
												class="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800"
											>
												{activity.participation.completionRate}% Complete
											</span>
											<span
												class="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800"
											>
												{activity.participation.engagementScore} Engagement
											</span>
										</div>
									</div>

									<div class="grid gap-4 md:grid-cols-3">
										<div class="text-center">
											<div class="text-2xl font-bold text-blue-600">
												{activity.participation.totalParticipants}
											</div>
											<div class="text-sm text-gray-600">Total Participants</div>
										</div>
										<div class="text-center">
											<div class="text-2xl font-bold text-green-600">
												{activity.participation.completedParticipants}
											</div>
											<div class="text-sm text-gray-600">Completed</div>
										</div>
										<div class="text-center">
											<div class="text-2xl font-bold text-purple-600">
												{Math.round(activity.performance.averageCompletionTime / 60)}m
											</div>
											<div class="text-sm text-gray-600">Avg Time</div>
										</div>
									</div>

									<!-- Question Difficulty -->
									{#if activity.performance.questionDifficultyBreakdown.length > 0}
										<div class="mt-4">
											<h4 class="mb-2 text-sm font-medium text-gray-700">Question Difficulty</h4>
											<div class="flex flex-wrap gap-2">
												{#each activity.performance.questionDifficultyBreakdown as question}
													<span
														class="rounded-full px-2 py-1 text-xs {question.difficulty === 'easy'
															? 'bg-green-100 text-green-800'
															: question.difficulty === 'medium'
																? 'bg-yellow-100 text-yellow-800'
																: 'bg-red-100 text-red-800'}"
													>
														Q{question.questionId}: {question.difficulty}
													</span>
												{/each}
											</div>
										</div>
									{/if}
								</div>
							{/each}
						</div>
					</TabContent>

					<!-- Participants Tab -->
					<TabContent value="participants" class="">
						<div class="space-y-6">
							{#if showJourneyMap}
								<!-- ParticipantJourneyMap - TODO: Component not implemented yet -->
						<Card class="p-4">
							<p class="text-sm text-gray-500">Participant Journey Map - Coming Soon</p>
						</Card>
							{/if}

							<!-- Participant List -->
							<div class="rounded-xl border border-gray-200 bg-white p-6">
								<h3 class="mb-4 text-lg font-semibold text-gray-900">Participant Overview</h3>
								<div class="space-y-3">
									{#each analyticsData.participantJourneys as journey}
										<div
											class="flex items-center justify-between rounded-lg border border-gray-100 p-3"
										>
											<div>
												<div class="font-medium text-gray-900">{journey.name}</div>
												<div class="text-sm text-gray-600">
													{journey.currentActivity || 'Not started'} • {journey.progress}% complete
												</div>
											</div>
											<div class="text-right">
												<div class="text-sm font-medium text-gray-900">
													{Math.round(journey.timeSpent / 60)}m spent
												</div>
												<div class="text-sm text-gray-600">
													{journey.engagementScore} engagement
												</div>
											</div>
										</div>
									{/each}
								</div>
							</div>
						</div>
					</TabContent>

					<!-- Trends Tab -->
					<TabContent value="trends" class="">
						<div class="space-y-6">
							{#each activityMetrics as activity}
								<div class="rounded-xl border border-gray-200 bg-white p-6">
									<h3 class="mb-4 text-lg font-semibold text-gray-900">
										{activity.activity.name} Trends
									</h3>

									<div class="grid gap-6 md:grid-cols-2">
										<!-- TrendLineChart - TODO: Component not implemented yet -->
					<Card class="p-4">
						<p class="text-sm text-gray-500">Trend Line Chart - Coming Soon</p>
					</Card>
					<!--TrendLineChart
											data={activity.trends.completionTrend.map((t) => ({
												label: new Date(t.timestamp).toLocaleTimeString(),
												value: t.value
											}))}
											title="Completion Trend"
											color="#10b981"
										/>

										<!-- TrendLineChart - TODO: Component not implemented yet -->
					<Card class="p-4">
						<p class="text-sm text-gray-500">Trend Line Chart - Coming Soon</p>
					</Card>
					<!--TrendLineChart
											data={activity.trends.engagementTrend.map((t) => ({
												label: new Date(t.timestamp).toLocaleTimeString(),
												value: t.value
											}))}
											title="Engagement Trend"
											color="#6366f1"
										/>
									</div>
								</div>
							{/each}
						</div>
					</TabContent>

					<!-- Engagement Tab -->
					{#if showEngagementHeatmap}
						<TabContent value="engagement" class="">
							<!-- EngagementHeatmap - TODO: Component not implemented yet -->
			<Card class="p-4">
				<p class="text-sm text-gray-500">Engagement Heatmap - Coming Soon</p>
			</Card>
			<!--EngagementHeatmap
								participants={analyticsData.participantJourneys}
								activities={analyticsData.activityProgress}
							/>
						</TabContent>
					{/if}
				</Tabs>
			{/if}
		</div>
	{/snippet}
</Card>

<!-- No styles needed - fully using Tailwind classes -->
