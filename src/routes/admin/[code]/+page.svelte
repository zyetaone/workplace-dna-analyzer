<script lang="ts">
	import { invalidate } from '$app/navigation';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import QRCode from '$lib/components/QRCode.svelte';
	import LoadingScreen from '$lib/components/LoadingScreen.svelte';
	import WordCloud from '$lib/components/charts/WordCloud.svelte';
	import Chart from '$lib/components/charts/Chart.svelte';
	import { generateAIInsights, endSession as endSessionRemote, deleteParticipant, updateSession } from '../admin.remote';
	import ParticipantList from '$lib/components/ParticipantList.svelte';
	import { createChartConfig, createGenerationChartConfig, createPreferenceRadarConfig } from '$lib/utils/chart-config';
	import { copyToClipboard } from '$lib/utils/common';
	import { adminState } from './admin.svelte';
	import { sessionStore } from '$lib/stores/session.svelte';
	import type { PageData } from './$types';

	// Props from +page.server.ts
	let { data = $bindable() }: { data: PageData } = $props();
	
	// Local state
	let isClient = $state(false);
	let isLoading = $state(false);
	
	// Get code from page params
	const code = $page.params.code;
	const slug = code; // Keep slug variable for compatibility with existing code
	
	// Initialize admin state with server data
	$effect(() => {
		if (data?.session && data?.participants) {
			adminState.initialize(data.session, data.participants);
			// Also sync with session store for shared state
			sessionStore.setSession(data.session);
			sessionStore.setParticipants(data.participants);
		}
	});
	
	// Reactive values from admin state
	let session = $derived(adminState.session);
	let participants = $derived(adminState.participants);
	let analytics = $derived(adminState.analytics);
	let aiInsights = $derived(adminState.aiInsights);
	let error = $derived(adminState.error);
	let sessionCode = $derived(adminState.sessionCode);
	let sessionUrl = $derived(adminState.sessionUrl);
	
	// Chart configurations derived from analytics
	let preferenceChartConfig = $derived.by(() => createChartConfig(analytics.preferenceScores));
	let generationChartConfig = $derived.by(() => createGenerationChartConfig(analytics.generationDistribution));
	let radarChartConfig = $derived.by(() => createPreferenceRadarConfig(analytics.preferenceScores));
	
	// Client-side initialization effect
	$effect(() => {
		isClient = true; // Set client flag for QR code display
	});
	
	// Manual refresh function
	async function refreshData() {
		isLoading = true;
		adminState.setLoading(true);
		adminState.setError(null);
		try {
			await invalidate(`session:${code}`);
		} catch (err) {
			console.error('Failed to refresh data:', err);
			adminState.setError('Failed to refresh data');
		} finally {
			isLoading = false;
			adminState.setLoading(false);
		}
	}
	
	// Toggle session active status
	async function toggleSessionActive() {
		if (!session) return;
		
		const newStatus = !adminState.isActive;
		isLoading = true;
		adminState.setLoading(true);
		try {
			const result = await updateSession({ slug, isActive: newStatus }) as { success: boolean };
			if (result.success) {
				adminState.updateSession({ isActive: newStatus });
				await refreshData();
			}
		} catch (err) {
			console.error('Failed to update session status:', err);
			adminState.setError('Failed to update session status');
		} finally {
			isLoading = false;
			adminState.setLoading(false);
		}
	}
	
	// Delete a participant
	async function handleDeleteParticipant(id: string, name: string) {
		if (!confirm(`Are you sure you want to remove ${name}?`)) return;
		
		isLoading = true;
		adminState.setLoading(true);
		try {
			await deleteParticipant({ slug, participantId: id });
			adminState.removeParticipant(id);
			sessionStore.removeParticipant(id);
			await refreshData();
		} catch (err) {
			console.error('Failed to delete participant:', err);
			adminState.setError('Failed to delete participant');
		} finally {
			isLoading = false;
			adminState.setLoading(false);
		}
	}
	
	// Copy participant link
	function handleCopyLink(id: string) {
		// Just use the session code for participant link (same as main join link)
		const code = $page.params.code;
		const link = `${window.location.origin}/${code}`;
		copyToClipboard(link);
	}
	
	// Generate AI insights
	async function generateInsights() {
		if (!session || participants.length === 0) return;
		
		isLoading = true;
		adminState.setLoading(true);
		try {
			const result = await generateAIInsights({ slug }) as { success: boolean; insights?: string[] };
			if (result.success && result.insights) {
				adminState.setAIInsights(result.insights);
			}
		} catch (err) {
			console.error('Failed to generate AI insights:', err);
			adminState.setError('Failed to generate AI insights');
		} finally {
			isLoading = false;
			adminState.setLoading(false);
		}
	}
	
	// End the current session
	async function endSession() {
		if (!session) return;
		
		if (!confirm('Are you sure you want to end this session?')) return;
		
		isLoading = true;
		adminState.setLoading(true);
		try {
			const result = await endSessionRemote({ slug }) as { success: boolean };
			if (result.success) {
				// Clear state before navigation
				adminState.reset();
				sessionStore.reset();
				// Navigate back to admin dashboard
				await goto('/admin');
			}
		} catch (err) {
			adminState.setError('Failed to end session');
			console.error('Failed to end session:', err);
		} finally {
			isLoading = false;
			adminState.setLoading(false);
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
					<p class="text-gray-600">Session Code: <span class="font-mono text-2xl text-gray-700">{sessionCode}</span></p>
				</div>
			</div>
		</div>
		
		{#if isLoading && !data}
			<LoadingScreen message="Loading session data..." />
		{:else if error}
			<div class="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg mb-8">
				<p class="font-medium">Error: {error}</p>
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
			{:else if participants.length >= 3}
				<div class="bg-gray-50 rounded-lg shadow-lg p-8 mb-8 text-center">
					<button
						onclick={generateInsights}
						disabled={isLoading}
						class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
					>
						Generate AI Insights
					</button>
				</div>
			{/if}
			
			<!-- Participants List -->
			<div class="bg-white rounded-lg shadow-lg p-8">
				<h2 class="text-2xl font-semibold text-gray-800 mb-6">Participants</h2>
				<ParticipantList
					participants={participants}
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
					onclick={toggleSessionActive}
					disabled={isLoading}
					class="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
				>
					{session?.isActive ? 'Pause Session' : 'Resume Session'}
				</button>
				<button
					onclick={refreshData}
					disabled={isLoading}
					class="px-8 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition disabled:opacity-50"
				>
					Refresh Data
				</button>
				<button
					onclick={endSession}
					disabled={isLoading}
					class="px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
				>
					End Session
				</button>
			</div>
		{/if}
	</div>
</div>