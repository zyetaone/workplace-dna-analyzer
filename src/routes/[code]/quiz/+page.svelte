<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { questions } from '$lib/questions';
	import { getQuizState, saveQuizAnswer, completeQuiz } from '../participant.remote';

	// State management
	let selectedAnswer = $state<string>('');
	let isSubmitting = $state(false);
	let isLoading = $state(true);
	let currentQuestionIndex = $state(0);
	let error = $state<string>('');
	
	// Loading states for different UI scenarios
	let isNavigatingToComplete = $state(false);
	let showSubmitLoading = $derived(isSubmitting || isNavigatingToComplete);

	// Quiz data
	let participant = $state<any>(null);
	let session = $state<any>(null);
	let participantId = $state<string>('');

	// Derived values
	let currentQuestion = $derived(
		currentQuestionIndex < questions.length ? questions[currentQuestionIndex] : null
	);

	let progressPercentage = $derived(
		(currentQuestionIndex / questions.length) * 100
	);

	let isLastQuestion = $derived(currentQuestionIndex === questions.length - 1);

	// Load quiz state on mount
	$effect(() => {
		const sessionCode = page.params.code as string;
		if (!sessionCode) return;

		// Generate participant ID (will be handled by server cookie)
		const currentParticipantId = crypto.randomUUID();

		getQuizState({ sessionCode, participantId: currentParticipantId })
			.then(data => {
				if ('error' in data) {
					error = data.error;
					goto(`/${sessionCode}`);
					return;
				}

				if ('redirect' in data) {
					goto(data.redirect);
					return;
				}

				// Set quiz data
				participant = data.participant;
				session = data.session;
				participantId = data.participant.id; // Use participant ID from server
				
				// Set current question index based on responses
				const responses = data.responses || {};
				currentQuestionIndex = Object.keys(responses).length;
			})
			.catch(err => {
				error = err instanceof Error ? err.message : 'Failed to load quiz';
				goto(`/${sessionCode}`);
			})
			.finally(() => {
				isLoading = false;
			});
	});

	// Handle answer submission and progression
	async function handleAnswer(answer: string) {
		if (isSubmitting || !participantId) return;

		isSubmitting = true;
		error = '';

		try {
			// Save the answer
			const result = await saveQuizAnswer({
				participantId,
				questionIndex: currentQuestionIndex,
				answer
			});

			if (!result.success) {
				error = result.error || 'Failed to save answer';
				return;
			}

			// Progress to next question or complete quiz
			if (isLastQuestion) {
				isNavigatingToComplete = true;
				const completion = await completeQuiz({ 
					sessionCode: page.params.code as string, 
					participantId 
				});
				if (completion.success) {
					// Don't reset isSubmitting here - let navigation handle loading
					goto(`/${page.params.code}/complete`);
					return;
				} else {
					error = completion.error || 'Failed to complete quiz';
					isSubmitting = false;
					isNavigatingToComplete = false;
				}
			} else {
				// Move to next question
				currentQuestionIndex++;
				selectedAnswer = '';
				isSubmitting = false;
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'An unexpected error occurred';
			isSubmitting = false;
		}
	}

	// Handle form submission
	function onSubmit() {
		if (selectedAnswer) {
			handleAnswer(selectedAnswer);
		}
	}

	// Handle skip question
	function onSkip() {
		handleAnswer(''); // Empty answer for skip
	}
</script>

<div class="min-h-screen animated-gradient flex items-center justify-center px-4">
	{#if isLoading}
		<div class="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full text-center">
			<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto"></div>
			<p class="mt-4 text-gray-600">Loading quiz...</p>
		</div>
	{:else if error}
		<div class="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full text-center">
			<h2 class="text-2xl font-bold text-red-600 mb-4">Error</h2>
			<p class="text-gray-600">{error}</p>
		</div>
	{:else if !currentQuestion}
		<div class="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full text-center">
			<h2 class="text-2xl font-bold text-gray-800 mb-4">Quiz Complete!</h2>
			<p class="text-gray-600">Redirecting to results...</p>
		</div>
	{:else}
		<div class="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full">
			<!-- Progress Bar -->
			<div class="mb-6">
				<div class="flex justify-between text-sm text-gray-600 mb-2">
					<span>Question {currentQuestionIndex + 1} of {questions.length}</span>
					<span>{Math.round(progressPercentage)}% Complete</span>
				</div>
				<div class="h-3 bg-gray-200 rounded-full overflow-hidden">
					<div
						class="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500 ease-out"
						style="width: {progressPercentage}%"
					></div>
				</div>
			</div>

			<!-- Question -->
			<div class="mb-8">
				<h2 class="text-2xl font-bold text-gray-800 mb-2">
					{currentQuestion.title}
				</h2>
				{#if currentQuestion.subtitle}
					<p class="text-gray-600">{currentQuestion.subtitle}</p>
				{/if}
			</div>

			<!-- Answer Options -->
			<div class="space-y-3 mb-6">
				{#each currentQuestion.options || [] as option}
					<label class="relative cursor-pointer block">
						<input
							type="radio"
							name="answer"
							value={option.id}
							bind:group={selectedAnswer}
							class="sr-only peer"
							disabled={showSubmitLoading}
						/>
						<div class="p-4 border-2 border-gray-200 rounded-lg transition-all peer-checked:border-blue-500 peer-checked:bg-blue-50 hover:border-gray-300">
							<div class="flex items-start">
								{#if option.emoji}
									<span class="text-2xl mr-3">{option.emoji}</span>
								{/if}
								<div class="flex-1">
									<div class="font-medium text-gray-800">{option.label}</div>
									{#if option.description}
										<div class="text-sm text-gray-600 mt-1">{option.description}</div>
									{/if}
								</div>
							</div>
						</div>
					</label>
				{/each}
			</div>

			{#if error}
				<div class="p-3 bg-red-50 text-red-700 rounded-lg mb-4">
					{error}
				</div>
			{/if}

			<!-- Action Buttons -->
			<div class="flex gap-3">
				<button
					onclick={onSubmit}
					disabled={showSubmitLoading || !selectedAnswer}
					class="flex-1 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
				>
					{#if showSubmitLoading}
						<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
						<span>{isNavigatingToComplete ? 'Completing...' : 'Submitting...'}</span>
					{:else}
						<span>{isLastQuestion ? 'Complete Quiz' : 'Next Question'}</span>
					{/if}
				</button>

				{#if !isLastQuestion}
					<button
						onclick={onSkip}
						disabled={showSubmitLoading}
						class="px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
					>
						Skip
					</button>
				{/if}
			</div>

			<!-- Participant Info -->
			{#if participant}
				<div class="mt-6 pt-4 border-t border-gray-200">
					<div class="flex justify-between text-sm text-gray-500">
						<span>{participant.name}</span>
						<span>Session: {page.params.code}</span>
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.animated-gradient {
		background: linear-gradient(-45deg, #667eea, #764ba2, #f093fb, #f5576c);
		background-size: 400% 400%;
		animation: gradient 15s ease infinite;
	}
	
	@keyframes gradient {
		0% { background-position: 0% 50%; }
		50% { background-position: 100% 50%; }
		100% { background-position: 0% 50%; }
	}
</style>