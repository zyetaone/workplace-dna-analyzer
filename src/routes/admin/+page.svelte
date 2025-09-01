<script lang="ts">
	import { goto } from '$app/navigation';
	import { formatDate, copyToClipboard } from '$lib/utils/common';
	import { page } from '$app/state';
	import {
		createSession as createSessionCmd,
		deleteSession as deleteSessionCmd
	} from '../../app.remote';
	import Toast, { showToast } from './(components)/Toast.svelte';
	import {
		Card,
		ConfirmationDialog,
		Button,
		TextInput,
		Tabs,
		TabList,
		TabTrigger,
		TabContent,
		Feedback
	} from '$lib/components/ui';
	import TemplateSelector from './(components)/TemplateSelector.svelte';
	import TemplateManager from './(components)/TemplateManager.svelte';
	import ActivitySelector from './(components)/ActivitySelector.svelte';
	import EnhancedAnalyticsDashboard from '$lib/components/modules/analytics/components/EnhancedAnalyticsDashboard.svelte';

	// Get server-loaded data
	let { data } = $props();
	let sessions = $derived(data?.sessions || []);
	let stats = $derived(
		data?.stats || { total: 0, active: 0, totalParticipants: 0, completedSurveys: 0 }
	);

	// Simplified UI state
	let sessionName = $state('');
	let selectedTemplate = $state('basic');
	let selectedActivities = $state(['workplace-preference']);
	let showCreateForm = $state(false);
	let isCreating = $state(false);
	let deleteDialog = $state({ open: false, sessionCode: '' });
	let createdSessionCode = $state<string | null>(null);
	let showTemplateSelector = $state(false);
	let activeTab = $state('sessions');

	// Create session handler
	async function handleCreateSession() {
		if (!sessionName.trim()) return;

		isCreating = true;
		try {
			const result: any = await createSessionCmd({
				name: sessionName,
				template: selectedTemplate,
				activities: selectedActivities
			});

			if (result.success && 'redirect' in result) {
				showToast({
					title: 'Success',
					description: `Session created with ${selectedActivities.length} activities`,
					variant: 'success'
				});

				// Extract session code from redirect URL
				const url = new URL(result.redirect as string, window.location.origin);
				const sessionCode = url.pathname.split('/').pop();

				// Reset form
				sessionName = '';
				selectedTemplate = 'basic';
				selectedActivities = ['workplace-preference'];
				showCreateForm = false;
				createdSessionCode = sessionCode || null;

				// Navigate to the session admin page (page will reload with new data)
				goto(`/admin/${createdSessionCode}`);
			} else {
				showToast({ title: 'Error', description: 'Failed to create session', variant: 'error' });
			}
		} catch (error) {
			console.error('Session creation failed:', error);
			showToast({ title: 'Error', description: 'Failed to create session', variant: 'error' });
		} finally {
			isCreating = false;
		}
	}

	// Delete session handler
	async function deleteSession() {
		const sessionCode = deleteDialog.sessionCode;
		if (!sessionCode) return;

		try {
			const result: any = await deleteSessionCmd({ code: sessionCode });

			showToast({
				title: result.success ? 'Success' : 'Error',
				description: result.success
					? 'Session deleted successfully'
					: 'error' in result
						? String(result.error)
						: 'Failed to delete session',
				variant: result.success ? 'success' : 'error'
			});

			if (result.success) {
				deleteDialog = { open: false, sessionCode: '' };
				// Page will reload automatically with updated data
			}
		} catch (error) {
			console.error('Session deletion failed:', error);
			showToast({ title: 'Error', description: 'Failed to delete session', variant: 'error' });
		}
	}

	// Copy link handler
	function copyLink(session: any) {
		copyToClipboard(`${window.location.origin}/${session.code}`);
		showToast({
			title: 'Link copied!',
			description: 'Participant join link copied to clipboard.',
			variant: 'success'
		});
	}

	// Activity selection handlers
	function handleTemplateChange(template: string) {
		selectedTemplate = template;
	}

	function handleActivitiesChange(activities: string[]) {
		selectedActivities = activities;
	}

	// Navigation helper
	const openSession = (code: string) => goto(`/admin/${code}`);
	const confirmDelete = (code: string) => {
		deleteDialog = { open: true, sessionCode: code };
	};
</script>

<!-- Session Card Snippet -->
{#snippet sessionCard(session)}
	<div class="h-fit">
		<Card
			variant="analytics"
			class="flex min-h-[320px] transform flex-col overflow-hidden p-6 shadow-2xl ring-2 ring-slate-600/60 transition-all duration-300 hover:scale-[1.02] hover:shadow-cyan-500/20 hover:ring-cyan-500/50"
		>
			{#snippet children()}
				<div class="flex flex-1 flex-col">
					<!-- Header with status -->
					<div class="mb-4 flex items-start justify-between">
						<h3 class="flex-1 pr-3 text-2xl font-bold leading-tight text-white drop-shadow-lg">
							{session.name}
						</h3>
						<div class="flex flex-shrink-0 items-center gap-2">
							<span class="relative flex h-3 w-3">
								{#if session.isActive}
									<span
										class="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"
									></span>
									<span class="relative inline-flex h-3 w-3 rounded-full bg-green-500"></span>
								{:else}
									<span class="relative inline-flex h-3 w-3 rounded-full bg-slate-500"></span>
								{/if}
							</span>
							<span
								class="text-xs font-medium {session.isActive ? 'text-green-400' : 'text-slate-400'}"
							>
								{session.isActive ? 'Active' : 'Inactive'}
							</span>
						</div>
					</div>

					<!-- Session Code -->
					<div class="mb-4">
						<div class="mb-1 text-sm font-medium text-slate-400">Session Code</div>
						<div
							class="rounded-lg border-2 border-cyan-500/30 bg-slate-950/90 px-4 py-3 font-mono text-2xl font-bold tracking-wider text-cyan-400 shadow-inner backdrop-blur-xl"
						>
							{session.code}
						</div>
					</div>

					<!-- Stats Grid -->
					<div class="mb-4 grid grid-cols-3 gap-4">
						<div
							class="rounded-lg border-2 border-slate-700/50 bg-slate-900/60 p-4 text-center shadow-lg backdrop-blur-xl"
						>
							<div class="text-3xl font-bold text-white">{session.activeCount || 0}</div>
							<div class="text-xs text-slate-400">Active</div>
						</div>
						<div
							class="rounded-lg border-2 border-green-600/50 bg-gradient-to-br from-green-900/40 to-emerald-900/40 p-4 text-center shadow-lg backdrop-blur-xl"
						>
							<div class="text-3xl font-bold text-green-400">{session.completedCount || 0}</div>
							<div class="text-xs text-slate-400">Completed</div>
						</div>
						<div
							class="rounded-lg border-2 border-cyan-600/50 bg-gradient-to-br from-cyan-900/40 to-blue-900/40 p-4 text-center shadow-lg backdrop-blur-xl"
						>
							<div class="text-3xl font-bold text-cyan-400">{session.activityCount || 0}</div>
							<div class="text-xs text-slate-400">Activities</div>
						</div>
					</div>

					<!-- Creation Date -->
					<div class="mt-auto text-sm text-slate-400">
						Created: {formatDate(session.createdAt)}
					</div>
				</div>
			{/snippet}

			{#snippet footer()}
				<div class="grid grid-cols-3 gap-2">
					<Button
						onclick={() => openSession(session.code)}
						variant="secondary"
						size="sm"
						class="border border-slate-600/50 bg-slate-800/80 text-xs text-white hover:bg-slate-700/80"
						>Open</Button
					>
					<Button onclick={() => copyLink(session)} variant="secondary" size="sm" class="text-xs"
						>Copy Link</Button
					>
					<Button
						onclick={() => confirmDelete(session.code)}
						variant="destructive"
						size="sm"
						class="text-xs"
					>
						Delete
					</Button>
				</div>
			{/snippet}
		</Card>
	</div>
{/snippet}

<!-- Main Layout -->
<svelte:boundary onerror={(error, reset) => console.error('Admin Dashboard Error:', error)}>
	<div class="">
		<div class="container mx-auto px-6 py-12">
			<!-- Header -->
			<div class="mb-8">
				<h1 class="mb-2 text-3xl font-bold text-slate-200">Admin Dashboard</h1>
				<p class="text-slate-400">Manage sessions and activity templates</p>
			</div>

			<Tabs bind:value={activeTab} class="w-full">
				<TabList class="mb-6">
					<TabTrigger value="sessions">Sessions</TabTrigger>
					<TabTrigger value="analytics">Analytics</TabTrigger>
					<TabTrigger value="templates">Templates</TabTrigger>
				</TabList>

				<TabContent value="sessions">
					<!-- Top Stats Bar - Fixed Position for Key Metrics -->
					{#if sessions && sessions.length > 0}
						<Card variant="analytics" class="mb-6">
							{#snippet children()}
								{@const sessionsList = sessions}
								{@const stats = {
									total: sessionsList.length,
									active: sessionsList.filter((s) => s.isActive).length,
									totalParticipants: sessionsList.reduce(
										(sum, s) => sum + (s.activeCount + s.completedCount),
										0
									),
									completedSurveys: sessionsList.reduce((sum, s) => sum + s.completedCount, 0)
								}}
								<div class="grid grid-cols-2 gap-4 md:grid-cols-4">
									<div
										class="rounded-lg border border-slate-700/20 bg-slate-900/50 p-3 text-center backdrop-blur-sm"
									>
										<div class="text-2xl font-bold text-slate-100">{stats.total}</div>
										<div class="text-xs text-slate-400">Total Sessions</div>
									</div>
									<div
										class="rounded-lg border border-green-700/20 bg-green-900/30 p-3 text-center backdrop-blur-sm"
									>
										<div class="text-2xl font-bold text-green-400">{stats.active}</div>
										<div class="text-xs text-slate-400">Active Now</div>
									</div>
									<div
										class="rounded-lg border border-slate-700/20 bg-slate-900/50 p-3 text-center backdrop-blur-sm"
									>
										<div class="text-2xl font-bold text-slate-100">
											{stats.totalParticipants}
										</div>
										<div class="text-xs text-slate-400">Total Participants</div>
									</div>
									<div
										class="rounded-lg border border-purple-700/20 bg-purple-900/30 p-3 text-center backdrop-blur-sm"
									>
										<div class="text-2xl font-bold text-purple-400">
											{stats.completedSurveys}
										</div>
										<div class="text-xs text-slate-400">Completed</div>
									</div>
								</div>
							{/snippet}
						</Card>
					{/if}

					<!-- Create Session with Smooth Transitions -->
					<Card variant="analytics" class="mb-8 p-6">
						{#snippet children()}
							{#if !showCreateForm}
								<div>
									{#if sessions && sessions.length >= 3}
										<div
											class="rounded-lg border border-slate-700/30 bg-slate-900/50 p-6 text-center backdrop-blur-sm"
										>
											<div class="mb-2 text-4xl">📋</div>
											<h3 class="mb-2 text-lg font-semibold text-slate-200">
												Session Limit Reached
											</h3>
											<p class="mb-4 text-sm text-slate-400">
												You can have up to 3 active sessions. Delete an existing session to create a
												new one.
											</p>
											<div class="text-xs text-slate-500">
												Current sessions: {sessions.length}/3
											</div>
										</div>
									{:else}
										<Button
											onclick={() => (showCreateForm = true)}
											class="w-full bg-gradient-to-r from-cyan-600 to-purple-600 text-white shadow-lg hover:from-cyan-700 hover:to-purple-700 hover:shadow-xl"
											size="lg"
										>
											<span class="mr-2 text-2xl">+</span> Create New Session
										</Button>
									{/if}
								</div>
							{:else}
								<div class="space-y-6">
									<div class="flex items-center justify-between">
										<h2 class="text-2xl font-semibold text-slate-200">Create New Session</h2>
										<Button
											onclick={() => {
												showCreateForm = false;
												sessionName = '';
												selectedTemplate = 'basic';
												selectedActivities = ['workplace-preference'];
											}}
											variant="secondary"
											size="sm"
											class="text-slate-400 hover:text-slate-200"
										>
											✕
										</Button>
									</div>

									<!-- Session Name -->
									<div>
										<TextInput
											id="sessionName"
											bind:value={sessionName}
											placeholder="Enter session name..."
											disabled={isCreating}
											required
											minlength={2}
											label="Session Name"
											size="md"
										/>
									</div>

									<!-- Activity Selection -->
									<ActivitySelector
										{selectedTemplate}
										{selectedActivities}
										onTemplateChange={handleTemplateChange}
										onActivitiesChange={handleActivitiesChange}
									/>

									<!-- Create Button -->
									<div class="flex justify-end">
										<Button
											onclick={handleCreateSession}
											disabled={isCreating ||
												!sessionName.trim() ||
												selectedActivities.length === 0}
											loading={isCreating}
											size="lg"
											class="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
										>
											Create Session with {selectedActivities.length} Activities
										</Button>
									</div>
								</div>
							{/if}
						{/snippet}
					</Card>

					<!-- Sessions Content -->
					<Card variant="analytics" class="relative min-h-[400px]">
						{#snippet children()}
							{#if !sessions || sessions.length === 0}
								<div class="p-12 text-center">
									<div class="mb-4 text-6xl">📊</div>
									<h2 class="mb-2 text-2xl font-semibold text-slate-200">No Sessions Yet</h2>
									<p class="text-slate-400">Create your first session to get started!</p>
								</div>
							{:else}
								{@const sessionsList = sessions}
								<div class="p-6">
									<!-- Session Cards Container with Scroll -->
									<div class="relative">
										<div
											class="scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800/50 max-h-[600px] overflow-y-auto rounded-lg p-2"
										>
											<div
												class="grid auto-rows-fr grid-cols-1 gap-8 pr-2 lg:grid-cols-2 xl:grid-cols-3"
											>
												{#each sessionsList as session (session.code)}
													{@render sessionCard(session)}
												{/each}
											</div>
										</div>

										<!-- Scroll Indicator -->
										{#if sessionsList.length > 8}
											<div
												class="pointer-events-none absolute bottom-0 left-0 right-0 h-8 rounded-b-lg bg-gradient-to-t from-slate-900/90 to-transparent"
											></div>
											<div
												class="absolute bottom-2 right-4 rounded bg-slate-800/80 px-2 py-1 text-xs text-slate-400"
											>
												Scroll for more sessions
											</div>
										{/if}
									</div>

									<!-- Session Count Info -->
									<div class="mt-4 text-center text-sm text-slate-400">
										Showing {sessionsList.length} session{sessionsList.length !== 1 ? 's' : ''}
									</div>
								</div>
							{/if}
						{/snippet}
					</Card>
				</TabContent>

				<TabContent value="analytics">
					{#if sessions && sessions.length > 0}
						{@const activeSession = sessions.find((s) => s.isActive) || sessions[0]}
						<EnhancedAnalyticsDashboard
							sessionCode={activeSession.code}
							title={`Analytics - ${activeSession.name}`}
							refreshInterval={10000}
							showJourneyMap={true}
							showEngagementHeatmap={true}
						/>
					{:else}
						<Card variant="analytics" class="p-12">
							{#snippet children()}
								<div class="text-center">
									<div class="mb-4 text-6xl">📊</div>
									<h3 class="mb-2 text-xl font-semibold text-slate-200">No Sessions Available</h3>
									<p class="text-slate-400">Create a session first to view analytics</p>
								</div>
							{/snippet}
						</Card>
					{/if}
				</TabContent>

				<TabContent value="templates">
					<TemplateManager />
				</TabContent>
			</Tabs>
		</div>
	</div>

	<!-- Error state with reset functionality -->
	{#snippet failed(error, reset)}
		<div class="flex min-h-screen items-center justify-center bg-gray-50 px-4" role="main">
			<div
				class="w-full max-w-md rounded-lg bg-white p-8 shadow-lg"
				role="alert"
				aria-live="assertive"
			>
				<div class="mb-4 text-center text-5xl text-red-600" aria-hidden="true">⚠️</div>
				<h1 class="mb-2 text-center text-2xl font-bold text-gray-800">Admin Dashboard Error</h1>
				<p class="mb-6 text-center text-gray-600">
					{error && typeof error === 'object' && 'message' in error
						? (error as Error).message
						: 'An unexpected error occurred'}
				</p>
				<div class="text-center">
					<button
						type="button"
						class="text-blue-600 underline hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
						onclick={reset}
						aria-label="Try again"
					>
						Try Again
					</button>
				</div>
			</div>
		</div>
	{/snippet}
</svelte:boundary>

<!-- Confirmation Dialog -->
<ConfirmationDialog
	bind:open={deleteDialog.open}
	title="Delete Session"
	message="Are you sure you want to delete this session? This action cannot be undone and all participant data will be lost."
	confirmText="Delete"
	variant="destructive"
	onConfirm={deleteSession}
	onCancel={() => (deleteDialog = { open: false, sessionCode: '' })}
/>

<Toast />

<Toast />

<style></style>
