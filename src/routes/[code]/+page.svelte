<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { navigating } from '$app/stores';
	import { handleError } from '$lib/utils/error-utils';
	import { getSessionInfo, joinSession as joinSessionRemote } from './participant.remote';
	import type { PageData } from './$types';
	
	let { data }: { data: PageData } = $props();
	
	let participantName = $state('');
	let selectedGeneration = $state('Gen Z');
	let isJoining = $state(false);
	let isLoading = $state(true);
	let isNavigating = $derived(!!$navigating);
	import type { Session } from '$lib/server/db/schema';

	let sessionData = $state<Session | null>(null);
	let error = $state('');
	
	// Load session data on mount
	$effect(() => {
		const code = page.params.code;
		if (!code?.trim()) return;

		getSessionInfo({ code })
			.then(data => {
				if (data.error) {
					error = data.error;
				} else {
					sessionData = data.session;
				}
			})
			.catch(err => {
				error = handleError(err, 'session loading');
			})
			.finally(() => {
				isLoading = false;
			});
	});
	
	async function joinSession(e: Event) {
		e.preventDefault();
		if (!participantName.trim() || isJoining || !sessionData) return;
		
		isJoining = true;
		error = '';
		
		try {
			const result = await joinSessionRemote({
				sessionCode: sessionData.code,
				name: participantName.trim(),
				generation: selectedGeneration as any
			});

			if (result.success && result.redirect) {
				goto(result.redirect);
			} else if (!result.success) {
				error = result.error || 'Failed to join session';
			}
		} catch (err) {
			error = handleError(err, 'joining session');
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
					disabled={isJoining || isNavigating}
				/>
			</div>

			<div class="mb-6">
				<label for="generation" class="block text-sm font-medium text-gray-700 mb-2">
					Your Generation
				</label>
				<select
					id="generation"
					bind:value={selectedGeneration}
					class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
					disabled={isJoining || isNavigating}
				>
					<option value="Baby Boomer">Baby Boomer (1946-1964)</option>
					<option value="Gen X">Generation X (1965-1980)</option>
					<option value="Millennial">Millennial (1981-1996)</option>
					<option value="Gen Z">Gen Z (1997-2012)</option>
				</select>
			</div>
			
			<button
				type="submit"
				disabled={isJoining || !participantName.trim() || isNavigating}
				class="w-full py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
			>
				{#if isJoining || isNavigating}
					<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
					<span>{isNavigating ? 'Navigating...' : 'Joining...'}</span>
				{:else}
					<span>Join Session</span>
				{/if}
			</button>
		</form>
		{/if}
	</div>
</div>