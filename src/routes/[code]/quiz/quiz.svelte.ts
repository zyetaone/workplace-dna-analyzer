/**
 * Minimal Quiz UI State
 * Only handles UI navigation and submission states
 * All logic and calculations are server-side
 */

interface QuizUIState {
	currentQuestionIndex: number;
	isSubmitting: boolean;
	error: string | null;
}

class QuizUI {
	private state = $state<QuizUIState>({
		currentQuestionIndex: 0,
		isSubmitting: false,
		error: null
	});

	// Simple getters
	get currentQuestionIndex() { return this.state.currentQuestionIndex; }
	get isSubmitting() { return this.state.isSubmitting; }
	get error() { return this.state.error; }

	// Navigation
	goToQuestion(index: number) {
		this.state.currentQuestionIndex = index;
		this.state.error = null;
	}

	next() {
		this.state.currentQuestionIndex++;
		this.state.error = null;
	}

	previous() {
		if (this.state.currentQuestionIndex > 0) {
			this.state.currentQuestionIndex--;
			this.state.error = null;
		}
	}

	// Submission state
	setSubmitting(value: boolean) {
		this.state.isSubmitting = value;
	}

	setError(error: string | null) {
		this.state.error = error;
	}

	// Reset
	reset() {
		this.state = {
			currentQuestionIndex: 0,
			isSubmitting: false,
			error: null
		};
	}
}

// Export singleton instance
export const quizUI = new QuizUI();