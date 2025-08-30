<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { getQuizState } from '../quiz.svelte.ts';

	// Get session code from URL
	const sessionCode = page.params.code;
	const quiz = getQuizState(sessionCode);

	// Load completion results on mount
	$effect(() => {
		// Validate session code format
		if (!sessionCode || !/^[A-Z0-9]+-[0-9]{6}$/.test(sessionCode)) {
			goto('/');
			return;
		}

		// Load completion results
		quiz.loadCompletionResults(sessionCode);
	});
</script>

<!-- Use the main route's completion screen logic -->
<div
	class="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center px-4"
>
	<!-- Animated background orbs -->
	<div class="floating-orbs">
		<div class="orb orb-1"></div>
		<div class="orb orb-2"></div>
		<div class="orb orb-3"></div>
		<div class="orb orb-4"></div>
	</div>

	{#if quiz.loading}
		<div class="glass-card rounded-3xl p-12">
			<div class="text-center">
				<div class="w-16 h-16 mx-auto mb-4">
					<div
						class="w-full h-full rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin"
					></div>
				</div>
				<h3 class="text-lg font-semibold text-slate-200 mb-2">
					Preparing your workplace DNA analysis...
				</h3>
				<p class="text-slate-400">Loading your results...</p>
			</div>
		</div>
	{:else if quiz.error}
		<div class="glass-card rounded-3xl p-12 border-red-500/20">
			<div class="text-center">
				<div class="text-4xl mb-4">⚠️</div>
				<h3 class="text-lg font-semibold text-red-400 mb-2">Unable to Load Results</h3>
				<p class="text-slate-400 mb-4">{quiz.error}</p>
				<button
					onclick={() => location.reload()}
					class="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors duration-200"
				>
					Try Again
				</button>
			</div>
		</div>
	{:else if quiz.completionData}
		<div class="max-w-4xl w-full">
			<div class="text-center mb-8">
				<h1 class="text-4xl font-bold gradient-text mb-4">Your Workplace DNA Results</h1>
				<p class="text-xl text-slate-300">Discover your workplace preferences and insights</p>
			</div>

			<div class="glass-card rounded-3xl p-8">
				<div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
					<!-- Preference Scores -->
					<div class="space-y-4">
						<h3 class="text-xl font-semibold text-slate-200 mb-4">Your Preferences</h3>
						{#each Object.entries(quiz.completionData.scores) as [category, score]}
							<div class="flex items-center justify-between p-4 bg-slate-800/30 rounded-xl">
								<span class="text-slate-300 capitalize">{category}</span>
								<div class="flex items-center gap-3">
									<div class="w-24 bg-slate-700 rounded-full h-2">
										<div
											class="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-1000"
											style="width: {score}%"
										></div>
									</div>
									<span class="text-sm font-semibold text-slate-200 w-8">{score}</span>
								</div>
							</div>
						{/each}
					</div>

					<!-- Workplace DNA -->
					<div class="space-y-4">
						<h3 class="text-xl font-semibold text-slate-200 mb-4">Your Workplace DNA</h3>
						<div
							class="p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20"
						>
							<div class="text-center">
								<div class="text-6xl mb-4">🧬</div>
								<h4 class="text-lg font-semibold text-slate-200 mb-2">Workplace Profile</h4>
								<p class="text-slate-400 text-sm">
									Your unique combination of workplace preferences creates your personal workplace
									DNA.
								</p>
							</div>
						</div>
					</div>
				</div>

				<!-- Action Buttons -->
				<div class="flex flex-col sm:flex-row gap-4 justify-center">
					<button
						onclick={() => goto(`/admin/${sessionCode}`)}
						class="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105"
					>
						View Session Insights 📊
					</button>
					<button
						onclick={() => goto(`/${sessionCode}`)}
						class="px-6 py-3 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 border border-slate-600 rounded-xl transition-all duration-300 hover:border-slate-500"
					>
						Take Quiz Again 🔄
					</button>
				</div>
			</div>
		</div>
	{:else}
		<div class="glass-card rounded-3xl p-12">
			<div class="text-center">
				<div class="w-16 h-16 mx-auto mb-4">
					<div
						class="w-full h-full rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin"
					></div>
				</div>
				<p class="text-lg text-slate-300">Loading your results...</p>
			</div>
		</div>
	{/if}
</div>

<style>
	.glass-card {
		background: rgba(255, 255, 255, 0.05);
		backdrop-filter: blur(20px);
		border: 1px solid rgba(255, 255, 255, 0.1);
		box-shadow:
			0 20px 60px rgba(0, 0, 0, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.1);
	}
</style>
