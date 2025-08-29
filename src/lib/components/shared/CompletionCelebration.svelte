<!-- Quiz Completion Celebration Component with Mobile Optimization -->
<script lang="ts">
	import { fade, fly, scale } from 'svelte/transition';
	import { elasticOut } from 'svelte/easing';
	import { spring } from 'svelte/motion';
	import confetti from 'canvas-confetti';
	import { intersectionObserver } from '$lib/utils/attachments';
	
	interface Props {
		scores: {
			collaboration: number;
			formality: number;
			tech: number;
			wellness: number;
		};
		workplaceDNA?: string;
		participantName?: string;
		sessionName?: string;
		onShare?: () => void;
		onViewResults?: () => void;
	}
	
	let {
		scores,
		workplaceDNA = 'Balanced Professional',
		participantName,
		sessionName,
		onShare,
		onViewResults
	}: Props = $props();
	
	// Animation states
	let showContent = $state(false);
	let showScores = $state(false);
	let showActions = $state(false);
	
	// Animated score values
	const animatedScores = {
		collaboration: spring(0, { stiffness: 0.05, damping: 0.9 }),
		formality: spring(0, { stiffness: 0.05, damping: 0.9 }),
		tech: spring(0, { stiffness: 0.05, damping: 0.9 }),
		wellness: spring(0, { stiffness: 0.05, damping: 0.9 })
	};
	
	// Trigger celebration sequence
	$effect(() => {
		// Initial confetti burst
		setTimeout(() => {
			confetti({
				particleCount: 100,
				spread: 70,
				origin: { y: 0.6 },
				colors: ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b']
			});
			
			// Haptic feedback
			if ('vibrate' in navigator) {
				navigator.vibrate([200, 100, 200]);
			}
		}, 300);
		
		// Show content sequence
		setTimeout(() => showContent = true, 500);
		setTimeout(() => showScores = true, 1000);
		setTimeout(() => {
			// Animate scores
			animatedScores.collaboration.set(scores.collaboration);
			animatedScores.formality.set(scores.formality);
			animatedScores.tech.set(scores.tech);
			animatedScores.wellness.set(scores.wellness);
		}, 1200);
		setTimeout(() => showActions = true, 2000);
		
		// Secondary confetti
		setTimeout(() => {
			confetti({
				particleCount: 50,
				angle: 60,
				spread: 55,
				origin: { x: 0 }
			});
			confetti({
				particleCount: 50,
				angle: 120,
				spread: 55,
				origin: { x: 1 }
			});
		}, 2500);
	});
	
	// Score categories with emojis
	const scoreCategories = [
		{ key: 'collaboration', label: 'Collaboration', emoji: '🤝', color: 'from-purple-400 to-pink-400' },
		{ key: 'formality', label: 'Structure', emoji: '📊', color: 'from-blue-400 to-cyan-400' },
		{ key: 'tech', label: 'Technology', emoji: '💻', color: 'from-green-400 to-emerald-400' },
		{ key: 'wellness', label: 'Wellness', emoji: '🌱', color: 'from-amber-400 to-orange-400' }
	];
	
	// Get achievement badges
	const achievements = $derived(() => {
		const badges = [];
		if (scores.collaboration >= 80) badges.push({ emoji: '🌟', label: 'Team Player' });
		if (scores.tech >= 80) badges.push({ emoji: '🚀', label: 'Tech Savvy' });
		if (scores.wellness >= 80) badges.push({ emoji: '🧘', label: 'Wellness Champion' });
		if (scores.formality >= 80) badges.push({ emoji: '🎯', label: 'Process Master' });
		
		// Special badges
		const total = Object.values(scores).reduce((a, b) => a + b, 0) / 4;
		if (total >= 75) badges.push({ emoji: '🏆', label: 'High Achiever' });
		
		return badges;
	});
	
	// Share functionality
	async function handleShare() {
		const shareText = `I just completed the Workplace Preferences Quiz! My workplace DNA is: ${workplaceDNA}. 🎉`;
		
		if (navigator.share) {
			try {
				await navigator.share({
					title: 'My Workplace DNA',
					text: shareText,
					url: window.location.href
				});
			} catch (err) {
				// User cancelled or error
			}
		} else {
			// Fallback to clipboard
			await navigator.clipboard.writeText(shareText);
			// Show toast notification
		}
		
		onShare?.();
	}
</script>

<div class="celebration-container">
	<!-- Animated Background -->
	<div class="celebration-bg">
		<div class="gradient-orb orb-1"></div>
		<div class="gradient-orb orb-2"></div>
		<div class="gradient-orb orb-3"></div>
	</div>
	
	{#if showContent}
		<div 
			class="celebration-content"
			in:scale={{ duration: 800, easing: elasticOut }}
		>
			<!-- Success Icon -->
			<div class="success-icon" in:scale={{ delay: 200, duration: 600 }}>
				<svg class="w-24 h-24 text-green-500" fill="currentColor" viewBox="0 0 20 20">
					<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
				</svg>
			</div>
			
			<!-- Congratulations Message -->
			<div class="text-center space-y-2" in:fly={{ y: 20, delay: 400, duration: 500 }}>
				<h1 class="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
					Congratulations{participantName ? `, ${participantName}` : ''}!
				</h1>
				<p class="text-lg text-gray-600 dark:text-gray-300">
					You've completed the {sessionName || 'Workplace Preferences'} quiz!
				</p>
			</div>
			
			<!-- Workplace DNA Badge -->
			<div 
				class="dna-badge"
				in:scale={{ delay: 600, duration: 500 }}
				{@attach intersectionObserver((entry) => {
					if (entry.isIntersecting) {
						entry.target.classList.add('shimmer');
					}
				})}
			>
				<span class="text-sm font-semibold text-purple-600 dark:text-purple-400">
					Your Workplace DNA
				</span>
				<span class="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100">
					{workplaceDNA}
				</span>
			</div>
			
			<!-- Achievement Badges -->
			{#if achievements().length > 0}
				<div class="achievements" in:fly={{ y: 20, delay: 800, duration: 500 }}>
					<p class="text-sm text-gray-600 dark:text-gray-400 mb-2">Achievements Unlocked:</p>
					<div class="flex flex-wrap gap-2 justify-center">
						{#each achievements() as badge}
							<div class="achievement-badge" in:scale={{ duration: 300 }}>
								<span class="text-2xl">{badge.emoji}</span>
								<span class="text-xs">{badge.label}</span>
							</div>
						{/each}
					</div>
				</div>
			{/if}
			
			<!-- Score Breakdown -->
			{#if showScores}
				<div class="scores-grid" in:fly={{ y: 20, delay: 100, duration: 500 }}>
					{#each scoreCategories as category}
						{@const score = $animatedScores[category.key]}
						<div class="score-card">
							<div class="score-header">
								<span class="score-emoji">{category.emoji}</span>
								<span class="score-label">{category.label}</span>
							</div>
							<div class="score-value-container">
								<div class="score-value bg-gradient-to-r {category.color} bg-clip-text text-transparent">
									{Math.round(score)}%
								</div>
								<div class="score-bar">
									<div 
										class="score-fill bg-gradient-to-r {category.color}"
										style="width: {score}%"
									>
										<div class="score-shimmer"></div>
									</div>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
			
			<!-- Action Buttons -->
			{#if showActions}
				<div class="action-buttons" in:fly={{ y: 20, duration: 500 }}>
					{#if onViewResults}
						<button
							onclick={onViewResults}
							class="btn-primary"
						>
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
							</svg>
							View Full Results
						</button>
					{/if}
					
					<button
						onclick={handleShare}
						class="btn-secondary"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a3 3 0 10-4.056-4.056m4.056 4.056a3 3 0 00-4.056-4.056M8 12a3 3 0 11-6 0 3 3 0 016 0zm8 0a3 3 0 11-6 0 3 3 0 016 0z" />
						</svg>
						Share Results
					</button>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.celebration-container {
		@apply relative min-h-screen flex items-center justify-center p-4;
		@apply bg-gradient-to-br from-purple-50 to-blue-50;
		@apply dark:from-gray-900 dark:to-purple-900;
	}
	
	.celebration-bg {
		@apply absolute inset-0 overflow-hidden pointer-events-none;
	}
	
	.gradient-orb {
		@apply absolute rounded-full filter blur-3xl opacity-30;
		animation: float 20s infinite ease-in-out;
	}
	
	.orb-1 {
		@apply w-96 h-96 bg-purple-400;
		top: -10%;
		left: -10%;
		animation-delay: 0s;
	}
	
	.orb-2 {
		@apply w-80 h-80 bg-blue-400;
		bottom: -10%;
		right: -10%;
		animation-delay: 7s;
	}
	
	.orb-3 {
		@apply w-72 h-72 bg-pink-400;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		animation-delay: 14s;
	}
	
	.celebration-content {
		@apply relative z-10 max-w-2xl w-full space-y-6;
		@apply bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg;
		@apply rounded-2xl shadow-2xl p-8 md:p-12;
	}
	
	.success-icon {
		@apply flex justify-center;
		animation: bounce 1s ease-out;
	}
	
	.dna-badge {
		@apply relative mx-auto w-fit px-6 py-4 rounded-xl;
		@apply bg-gradient-to-r from-purple-100 to-blue-100;
		@apply dark:from-purple-900/30 dark:to-blue-900/30;
		@apply border-2 border-purple-300 dark:border-purple-700;
		@apply flex flex-col items-center gap-1;
		@apply overflow-hidden;
	}
	
	.dna-badge.shimmer::after {
		content: '';
		@apply absolute inset-0;
		background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
		animation: shimmer 2s;
	}
	
	.achievements {
		@apply text-center;
	}
	
	.achievement-badge {
		@apply inline-flex items-center gap-1 px-3 py-1.5;
		@apply bg-gradient-to-r from-amber-100 to-orange-100;
		@apply dark:from-amber-900/30 dark:to-orange-900/30;
		@apply rounded-full border border-amber-300 dark:border-amber-700;
	}
	
	.scores-grid {
		@apply grid grid-cols-2 md:grid-cols-4 gap-4;
	}
	
	.score-card {
		@apply bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-2;
	}
	
	.score-header {
		@apply flex items-center gap-2;
	}
	
	.score-emoji {
		@apply text-2xl;
	}
	
	.score-label {
		@apply text-xs font-medium text-gray-600 dark:text-gray-400;
	}
	
	.score-value {
		@apply text-2xl font-bold;
	}
	
	.score-bar {
		@apply h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden;
	}
	
	.score-fill {
		@apply h-full relative transition-all duration-1000 ease-out rounded-full;
	}
	
	.score-shimmer {
		@apply absolute inset-0;
		background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
		animation: shimmer 2s;
	}
	
	.action-buttons {
		@apply flex flex-col sm:flex-row gap-3 justify-center;
	}
	
	.btn-primary {
		@apply flex items-center justify-center gap-2 px-6 py-3;
		@apply bg-gradient-to-r from-purple-600 to-blue-600;
		@apply hover:from-purple-700 hover:to-blue-700;
		@apply text-white font-semibold rounded-xl;
		@apply transition-all duration-300 transform hover:scale-105;
		@apply focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2;
	}
	
	.btn-secondary {
		@apply flex items-center justify-center gap-2 px-6 py-3;
		@apply bg-white dark:bg-gray-800 border-2 border-purple-300 dark:border-purple-700;
		@apply text-purple-600 dark:text-purple-400 font-semibold rounded-xl;
		@apply transition-all duration-300 transform hover:scale-105;
		@apply hover:bg-purple-50 dark:hover:bg-purple-900/20;
		@apply focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2;
	}
	
	@keyframes float {
		0%, 100% { transform: translate(0, 0) scale(1); }
		33% { transform: translate(30px, -30px) scale(1.1); }
		66% { transform: translate(-20px, 20px) scale(0.9); }
	}
	
	@keyframes bounce {
		0%, 100% { transform: translateY(0); }
		50% { transform: translateY(-20px); }
	}
	
	@keyframes shimmer {
		0% { transform: translateX(-100%); }
		100% { transform: translateX(100%); }
	}
	
	/* Mobile optimizations */
	@media (max-width: 640px) {
		.celebration-content {
			@apply p-6;
		}
		
		.scores-grid {
			@apply grid-cols-2 gap-3;
		}
		
		.score-card {
			@apply p-3;
		}
	}
	
	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.gradient-orb,
		.success-icon,
		.score-shimmer {
			animation: none !important;
		}
	}
</style>