<!--
  Simplified Quiz Component - Clean API with Form Actions
  Usage: <Quiz {questions} {options} action="?/completeQuiz" />
-->
<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import QuestionRenderer from './QuestionRenderer.svelte';
	import { fade, fly } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import type { QuizQuestionComponent } from '$lib/types';

	// Props interface
	interface Props {
		/** Array of quiz questions */
		questions: QuizQuestionComponent[];
		/** Quiz configuration options */
		options?: {
			/** Quiz type: survey or assessment */
			type?: 'survey' | 'assessment';
			/** Allow skipping questions */
			allowSkip?: boolean;
			/** Show progress bar */
			showProgress?: boolean;
			/** Auto-advance after answer */
			autoAdvance?: boolean;
			/** Time limit in seconds */
			timeLimit?: number;
			/** Custom CSS classes */
			class?: string;
		};
		/** Form action URL for saving responses */
		action?: string;
	}

	let { questions, options = {}, action = '?/saveAnswer' }: Props = $props();

	// Default options
	const defaultOptions = {
		type: 'survey',
		allowSkip: true,
		showProgress: true,
		autoAdvance: false,
		timeLimit: null,
		class: ''
	};

	const config = { ...defaultOptions, ...options };

	// Simple local state only
	let currentIndex = $state(0);
	let responses = $state<Record<string, any>>({});
	let isSubmitting = $state(false);
	let showResults = $state(false);
	let timeRemaining = $state(config.timeLimit);
	let result = $state<any>(null);

	// Computed values
	let currentQuestion = $derived(questions[currentIndex]);
	let progress = $derived(questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0);
	let canGoNext = $derived(currentIndex < questions.length - 1);
	let canGoBack = $derived(currentIndex > 0);
	let isComplete = $derived(currentIndex >= questions.length - 1);
	let canProceed = $derived(currentQuestion && responses[currentQuestion.id] !== undefined);

	// Timer effect
	$effect(() => {
		if (config.timeLimit && !showResults && timeRemaining > 0) {
			const interval = setInterval(() => {
				timeRemaining = Math.max(0, timeRemaining - 1);
				if (timeRemaining <= 0) {
					handleComplete();
				}
			}, 1000);

			return () => clearInterval(interval);
		}
	});

	// Form enhancement result handler
	function handleResult({ result: actionResult, update }: any) {
		isSubmitting = false;

		if (actionResult.type === 'success') {
			// Handle successful response save
			if (canGoNext && config.autoAdvance) {
				setTimeout(() => nextQuestion(), 500);
			} else if (isComplete) {
				showResults = true;
				result = actionResult.data;
			}
		} else if (actionResult.type === 'error') {
			console.error('Form action error:', actionResult.error);
		}

		update();
	}

	function handleAnswer(answer: any) {
		if (currentQuestion) {
			responses[currentQuestion.id] = answer;
		}
	}

	function nextQuestion() {
		if (canGoNext) {
			currentIndex++;
		}
	}

	function previousQuestion() {
		if (canGoBack) {
			currentIndex--;
		}
	}

	function skipQuestion() {
		if (config.allowSkip && currentQuestion && !currentQuestion.required) {
			responses[currentQuestion.id] = null;
			nextQuestion();
		}
	}

	async function handleComplete() {
		isSubmitting = true;
		showResults = true;
	}

	function handleRestart() {
		currentIndex = 0;
		responses = {};
		showResults = false;
		timeRemaining = config.timeLimit;
		result = null;
	}
</script>

<div class={[
	'max-w-3xl mx-auto p-4',
	config.class,
	config.type === 'assessment' && 'quiz-assessment'
].filter(Boolean)}>
	<!-- Timer display -->
	{#if config.timeLimit && timeRemaining !== null}
		<div
			class={[
				'card-elevated mb-4 flex items-center justify-center gap-2 font-semibold',
				timeRemaining < 60 && 'border-orange-500/50 bg-orange-500/20'
			]}
		>
			<span class="text-lg">⏱️</span>
			<span>
				{Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
			</span>
		</div>
	{/if}

	<!-- Progress bar -->
	{#if config.showProgress}
		<div class="w-full h-2 bg-gray-200 rounded-full mb-2 overflow-hidden relative">
			<div class="h-full bg-purple-600 rounded-full transition-all duration-300 ease-out" style="width: {progress}%"></div>
		</div>
		<div class="text-center text-sm text-gray-600 mb-4">
			Question {currentIndex + 1} of {questions.length} ({Math.round(progress)}%)
		</div>
	{/if}

	<!-- Quiz content -->
	{#if showResults}
		<!-- Results view -->
		<div in:fade={{ duration: 300 }} class="min-h-96 flex items-center justify-center">
			<div class="card-glass p-8 text-center">
				<h2 class="mb-4 text-2xl font-bold text-white">Quiz Complete! 🎉</h2>
				<p class="mb-6 text-lg text-gray-300">
					Thank you for completing the {config.type === 'assessment' ? 'assessment' : 'survey'}.
				</p>

				{#if result}
					<div class="text-left card-default mb-6 p-6">
						<h3 class="mb-4 text-lg font-semibold">Your Results</h3>
						<pre class="overflow-auto rounded bg-gray-900 p-4 text-left text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
					</div>
				{/if}

				<button class="btn-primary btn-lg" onclick={handleRestart}> Take Again </button>
			</div>
		</div>
	{:else if currentQuestion}
		<!-- Question view -->
		<div in:fly={{ y: 20, duration: 400, easing: quintOut }}>
			<form method="POST" {action} use:enhance={handleResult}>
				<input type="hidden" name="questionId" value={currentQuestion.id} />
				<input
					type="hidden"
					name="response"
					value={JSON.stringify(responses[currentQuestion.id])}
				/>
				<input type="hidden" name="participantId" value="anonymous" />
				<input type="hidden" name="sessionCode" value={page.params.code || 'default'} />

				<QuestionRenderer
					question={currentQuestion}
					value={responses[currentQuestion.id]}
					onAnswer={handleAnswer}
					disabled={isSubmitting}
				/>

				<!-- Navigation -->
				<div class="flex justify-between items-center mt-8 pt-4 border-t border-gray-300">
					{#if canGoBack}
						<button
							type="button"
							class="btn-secondary btn-md"
							onclick={previousQuestion}
							disabled={isSubmitting}
						>
							← Previous
						</button>
					{/if}

					<div class="flex gap-2">
						{#if config.allowSkip && !currentQuestion.required}
							<button
								type="button"
								class="btn-ghost btn-md"
								onclick={skipQuestion}
								disabled={isSubmitting}
							>
								Skip
							</button>
						{/if}

						{#if canGoNext}
							<button
								type="button"
								class="btn-primary btn-md"
								onclick={nextQuestion}
								disabled={!canProceed || isSubmitting}
							>
								Next →
							</button>
						{:else}
							<button
								type="submit"
								class="btn-primary btn-md"
								disabled={!canProceed || isSubmitting}
							>
								{#if isSubmitting}
									<span class="inline-block w-4 h-4 border-2 border-gray-400 border-t-purple-600 rounded-full animate-spin"></span>
									Completing...
								{:else}
									Complete Quiz 🎉
								{/if}
							</button>
						{/if}
					</div>
				</div>
			</form>
		</div>
	{:else}
		<!-- Intro screen -->
		<div class="card-glass p-8 text-center" in:fade={{ duration: 300 }}>
			<div class="space-y-6">
				<h1 class="mb-4 text-3xl font-bold text-white">
					{config.type === 'assessment' ? 'Assessment' : 'Quick Survey'}
				</h1>
				<p class="mb-8 text-lg text-gray-300">
					{config.type === 'assessment'
						? 'Discover your preferences through targeted questions'
						: 'Share your feedback through a few quick questions'}
				</p>

				<div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
					<div class="card-default flex flex-col items-center gap-2 p-4">
						<span class="text-2xl">⚡</span>
						<span class="text-sm font-medium text-gray-300">
							{questions.length} question{questions.length !== 1 ? 's' : ''}
						</span>
					</div>
					<div class="card-default flex flex-col items-center gap-2 p-4">
						<span class="text-2xl">🔒</span>
						<span class="text-sm font-medium text-gray-300">Anonymous</span>
					</div>
					<div class="card-default flex flex-col items-center gap-2 p-4">
						<span class="text-2xl">📊</span>
						<span class="text-sm font-medium text-gray-300">Instant results</span>
					</div>
				</div>

				<button class="btn-primary btn-lg" onclick={() => (currentIndex = 0)}>
					Start {config.type === 'assessment' ? 'Assessment' : 'Survey'}
				</button>
			</div>
		</div>
	{/if}
</div>

<!-- No styles needed - fully using Tailwind classes -->
