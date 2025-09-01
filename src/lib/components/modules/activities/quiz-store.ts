/**
 * Quiz Store - Svelte 5 State Management for Quiz Components
 * Uses runes for reactive state management
 */

export interface QuizQuestion {
	id: string;
	text: string;
	type: 'select' | 'multiselect' | 'text' | 'rating' | 'emoji';
	required?: boolean;
	options?: Array<{
		id: string;
		value: string;
		label: string;
		score?: number;
	}>;
	category?: string;
}

export interface QuizConfig {
	id: string;
	name: string;
	questions: QuizQuestion[];
	allowSkip?: boolean;
	randomizeQuestions?: boolean;
}

export interface QuizStoreParams {
	sessionId: string;
	config: QuizConfig;
	participantId: string;
}

export function createQuizStore(params: QuizStoreParams) {
	const { sessionId, config, participantId } = params;
	
	// Reactive state using Svelte 5 runes
	let currentStep = $state(0);
	let responses = $state<Record<string, any>>({});
	let isActive = $state(false);
	let isComplete = $state(false);
	let startTime = $state<Date | null>(null);
	let endTime = $state<Date | null>(null);

	// Derived state
	const questions = $derived(config.questions);
	const totalSteps = $derived(questions.length);
	const currentQuestion = $derived(questions[currentStep] || null);
	const progress = $derived(totalSteps > 0 ? Math.round((currentStep / totalSteps) * 100) : 0);
	const isLastQuestion = $derived(currentStep >= totalSteps - 1);
	const canGoBack = $derived(currentStep > 0);
	const allowSkip = $derived(config.allowSkip || false);
	
	// Check if current question has a response
	const canProceed = $derived(() => {
		if (!currentQuestion) return false;
		const response = responses[currentQuestion.id];
		return response !== undefined && response !== null && response !== '';
	});

	// Methods
	function start() {
		isActive = true;
		startTime = new Date();
		currentStep = 0;
	}

	function nextQuestion() {
		if (currentStep < totalSteps - 1) {
			currentStep++;
		}
	}

	function previousQuestion() {
		if (currentStep > 0) {
			currentStep--;
		}
	}

	function skipQuestion() {
		if (allowSkip) {
			nextQuestion();
		}
	}

	async function submitResponse(response: any) {
		if (!currentQuestion) return;
		
		// Store the response
		responses[currentQuestion.id] = response;
		
		// Auto-advance to next question if not the last
		if (!isLastQuestion) {
			nextQuestion();
		}
	}

	async function complete() {
		isComplete = true;
		isActive = false;
		endTime = new Date();
	}

	function reset() {
		currentStep = 0;
		responses = {};
		isActive = false;
		isComplete = false;
		startTime = null;
		endTime = null;
	}

	function getResponseForQuestion(questionId: string) {
		return responses[questionId];
	}

	function getResults() {
		return {
			sessionId,
			participantId,
			responses: { ...responses },
			startTime,
			endTime,
			totalQuestions: totalSteps,
			answeredQuestions: Object.keys(responses).length,
			completionPercentage: Math.round((Object.keys(responses).length / totalSteps) * 100)
		};
	}

	function loadPreviousSession() {
		// This would load from localStorage or server
		// For now, just a placeholder
		console.log('Loading previous session...');
	}

	// Return the store interface
	return {
		// State (read-only accessors)
		get currentStep() { return currentStep; },
		get currentQuestion() { return currentQuestion; },
		get totalSteps() { return totalSteps; },
		get progress() { return progress; },
		get isActive() { return isActive; },
		get isComplete() { return isComplete; },
		get isLastQuestion() { return isLastQuestion; },
		get canGoBack() { return canGoBack; },
		get canProceed() { return canProceed; },
		get allowSkip() { return allowSkip; },
		get responses() { return responses; },
		get result() { return getResults(); },

		// Methods
		start,
		nextQuestion,
		previousQuestion,
		skipQuestion,
		submitResponse,
		complete,
		reset,
		getResponseForQuestion,
		getResults,
		loadPreviousSession
	};
}

export type QuizStore = ReturnType<typeof createQuizStore>;