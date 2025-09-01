<!--
RealTimeStats Component
Displays live session statistics with animated counters
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, scale } from 'svelte/transition';
	import type { RealTimeSessionAnalytics } from '../server/enhanced-analytics-engine';

	interface RealTimeStatsProps {
		analyticsData: RealTimeSessionAnalytics;
		showAnimations?: boolean;
	}

	let { analyticsData, showAnimations = true }: RealTimeStatsProps = $props();

	let animatedValues = $state({
		currentParticipants: 0,
		activeParticipants: 0,
		completedParticipants: 0,
		averageEngagement: 0,
		peakConcurrency: 0
	});

	// Animate counters
	function animateCounters() {
		const duration = 1000; // 1 second
		const steps = 60;
		const stepDuration = duration / steps;

		const targets = {
			currentParticipants: analyticsData.liveStats.currentParticipants,
			activeParticipants: analyticsData.liveStats.activeParticipants,
			completedParticipants: analyticsData.liveStats.completedParticipants,
			averageEngagement: analyticsData.liveStats.averageEngagement,
			peakConcurrency: analyticsData.liveStats.peakConcurrency
		};

		let step = 0;
		const timer = setInterval(() => {
			step++;
			const progress = step / steps;

			// Easing function for smooth animation
			const easeOut = 1 - Math.pow(1 - progress, 3);

			Object.keys(targets).forEach((key) => {
				const target = targets[key as keyof typeof targets];
				const start = 0;
				animatedValues[key as keyof typeof animatedValues] = Math.round(
					start + (target - start) * easeOut
				);
			});

			if (step >= steps) {
				clearInterval(timer);
				// Ensure final values are exact
				Object.assign(animatedValues, targets);
			}
		}, stepDuration);
	}

	// Update animations when data changes
	$effect(() => {
		if (analyticsData && showAnimations) {
			animateCounters();
		} else if (analyticsData) {
			Object.assign(animatedValues, analyticsData.liveStats);
		}
	});

	const stats = $derived([
		{
			label: 'Current Participants',
			value: animatedValues.currentParticipants,
			target: analyticsData.liveStats.currentParticipants,
			icon: '👥',
			color: 'text-blue-600',
			bgColor: 'bg-blue-100',
			description: 'People currently in session'
		},
		{
			label: 'Active Now',
			value: animatedValues.activeParticipants,
			target: analyticsData.liveStats.activeParticipants,
			icon: '⚡',
			color: 'text-green-600',
			bgColor: 'bg-green-100',
			description: 'Currently working on activities'
		},
		{
			label: 'Completed',
			value: animatedValues.completedParticipants,
			target: analyticsData.liveStats.completedParticipants,
			icon: '✅',
			color: 'text-purple-600',
			bgColor: 'bg-purple-100',
			description: 'Finished all activities'
		},
		{
			label: 'Avg Engagement',
			value: animatedValues.averageEngagement,
			target: analyticsData.liveStats.averageEngagement,
			icon: '🔥',
			color: 'text-orange-600',
			bgColor: 'bg-orange-100',
			description: 'Overall engagement score',
			suffix: '%'
		},
		{
			label: 'Peak Concurrency',
			value: animatedValues.peakConcurrency,
			target: analyticsData.liveStats.peakConcurrency,
			icon: '📈',
			color: 'text-red-600',
			bgColor: 'bg-red-100',
			description: 'Highest simultaneous users'
		}
	]);
</script>

<div class="grid gap-4 md:grid-cols-5" in:fade={{ duration: 600 }}>
	{#each stats as stat, index}
		<div
			class="rounded-xl border border-gray-200 bg-white p-4 transition-all hover:shadow-md"
			in:scale={{ duration: 400, delay: index * 100 }}
		>
			<div class="flex items-center justify-between">
				<div>
					<div class="flex items-center gap-2">
						<div class="flex h-8 w-8 items-center justify-center rounded-lg {stat.bgColor}">
							<span class="text-lg">{stat.icon}</span>
						</div>
						<div>
							<div class="text-2xl font-bold {stat.color}">
								{stat.value}{stat.suffix || ''}
							</div>
							<div class="text-xs font-medium text-gray-600">{stat.label}</div>
						</div>
					</div>
					<div class="mt-2 text-xs text-gray-500">{stat.description}</div>
				</div>

				<!-- Trend indicator -->
				{#if stat.value !== stat.target}
					<div class="flex items-center">
						<div class="h-2 w-2 animate-pulse rounded-full bg-green-500"></div>
					</div>
				{/if}
			</div>

			<!-- Progress bar for engagement -->
			{#if stat.label === 'Avg Engagement'}
				<div class="mt-3">
					<div class="h-2 w-full rounded-full bg-gray-200">
						<div
							class="h-2 rounded-full bg-orange-500 transition-all duration-500"
							style="width: {stat.value}%"
						></div>
					</div>
				</div>
			{/if}
		</div>
	{/each}
</div>

<!-- Session Status Summary -->
<div
	class="mt-6 rounded-xl border border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50 p-4"
	in:fade={{ duration: 600, delay: 500 }}
>
	<div class="flex items-center justify-between">
		<div>
			<h3 class="text-lg font-semibold text-gray-900">{analyticsData.session.name}</h3>
			<p class="text-sm text-gray-600">Session Code: {analyticsData.session.code}</p>
		</div>
		<div class="flex items-center gap-2">
			<div class="flex h-3 w-3 items-center">
				<div
					class="h-2 w-2 animate-pulse rounded-full {analyticsData.session.isActive
						? 'bg-green-500'
						: 'bg-red-500'}"
				></div>
			</div>
			<span
				class="text-sm font-medium {analyticsData.session.isActive
					? 'text-green-700'
					: 'text-red-700'}"
			>
				{analyticsData.session.isActive ? 'Active' : 'Inactive'}
			</span>
		</div>
	</div>

	<!-- Quick Stats -->
	<div class="mt-4 grid grid-cols-3 gap-4 text-center">
		<div>
			<div class="text-lg font-bold text-blue-600">
				{analyticsData.liveStats.currentParticipants}
			</div>
			<div class="text-xs text-gray-600">Total Joined</div>
		</div>
		<div>
			<div class="text-lg font-bold text-green-600">
				{Math.round(
					(analyticsData.liveStats.completedParticipants /
						analyticsData.liveStats.currentParticipants) *
						100
				) || 0}%
			</div>
			<div class="text-xs text-gray-600">Completion Rate</div>
		</div>
		<div>
			<div class="text-lg font-bold text-purple-600">
				{analyticsData.liveStats.peakConcurrency}
			</div>
			<div class="text-xs text-gray-600">Peak Users</div>
		</div>
	</div>
</div>
