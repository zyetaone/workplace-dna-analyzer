<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { appState } from '$lib/state/app.svelte';
	import { Card, Button, ConfirmationDialog } from '$lib/components';
	import { fade, fly } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import QRCode from '$lib/components/ui/QRCode.svelte';
	import { toggleSessionStatus } from '../../../app.remote';
	import { getSessionData } from '../admin.remote';
	import { removeParticipant as deleteParticipant } from '../../../(participant)/participants.remote';

	// Import admin-specific components
	import SessionHeader from '../(components)/SessionHeader.svelte';
	import StatsGrid from '../(components)/StatsGrid.svelte';
	import ParticipantManager from '../(components)/ParticipantManager.svelte';
	import AnalysisCharts from '$lib/components/modules/analytics/components/AnalysisCharts.svelte';
	import InsightsPanel from '../(components)/InsightsPanel.svelte';
	import WorkplaceDNAChart from '$lib/components/modules/analytics/components/WorkplaceDNAChart.svelte';

	// Import new analytics module
	import { AnalyticsDashboard } from '$lib/components/modules/analytics';
	import ActivityManager from '../(components)/ActivityManager.svelte';

	// Activity manager removed from this view

	// Import Bits UI Tabs component
	import { Tabs } from '$lib/components/ui/tabs';

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
	const store = appState.getSessionStore(sessionCode);

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
			const result: any = await getSessionData({ sessionCode });
			if (result.session) {
				// Loosen typing at boundary; store accepts normalized shapes
				store.updateSession(result.session as any);
				store.updateParticipants((result.participants || []) as any);
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
			const resultDel: any = await deleteParticipant({
				participantId: deleteTarget.id
			});

			if (!resultDel.success) {
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

	// Tab configuration for Bits UI
	const tabs = [
		{
			value: 'overview',
			label: '📊 Overview',
			content: () => html`
				<div class="space-y-6">
					<div>
						<StatsGrid {store} />
					</div>
					<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
						<div
							class="rounded-2xl border border-gray-100/50 bg-gray-50/95 p-6 shadow-xl backdrop-blur-sm"
						>
							<QRCode url="{qrUrl}" size="{200}" {sessionCode} method="api" showCopy="{true}" />
						</div>
						<div
							class="rounded-2xl border border-gray-100/50 bg-gray-50/95 p-6 shadow-xl backdrop-blur-sm"
						>
							<WorkplaceDNAChart scores="{avgScores}" />
						</div>
					</div>
				</div>
			`
		},
		{
			value: 'analytics',
			label: '📈 Analytics',
			content: () => html`
				<div class="space-y-6">
					<div
						class="rounded-2xl border border-gray-100/50 bg-gray-50/95 p-6 shadow-xl backdrop-blur-sm"
					>
						<WorkplaceDNAChart scores="{avgScores}" />
					</div>
					<div
						class="rounded-2xl border border-gray-100/50 bg-gray-50/95 p-6 shadow-xl backdrop-blur-sm"
					>
						<AnalysisCharts {store} />
					</div>
				</div>
			`
		},
		{
			value: 'advanced-analytics',
			label: '🚀 Advanced',
			content: () => html`
				<div>
					<AnalyticsDashboard sessionId="{store.session?.id}" title="Analytics Dashboard" />
				</div>
			`
		},
		{
			value: 'participants',
			label: '👥 Participants',
			content: () => html`
				<div
					class="rounded-2xl border border-gray-100/50 bg-gray-50/95 p-6 shadow-xl backdrop-blur-sm"
				>
					<h2 class="mb-4 text-xl font-semibold text-gray-900">Session Participants</h2>
					<ParticipantManager {store} onDelete="{handleDeleteParticipant}" totalQuestions="{10}" />
				</div>
			`
		},
		{
			value: 'activities',
			label: '🎯 Activities',
			content: () => html`
				<div>
					<ActivityManager />
				</div>
			`
		},
		{
			value: 'insights',
			label: '💡 Insights',
			content: () => html`
				<div
					class="rounded-2xl border border-gray-100/50 bg-gray-50/95 p-6 shadow-xl backdrop-blur-sm"
				>
					<InsightsPanel {store} />
				</div>
			`
		}
	];

	// Helper function for HTML content
	function html(strings: TemplateStringsArray, ...values: any[]) {
		return () => ({ __html: String.raw(strings, ...values) });
	}

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
	class="flex h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-gray-50 font-sans text-gray-800"
>
	<!-- Subtle animated background -->
	<div class="floating-orbs opacity-30">
		<div class="orb orb-1 bg-gradient-to-br from-purple-200/20 to-pink-200/20"></div>
		<div class="orb orb-2 bg-gradient-to-br from-blue-200/20 to-cyan-200/20"></div>
		<div class="orb orb-3 bg-gradient-to-br from-green-200/20 to-emerald-200/20"></div>
	</div>

	<!-- Main Content -->
	<div class="relative flex w-full flex-col overflow-hidden">
		<header
			class="relative z-10 border-b border-gray-200/60 bg-white/80 p-4 shadow-sm backdrop-blur-xl"
		>
			<SessionHeader
				{store}
				onRefresh={refreshSession}
				onEndSession={() => (showEndDialog = true)}
			/>
		</header>

		<main class="mx-auto w-full max-w-[1600px] flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
			{#if store.loading && !store.session}
				<div class="flex h-full items-center justify-center">
					<div class="space-y-3 text-center">
						<div
							class="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-cyan-500"
						></div>
						<div class="text-lg font-semibold text-slate-500 dark:text-slate-400">
							Loading Session...
						</div>
					</div>
				</div>
			{:else if store.error}
				<div
					class="rounded-2xl border border-red-400/50 bg-red-100/80 p-6 text-center backdrop-blur-sm"
				>
					<div class="mb-2 text-red-600 dark:text-red-400">⚠️ Error Loading Session</div>
					<p class="text-slate-700 dark:text-slate-300">{store.error}</p>
					<Button onclick={loadSessionData} variant="secondary" size="sm" class="mt-4"
						>Try Again</Button
					>
				</div>
			{:else if store.session}
				<!-- Bits UI Tabs Integration -->
				<Tabs {tabs} bind:value={activeTab} />
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

<style></style>
