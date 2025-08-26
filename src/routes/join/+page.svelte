<script lang="ts">
	import { goto } from '$app/navigation';
	import { getActiveSessions } from '../session.remote';
	
	let activeSessions = $state<any[]>([]);
	let isLoading = $state(true);
	let error = $state('');
	
	// Load active sessions on mount
	$effect(() => {
		loadSessions();
		// Refresh every 5 seconds
		const interval = setInterval(loadSessions, 5000);
		return () => clearInterval(interval);
	});
	
	async function loadSessions() {
		try {
			const sessions = await getActiveSessions();
			activeSessions = sessions;
			error = '';
		} catch (err) {
			console.error('Failed to load sessions:', err);
			error = 'Failed to load sessions';
		} finally {
			isLoading = false;
		}
	}
	
	function joinSession(sessionId: string) {
		goto(`/session/${sessionId}/join`);
	}
	
	// Format time ago
	function timeAgo(dateStr: string): string {
		const date = new Date(dateStr);
		const now = new Date();
		const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
		
		if (seconds < 60) return 'just now';
		if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
		if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
		return `${Math.floor(seconds / 86400)} days ago`;
	}
</script>

<div class="min-h-screen animated-gradient py-12 px-4">
	<div class="max-w-4xl mx-auto">
		<div class="bg-white rounded-lg shadow-xl p-8 mb-6">
			<h1 class="text-3xl font-bold text-gray-800 mb-2">Active Sessions</h1>
			<p class="text-gray-600">Select a session to join</p>
		</div>
		
		{#if error}
			<div class="bg-red-100 text-red-700 rounded-lg p-4 mb-6">
				{error}
			</div>
		{/if}
		
		{#if isLoading}
			<div class="bg-white rounded-lg shadow-lg p-8 text-center">
				<div class="animate-pulse">
					<div class="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
					<div class="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
				</div>
			</div>
		{:else if activeSessions.length === 0}
			<div class="bg-white rounded-lg shadow-lg p-8 text-center">
				<div class="text-6xl mb-4">📭</div>
				<h2 class="text-xl font-semibold text-gray-800 mb-2">No Active Sessions</h2>
				<p class="text-gray-600 mb-6">There are no sessions available to join right now.</p>
				<button
					onclick={loadSessions}
					class="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
				>
					Refresh
				</button>
			</div>
		{:else}
			<div class="grid gap-4">
				{#each activeSessions as session}
					<div class="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer"
					     onclick={() => joinSession(session.id)}>
						<div class="flex justify-between items-start">
							<div class="flex-1">
								<h3 class="text-xl font-semibold text-gray-800 mb-2">
									{session.name}
								</h3>
								<div class="flex items-center gap-4 text-sm text-gray-600">
									<span class="font-mono bg-gray-100 px-2 py-1 rounded">
										Code: {session.code}
									</span>
									<span>
										{session.activeCount} participant{session.activeCount !== 1 ? 's' : ''}
									</span>
									<span>
										Started {timeAgo(session.createdAt)}
									</span>
								</div>
							</div>
							<button
								class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
							>
								Join →
							</button>
						</div>
						{#if session.activeCount > 0}
							<div class="mt-3 pt-3 border-t border-gray-100">
								<div class="flex items-center gap-2">
									<span class="text-sm text-gray-500">In Progress:</span>
									<div class="flex-1 bg-gray-200 rounded-full h-2">
										<div 
											class="bg-green-500 h-2 rounded-full transition-all"
											style="width: {(session.completedCount / session.activeCount) * 100}%"
										></div>
									</div>
									<span class="text-sm text-gray-600">
										{session.completedCount}/{session.activeCount} completed
									</span>
								</div>
							</div>
						{/if}
					</div>
				{/each}
			</div>
			
			<div class="text-center mt-6">
				<button
					onclick={loadSessions}
					class="text-gray-600 hover:text-gray-800 text-sm"
				>
					↻ Refreshing every 5 seconds
				</button>
			</div>
		{/if}
		
		<div class="mt-8 text-center">
			<a href="/" class="text-gray-600 hover:text-gray-800">
				← Back to Home
			</a>
		</div>
	</div>
</div>