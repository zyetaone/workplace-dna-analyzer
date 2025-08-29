<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { getQuizState } from '../quiz.svelte.ts';
	import D3RadarChart from '$lib/components/charts/D3RadarChart.svelte';
	import { fly, fade, scale } from 'svelte/transition';
	import { quintOut, elasticOut } from 'svelte/easing';

	// Get session code from URL
	const sessionCode = page.params.code;
	const quiz = getQuizState(sessionCode);

	// Animation states
	let showContent = $state(false);
	let showScores = $state(false);
	let showDNA = $state(false);
	let showActions = $state(false);
	let celebrationComplete = $state(false);

	// Load completion results on mount
	$effect(() => {
		// Validate session code format
		if (!sessionCode || !/^[A-Z0-9]+-[0-9]{6}$/.test(sessionCode)) {
			goto('/');
			return;
		}

		// Load completion results and trigger animations
		quiz.loadCompletionResults(sessionCode).then(() => {
			setTimeout(() => (showContent = true), 300);
			setTimeout(() => (showScores = true), 800);
			setTimeout(() => (showDNA = true), 1300);
			setTimeout(() => (showActions = true), 1800);
			setTimeout(() => (celebrationComplete = true), 2500);
		});
	});

	// Prepare radar chart data - MODERNIZED to $derived
	const radarData = $derived(() => {
		if (!quiz.completionData?.scores) return null;

		return {
			data: {
				labels: ['Collaboration', 'Formality', 'Technology', 'Wellness'],
				datasets: [
					{
						data: [
							quiz.completionData.scores.collaboration,
							quiz.completionData.scores.formality,
							quiz.completionData.scores.tech,
							quiz.completionData.scores.wellness
						],
						backgroundColor: 'rgba(168, 85, 247, 0.3)',
						borderColor: 'rgba(168, 85, 247, 1)'
					}
				]
			}
		};
	});

	// Calculate overall score - MODERNIZED to $derived
	const overallScore = $derived(() => {
		if (!quiz.completionData?.scores) return 0;
		const { collaboration, formality, tech, wellness } = quiz.completionData.scores;
		return Math.round((collaboration + formality + tech + wellness) / 4);
	});

	// Share functionality
	async function shareResults() {
		const shareData = {
			title: 'My Workplace DNA Profile',
			text: `I just discovered my workplace DNA: ${quiz.completionData?.workplaceDNA}! Take the assessment and find yours.`,
			url: window.location.origin + `/${sessionCode}`
		};

		try {
			if (navigator.share && navigator.canShare(shareData)) {
				await navigator.share(shareData);
			} else {
				// Fallback to copy to clipboard
				await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
				alert('Results link copied to clipboard!');
			}
		} catch (error) {
			console.error('Error sharing:', error);
		}
	}

	// Download results as image (placeholder)
	function downloadResults() {
		// This would integrate with a canvas/image generation library
		alert('Download feature coming soon!');
	}

	// Get preference icon
	function getPreferenceIcon(category: string): string {
		const icons: Record<string, string> = {
			collaboration: '🤝',
			formality: '📋',
			tech: '💻',
			wellness: '🌱'
		};
		return icons[category] || '📊';
	}

	// Get preference color
	function getPreferenceColor(score: number): string {
		if (score >= 8) return 'from-green-500 to-emerald-500';
		if (score >= 6) return 'from-blue-500 to-cyan-500';
		if (score >= 4) return 'from-purple-500 to-pink-500';
		return 'from-orange-500 to-amber-500';
	}

	// Get encouraging message based on score
	function getEncouragingMessage(score: number): string {
		if (score >= 8) return 'Outstanding!';
		if (score >= 6) return 'Excellent!';
		if (score >= 4) return 'Great balance!';
		return 'Unique perspective!';
	}
</script>

<div
	class="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 relative overflow-hidden"
>
	<!-- Animated background elements -->
	<div class="absolute inset-0 overflow-hidden">
		<div class="floating-orbs">
			<div class="orb orb-1"></div>
			<div class="orb orb-2"></div>
			<div class="orb orb-3"></div>
			<div class="orb orb-4"></div>
		</div>

		{#if celebrationComplete}
			<div class="celebration-particles" transition:fade={{ duration: 1000 }}>
				{#each Array(20) as _, i}
					<div
						class="particle"
						style="--delay: {i * 0.1}s; --x: {Math.random() * 100}vw; --y: {Math.random() * 100}vh"
					></div>
				{/each}
			</div>
		{/if}
	</div>

	<div class="relative z-10 container mx-auto px-4 py-8">
		{#if quiz.loading}
			<div class="flex items-center justify-center min-h-screen">
				<div class="glass-card rounded-3xl p-12 max-w-md w-full">
					<div class="text-center">
						<div class="dna-loader mx-auto mb-6">
							<div class="dna-strand"></div>
							<div class="dna-strand"></div>
						</div>
						<h3
							class="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-2"
						>
							Analyzing Your Workplace DNA
						</h3>
						<p class="text-slate-400 text-sm">Preparing your personalized insights...</p>
					</div>
				</div>
			</div>
		{:else if quiz.error}
			<div class="flex items-center justify-center min-h-screen">
				<div class="glass-card rounded-3xl p-12 border-red-500/20 max-w-md w-full">
					<div class="text-center">
						<div class="text-5xl mb-4">⚠️</div>
						<h3 class="text-xl font-semibold text-red-400 mb-2">
							Unable to Load Workplace Insights
						</h3>
						<p class="text-slate-400 mb-6">{quiz.error}</p>
						<button
							onclick={() => location.reload()}
							class="px-6 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl transition-all duration-200 transform hover:scale-105"
						>
							Try Again
						</button>
					</div>
				</div>
			</div>
		{:else if quiz.completionData && showContent}
			<div class="max-w-6xl mx-auto">
				<!-- Header Section -->
				<div class="text-center mb-12" in:fly={{ y: -50, duration: 800, easing: quintOut }}>
					<div
						class="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-full mb-6"
					>
						<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
							<path
								fill-rule="evenodd"
								d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
								clip-rule="evenodd"
							/>
						</svg>
						Assessment Complete!
					</div>

					<h1 class="type-conference-hero mb-4">
						<span class="gradient-text-zyeta"> Your Workplace DNA Profile </span>
					</h1>

					<p class="text-xl text-slate-300 max-w-2xl mx-auto">
						Discover your unique workplace preferences and how they shape your professional
						environment
					</p>
				</div>

				<div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
					<!-- Left Column: Scores & DNA Profile -->
					<div class="space-y-6">
						{#if showScores}
							<!-- Overall Score Card -->
							<div
								class="glass-card rounded-2xl p-6"
								in:scale={{ duration: 600, easing: elasticOut }}
							>
								<div class="flex items-center justify-between mb-4">
									<h3 class="text-lg font-semibold text-slate-200">Overall Profile Score</h3>
									<span
										class="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r {getPreferenceColor(
											overallScore()
										)}"
									>
										{overallScore()}/10
									</span>
								</div>
								<p class="text-slate-400 text-sm">{getEncouragingMessage(overallScore())}</p>
							</div>

							<!-- Individual Preference Scores -->
							<div
								class="glass-card rounded-2xl p-6"
								in:fly={{ x: -50, duration: 800, delay: 200, easing: quintOut }}
							>
								<h3 class="text-lg font-semibold text-slate-200 mb-6">Preference Breakdown</h3>
								<div class="space-y-4">
									{#each Object.entries(quiz.completionData.scores) as [category, score], i}
										<div
											class="group"
											in:fly={{ x: -30, duration: 600, delay: 300 + i * 100, easing: quintOut }}
										>
											<div class="flex items-center justify-between mb-2">
												<div class="flex items-center gap-3">
													<span class="text-2xl">{getPreferenceIcon(category)}</span>
													<span class="text-slate-300 capitalize font-medium">{category}</span>
												</div>
												<div class="flex items-center gap-2">
													<span class="text-sm font-bold text-slate-200">{score}/10</span>
													<span class="text-xs text-slate-500">{getEncouragingMessage(score)}</span>
												</div>
											</div>
											<div class="relative">
												<div class="w-full bg-slate-800/50 rounded-full h-3 overflow-hidden">
													<div
														class="h-full rounded-full bg-gradient-to-r {getPreferenceColor(
															score
														)} transition-all duration-1000 ease-out relative overflow-hidden"
														style="width: {score * 10}%"
													>
														<div class="absolute inset-0 bg-white/20 animate-shimmer"></div>
													</div>
												</div>
											</div>
										</div>
									{/each}
								</div>
							</div>
						{/if}

						{#if showDNA}
							<!-- Workplace DNA Profile -->
							<div
								class="glass-card rounded-2xl p-6"
								in:fly={{ x: -50, duration: 800, delay: 400, easing: quintOut }}
							>
								<h3 class="text-lg font-semibold text-slate-200 mb-4">
									Your Workplace DNA Identity
								</h3>
								<div
									class="p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20"
								>
									<div class="flex items-center gap-4 mb-4">
										<div class="text-5xl animate-pulse">🧬</div>
										<div class="flex-1">
											<p
												class="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400"
											>
												{quiz.completionData.workplaceDNA}
											</p>
											<p class="text-sm text-slate-400 mt-1">Your unique workplace personality</p>
										</div>
									</div>

									<!-- DNA Insights -->
									<div class="space-y-3 mt-4 pt-4 border-t border-purple-500/20">
										<div class="flex items-start gap-2">
											<svg
												class="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0"
												fill="currentColor"
												viewBox="0 0 20 20"
											>
												<path
													fill-rule="evenodd"
													d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
													clip-rule="evenodd"
												/>
											</svg>
											<p class="text-sm text-slate-300">
												Your profile indicates a preference for {quiz.completionData.scores
													.collaboration > 5
													? 'collaborative teamwork'
													: 'independent work'}
											</p>
										</div>
										<div class="flex items-start gap-2">
											<svg
												class="w-5 h-5 text-pink-400 mt-0.5 flex-shrink-0"
												fill="currentColor"
												viewBox="0 0 20 20"
											>
												<path
													fill-rule="evenodd"
													d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
													clip-rule="evenodd"
												/>
											</svg>
											<p class="text-sm text-slate-300">
												You thrive in {quiz.completionData.scores.formality > 5
													? 'structured environments'
													: 'flexible settings'}
											</p>
										</div>
										<div class="flex items-start gap-2">
											<svg
												class="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0"
												fill="currentColor"
												viewBox="0 0 20 20"
											>
												<path
													fill-rule="evenodd"
													d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
													clip-rule="evenodd"
												/>
											</svg>
											<p class="text-sm text-slate-300">
												{quiz.completionData.scores.wellness > 5
													? 'Work-life balance is a priority'
													: 'Achievement-focused mindset'}
											</p>
										</div>
									</div>
								</div>
							</div>
						{/if}
					</div>

					<!-- Right Column: Radar Chart -->
					<div class="space-y-6">
						{#if showDNA && radarData}
							<div
								class="glass-card rounded-2xl p-6"
								in:fly={{ x: 50, duration: 800, delay: 600, easing: quintOut }}
							>
								<h3 class="text-lg font-semibold text-slate-200 mb-6">Visual DNA Map</h3>
								<div class="relative">
									<D3RadarChart data={radarData} height={400} class="w-full" />

									<!-- Overlay insights -->
									<div class="absolute bottom-4 left-4 right-4">
										<div class="glass-card rounded-lg p-3 bg-slate-900/80">
											<p class="text-xs text-slate-400 text-center">
												The larger the area, the stronger your preferences in each dimension
											</p>
										</div>
									</div>
								</div>
							</div>

							<!-- Personalized Recommendations -->
							<div
								class="glass-card rounded-2xl p-6"
								in:fly={{ x: 50, duration: 800, delay: 800, easing: quintOut }}
							>
								<h3 class="text-lg font-semibold text-slate-200 mb-4">
									Personalized Recommendations
								</h3>
								<div class="space-y-3">
									{#if quiz.completionData.scores.collaboration > 7}
										<div class="flex items-start gap-3 p-3 bg-purple-500/10 rounded-lg">
											<span class="text-purple-400">💡</span>
											<p class="text-sm text-slate-300">
												Consider open office layouts or collaborative workspaces
											</p>
										</div>
									{/if}
									{#if quiz.completionData.scores.tech > 7}
										<div class="flex items-start gap-3 p-3 bg-cyan-500/10 rounded-lg">
											<span class="text-cyan-400">💡</span>
											<p class="text-sm text-slate-300">
												Explore cutting-edge digital tools to enhance productivity
											</p>
										</div>
									{/if}
									{#if quiz.completionData.scores.wellness > 7}
										<div class="flex items-start gap-3 p-3 bg-green-500/10 rounded-lg">
											<span class="text-green-400">💡</span>
											<p class="text-sm text-slate-300">
												Prioritize ergonomic furniture and wellness amenities
											</p>
										</div>
									{/if}
									{#if quiz.completionData.scores.formality < 5}
										<div class="flex items-start gap-3 p-3 bg-pink-500/10 rounded-lg">
											<span class="text-pink-400">💡</span>
											<p class="text-sm text-slate-300">
												Flexible work policies might boost your satisfaction
											</p>
										</div>
									{/if}
								</div>
							</div>
						{/if}
					</div>
				</div>

				<!-- Action Section -->
				{#if showActions}
					<div
						class="glass-card rounded-2xl p-8"
						in:fly={{ y: 50, duration: 800, easing: quintOut }}
					>
						<div class="text-center mb-6">
							<h3 class="text-xl font-semibold text-slate-200 mb-2">What's Next?</h3>
							<p class="text-slate-400">
								Share your workplace insights or explore deeper analytics
							</p>
						</div>

						<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
							<button
								onclick={shareResults}
								class="group relative px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 overflow-hidden"
							>
								<div
									class="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"
								></div>
								<span class="relative flex items-center justify-center gap-2">
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a9.001 9.001 0 01-7.432 0m9.032-4.026A9.001 9.001 0 0112 3c-4.474 0-8.268 3.12-9.032 7.326m0 0A9.001 9.001 0 0012 21c4.474 0 8.268-3.12 9.032-7.326"
										></path>
									</svg>
									Share Insights
								</span>
							</button>

							<button
								onclick={() => goto(`/admin/${sessionCode}`)}
								class="group relative px-6 py-4 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 border border-slate-600 hover:border-purple-500 rounded-xl transition-all duration-300 transform hover:scale-105 overflow-hidden"
							>
								<div
									class="absolute inset-0 bg-purple-500/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"
								></div>
								<span class="relative flex items-center justify-center gap-2">
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
										></path>
									</svg>
									View Analytics Overview
								</span>
							</button>

							<button
								onclick={downloadResults}
								class="group relative px-6 py-4 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 border border-slate-600 hover:border-cyan-500 rounded-xl transition-all duration-300 transform hover:scale-105 overflow-hidden"
							>
								<div
									class="absolute inset-0 bg-cyan-500/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"
								></div>
								<span class="relative flex items-center justify-center gap-2">
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
										></path>
									</svg>
									Download
								</span>
							</button>

							<button
								onclick={() => goto(`/${sessionCode}`)}
								class="group relative px-6 py-4 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 border border-slate-600 hover:border-green-500 rounded-xl transition-all duration-300 transform hover:scale-105 overflow-hidden"
							>
								<div
									class="absolute inset-0 bg-green-500/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"
								></div>
								<span class="relative flex items-center justify-center gap-2">
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
										></path>
									</svg>
									Retake Assessment
								</span>
							</button>
						</div>

						<!-- Session Info -->
						<div class="mt-8 pt-6 border-t border-slate-700">
							<div class="flex flex-col sm:flex-row items-center justify-between gap-4">
								<div class="text-center sm:text-left">
									<p class="text-sm text-slate-500">Session</p>
									<p class="text-lg font-semibold text-slate-300">
										{quiz.completionData.session.name}
									</p>
								</div>
								<div class="text-center sm:text-right">
									<p class="text-sm text-slate-500">Team Member</p>
									<p class="text-lg font-semibold text-slate-300">
										{quiz.completionData.participant.name || 'Anonymous'}
									</p>
								</div>
							</div>
						</div>
					</div>
				{/if}
			</div>
		{:else}
			<div class="flex items-center justify-center min-h-screen">
				<div class="glass-card rounded-3xl p-12">
					<div class="text-center">
						<div class="w-16 h-16 mx-auto mb-4">
							<div
								class="w-full h-full rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin"
							></div>
						</div>
						<p class="text-lg text-slate-300">Loading your workplace insights...</p>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	/* Glass card effect */
	.glass-card {
		background: rgba(255, 255, 255, 0.03);
		backdrop-filter: blur(20px);
		border: 1px solid rgba(255, 255, 255, 0.08);
		box-shadow:
			0 20px 60px rgba(0, 0, 0, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.1);
	}

	/* Floating orbs animation */
	.floating-orbs {
		position: absolute;
		width: 100%;
		height: 100%;
		overflow: hidden;
	}

	.orb {
		position: absolute;
		border-radius: 50%;
		filter: blur(40px);
		opacity: 0.3;
		animation: float 20s infinite ease-in-out;
	}

	.orb-1 {
		width: 400px;
		height: 400px;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		top: -200px;
		left: -200px;
		animation-delay: 0s;
	}

	.orb-2 {
		width: 300px;
		height: 300px;
		background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
		top: 50%;
		right: -150px;
		animation-delay: 5s;
	}

	.orb-3 {
		width: 250px;
		height: 250px;
		background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
		bottom: -125px;
		left: 30%;
		animation-delay: 10s;
	}

	.orb-4 {
		width: 350px;
		height: 350px;
		background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
		top: 30%;
		left: -175px;
		animation-delay: 15s;
	}

	@keyframes float {
		0%,
		100% {
			transform: translate(0, 0) rotate(0deg);
		}
		33% {
			transform: translate(30px, -30px) rotate(120deg);
		}
		66% {
			transform: translate(-20px, 20px) rotate(240deg);
		}
	}

	/* DNA Loader Animation */
	.dna-loader {
		width: 60px;
		height: 60px;
		position: relative;
	}

	.dna-strand {
		position: absolute;
		width: 100%;
		height: 100%;
		border-radius: 50%;
		border: 3px solid transparent;
		border-top-color: #a855f7;
		border-bottom-color: #ec4899;
		animation: dna-rotate 2s linear infinite;
	}

	.dna-strand:nth-child(2) {
		animation-delay: 0.5s;
		border-top-color: #3b82f6;
		border-bottom-color: #10b981;
	}

	@keyframes dna-rotate {
		0% {
			transform: rotate(0deg) scale(1);
		}
		50% {
			transform: rotate(180deg) scale(0.8);
		}
		100% {
			transform: rotate(360deg) scale(1);
		}
	}

	/* Celebration particles */
	.celebration-particles {
		position: absolute;
		width: 100%;
		height: 100%;
		pointer-events: none;
	}

	.particle {
		position: absolute;
		width: 10px;
		height: 10px;
		background: linear-gradient(45deg, #a855f7, #ec4899, #3b82f6);
		border-radius: 50%;
		left: var(--x);
		top: var(--y);
		opacity: 0;
		animation: particle-fall 3s ease-out var(--delay) forwards;
	}

	@keyframes particle-fall {
		0% {
			transform: translateY(-100vh) rotate(0deg);
			opacity: 1;
		}
		100% {
			transform: translateY(100vh) rotate(720deg);
			opacity: 0;
		}
	}

	/* Shimmer effect */
	@keyframes shimmer {
		0% {
			transform: translateX(-100%);
		}
		100% {
			transform: translateX(200%);
		}
	}

	.animate-shimmer {
		animation: shimmer 2s infinite;
	}
</style>
