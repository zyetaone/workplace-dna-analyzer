<!-- Real-time Participant Activity Indicator for Admin Dashboard -->
<script lang="ts">
	import { fade, fly, scale } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import { spring } from 'svelte/motion';
	import { intersectionObserver } from '$lib/utils/attachments';
	
	interface ParticipantActivity {
		id: string;
		name: string;
		action: 'joined' | 'answering' | 'completed' | 'left';
		timestamp: Date;
		progress?: number;
		avatar?: string;
	}
	
	interface Props {
		activities: ParticipantActivity[];
		maxVisible?: number;
		showAnimations?: boolean;
	}
	
	let { 
		activities, 
		maxVisible = 5,
		showAnimations = true 
	}: Props = $props();
	
	// Recent activities with limit
	const recentActivities = $derived(
		activities.slice(-maxVisible).reverse()
	);
	
	// Animated counter for active participants
	const activeCount = spring(0, {
		stiffness: 0.05,
		damping: 0.9
	});
	
	$effect(() => {
		const count = activities.filter(a => 
			a.action === 'joined' || a.action === 'answering'
		).length;
		activeCount.set(count);
	});
	
	// Activity icons and colors
	const activityConfig = {
		joined: { 
			icon: '👋', 
			color: 'text-green-600 bg-green-100 dark:bg-green-900/30',
			message: 'just joined'
		},
		answering: { 
			icon: '✍️', 
			color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
			message: 'is answering'
		},
		completed: { 
			icon: '🎉', 
			color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30',
			message: 'completed the quiz!'
		},
		left: { 
			icon: '👋', 
			color: 'text-gray-600 bg-gray-100 dark:bg-gray-900/30',
			message: 'left the session'
		}
	};
	
	// Format timestamp
	function formatTime(date: Date): string {
		const now = new Date();
		const diff = now.getTime() - date.getTime();
		const seconds = Math.floor(diff / 1000);
		
		if (seconds < 5) return 'just now';
		if (seconds < 60) return `${seconds}s ago`;
		if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
		return `${Math.floor(seconds / 3600)}h ago`;
	}
	
	// Celebration effect for completions
	let showCelebration = $state(false);
	
	$effect(() => {
		const latestActivity = activities[activities.length - 1];
		if (latestActivity?.action === 'completed') {
			showCelebration = true;
			setTimeout(() => showCelebration = false, 3000);
		}
	});
</script>

<div class="live-indicator-container">
	<!-- Header with Active Count -->
	<div class="flex items-center justify-between mb-4">
		<div class="flex items-center gap-2">
			<div class="relative">
				<div class="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
				<div class="absolute inset-0 w-3 h-3 bg-green-500 rounded-full animate-ping"></div>
			</div>
			<h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">
				Live Activity
			</h3>
		</div>
		<div class="flex items-center gap-2">
			<span class="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
				{Math.round($activeCount)}
			</span>
			<span class="text-sm text-gray-600 dark:text-gray-400">
				active now
			</span>
		</div>
	</div>
	
	<!-- Activity Feed -->
	<div class="space-y-2 max-h-64 overflow-y-auto">
		{#each recentActivities as activity (activity.id + activity.timestamp)}
			<div
				class="activity-item"
				in:fly={{ x: -20, duration: 500 }}
				out:fade={{ duration: 300 }}
				animate:flip={{ duration: 300 }}
				{@attach intersectionObserver((entry) => {
					if (entry.isIntersecting) {
						entry.target.classList.add('visible');
					}
				}, { threshold: 0.1 })}
			>
				<!-- Avatar/Icon -->
				<div class="activity-icon {activityConfig[activity.action].color}">
					{#if activity.avatar}
						<img src={activity.avatar} alt={activity.name} class="w-full h-full rounded-full object-cover" />
					{:else}
						<span class="text-lg">{activityConfig[activity.action].icon}</span>
					{/if}
				</div>
				
				<!-- Activity Details -->
				<div class="flex-1 min-w-0">
					<div class="flex items-center gap-2">
						<span class="font-medium text-gray-800 dark:text-gray-200 truncate">
							{activity.name}
						</span>
						<span class="text-sm text-gray-600 dark:text-gray-400">
							{activityConfig[activity.action].message}
						</span>
					</div>
					
					{#if activity.progress !== undefined}
						<div class="mt-1">
							<div class="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
								<div 
									class="h-full bg-gradient-to-r from-cyan-500 to-purple-600 transition-all duration-500"
									style="width: {activity.progress}%"
								></div>
							</div>
						</div>
					{/if}
				</div>
				
				<!-- Timestamp -->
				<span class="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
					{formatTime(activity.timestamp)}
				</span>
			</div>
		{/each}
		
		{#if recentActivities.length === 0}
			<div class="text-center py-8 text-gray-500 dark:text-gray-400">
				<svg class="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
				<p class="text-sm">Waiting for participants...</p>
			</div>
		{/if}
	</div>
	
	<!-- Celebration Overlay -->
	{#if showCelebration && showAnimations}
		<div 
			class="celebration-overlay"
			in:scale={{ duration: 500, start: 0.5 }}
			out:fade={{ duration: 500 }}
		>
			<div class="celebration-content">
				<span class="text-4xl mb-2">🎉</span>
				<p class="text-lg font-bold text-white">Quiz Completed!</p>
			</div>
		</div>
	{/if}
</div>

<style>
	.live-indicator-container {
		@apply relative bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm;
	}
	
	.activity-item {
		@apply flex items-center gap-3 p-2 rounded-lg transition-all duration-300;
		@apply hover:bg-gray-50 dark:hover:bg-gray-700/50;
		opacity: 0;
		transform: translateY(10px);
	}
	
	.activity-item.visible {
		opacity: 1;
		transform: translateY(0);
	}
	
	.activity-icon {
		@apply w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0;
	}
	
	.celebration-overlay {
		@apply absolute inset-0 flex items-center justify-center z-10;
		@apply bg-gradient-to-br from-purple-600/90 to-pink-600/90 rounded-lg;
	}
	
	.celebration-content {
		@apply text-center;
		animation: bounce 0.5s ease-out;
	}
	
	@keyframes bounce {
		0%, 100% { transform: translateY(0); }
		50% { transform: translateY(-20px); }
	}
</style>