<script lang="ts">
	import { goto } from '$app/navigation';
	import { navigating } from '$app/stores';
	import { formatDate, copyToClipboard } from '$lib/utils/common';
	import { getAllSessions, createSession, deleteSession } from './admin.remote';
	import { handleError } from '$lib/utils/error-utils';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import Toast, { showToast } from '$lib/components/Toast.svelte';

	// Local reactive state
	let sessions = $state<any[]>([]);
	let sessionName = $state('');
	let isCreating = $state(false);
	let isDeletingSession = $state<string | null>(null);
	let showCreateForm = $state(false);
	let isLoading = $state(true);
	let error = $state('');
	
	// Derived loading states
	let isNavigatingToSession = $derived(!!$navigating && $navigating?.to?.url.pathname?.includes('/admin/'));
	let isNavigatingAway = $derived(!!$navigating && !$navigating.to?.url.pathname?.includes('/admin'));

	// Dialog states
	let deleteDialogOpen = $state(false);
	let sessionToDelete = $state<string | null>(null);

	// Derived states for computed values
	let totalSessions = $derived(sessions.length);
	let activeSessions = $derived(sessions.filter(s => s.isActive).length);
	let totalParticipants = $derived(
		sessions.reduce((sum, s) => sum + (s.activeCount || 0) + (s.completedCount || 0), 0)
	);
	let completedSurveys = $derived(
		sessions.reduce((sum, s) => sum + (s.completedCount || 0), 0)
	);

	// Load sessions on mount
	$effect(() => {
		loadSessions();
	});

	// Load all sessions
	async function loadSessions() {
		try {
			isLoading = true;
			error = '';
			const result = await getAllSessions({});
			sessions = result || [];
		} catch (err) {
			error = handleError(err, 'loading sessions');
		} finally {
			isLoading = false;
		}
	}

	// Create new session
	async function handleCreateSession() {
		if (!sessionName.trim() || isCreating || !!$navigating) return;

		isCreating = true;
		try {
			const result = await createSession({ name: sessionName.trim() });
			if (result.success && result.redirect) {
				// Don't reset isCreating here - let navigation handling do it
				goto(result.redirect);
			} else {
				console.log('Toast:', {
					title: 'Error',
					description: 'Failed to create session',
					variant: 'error'
				});
				isCreating = false;
			}
		} catch (err) {
			console.log('Toast:', {
				title: 'Error',
				description: handleError(err, 'creating session'),
				variant: 'error'
			});
			isCreating = false;
		}
	}

	// Delete session
	async function handleDeleteConfirm() {
		if (!sessionToDelete) return;

		isDeletingSession = sessionToDelete;
		try {
			const result = await deleteSession({ code: sessionToDelete });
			if (result.success) {
				console.log('Toast:', {
					title: 'Success',
					description: 'Session deleted successfully',
					variant: 'success'
				});
				await loadSessions(); // Reload sessions
			} else {
				console.log('Toast:', {
					title: 'Error',
					description: result.error || 'Failed to delete session',
					variant: 'error'
				});
			}
		} catch (err) {
			console.log('Toast:', {
				title: 'Error',
				description: handleError(err, 'deleting session'),
				variant: 'error'
			});
		} finally {
			isDeletingSession = null;
			deleteDialogOpen = false;
			sessionToDelete = null;
		}
	}
	
	// Copy participant join link  
	function handleCopyLink(session: any) {
		const link = `${window.location.origin}/${session.code}`;
		copyToClipboard(link);
		console.log('Toast:', {
			title: 'Link copied!',
			description: 'The participant join link has been copied to your clipboard.',
			variant: 'success'
		});
	}
	
	// Navigate to session dashboard
	function openSession(session: any) {
		if (!!$navigating) return;
		goto(`/admin/${session.code}`);
	}
	
	// Delete session handler
	function handleDeleteSession(slug: string) {
		sessionToDelete = slug;
		deleteDialogOpen = true;
	}
	

	

	
</script>

<!-- Snippet for session card to reduce duplication -->
{#snippet sessionCard(session)}
	<div class="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
		<div class="p-6 border-b border-gray-100">
			<div class="flex justify-between items-start mb-3">
				<h3 class="text-xl font-semibold text-gray-800 truncate pr-2">
					{session.name}
				</h3>
				<div class="flex items-center gap-1">
					{#if session.isActive}
						<span class="relative flex h-3 w-3">
							<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
							<span class="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
						</span>
						<span class="text-xs font-medium text-green-600">Active</span>
					{:else}
						<span class="relative inline-flex rounded-full h-3 w-3 bg-gray-400"></span>
						<span class="text-xs font-medium text-gray-500">Inactive</span>
					{/if}
				</div>
			</div>
			
			<div class="mb-4">
				<span class="text-sm text-gray-500">Session Code:</span>
				<span class="ml-2 font-mono text-lg text-gray-700">{session.code}</span>
			</div>
			
			<div class="grid grid-cols-2 gap-4">
				<div class="text-center p-2 bg-gray-50 rounded">
					<div class="text-2xl font-bold text-gray-700">{session.activeCount || 0}</div>
					<div class="text-xs text-gray-500">Active</div>
				</div>
				<div class="text-center p-2 bg-green-50 rounded">
					<div class="text-2xl font-bold text-green-600">{session.completedCount || 0}</div>
					<div class="text-xs text-gray-500">Completed</div>
				</div>
			</div>
			
			<div class="mt-4 text-sm text-gray-500">
				Created: {formatDate(session.createdAt)}
			</div>
		</div>
		
		<div class="p-4 bg-gray-50">
			<div class="grid grid-cols-3 gap-2">
				<button
					onclick={() => openSession(session)}
					disabled={!!$navigating}
					class="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
				>
					{#if isNavigatingToSession}
						<div class="animate-spin rounded-full h-3 w-3 border-b border-white"></div>
					{/if}
					<span>Open</span>
				</button>
				<button
					onclick={() => handleCopyLink(session)}
					class="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition text-sm font-medium"
				>
					Copy Link
				</button>
				<button
					onclick={() => handleDeleteSession(session.slug)}
					disabled={isDeletingSession === session.slug}
					class="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition text-sm font-medium disabled:opacity-50"
				>
					{isDeletingSession === session.slug ? '...' : 'Delete'}
				</button>
			</div>
		</div>
	</div>
{/snippet}

<div class="min-h-screen animated-gradient">
	<div class="container mx-auto px-6 py-12">
		<!-- Header -->
		<div class="bg-white rounded-lg shadow-lg p-8 mb-8">
			<div>
				<h1 class="text-4xl font-bold text-gray-800 mb-2">Presenter Dashboard</h1>
				<p class="text-gray-600">Manage your workplace experience sessions</p>
			</div>
		</div>
		
		<!-- Create New Session Section -->
		<div class="bg-white rounded-lg shadow-lg p-8 mb-8">
			{#if !showCreateForm}
				<button
					onclick={() => showCreateForm = true}
					class="w-full py-4 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg hover:from-gray-700 hover:to-gray-800 transition font-semibold text-lg flex items-center justify-center gap-3"
				>
					<span class="text-2xl">+</span>
					Create New Session
				</button>
			{:else}
				<div class="space-y-4">
					<h2 class="text-2xl font-semibold text-gray-800">Create New Session</h2>
					<div class="flex gap-4">
						<input
							type="text"
							bind:value={sessionName}
							placeholder="Enter session name..."
							disabled={isCreating}
							required
							minlength="2"
							class="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
						/>
						<button
							onclick={handleCreateSession}
							disabled={isCreating || !sessionName.trim() || !!$navigating}
							class="px-8 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-2"
						>
							{#if isCreating || isNavigatingToSession}
								<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
								<span>{isNavigatingToSession ? 'Navigating...' : 'Creating...'}</span>
							{:else}
								<span>Create</span>
							{/if}
						</button>
						<button
							type="button"
							onclick={() => { showCreateForm = false; sessionName = ''; }}
							class="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
						>
							Cancel
						</button>
					</div>
				</div>
			{/if}
		</div>
		
		<!-- Sessions Grid/List -->
		{#if isLoading}
			<div class="bg-white rounded-lg shadow-lg p-12 flex justify-center">
				<div class="text-center">
					<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto"></div>
					<p class="mt-4 text-gray-600">Loading sessions...</p>
				</div>
			</div>
		{:else if error}
			<div class="bg-white rounded-lg shadow-lg p-12 flex justify-center">
				<div class="text-center">
					<div class="text-6xl mb-4">❌</div>
					<h2 class="text-2xl font-semibold text-gray-800 mb-2">Error Loading Sessions</h2>
					<p class="text-gray-600">{error}</p>
				</div>
			</div>
		{:else if sessions.length === 0}
			<div class="bg-white rounded-lg shadow-lg p-12 flex justify-center">
				<div class="text-center">
					<div class="text-6xl mb-4">📊</div>
					<h2 class="text-2xl font-semibold text-gray-800 mb-2">No Sessions Yet</h2>
					<p class="text-gray-600">Create your first session to get started!</p>
				</div>
			</div>
		{:else}
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{#each sessions as session}
					{@render sessionCard(session)}
				{/each}
			</div>
		{/if}
		
		<!-- Footer Stats -->
		{#if sessions && totalSessions > 0}
			<div class="mt-12 bg-white rounded-lg shadow-lg p-6">
				<div class="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
					<div>
						<div class="text-3xl font-bold text-gray-700">
							{totalSessions}
						</div>
						<div class="text-sm text-gray-500">Total Sessions</div>
					</div>
					<div>
						<div class="text-3xl font-bold text-green-600">
							{activeSessions}
						</div>
						<div class="text-sm text-gray-500">Active Sessions</div>
					</div>
					<div>
						<div class="text-3xl font-bold text-gray-700">
							{totalParticipants}
						</div>
						<div class="text-sm text-gray-500">Total Participants</div>
					</div>
					<div>
						<div class="text-3xl font-bold text-gray-700">
							{completedSurveys}
						</div>
						<div class="text-sm text-gray-500">Completed Surveys</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>

<!-- Confirm Dialog for Delete -->
{#if deleteDialogOpen && sessionToDelete}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-white rounded-lg p-6 max-w-md">
			<h2 class="text-xl font-bold mb-4">Delete Session</h2>
			<p class="mb-6 text-gray-600">Are you sure you want to delete this session? This action cannot be undone and all participant data will be lost.</p>
			<div class="flex justify-end gap-3">
				<button
					onclick={() => { deleteDialogOpen = false; sessionToDelete = null; }}
					class="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition"
				>
					Cancel
				</button>
				<button
					onclick={handleDeleteConfirm}
					disabled={isDeletingSession === sessionToDelete}
					class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition disabled:opacity-50"
				>
					{isDeletingSession === sessionToDelete ? 'Deleting...' : 'Delete'}
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Toast notifications -->
<Toast />

<!-- Styles moved to global app.css -->