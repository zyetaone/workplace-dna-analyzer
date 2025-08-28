<script lang="ts">
	import { goto } from '$app/navigation';
	import { formatDate, copyToClipboard } from '$lib/utils/common';
	import { adminState } from './admin.svelte';
	import Toast, { showToast } from '$lib/components/shared/Toast.svelte';
	import { Card, StatsCard, ConfirmationDialog, Button } from '$lib/components';

	// Consolidated UI state
	let sessionName = $state('');
	let showCreateForm = $state(false);
	let actionLoading = $state<{ [key: string]: boolean }>({});
	let deleteDialog = $state({ open: false, sessionCode: '' });

	// Load sessions on mount
	$effect(() => {
		adminState.loadSessions();
	});

	// Generic action handler with loading state
	async function handleAction(key: string, action: () => Promise<any>) {
		actionLoading[key] = true;
		try {
			return await action();
		} finally {
			actionLoading[key] = false;
		}
	}

	// Create session handler
	async function createSession() {
		if (!sessionName.trim()) return;
		
		const result = await handleAction('create', async () => {
			const result = await adminState.createSession(sessionName);
			if (result.success && 'redirect' in result) {
				showToast({ title: 'Success', description: 'Session created successfully', variant: 'success' });
				sessionName = '';
				showCreateForm = false;
				goto(result.redirect);
			} else {
				showToast({ title: 'Error', description: 'Failed to create session', variant: 'error' });
			}
			return result;
		});
	}

	// Delete session handler
	async function deleteSession() {
		const sessionCode = deleteDialog.sessionCode;
		if (!sessionCode) return;

		await handleAction(`delete-${sessionCode}`, async () => {
			const result = await adminState.deleteSession(sessionCode);
			showToast({
				title: result.success ? 'Success' : 'Error',
				description: result.success ? 'Session deleted successfully' : ('error' in result ? result.error : 'Failed to delete session'),
				variant: result.success ? 'success' : 'error'
			});
			deleteDialog = { open: false, sessionCode: '' };
		});
	}

	// Copy link handler
	function copyLink(session: any) {
		copyToClipboard(`${window.location.origin}/${session.code}`);
		showToast({ title: 'Link copied!', description: 'Participant join link copied to clipboard.', variant: 'success' });
	}

	// Navigation helper
	const openSession = (code: string) => goto(`/admin/${code}`);
	const confirmDelete = (code: string) => {
		deleteDialog = { open: true, sessionCode: code };
	};
</script>

<!-- Session Card Snippet -->
{#snippet sessionCard(session)}
	<Card variant="elevated" hoverable size="md" class="overflow-hidden">
		{#snippet children()}
		<div class="p-6 border-b border-gray-100">
			<div class="flex justify-between items-start mb-3">
				<h3 class="text-xl font-semibold text-gray-800 truncate pr-2">{session.name}</h3>
				<div class="flex items-center gap-1">
					<span class="relative flex h-3 w-3">
						{#if session.isActive}
							<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
							<span class="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
						{:else}
							<span class="relative inline-flex rounded-full h-3 w-3 bg-gray-400"></span>
						{/if}
					</span>
					<span class="text-xs font-medium {session.isActive ? 'text-green-600' : 'text-gray-500'}">
						{session.isActive ? 'Active' : 'Inactive'}
					</span>
				</div>
			</div>
			
			<div class="mb-4">
				<span class="text-sm text-gray-500">Code:</span>
				<span class="ml-2 font-mono text-lg text-gray-700">{session.code}</span>
			</div>
			
			<div class="grid grid-cols-2 gap-4 mb-4">
				<div class="text-center p-2 bg-gray-50 rounded">
					<div class="text-2xl font-bold text-gray-700">{session.activeCount || 0}</div>
					<div class="text-xs text-gray-500">Active</div>
				</div>
				<div class="text-center p-2 bg-green-50 rounded">
					<div class="text-2xl font-bold text-green-600">{session.completedCount || 0}</div>
					<div class="text-xs text-gray-500">Completed</div>
				</div>
			</div>
			
			<div class="text-sm text-gray-500">Created: {formatDate(session.createdAt)}</div>
		</div>
		{/snippet}
		{#snippet actions()}
			<div class="grid grid-cols-3 gap-2">
				<Button onclick={() => openSession(session.code)} variant="default" size="sm">Open</Button>
				<Button onclick={() => copyLink(session)} variant="secondary" size="sm">Copy Link</Button>
				<Button 
					onclick={() => confirmDelete(session.code)}
					disabled={actionLoading[`delete-${session.code}`]}
					loading={actionLoading[`delete-${session.code}`]}
					variant="destructive" 
					size="sm"
				>
					Delete
				</Button>
			</div>
		{/snippet}
	</Card>
{/snippet}

<!-- Main Layout -->
<div class="min-h-screen animated-gradient">
	<div class="container mx-auto px-6 py-12">
		<!-- Header -->
		<Card variant="elevated" size="lg" class="mb-8" title="Presenter Dashboard" subtitle="Manage your workplace experience sessions">
			{#snippet children()}{/snippet}
		</Card>
		
		<!-- Create Session -->
		<Card variant="elevated" size="lg" class="mb-8">
			{#snippet children()}
				{#if !showCreateForm}
					<Button
						onclick={() => showCreateForm = true}
						class="w-full bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800"
						size="lg"
					>
						<span class="text-2xl">+</span> Create New Session
					</Button>
				{:else}
					<div class="space-y-4">
						<h2 class="text-2xl font-semibold text-gray-800">Create New Session</h2>
						<div class="flex gap-4">
							<div class="flex-1">
								<label for="sessionName" class="block text-xs font-medium text-gray-700 mb-1">
									Session Name
									<span class="text-red-500" aria-label="required">*</span>
								</label>
								<input
									id="sessionName"
									bind:value={sessionName}
									placeholder="Enter session name..."
									disabled={actionLoading.create}
									required
									minlength={2}
									class="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-gray-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
								/>
							</div>
							<div class="flex gap-2 items-end">
								<Button
									onclick={createSession}
									disabled={actionLoading.create || !sessionName.trim()}
									loading={actionLoading.create}
									size="lg"
								>
									Create
								</Button>
								<Button
									onclick={() => { showCreateForm = false; sessionName = ''; }}
									variant="secondary"
									size="lg"
								>
									Cancel
								</Button>
							</div>
						</div>
					</div>
				{/if}
			{/snippet}
		</Card>
		
		<!-- Sessions Content -->
		<Card variant="elevated" loading={adminState.isLoading}>
			{#snippet children()}
				{#if adminState.error}
					<div class="p-12 text-center">
						<div class="text-6xl mb-4">❌</div>
						<h2 class="text-2xl font-semibold text-gray-800 mb-2">Error Loading Sessions</h2>
						<p class="text-gray-600">{adminState.error}</p>
					</div>
				{:else if adminState.sessions.length === 0}
					<div class="p-12 text-center">
						<div class="text-6xl mb-4">📊</div>
						<h2 class="text-2xl font-semibold text-gray-800 mb-2">No Sessions Yet</h2>
						<p class="text-gray-600">Create your first session to get started!</p>
					</div>
				{:else}
					<div class="p-6">
						<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{#each adminState.sessions as session}
								{@render sessionCard(session)}
							{/each}
						</div>
					</div>
				{/if}
			{/snippet}
		</Card>
		
		<!-- Footer Stats -->
		{#if adminState.sessions && adminState.stats.total > 0}
			<Card variant="default" class="mt-8">
				{#snippet children()}
					<div class="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
						<StatsCard title="Total Sessions" value={adminState.stats.total} />
						<StatsCard title="Active Sessions" value={adminState.stats.active} valueClass="text-3xl font-bold text-green-600" />
						<StatsCard title="Total Participants" value={adminState.stats.totalParticipants} />
						<StatsCard title="Completed Surveys" value={adminState.stats.completedSurveys} />
					</div>
				{/snippet}
			</Card>
		{/if}
	</div>
</div>

<!-- Confirmation Dialog -->
<ConfirmationDialog
	bind:open={deleteDialog.open}
	title="Delete Session"
	message="Are you sure you want to delete this session? This action cannot be undone and all participant data will be lost."
	confirmText={actionLoading[`delete-${deleteDialog.sessionCode}`] ? 'Deleting...' : 'Delete'}
	variant="destructive"
	onConfirm={deleteSession}
	onCancel={() => deleteDialog = { open: false, sessionCode: '' }}
/>

<Toast />