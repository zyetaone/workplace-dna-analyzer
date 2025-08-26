<script lang="ts">
	import { sessionStore, analyticsStore } from '$lib/stores';
	import { onMount } from 'svelte';
	
	let sessionId = '8ff9174e-3c53-4fb5-a7dd-8c45d4bbaa3c';
	let loading = $state(false);
	let error = $state<string | null>(null);
	
	// Reactive values from stores
	let currentSession = $derived(sessionStore.currentSession);
	let currentAttendees = $derived(sessionStore.currentAttendees);
	let completedAttendees = $derived(sessionStore.completedAttendees);
	let activeCount = $derived(analyticsStore.activeCount);
	let completedCount = $derived(analyticsStore.completedCount);
	let preferenceScores = $derived(analyticsStore.preferenceScores);
	
	async function loadSession() {
		loading = true;
		error = null;
		
		console.log('=== TEST: Loading session ===');
		console.log('Setting current session ID:', sessionId);
		
		try {
			// Set the current session
			sessionStore.setCurrentSession(sessionId);
			
			// Wait for load
			await sessionStore.loadSession(sessionId);
			
			console.log('=== TEST: Load complete ===');
			console.log('Current session:', sessionStore.currentSession);
			console.log('Current attendees:', sessionStore.currentAttendees);
			console.log('Completed attendees:', sessionStore.completedAttendees);
			
		} catch (e) {
			error = e.message;
			console.error('Load failed:', e);
		} finally {
			loading = false;
		}
	}
	
	async function refreshSession() {
		loading = true;
		error = null;
		
		console.log('=== TEST: Refreshing session ===');
		
		try {
			await sessionStore.refreshSession(sessionId);
			
			console.log('=== TEST: Refresh complete ===');
			console.log('Current session:', sessionStore.currentSession);
			console.log('Current attendees:', sessionStore.currentAttendees);
			console.log('Analytics active:', analyticsStore.activeCount);
			console.log('Analytics completed:', analyticsStore.completedCount);
			
		} catch (e) {
			error = e.message;
			console.error('Refresh failed:', e);
		} finally {
			loading = false;
		}
	}
	
	onMount(() => {
		console.log('Test page mounted, loading session...');
		loadSession();
	});
</script>

<div class="p-8">
	<h1 class="text-2xl font-bold mb-4">Store Test Page</h1>
	
	<div class="mb-4">
		<p class="font-semibold">Session ID: {sessionId}</p>
		<p>Loading: {loading}</p>
		{#if error}
			<p class="text-red-600">Error: {error}</p>
		{/if}
	</div>
	
	<div class="grid grid-cols-2 gap-4 mb-4">
		<button 
			onclick={loadSession}
			disabled={loading}
			class="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
		>
			Load Session
		</button>
		<button 
			onclick={refreshSession}
			disabled={loading}
			class="px-4 py-2 bg-green-500 text-white rounded disabled:opacity-50"
		>
			Refresh Session
		</button>
	</div>
	
	<div class="space-y-4">
		<div class="p-4 border rounded">
			<h2 class="font-semibold mb-2">Session Store State:</h2>
			<pre class="text-xs bg-gray-100 p-2 rounded overflow-auto">
Current Session: {JSON.stringify(currentSession, null, 2)}
Current Attendees: {currentAttendees.length}
Completed Attendees: {completedAttendees.length}
			</pre>
		</div>
		
		<div class="p-4 border rounded">
			<h2 class="font-semibold mb-2">Analytics Store State:</h2>
			<pre class="text-xs bg-gray-100 p-2 rounded overflow-auto">
Active Count: {activeCount}
Completed Count: {completedCount}
Preference Scores: {JSON.stringify(preferenceScores, null, 2)}
			</pre>
		</div>
		
		<div class="p-4 border rounded">
			<h2 class="font-semibold mb-2">Attendees Detail:</h2>
			{#each currentAttendees as attendee}
				<div class="mb-2 p-2 bg-gray-50 rounded">
					<p class="font-medium">{attendee.name}</p>
					<p class="text-sm">Completed: {attendee.completed}</p>
					<p class="text-sm">Scores: {JSON.stringify(attendee.preferenceScores)}</p>
				</div>
			{/each}
		</div>
	</div>
</div>