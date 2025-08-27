<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { createSession, deleteSession, getDashboardSessions } from './dashboard.remote.js';
	import { logout } from '../auth.remote';
	import { state, setSessions } from './dashboard.svelte.ts';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	
	// Local reactive state
	let sessionName = $state('');
	let isCreating = $state(false);
	let isDeletingSession = $state<string | null>(null);
	let error = $state('');
	let showCreateForm = $state(false);
	let isLoading = $state(true);
	
	// Get presenterId from cookies (set by hooks.ts)
	let presenterId = $state<string | null>(null);
	
	// Load sessions on mount
	onMount(async () => {
		// Use a simple UUID as presenterId (hooks.ts ensures auth)
		// The actual presenterId is in the cookie but we don't need it for queries
		presenterId = 'presenter'; // Simple static ID since we have single presenter
		
		try {
			const sessionData = await getDashboardSessions({ presenterId });
			setSessions(sessionData);
		} catch (err) {
			console.error('Failed to load sessions:', err);
			error = 'Failed to load sessions';
		}
		
		isLoading = false;
	});
	
	// Create new session
	async function handleCreateSession() {
		if (!sessionName.trim()) {
			error = 'Please enter a session name';
			return;
		}
		
		if (!presenterId) {
			error = 'Not authenticated. Please refresh the page.';
			return;
		}
		
		isCreating = true;
		error = '';
		
		try {
			const result = await createSession({
				title: sessionName.trim(),
				presenterId: presenterId
			});
			
			if (result.success && result.session) {
				// Refresh the sessions list
				const updatedSessions = await getDashboardSessions({ presenterId });
				setSessions(updatedSessions);
				
				// Clear form
				sessionName = '';
				showCreateForm = false;
				
				// Then navigate to the new session
				if (result.redirect) {
					goto(result.redirect);
				}
			}
		} catch (err) {
			error = 'Failed to create session';
			if (import.meta.env.DEV) {
			console.error('Create session error:', err);
		}
		} finally {
			isCreating = false;
		}
	}
	
	// Delete session
	async function handleDeleteSession(slug: string) {
		if (!confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
			return;
		}
		
		isDeletingSession = slug;
		try {
			await deleteSession({ slug, presenterId: presenterId! });
			
			// Update global state by removing the session
			const updatedSessions = await getDashboardSessions({ presenterId: presenterId! });
			setSessions(updatedSessions);
		} catch (err) {
			if (import.meta.env.DEV) {
			console.error('Failed to delete session:', err);
		}
			alert('Failed to delete session');
		} finally {
			isDeletingSession = null;
		}
	}
	
	// Copy participant join link
	function copyParticipantLink(slug: string) {
		const link = `${window.location.origin}/dashboard/${slug}/join`;
		navigator.clipboard.writeText(link);
		// Could add a toast notification here
	}
	
	// Navigate to session dashboard
	function openSession(slug: string) {
		goto(`/dashboard/${slug}`);
	}
	
	// Logout
	async function handleLogout() {
		try {
			await logout({});
			goto('/');
		} catch (err) {
			if (import.meta.env.DEV) {
			console.error('Logout failed:', err);
		}
		}
	}
	
	// Format date
	function formatDate(date: Date | string): string {
		const d = typeof date === 'string' ? new Date(date) : date;
		return d.toLocaleDateString('en-US', { 
			month: 'short', 
			day: 'numeric', 
			hour: '2-digit', 
			minute: '2-digit' 
		});
	}
	
	// Allow Enter key to create session
	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !isCreating) {
			handleCreateSession();
		}
	}
	
	// Authentication is handled by hooks.ts, no need for client-side redirect
</script>

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
							onclick={() => { showCreateForm = false; sessionName = ''; error = ''; }}
							class="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
						>
							Cancel
						</button>
					</div>
					{#if error}
						<p class="text-red-500 text-sm">{error}</p>
					{/if}
				</div>
			{/if}
		</div>
		
		<!-- Sessions Grid/List -->
		{#if isLoading}
			<div class="bg-white rounded-lg shadow-lg p-12 text-center">
				<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto"></div>
				<p class="mt-4 text-gray-600">Loading sessions...</p>
			</div>
		{:else if state.sessions.length === 0}
			<div class="bg-white rounded-lg shadow-lg p-12 text-center">
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
		{:else}
			<div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
				{#snippet sessionCard(session: typeof state.sessions[0])}
					<div class="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
						<!-- Card Header with Status -->
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
										<span class="relative flex h-3 w-3">
											<span class="relative inline-flex rounded-full h-3 w-3 bg-gray-400"></span>
										</span>
										<span class="text-xs font-medium text-gray-500">Inactive</span>
									{/if}
								</div>
							</div>
							
							<!-- Session Code -->
							<div class="mb-4">
								<span class="text-sm text-gray-500">Session Code:</span>
								<span class="ml-2 font-mono text-lg text-gray-700">{session.code}</span>
							</div>
							
							<!-- Stats -->
							<div class="grid grid-cols-2 gap-4">
								<div class="text-center p-2 bg-gray-50 rounded">
									<div class="text-2xl font-bold text-gray-700">
										{session.activeCount || 0}
									</div>
									<div class="text-xs text-gray-500">Active</div>
								</div>
								<div class="text-center p-2 bg-green-50 rounded">
									<div class="text-2xl font-bold text-green-600">
										{session.completedCount || 0}
									</div>
									<div class="text-xs text-gray-500">Completed</div>
								</div>
							</div>
							
							<!-- Created Date -->
							<div class="mt-4 text-sm text-gray-500">
								Created: {formatDate(session.createdAt)}
							</div>
						</div>
						
						<!-- Card Actions -->
						<div class="p-4 bg-gray-50">
							<div class="grid grid-cols-3 gap-2">
								<button
									onclick={() => openSession(session.slug)}
									class="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition text-sm font-medium"
								>
									Open
								</button>
								<button
									onclick={() => copyParticipantLink(session.slug)}
									class="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition text-sm font-medium"
									title="Copy participant link"
								>
									Copy Link
								</button>
								<button
									onclick={() => handleDeleteSession(session.slug)}
									disabled={isDeletingSession === session.slug}
									class="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{isDeletingSession === session.slug ? '...' : 'Delete'}
								</button>
							</div>
						</div>
					</div>
				{/snippet}
				
				{#each state.sessions as session}
					{@render sessionCard(session)}
				{/each}
			</div>
		{/if}
		
		<!-- Footer Stats -->
		{#if state.sessions.length > 0}
			<div class="mt-12 bg-white rounded-lg shadow-lg p-6">
				<div class="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
					<div>
						<div class="text-3xl font-bold text-gray-700">
							{state.sessions.length}
						</div>
						<div class="text-sm text-gray-500">Total Sessions</div>
					</div>
					<div>
						<div class="text-3xl font-bold text-green-600">
							{state.sessions.filter(s => s.isActive).length}
						</div>
						<div class="text-sm text-gray-500">Active Sessions</div>
					</div>
					<div>
						<div class="text-3xl font-bold text-gray-700">
							{state.sessions.reduce((sum, s) => sum + ((s.activeCount || 0) + (s.completedCount || 0)), 0)}
						</div>
						<div class="text-sm text-gray-500">Total Participants</div>
					</div>
					<div>
						<div class="text-3xl font-bold text-gray-700">
							{state.sessions.reduce((sum, s) => sum + (s.completedCount || 0), 0)}
						</div>
						<div class="text-sm text-gray-500">Completed Surveys</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	/* Ensure animated gradient is defined in global CSS */
	.animated-gradient {
		background: linear-gradient(-45deg, #f3f4f6, #e5e7eb, #d1d5db, #9ca3af);
		background-size: 400% 400%;
		animation: gradient 15s ease infinite;
	}
	
	@keyframes gradient {
		0% {
			background-position: 0% 50%;
		}
		50% {
			background-position: 100% 50%;
		}
		100% {
			background-position: 0% 50%;
		}
	}
</style>