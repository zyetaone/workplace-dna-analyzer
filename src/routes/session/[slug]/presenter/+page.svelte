<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { sessionState } from '$lib/stores/sessionState.svelte';
	import QRCode from '$lib/components/QRCode.svelte';
	import WordCloud from '$lib/components/charts/WordCloud.svelte';
	import Chart from 'chart.js/auto';
	import { sse } from '$lib/stores/sse.svelte';
	import { fetchSessionData, generateAIInsights, endSession as endSessionRemote, deleteAttendee } from './presenter.remote';
	import ZyetaAssistant from '$lib/components/ZyetaAssistant.svelte';
	
	let generationChart: Chart;
	let preferenceChart: Chart;
	let comparisonChart: Chart;
	let detailChart: Chart;
	let refreshInterval: ReturnType<typeof setInterval> | undefined;
	let sessionUrl = $state('');
	let networkUrl = $state('');
	let isClient = $state(false);
	let slug = $derived.by(() => {
		const id = $page.params.slug;
		console.log('[Presenter Page] Derived slug from params:', id);
		return id;
	});
	
	// Use unified session state for all session data
	let session = $derived(sessionState.currentSession);
	let sessionCode = $derived(session?.code || '');
	let attendees = $derived(sessionState.currentAttendees);
	let isLoading = $derived(sessionState.isLoading);
	let connectionStatus = $derived(sessionState.isConnected ? 'connected' : 'disconnected');
	
	
	// All analytics from unified session state (fully reactive)
	let aiInsights = $state<string[]>([]);
	let baseAnalytics = $derived(sessionState.getAnalytics(slug));
	let analytics = $derived({
		...baseAnalytics,
		aiInsights: aiInsights
	});
	
	// Refresh using unified session state
	async function refreshSession() {
		console.log('[Presenter Page] refreshSession called with slug:', slug);
		try {
			// Load session data if needed
			await sessionState.loadSession(slug);
			
			// Log the current state after refresh
			console.log('[Presenter Page] After refresh:');
			console.log('  - Current session:', sessionState.currentSession);
			console.log('  - Current attendees:', sessionState.currentAttendees);
			console.log('  - Completed attendees:', sessionState.completedAttendees);
			console.log('  - Analytics activeCount:', sessionState.activeCount);
			console.log('  - Analytics completedCount:', sessionState.completedCount);
			
			// Generate AI insights if needed
			if (sessionState.completedCount >= 2 && aiInsights.length === 0) {
				const result = await generateAIInsights({ 
					slug,
					focusArea: 'overall'
				});
				if (result.insights) {
					aiInsights = result.insights.keyFindings || [];
				}
			}
		} catch (error) {
			console.error('Failed to refresh session:', error);
		}
	}
	
	// SSE connection management
	$effect(() => {
		if (!isClient || !slug || !session) return;
		
		// Connect SSE using the slug for the URL
		const sseUrl = `/session/${slug}/stream`;
		console.log('[Presenter Page] Connecting SSE to:', sseUrl);
		sse.connect(sseUrl);
		
		// Watch for SSE events and update session state
		$effect(() => {
			const lastEvent = sse.lastEvent;
			if (lastEvent) {
				console.log('[Presenter Page] SSE event received:', lastEvent.type, lastEvent.data);
				sessionState.handleSSEEvent(lastEvent);
			}
		});
		
		// Update connection status
		$effect(() => {
			sessionState.updateConnectionFromSSE(sse.isConnected, sse.isConnecting);
		});
		
		return () => {
			console.log('[Presenter Page] Disconnecting SSE');
			sse.disconnect();
		};
	});
	
	// Initialize on client side
	$effect(() => {
		if (typeof window !== 'undefined') {
			isClient = true;
			
			console.log('[Presenter Page] Initializing with slug:', slug);
			
			// Load session first to get the session ID
			if (slug) {
				// Note: loadSession will set the current session ID properly after loading
				// The slug is used to fetch the session, but the ID is stored internally
			} else {
				goto('/');
				return;
			}
			
			const protocol = window.location.protocol;
			const hostname = window.location.hostname;
			const port = window.location.port;
			
			// Build the attendee join URL
			if (hostname === 'localhost' || hostname === '127.0.0.1') {
				networkUrl = `${protocol}//${window.location.host}/session/${slug}/join`;
			} else {
				networkUrl = `${protocol}//${hostname}${port ? ':' + port : ''}/session/${slug}/join`;
			}
			
			sessionUrl = networkUrl;
			
			// Initial data load - force a refresh to test
			console.log('[Presenter Page] Triggering initial refresh...');
			refreshSession().then(() => {
				console.log('[Presenter Page] Initial refresh complete');
			});
			
			// Initialize charts after a short delay to ensure DOM is ready
			setTimeout(() => {
				initCharts();
			}, 100);
			
			// Auto-refresh every 10 seconds as backup
			refreshInterval = setInterval(refreshSession, 10000);
			
			return () => {
				if (generationChart) generationChart.destroy();
				if (preferenceChart) preferenceChart.destroy();
				if (comparisonChart) comparisonChart.destroy();
				if (detailChart) detailChart.destroy();
				if (refreshInterval) clearInterval(refreshInterval);
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
	
	// Update charts when data changes
	$effect(() => {
		// Skip if charts not initialized yet
		if (!isClient) return;
		
		const genDist = analytics.generationDistribution;
		const scores = analytics.preferenceScores;
		const genPrefs = analytics.generationPreferences;
		
		// Initialize charts if needed
		if (!generationChart || !preferenceChart || !comparisonChart || !detailChart) {
			// Wait a tick for DOM to be ready
			setTimeout(() => initCharts(), 100);
			return;
		}
		
		if (generationChart && genDist) {
			const newData = [
				genDist['Baby Boomer'] || 0,
				genDist['Gen X'] || 0,
				genDist['Millennial'] || 0,
				genDist['Gen Z'] || 0
			];
			console.log('Updating generation chart with:', newData, 'from distribution:', genDist);
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
			console.log('Updating preference chart with:', newScores, 'from scores:', scores);
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
							prefs.technology || 0,
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
				genPrefs[gen]?.technology || 0
			);
			
			// Update wellness line
			detailChart.data.datasets[3].data = generations.map(gen => 
				genPrefs[gen]?.wellness || 0
			);
			
			detailChart.update('none');
		}
	});
	
	
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
		try {
			// End session via remote function
			await endSessionRemote({ slug });
			
			// Stop auto-refresh
			if (refreshInterval) {
				clearInterval(refreshInterval);
			}
			
			// Navigate back to home
			goto('/');
		} catch (error) {
			console.error('Failed to end session:', error);
		}
	}
	
	async function deleteParticipant(attendeeId: string, attendeeName: string) {
		if (!confirm(`Are you sure you want to delete ${attendeeName}?`)) {
			return;
		}
		
		try {
			await deleteAttendee({ slug, attendeeId });
			// Refresh the session data to update the UI
			await refreshSession();
		} catch (err) {
			console.error('Failed to delete attendee:', err);
			alert('Failed to delete attendee');
		}
	}
	
	function copyParticipantLink(participantId: string) {
		const link = `${window.location.origin}/session/${slug}/attendee/${participantId}`;
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
			<div class="bg-white rounded-lg shadow-lg p-8">
				<p class="text-gray-600">Loading session data...</p>
			</div>
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
							<div class="grid grid-cols-2 gap-4 mt-6">
								<div class="bg-white rounded-lg p-4 shadow">
									<div class="text-3xl font-bold text-blue-600">{analytics.preferenceScores.collaboration}</div>
									<div class="text-sm text-gray-600">Collaboration</div>
								</div>
								<div class="bg-white rounded-lg p-4 shadow">
									<div class="text-3xl font-bold text-amber-600">{analytics.preferenceScores.formality}</div>
									<div class="text-sm text-gray-600">Formality</div>
								</div>
								<div class="bg-white rounded-lg p-4 shadow">
									<div class="text-3xl font-bold text-green-600">{analytics.preferenceScores.tech}</div>
									<div class="text-sm text-gray-600">Technology</div>
								</div>
								<div class="bg-white rounded-lg p-4 shadow">
									<div class="text-3xl font-bold text-red-600">{analytics.preferenceScores.wellness}</div>
									<div class="text-sm text-gray-600">Wellness</div>
								</div>
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
				{#if attendees && attendees.length > 0}
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
							<tbody>
								{#each attendees as participant}
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
												onclick={() => deleteParticipant(participant.id, participant.name)}
												class="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition text-sm"
												title="Delete participant"
											>
												Delete
											</button>
										</td>
									</tr>
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
					onclick={refreshSession}
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
	<ZyetaAssistant analytics={analytics} sessionId={session.id} />
</div>