<!--
	UNIFIED ASSESSMENT CONTAINER - SVELTE 5 OPTIMIZED
	Combines best features from all variants with modern patterns
-->
<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { getQuizState } from '../[code]/quiz.svelte.ts';
	import { Card, Button } from '$lib/components';
	import { fly, fade, scale } from 'svelte/transition';
	import { quintOut, elasticOut } from 'svelte/easing';

	// Props for variant customization
	let {
		variant = 'enhanced', // 'simple' | 'enhanced' | 'interactive'
		enableSwipe = true,
		enableKeyboard = true,
		showProgressPreview = true
	}: {
		variant?: 'simple' | 'enhanced' | 'interactive';
		enableSwipe?: boolean;
		enableKeyboard?: boolean;
		showProgressPreview?: boolean;
	} = $props();

	const quiz = getQuizState(page.params.code as string);
	const {
		currentQuestion,
		currentQuestionWithAnswer,
		loading,
		participant,
		currentAnswer,
		error,
		isLastQuestion,
		progressPercent,
		isReady,
		dataLoaded,
		currentQuestionIndex,
		totalQuestions
	} = quiz;

	// Unified state management
	let selectedAnswer = $state('');
	let isSubmitting = $state(false);
	let showSuccessFeedback = $state(false);
	let successMessage = $state('');
	let showCelebration = $state(false);
	let showTransition = $state(false);
	let transitionMessage = $state('');
	let buttonScale = $state(1);

	// Interactive features (variant-dependent)
	let enableSwipeState = $state(enableSwipe);
	let showInstantFeedback = $derived(variant === 'interactive');

	// Unified quiz initialization with race condition prevention
	$effect(() => {
		const sessionCode = page.params.code as string;
		if (!sessionCode || !/^[A-Z0-9]+-[0-9]{6}$/.test(sessionCode)) {
			goto('/');
			return;
		}

		// Smart participant loading with localStorage persistence
		if (!participant?.id) {
			const storedParticipantId = localStorage.getItem(`participant_${sessionCode}`);
			if (storedParticipantId) {
				quiz.loadQuizState(sessionCode, storedParticipantId);
			} else {
				goto(`/${sessionCode}`);
				return;
			}
		} else if (!dataLoaded) {
			// Only refresh if data isn't loaded yet
			quiz.loadQuizState(sessionCode, participant.id);
		}
	});

	// Synchronized answer management with race condition prevention
	$effect(() => {
		// Only sync when data is ready and stable
		if (isReady && dataLoaded && currentQuestionWithAnswer && !isSubmitting) {
			selectedAnswer = currentQuestionWithAnswer.selectedAnswer;
		}
	});

	// Keyboard navigation for interactive variant
	$effect(() => {
		if (!enableKeyboard || variant !== 'interactive') return;

		const handleKeydown = (e: KeyboardEvent) => {
			if (isSubmitting || loading || !currentQuestion) return;

			// Number keys for quick selection
			if (e.key >= '1' && e.key <= '9') {
				const index = parseInt(e.key) - 1;
				if (currentQuestion.options[index]) {
					selectedAnswer = currentQuestion.options[index].id;
				}
			}

			// Enter to submit
			if (e.key === 'Enter' && selectedAnswer) {
				handleAction();
			}

			// Arrow keys for navigation
			if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
				e.preventDefault();
				navigateOptions(e.key === 'ArrowUp' ? -1 : 1);
			}
		};

		document.addEventListener('keydown', handleKeydown);
		return () => document.removeEventListener('keydown', handleKeydown);
	});

	// Keyboard navigation helper
	function navigateOptions(direction: number) {
		if (!currentQuestion) return;

		const currentIndex = currentQuestion.options.findIndex((o) => o.id === selectedAnswer);
		let newIndex = currentIndex + direction;

		// Wrap around navigation
		if (newIndex < 0) newIndex = currentQuestion.options.length - 1;
		if (newIndex >= currentQuestion.options.length) newIndex = 0;

		selectedAnswer = currentQuestion.options[newIndex].id;
	}

	// Unified action handler with variant-specific behavior
	async function handleAction(skipAnswer = false) {
		const answer = skipAnswer ? '' : selectedAnswer;
		if (!skipAnswer && !answer) {
			// Shake animation for empty selection (interactive variant)
			if (variant === 'interactive') {
				const quizContent = document.querySelector('.quiz-content');
				quizContent?.classList.add('shake');
				setTimeout(() => quizContent?.classList.remove('shake'), 500);
			}
			return;
		}

		isSubmitting = true;
		enableSwipeState = false;
		buttonScale = 0.95;

		// Button animation
		setTimeout(() => (buttonScale = 1), 150);

		try {
			const result = await quiz.submitAnswer(answer);
			if (!result.success) {
				isSubmitting = false;
				enableSwipeState = true;
				return;
			}

			// Success feedback based on variant
			if (!skipAnswer && showInstantFeedback) {
				showSuccessFeedback = true;
				successMessage = getRandomSuccessMessage();

				setTimeout(() => {
					showSuccessFeedback = false;
					successMessage = '';
				}, 2500);
			}

			// Transition message for interactive variant
			if (variant === 'interactive' && !skipAnswer) {
				showTransitionMessage();
			}

			// Handle completion
			if (isLastQuestion) {
				showCelebration = true;
				setTimeout(() => (showCelebration = false), 2000);

				setTimeout(async () => {
					const completion = await quiz.completeQuiz();
					if (completion.success) {
						goto(`/${page.params.code}/complete`);
					}
				}, 1500);
			} else {
				const delay = variant === 'interactive' ? 1200 : 800;
				setTimeout(() => {
					quiz.nextQuestion();
					selectedAnswer = '';
					isSubmitting = false;
					enableSwipeState = true;
					showTransition = false;
				}, delay);
			}
		} catch (error) {
			isSubmitting = false;
			enableSwipeState = true;
			console.error('Error submitting answer:', error);
		}
	}

	// Success message generator
	function getRandomSuccessMessage() {
		const messages = [
			'Great choice! 🎯',
			'Excellent! Moving on... ✨',
			'Perfect! Next question... 🚀',
			'Awesome response! 💫',
			"Well done! Let's continue... 🌟"
		];
		return messages[Math.floor(Math.random() * messages.length)];
	}

	// Transition message for interactive variant
	function showTransitionMessage() {
		const messages = [
			'Great choice! 🎯',
			'Excellent! Moving on... ✨',
			'Perfect! Next question... 🚀',
			'Awesome response! 💫',
			"Well done! Let's continue... 🌟"
		];

		transitionMessage = messages[Math.floor(Math.random() * messages.length)];
		showTransition = true;
	}
</script>

<!-- Unified Assessment Container Template with Swiss Grid -->
<div class="swiss-container swiss-container-lg">
	<div class="quiz-wrapper" class:interactive={variant === 'interactive'}>
		{#if loading}
			<!-- Loading State -->
			<div class="loading-container" in:fade={{ duration: 300 }}>
				<div class="glass-card rounded-3xl p-12">
					<div class="text-center">
						<div class="w-16 h-16 mx-auto mb-4">
							<div
								class="w-full h-full rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin"
							></div>
						</div>
						<p class="text-lg text-slate-300">
							{loading ? 'Loading assessment...' : 'Synchronizing your preference data...'}
						</p>
					</div>
				</div>
			</div>
		{:else if error}
			<!-- Error State -->
			<div class="error-container" in:fade={{ duration: 300 }}>
				<div class="glass-card rounded-3xl p-12 border-red-500/20">
					<div class="text-center">
						<div class="text-4xl mb-4">⚠️</div>
						<h3 class="text-xl font-semibold text-red-400 mb-2">Error Loading Assessment</h3>
						<p class="text-slate-400 mb-6">{error}</p>
						<Button
							onclick={() => location.reload()}
							class="bg-gradient-to-r from-red-500 to-pink-500"
						>
							Try Again
						</Button>
					</div>
				</div>
			</div>
		{:else if currentQuestion && !isReady}
			<!-- Data Synchronization State -->
			<div class="sync-container" in:fade={{ duration: 300 }}>
				<div class="glass-card rounded-3xl p-12">
					<div class="text-center">
						<div class="w-16 h-16 mx-auto mb-4">
							<div
								class="w-full h-full rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin"
							></div>
						</div>
						<p class="text-lg text-slate-300">Synchronizing assessment data...</p>
						<p class="text-sm text-slate-400 mt-2">Loading your previous answers</p>
					</div>
				</div>
			</div>
		{:else if currentQuestion && isReady}
			<!-- Main Assessment Content with Swiss Design -->
			<div class="swiss-quiz-container">
				<div class="swiss-question-card" in:fly={{ y: 20, duration: 500, easing: quintOut }}>
					<!-- Progress Header with Variant-Specific Features -->
					<div class="quiz-header">
						<div class="text-center mb-6">
							<h1 class="text-3xl font-bold gradient-text mb-2">Workplace Preferences</h1>
							<p class="text-slate-400">
								Preference Indicator {currentQuestionIndex + 1} of {totalQuestions}
							</p>
						</div>
					</div>

					<!-- Swiss Progress Bar -->
					<div class="swiss-question-progress">
						<div class="swiss-question-progress-fill" style="width: {progressPercent}%"></div>
					</div>

					<!-- Next Question Preview (Enhanced variant only) -->
					{#if variant === 'enhanced' && showProgressPreview && !isLastQuestion}
						<div
							class="mt-4 p-4 bg-slate-800/30 backdrop-blur-sm rounded-xl border border-slate-600/30"
						>
							<div class="flex items-center gap-3">
								<div
									class="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold"
								>
									{currentQuestionIndex + 2}
								</div>
								<div class="flex-1">
									<p class="text-xs text-slate-400 mb-1">Next Question</p>
									<p class="text-sm text-slate-200 font-medium">
										{quiz.questions[currentQuestionIndex + 1]?.question || 'Loading...'}
									</p>
								</div>
								<div class="flex-shrink-0 text-slate-400">
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M9 5l7 7-7 7"
										></path>
									</svg>
								</div>
							</div>
						</div>
					{:else if variant === 'enhanced' && isLastQuestion}
						<div
							class="mt-4 p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 backdrop-blur-sm rounded-xl border border-green-500/20"
						>
							<div class="flex items-center gap-3">
								<div
									class="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white"
								>
									🎉
								</div>
								<div class="flex-1">
									<p class="text-xs text-green-400 mb-1">Final Step</p>
									<p class="text-sm text-green-200 font-medium">Complete your workplace profile!</p>
								</div>
							</div>
						</div>
					{/if}

					<!-- Keyboard Hints (Interactive variant only) -->
					{#if variant === 'interactive' && enableKeyboard}
						<div class="keyboard-hints">
							<span class="hint">Press 1-{currentQuestion.options.length} to select</span>
							<span class="hint">Enter to submit</span>
							<span class="hint">↑↓ to navigate</span>
						</div>
					{/if}
				</div>

				<!-- Question Section with Variant-Specific Styling -->
				<div class="question-section" in:fade={{ delay: 100, duration: 400 }}>
					{#if variant === 'interactive'}
						<div class="question-number">
							Question {currentQuestionIndex + 1}
						</div>
					{/if}
					<h2 class="question-title">
						{currentQuestionWithAnswer?.question || currentQuestion.question}
					</h2>
					{#if currentQuestionWithAnswer?.description || currentQuestion.description}
						<p class="question-description">
							{currentQuestionWithAnswer?.description || currentQuestion.description}
						</p>
					{/if}
				</div>

				<!-- Swiss Options Grid -->
				<div class="swiss-options-grid">
					{#each currentQuestionWithAnswer?.options || currentQuestion.options as option, index (option.id)}
						<div
							in:fly={{
								x: variant === 'interactive' ? -20 : 0,
								delay: variant === 'interactive' ? index * 50 : 0,
								duration: variant === 'interactive' ? 400 : 300,
								easing: quintOut
							}}
						>
							<!-- Swiss Option Component with Variant Support -->
							<div
								class="swiss-option-card"
								class:selected={selectedAnswer === option.id}
								class:disabled={loading || !isReady || isSubmitting}
								class:interactive={variant === 'interactive'}
								onclick={() => !isSubmitting && (selectedAnswer = option.id)}
								role="button"
								tabindex={variant === 'interactive' ? 0 : -1}
								onkeydown={(e) => {
									if (variant === 'interactive' && e.key === 'Enter') {
										selectedAnswer = option.id;
									}
								}}
							>
								<div class="option-content">
									<div class="option-radio">
										{#if selectedAnswer === option.id}
											<div class="radio-selected"></div>
										{/if}
									</div>
									<div class="option-text">
										<h3 class="option-label">{option.label}</h3>
										{#if option.description}
											<p class="option-description">{option.description}</p>
										{/if}
									</div>
									{#if variant === 'interactive'}
										<div class="option-number">{index + 1}</div>
									{/if}
								</div>
							</div>
						</div>
					{/each}
				</div>

				<!-- Action Buttons with Variant-Specific Features -->
				<div class="action-section">
					<div class="action-buttons">
						{#if !isLastQuestion && variant !== 'simple'}
							<Button
								onclick={() => handleAction(true)}
								disabled={loading || !isReady || isSubmitting}
								variant="secondary"
								class="skip-button"
							>
								Skip
							</Button>
						{/if}

						<Button
							onclick={() => handleAction()}
							disabled={loading || !selectedAnswer || isSubmitting || !isReady}
							variant="default"
							class="submit-button"
							style="transform: scale({buttonScale})"
						>
							{#if isSubmitting}
								<span class="button-content">
									<div class="spinner"></div>
									Saving...
								</span>
							{:else}
								<span class="button-content">
									{#if isLastQuestion}
										<span>Complete Assessment</span>
										{#if variant === 'enhanced'}
											<span class="emoji">🎉</span>
										{/if}
									{:else}
										<span>Next Question</span>
										{#if variant === 'enhanced'}
											<svg class="arrow-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M9 5l7 7-7 7"
												></path>
											</svg>
										{/if}
									{/if}
								</span>
							{/if}
						</Button>
					</div>

					<!-- Answer Feedback (Enhanced variant only) -->
					{#if variant === 'enhanced' && selectedAnswer}
						<div class="answer-feedback">
							<div class="flex items-center gap-2 text-green-400 text-sm">
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M5 13l4 4L19 7"
									></path>
								</svg>
								<span>Answer selected! Click "Next Question" to continue.</span>
							</div>
						</div>
					{/if}
				</div>

				<!-- Success Feedback (Enhanced variant only) -->
				{#if variant === 'enhanced' && showSuccessFeedback}
					<div
						class="success-feedback"
						in:fly={{ y: -10, duration: 300 }}
						out:fade={{ duration: 200 }}
					>
						<div class="flex items-center gap-3 text-green-300">
							<div class="w-8 h-8 bg-green-500/30 rounded-full flex items-center justify-center">
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M5 13l4 4L19 7"
									></path>
								</svg>
							</div>
							<div>
								<p class="font-medium text-green-200">{successMessage}</p>
								<p class="text-xs text-green-400 mt-1">
									Your response has been recorded successfully
								</p>
							</div>
						</div>
					</div>
				{/if}

				<!-- Transition Overlay (Interactive variant only) -->
				{#if variant === 'interactive' && showTransition}
					<div class="transition-overlay" in:fade={{ duration: 200 }} out:fade={{ duration: 300 }}>
						<div class="transition-content" in:scale={{ duration: 400, easing: elasticOut }}>
							<div class="transition-icon">✨</div>
							<div class="transition-message">{transitionMessage}</div>
						</div>
					</div>
				{/if}

				<!-- Celebration Overlay (Enhanced variant only) -->
				{#if variant === 'enhanced' && showCelebration}
					<div class="celebration-overlay" in:fade={{ duration: 300 }}>
						<div class="celebration-content">
							<div class="celebration-emojis">
								<span class="emoji-bounce" style="animation-delay: 0s">🎉</span>
								<span class="emoji-bounce" style="animation-delay: 0.1s">🎊</span>
								<span class="emoji-bounce" style="animation-delay: 0.2s">✨</span>
								<span class="emoji-bounce" style="animation-delay: 0.3s">🌟</span>
								<span class="emoji-bounce" style="animation-delay: 0.4s">🎯</span>
							</div>
							<h2 class="celebration-title">Assessment Complete!</h2>
							<p class="celebration-message">Amazing job! Processing your workplace insights...</p>
							<div class="celebration-progress"></div>
						</div>
					</div>
				{/if}
			</div>
		{:else}
			<!-- No Assessment State -->
			<div class="no-quiz-container" in:fade={{ duration: 300 }}>
				<div class="glass-card rounded-3xl p-12">
					<div class="text-center">
						<div class="text-4xl mb-4">🎭</div>
						<h3 class="text-xl font-semibold text-slate-300 mb-2">Assessment Not Available</h3>
						<p class="text-slate-400">Please check your session code and try again.</p>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	/* Base Styles */
	.quiz-wrapper {
		min-height: 100vh;
		background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%);
		position: relative;
		overflow: hidden;
		padding: 1rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.quiz-wrapper.interactive {
		background: linear-gradient(135deg, #0f0a19 0%, #1e1b4b 50%, #0f0a19 100%);
	}

	.glass-card {
		background: rgba(255, 255, 255, 0.05);
		backdrop-filter: blur(20px);
		border: 1px solid rgba(255, 255, 255, 0.1);
		box-shadow:
			0 20px 60px rgba(0, 0, 0, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.1);
	}


	.option-content {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
	}

	.option-radio {
		flex-shrink: 0;
		width: 1.25rem;
		height: 1.25rem;
		border-radius: 50%;
		border: 2px solid rgba(148, 163, 184, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
	}


	.radio-selected {
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 50%;
		background: white;
	}

	.option-text {
		flex: 1;
	}

	.option-label {
		font-size: 1rem;
		font-weight: 600;
		color: #e2e8f0;
		margin-bottom: 0.25rem;
	}

	.option-description {
		font-size: 0.875rem;
		color: #94a3b8;
		line-height: 1.4;
	}

	.option-number {
		flex-shrink: 0;
		width: 2rem;
		height: 2rem;
		border-radius: 50%;
		background: rgba(148, 163, 184, 0.2);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.875rem;
		font-weight: 600;
		color: #94a3b8;
	}

	/* Action Section */
	.action-section {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.action-buttons {
		display: flex;
		gap: 0.75rem;
	}



	.button-content {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
	}

	.spinner {
		width: 1rem;
		height: 1rem;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top-color: white;
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}

	.arrow-icon {
		width: 1rem;
		height: 1rem;
	}

	.emoji {
		font-size: 1.125rem;
	}

	/* Feedback Styles */
	.success-feedback {
		padding: 1rem;
		background: rgba(34, 197, 94, 0.1);
		border: 1px solid rgba(34, 197, 94, 0.2);
		border-radius: 0.75rem;
		margin-top: 1rem;
	}

	.answer-feedback {
		margin-top: 1rem;
		padding: 0.75rem;
		background: rgba(34, 197, 94, 0.1);
		border: 1px solid rgba(34, 197, 94, 0.2);
		border-radius: 0.75rem;
	}

	/* Keyboard Hints */
	.keyboard-hints {
		display: flex;
		justify-content: center;
		gap: 1rem;
		margin-top: 1rem;
	}

	.hint {
		font-size: 0.75rem;
		color: #94a3b8;
		padding: 0.25rem 0.5rem;
		background: rgba(148, 163, 184, 0.1);
		border-radius: 0.25rem;
	}

	/* Overlay Styles */
	.transition-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(10px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 100;
	}

	.transition-content {
		text-align: center;
		padding: 2rem;
	}

	.transition-icon {
		font-size: 3rem;
		margin-bottom: 1rem;
		animation: icon-spin 1s ease-in-out;
	}

	.celebration-overlay {
		position: fixed;
		inset: 0;
		background: linear-gradient(135deg, rgba(168, 85, 247, 0.9), rgba(236, 72, 153, 0.9));
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 200;
	}

	.celebration-content {
		text-align: center;
		padding: 2rem;
	}

	.celebration-emojis {
		display: flex;
		justify-content: center;
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.emoji-bounce {
		font-size: 3rem;
		animation: bounce 1s ease-in-out infinite;
	}

	.celebration-title {
		font-size: 2.5rem;
		font-weight: 700;
		color: white;
		margin-bottom: 0.5rem;
	}

	.celebration-message {
		font-size: 1.125rem;
		color: rgba(255, 255, 255, 0.9);
		margin-bottom: 2rem;
	}

	.celebration-progress {
		width: 12rem;
		height: 0.5rem;
		background: rgba(255, 255, 255, 0.3);
		border-radius: 9999px;
		margin: 0 auto;
		overflow: hidden;
	}

	.celebration-progress::after {
		content: '';
		display: block;
		height: 100%;
		background: white;
		animation: progress-fill 2s ease-out forwards;
	}

	/* Container Styles */
	.loading-container,
	.error-container,
	.sync-container,
	.no-quiz-container {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
	}

	/* Animations */
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	@keyframes icon-spin {
		0% {
			transform: rotate(0) scale(0);
		}
		50% {
			transform: rotate(180deg) scale(1.2);
		}
		100% {
			transform: rotate(360deg) scale(1);
		}
	}

	@keyframes bounce {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-20px);
		}
	}

	@keyframes progress-fill {
		from {
			width: 0;
		}
		to {
			width: 100%;
		}
	}


	/* Gradient Text */
	.gradient-text {
		background: linear-gradient(135deg, #a855f7, #ec4899);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	/* Mobile Optimizations */
	@media (max-width: 640px) {

		.question-title {
			font-size: 1.5rem;
		}

		.question-description {
			font-size: 0.875rem;
		}

		.keyboard-hints {
			display: none;
		}

		.action-buttons {
			flex-direction: column;
		}


	}

	/* Accessibility */
	@media (prefers-reduced-motion: reduce) {
		* {
			animation: none !important;
			transition: none !important;
		}
	}
</style>
