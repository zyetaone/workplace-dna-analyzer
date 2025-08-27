<script lang="ts">
	import { goto } from '$app/navigation';
	import { createSession, deleteSession, getDashboardSessions } from './dashboard.remote.js';
	import { handleError } from '$lib/utils/error-utils';
	import { formatDate, copyToClipboard } from '$lib/utils/common';
	import { state as dashboardState, setSessions, setLoading, setError } from './dashboard.svelte.ts';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import Toast, { showToast } from '$lib/components/Toast.svelte';
	
	
	
	// Local reactive state
	let sessionName = $state('');
	let isCreating = $state(false);
	let isDeletingSession = $state<string | null>(null);
	let showCreateForm = $state(false);
	
	// Dialog states
	let deleteDialogOpen = $state(false);
	let sessionToDelete = $state<string | null>(null);
	
	// Presenter ID is managed by hooks.ts authentication
	const presenterId = 'presenter';
	
	// Load sessions on mount
	$effect(() => {
		setLoading(true);
		getDashboardSessions({ presenterId })
			.then(sessionData => setSessions(sessionData))
			.catch(err => {
				console.error('Failed to load sessions:', err);
				setError('Failed to load sessions');
			})
			.finally(() => {
				setLoading(false);
			});
	});
	
	// Create new session
	async function handleCreateSession() {
		if (!sessionName.trim()) {
			setError('Please enter a session name');
			return;
		}
		
		
		isCreating = true;
		setError(null);
		
		try {
			const result = await createSession({
				title: sessionName.trim(),
				presenterId: presenterId
			});
			
			if (result.success && result.data?.session) {
				// Refresh the sessions list
				const updatedSessions = await getDashboardSessions({ presenterId });
				setSessions(updatedSessions);
				
				// Clear form
				sessionName = '';
				showCreateForm = false;
				
				// Then navigate to the new session
				if (result.data?.redirect) {
					goto(result.data.redirect);
				}
			}
		} catch (err) {
			dashboardState.setError('Failed to create session');
			console.error('Create session error:', err);
		} finally {
			isCreating = false;
		}
	}
	
	// Delete session
	async function handleDeleteSession(slug: string) {
		sessionToDelete = slug;
		deleteDialogOpen = true;
	}
	
	async function confirmDeleteSession() {
		if (!sessionToDelete) return;
		
		isDeletingSession = sessionToDelete;
		try {
			await deleteSession({ slug: sessionToDelete, presenterId });
			
			// Update global state by removing the session
			const updatedSessions = await getDashboardSessions({ presenterId });
			setSessions(updatedSessions);
			
			// Show success toast
			showToast({
				title: 'Session deleted',
				description: 'The session has been permanently deleted.',
				variant: 'success'
			});
		} catch (err) {
			console.error('Failed to delete session:', err);
			setError('Failed to delete session');
		} finally {
			isDeletingSession = null;
			sessionToDelete = null;
		}
	}
	
	// Copy participant join link  
	function handleCopyLink(slug: string) {
		const link = `${window.location.origin}/dashboard/${slug}/join`;
		copyToClipboard(link);
		showToast({
			title: 'Link copied!',
			description: 'The participant join link has been copied to your clipboard.',
			variant: 'success'
		});
	}
	
	// Navigate to session dashboard
	function openSession(slug: string) {
		goto(`/dashboard/${slug}`);
	}
	
	// Logout (simplified without auth)
	async function handleLogout() {
		goto('/');
	}
	

	
	// Allow Enter key to create session
	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !isCreating) {
			handleCreateSession();
		}
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
					onclick={() => openSession(session.slug)}
					class="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition text-sm font-medium"
				>
					Open
				</button>
				<button
					onclick={() => handleCopyLink(session.slug)}
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
		<!-- Header with Logout -->
		<div class="bg-white rounded-lg shadow-lg p-8 mb-8">
			<div class="flex justify-between items-center">
				<div>
					<h1 class="text-4xl font-bold text-gray-800 mb-2">Presenter Dashboard</h1>
					<p class="text-gray-600">Manage your workplace experience sessions</p>
				</div>
				<button
					onclick={handleLogout}
					class="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium"
				>
					Logout
				</button>
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
							onkeydown={handleKeydown}
							disabled={isCreating}
							class="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
						/>
						<button
							onclick={handleCreateSession}
							disabled={isCreating}
							class="px-8 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
						>
							{isCreating ? 'Creating...' : 'Create'}
						</button>
						<button
							onclick={() => { showCreateForm = false; sessionName = ''; dashboardState.setError(null); }}
							class="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
						>
							Cancel
						</button>
					</div>
					{#if dashboardState.error}
						<p class="text-red-500 text-sm">{dashboardState.error}</p>
					{/if}
				</div>
			{/if}
		</div>
		
		<!-- Sessions Grid/List -->
		{#if dashboardState.isLoading}
			<div class="bg-white rounded-lg shadow-lg p-12 flex justify-center">
				<div class="text-center">
					<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto"></div>
				<p class="mt-4 text-gray-600">Loading sessions...</p>
				</div>
			</div>
		{:else if dashboardState.sessions.length === 0}
			<div class="bg-white rounded-lg shadow-lg p-12">
				<div class="text-center">
					<div class="text-6xl mb-4">📋</div>
					<h3 class="text-2xl font-semibold text-gray-800 mb-2">No Sessions Yet</h3>
					<p class="text-gray-600 mb-6">Create your first session to get started</p>
					{#if !showCreateForm}
						<button
							onclick={() => showCreateForm = true}
							class="px-8 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-semibold"
						>
							Create First Session
						</button>
					{/if}
				</div>
			</div>
		{:else}
			<div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
				{#each dashboardState.sessions as session}
					{@render sessionCard(session)}
				{/each}
			</div>
		{/if}
		
		<!-- Footer Stats -->
		{#if dashboardState.sessions.length > 0}
			<div class="mt-12 bg-white rounded-lg shadow-lg p-6">
				<div class="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
					<div>
						<div class="text-3xl font-bold text-gray-700">
							{dashboardState.sessions.length}
						</div>
						<div class="text-sm text-gray-500">Total Sessions</div>
					</div>
					<div>
						<div class="text-3xl font-bold text-green-600">
							{dashboardState.sessions.filter(s => s.isActive).length}
						</div>
						<div class="text-sm text-gray-500">Active Sessions</div>
					</div>
					<div>
						<div class="text-3xl font-bold text-gray-700">
							{dashboardState.sessions.reduce((sum, s) => sum + (s.activeCount || 0) + (s.completedCount || 0), 0)}
						</div>
						<div class="text-sm text-gray-500">Total Participants</div>
					</div>
					<div>
						<div class="text-3xl font-bold text-gray-700">
							{dashboardState.sessions.reduce((sum, s) => sum + (s.completedCount || 0), 0)}
						</div>
						<div class="text-sm text-gray-500">Completed Surveys</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>

<!-- Confirm Dialog for Delete -->
<ConfirmDialog 
	bind:open={deleteDialogOpen}
	title="Delete Session"
	description="Are you sure you want to delete this session? This action cannot be undone and all participant data will be lost."
	confirmText="Delete"
	cancelText="Cancel"
	onConfirm={confirmDeleteSession}
	variant="danger"
/>

<!-- Toast notifications -->
<Toast />

<!-- Styles moved to global app.css -->