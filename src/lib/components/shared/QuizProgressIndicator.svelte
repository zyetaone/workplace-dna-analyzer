<!-- Enhanced Quiz Progress Indicator with Micro-interactions -->
<script lang="ts">
	import { spring } from 'svelte/motion';
	import { fade, fly } from 'svelte/transition';
	import { tooltip } from '$lib/utils/attachments';
	
	interface Props {
		currentStep: number;
		totalSteps: number;
		completedSteps: number;
		showMilestones?: boolean;
		variant?: 'linear' | 'circular' | 'stepped';
	}
	
	let { 
		currentStep, 
		totalSteps, 
		completedSteps, 
		showMilestones = true,
		variant = 'linear' 
	}: Props = $props();
	
	// Spring animation for smooth progress
	const progress = spring(0, {
		stiffness: 0.05,
		damping: 0.9
	});
	
	$effect(() => {
		progress.set((completedSteps / totalSteps) * 100);
	});
	
	// Milestone celebrations
	const milestones = [25, 50, 75, 100];
	const reachedMilestone = $derived(
		milestones.find(m => 
			Math.floor((completedSteps / totalSteps) * 100) >= m &&
			Math.floor(((completedSteps - 1) / totalSteps) * 100) < m
		)
	);
	
	// Accessibility
	const progressLabel = $derived(
		`Question ${currentStep} of ${totalSteps}, ${Math.round($progress)}% complete`
	);
</script>

{#if variant === 'linear'}
	<div 
		class="quiz-progress-container"
		role="progressbar"
		aria-valuenow={$progress}
		aria-valuemin="0"
		aria-valuemax="100"
		aria-label={progressLabel}
	>
		<!-- Progress Header -->
		<div class="flex justify-between items-center mb-3">
			<div class="flex items-center gap-2">
				<span class="text-sm font-medium text-gray-700 dark:text-gray-300">
					Question {currentStep} of {totalSteps}
				</span>
				{#if reachedMilestone}
					<span 
						class="milestone-badge"
						in:fly={{ y: -10, duration: 500 }}
					>
						{reachedMilestone}% Complete! 🎉
					</span>
				{/if}
			</div>
			<span class="text-sm font-bold text-cyan-600 dark:text-cyan-400">
				{Math.round($progress)}%
			</span>
		</div>
		
		<!-- Progress Bar -->
		<div class="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
			<!-- Animated Background Pattern -->
			<div class="absolute inset-0 opacity-20">
				<div class="progress-pattern"></div>
			</div>
			
			<!-- Progress Fill -->
			<div 
				class="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full transition-all duration-700 ease-out"
				style="width: {$progress}%"
			>
				<!-- Shimmer Effect -->
				<div class="absolute inset-0 shimmer"></div>
			</div>
			
			<!-- Milestone Markers -->
			{#if showMilestones}
				{#each milestones as milestone}
					<div 
						class="absolute top-1/2 -translate-y-1/2 w-1 h-5 bg-white dark:bg-gray-900"
						style="left: {milestone}%"
						{@attach tooltip(`${milestone}% milestone`)}
					></div>
				{/each}
			{/if}
		</div>
		
		<!-- Encouraging Messages -->
		<div class="mt-2 h-6">
			{#if $progress < 25}
				<p class="text-xs text-gray-600 dark:text-gray-400" in:fade>
					Great start! Keep going 💪
				</p>
			{:else if $progress < 50}
				<p class="text-xs text-gray-600 dark:text-gray-400" in:fade>
					You're doing amazing! 🌟
				</p>
			{:else if $progress < 75}
				<p class="text-xs text-gray-600 dark:text-gray-400" in:fade>
					Over halfway there! 🚀
				</p>
			{:else if $progress < 100}
				<p class="text-xs text-gray-600 dark:text-gray-400" in:fade>
					Almost done! Final stretch! 🏁
				</p>
			{:else}
				<p class="text-xs text-green-600 dark:text-green-400 font-semibold" in:fade>
					Completed! Thank you! 🎊
				</p>
			{/if}
		</div>
	</div>
	
{:else if variant === 'stepped'}
	<div 
		class="stepped-progress"
		role="group"
		aria-label={progressLabel}
	>
		<div class="flex items-center justify-between">
			{#each Array(totalSteps) as _, index}
				{@const stepNumber = index + 1}
				{@const isCompleted = stepNumber <= completedSteps}
				{@const isCurrent = stepNumber === currentStep}
				
				<div class="flex items-center flex-1">
					<!-- Step Circle -->
					<button
						class="step-circle"
						class:completed={isCompleted}
						class:current={isCurrent}
						aria-label="Question {stepNumber}"
						aria-current={isCurrent ? 'step' : undefined}
						disabled={stepNumber > completedSteps + 1}
						{@attach tooltip(`Question ${stepNumber}`)}
					>
						{#if isCompleted && !isCurrent}
							<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
							</svg>
						{:else}
							{stepNumber}
						{/if}
					</button>
					
					<!-- Connector Line -->
					{#if index < totalSteps - 1}
						<div 
							class="flex-1 h-0.5 mx-2"
							class:bg-cyan-500={stepNumber < completedSteps}
							class:bg-gray-300={stepNumber >= completedSteps}
							class:dark:bg-cyan-400={stepNumber < completedSteps}
							class:dark:bg-gray-600={stepNumber >= completedSteps}
						></div>
					{/if}
				</div>
			{/each}
		</div>
	</div>
{/if}

<style>
	.quiz-progress-container {
		@apply w-full space-y-2;
	}
	
	.milestone-badge {
		@apply px-2 py-1 text-xs font-semibold bg-gradient-to-r from-cyan-500 to-purple-600 text-white rounded-full;
		animation: bounce 0.5s ease-out;
	}
	
	.progress-pattern {
		background-image: repeating-linear-gradient(
			45deg,
			transparent,
			transparent 10px,
			rgba(255, 255, 255, 0.1) 10px,
			rgba(255, 255, 255, 0.1) 20px
		);
		animation: slide 1s linear infinite;
		height: 100%;
		width: 200%;
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
	
	.step-circle {
		@apply w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300;
		@apply bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400;
		@apply hover:scale-110 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2;
	}
	
	.step-circle.completed {
		@apply bg-cyan-500 text-white dark:bg-cyan-400;
	}
	
	.step-circle.current {
		@apply bg-purple-600 text-white scale-110 dark:bg-purple-500;
		animation: pulse 2s infinite;
	}
	
	@keyframes slide {
		0% { transform: translateX(0); }
		100% { transform: translateX(-50%); }
	}
	
	@keyframes shimmer {
		0% { transform: translateX(-100%); }
		50% { transform: translateX(100%); }
		100% { transform: translateX(100%); }
	}
	
	@keyframes bounce {
		0%, 100% { transform: translateY(0); }
		50% { transform: translateY(-10px); }
	}
	
	@keyframes pulse {
		0%, 100% { 
			transform: scale(1.1);
			box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.7);
		}
		50% { 
			transform: scale(1.05);
			box-shadow: 0 0 0 10px rgba(139, 92, 246, 0);
		}
	}
</style>