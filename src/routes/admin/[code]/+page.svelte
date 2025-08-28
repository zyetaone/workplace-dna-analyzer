<script lang="ts">
	import { invalidate } from '$app/navigation';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { navigating } from '$app/stores';
	import QRCode from '$lib/components/QRCode.svelte';
	import LoadingScreen from '$lib/components/LoadingScreen.svelte';
	import WordCloud from '$lib/components/charts/WordCloud.svelte';
	import Chart from '$lib/components/charts/Chart.svelte';
	import { generateAIInsights, endSession as endSessionRemote, deleteParticipant, updateSession } from '../admin.remote';
	import ParticipantList from '$lib/components/ParticipantList.svelte';
	import { createChartConfig, createGenerationChartConfig, createPreferenceRadarConfig } from '$lib/utils/chart-config';
	import { copyToClipboard } from '$lib/utils/common';
	import { calculatePreferenceScores, getWorkplaceDNA } from '$lib/utils/scoring';
	import type { Session, Participant, PreferenceScores } from '$lib/types';

	// Props - simplified since using remote functions
	let { data = $bindable() }: { data?: { session?: Session; participants?: Participant[] } } = $props();
	
	// Direct reactive state using Svelte 5 runes
	let session = $state<Session | null>(null);
	let participants = $state<Participant[]>([]);
	let loading = $state(false);
	let error = $state<string | null>(null);
	let aiInsights = $state<string[]>([]);
	let isClient = $state(false);
	let isLoading = $state(false);
	
	// Navigation-aware loading states
	let isNavigatingAway = $derived(!!$navigating && $navigating?.to?.url.pathname === '/admin');
	let showGlobalLoading = $derived(isLoading || loading);
	
	// Get code from page params
	const code = $page.params.code;
	
	// Initialize state with server data
	$effect(() => {
		if (data?.session && data?.participants) {
			session = data.session;
			participants = data.participants;
			error = null;
		}
	});
	
	// Derived values
	let sessionCode = $derived(session?.code || '');
	let sessionUrl = $derived.by(() => {
		if (!session || typeof window === 'undefined') return '';
		return `${window.location.origin}/${session.code}`;
	});
	
	// Analytics calculations
	let analytics = $derived.by(() => {
		const activeCount = participants.length;
		const completedCount = participants.filter(p => p.completed).length;
		const responseRate = activeCount > 0 ? Math.round((completedCount / activeCount) * 100) : 0;
		
		// Calculate average preference scores
		const preferenceScores = calculateAverageScores();
		
		// Generation distribution
		const generationDistribution = calculateGenerationDistribution();
		
		// Word cloud data
		const wordCloudData = generateWordCloudData();
		
		// Workplace DNA
		const workplaceDNA = completedCount > 0 ? getWorkplaceDNA(preferenceScores) : null;
		
		return {
			activeCount,
			completedCount,
			responseRate,
			preferenceScores,
			generationDistribution,
			wordCloudData,
			workplaceDNA
		};
	});
	
	// Analytics calculation functions
	function calculateAverageScores(): PreferenceScores {
		const completed = participants.filter(p => p.completed);
		
		if (completed.length === 0) {
			return { collaboration: 0, formality: 0, tech: 0, wellness: 0 };
		}
		
		const totals = { collaboration: 0, formality: 0, tech: 0, wellness: 0 };
		
		for (const participant of completed) {
			const responses = typeof participant.responses === 'string' 
				? JSON.parse(participant.responses) 
				: participant.responses;
			
			if (Array.isArray(responses) && responses.length > 0) {
				const scores = calculatePreferenceScores(responses);
				totals.collaboration += scores.collaboration;
				totals.formality += scores.formality;
				totals.tech += scores.tech;
				totals.wellness += scores.wellness;
			}
		}
		
		return {
			collaboration: Math.round(totals.collaboration / completed.length),
			formality: Math.round(totals.formality / completed.length),
			tech: Math.round(totals.tech / completed.length),
			wellness: Math.round(totals.wellness / completed.length)
		};
	}
	
	function calculateGenerationDistribution(): Record<string, number> {
		const distribution: Record<string, number> = {};
		
		for (const participant of participants) {
			const gen = participant.generation || 'Unknown';
			distribution[gen] = (distribution[gen] || 0) + 1;
		}
		
		return distribution;
	}
	
	function generateWordCloudData(): Array<{ text: string; size: number }> {
		const wordFreq: Record<string, number> = {};
		const completed = participants.filter(p => p.completed);
		
		const conceptMap: Record<string, string[]> = {
			'collaboration': ['teamwork', 'collaboration', 'together', 'cooperative', 'shared'],
			'independence': ['autonomy', 'independent', 'solo', 'individual', 'freedom'],
			'structure': ['organized', 'structured', 'formal', 'process', 'systematic'],
			'flexibility': ['flexible', 'adaptive', 'agile', 'dynamic', 'casual'],
			'technology': ['digital', 'innovative', 'tech', 'modern', 'automated'],
			'traditional': ['classic', 'conventional', 'proven', 'established', 'standard'],
			'wellness': ['wellbeing', 'balance', 'health', 'mindful', 'sustainable'],
			'performance': ['results', 'achievement', 'productivity', 'excellence', 'growth']
		};
		
		for (const participant of completed) {
			const responses = typeof participant.responses === 'string' 
				? JSON.parse(participant.responses) 
				: participant.responses;
			
			if (Array.isArray(responses)) {
				const scores = calculatePreferenceScores(responses);
				
				if (scores.collaboration >= 7) {
					conceptMap.collaboration.forEach(word => {
						wordFreq[word] = (wordFreq[word] || 0) + 1;
					});
				} else if (scores.collaboration <= 3) {
					conceptMap.independence.forEach(word => {
						wordFreq[word] = (wordFreq[word] || 0) + 1;
					});
				}
				
				if (scores.formality >= 7) {
					conceptMap.structure.forEach(word => {
						wordFreq[word] = (wordFreq[word] || 0) + 1;
					});
				} else if (scores.formality <= 3) {
					conceptMap.flexibility.forEach(word => {
						wordFreq[word] = (wordFreq[word] || 0) + 1;
					});
				}
				
				if (scores.tech >= 7) {
					conceptMap.technology.forEach(word => {
						wordFreq[word] = (wordFreq[word] || 0) + 1;
					});
				} else if (scores.tech <= 3) {
					conceptMap.traditional.forEach(word => {
						wordFreq[word] = (wordFreq[word] || 0) + 1;
					});
				}
				
				if (scores.wellness >= 7) {
					conceptMap.wellness.forEach(word => {
						wordFreq[word] = (wordFreq[word] || 0) + 1;
					});
				} else if (scores.wellness <= 3) {
					conceptMap.performance.forEach(word => {
						wordFreq[word] = (wordFreq[word] || 0) + 1;
					});
				}
			}
		}
		
		const words = Object.entries(wordFreq).map(([text, count]) => ({
			text,
			size: 20 + (count * 15)
		}));
		
		return words.sort((a, b) => b.size - a.size).slice(0, 30);
	}
	
	// Chart configurations derived from analytics
	let generationChartConfig = $derived.by(() => createGenerationChartConfig(analytics.generationDistribution));
	let radarChartConfig = $derived.by(() => createPreferenceRadarConfig(analytics.preferenceScores));
	
	// Client-side initialization effect
	$effect(() => {
		isClient = true; // Set client flag for QR code display
	});
	
	// Manual refresh function
	async function refreshData() {
		isLoading = true;
		loading = true;
		error = null;
		try {
			await invalidate(`session:${code}`);
		} catch (err) {
			console.error('Failed to refresh data:', err);
			error = 'Failed to refresh data';
		} finally {
			isLoading = false;
			loading = false;
		}
	}
	
	// Toggle session active status
	async function toggleSessionActive() {
		if (!session || showGlobalLoading || !!$navigating) return;
		
		const newStatus = !session.isActive;
		isLoading = true;
		loading = true;
		try {
			const result = await updateSession({ code, isActive: newStatus }) as { success: boolean };
			if (result.success) {
				session = { ...session, isActive: newStatus };
				await refreshData();
			}
		} catch (err) {
			console.error('Failed to update session status:', err);
			error = 'Failed to update session status';
		} finally {
			isLoading = false;
			loading = false;
		}
	}
	
	// Delete a participant
	async function handleDeleteParticipant(id: string, name: string) {
		if (!confirm(`Are you sure you want to remove ${name}?`) || showGlobalLoading || !!$navigating) return;
		
		isLoading = true;
		loading = true;
		try {
			await deleteParticipant({ code, participantId: id });
			participants = participants.filter(p => p.id !== id);
			await refreshData();
		} catch (err) {
			console.error('Failed to delete participant:', err);
			error = 'Failed to delete participant';
		} finally {
			isLoading = false;
			loading = false;
		}
	}
	
	// Copy participant link
	function handleCopyLink(id: string) {
		const link = `${window.location.origin}/${code}`;
		copyToClipboard(link);
	}
	
	// Generate AI insights
	async function generateInsights() {
		if (!session || participants.length === 0 || showGlobalLoading || !!$navigating) return;
		
		isLoading = true;
		loading = true;
		try {
			const result = await generateAIInsights({ code }) as { success: boolean; insights?: string[] };
			if (result.success && result.insights) {
				aiInsights = result.insights;
			}
		} catch (err) {
			console.error('Failed to generate AI insights:', err);
			error = 'Failed to generate AI insights';
		} finally {
			isLoading = false;
			loading = false;
		}
	}
	
	// End the current session
	async function endSession() {
		if (!session || showGlobalLoading || !!$navigating) return;
		
		if (!confirm('Are you sure you want to end this session?')) return;
		
		isLoading = true;
		loading = true;
		try {
			const result = await endSessionRemote({ code }) as { success: boolean };
			if (result.success) {
				// Clear state before navigation
				session = null;
				participants = [];
				aiInsights = [];
				error = null;
				// Navigate back to admin dashboard (don't reset loading - let navigation handle it)
				await goto('/admin');
			} else {
				isLoading = false;
				loading = false;
			}
		} catch (err) {
			error = 'Failed to end session';
			console.error('Failed to end session:', err);
			isLoading = false;
			loading = false;
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
						disabled={showGlobalLoading || !!$navigating}
						class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
					>
						{#if showGlobalLoading}
							<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
							<span>Generating...</span>
						{:else}
							<span>Generate AI Insights</span>
						{/if}
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
					disabled={showGlobalLoading || !!$navigating}
					class="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
				>
					{#if showGlobalLoading}
						<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
					{/if}
					<span>{session?.isActive ? 'Pause Session' : 'Resume Session'}</span>
				</button>
				<button
					onclick={refreshData}
					disabled={showGlobalLoading || !!$navigating}
					class="px-8 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
				>
					{#if showGlobalLoading}
						<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
					{/if}
					<span>Refresh Data</span>
				</button>
				<button
					onclick={endSession}
					disabled={showGlobalLoading || !!$navigating}
					class="px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
				>
					{#if showGlobalLoading || isNavigatingAway}
						<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
						<span>{isNavigatingAway ? 'Ending Session...' : 'Processing...'}</span>
					{:else}
						<span>End Session</span>
					{/if}
				</button>
			</div>
		{/if}
	</div>
</div>