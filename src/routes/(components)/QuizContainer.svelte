<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { getQuizState } from '../[code]/quiz.svelte.ts';
	import { Card, Button } from '$lib/components';
	import QuestionCard from './QuestionCard.svelte';
	import QuizOptionCard from './QuizOptionCard.svelte';
	import Progress from '$lib/components/ui/Progress.svelte';
	import { fly, fade } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';

	const quiz = getQuizState(page.params.code as string);
	const {
		currentQuestion,
		loading,
		participant,
		currentAnswer,
		error,
		isLastQuestion,
		progressPercent
	} = quiz;
	let selectedAnswer = $state('');
	let showSuccessFeedback = $state(false);
	let successMessage = $state('');
	let isSubmitting = $state(false);
	let showCelebration = $state(false);
	let buttonScale = $state(1);

	// Simple quiz initialization
	$effect(() => {
		const sessionCode = page.params.code as string;
		if (!sessionCode || !/^[A-Z0-9]+-[0-9]{6}$/.test(sessionCode)) {
			goto('/');
			return;
		}

		// Check for participant ID in localStorage if not already loaded
		if (!participant?.id) {
			const storedParticipantId = localStorage.getItem(`participant_${sessionCode}`);
			if (storedParticipantId) {
				// Load participant data using stored ID
				quiz.loadQuizState(sessionCode, storedParticipantId);
			} else {
				// No participant found, redirect to join
				goto(`/${sessionCode}`);
				return;
			}
		} else {
			// Participant already loaded, just refresh state
			quiz.loadQuizState(sessionCode, participant.id);
		}
	});

	// Sync selected answer with current question's answer
	$effect(() => {
		// Only sync if we're not in the middle of submitting
		if (!isSubmitting) {
			selectedAnswer = currentAnswer;
		}
	});

	// Reset selected answer when question changes
	$effect(() => {
		// When currentQuestion changes, reset selectedAnswer
		// This ensures options update correctly for new question
		if (currentQuestion?.id) {
			selectedAnswer = currentAnswer;
		}
	});

	async function handleAction(skipAnswer?: boolean) {
		const answer = skipAnswer ? '' : selectedAnswer;
		if (!skipAnswer && !answer) return;

		isSubmitting = true;
		buttonScale = 0.95;

		// Add button press animation
		setTimeout(() => (buttonScale = 1), 150);

		try {
			const result = await quiz.submitAnswer(answer);
			if (!result.success) {
				isSubmitting = false;
				return;
			}

			// Enhanced success feedback
			if (!skipAnswer) {
				showSuccessFeedback = true;
				successMessage = 'Answer saved successfully! 🎉';

				// Auto-hide success message
				setTimeout(() => {
					showSuccessFeedback = false;
					successMessage = '';
				}, 2500);
			}

			// Celebration animation for last question
			if (isLastQuestion) {
				showCelebration = true;
				setTimeout(() => (showCelebration = false), 2000);

				// Complete quiz after celebration
				setTimeout(async () => {
					const completion = await quiz.completeQuiz();
					if (completion.success) {
						goto(`/${page.params.code}/complete`);
					}
				}, 1500);
			} else {
				// Smooth transition to next question
				setTimeout(() => {
					quiz.nextQuestion();
					selectedAnswer = '';
					isSubmitting = false;
				}, 800);
			}
		} catch (error) {
			isSubmitting = false;
			console.error('Error submitting answer:', error);
		}
	}
</script>

<div
	class="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center px-4 py-8"
>
	<!-- Animated background orbs -->
	<div class="floating-orbs">
		<div class="orb orb-1"></div>
		<div class="orb orb-2"></div>
		<div class="orb orb-3"></div>
		<div class="orb orb-4"></div>
	</div>

	<div class="max-w-3xl w-full relative" in:fly={{ y: 20, duration: 500, easing: quintOut }}>
		{#if loading}
			<div class="glass-card rounded-3xl p-12">
				<div class="text-center">
					<div class="w-16 h-16 mx-auto mb-4">
						<div
							class="w-full h-full rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin"
						></div>
					</div>
					<p class="text-lg text-slate-300">Loading quiz...</p>
				</div>
			</div>
		{:else if error}
			<div class="glass-card rounded-3xl p-12 border-red-500/20">
				<div class="text-center">
					<div class="text-4xl mb-4">⚠️</div>
					<h3 class="text-xl font-semibold text-red-400 mb-2">Error Loading Quiz</h3>
					<p class="text-slate-400 mb-6">{error}</p>
					<Button
						onclick={() => location.reload()}
						class="bg-gradient-to-r from-red-500 to-pink-500">Try Again</Button
					>
				</div>
			</div>
		{:else if currentQuestion}
			<div class="glass-card rounded-3xl p-8">
				<!-- Enhanced Progress Header -->
				<div class="mb-8">
					<div class="text-center mb-6">
						<h1 class="text-3xl font-bold gradient-text mb-2">Workplace Preferences</h1>
						<p class="text-slate-400">
							Question {quiz.currentQuestionIndex + 1} of {quiz.totalQuestions}
						</p>
					</div>

					<!-- Progress with Next Question Preview -->
					<div class="relative">
						<Progress
							value={progressPercent}
							max={100}
							color="gradient"
							showLabel={false}
							class="mb-2"
						/>

						<!-- Next Question Preview -->
						{#if !isLastQuestion}
							<div
								class="mt-4 p-4 bg-slate-800/30 backdrop-blur-sm rounded-xl border border-slate-600/30"
							>
								<div class="flex items-center gap-3">
									<div
										class="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold"
									>
										{quiz.currentQuestionIndex + 2}
									</div>
									<div class="flex-1">
										<p class="text-xs text-slate-400 mb-1">Next Question</p>
										<p class="text-sm text-slate-200 font-medium">
											{quiz.questions[quiz.currentQuestionIndex + 1]?.question || 'Loading...'}
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
						{:else}
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
										<p class="text-sm text-green-200 font-medium">
											Complete your workplace profile!
										</p>
									</div>
								</div>
							</div>
						{/if}
					</div>
				</div>

				<!-- Question -->
				<div class="mb-8" in:fade={{ duration: 300 }}>
					<h2 class="text-2xl font-semibold text-slate-200 mb-3">
						{currentQuestion.question}
					</h2>
					{#if currentQuestion.description}
						<p class="text-slate-400">
							{currentQuestion.description}
						</p>
					{/if}
				</div>

				<!-- Options with new design -->
				<div class="space-y-3 mb-8">
					{#each currentQuestion.options as option, index}
						<div in:fly={{ x: -20, delay: index * 50, duration: 400, easing: quintOut }}>
							<QuizOptionCard
								id={option.id}
								label={option.label}
								description={option.description}
								selected={selectedAnswer === option.id}
								disabled={loading}
								onSelect={(id) => (selectedAnswer = id)}
								{index}
							/>
						</div>
					{/each}
				</div>

				<!-- Action Buttons -->
				<div class="flex gap-4">
					<Button
						onclick={() => handleAction()}
						disabled={loading || !selectedAnswer || isSubmitting}
						class="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-3 rounded-xl transition-all duration-300 transform hover:scale-[1.02] disabled:transform-none disabled:hover:scale-100"
						style="transform: scale({buttonScale})"
					>
						{#if loading}
							<div class="flex items-center gap-2">
								<div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
								<span>Saving...</span>
							</div>
						{:else}
							<div class="flex items-center gap-2">
								{#if isLastQuestion}
									<span>Complete Quiz</span>
									<span class="text-lg">🎉</span>
								{:else}
									<span>Next Question</span>
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M9 5l7 7-7 7"
										></path>
									</svg>
								{/if}
							</div>
						{/if}
					</Button>
					{#if !isLastQuestion}
						<Button
							onclick={() => handleAction(true)}
							disabled={loading}
							class="px-6 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 border border-slate-600 rounded-xl transition-all duration-300 hover:border-slate-500"
						>
							Skip
						</Button>
					{/if}
				</div>

				<!-- Answer Feedback -->
				{#if selectedAnswer}
					<div class="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
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

				<!-- Success Feedback -->
				{#if showSuccessFeedback}
					<div
						class="mt-4 p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl animate-pulse"
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

				<!-- Celebration Animation -->
				{#if showCelebration}
					<div
						class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
						in:fade={{ duration: 300 }}
						out:fade={{ duration: 500 }}
					>
						<div class="text-center space-y-6">
							<!-- Confetti Animation -->
							<div class="relative">
								<div class="text-8xl animate-bounce">🎉</div>
								<div class="absolute -top-4 -left-4 text-4xl animate-spin">✨</div>
								<div class="absolute -top-2 -right-4 text-3xl animate-pulse">🎊</div>
								<div
									class="absolute -bottom-4 left-2 text-4xl animate-bounce"
									style="animation-delay: 0.2s"
								>
									🎈
								</div>
								<div
									class="absolute -bottom-2 right-2 text-3xl animate-spin"
									style="animation-delay: 0.4s"
								>
									⭐
								</div>
							</div>

							<div class="space-y-2">
								<h2 class="text-3xl font-bold text-white">Quiz Complete!</h2>
								<p class="text-xl text-purple-200">
									Congratulations on finishing your workplace preferences assessment!
								</p>
								<p class="text-lg text-slate-300">Your results are being processed...</p>
							</div>

							<!-- Progress indicator -->
							<div class="w-64 mx-auto">
								<div class="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
									<div
										class="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse"
									></div>
								</div>
							</div>
						</div>
					</div>
				{/if}
			</div>
		{:else}
			<div class="glass-card rounded-3xl p-12">
				<div class="text-center">
					<div class="text-4xl mb-4">🎭</div>
					<h3 class="text-xl font-semibold text-slate-300 mb-2">Quiz Not Available</h3>
					<p class="text-slate-400">Please check your session code and try again.</p>
				</div>
			</div>
		{/if}
	</div>
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

	/* Celebration animation keyframes */
	@keyframes sparkle {
		0%,
		100% {
			transform: scale(1) rotate(0deg);
			opacity: 1;
		}
		50% {
			transform: scale(1.2) rotate(180deg);
			opacity: 0.8;
		}
	}
</style>
