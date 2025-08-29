<!-- @migration-task Error while migrating Svelte code: Expected whitespace
https://svelte.dev/e/expected_whitespace -->
<!-- @migration-task Error while migrating Svelte code: Expected whitespace
https://svelte.dev/e/expected_whitespace -->
<!--
  ASYNC DATA LOADING PATTERNS FOR SVELTEKIT
  This file demonstrates different approaches to async data loading in SvelteKit
  These patterns can be applied to any SvelteKit application for robust data handling
-->

<script lang="ts">
	// Pattern 1: Reactive Promise with $state
	let sessionPromise = $state<Promise<any> | null>(null);
	let aiInsightsPromise = $state<Promise<any> | null>(null);

	// Pattern 2: Loading states
	let isLoadingSession = $state(false);
	let isLoadingAI = $state(false);

	// Pattern 3: Error states
	let sessionError = $state<string | null>(null);
	let aiError = $state<string | null>(null);

	// Pattern 4: Data states
	let sessionData = $state<any>(null);
	let aiData = $state<any>(null);

	// Initialize data loading
	$effect(() => {
		loadSessionData();
		loadAIInsights();
	});

	// Pattern 5: Async function with proper error handling
	async function loadSessionData() {
		try {
			isLoadingSession = true;
			sessionError = null;

			// Simulate API call
			sessionPromise = new Promise((resolve) => {
				setTimeout(() => {
					resolve({
						session: { name: 'Demo Session', code: 'DEMO123' },
						participants: [
							{ id: 1, name: 'Alice' },
							{ id: 2, name: 'Bob' },
							{ id: 3, name: 'Charlie' }
						]
					});
				}, 1000);
			});

			// Also load synchronously for immediate use
			const result = await sessionPromise;
			sessionData = result;
		} catch (error) {
			sessionError = error instanceof Error ? error.message : 'Failed to load session';
		} finally {
			isLoadingSession = false;
		}
	}

	// Pattern 6: Streaming data with polling
	async function loadAIInsights() {
		try {
			isLoadingAI = true;
			aiError = null;

			// Simulate streaming AI insights
			aiInsightsPromise = new Promise((resolve) => {
				setTimeout(() => {
					resolve({
						insights: [
							{ content: 'Team engagement is high', category: 'engagement' },
							{ content: 'Consider more interactive elements', category: 'suggestion' },
							{ content: 'Response time improved by 20%', category: 'metrics' }
						]
					});
				}, 1500);
			});

			const result = await aiInsightsPromise;
			aiData = result;
		} catch (error) {
			aiError = error instanceof Error ? error.message : 'Failed to load AI insights';
		} finally {
			isLoadingAI = false;
		}
	}

	// Pattern 7: Manual refresh function
	async function refreshData() {
		await Promise.all([loadSessionData(), loadAIInsights()]);
	}

	// Pattern 11: Synchronized updates state
	let syncA = $state(1);
	let syncB = $state(2);

	// Async function that simulates delay (like API call)
	async function addWithDelay(a: number, b: number): Promise<number> {
		await new Promise((resolve) => setTimeout(resolve, 500)); // 500ms delay
		return a + b;
	}

	// Reset function for demo
	function resetSyncValues() {
		syncA = 1;
		syncB = 2;
	}
</script>

<div class="space-y-6 p-6 max-w-4xl mx-auto">
	<div class="text-center mb-8">
		<h1 class="text-4xl font-bold text-gray-900 mb-4">Async Data Loading Patterns</h1>
		<p class="text-lg text-gray-600">
			Comprehensive guide to handling asynchronous data in SvelteKit applications
		</p>
	</div>

	<!-- Pattern 8: Await blocks in templates -->
	<div class="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
		<h2 class="text-2xl font-semibold mb-4 text-blue-700">Pattern 8: Await Blocks</h2>
		<p class="text-gray-600 mb-4">
			Use await blocks in templates for declarative async data handling
		</p>

		{#await sessionPromise}
			<div class="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
				<div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
				<span class="text-blue-700">Loading session data...</span>
			</div>
		{:then data}
			<div class="space-y-2 p-4 bg-green-50 rounded-lg">
				<p><strong class="text-green-700">✅ Session:</strong> {data.session?.name}</p>
				<p>
					<strong class="text-green-700">✅ Participants:</strong>
					{data.participants?.length || 0}
				</p>
				<p><strong class="text-green-700">✅ Code:</strong> {data.session?.code}</p>
			</div>
		{:catch error}
			<div class="p-4 bg-red-50 border border-red-200 rounded-lg">
				<p class="text-red-700"><strong>❌ Error:</strong> {error.message}</p>
			</div>
		{/await}
	</div>

	<!-- Pattern 9: Streaming data display -->
	<div class="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
		<h2 class="text-2xl font-semibold mb-4 text-purple-700">Pattern 9: Streaming Data</h2>
		<p class="text-gray-600 mb-4">
			Handle streaming data with conditional rendering and animations
		</p>

		{#if aiData?.insights}
			<div class="space-y-3">
				{#each aiData.insights as insight, index}
					<div
						class="p-3 bg-purple-50 rounded-lg border-l-4 border-purple-500 animate-in fade-in duration-600 ease-out"
						style="animation-delay: {index * 200}ms"
					>
						<p class="text-sm text-purple-900">{insight.content}</p>
						{#if insight.category}
							<span class="text-xs text-purple-600 mt-1 block">#{insight.category}</span>
						{/if}
					</div>
				{/each}
			</div>
		{:else if isLoadingAI}
			<div class="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
				<div class="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
				<span class="text-purple-700">Generating AI insights...</span>
			</div>
		{:else}
			<p class="text-gray-500 p-4 bg-gray-50 rounded-lg">No AI insights available</p>
		{/if}
	</div>

	<!-- Pattern 10: Manual refresh with optimistic updates -->
	<div class="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
		<h2 class="text-2xl font-semibold mb-4 text-green-700">Pattern 10: Manual Refresh</h2>
		<p class="text-gray-600 mb-4">
			Implement manual refresh with loading states and error handling
		</p>

		<div class="flex items-center justify-between">
			<div>
				<p class="text-sm text-gray-600">
					Last updated: {new Date().toLocaleTimeString()}
				</p>
				{#if sessionData}
					<p class="text-sm font-medium text-green-700">
						{sessionData.participants?.length || 0} participants
					</p>
				{/if}
			</div>

			<button
				onclick={refreshData}
				disabled={isLoadingSession || isLoadingAI}
				class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
			>
				{#if isLoadingSession || isLoadingAI}
					<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
				{/if}
				Refresh Data
			</button>
		</div>

		{#if sessionError || aiError}
			<div class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
				<p class="text-red-700 text-sm">
					{#if sessionError}Session: {sessionError}{/if}
					{#if aiError}
						• AI: {aiError}{/if}
				</p>
			</div>
		{/if}
	</div>

	<!-- Pattern 11: Synchronized updates -->
	<div class="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
		<h2 class="text-2xl font-semibold mb-4 text-orange-700">Pattern 11: Synchronized Updates</h2>
		<p class="text-gray-600 mb-4">
			State changes won't update the UI until async work completes. Updates can overlap.
		</p>

		<div class="space-y-4">
			<div class="grid grid-cols-2 gap-4">
				<div>
					<label class="block text-sm font-medium mb-2 text-gray-700">Value A:</label>
					<input
						type="number"
						bind:value={syncA}
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
					/>
				</div>
				<div>
					<label class="block text-sm font-medium mb-2 text-gray-700">Value B:</label>
					<input
						type="number"
						bind:value={syncB}
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
					/>
				</div>
			</div>

			<div class="p-4 bg-orange-50 rounded-lg border border-orange-200">
				<p class="text-lg font-mono text-orange-900 text-center">
					{syncA} + {syncB} = {await addWithDelay(syncA, syncB)}
				</p>
				<p class="text-xs text-orange-600 mt-1 text-center">
					Result updates only when async operation completes
				</p>
			</div>

			<div class="flex items-center justify-center gap-4">
				<button
					onclick={() => syncA++}
					class="px-4 py-2 bg-orange-600 text-white rounded text-sm hover:bg-orange-700 transition-colors"
				>
					Increment A
				</button>
				<button
					onclick={() => syncB++}
					class="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
				>
					Increment B
				</button>
				<button
					onclick={resetSyncValues}
					class="px-4 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors"
				>
					Reset
				</button>
			</div>

			<div class="text-xs text-gray-500 space-y-1 bg-gray-50 p-3 rounded-lg">
				<p class="font-semibold text-gray-700">Key behaviors:</p>
				<ul class="list-disc list-inside space-y-1 text-gray-600">
					<li>UI won't update until async operation completes</li>
					<li>Fast updates can overtake slow ones</li>
					<li>Independent async operations run in parallel</li>
					<li>Use $effect.pending() to show loading states</li>
				</ul>
			</div>
		</div>
	</div>
</div>

<style>
	@keyframes fade-in {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.animate-fade-in {
		animation: fade-in 0.5s ease-out forwards;
	}
</style>
