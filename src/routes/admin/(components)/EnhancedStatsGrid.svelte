<!-- Enhanced Stats Grid with Real-time Animations -->
<script lang="ts">
	import { spring } from 'svelte/motion';
	import { fade, fly } from 'svelte/transition';
	import { tooltip, intersectionObserver } from '$lib/utils/attachments';
	import type { AdminDashboardState } from '../admin.svelte';
	
	interface Props {
		store: ReturnType<typeof getSessionStore>;
	}
	
	let { store }: Props = $props();
	
	// Animated values for smooth transitions
	const activeCount = spring(0, { stiffness: 0.05, damping: 0.9 });
	const completedCount = spring(0, { stiffness: 0.05, damping: 0.9 });
	const responseRate = spring(0, { stiffness: 0.05, damping: 0.9 });
	const avgTimeValue = spring(0, { stiffness: 0.05, damping: 0.9 });
	
	// Update animated values when store changes
	$effect(() => {
		activeCount.set(store.analytics?.activeCount || 0);
		completedCount.set(store.analytics?.completedCount || 0);
		responseRate.set(store.analytics?.responseRate || 0);
		
		// Parse average time to seconds for animation
		const timeStr = store.avgTime;
		if (timeStr && timeStr !== 'N/A') {
			const [minutes, seconds] = timeStr.split(':').map(Number);
			avgTimeValue.set(minutes * 60 + seconds);
		}
	});
	
	// Format time from seconds
	function formatTime(seconds: number): string {
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	}
	
	// Milestone celebrations
	const milestones = [10, 25, 50, 100];
	const reachedMilestone = $derived(
		milestones.find(m => 
			store.analytics?.totalCount >= m &&
			store.analytics?.totalCount - 1 < m
		)
	);
	
	// Stats configuration
	const stats = $derived([
		{
			id: 'active',
			label: 'Active Now',
			value: Math.round($activeCount),
			icon: '👥',
			color: 'from-green-400 to-blue-500',
			bgColor: 'bg-green-50 dark:bg-green-900/20',
			trend: $activeCount > 0 ? 'up' : 'stable',
			description: 'Participants currently in quiz'
		},
		{
			id: 'completed',
			label: 'Completed',
			value: Math.round($completedCount),
			icon: '✅',
			color: 'from-purple-400 to-pink-500',
			bgColor: 'bg-purple-50 dark:bg-purple-900/20',
			trend: $completedCount > 0 ? 'up' : 'stable',
			description: 'Participants who finished'
		},
		{
			id: 'response',
			label: 'Response Rate',
			value: `${Math.round($responseRate)}%`,
			icon: '📊',
			color: 'from-blue-400 to-cyan-500',
			bgColor: 'bg-blue-50 dark:bg-blue-900/20',
			trend: $responseRate > 70 ? 'up' : $responseRate > 40 ? 'stable' : 'down',
			description: 'Completion percentage'
		},
		{
			id: 'time',
			label: 'Avg. Time',
			value: $avgTimeValue > 0 ? formatTime($avgTimeValue) : 'N/A',
			icon: '⏱️',
			color: 'from-amber-400 to-orange-500',
			bgColor: 'bg-amber-50 dark:bg-amber-900/20',
			trend: 'stable',
			description: 'Average completion time'
		}
	]);
	
	// Celebration effect
	let showCelebration = $state(false);
	$effect(() => {
		if (reachedMilestone) {
			showCelebration = true;
			setTimeout(() => showCelebration = false, 3000);
		}
	});
</script>

<div class="stats-grid">
	{#if showCelebration && reachedMilestone}
		<div 
			class="milestone-celebration"
			in:fly={{ y: -20, duration: 500 }}
			out:fade={{ duration: 500 }}
		>
			<span class="text-2xl">🎉</span>
			<span class="font-bold text-white">
				{reachedMilestone} Participants Reached!
			</span>
		</div>
	{/if}
	
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
		{#each stats as stat, index (stat.id)}
			<div
				class="stat-card {stat.bgColor}"
				in:fly={{ y: 20, duration: 500, delay: index * 100 }}
				{@attach intersectionObserver((entry) => {
					if (entry.isIntersecting) {
						entry.target.classList.add('visible');
					}
				}, { threshold: 0.1 })}
				{@attach tooltip(stat.description)}
			>
				<!-- Background Gradient -->
				<div class="absolute inset-0 opacity-10">
					<div class="absolute inset-0 bg-gradient-to-br {stat.color} rounded-xl"></div>
				</div>
				
				<!-- Content -->
				<div class="relative z-10">
					<!-- Header -->
					<div class="flex items-center justify-between mb-3">
						<div class="stat-icon">
							<span class="text-2xl">{stat.icon}</span>
						</div>
						{#if stat.trend !== 'stable'}
							<div class="trend-indicator" class:up={stat.trend === 'up'} class:down={stat.trend === 'down'}>
								{#if stat.trend === 'up'}
									<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
										<path fill-rule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clip-rule="evenodd" />
									</svg>
								{:else}
									<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
										<path fill-rule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clip-rule="evenodd" />
									</svg>
								{/if}
							</div>
						{/if}
					</div>
					
					<!-- Value -->
					<div class="stat-value">
						{#if stat.id === 'active' && $activeCount > 0}
							<span class="live-indicator"></span>
						{/if}
						<span class="value-text bg-gradient-to-r {stat.color} bg-clip-text text-transparent">
							{stat.value}
						</span>
					</div>
					
					<!-- Label -->
					<div class="stat-label">
						{stat.label}
					</div>
					
					<!-- Progress Bar for Response Rate -->
					{#if stat.id === 'response'}
						<div class="mt-3">
							<div class="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
								<div 
									class="h-full bg-gradient-to-r {stat.color} transition-all duration-700"
									style="width: {$responseRate}%"
								>
									<div class="h-full shimmer"></div>
								</div>
							</div>
						</div>
					{/if}
				</div>
			</div>
		{/each}
	</div>
	
	<!-- Insights Summary -->
	{#if store.insights}
		<div 
			class="insights-summary"
			in:fly={{ y: 20, duration: 500, delay: 400 }}
		>
			<div class="flex items-center gap-2 mb-2">
				<span class="text-lg">💡</span>
				<h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300">
					Key Insight
				</h4>
			</div>
			<p class="text-sm text-gray-600 dark:text-gray-400">
				{#if store.insights.topPreference}
					Your team shows strong <span class="font-semibold text-purple-600 dark:text-purple-400">
						{store.insights.topPreference.label}
					</span> preference at {store.insights.topPreference.score}%
					{#if store.insights.generation}
						with {store.insights.generation} leading participation.
					{/if}
				{:else}
					Gathering insights... Complete more surveys for detailed analysis.
				{/if}
			</p>
		</div>
	{/if}
</div>

<style>
	.stats-grid {
		@apply relative space-y-4;
	}
	
	.milestone-celebration {
		@apply absolute top-0 left-1/2 -translate-x-1/2 z-20;
		@apply flex items-center gap-2 px-4 py-2 rounded-full;
		@apply bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg;
		animation: bounce 0.5s ease-out;
	}
	
	.stat-card {
		@apply relative p-4 rounded-xl border border-gray-200 dark:border-gray-700;
		@apply transition-all duration-300 hover:shadow-lg hover:scale-105;
		@apply cursor-default overflow-hidden;
		opacity: 0;
		transform: translateY(20px);
	}
	
	.stat-card.visible {
		opacity: 1;
		transform: translateY(0);
	}
	
	.stat-icon {
		@apply w-10 h-10 rounded-lg flex items-center justify-center;
		@apply bg-white/50 dark:bg-gray-800/50 backdrop-blur;
	}
	
	.trend-indicator {
		@apply w-6 h-6 rounded-full flex items-center justify-center;
	}
	
	.trend-indicator.up {
		@apply text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30;
	}
	
	.trend-indicator.down {
		@apply text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30;
	}
	
	.stat-value {
		@apply relative flex items-center gap-2 mb-1;
	}
	
	.value-text {
		@apply text-3xl font-bold;
	}
	
	.stat-label {
		@apply text-sm text-gray-600 dark:text-gray-400 font-medium;
	}
	
	.live-indicator {
		@apply absolute -left-3 top-1/2 -translate-y-1/2;
		@apply w-2 h-2 bg-green-500 rounded-full;
		animation: pulse 2s infinite;
	}
	
	.insights-summary {
		@apply mt-4 p-4 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50;
		@apply dark:from-purple-900/20 dark:to-blue-900/20;
		@apply border border-purple-200 dark:border-purple-700/50;
	}
	
	.shimmer {
		background: linear-gradient(
			90deg,
			transparent,
			rgba(255, 255, 255, 0.3) 50%,
			transparent
		);
		animation: shimmer 2s infinite;
	}
	
	@keyframes bounce {
		0%, 100% { transform: translateX(-50%) translateY(0); }
		50% { transform: translateX(-50%) translateY(-10px); }
	}
	
	@keyframes pulse {
		0%, 100% { 
			opacity: 1;
			box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
		}
		50% { 
			opacity: 0.5;
			box-shadow: 0 0 0 10px rgba(34, 197, 94, 0);
		}
	}
	
	@keyframes shimmer {
		0% { transform: translateX(-100%); }
		50% { transform: translateX(100%); }
		100% { transform: translateX(100%); }
	}
</style>