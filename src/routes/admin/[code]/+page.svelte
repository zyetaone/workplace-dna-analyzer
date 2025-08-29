<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { getSessionStore } from '../admin.svelte';
	import { Card, Button, ConfirmationDialog, QRCode } from '$lib/components';
	import { fade, fly } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import { getSessionData, toggleSessionStatus, deleteParticipant } from '../../data.remote';

	// Import admin-specific components
	import SessionHeader from '../(components)/SessionHeader.svelte';
	import StatsGrid from '../(components)/StatsGrid.svelte';
	import ParticipantManager from '../(components)/ParticipantManager.svelte';
	import AnalysisCharts from '../(components)/AnalysisCharts.svelte';
	import InsightsPanel from '../(components)/InsightsPanel.svelte';
	import WorkplaceDNAChart from '../(components)/WorkplaceDNAChart.svelte';
	import ZyetaIAssistant from '../(components)/ZyetaIAssistant.svelte';

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
	let showParticipantsDialog = $state(false);
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
				store.setError('Failed to remove respondent');
			}
		} catch (error) {
			store.rollbackRemoveParticipant(originalParticipants);
			store.setError(error instanceof Error ? error.message : 'Failed to remove respondent');
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

	<!-- Main Content with Swiss Grid -->
	<div class="swiss-container swiss-container-2xl relative overflow-hidden">
		<div class="swiss-dashboard">
			<header
				class="bg-white/80 backdrop-blur-xl border-b border-gray-200/60 shadow-sm p-4 relative z-10"
			>
				<SessionHeader
					{store}
					onRefresh={refreshSession}
					onEndSession={() => (showEndDialog = true)}
				/>
			</header>

			<main class="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
				{#if store.loading && !store.session}
					<div class="flex items-center justify-center h-full">
						<div
							class="text-center space-y-4 bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-100"
						>
							<div
								class="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600 mx-auto"
							></div>
							<div class="text-lg font-semibold text-gray-700">Loading Session...</div>
						</div>
					</div>
				{:else if store.error}
					<div
						class="bg-red-50 backdrop-blur-sm border-2 border-red-200 rounded-2xl p-8 text-center shadow-lg max-w-md mx-auto"
					>
						<div class="text-red-600 font-semibold mb-3 flex items-center justify-center gap-2">
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
								/>
							</svg>
							Error Loading Session
						</div>
						<p class="text-gray-700 mb-4">{store.error}</p>
						<Button onclick={loadSessionData} variant="secondary" size="sm" class="mt-4"
							>Try Again</Button
						>
					</div>
				{:else if store.session}
					<!-- Tab Navigation -->
					<Tabs bind:value={activeTab}>
						<TabList
							class="bg-white/90 backdrop-blur-xl border border-gray-200 rounded-2xl p-2 mb-8 flex gap-2 shadow-md"
						>
							<TabTrigger
								value="participants"
								class="flex-1 px-4 md:px-6 py-3 rounded-xl font-medium text-sm transition-all duration-300 {activeTab ===
								'participants'
									? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg'
									: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}"
							>
								<span class="hidden md:inline">👥</span> Respondents & Overview
							</TabTrigger>
							<TabTrigger
								value="analytics"
								class="flex-1 px-4 md:px-6 py-3 rounded-xl font-medium text-sm transition-all duration-300 {activeTab ===
								'analytics'
									? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg'
									: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}"
							>
								<span class="hidden md:inline">📈</span> Analytics Overview
							</TabTrigger>
							<TabTrigger
								value="insights"
								class="flex-1 px-4 md:px-6 py-3 rounded-xl font-medium text-sm transition-all duration-300 {activeTab ===
								'insights'
									? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg'
									: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}"
							>
								<span class="hidden md:inline">💡</span> AI Workplace Insights
							</TabTrigger>
							<TabTrigger
								value="zyetai"
								class="flex-1 px-4 md:px-6 py-3 rounded-xl font-medium text-sm transition-all duration-300 {activeTab ===
								'zyetai'
									? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg'
									: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}"
							>
								<span class="hidden md:inline">🤖</span> ZyetaI AI
							</TabTrigger>
						</TabList>

						<!-- Respondents & Overview Tab -->
						<TabContent value="participants" class="space-y-6">
							<div in:fly={{ y: 20, duration: 500, easing: quintOut }}>
								<StatsGrid {store} />
							</div>

							<div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
								<div in:fly={{ y: 20, delay: 100, duration: 500, easing: quintOut }}>
									<div
										class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
									>
										<h3 class="text-lg font-semibold text-gray-800 mb-4">Session QR Code</h3>
										<QRCode url={qrUrl} size={200} {sessionCode} />
									</div>
								</div>
								<div in:fly={{ y: 20, delay: 200, duration: 500, easing: quintOut }}>
									<div
										class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
									>
										<WorkplaceDNAChart scores={avgScores} />
									</div>
								</div>
							</div>

							<div in:fly={{ y: 20, delay: 300, duration: 500, easing: quintOut }}>
								<div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
									<div class="flex items-center justify-between mb-6">
										<h2 class="text-xl font-semibold text-gray-900">Session Respondents</h2>
										<div class="flex items-center gap-2 text-sm">
											<span class="px-3 py-1 bg-green-100 text-green-700 rounded-full font-medium">
												{store.participants?.filter((p) => p.completed).length || 0} Assessments Complete
											</span>
											<span class="px-3 py-1 bg-amber-100 text-amber-700 rounded-full font-medium">
												{store.participants?.filter((p) => !p.completed).length || 0} In Progress
											</span>
										</div>
									</div>

									<div class="text-center py-8">
										<div
											class="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4"
										>
											<span class="text-white text-2xl">👥</span>
										</div>
										<h3 class="text-lg font-medium text-gray-800 mb-2">Participant Management</h3>
										<p class="text-gray-600 mb-6">View and manage all session participants</p>
										<button
											onclick={() => (showParticipantsDialog = true)}
											class="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
										>
											<span class="flex items-center gap-2">
												<span>👥</span>
												<span>Manage Participants</span>
											</span>
										</button>
									</div>

									<ParticipantManager
										{store}
										onDelete={handleDeleteParticipant}
										totalQuestions={10}
									/>
								</div>
							</div>
						</TabContent>

						<!-- Analytics Tab -->
						<TabContent value="analytics" class="space-y-6">
							<div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
								<div in:fly={{ y: 20, duration: 500, easing: quintOut }}>
									<div
										class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
									>
										<WorkplaceDNAChart scores={avgScores} title="Average Workplace DNA" />
									</div>
								</div>
								<div in:fly={{ y: 20, delay: 100, duration: 500, easing: quintOut }}>
									<div
										class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow h-full"
									>
										<h3 class="text-lg font-semibold text-gray-800 mb-4">Response Distribution</h3>
										<AnalysisCharts {store} />
									</div>
								</div>
							</div>

							<div in:fly={{ y: 20, delay: 200, duration: 500, easing: quintOut }}>
								<div
									class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
								>
									<h3 class="text-lg font-semibold text-gray-800 mb-4">Generation Analysis</h3>
									<div class="flex items-center justify-center text-gray-500">
										<p>Generation analysis data will be displayed here</p>
									</div>
								</div>
							</div>
						</TabContent>

						<!-- AI Insights Tab -->
						<TabContent value="insights" class="space-y-6">
							<div in:fly={{ y: 20, duration: 500, easing: quintOut }}>
								<div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
									<InsightsPanel {store} />
								</div>
							</div>

							<!-- Quick Actions Card -->
							<div in:fly={{ y: 20, delay: 100, duration: 500, easing: quintOut }}>
								<div
									class="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-200 p-6"
								>
									<h3 class="text-lg font-semibold text-gray-800 mb-3">Quick Actions</h3>
									<div class="grid grid-cols-1 md:grid-cols-3 gap-3">
										<button
											class="flex items-center gap-3 p-3 bg-white rounded-xl hover:shadow-md transition-all text-left"
										>
											<span class="text-2xl">📊</span>
											<div>
												<p class="font-medium text-gray-800">Export Data</p>
												<p class="text-xs text-gray-600">Download CSV report</p>
											</div>
										</button>
										<button
											class="flex items-center gap-3 p-3 bg-white rounded-xl hover:shadow-md transition-all text-left"
										>
											<span class="text-2xl">📧</span>
											<div>
												<p class="font-medium text-gray-800">Share Results</p>
												<p class="text-xs text-gray-600">Email summary</p>
											</div>
										</button>
										<button
											class="flex items-center gap-3 p-3 bg-white rounded-xl hover:shadow-md transition-all text-left"
										>
											<span class="text-2xl">🎯</span>
											<div>
												<p class="font-medium text-gray-800">AI Analysis</p>
												<p class="text-xs text-gray-600">Deep insights</p>
											</div>
										</button>
									</div>
								</div>
							</div>
						</TabContent>

						<!-- ZyetaI AI Tab -->
						<TabContent value="zyetai" class="space-y-6">
							<div in:fly={{ y: 20, duration: 500, easing: quintOut }}>
								<div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
									<div class="text-center mb-6">
										<div
											class="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4"
										>
											<span class="text-white text-2xl">🤖</span>
										</div>
										<h2 class="text-2xl font-bold text-gray-900 mb-2">ZyetaI AI Assistant</h2>
										<p class="text-gray-600">Your intelligent workplace optimization companion</p>
									</div>

									<ZyetaIAssistant {sessionCode} />
								</div>
							</div>
						</TabContent>
					</Tabs>
				{/if}
			</main>
		</div>
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

<!-- Participants Dialog -->
{#if showParticipantsDialog}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
		<div
			class="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
			in:fly={{ y: 20, duration: 300 }}
		>
			<!-- Header -->
			<div class="flex items-center justify-between p-6 border-b border-gray-200">
				<div>
					<h2 class="text-2xl font-bold text-gray-900">Session Participants</h2>
					<p class="text-gray-600 mt-1">Manage and monitor participant progress</p>
				</div>
				<button
					onclick={() => (showParticipantsDialog = false)}
					class="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
					aria-label="Close participants dialog"
				>
					<svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						></path>
					</svg>
				</button>
			</div>

			<!-- Content -->
			<div class="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
				<div class="flex items-center justify-between mb-6">
					<div class="flex items-center gap-4">
						<span class="px-4 py-2 bg-green-100 text-green-700 rounded-full font-medium text-sm">
							{store.participants?.filter((p) => p.completed).length || 0} Completed
						</span>
						<span class="px-4 py-2 bg-amber-100 text-amber-700 rounded-full font-medium text-sm">
							{store.participants?.filter((p) => !p.completed).length || 0} In Progress
						</span>
					</div>
				</div>

				<ParticipantManager {store} onDelete={handleDeleteParticipant} totalQuestions={10} />
			</div>

			<!-- Footer -->
			<div class="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
				<button
					onclick={() => (showParticipantsDialog = false)}
					class="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
				>
					Close
				</button>
			</div>
		</div>
	</div>
{/if}
