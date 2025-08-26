/**
 * Attendee Quiz Store
 * Manages quiz progress, responses, and score calculations
 */

import type { Question, PreferenceScores } from '$lib/types';

class AttendeeQuizStore {
	// Quiz state
	sessionId = $state<string | null>(null);
	attendeeId = $state<string | null>(null);
	attendeeName = $state<string>('');
	generation = $state<string>('');
	
	// Questions and responses
	questions = $state<Question[]>([]);
	responses = $state<Record<number, string>>({});
	currentQuestionIndex = $state(0);
	
	// Quiz status
	isLoading = $state(false);
	isSubmitting = $state(false);
	isCompleted = $state(false);
	
	// Derived values
	currentQuestion = $derived(this.questions[this.currentQuestionIndex]);
	progress = $derived(
		this.questions.length > 0 
			? ((this.currentQuestionIndex + 1) / this.questions.length) * 100 
			: 0
	);
	
	// Calculate preference scores from responses
	preferenceScores = $derived.by(() => {
		const scores = { 
			collaboration: 0, 
			formality: 0, 
			tech: 0, 
			wellness: 0 
		};
		
		let totalResponses = 0;
		
		this.questions.forEach((question, index) => {
			// Skip generation question (usually first)
			if (index === 0) return;
			
			const responseId = this.responses[index];
			if (responseId) {
				const option = question.options?.find(o => o.id === responseId);
				if (option?.values) {
					scores.collaboration += option.values.collaboration || 0;
					scores.formality += option.values.formality || 0;
					scores.tech += option.values.tech || 0;
					scores.wellness += option.values.wellness || 0;
					totalResponses++;
				}
			}
		});
		
		// Average the scores
		if (totalResponses > 0) {
			scores.collaboration = Math.round(scores.collaboration / totalResponses);
			scores.formality = Math.round(scores.formality / totalResponses);
			scores.tech = Math.round(scores.tech / totalResponses);
			scores.wellness = Math.round(scores.wellness / totalResponses);
		}
		
		return scores;
	});
	
	// Generate individual workplace DNA based on scores
	workplaceDNA = $derived.by(() => {
		const { collaboration, formality, tech, wellness } = this.preferenceScores;
		const traits = [];
		
		// Collaboration dimension
		if (collaboration >= 7) traits.push('Collaborative');
		else if (collaboration >= 4) traits.push('Balanced');
		else traits.push('Independent');
		
		// Formality dimension  
		if (formality >= 7) traits.push('Structured');
		else if (formality >= 4) traits.push('Flexible');
		else traits.push('Casual');
		
		// Technology dimension
		if (tech >= 7) traits.push('Tech-Forward');
		else if (tech >= 4) traits.push('Tech-Enabled');
		else traits.push('Traditional');
		
		// Wellness dimension
		if (wellness >= 7) traits.push('Wellness-Focused');
		else if (wellness >= 4) traits.push('Balance-Aware');
		else traits.push('Performance-Driven');
		
		return traits.join(' • ');
	});
	
	// Personality insights based on scores
	personalityInsights = $derived.by(() => {
		const { collaboration, formality, tech, wellness } = this.preferenceScores;
		const insights: string[] = [];
		
		// Collaboration insights
		if (collaboration >= 7) {
			insights.push('You thrive in team environments and value open communication');
		} else if (collaboration <= 3) {
			insights.push('You prefer focused, independent work with minimal interruptions');
		}
		
		// Formality insights
		if (formality >= 7) {
			insights.push('You appreciate structure and clear processes');
		} else if (formality <= 3) {
			insights.push('You enjoy flexibility and informal work environments');
		}
		
		// Technology insights
		if (tech >= 7) {
			insights.push('You embrace cutting-edge tools and digital solutions');
		} else if (tech <= 3) {
			insights.push('You value proven methods and face-to-face interactions');
		}
		
		// Wellness insights
		if (wellness >= 7) {
			insights.push('Work-life balance is a top priority for you');
		} else if (wellness <= 3) {
			insights.push('You are highly driven and results-focused');
		}
		
		return insights;
	});
	
	// Initialize quiz
	initialize(sessionId: string, attendeeId: string, questions: Question[]) {
		this.sessionId = sessionId;
		this.attendeeId = attendeeId;
		this.questions = questions;
		this.currentQuestionIndex = 0;
		this.responses = {};
		this.isCompleted = false;
	}
	
	// Select an option for current question
	selectOption(optionId: string) {
		this.responses[this.currentQuestionIndex] = optionId;
		
		// Store generation if it's the first question
		if (this.currentQuestionIndex === 0) {
			const option = this.currentQuestion?.options.find(o => o.id === optionId);
			if (option) {
				this.generation = option.text;
			}
		}
	}
	
	// Move to next question
	nextQuestion() {
		if (this.currentQuestionIndex < this.questions.length - 1) {
			this.currentQuestionIndex++;
			return true;
		}
		return false;
	}
	
	// Move to previous question
	previousQuestion() {
		if (this.currentQuestionIndex > 0) {
			this.currentQuestionIndex--;
			return true;
		}
		return false;
	}
	
	// Check if all questions are answered
	get allQuestionsAnswered() {
		return this.questions.every((_, index) => this.responses[index] !== undefined);
	}
	
	// Mark quiz as completed
	completeQuiz() {
		this.isCompleted = true;
	}
	
	// Reset quiz state
	reset() {
		this.sessionId = null;
		this.attendeeId = null;
		this.attendeeName = '';
		this.generation = '';
		this.questions = [];
		this.responses = {};
		this.currentQuestionIndex = 0;
		this.isLoading = false;
		this.isSubmitting = false;
		this.isCompleted = false;
	}
}

// Export singleton instance
export const attendeeQuizStore = new AttendeeQuizStore();