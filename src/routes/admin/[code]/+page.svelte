<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { getSessionStore } from '../admin.svelte';
	import { Card, Button, ConfirmationDialog } from '$lib/components';
	import { fade, fly } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import QRCode from '../../(components)/QRCode.svelte';
	import { getSessionData, toggleSessionStatus, deleteParticipant } from '../data.remote';

	// Import admin-specific components
	import SessionHeader from '../(components)/SessionHeader.svelte';
	import StatsGrid from '../(components)/StatsGrid.svelte';
	import StatsGridPremium from '../(components)/StatsGridPremium.svelte';
	import ParticipantManager from '../(components)/ParticipantManager.svelte';
	import AnalysisCharts from '../(components)/AnalysisCharts.svelte';
	import InsightsPanel from '../(components)/InsightsPanel.svelte';
	import QRCodePremium from '../../(components)/QRCodePremium.svelte';
	import LiveActivityFeed from '../../(components)/LiveActivityFeed.svelte';
	import WorkplaceDNAChart from '../(components)/WorkplaceDNAChart.svelte';

	// Get session code from URL
	const sessionCode = page.params.code;

	// Validate session code format
	$effect(() => {
		if (!sessionCode || !/^[A-Z0-9]+-[0-9]{6}$/.test(sessionCode)) {
			goto('/admin');
			return;
		}
	});

	// Get session store with proper state management
	const store = getSessionStore(sessionCode);

	// Dialog states for destructive actions
	let showEndDialog = $state(false);
	let showDeleteDialog = $state(false);
	let deleteTarget = $state<{ id: string; name: string } | null>(null);

	// Load initial data
	$effect(() => {
		if (sessionCode) {
			loadSessionData();
		}
	});

	async function loadSessionData() {
		try {
			store.setLoading(true);
			const result = await getSessionData({ code: sessionCode });
			if (result.session) {
				store.updateSession(result.session);
				store.updateParticipants(result.participants || []);
			}
		} catch (error) {
			store.setError(error instanceof Error ? error.message : 'Failed to load session');
		} finally {
			store.setLoading(false);
		}
	}

	// Manual refresh function
	async function refreshSession() {
		await loadSessionData();
	}

	// Actions
	async function handleEndSession() {
		if (!store.session) return;

		store.optimisticEndSession();

		try {
			const result = await toggleSessionStatus({ code: store.session.code });

			if (result.success) {
				showEndDialog = false;
				goto('/admin');
			} else {
				store.rollbackEndSession();
				store.setError('Failed to end session');
			}
		} catch (error) {
			store.rollbackEndSession();
			store.setError(error instanceof Error ? error.message : 'Failed to end session');
		}
	}

	function handleDeleteParticipant(id: string, name: string) {
		deleteTarget = { id, name };
		showDeleteDialog = true;
	}

	async function confirmDeleteParticipant() {
		if (!deleteTarget || !store.session) return;

		const originalParticipants = [...store.participants];
		store.optimisticRemoveParticipant(deleteTarget.id);

		try {
			const result = await deleteParticipant({
				sessionCode: store.session.code,
				participantId: deleteTarget.id
			});

			if (!result.success) {
				store.rollbackRemoveParticipant(originalParticipants);
				store.setError('Failed to remove participant');
			}
		} catch (error) {
			store.rollbackRemoveParticipant(originalParticipants);
			store.setError(error instanceof Error ? error.message : 'Failed to remove participant');
		} finally {
			showDeleteDialog = false;
			deleteTarget = null;
		}
	}

	// QR Code URL
	const qrUrl = $derived(`${page.url.origin}/${sessionCode}`);

	let showParticipants = $state(false);
	
	// Mock activity feed for demo
	const mockActivities = $derived([
		{ id: '1', participant: 'Sarah Chen', action: 'joined' as const, timestamp: new Date(Date.now() - 5000) },
		{ id: '2', participant: 'John Doe', action: 'answered' as const, question: 3, timestamp: new Date(Date.now() - 30000) },
		{ id: '3', participant: 'Emily Wilson', action: 'completed' as const, timestamp: new Date(Date.now() - 60000) },
		{ id: '4', participant: 'Mike Johnson', action: 'answered' as const, question: 5, timestamp: new Date(Date.now() - 120000) },
		{ id: '5', participant: 'Lisa Park', action: 'skipped' as const, question: 2, timestamp: new Date(Date.now() - 180000) }
	]);
	
	// Calculate average workplace DNA scores
	const avgScores = $derived({
		collaboration: 72,
		formality: 58,
		tech: 85,
		wellness: 64
	});

</script>

<div class="flex h-screen bg-gradient-to-br from-slate-900 via-purple-900/10 to-slate-900 text-slate-200 font-sans">
	<!-- Animated background -->
	<div class="floating-orbs">
		<div class="orb orb-1"></div>
		<div class="orb orb-2"></div>
		<div class="orb orb-3"></div>
	</div>
	<!-- Sidebar -->
	<aside class="w-64 bg-slate-900/50 backdrop-blur-xl border-r border-slate-700/30 flex flex-col justify-between p-4 transition-all duration-300">
		<div>
			<div class="flex items-center gap-3 mb-8">
				<div class="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg shadow-lg shadow-purple-500/30"></div>
				<div>
					<h1 class="font-bold text-lg gradient-text">Presenter</h1>
					<p class="text-xs text-slate-400">Dashboard</p>
				</div>
			</div>

			<nav class="space-y-2">
				<a href="#" class="flex items-center gap-3 px-3 py-2 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 font-semibold text-purple-300">
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
					<span>Overview</span>
				</a>
				<a href="#" class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800/50 transition-colors text-slate-400 hover:text-slate-200">
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
					<span>Analytics</span>
				</a>
				<a href="#" class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800/50 transition-colors text-slate-400 hover:text-slate-200">
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
					<span>Insights</span>
				</a>
			</nav>
		</div>

		<div class="space-y-2">
			<Button onclick={() => showParticipants = !showParticipants} variant="secondary" class="w-full">
				<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
				Participants ({store.participants?.length || 0})
			</Button>
			<Button onclick={() => goto('/admin')} variant="secondary" class="w-full">Back to Sessions</Button>
		</div>
	</aside>

	<!-- Main Content -->
	<div class="flex-1 flex flex-col overflow-hidden relative">
		<header class="bg-slate-900/50 backdrop-blur-xl border-b border-slate-700/30 p-4 relative z-10">
			<SessionHeader store={store} onRefresh={refreshSession} onEndSession={() => showEndDialog = true} />
		</header>

		<main class="flex-1 overflow-y-auto p-8 space-y-8">
			{#if store.isLoading && !store.session}
				<div class="flex items-center justify-center h-full">
					<div class="text-center space-y-3">
						<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto"></div>
						<div class="text-lg font-semibold text-slate-500 dark:text-slate-400">Loading Session...</div>
					</div>
				</div>
			{:else if store.error}
				<div class="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-700/50 rounded-lg p-6 text-center">
					<div class="text-red-600 dark:text-red-400 mb-2">⚠️ Error Loading Session</div>
					<p class="text-slate-700 dark:text-slate-300">{store.error}</p>
					<Button onclick={loadSessionData} variant="secondary" size="sm" class="mt-4">Try Again</Button>
				</div>
			{:else if store.session}
				<!-- Stats Grid -->
				<div class="mb-8">
					<StatsGridPremium store={store} />
				</div>
				
				<div class="grid grid-cols-1 xl:grid-cols-3 gap-8">
					<!-- Left Column -->
					<div class="xl:col-span-1 space-y-6">
						<!-- QR Code -->
						<div in:fly={{ y: 20, duration: 500, easing: quintOut }}>
							<QRCodePremium 
								url={qrUrl}
								code={sessionCode}
								size={200}
							/>
						</div>
						
						<!-- Live Activity Feed -->
						<div in:fly={{ y: 20, delay: 200, duration: 500, easing: quintOut }}>
							<div class="glass-card rounded-2xl p-6">
								<LiveActivityFeed activities={mockActivities} />
							</div>
						</div>
					</div>
					
					<!-- Center Column -->
					<div class="xl:col-span-1 space-y-6">
						<!-- Workplace DNA Chart -->
						<div in:fly={{ y: 20, delay: 100, duration: 500, easing: quintOut }}>
							<WorkplaceDNAChart scores={avgScores} />
						</div>
					</div>
					
					<!-- Right Column -->
					<div class="xl:col-span-1 space-y-6">
						<div in:fly={{ y: 20, delay: 300, duration: 500, easing: quintOut }}>
							<AnalysisCharts store={store} />
						</div>
						<div in:fly={{ y: 20, delay: 400, duration: 500, easing: quintOut }}>
							<InsightsPanel store={store} />
						</div>
					</div>
				</div>
			{/if}
		</main>
	</div>

	<!-- Participant Drawer -->
	{#if showParticipants}
		<div transition:fade class="fixed inset-0 bg-black/30 z-40"></div>
		<div class="fixed bottom-0 left-0 right-0 z-50 transition-transform duration-500 ease-in-out" 
			 style:transform={showParticipants ? 'translateY(0)' : 'translateY(100%)'}>
			<div class="bg-slate-900/95 backdrop-blur-xl rounded-t-2xl shadow-2xl border-t border-slate-700/50 max-h-[70vh] flex flex-col">
				<div class="p-4 border-b border-slate-700/50 flex justify-between items-center">
					<h2 class="text-lg font-semibold">Participants ({store.participants?.length || 0})</h2>
					<Button onclick={() => showParticipants = false} variant="ghost" size="icon">
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
					</Button>
				</div>
				<div class="overflow-y-auto p-4">
					<ParticipantManager store={store} onDelete={handleDeleteParticipant} />
				</div>
			</div>
		</div>
	{/if}
</div>

<!-- Confirmation Dialogs -->
<ConfirmationDialog
	bind:open={showEndDialog}
	title="End Session"
	message="Are you sure you want to end this session? This action cannot be undone."
	confirmText="End Session"
	onConfirm={handleEndSession}
	onCancel={() => showEndDialog = false}
/>

<ConfirmationDialog
	bind:open={showDeleteDialog}
	title="Remove Participant"
	message={deleteTarget ? `Are you sure you want to remove ${deleteTarget.name} from this session?` : ''}
	confirmText="Remove"
	onConfirm={confirmDeleteParticipant}
	onCancel={() => showDeleteDialog = false}
/>

<style>
	.glass-card {
		background: rgba(255, 255, 255, 0.05);
		backdrop-filter: blur(20px);
		border: 1px solid rgba(255, 255, 255, 0.1);
		box-shadow: 
			0 20px 60px rgba(0, 0, 0, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.1);
	}
</style>
