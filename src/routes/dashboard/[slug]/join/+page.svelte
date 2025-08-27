<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import { getSessionSummary } from '../../dashboard.remote';
	import { joinSession as joinSessionRemote } from '../participant.remote.js';
	
	let participantName = $state('');
	let isJoining = $state(false);
	let isLoading = $state(true);
	import type { Session } from '$lib/server/db/schema';
	
	let sessionData = $state<Session | null>(null);
	let error = $state('');
	
	// Load session data on mount
	onMount(async () => {
		const pageData = get(page);
		const slug = pageData.params.slug;
		if (!slug || slug.trim() === '') return;
		
		try {
			sessionData = await getSessionSummary(slug);
		} catch (err) {
			error = 'Session not found or has ended';
			if (import.meta.env.DEV) {
				console.error('Failed to load session:', err);
			}
		} finally {
			isLoading = false;
		}
	});
	
	async function joinSession(e: Event) {
		e.preventDefault();
		if (!participantName.trim() || isJoining || !sessionData) return;
		
		isJoining = true;
		error = '';
		
		try {
			const result = await joinSessionRemote({
				sessionCode: sessionData.code,
				name: participantName.trim()
			});
			
			if (result.redirect) {
				goto(result.redirect);
			}
		} catch (err) {
			if (import.meta.env.DEV) {
				console.error('Failed to join:', err);
			}
			error = 'Failed to join session. Please try again.';
		} finally {
			isJoining = false;
		}
	}
</script>

<div class="min-h-screen animated-gradient flex items-center justify-center px-4">
	<div class="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
		{#if isLoading}
			<div class="text-center">
				<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto"></div>
				<p class="mt-4 text-gray-600">Loading session...</p>
			</div>
		{:else if error && !sessionData}
			<div class="text-center">
				<h2 class="text-xl text-gray-700 mb-4">Unable to Join</h2>
				<p class="text-red-600">{error}</p>
			</div>
		{:else if sessionData}
			{#if error}
				<div class="mb-4 p-4 bg-red-100 text-red-700 rounded">
					{error}
				</div>
			{/if}
			
			<h1 class="text-3xl font-bold text-gray-800 mb-2">Join Session</h1>
			<p class="text-gray-600 mb-6">Session: {sessionData.name}</p>
		
		<form onsubmit={joinSession}>
			<div class="mb-6">
				<label for="name" class="block text-sm font-medium text-gray-700 mb-2">
					Your Name
				</label>
				<input
					type="text"
					id="name"
					bind:value={participantName}
					class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
					placeholder="Enter your name"
					required
					disabled={isJoining}
				/>
			</div>
			
			<button
				type="submit"
				disabled={isJoining || !participantName.trim()}
				class="w-full py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{isJoining ? 'Joining...' : 'Join Session'}
			</button>
		</form>
		{/if}
	</div>
</div>