<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import QRCode from '$lib/components/QRCode.svelte';
	import LoadingScreen from '$lib/components/LoadingScreen.svelte';
	import WordCloud from '$lib/components/charts/WordCloud.svelte';
	import Chart from '$lib/components/charts/Chart.svelte';
	import { getSessionAnalytics, generateAIInsights, endSession as endSessionRemote, deleteParticipant, updateSession } from '../dashboard.remote';
	import {
		state as dashboardState,
		getAnalytics,
		initSession,
		hasParticipants,
		isActive,
		setParticipants,
		removeParticipant,
		setConnectionStatus,
		updateCurrentSession,
		setLoading,
		setError
	} from '../dashboard.svelte.ts';
	import ZyetaAssistant from '$lib/components/ZyetaAssistant.svelte';
	import ParticipantList from '$lib/components/ParticipantList.svelte';
	import { createChartConfig, createGenerationChartConfig, createPreferenceRadarConfig } from '$lib/utils/chart-config';
	
import { copyToClipboard } from '$lib/utils/common';

	let isClient = $state(false);
	let aiInsights = $state<string[]>([]);

	// Compute analytics locally from dashboardState
	let analytics = $derived(getAnalytics());

	// Chart configurations are derived from analytics
	let preferenceChartConfig = $derived(createChartConfig(analytics.preferenceScores));
	let generationChartConfig = $derived(createGenerationChartConfig(analytics.generationDistribution));
	let radarChartConfig = $derived(createPreferenceRadarConfig(analytics.preferenceScores));

	// Get slug from page params
	const slug = $page.params.slug;

	// Load initial data on mount
	$effect(() => {
		isClient = true; // Set client flag for QR code display
		setLoading(true);
		
		// Load data asynchronously
		getSessionAnalytics(slug).then(data => {
			initSession(data.session, data.participants);

			// Set up SSE for real-time updates
			if (typeof window !== 'undefined' && typeof EventSource !== 'undefined') {
				setupSSE();
			}
		}).catch(err => {
			setError('Failed to load session data.');
			console.error(err);
		}).finally(() => {
			setLoading(false);
		});
	});

	// Set up SSE connection for real-time updates
	let pollInterval: number | undefined;
	function setupSSE() {
		if (!slug) return;

		// For POC, we'll skip SSE setup since it requires additional backend setup
		// Just poll periodically instead
		pollInterval = setInterval(() => {
			getSessionAnalytics(slug).then(data => {
				setParticipants(data.participants);
			}).catch(console.error);
		}, 5000); // Poll every 5 seconds
	}
	
	// Cleanup polling on unmount
	$effect(() => {
		return () => {
			if (pollInterval) {
				clearInterval(pollInterval);
			}
		};
	});

	// Toggle session active status
	async function toggleSessionActive() {
		if (!dashboardState.currentSession) return;

		const newStatus = !dashboardState.currentSession.isActive;
		try {
			const result = await updateSession({ slug, isActive: newStatus });
			if (result.success) {
				updateCurrentSession({ isActive: newStatus });
			}
		} catch (err) {
			console.error('Failed to update session status:', err);
		}
	}

	// Delete a participant
	async function handleDeleteParticipant(id: string, name: string) {
		if (!confirm(`Are you sure you want to remove ${name}?`)) return;

		try {
			await deleteParticipant({ slug, participantId: id });
			removeParticipant(id);
		} catch (err) {
			console.error('Failed to delete participant:', err);
		}
	}

	// Copy participant link
	function handleCopyLink(id: string) {
		const link = `${window.location.origin}/dashboard/${slug}/p/${id}/quiz`;
		copyToClipboard(link);
	}

	// End the current session
	async function endSession() {
		if (!dashboardState.currentSession) return;
		
		if (!confirm('Are you sure you want to end this session?')) return;
		
		setLoading(true);
		try {
			const result = await endSessionRemote({ slug });
			if (result.success) {
				// Navigate back to dashboard
				await goto('/dashboard');
			}
		} catch (err) {
			setError('Failed to end session.');
			console.error('Failed to end session:', err);
		} finally {
			setLoading(false);
		}
	}
</script>

<div class="min-h-screen animated-gradient">
	<div class="container mx-auto px-6 py-12">
		<!-- Header -->
		<div class="bg-white rounded-lg shadow-lg p-8 mb-8">
			<div class="flex justify-between items-start">
				<div>
					<h1 class="text-4xl font-bold text-gray-800 mb-2">Presenter Dashboard</h1>
					<p class="text-gray-600">Session Code: <span class="font-mono text-2xl text-gray-700">{dashboardState.sessionCode}</span></p>
				</div>
				<div class="flex items-center gap-2">
				<span class="relative flex h-3 w-3">
					{#if dashboardState.connectionStatus === 'connected'}
						<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
						<span class="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
					{:else if dashboardState.connectionStatus === 'connecting'}
						<span class="animate-pulse relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
					{:else}
						<span class="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
					{/if}
				</span>
				<span class="text-sm font-medium text-gray-700 capitalize">
					{dashboardState.connectionStatus}
				</span>
			</div>
			</div>
		</div>
		
		{#if dashboardState.isLoading}
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
					{#if isClient && dashboardState.sessionUrl}
						<div class="flex justify-center mb-4">
							<QRCode url={dashboardState.sessionUrl} />
						</div>
						<p class="text-center text-sm text-gray-600">
							Scan to join or visit:<br>
							<a href={dashboardState.sessionUrl} target="_blank" class="text-gray-500 hover:text-gray-700 break-all">{dashboardState.sessionUrl}</a>
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
			
			<!-- Charts using shared container snippet -->
			<div class="grid md:grid-cols-2 gap-8 mb-8">
				<div class="bg-white rounded-lg shadow-lg p-8">
					<h2 class="text-2xl font-semibold text-gray-800 mb-4">Generation Distribution</h2>
					<Chart config={generationChartConfig} height="300px" />
				</div>
				<div class="bg-white rounded-lg shadow-lg p-8">
					<h2 class="text-2xl font-semibold text-gray-800 mb-4">Average Preferences</h2>
					<Chart config={radarChartConfig} height="300px" />
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
								<div class="bg-white rounded-lg shadow p-4">
									<div class="text-3xl font-bold text-blue-600">{analytics.preferenceScores.collaboration}</div>
									<div class="text-sm text-gray-600">Collaboration</div>
								</div>
								<div class="bg-white rounded-lg shadow p-4">
									<div class="text-3xl font-bold text-amber-600">{analytics.preferenceScores.formality}</div>
									<div class="text-sm text-gray-600">Formality</div>
								</div>
								<div class="bg-white rounded-lg shadow p-4">
									<div class="text-3xl font-bold text-green-600">{analytics.preferenceScores.tech}</div>
									<div class="text-sm text-gray-600">Technology</div>
								</div>
								<div class="bg-white rounded-lg shadow p-4">
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
			{#if aiInsights.length > 0}
				<div class="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg shadow-lg p-8 mb-8">
					<h2 class="text-2xl font-semibold text-gray-800 mb-6">
						🤖 AI Workplace Insights
					</h2>
					<div class="grid md:grid-cols-2 gap-4">
						{#each aiInsights as insight}
							<div class="bg-white rounded-lg p-4 shadow">
								<p class="text-gray-700">{insight}</p>
							</div>
						{/each}
					</div>
				</div>
			{/if}
			
			
			<!-- Participants List -->
			<div class="bg-white rounded-lg shadow-lg p-8">
				<h2 class="text-2xl font-semibold text-gray-800 mb-6">Participants</h2>
				<ParticipantList
					participants={dashboardState.participants}
					onDelete={handleDeleteParticipant}
					onCopyLink={handleCopyLink}
					showActions={true}
					showProgress={true}
					showStatus={true}
					showGeneration={true}
					showScores={true}
					showId={true}
					showLink={true}
					emptyMessage="No participants yet. Share the QR code to get started!"
				/>
			</div>
			
			<!-- Controls -->
			<div class="mt-8 flex justify-center gap-4">
				<button
					onclick={() => getSessionAnalytics(slug).then(data => initSession(data.session, data.participants))}
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
</div>