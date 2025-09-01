<script lang="ts">
	// Simple activity container following quiz component pattern
	interface Props {
		activity: {
			id: string;
			name: string;
			type: string;
			config: any;
		};
		participantId: string;
		sessionCode: string;
		onComplete?: (result: any) => void;
	}

	let { activity, participantId, sessionCode, onComplete }: Props = $props();

	// Simple state management
	let isLoading = $state(false);
	let result = $state<any>(null);
	let isCompleted = $state(false);
</script>

<div class="activity-container">
	<!-- Activity Header -->
	<div class="mb-6">
		<h2 class="text-2xl font-bold text-gray-900">{activity.name}</h2>
		<p class="mt-2 text-gray-600">{activity.config?.description || ''}</p>
	</div>

	<!-- Activity Content - Dynamic based on type -->
	<div class="activity-content">
		{#if activity.type === 'reflection'}
			<!-- Simple reflection activity -->
			<div class="space-y-4">
				<h3 class="text-lg font-semibold">Reflect on your workplace preferences</h3>
				<textarea
					class="w-full rounded-lg border p-4"
					rows="6"
					placeholder="Share your thoughts..."
					disabled={isCompleted}
				></textarea>
			</div>
		{:else if activity.type === 'survey'}
			<!-- Simple survey activity -->
			<div class="space-y-4">
				<h3 class="text-lg font-semibold">Quick Survey</h3>
				<div class="space-y-3">
					<div class="flex items-center space-x-3">
						<input type="radio" name="survey" value="agree" disabled={isCompleted} />
						<label>Strongly Agree</label>
					</div>
					<div class="flex items-center space-x-3">
						<input type="radio" name="survey" value="neutral" disabled={isCompleted} />
						<label>Neutral</label>
					</div>
					<div class="flex items-center space-x-3">
						<input type="radio" name="survey" value="disagree" disabled={isCompleted} />
						<label>Strongly Disagree</label>
					</div>
				</div>
			</div>
		{:else}
			<!-- Default activity content -->
			<div class="py-8 text-center">
				<p class="text-gray-500">Activity type: {activity.type}</p>
			</div>
		{/if}
	</div>

	<!-- Activity Actions -->
	<div class="mt-6 flex justify-between">
		<button class="rounded-lg border px-4 py-2 text-gray-600 hover:bg-gray-50" disabled={isLoading}>
			Skip
		</button>

		{#if !isCompleted}
			<button
				class="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
				disabled={isLoading}
				onclick={() => {
					isLoading = true;
					// Simulate completion
					setTimeout(() => {
						isCompleted = true;
						result = { completed: true, timestamp: new Date() };
						isLoading = false;
						onComplete?.(result);
					}, 1000);
				}}
			>
				{#if isLoading}
					<span class="animate-spin">⏳</span> Completing...
				{:else}
					Complete Activity
				{/if}
			</button>
		{:else}
			<div class="rounded-lg bg-green-600 px-6 py-2 text-white">✅ Completed</div>
		{/if}
	</div>
</div>

<style>
	.activity-container {
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem;
	}
</style>
