import type { Participant, PreferenceScores } from '$lib/server/db/schema';
import type { Question, Option } from '$lib/questions';
import type { Generation } from '$lib/types';
import { questions as defaultQuestions } from '$lib/questions';

/**
 * Quiz State Management Class
 * Handles participant quiz state with Svelte 5 runes
 */
export class QuizState {
	// Core state
	private _participant = $state<Participant | null>(null);
	private _sessionId = $state<string>('');
	private _sessionSlug = $state<string>('');
	private _currentQuestionIndex = $state<number>(0);
	private _responses = $state<Record<number, string>>({});
	private _questions = $state<Question[]>(defaultQuestions);
	private _isSubmitting = $state<boolean>(false);
	private _isCompleted = $state<boolean>(false);
	private _error = $state<string | null>(null);

	// Simple property getters (just return private state values)
	get participant() {
		return this._participant;
	}

	get sessionId() {
		return this._sessionId;
	}

	get sessionSlug() {
		return this._sessionSlug;
	}

	get currentQuestionIndex() {
		return this._currentQuestionIndex;
	}

	get responses() {
		return this._responses;
	}

	get questions() {
		return this._questions;
	}

	get isSubmitting() {
		return this._isSubmitting;
	}

	get isCompleted() {
		return this._isCompleted;
	}

	get error() {
		return this._error;
	}

	// Derived computed values using $derived runes
	currentQuestion = $derived(this._questions[this._currentQuestionIndex]);
	
	progress = $derived(
		this._questions.length > 0 
			? ((this._currentQuestionIndex + 1) / this._questions.length) * 100 
			: 0
	);
	
	answeredCount = $derived(Object.keys(this._responses).length);
	
	remainingQuestions = $derived(this._questions.length - this.answeredCount);
	
	isLastQuestion = $derived(this._currentQuestionIndex === this._questions.length - 1);
	
	canProceed = $derived(
		this._responses[this._currentQuestionIndex] !== undefined && 
		!this._isSubmitting
	);
	
	selectedOption = $derived.by(() => {
		const responseId = this._responses[this._currentQuestionIndex];
		if (!responseId || !this.currentQuestion) return null;
		
		return this.currentQuestion.options?.find(opt => opt.id === responseId) || null;
	});
	
	generation = $derived.by(() => {
		// Get generation from first question response
		const genResponse = this._responses[0];
		if (!genResponse) return null;

		const generationMap: Record<string, Generation> = {
			'baby_boomer': 'Baby Boomer',
			'gen_x': 'Gen X',
			'millennial': 'Millennial',
			'gen_z': 'Gen Z'
		};

		return generationMap[genResponse] || null;
	});
	
	preferenceScores = $derived.by(() => this.calculateScores());
	
	completionPercentage = $derived(
		this._questions.length > 0 
			? Math.round((this.answeredCount / this._questions.length) * 100)
			: 0
	);

	// Initialization
	initialize(participant: Participant, sessionId: string, sessionSlug: string, questions?: Question[]) {
		this._participant = participant;
		this._sessionId = sessionId;
		this._sessionSlug = sessionSlug;
		
		if (questions) {
			this._questions = questions;
		}

		// Restore previous responses
		if (participant.responses && typeof participant.responses === 'object') {
			this._responses = participant.responses as Record<number, string>;
			
			// Find where they left off
			for (let i = 0; i < this._questions.length; i++) {
				if (!this._responses[i]) {
					this._currentQuestionIndex = i;
					break;
				}
			}

			// Check if already completed
			if (this.answeredCount === this._questions.length && participant.completed) {
				this._isCompleted = true;
			}
		}

		// Set completed status
		if (participant.completed) {
			this._isCompleted = true;
		}
	}

	// Response management
	selectOption(optionId: string) {
		if (this._isSubmitting) return;
		
		this._responses[this._currentQuestionIndex] = optionId;
		this._error = null;
	}

	isOptionSelected(optionId: string): boolean {
		return this._responses[this._currentQuestionIndex] === optionId;
	}

	// Navigation
	nextQuestion() {
		if (this._currentQuestionIndex < this._questions.length - 1) {
			this._currentQuestionIndex++;
			this._error = null;
			return true;
		}
		return false;
	}

	previousQuestion() {
		if (this._currentQuestionIndex > 0) {
			this._currentQuestionIndex--;
			this._error = null;
			return true;
		}
		return false;
	}

	goToQuestion(index: number) {
		if (index >= 0 && index < this._questions.length) {
			this._currentQuestionIndex = index;
			this._error = null;
			return true;
		}
		return false;
	}

	// Submission state
	setSubmitting(value: boolean) {
		this._isSubmitting = value;
	}

	setError(error: string | null) {
		this._error = error;
	}

	setCompleted(value: boolean) {
		this._isCompleted = value;
	}

	// Score calculation
	private calculateScores(): PreferenceScores {
		const scores = {
			collaboration: 0,
			formality: 0,
			tech: 0,
			wellness: 0
		};

		let questionCount = 0;

		// Map responses to preference categories
		Object.entries(this._responses).forEach(([qIndex, optionId]) => {
			const question = this._questions[parseInt(qIndex)];
			if (!question || !question.options) {
				return;
			}

			// Find the selected option
			const selectedOption = question.options.find(opt => opt.id === optionId);
			if (!selectedOption) {
				return;
			}

			// Skip questions without values (like generation question at index 0)
			if (!selectedOption.values) {
				return;
			}

			// Add the option's values to our scores
			scores.collaboration += selectedOption.values.collaboration || 0;
			scores.formality += selectedOption.values.formality || 0;
			scores.tech += selectedOption.values.tech || 0;
			scores.wellness += selectedOption.values.wellness || 0;
			questionCount++;
		});

		// Calculate average scores (0-10 scale)
		if (questionCount > 0) {
			scores.collaboration = Math.round(scores.collaboration / questionCount);
			scores.formality = Math.round(scores.formality / questionCount);
			scores.tech = Math.round(scores.tech / questionCount);
			scores.wellness = Math.round(scores.wellness / questionCount);
		}

		return scores;
	}

	// Validation
	validateCurrentResponse(): boolean {
		const response = this._responses[this._currentQuestionIndex];
		if (!response) {
			this._error = 'Please select an option before proceeding';
			return false;
		}
		
		const question = this.currentQuestion;
		if (!question) {
			this._error = 'Invalid question';
			return false;
		}

		// Validate that the selected option exists
		const validOption = question.options?.some(opt => opt.id === response);
		if (!validOption) {
			this._error = 'Invalid option selected';
			return false;
		}

		this._error = null;
		return true;
	}

	// Check if all questions are answered
	isQuizComplete(): boolean {
		for (let i = 0; i < this._questions.length; i++) {
			if (!this._responses[i]) {
				return false;
			}
		}
		return true;
	}

	// Get unanswered question indices
	getUnansweredQuestions(): number[] {
		const unanswered: number[] = [];
		for (let i = 0; i < this._questions.length; i++) {
			if (!this._responses[i]) {
				unanswered.push(i);
			}
		}
		return unanswered;
	}

	// Reset methods
	resetResponses() {
		this._responses = {};
		this._currentQuestionIndex = 0;
		this._isCompleted = false;
		this._error = null;
	}

	resetToQuestion(index: number) {
		// Clear responses from this question onwards
		for (let i = index; i < this._questions.length; i++) {
			delete this._responses[i];
		}
		this._currentQuestionIndex = index;
		this._isCompleted = false;
		this._error = null;
	}

	// Export responses for saving
	exportResponses(): Record<number, string> {
		return { ...this._responses };
	}

	// Import responses (for restoring state)
	importResponses(responses: Record<number, string>) {
		this._responses = { ...responses };
		
		// Find the next unanswered question
		for (let i = 0; i < this._questions.length; i++) {
			if (!this._responses[i]) {
				this._currentQuestionIndex = i;
				return;
			}
		}
		
		// If all answered, go to last question
		this._currentQuestionIndex = Math.max(0, this._questions.length - 1);
	}

	// Get summary for display
	getSummary() {
		return {
			participantName: this._participant?.name || 'Unknown',
			generation: this.generation,
			answeredQuestions: this.answeredCount,
			totalQuestions: this._questions.length,
			completionPercentage: this.completionPercentage,
			scores: this.preferenceScores,
			isCompleted: this._isCompleted
		};
	}

	// Cleanup method
	cleanup() {
		this._participant = null;
		this._sessionId = '';
		this._sessionSlug = '';
		this._currentQuestionIndex = 0;
		this._responses = {};
		this._isSubmitting = false;
		this._isCompleted = false;
		this._error = null;
	}
}

// Factory function for creating quiz state instances
export function createQuizState(): QuizState {
	return new QuizState();
}

// Export types for convenience
export type { Question, Option, PreferenceScores, Generation };