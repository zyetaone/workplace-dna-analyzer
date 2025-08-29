<!-- @migration-task Error while migrating Svelte code: Mixing old (on:touchstart) and new syntaxes for event handling is not allowed. Use only the ontouchstart syntax
https://svelte.dev/e/mixed_event_handler_syntaxes -->
<!-- Enhanced Quiz Container with Improved UX -->
<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { getPresenterState } from '../[code]/quiz.svelte.ts';
	import { Card, Button } from '$lib/components';
	import QuizProgressIndicator from '$lib/components/shared/QuizProgressIndicator.svelte';
	import { fade, fly, scale } from 'svelte/transition';
	import { quintOut, elasticOut } from 'svelte/easing';
	import { spring } from 'svelte/motion';
	import { longPress, keyboardNavigation, tooltip } from '$lib/utils/attachments';
	import confetti from 'canvas-confetti';

	const presenter = getPresenterState(page.params.code as string);
	const { currentQuestion, loading, participant, currentAnswer, error, isLastQuestion, progressPercent } = presenter;
	
	let selectedAnswer = $state('');
	let isTransitioning = $state(false);
	let showSuccess = $state(false);
	let touchStartY = $state(0);
	
	// Animation states
	const cardScale = spring(1, { stiffness: 0.05, damping: 0.9 });
	const buttonScale = spring(1, { stiffness: 0.1, damping: 0.8 });
	
	// Initialize quiz
	$effect(() => {
		const sessionCode = page.params.code as string;
		if (!sessionCode || !/^[A-Z0-9]+-[0-9]{6}$/.test(sessionCode)) {
			goto('/');
			return;
		}
		if (!participant?.id) {
			goto(`/${sessionCode}`);
			return;
		}
		presenter.loadQuizState(sessionCode, participant.id);
	});
	
	// Sync selected answer
	$effect(() => {
		selectedAnswer = currentAnswer;
	});
	
	// Handle answer submission with enhanced feedback
	async function handleAction(skipAnswer?: boolean) {
		const answer = skipAnswer ? '' : selectedAnswer;
		if (!skipAnswer && !answer) {
			// Shake animation for missing answer
			cardScale.set(0.98);
			setTimeout(() => cardScale.set(1), 200);
			return;
		}
		
		isTransitioning = true;
		showSuccess = true;
		
		// Haptic feedback for mobile
		if ('vibrate' in navigator) {
			navigator.vibrate(50);
		}
		
		const result = await presenter.submitAnswer(answer);
		if (!result.success) {
			isTransitioning = false;
			showSuccess = false;
			return;
		}
		
		if (isLastQuestion) {
			// Celebration animation
			confetti({
				particleCount: 100,
				spread: 70,
				origin: { y: 0.6 }
			});
			
			const completion = await presenter.completeQuiz();
			if (completion.success) {
				setTimeout(() => goto(`/${page.params.code}/complete`), 1000);
			}
		} else {
			setTimeout(() => {
				presenter.nextQuestion();
				selectedAnswer = '';
				isTransitioning = false;
				showSuccess = false;
			}, 500);
		}
	}
	
	// Keyboard navigation
	function handleKeyboardNav(direction: 'up' | 'down' | 'enter') {
		if (!currentQuestion) return;
		
		const options = currentQuestion.options;
		const currentIndex = options.findIndex(o => o.id === selectedAnswer);
		
		if (direction === 'up' && currentIndex > 0) {
			selectedAnswer = options[currentIndex - 1].id;
		} else if (direction === 'down' && currentIndex < options.length - 1) {
			selectedAnswer = options[currentIndex + 1].id;
		} else if (direction === 'enter' && selectedAnswer) {
			handleAction();
		}
	}
	
	// Touch gestures for mobile
	function handleTouchStart(e: TouchEvent) {
		touchStartY = e.touches[0].clientY;
	}
	
	function handleTouchEnd(e: TouchEvent) {
		const touchEndY = e.changedTouches[0].clientY;
		const diff = touchStartY - touchEndY;
		
		// Swipe up to submit
		if (diff > 50 && selectedAnswer) {
			handleAction();
		}
	}
	
	// Option selection with animation
	function selectOption(optionId: string) {
		if (loading || isTransitioning) return;
		
		selectedAnswer = optionId;
		buttonScale.set(1.05);
		setTimeout(() => buttonScale.set(1), 200);
		
		// Haptic feedback
		if ('vibrate' in navigator) {
			navigator.vibrate(20);
		}
	}
</script>

<div 
	class="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-purple-900 flex items-center justify-center px-4 py-8"
	on:touchstart={handleTouchStart}
	on:touchend={handleTouchEnd}
>
	<!-- Background Animation -->
	<div class="fixed inset-0 pointer-events-none overflow-hidden">
		<div class="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
		<div class="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
		<div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
	</div>
	
	<div 
		class="relative max-w-2xl w-full"
		style="transform: scale({$cardScale})"
		{@attach keyboardNavigation(
			() => handleKeyboardNav('up'),
			() => handleKeyboardNav('down'),
			undefined,
			undefined,
			() => handleKeyboardNav('enter')
		)}
	>
		<Card variant="elevated" class="backdrop-blur-lg bg-white/90 dark:bg-gray-800/90 shadow-2xl">
			{#if loading && !currentQuestion}
				<!-- Loading State -->
				<div class="text-center py-16">
					<div class="relative">
						<div class="w-20 h-20 mx-auto">
							<div class="absolute inset-0 border-4 border-purple-200 dark:border-purple-700 rounded-full"></div>
							<div class="absolute inset-0 border-4 border-purple-600 dark:border-purple-400 rounded-full border-t-transparent animate-spin"></div>
						</div>
					</div>
					<p class="mt-6 text-gray-600 dark:text-gray-300 font-medium">Loading your quiz...</p>
				</div>
				
			{:else if error}
				<!-- Error State -->
				<div class="text-center py-16" in:fade>
					<div class="w-20 h-20 mx-auto mb-4 text-red-500">
						<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
						</svg>
					</div>
					<h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">Oops! Something went wrong</h3>
					<p class="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
					<Button onclick={() => location.reload()} variant="outline">
						Try Again
					</Button>
				</div>
				
			{:else if currentQuestion}
				<!-- Quiz Content -->
				<div class="space-y-6">
					<!-- Progress Indicator -->
					<QuizProgressIndicator 
						currentStep={presenter.currentQuestionIndex + 1}
						totalSteps={7}
						completedSteps={Object.keys(presenter.responses).length}
						variant="linear"
					/>
					
					<!-- Question Card with Animation -->
					<div 
						class="question-content"
						in:fly={{ x: 20, duration: 500, easing: quintOut }}
						out:fly={{ x: -20, duration: 300 }}
					>
						<h2 class="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
							{currentQuestion.question}
						</h2>
						{#if currentQuestion.description}
							<p class="text-gray-600 dark:text-gray-300 mb-6">
								{currentQuestion.description}
							</p>
						{/if}
						
						<!-- Options Grid -->
						<div class="space-y-3" role="radiogroup" aria-label="Answer options">
							{#each currentQuestion.options as option (option.id)}
								{@const isSelected = selectedAnswer === option.id}
								<button
									onclick={() => selectOption(option.id)}
									disabled={loading || isTransitioning}
									aria-checked={isSelected}
									role="radio"
									class="option-button"
									class:selected={isSelected}
									class:success={isSelected && showSuccess}
									style="transform: scale({isSelected ? $buttonScale : 1})"
									{@attach longPress(() => {
										selectOption(option.id);
										handleAction();
									}, 800)}
									in:fly={{ y: 10, duration: 400, delay: 50 }}
								>
									<div class="flex items-start gap-4">
										{#if option.icon}
											<span class="text-2xl flex-shrink-0">{option.icon}</span>
										{/if}
										<div class="flex-1 text-left">
											<div class="font-semibold text-gray-800 dark:text-gray-100">
												{option.label}
											</div>
											{#if option.description}
												<div class="text-sm text-gray-600 dark:text-gray-300 mt-1">
													{option.description}
												</div>
											{/if}
										</div>
										<div class="flex-shrink-0 ml-auto">
											{#if isSelected}
												<div class="check-icon" in:scale={{ duration: 300, easing: elasticOut }}>
													<svg class="w-6 h-6 text-purple-600 dark:text-purple-400" fill="currentColor" viewBox="0 0 20 20">
														<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
													</svg>
												</div>
											{:else}
												<div class="w-6 h-6 border-2 border-gray-300 dark:border-gray-600 rounded-full"></div>
											{/if}
										</div>
									</div>
								</button>
							{/each}
						</div>
					</div>
					
					<!-- Action Buttons -->
					<div class="flex gap-4 mt-8">
						<Button
							onclick={() => handleAction()}
							disabled={loading || !selectedAnswer || isTransitioning}
							loading={isTransitioning}
							class="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3"
							{@attach tooltip(isLastQuestion ? 'Complete the quiz!' : 'Continue to next question')}
						>
							{#if isTransitioning}
								<span class="flex items-center justify-center gap-2">
									<svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
										<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
										<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
									</svg>
									Saving...
								</span>
							{:else}
								{isLastQuestion ? 'Complete Quiz 🎉' : 'Next Question →'}
							{/if}
						</Button>
						
						{#if !isLastQuestion}
							<Button
								onclick={() => handleAction(true)}
								disabled={loading || isTransitioning}
								variant="outline"
								class="px-6"
								{@attach tooltip('Skip this question')}
							>
								Skip
							</Button>
						{/if}
					</div>
					
					<!-- Mobile Hint -->
					<div class="text-center text-xs text-gray-500 dark:text-gray-400 mt-4 md:hidden">
						💡 Tip: Long press an option to quick-select and continue
					</div>
				</div>
				
			{:else}
				<!-- No Quiz Available -->
				<div class="text-center py-16" in:fade>
					<div class="w-20 h-20 mx-auto mb-4 text-gray-400">
						<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
					</div>
					<h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">Quiz Not Available</h3>
					<p class="text-gray-600 dark:text-gray-400">Please check your session code and try again.</p>
				</div>
			{/if}
		</Card>
	</div>
</div>

<style>
	.option-button {
		@apply w-full p-4 border-2 rounded-xl transition-all duration-300;
		@apply border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800;
		@apply hover:border-purple-400 dark:hover:border-purple-600;
		@apply focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2;
		@apply disabled:opacity-50 disabled:cursor-not-allowed;
	}
	
	.option-button.selected {
		@apply border-purple-500 dark:border-purple-400 bg-purple-50 dark:bg-purple-900/20;
	}
	
	.option-button.success {
		@apply border-green-500 dark:border-green-400 bg-green-50 dark:bg-green-900/20;
		animation: success-pulse 0.5s ease-out;
	}
	
	@keyframes success-pulse {
		0% { transform: scale(1); }
		50% { transform: scale(1.05); }
		100% { transform: scale(1); }
	}
	
	@keyframes blob {
		0%, 100% { transform: translate(0px, 0px) scale(1); }
		33% { transform: translate(30px, -50px) scale(1.1); }
		66% { transform: translate(-20px, 20px) scale(0.9); }
	}
	
	.animate-blob {
		animation: blob 7s infinite;
	}
	
	.animation-delay-2000 {
		animation-delay: 2s;
	}
	
	.animation-delay-4000 {
		animation-delay: 4s;
	}
</style>