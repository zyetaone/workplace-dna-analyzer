<script context="module">
	function getGenerationColor(generation: string): string {
		const colors = {
			'Gen Z': '#ef4444',
			Millennials: '#f97316',
			'Gen X': '#eab308',
			'Baby Boomers': '#22c55e',
			'Silent Generation': '#3b82f6'
		};
		return colors[generation] || '#6b7280';
	}
</script>

<!-- 
  Analytics Dashboard Integration Example
  Demonstrates how to integrate analytics components with real-time data
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import type { AnalyticsData, SessionAnalytics } from '../analytics/types';

	// Mock data for demonstration
	let sessionCode = $state('DEMO123');
	let analyticsData = $state<SessionAnalytics | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let realTimeEnabled = $state(true);

	// Analytics state
	let participantCount = $derived(analyticsData?.participantCount || 0);
	let completionRate = $derived(analyticsData ? Math.round(analyticsData.completionRate * 100) : 0);
	let averageScores = $derived(
		analyticsData?.averageScores || { collaboration: 0, formality: 0, tech: 0, wellness: 0 }
	);
	let generationBreakdown = $derived(analyticsData?.generationBreakdown || {});

	// Chart configurations
	let chartConfigs = $derived.by(() => {
		if (!analyticsData) return {};

		return {
			preferences: {
				type: 'radar',
				data: {
					labels: ['Collaboration', 'Formality', 'Technology', 'Wellness'],
					datasets: [
						{
							label: 'Average Scores',
							data: [
								averageScores.collaboration,
								averageScores.formality,
								averageScores.tech,
								averageScores.wellness
							],
							backgroundColor: 'rgba(59, 130, 246, 0.2)',
							borderColor: 'rgba(59, 130, 246, 1)',
							pointBackgroundColor: 'rgba(59, 130, 246, 1)'
						}
					]
				},
				options: {
					responsive: true,
					scales: {
						r: { beginAtZero: true, max: 10 }
					}
				}
			},

			generations: {
				type: 'doughnut',
				data: {
					labels: Object.keys(generationBreakdown),
					datasets: [
						{
							data: Object.values(generationBreakdown),
							backgroundColor: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6']
						}
					]
				},
				options: {
					responsive: true,
					plugins: {
						legend: { position: 'bottom' }
					}
				}
			}
		};
	});

	// Simulated analytics data
	const mockAnalyticsData: SessionAnalytics = {
		participantCount: 24,
		completionRate: 0.875,
		averageScores: {
			collaboration: 7.2,
			formality: 5.8,
			tech: 8.4,
			wellness: 6.9
		},
		generationBreakdown: {
			'Gen Z': 8,
			Millennials: 10,
			'Gen X': 4,
			'Baby Boomers': 2
		},
		engagementMetrics: {
			averageTimeSpent: 180,
			interactionRate: 0.92,
			dropoffRate: 0.125
		},
		insights: [
			{
				type: 'technology',
				title: 'High Tech Adoption',
				content: 'Your team shows strong preference for technology integration (8.4/10)',
				confidence: 0.89
			},
			{
				type: 'collaboration',
				title: 'Collaborative Culture',
				content: 'Above-average collaboration scores indicate a team-oriented workplace',
				confidence: 0.76
			}
		],
		timestamp: new Date().toISOString()
	};

	// Load analytics data
	async function loadAnalytics() {
		loading = true;
		error = null;

		try {
			// Simulate API call
			await new Promise((resolve) => setTimeout(resolve, 1000));

			// In real implementation, this would call:
			// const result = await getSessionAnalytics({ sessionCode });
			// analyticsData = result.analytics;

			analyticsData = mockAnalyticsData;
		} catch (err) {
			error = 'Failed to load analytics data';
			console.error('Analytics error:', err);
		} finally {
			loading = false;
		}
	}

	// Refresh data periodically if real-time is enabled
	$effect(() => {
		if (!realTimeEnabled) return;

		const interval = setInterval(async () => {
			if (!loading) {
				// Simulate data updates
				if (analyticsData) {
					analyticsData = {
						...analyticsData,
						participantCount: analyticsData.participantCount + Math.floor(Math.random() * 3),
						completionRate: Math.min(1, analyticsData.completionRate + Math.random() * 0.05),
						timestamp: new Date().toISOString()
					};
				}
			}
		}, 5000);

		return () => clearInterval(interval);
	});

	onMount(() => {
		loadAnalytics();
	});

	// Export data functionality
	function exportData(format: 'json' | 'csv') {
		if (!analyticsData) return;

		let data: string;
		let filename: string;
		let mimeType: string;

		if (format === 'csv') {
			data = convertToCSV(analyticsData);
			filename = `analytics-${sessionCode}.csv`;
			mimeType = 'text/csv';
		} else {
			data = JSON.stringify(analyticsData, null, 2);
			filename = `analytics-${sessionCode}.json`;
			mimeType = 'application/json';
		}

		const blob = new Blob([data], { type: mimeType });
		const url = URL.createObjectURL(blob);

		const a = document.createElement('a');
		a.href = url;
		a.download = filename;
		a.click();

		URL.revokeObjectURL(url);
	}

	function convertToCSV(data: SessionAnalytics): string {
		const headers = ['Metric', 'Value'];
		const rows = [
			['Participant Count', data.participantCount.toString()],
			['Completion Rate', (data.completionRate * 100).toFixed(1) + '%'],
			['Collaboration Score', data.averageScores.collaboration.toString()],
			['Formality Score', data.averageScores.formality.toString()],
			['Technology Score', data.averageScores.tech.toString()],
			['Wellness Score', data.averageScores.wellness.toString()],
			...Object.entries(data.generationBreakdown).map(([gen, count]) => [gen, count.toString()])
		];

		return [headers, ...rows].map((row) => row.join(',')).join('\n');
	}
</script>

<div class="analytics-dashboard">
	<header class="dashboard-header">
		<div>
			<h1>Analytics Dashboard</h1>
			<p>Session: <strong>{sessionCode}</strong></p>
		</div>

		<div class="header-controls">
			<label class="realtime-toggle">
				<input type="checkbox" bind:checked={realTimeEnabled} />
				<span>Real-time Updates</span>
			</label>

			<button onclick={loadAnalytics} disabled={loading}>
				{loading ? 'Loading...' : 'Refresh'}
			</button>
		</div>
	</header>

	{#if loading && !analyticsData}
		<div class="loading-state">
			<div class="spinner"></div>
			<p>Loading analytics data...</p>
		</div>
	{:else if error}
		<div class="error-state">
			<p>Error: {error}</p>
			<button onclick={loadAnalytics}>Try Again</button>
		</div>
	{:else if analyticsData}
		<!-- Key Metrics Cards -->
		<div class="metrics-grid">
			<div class="metric-card">
				<div class="metric-icon">👥</div>
				<div class="metric-content">
					<h3>Participants</h3>
					<div class="metric-value">{participantCount}</div>
					<div class="metric-label">Total joined</div>
				</div>
			</div>

			<div class="metric-card">
				<div class="metric-icon">✅</div>
				<div class="metric-content">
					<h3>Completion Rate</h3>
					<div class="metric-value">{completionRate}%</div>
					<div class="metric-label">Successfully completed</div>
				</div>
			</div>

			<div class="metric-card">
				<div class="metric-icon">🤝</div>
				<div class="metric-content">
					<h3>Collaboration</h3>
					<div class="metric-value">{averageScores.collaboration.toFixed(1)}</div>
					<div class="metric-label">Average score</div>
				</div>
			</div>

			<div class="metric-card">
				<div class="metric-icon">💻</div>
				<div class="metric-content">
					<h3>Technology</h3>
					<div class="metric-value">{averageScores.tech.toFixed(1)}</div>
					<div class="metric-label">Average score</div>
				</div>
			</div>
		</div>

		<!-- Charts Section -->
		<div class="charts-section">
			<div class="chart-container">
				<h3>Workplace Preferences</h3>
				<div class="chart-placeholder radar-chart">
					<!-- In real implementation, render Chart.js radar chart here -->
					<div class="chart-mock">
						<div class="chart-title">Preference Scores</div>
						<div class="score-bars">
							{#each Object.entries(averageScores) as [key, value]}
								<div class="score-bar">
									<span class="score-label">{key}</span>
									<div class="score-track">
										<div class="score-fill" style="width: {value * 10}%"></div>
									</div>
									<span class="score-value">{value.toFixed(1)}</span>
								</div>
							{/each}
						</div>
					</div>
				</div>
			</div>

			<div class="chart-container">
				<h3>Generation Breakdown</h3>
				<div class="chart-placeholder donut-chart">
					<!-- In real implementation, render Chart.js doughnut chart here -->
					<div class="chart-mock">
						<div class="generation-list">
							{#each Object.entries(generationBreakdown) as [generation, count]}
								<div class="generation-item">
									<div
										class="generation-color"
										style="background-color: {getGenerationColor(generation)}"
									></div>
									<span class="generation-name">{generation}</span>
									<span class="generation-count">{count}</span>
								</div>
							{/each}
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Insights Section -->
		{#if analyticsData.insights?.length > 0}
			<div class="insights-section">
				<h3>AI Insights</h3>
				<div class="insights-grid">
					{#each analyticsData.insights as insight}
						<div class="insight-card">
							<div class="insight-header">
								<h4>{insight.title}</h4>
								<div class="confidence-badge">
									{Math.round(insight.confidence * 100)}% confidence
								</div>
							</div>
							<p>{insight.content}</p>
							<div class="insight-type">{insight.type}</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Export Controls -->
		<div class="export-section">
			<h3>Export Data</h3>
			<div class="export-buttons">
				<button onclick={() => exportData('json')}> 📄 Export JSON </button>
				<button onclick={() => exportData('csv')}> 📊 Export CSV </button>
			</div>
		</div>

		<!-- Real-time Status -->
		<div class="status-bar">
			<div class="status-item">
				Last updated: {new Date(analyticsData.timestamp).toLocaleTimeString()}
			</div>
			<div class="status-item">
				{#if realTimeEnabled}
					<span class="status-indicator active"></span>
					Live updates enabled
				{:else}
					<span class="status-indicator"></span>
					Manual updates only
				{/if}
			</div>
		</div>
	{:else}
		<div class="empty-state">
			<p>No analytics data available</p>
		</div>
	{/if}
</div>

<style>
	.analytics-dashboard {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
		background: #f9fafb;
		min-height: 100vh;
	}

	.dashboard-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
		padding-bottom: 1rem;
		border-bottom: 2px solid #e5e7eb;
	}

	.dashboard-header h1 {
		margin: 0;
		color: #1f2937;
	}

	.dashboard-header p {
		margin: 0.5rem 0 0 0;
		color: #6b7280;
	}

	.header-controls {
		display: flex;
		gap: 1rem;
		align-items: center;
	}

	.realtime-toggle {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
	}

	.loading-state,
	.error-state,
	.empty-state {
		text-align: center;
		padding: 4rem 2rem;
		color: #6b7280;
	}

	.spinner {
		width: 2rem;
		height: 2rem;
		border: 2px solid #e5e7eb;
		border-top: 2px solid #3b82f6;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin: 0 auto 1rem;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.metrics-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.metric-card {
		background: white;
		padding: 1.5rem;
		border-radius: 0.5rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.metric-icon {
		font-size: 2rem;
		width: 3rem;
		height: 3rem;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #f3f4f6;
		border-radius: 0.5rem;
	}

	.metric-content h3 {
		margin: 0 0 0.25rem 0;
		font-size: 0.875rem;
		color: #6b7280;
		text-transform: uppercase;
		font-weight: 600;
	}

	.metric-value {
		font-size: 2rem;
		font-weight: 700;
		color: #1f2937;
		margin-bottom: 0.25rem;
	}

	.metric-label {
		font-size: 0.75rem;
		color: #9ca3af;
	}

	.charts-section {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
		gap: 2rem;
		margin-bottom: 2rem;
	}

	.chart-container {
		background: white;
		padding: 1.5rem;
		border-radius: 0.5rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.chart-container h3 {
		margin: 0 0 1rem 0;
		color: #1f2937;
	}

	.chart-placeholder {
		height: 300px;
		background: #f9fafb;
		border: 2px dashed #d1d5db;
		border-radius: 0.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.chart-mock {
		text-align: center;
		width: 100%;
	}

	.chart-title {
		font-weight: 600;
		margin-bottom: 1rem;
		color: #6b7280;
	}

	.score-bars {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		max-width: 300px;
		margin: 0 auto;
	}

	.score-bar {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.score-label {
		min-width: 80px;
		text-align: left;
		font-size: 0.75rem;
		color: #6b7280;
		text-transform: capitalize;
	}

	.score-track {
		flex: 1;
		height: 0.5rem;
		background: #e5e7eb;
		border-radius: 0.25rem;
		overflow: hidden;
	}

	.score-fill {
		height: 100%;
		background: #3b82f6;
		border-radius: 0.25rem;
		transition: width 0.5s ease;
	}

	.score-value {
		min-width: 2rem;
		text-align: right;
		font-weight: 600;
		font-size: 0.75rem;
	}

	.generation-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		max-width: 200px;
		margin: 0 auto;
	}

	.generation-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.generation-color {
		width: 1rem;
		height: 1rem;
		border-radius: 50%;
	}

	.generation-name {
		flex: 1;
		font-size: 0.875rem;
	}

	.generation-count {
		font-weight: 600;
		font-size: 0.875rem;
	}

	.insights-section {
		margin-bottom: 2rem;
	}

	.insights-section h3 {
		margin-bottom: 1rem;
		color: #1f2937;
	}

	.insights-grid {
		display: grid;
		gap: 1rem;
	}

	.insight-card {
		background: white;
		padding: 1.5rem;
		border-radius: 0.5rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		border-left: 4px solid #3b82f6;
	}

	.insight-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	.insight-header h4 {
		margin: 0;
		color: #1f2937;
	}

	.confidence-badge {
		background: #dbeafe;
		color: #1e40af;
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		font-size: 0.75rem;
		font-weight: 600;
	}

	.insight-card p {
		margin: 0 0 1rem 0;
		color: #4b5563;
		line-height: 1.5;
	}

	.insight-type {
		text-transform: uppercase;
		font-size: 0.75rem;
		color: #9ca3af;
		font-weight: 600;
	}

	.export-section {
		background: white;
		padding: 1.5rem;
		border-radius: 0.5rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		margin-bottom: 2rem;
	}

	.export-section h3 {
		margin: 0 0 1rem 0;
		color: #1f2937;
	}

	.export-buttons {
		display: flex;
		gap: 1rem;
	}

	.export-buttons button {
		padding: 0.5rem 1rem;
		background: #f3f4f6;
		border: 1px solid #d1d5db;
		border-radius: 0.375rem;
		cursor: pointer;
		transition: all 0.2s;
	}

	.export-buttons button:hover {
		background: #e5e7eb;
	}

	.status-bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		background: white;
		border-radius: 0.5rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		font-size: 0.875rem;
		color: #6b7280;
	}

	.status-indicator {
		display: inline-block;
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 50%;
		background: #9ca3af;
		margin-right: 0.5rem;
	}

	.status-indicator.active {
		background: #10b981;
		animation: pulse 2s infinite;
	}

	@keyframes pulse {
		0% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
		100% {
			opacity: 1;
		}
	}
</style>
