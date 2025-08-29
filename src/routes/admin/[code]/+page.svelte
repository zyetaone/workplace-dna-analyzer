<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { getSessionStore } from '../admin.svelte';
	import { Card, Button, ConfirmationDialog } from '$lib/components';
	import { fade, fly } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import QRCode from '../../(components)/QRCode.svelte';
	import { getSessionData, toggleSessionStatus, deleteParticipant } from '../../data.remote';

	// Import admin-specific components
	import SessionHeader from '../(components)/SessionHeader.svelte';
	import StatsGrid from '../(components)/StatsGrid.svelte';
	import ParticipantManager from '../(components)/ParticipantManager.svelte';
	import AnalysisCharts from '../(components)/AnalysisCharts.svelte';
	import InsightsPanel from '../(components)/InsightsPanel.svelte';
	import WorkplaceDNAChart from '../(components)/WorkplaceDNAChart.svelte';
	
	// Import tab components
	import Tabs from '$lib/components/ui/Tabs.svelte';
	import TabList from '$lib/components/ui/TabList.svelte';
	import TabTrigger from '$lib/components/ui/TabTrigger.svelte';
	import TabContent from '$lib/components/ui/TabContent.svelte';

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
	let lastUpdate = $state(new Date());

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
				lastUpdate = new Date();
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
	
	// Tab navigation state
	let activeTab = $state('overview');

	// Calculate average workplace DNA scores from real data
	const avgScores = $derived.by(() => {
		const completedParticipants =
			store.participants?.filter((p) => p.completed && p.preferenceScores) || [];

		if (completedParticipants.length === 0) {
			return { collaboration: 0, formality: 0, tech: 0, wellness: 0 };
		}

		const totals = completedParticipants.reduce(
			(acc, participant) => {
				const scores = participant.preferenceScores as any;
				return {
					collaboration: acc.collaboration + (scores?.collaboration || 0),
					formality: acc.formality + (scores?.formality || 0),
					tech: acc.tech + (scores?.tech || 0),
					wellness: acc.wellness + (scores?.wellness || 0)
				};
			},
			{ collaboration: 0, formality: 0, tech: 0, wellness: 0 }
		);

		return {
			collaboration: Math.round(totals.collaboration / completedParticipants.length),
			formality: Math.round(totals.formality / completedParticipants.length),
			tech: Math.round(totals.tech / completedParticipants.length),
			wellness: Math.round(totals.wellness / completedParticipants.length)
		};
	});
</script>

<div
	class="flex h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-gray-50 text-gray-800 font-sans"
>
	<!-- Subtle animated background -->
	<div class="floating-orbs opacity-30">
		<div class="orb orb-1 bg-gradient-to-br from-purple-200/20 to-pink-200/20"></div>
		<div class="orb orb-2 bg-gradient-to-br from-blue-200/20 to-cyan-200/20"></div>
		<div class="orb orb-3 bg-gradient-to-br from-green-200/20 to-emerald-200/20"></div>
	</div>

	<!-- Main Content -->
	<div class="w-full flex flex-col overflow-hidden relative">
		<header class="bg-white/80 backdrop-blur-xl border-b border-gray-200/60 shadow-sm p-4 relative z-10">
			<SessionHeader
				{store}
				onRefresh={refreshSession}
				onEndSession={() => (showEndDialog = true)}
			/>
		</header>

		<main class="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
			{#if store.loading && !store.session}
				<div class="flex items-center justify-center h-full">
					<div class="text-center space-y-3">
						<div
							class="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto"
						></div>
						<div class="text-lg font-semibold text-slate-500 dark:text-slate-400">
							Loading Session...
						</div>
					</div>
				</div>
			{:else if store.error}
				<div
					class="bg-red-100/80 backdrop-blur-sm border border-red-400/50 rounded-2xl p-6 text-center"
				>
					<div class="text-red-600 dark:text-red-400 mb-2">⚠️ Error Loading Session</div>
					<p class="text-slate-700 dark:text-slate-300">{store.error}</p>
					<Button onclick={loadSessionData} variant="secondary" size="sm" class="mt-4"
						>Try Again</Button
					>
				</div>
			{:else if store.session}
				<!-- Tab Navigation -->
				<Tabs bind:value={activeTab}>
					<TabList class="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl p-1.5 mb-6 flex gap-1">
						<TabTrigger 
							value="overview" 
							class="flex-1 px-6 py-3 rounded-xl font-medium text-sm transition-all duration-300 {activeTab === 'overview' ? 'bg-gradient-to-r from-purple-500/20 to-cyan-500/20 text-white shadow-lg border border-white/10' : 'text-slate-400 hover:text-white hover:bg-white/5'}"
						>
							📊 Overview
						</TabTrigger>
						<TabTrigger 
							value="analytics" 
							class="flex-1 px-6 py-3 rounded-xl font-medium text-sm transition-all duration-300 {activeTab === 'analytics' ? 'bg-gradient-to-r from-purple-500/20 to-cyan-500/20 text-white shadow-lg border border-white/10' : 'text-slate-400 hover:text-white hover:bg-white/5'}"
						>
							📈 Analytics
						</TabTrigger>
						<TabTrigger 
							value="participants" 
							class="flex-1 px-6 py-3 rounded-xl font-medium text-sm transition-all duration-300 {activeTab === 'participants' ? 'bg-gradient-to-r from-purple-500/20 to-cyan-500/20 text-white shadow-lg border border-white/10' : 'text-slate-400 hover:text-white hover:bg-white/5'}"
						>
							👥 Participants
						</TabTrigger>
						<TabTrigger 
							value="insights" 
							class="flex-1 px-6 py-3 rounded-xl font-medium text-sm transition-all duration-300 {activeTab === 'insights' ? 'bg-gradient-to-r from-purple-500/20 to-cyan-500/20 text-white shadow-lg border border-white/10' : 'text-slate-400 hover:text-white hover:bg-white/5'}"
						>
							💡 Insights
						</TabTrigger>
					</TabList>

					<!-- Overview Tab -->
					<TabContent value="overview" class="space-y-6">
						<div in:fly={{ y: 20, duration: 500, easing: quintOut }}>
							<StatsGrid {store} />
						</div>
						
						<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
							<div in:fly={{ y: 20, delay: 100, duration: 500, easing: quintOut }}>
								<div class="bg-gray-50/95 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100/50 p-6">
									<QRCode url={qrUrl} size={200} {sessionCode} />
								</div>
							</div>
							<div in:fly={{ y: 20, delay: 200, duration: 500, easing: quintOut }}>
								<div class="bg-gray-50/95 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100/50 p-6">
									<WorkplaceDNAChart scores={avgScores} />
								</div>
							</div>
						</div>
					</TabContent>

					<!-- Analytics Tab -->
					<TabContent value="analytics" class="space-y-6">
						<div in:fly={{ y: 20, duration: 500, easing: quintOut }}>
							<div class="bg-gray-50/95 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100/50 p-6">
								<WorkplaceDNAChart scores={avgScores} />
							</div>
						</div>
						<div in:fly={{ y: 20, delay: 100, duration: 500, easing: quintOut }}>
							<div class="bg-gray-50/95 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100/50 p-6">
								<AnalysisCharts {store} />
							</div>
						</div>
					</TabContent>

					<!-- Participants Tab -->
					<TabContent value="participants" class="space-y-6">
						<div in:fly={{ y: 20, duration: 500, easing: quintOut }}>
							<div class="bg-gray-50/95 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100/50 p-6">
								<h2 class="text-xl font-semibold text-gray-900 mb-4">Session Participants</h2>
								<ParticipantManager {store} onDelete={handleDeleteParticipant} totalQuestions={10} />
							</div>
						</div>
					</TabContent>

					<!-- Insights Tab -->
					<TabContent value="insights" class="space-y-6">
						<div in:fly={{ y: 20, duration: 500, easing: quintOut }}>
							<div class="bg-gray-50/95 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100/50 p-6">
								<InsightsPanel {store} />
							</div>
						</div>
					</TabContent>
				</Tabs>
			{/if}
		</main>
	</div>
</div>

<!-- Confirmation Dialogs -->
<ConfirmationDialog
	bind:open={showEndDialog}
	title="End Session"
	message="Are you sure you want to end this session? This action cannot be undone."
	confirmText="End Session"
	onConfirm={handleEndSession}
	onCancel={() => (showEndDialog = false)}
/>

<ConfirmationDialog
	bind:open={showDeleteDialog}
	title="Remove Participant"
	message={deleteTarget
		? `Are you sure you want to remove ${deleteTarget.name} from this session?`
		: ''}
	confirmText="Remove"
	onConfirm={confirmDeleteParticipant}
	onCancel={() => (showDeleteDialog = false)}
/>
