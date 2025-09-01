<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { appState } from '$lib/state/app.svelte';

	// Get session code from URL
	const sessionCode = page.params.code;
	const quiz = appState.getQuizState(sessionCode);

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
	class="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 px-4"
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
				<div class="mx-auto mb-4 h-16 w-16">
					<div
						class="h-full w-full animate-spin rounded-full border-4 border-purple-500/20 border-t-purple-500"
					></div>
				</div>
				<h3 class="mb-2 text-lg font-semibold text-slate-200">
					Preparing your workplace DNA analysis...
				</h3>
				<p class="text-slate-400">Loading your results...</p>
			</div>
		</div>
	{:else if quiz.error}
		<div class="glass-card rounded-3xl border-red-500/20 p-12">
			<div class="text-center">
				<div class="mb-4 text-4xl">⚠️</div>
				<h3 class="mb-2 text-lg font-semibold text-red-400">Unable to Load Results</h3>
				<p class="mb-4 text-slate-400">{quiz.error}</p>
				<button
					onclick={() => location.reload()}
					class="rounded-lg bg-red-500/20 px-4 py-2 text-red-400 transition-colors duration-200 hover:bg-red-500/30"
				>
					Try Again
				</button>
			</div>
		</div>
	{:else if quiz.completionData}
		<div class="w-full max-w-4xl">
			<div class="mb-8 text-center">
				<h1 class="gradient-text mb-4 text-4xl font-bold">Your Workplace DNA Results</h1>
				<p class="text-xl text-slate-300">Discover your workplace preferences and insights</p>
			</div>

			<div class="glass-card rounded-3xl p-8">
				<div class="mb-8 grid grid-cols-1 gap-8 md:grid-cols-2">
					<!-- Preference Scores -->
					<div class="space-y-4">
						<h3 class="mb-4 text-xl font-semibold text-slate-200">Your Preferences</h3>
						{#each Object.entries(quiz.completionData.scores) as [category, score]}
							<div class="flex items-center justify-between rounded-xl bg-slate-800/30 p-4">
								<span class="capitalize text-slate-300">{category}</span>
								<div class="flex items-center gap-3">
									<div class="h-2 w-24 rounded-full bg-slate-700">
										<div
											class="h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-1000"
											style="width: {score}%"
										></div>
									</div>
									<span class="w-8 text-sm font-semibold text-slate-200">{score}</span>
								</div>
							</div>
						{/each}
					</div>

					<!-- Workplace DNA -->
					<div class="space-y-4">
						<h3 class="mb-4 text-xl font-semibold text-slate-200">Your Workplace DNA</h3>
						<div
							class="rounded-xl border border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-6"
						>
							<div class="text-center">
								<div class="mb-4 text-6xl">🧬</div>
								<h4 class="mb-2 text-lg font-semibold text-slate-200">Workplace Profile</h4>
								<p class="text-sm text-slate-400">
									Your unique combination of workplace preferences creates your personal workplace
									DNA.
								</p>
							</div>
						</div>
					</div>
				</div>

				<!-- Action Buttons -->
				<div class="flex flex-col justify-center gap-4 sm:flex-row">
					<button
						onclick={() => goto(`/admin/${sessionCode}`)}
						class="transform rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3 font-semibold text-white transition-all duration-300 hover:scale-105 hover:from-purple-600 hover:to-pink-600"
					>
						View Session Insights 📊
					</button>
					<button
						onclick={() => goto(`/${sessionCode}`)}
						class="rounded-xl border border-slate-600 bg-slate-800/50 px-6 py-3 text-slate-300 transition-all duration-300 hover:border-slate-500 hover:bg-slate-700/50"
					>
						Take Quiz Again 🔄
					</button>
				</div>
			</div>
		</div>
	{:else}
		<div class="glass-card rounded-3xl p-12">
			<div class="text-center">
				<div class="mx-auto mb-4 h-16 w-16">
					<div
						class="h-full w-full animate-spin rounded-full border-4 border-purple-500/20 border-t-purple-500"
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
