<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { fetchSessionData } from '../presenter/presenter.remote';
	import { joinSession as joinSessionRemote } from '../attendee/[attendeeId]/attendee.remote';
	
	let slug = $derived(page.params.slug);
	let participantName = $state('');
	let isJoining = $state(false);
	let sessionData = $state<any>(null);
	let error = $state('');
	
	$effect(() => {
		// Verify session exists using remote function
		if (slug) {
			fetchSessionData({ slug }).then(data => {
				sessionData = data;
				if (!data) {
					error = 'Session not found';
				}
			}).catch(err => {
				console.error('Failed to load session:', err);
				error = 'Session not found';
			});
		}
	});
	
	async function joinSession(e: Event) {
		e.preventDefault();
		if (!participantName.trim() || isJoining) return;
		
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
			console.error('Failed to join:', err);
			error = 'Failed to join session. Please try again.';
		} finally {
			isJoining = false;
		}
	}
</script>

<div class="min-h-screen animated-gradient flex items-center justify-center px-4">
	<div class="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
		{#if error}
			<div class="mb-4 p-4 bg-red-100 text-red-700 rounded">
				{error}
			</div>
		{/if}
		
		{#if sessionData}
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
		{:else if !error}
			<div class="text-center">
				<p class="text-gray-600">Loading session...</p>
			</div>
		{/if}
	</div>
</div>