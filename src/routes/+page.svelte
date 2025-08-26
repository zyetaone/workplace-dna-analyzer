<script lang="ts">
	import { goto } from '$app/navigation';
	import { createSession } from './session.remote';
	
	let title = $state('');
	let isCreating = $state(false);
	let error = $state('');
	
	async function handleCreateSession() {
		if (!title.trim()) {
			error = 'Please enter a session title';
			return;
		}
		
		isCreating = true;
		error = '';
		
		try {
			const result = await createSession({
				title: title.trim(),
				presenterId: 'presenter-' + Date.now()
			});
			
			if (result.redirect) {
				goto(result.redirect);
			}
		} catch (err) {
			error = 'Failed to create session. Please try again.';
			console.error(err);
			isCreating = false;
		}
	}
	
	// Allow entering with Enter key
	function handleKeypress(e: KeyboardEvent) {
		if (e.key === 'Enter' && !isCreating) {
			handleCreateSession();
		}
	}
</script>

<div class="min-h-screen animated-gradient flex items-center justify-center px-4">
	<div class="max-w-4xl mx-auto text-center">
		<!-- Zyeta DX Branding -->
		<div class="flex items-center justify-center mb-8">
			<svg class="h-20" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 120">
				<!-- Zyeta Logo -->
				<g transform="translate(50, 10) scale(0.35)">
					<rect x="25.04" y="25.04" width="249.93" height="249.93" fill="#000"/>
					<g>
						<polygon fill="#fff" points="64.6 160.09 60.75 165.55 83.17 165.55 83.17 172.19 52.46 172.19 52.46 165.78 52.62 165.55 56.48 160.09 66.69 145.62 74.57 134.45 52.46 134.45 52.46 127.81 83.17 127.81 83.17 133.78 82.7 134.45 74.82 145.62 64.6 160.09"/>
						<polygon fill="#fff" points="205.35 127.81 205.35 134.45 192.76 134.45 192.76 172.19 186.12 172.19 186.12 134.45 173.53 134.45 173.53 127.81 205.35 127.81"/>
						<path fill="#fff" d="M244.96,165.55l-2.13-5.47-2.59-6.64-3.05-7.83-4.35-11.17-2.37-6.08-.22-.56h-6.69l-.22.56-2.37,6.08-4.35,11.17-3.05,7.83-2.59,6.64-2.13,5.47-2.59,6.64h7.12l2.59-6.64,2.13-5.47h17.6l2.13,5.47,2.59,6.64h7.12l-2.59-6.64ZM220.69,153.45l3.05-7.83,3.16-8.11,3.16,8.11,3.05,7.83h-12.42Z"/>
						<polygon fill="#fff" points="127.24 127.81 123.3 134.45 116.67 145.62 112.61 152.46 112.56 152.54 112.56 172.19 104.86 172.19 104.86 152.41 100.82 145.62 94.2 134.45 90.25 127.81 97.98 127.81 101.92 134.45 104.86 139.4 108.55 145.62 108.75 145.95 108.95 145.62 112.56 139.53 115.58 134.45 119.52 127.81 127.24 127.81"/>
						<polygon fill="#fff" points="143.6 134.45 143.6 145.62 161.45 145.62 161.45 152.25 143.6 152.25 143.6 165.55 164.23 165.55 164.23 172.19 136.96 172.19 136.96 127.81 164.23 127.81 164.23 134.45 143.6 134.45"/>
					</g>
				</g>
				<!-- Cursive DX -->
				<text x="180" y="70" font-family="'Dancing Script', cursive" font-size="56" font-weight="700" fill="#000">dx</text>
			</svg>
		</div>
		
		<h1 class="text-5xl font-bold text-gray-800 mb-4">
			Workplace Experience Platform
		</h1>
		<p class="text-xl text-gray-600 mb-8">
			Transform workplace insights with real-time engagement and analytics
		</p>
		
		<div class="bg-white rounded-lg shadow-xl p-8 max-w-md mx-auto">
			<h2 class="text-2xl font-bold text-gray-800 mb-6">Launch Experience Session</h2>
			
			<input
				type="text"
				bind:value={title}
				placeholder="Enter session title..."
				onkeypress={handleKeypress}
				disabled={isCreating}
				class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 mb-4"
			/>
			
			{#if error}
				<p class="text-red-500 text-sm mb-4">{error}</p>
			{/if}
			
			<button
				onclick={handleCreateSession}
				disabled={isCreating}
				class="w-full py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
			>
				{isCreating ? 'Creating...' : 'Create Session'}
			</button>
			
			<div class="mt-6 pt-6 border-t border-gray-200">
				<p class="text-sm text-gray-500 mb-3">
					Participants can join via QR code to share their workplace preferences
				</p>
				<a 
					href="/join" 
					class="text-gray-600 hover:text-gray-800 font-medium text-sm"
				>
					Or join an existing session →
				</a>
			</div>
		</div>
		
		<div class="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
			<div class="text-center">
				<div class="text-3xl mb-2">🏢</div>
				<h3 class="font-bold text-gray-700 mb-1">Workplace DNA</h3>
				<p class="text-sm text-gray-600">Generate cultural insights</p>
			</div>
			<div class="text-center">
				<div class="text-3xl mb-2">⚡</div>
				<h3 class="font-bold text-gray-700 mb-1">Real-time</h3>
				<p class="text-sm text-gray-600">Live engagement tracking</p>
			</div>
			<div class="text-center">
				<div class="text-3xl mb-2">📊</div>
				<h3 class="font-bold text-gray-700 mb-1">Analytics</h3>
				<p class="text-sm text-gray-600">AI-powered insights</p>
			</div>
		</div>
	</div>
</div>