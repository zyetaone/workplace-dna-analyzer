<script lang="ts">
	import { goto } from '$app/navigation';
	import { formatDate, copyToClipboard } from '$lib/utils/common';
	import { getAllSessionsRemote, createSessionRemote, deleteSessionRemote } from '../data.remote';
	import Toast, { showToast } from './(components)/Toast.svelte';
	import { Card, StatsCard, ConfirmationDialog, Button, TextInput } from '$lib/components';

	// Sessions state
	let sessions = $state<any[]>([]);
	let sessionsLoading = $state(true);
	let sessionsError = $state<string | null>(null);

	// Load sessions
	async function loadSessions() {
		sessionsLoading = true;
		sessionsError = null;
		try {
			sessions = await getAllSessionsRemote({});
		} catch (error: any) {
			console.error('Failed to load sessions:', error);
			sessionsError = error.message;
		} finally {
			sessionsLoading = false;
		}
	}

	// Load sessions on mount
	$effect(() => {
		loadSessions();
	});

	// Simplified UI state
	let sessionName = $state('');
	let showCreateForm = $state(false);
	let isCreating = $state(false);
	let deleteDialog = $state({ open: false, sessionCode: '' });

	// Create session handler
	async function createSession() {
		if (!sessionName.trim()) return;

		isCreating = true;
		try {
			const result = await createSessionRemote({ name: sessionName });

			if (result.success && 'redirect' in result) {
				showToast({
					title: 'Success',
					description: 'Session created successfully',
					variant: 'success'
				});
				sessionName = '';
				showCreateForm = false;
				
				// Reload sessions to show updated list
				await loadSessions();

				// Navigate immediately
				console.log('Navigating to:', result.redirect);
				goto(result.redirect);
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
			const result = await deleteSessionRemote({ code: sessionCode });

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
				// Reload sessions after deletion
				await loadSessions();
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
			description: 'Team member session link copied to clipboard.',
			variant: 'success'
		});
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
			variant="glassDark"
			hoverable
			hoverEffect="glow"
			size="lg"
			class="min-h-[320px] overflow-hidden flex flex-col transform hover:scale-[1.02] transition-all duration-300 ring-2 ring-slate-600/60 hover:ring-cyan-500/50 shadow-2xl hover:shadow-cyan-500/20"
		>
			{#snippet children()}
				<div class="flex-1 flex flex-col">
					<!-- Header with status -->
					<div class="flex justify-between items-start mb-4">
						<h3 class="text-heading-1 text-white flex-1 pr-3 drop-shadow-lg">
							{session.name}
						</h3>
						<div class="flex items-center gap-2 flex-shrink-0">
							<span class="relative flex h-3 w-3">
								{#if session.isActive}
									<span
										class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"
									></span>
									<span class="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
								{:else}
									<span class="relative inline-flex rounded-full h-3 w-3 bg-slate-500"></span>
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
						<div class="text-sm text-slate-400 mb-1 font-medium">Session Code</div>
						<div
							class="text-2xl font-mono text-accent bg-slate-950/90 backdrop-blur-xl px-4 py-3 rounded-lg border-2 border-cyan-500/30 shadow-inner"
						>
							{session.code}
						</div>
					</div>

					<!-- Stats Grid -->
					<div class="grid grid-cols-2 gap-4 mb-4">
						<div
							class="text-center p-4 bg-slate-900/60 backdrop-blur-xl rounded-lg border-2 border-slate-700/50 shadow-lg"
						>
							<div class="text-2xl font-mono text-white">{session.activeCount || 0}</div>
							<div class="text-xs text-slate-400">Active Respondents</div>
						</div>
						<div
							class="text-center p-4 bg-gradient-to-br from-green-900/40 to-emerald-900/40 backdrop-blur-xl rounded-lg border-2 border-green-600/50 shadow-lg"
						>
							<div class="text-2xl font-mono text-success">{session.completedCount || 0}</div>
							<div class="text-xs text-slate-400">Assessments Complete</div>
						</div>
					</div>

					<!-- Creation Date -->
					<div class="text-sm text-slate-400 mt-auto">
						Created: {formatDate(session.createdAt)}
					</div>
				</div>
			{/snippet}

			{#snippet actions()}
				<div class="grid grid-cols-3 gap-2">
					<Button
						onclick={() => openSession(session.code)}
						variant="secondary"
						size="sm"
						class="text-xs bg-slate-800/80 hover:bg-slate-700/80 text-white border border-slate-600/50"
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

<!-- Main Layout with Swiss Grid -->
<svelte:boundary onerror={(error, reset) => console.error('Admin Dashboard Error:', error)}>
	<div class="swiss-container swiss-container-2xl">
		<div class="swiss-dashboard">
			<!-- Dashboard Header -->
			<div class="swiss-dashboard-header">
				<div class="swiss-flow-sm">
					<h1 class="text-display gradient-text-primary">Session Facilitator Dashboard</h1>
					<p class="text-body text-slate-400">Manage your workplace assessment sessions</p>
				</div>
			</div>

			<!-- Top Stats Bar with Swiss Grid -->
			{#if sessions && sessions.length > 0}
				<div class="swiss-col-full mb-6">
					<Card variant="glassDark" class="overflow-hidden">
						{#snippet children()}
							{@const sessionsList = sessions}
							{@const stats = {
								total: sessionsList.length,
								active: sessionsList.filter(s => s.isActive).length,
								totalParticipants: sessionsList.reduce((sum, s) => sum + (s.activeCount + s.completedCount), 0),
								completedSurveys: sessionsList.reduce((sum, s) => sum + s.completedCount, 0)
							}}
							<div class="swiss-stats-grid">
								<div class="swiss-stats-card">
									<div class="stats-number">{stats.total}</div>
									<div class="text-sm text-slate-400 font-medium">Total Sessions</div>
								</div>
								<div class="swiss-stats-card">
									<div class="stats-number text-green-400">{stats.active}</div>
									<div class="text-sm text-slate-400 font-medium">Active Now</div>
								</div>
								<div class="swiss-stats-card">
									<div class="stats-number">{stats.totalParticipants}</div>
									<div class="text-sm text-slate-400 font-medium">Total Respondents</div>
								</div>
								<div class="swiss-stats-card">
									<div class="stats-number text-purple-400">{stats.completedSurveys}</div>
									<div class="text-sm text-slate-400 font-medium">Assessments Complete</div>
								</div>
							</div>
						{/snippet}
					</Card>
				</div>
			{/if}

			<!-- Create Session Section -->
			<div class="swiss-dashboard-main">
				<Card variant="glassDark" size="lg" class="mb-6">
				{#snippet children()}
					{#if !showCreateForm}
						<div>
							{#if sessions && sessions.length >= 3}
								<div
									class="text-center p-6 bg-slate-900/50 backdrop-blur-sm rounded-lg border border-slate-700/30"
								>
									<div class="text-4xl mb-2">📋</div>
									<h3 class="text-heading-2 text-slate-200 mb-2">Session Limit Reached</h3>
									<p class="text-slate-400 text-sm mb-4">
										You can have up to 3 active workplace assessment sessions. Delete an existing session to create a new
										one.
									</p>
									<div class="text-xs text-slate-500">
										Current sessions: {sessions.length}/3
									</div>
								</div>
							{:else}
								<Button
									onclick={() => (showCreateForm = true)}
									class="w-full bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl"
									size="lg"
								>
									<span class="text-sm font-medium">+ Create New Session</span>
								</Button>
							{/if}
						</div>
					{:else}
						<div class="space-y-6">
							<div class="flex items-center justify-between">
								<h2 class="text-heading-1 text-slate-200">Create New Session</h2>
								<Button
									onclick={() => {
										showCreateForm = false;
										sessionName = '';
									}}
									variant="secondary"
									size="sm"
									class="text-slate-400 hover:text-slate-200"
								>
									✕
								</Button>
							</div>
							<div class="flex flex-col sm:flex-row gap-4">
								<div class="flex-1">
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
								<div class="flex gap-2 items-end">
									<Button
										onclick={createSession}
										disabled={isCreating || !sessionName.trim()}
										loading={isCreating}
										size="lg"
										class="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
									>
										Create Session
									</Button>
								</div>
							</div>
						</div>
					{/if}
				{/snippet}
				</Card>

				<!-- Sessions Content -->
				<Card variant="glassDark" class="min-h-[400px] relative">
				{#snippet children()}
					{#if sessionsError}
						<div class="p-12 text-center">
							<div class="text-6xl mb-4">❌</div>
							<h2 class="text-heading-1 text-slate-200 mb-2">Error Loading Sessions</h2>
							<p class="text-slate-400">{sessionsError || 'Failed to load sessions'}</p>
						</div>
					{:else if sessionsLoading}
						<div class="p-12 text-center">
							<div class="inline-flex items-center justify-center w-16 h-16 mb-4">
								<div class="animate-spin rounded-full border-4 border-slate-700 border-t-cyan-500 w-12 h-12"></div>
							</div>
							<h2 class="text-heading-2 text-slate-200 mb-2">Loading Sessions</h2>
							<p class="text-slate-400">Fetching your sessions...</p>
						</div>
					{:else if !sessions || sessions.length === 0}
						<div class="p-12 text-center">
							<div class="text-6xl mb-4">📊</div>
							<h2 class="text-heading-1 text-slate-200 mb-2">No Sessions Yet</h2>
							<p class="text-slate-400">Create your first session to get started!</p>
						</div>
					{:else}
						{@const sessionsList = sessions}
						<div class="p-6">
							<!-- Session Cards Container with Scroll -->
							<div class="relative">
								<div
									class="max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800/50 rounded-lg p-2"
								>
									<div class="swiss-card-grid-3 swiss-gap-xl pr-2">
										{#each sessionsList as session (session.code)}
											{@render sessionCard(session)}
										{/each}
									</div>
								</div>

								<!-- Scroll Indicator -->
								{#if sessionsList.length > 8}
									<div
										class="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-slate-900/90 to-transparent pointer-events-none rounded-b-lg"
									></div>
									<div
										class="absolute bottom-2 right-4 text-xs text-slate-400 bg-slate-800/80 px-2 py-1 rounded"
									>
										Scroll for more sessions
									</div>
								{/if}
							</div>

							<!-- Session Count Info -->
							<div class="mt-4 text-center text-sm text-slate-400">
								Showing {sessionsList.length} session{sessionsList.length !== 1
									? 's'
									: ''}
							</div>
						</div>
					{/if}
				{/snippet}
				</Card>
			</div>
		</div>
	</div>

	<!-- Error state with reset functionality -->
	{#snippet failed(error, reset)}
		<div class="min-h-screen bg-gray-50 flex items-center justify-center px-4" role="main">
			<div
				class="bg-white rounded-lg shadow-lg p-8 max-w-md w-full"
				role="alert"
				aria-live="assertive"
			>
				<div class="text-red-600 text-5xl text-center mb-4" aria-hidden="true">⚠️</div>
				<h1 class="text-heading-1 text-gray-800 mb-2 text-center">Facilitator Dashboard Error</h1>
				<p class="text-gray-600 text-center mb-6">
					{error && typeof error === 'object' && 'message' in error
						? (error as Error).message
						: 'An unexpected error occurred'}
				</p>
				<div class="text-center">
					<button
						type="button"
						class="text-blue-600 hover:text-blue-800 underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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
	message="Are you sure you want to delete this session? This action cannot be undone and all respondent preference data will be lost."
	confirmText="Delete"
	variant="destructive"
	onConfirm={deleteSession}
	onCancel={() => (deleteDialog = { open: false, sessionCode: '' })}
/>

<Toast />
