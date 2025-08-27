<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount, onDestroy } from 'svelte';
	import { get } from 'svelte/store';
	import QRCode from '$lib/components/QRCode.svelte';
	import LoadingScreen from '$lib/components/LoadingScreen.svelte';
	import WordCloud from '$lib/components/charts/WordCloud.svelte';
	import Chart from 'chart.js/auto';
	import { getSessionAnalytics, generateAIInsights, endSession as endSessionRemote, deleteParticipant } from '../dashboard.remote';
	import { createDashboardState } from '../dashboard.svelte.ts';
	import ZyetaAssistant from '$lib/components/ZyetaAssistant.svelte';
	
	// Create a local state instance for this session
	const sessionState = createDashboardState();
	
	let generationChart: Chart;
	let preferenceChart: Chart;
	let comparisonChart: Chart;
	let detailChart: Chart;
	let eventSource: EventSource | null = null;
	let sessionUrl = $state('');
	let networkUrl = $state('');
	let isClient = $state(false);
	let isLoading = $state(true);
	let slug = $state('');
	
	// Use reactive state from sessionState
	let session = $derived(sessionState.currentSession);
	let sessionCode = $derived(session?.code || '');
	let participants = $derived(sessionState.participants);
	let analytics = $derived(sessionState.analytics);
	let connectionStatus = $derived(sessionState.connectionStatus);
	let aiInsights = $state<string[]>([]);
	
	// Load session data initially and set up SSE
	onMount(async () => {
		const pageStore = get(page);
		slug = pageStore.params.slug;
		
		// Validate slug before proceeding
		if (!slug || slug.trim() === '') {
			console.error('Invalid or empty slug, redirecting to dashboard');
			goto('/dashboard');
			return;
		}
		
		await loadSessionData();
		
		// Set up SSE for real-time updates only if we have a valid slug
		if (typeof window !== 'undefined' && typeof EventSource !== 'undefined' && slug) {
			setupSSE();
		}
		
		isLoading = false;
	});
	
	// Clean up on destroy
	onDestroy(() => {
		// Clean up SSE connection
		if (eventSource) {
			eventSource.close();
			eventSource = null;
		}
		
		// Clean up chart instances
		if (generationChart) generationChart.destroy();
		if (preferenceChart) preferenceChart.destroy();
		if (comparisonChart) comparisonChart.destroy();
		if (detailChart) detailChart.destroy();
	});
	
	// Set up SSE connection for real-time updates
	function setupSSE() {
		// Validate slug before attempting to create SSE connection
		if (!slug || slug.trim() === '') {
			console.error('Cannot setup SSE with empty slug');
			return;
		}
		
		const sseUrl = `/dashboard/${slug}/stream`;
		
		try {
			eventSource = new EventSource(sseUrl);
			
			// Handle connection opened
			eventSource.onopen = () => {
				sessionState.setConnectionStatus('connected');
				if (import.meta.env.DEV) {
					console.log('SSE connection established');
				}
			};
			
			// Handle connected event
			eventSource.addEventListener('connected', (event) => {
				sessionState.setConnectionStatus('connected');
				if (import.meta.env.DEV) {
					console.log('SSE connected event:', event.data);
				}
			});
			
			// Handle updates
			eventSource.addEventListener('update', (event) => {
				try {
					const data = JSON.parse(event.data);
					
					if (import.meta.env.DEV) {
						console.log('SSE update received:', data);
					}
					
					// Update participants in the session state
					if (data.participants) {
						sessionState.setParticipants(data.participants.map((p: any) => ({
							id: p.id,
							sessionId: session?.id || '',
							name: p.name,
							generation: p.generation,
							responses: {},
							completed: p.completed,
							completedAt: p.completedAt,
							preferenceScores: p.scores || null,
							createdAt: new Date(),
							updatedAt: new Date()
						})));
					}
				} catch (error) {
					console.error('Error processing SSE update:', error);
				}
			});
			
			// Handle heartbeat
			eventSource.addEventListener('heartbeat', (event) => {
				// Just acknowledge the heartbeat in dev mode
				if (import.meta.env.DEV) {
					console.log('SSE heartbeat:', event.data);
				}
			});
			
			// Handle errors and reconnection
			eventSource.onerror = (error) => {
				console.error('SSE connection error:', error);
				
				// Update connection status
				if (eventSource?.readyState === EventSource.CONNECTING) {
					sessionState.setConnectionStatus('connecting');
				} else if (eventSource?.readyState === EventSource.CLOSED) {
					sessionState.setConnectionStatus('disconnected');
					eventSource = null;
					
					// Reconnect after 5 seconds
					setTimeout(() => {
						if (typeof window !== 'undefined' && !eventSource) {
							sessionState.setConnectionStatus('connecting');
							setupSSE();
						}
					}, 5000);
				}
			};
			
		} catch (error) {
			console.error('Failed to create SSE connection:', error);
		}
	}
	
	// Load session data from remote
	async function loadSessionData() {
		// Validate slug before making API call
		if (!slug || slug.trim() === '') {
			console.error('Cannot load session data with empty slug');
			goto('/dashboard');
			return;
		}
		
		try {
			const data = await getSessionAnalytics(slug);
			
			sessionState.setCurrentSession(data.session);
			sessionState.setParticipants(data.participants);
			
			// Generate AI insights if needed
			const completedCount = data.participants.filter(p => p.completed).length;
			if (completedCount >= 2 && aiInsights.length === 0) {
				const result = await generateAIInsights({ 
					slug,
					focusArea: 'overall'
				});
				if (result.insights) {
					aiInsights = result.insights.keyFindings || [];
				}
			}
		} catch (error) {
			if (import.meta.env.DEV) {
				console.error('Failed to load session:', error);
			}
			// If session not found, redirect
			if (error.status === 404) {
				goto('/dashboard');
			}
		}
	}
	
	// Initialize URLs on client side
	$effect(() => {
		if (typeof window !== 'undefined' && slug) {
			isClient = true;
			
			const protocol = window.location.protocol;
			const hostname = window.location.hostname;
			const port = window.location.port;
			
			// Build the attendee join URL
			if (hostname === 'localhost' || hostname === '127.0.0.1') {
				networkUrl = `${protocol}//${window.location.host}/dashboard/${slug}/join`;
			} else {
				networkUrl = `${protocol}//${hostname}${port ? ':' + port : ''}/dashboard/${slug}/join`;
			}
			
			sessionUrl = networkUrl;
			
			// Initial data load is already done in onMount
			
			// Initialize charts after a short delay to ensure DOM is ready
			setTimeout(() => {
				initCharts();
			}, 100);
			
			return () => {
				if (generationChart) generationChart.destroy();
				if (preferenceChart) preferenceChart.destroy();
				if (comparisonChart) comparisonChart.destroy();
				if (detailChart) detailChart.destroy();
			};
		}
	});
	
	function initCharts() {
		// Destroy existing charts first if they exist
		if (generationChart) {
			generationChart.destroy();
			generationChart = null as any;
		}
		if (preferenceChart) {
			preferenceChart.destroy();
			preferenceChart = null as any;
		}
		if (comparisonChart) {
			comparisonChart.destroy();
			comparisonChart = null as any;
		}
		if (detailChart) {
			detailChart.destroy();
			detailChart = null as any;
		}
		
		// Generation Chart
		const genCanvas = document.getElementById('generationChart') as HTMLCanvasElement;
		if (genCanvas) {
			generationChart = new Chart(genCanvas, {
				type: 'doughnut',
				data: {
					labels: ['Baby Boomer', 'Gen X', 'Millennial', 'Gen Z'],
					datasets: [{
						data: [0, 0, 0, 0],
						backgroundColor: ['#9ca3af', '#6b7280', '#4b5563', '#374151'],
						borderWidth: 2,
						borderColor: '#fff'
					}]
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					plugins: {
						legend: {
							position: 'bottom',
							labels: {
								padding: 15
							}
						},
						tooltip: {
							callbacks: {
								label: function(context) {
									const label = context.label || '';
									const value = context.parsed || 0;
									const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
									const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
									return `${label}: ${value} (${percentage}%)`;
								}
							}
						}
					}
				}
			});
		}
		
		// Preference Chart
		const prefCanvas = document.getElementById('preferenceChart') as HTMLCanvasElement;
		if (prefCanvas) {
			preferenceChart = new Chart(prefCanvas, {
				type: 'radar',
				data: {
					labels: ['Collaboration', 'Formality', 'Technology', 'Wellness'],
					datasets: [{
						label: 'Average Score',
						data: [0, 0, 0, 0],
						backgroundColor: 'rgba(107, 114, 128, 0.2)',
						borderColor: '#6b7280',
						pointBackgroundColor: '#6b7280'
					}]
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					scales: {
						r: {
							beginAtZero: true,
							max: 10,
							ticks: {
								stepSize: 2
							},
							grid: {
								color: 'rgba(0, 0, 0, 0.1)'
							}
						}
					},
					plugins: {
						legend: {
							display: false
						},
						tooltip: {
							callbacks: {
								label: function(context) {
									return `${context.label}: ${context.parsed.r}/10`;
								}
							}
						}
					}
				}
			});
		}
		
		// Generation Comparison Chart
		const compCanvas = document.getElementById('comparisonChart') as HTMLCanvasElement;
		if (compCanvas) {
			comparisonChart = new Chart(compCanvas, {
				type: 'bar',
				data: {
					labels: ['Collaboration', 'Formality', 'Technology', 'Wellness'],
					datasets: [] // Will be populated dynamically
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					scales: {
						y: {
							beginAtZero: true,
							max: 10,
							ticks: {
								stepSize: 2
							}
						}
					},
					plugins: {
						legend: {
							position: 'bottom'
						},
						tooltip: {
							callbacks: {
								label: function(context) {
									return `${context.dataset.label}: ${context.parsed.y}/10`;
								}
							}
						}
					}
				}
			});
		}
		
		// Detailed Preference Chart
		const detCanvas = document.getElementById('detailChart') as HTMLCanvasElement;
		if (detCanvas) {
			detailChart = new Chart(detCanvas, {
				type: 'line',
				data: {
					labels: ['Baby Boomer', 'Gen X', 'Millennial', 'Gen Z'],
					datasets: [
						{
							label: 'Collaboration',
							data: [0, 0, 0, 0],
							borderColor: '#3b82f6',
							backgroundColor: 'rgba(59, 130, 246, 0.1)',
							tension: 0.4
						},
						{
							label: 'Formality',
							data: [0, 0, 0, 0],
							borderColor: '#f59e0b',
							backgroundColor: 'rgba(245, 158, 11, 0.1)',
							tension: 0.4
						},
						{
							label: 'Technology',
							data: [0, 0, 0, 0],
							borderColor: '#10b981',
							backgroundColor: 'rgba(16, 185, 129, 0.1)',
							tension: 0.4
						},
						{
							label: 'Wellness',
							data: [0, 0, 0, 0],
							borderColor: '#ef4444',
							backgroundColor: 'rgba(239, 68, 68, 0.1)',
							tension: 0.4
						}
					]
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					interaction: {
						mode: 'index',
						intersect: false,
					},
					scales: {
						y: {
							beginAtZero: true,
							max: 10,
							ticks: {
								stepSize: 2
							}
						}
					},
					plugins: {
						legend: {
							position: 'bottom'
						},
						tooltip: {
							callbacks: {
								label: function(context) {
									return `${context.dataset.label}: ${context.parsed.y}/10`;
								}
							}
						}
					}
				}
			});
		}
	}
	
	// Update charts when data changes - with proper reactivity tracking
	$effect.pre(() => {
		// Skip if charts not initialized yet
		if (!isClient) return;
		
		// Force reactivity by tracking computedAt timestamp
		const updateTimestamp = analytics.computedAt;
		
		// Track participant list changes - this ensures UI updates
		const participantCount = participants.length;
		const activeCount = participants.filter(p => !p.completed).length;
		const completedCount = analytics.completedCount;
		
		// Initialize charts if needed
		if (!generationChart || !preferenceChart || !comparisonChart || !detailChart) {
			// Wait a tick for DOM to be ready
			setTimeout(() => initCharts(), 100);
			return;
		}
		
		// Update all charts when data changes
		updateAllCharts();
		
		// Log updates in dev mode
		if (import.meta.env.DEV) {
			console.log('Dashboard updated:', {
				timestamp: updateTimestamp,
				total: participantCount,
				active: activeCount,
				completed: completedCount
			});
		}
	});
	
	// Separate function to update all charts
	function updateAllCharts() {
		const genDist = analytics.generationDistribution;
		const scores = analytics.preferenceScores;
		const genPrefs = analytics.generationPreferences;
		
		if (generationChart && genDist) {
			const newData = [
				genDist['Baby Boomer'] || 0,
				genDist['Gen X'] || 0,
				genDist['Millennial'] || 0,
				genDist['Gen Z'] || 0
			];
			generationChart.data.datasets[0].data = newData;
			generationChart.update('none'); // No animation for real-time updates
		}
		
		if (preferenceChart && scores) {
			const newScores = [
				scores.collaboration || 0,
				scores.formality || 0,
				scores.tech || 0,
				scores.wellness || 0
			];
			preferenceChart.data.datasets[0].data = newScores;
			preferenceChart.update('none'); // No animation for real-time updates
		}
		
		// Update comparison chart with generation preferences
		if (comparisonChart && genPrefs) {
			const datasets = [];
			const colors = {
				'Baby Boomer': '#9ca3af',
				'Gen X': '#6b7280',
				'Millennial': '#4b5563',
				'Gen Z': '#374151'
			};
			
			Object.keys(genPrefs).forEach(gen => {
				const prefs = genPrefs[gen];
				if (prefs && prefs.count > 0) {
					datasets.push({
						label: `${gen} (${prefs.count})`,
						data: [
							prefs.collaboration || 0,
							prefs.formality || 0,
							prefs.tech || 0,
							prefs.wellness || 0
						],
						backgroundColor: colors[gen as keyof typeof colors] || '#666'
					});
				}
			});
			
			comparisonChart.data.datasets = datasets;
			comparisonChart.update('none');
		}
		
		// Update detail chart with line data
		if (detailChart && genPrefs) {
			const generations = ['Baby Boomer', 'Gen X', 'Millennial', 'Gen Z'];
			
			// Update collaboration line
			detailChart.data.datasets[0].data = generations.map(gen => 
				genPrefs[gen]?.collaboration || 0
			);
			
			// Update formality line
			detailChart.data.datasets[1].data = generations.map(gen => 
				genPrefs[gen]?.formality || 0
			);
			
			// Update technology line
			detailChart.data.datasets[2].data = generations.map(gen => 
				genPrefs[gen]?.tech || 0
			);
			
			// Update wellness line
			detailChart.data.datasets[3].data = generations.map(gen => 
				genPrefs[gen]?.wellness || 0
			);
			
			detailChart.update('none');
		}
	}
	
	
	// Get conceptual color based on word meaning
	function getConceptualColor(text: string): string {
		const colorMap: Record<string, string> = {
			'Collaborative': '#3b82f6',
			'Digital-First': '#10b981',
			'Wellness-Focused': '#ef4444',
			'Structured': '#f59e0b',
			'Technology': '#10b981',
			'Wellness': '#ef4444',
			'Collaboration': '#3b82f6',
			'Structure': '#f59e0b',
			'Millennial': '#8b5cf6',
			'Gen Z': '#ec4899',
			'Gen X': '#6366f1',
			'Baby Boomer': '#14b8a6'
		};
		
		return colorMap[text] || '#6b7280';
	}
	
	
	async function endSession() {
		// Validate slug before making API call
		if (!slug || slug.trim() === '') {
			console.error('Cannot end session with empty slug');
			return;
		}
		
		try {
			// End session via remote function
			await endSessionRemote({ slug });
			
			// Close SSE connection
			if (eventSource) {
				eventSource.close();
				eventSource = null;
			}
			
			// Navigate back to home
			goto('/');
		} catch (error) {
			if (import.meta.env.DEV) {
				console.error('Failed to end session:', error);
			}
		}
	}
	
	async function deleteParticipantHandler(participantId: string, participantName: string) {
		// Validate slug before making API call
		if (!slug || slug.trim() === '') {
			console.error('Cannot delete participant with empty slug');
			return;
		}
		
		if (!confirm(`Are you sure you want to delete ${participantName}?`)) {
			return;
		}
		
		try {
			// Optimistically remove from UI immediately
			sessionState.removeParticipant(participantId);
			
			// Delete from database
			await deleteParticipant({ slug, participantId });
			
			// Don't reload after successful delete - let SSE handle updates
		} catch (err) {
			if (import.meta.env.DEV) {
				console.error('Failed to delete participant:', err);
			}
			alert('Failed to delete participant');
			// Reload on error to restore state
			await loadSessionData();
		}
	}
	
	function copyParticipantLink(participantId: string) {
		// Validate slug before constructing the link
		if (!slug || slug.trim() === '') {
			console.error('Cannot copy participant link with empty slug');
			return;
		}
		
		const link = `${window.location.origin}/dashboard/${slug}/p/${participantId}/quiz`;
		navigator.clipboard.writeText(link);
	}
</script>

<div class="min-h-screen animated-gradient">
	<div class="container mx-auto px-6 py-12">
		<!-- Header -->
		<div class="bg-white rounded-lg shadow-lg p-8 mb-8">
			<div class="flex justify-between items-start">
				<div>
					<h1 class="text-4xl font-bold text-gray-800 mb-2">Presenter Dashboard</h1>
					<p class="text-gray-600">Session Code: <span class="font-mono text-2xl text-gray-700">{sessionCode}</span></p>
				</div>
				<div class="flex items-center gap-2">
					<span class="relative flex h-3 w-3">
						{#if connectionStatus === 'connected'}
							<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
							<span class="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
						{:else if connectionStatus === 'connecting'}
							<span class="animate-pulse relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
						{:else}
							<span class="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
						{/if}
					</span>
					<span class="text-sm font-medium text-gray-700 capitalize">
						{connectionStatus}
					</span>
				</div>
			</div>
		</div>
		
		{#if isLoading}
			<LoadingScreen 
				variant="inline"
				message="Loading session data..."
			/>
		{:else}
			<!-- QR Code and Stats -->
			<div class="grid md:grid-cols-2 gap-8 mb-8">
				<!-- QR Code -->
				<div class="bg-white rounded-lg shadow-lg p-8">
					<h2 class="text-2xl font-semibold text-gray-800 mb-4">Join Session</h2>
					{#if isClient && sessionUrl}
						<div class="flex justify-center mb-4">
							<QRCode url={sessionUrl} />
						</div>
						<p class="text-center text-sm text-gray-600">
							Scan to join or visit:<br>
							<a href={sessionUrl} target="_blank" class="text-gray-500 hover:text-gray-700 break-all">{sessionUrl}</a>
						</p>
					{:else}
						<div class="animate-pulse bg-gray-200 h-64 rounded"></div>
					{/if}
				</div>
				
				<!-- Live Stats -->
				<div class="bg-white rounded-lg shadow-lg p-8">
					<h2 class="text-2xl font-semibold text-gray-800 mb-6">Live Statistics</h2>
					<div class="space-y-4">
						<div class="flex justify-between items-center p-4 bg-gray-50 rounded">
							<span class="text-gray-700">Active Participants</span>
							<span class="text-3xl font-bold text-gray-600">{analytics.activeCount}</span>
						</div>
						<div class="flex justify-between items-center p-4 bg-gray-50 rounded">
							<span class="text-gray-700">Completed</span>
							<span class="text-3xl font-bold text-green-600">{analytics.completedCount}</span>
						</div>
						<div class="flex justify-between items-center p-4 bg-gray-50 rounded">
							<span class="text-gray-700">Response Rate</span>
							<span class="text-3xl font-bold text-gray-600">{analytics.responseRate}%</span>
						</div>
					</div>
				</div>
			</div>
			
			<!-- Charts -->
			<div class="grid md:grid-cols-2 gap-8 mb-8">
				<!-- Generation Distribution -->
				<div class="bg-white rounded-lg shadow-lg p-8">
					<h2 class="text-2xl font-semibold text-gray-800 mb-4">Generation Distribution</h2>
					<div class="relative" style="height: 300px;">
						<canvas id="generationChart"></canvas>
					</div>
				</div>
				
				<!-- Preference Scores -->
				<div class="bg-white rounded-lg shadow-lg p-8">
					<h2 class="text-2xl font-semibold text-gray-800 mb-4">Average Preferences</h2>
					<div class="relative" style="height: 300px;">
						<canvas id="preferenceChart"></canvas>
					</div>
				</div>
			</div>
			
			<!-- Generation Comparison Charts -->
			<div class="grid md:grid-cols-2 gap-8 mb-8">
				<!-- Comparison by Preference -->
				<div class="bg-white rounded-lg shadow-lg p-8">
					<h2 class="text-2xl font-semibold text-gray-800 mb-4">Generation Comparison</h2>
					<div class="relative" style="height: 300px;">
						<canvas id="comparisonChart"></canvas>
					</div>
				</div>
				
				<!-- Preference Trends -->
				<div class="bg-white rounded-lg shadow-lg p-8">
					<h2 class="text-2xl font-semibold text-gray-800 mb-4">Preference Trends by Generation</h2>
					<div class="relative" style="height: 300px;">
						<canvas id="detailChart"></canvas>
					</div>
				</div>
			</div>
			
			<!-- Workplace DNA and Enhanced Word Cloud -->
			<div class="grid md:grid-cols-2 gap-8 mb-8">
				<!-- Workplace DNA -->
				<div class="bg-gradient-to-br from-white to-gray-50 rounded-lg shadow-lg p-8">
					<h2 class="text-2xl font-semibold text-gray-800 mb-4">Workplace DNA Profile</h2>
					{#if analytics.workplaceDNA}
						<div class="text-center py-8">
							<div class="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
								{analytics.workplaceDNA}
							</div>
							{#snippet scoreCard(score: number, label: string, colorClass: string)}
								<div class="bg-white rounded-lg p-4 shadow">
									<div class="text-3xl font-bold {colorClass}">{score}</div>
									<div class="text-sm text-gray-600">{label}</div>
								</div>
							{/snippet}
							
							<div class="grid grid-cols-2 gap-4 mt-6">
								{@render scoreCard(analytics.preferenceScores.collaboration, "Collaboration", "text-blue-600")}
								{@render scoreCard(analytics.preferenceScores.formality, "Formality", "text-amber-600")}
								{@render scoreCard(analytics.preferenceScores.tech, "Technology", "text-green-600")}
								{@render scoreCard(analytics.preferenceScores.wellness, "Wellness", "text-red-600")}
							</div>
						</div>
					{:else}
						<div class="text-center py-12 text-gray-500">
							Waiting for participants to complete the quiz...
						</div>
					{/if}
				</div>
				
				<!-- Word Cloud Component -->
				<div class="bg-gradient-to-br from-white to-blue-50 rounded-lg shadow-lg p-8">
					<h2 class="text-2xl font-semibold text-gray-800 mb-4">Conceptual Trends Cloud</h2>
					{#if analytics.wordCloudData && analytics.wordCloudData.length > 0}
						<WordCloud words={analytics.wordCloudData} height={400} />
					{:else}
						<div class="h-96 flex items-center justify-center text-gray-400">
							<p>Waiting for data...</p>
						</div>
					{/if}
				</div>
			</div>
			
			<!-- AI Insights -->
			{#if analytics.aiInsights && analytics.aiInsights.length > 0}
				<div class="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg shadow-lg p-8 mb-8">
					<h2 class="text-2xl font-semibold text-gray-800 mb-6">
						🤖 AI Workplace Insights
					</h2>
					<div class="grid md:grid-cols-2 gap-4">
						{#each analytics.aiInsights as insight}
							<div class="bg-white rounded-lg p-4 shadow">
								<p class="text-gray-700">{insight}</p>
							</div>
						{/each}
					</div>
				</div>
			{/if}
			
			
			<!-- Participants List -->
			<div class="bg-white rounded-lg shadow-lg p-8">
				<h2 class="text-2xl font-semibold text-gray-800 mb-4">Participants</h2>
				{#if participants && participants.length > 0}
					<div class="overflow-x-auto">
						<table class="w-full text-left">
							<thead>
								<tr class="border-b">
									<th class="p-2 text-gray-700">Name</th>
									<th class="p-2 text-gray-700">ID</th>
									<th class="p-2 text-gray-700">Generation</th>
									<th class="p-2 text-gray-700">Progress</th>
									<th class="p-2 text-gray-700">Status</th>
									<th class="p-2 text-gray-700">Link</th>
									<th class="p-2 text-gray-700">Actions</th>
								</tr>
							</thead>
							{#snippet participantRow(participant: typeof participants[0])}
								<tr class="border-b hover:bg-gray-50">
									<td class="p-2 font-medium">{participant.name}</td>
									<td class="p-2 text-xs text-gray-500 font-mono">
										{participant.id.substring(0, 8)}...
									</td>
									<td class="p-2">{participant.generation || '-'}</td>
									<td class="p-2">
										<div class="flex items-center gap-2">
											<span>{Object.keys(participant.responses || {}).length} / 7</span>
											<div class="w-20 bg-gray-200 rounded-full h-2">
												<div 
													class="bg-gray-600 h-2 rounded-full"
													style="width: {(Object.keys(participant.responses || {}).length / 7) * 100}%"
												></div>
											</div>
										</div>
									</td>
									<td class="p-2">
										{#if participant.completed}
											<span class="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">Completed</span>
										{:else}
											<span class="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm">In Progress</span>
										{/if}
									</td>
									<td class="p-2">
										<button
											onclick={() => copyParticipantLink(participant.id)}
											class="text-gray-500 hover:text-gray-700"
											title="Copy participant link"
										>
											📋
										</button>
									</td>
									<td class="p-2">
										<button
											onclick={() => deleteParticipantHandler(participant.id, participant.name)}
											class="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition text-sm"
											title="Delete participant"
										>
											Delete
										</button>
									</td>
								</tr>
							{/snippet}
							
							<tbody>
								{#each participants as participant (participant.id)}
									{@render participantRow(participant)}
								{/each}
							</tbody>
						</table>
					</div>
				{:else}
					<p class="text-gray-500">No participants yet. Share the QR code to get started!</p>
				{/if}
			</div>
			
			<!-- Controls -->
			<div class="mt-8 flex justify-center gap-4">
				<button
					onclick={loadSessionData}
					class="px-8 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
				>
					Refresh Data
				</button>
				<button
					onclick={endSession}
					class="px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
				>
					End Session
				</button>
			</div>
		{/if}
	</div>
	
	<!-- Unified AI Chatbot -->
	<ZyetaAssistant analytics={analytics} sessionId={session?.id} />
</div>