/**
 * Global Application State Store
 * Uses Svelte 5 $state rune for reactive state management
 */

import type { Session, Participant, PreferenceScores } from '$lib/server/db/schema';

interface QuizQuestion {
	id: number;
	text: string;
	options: Array<{
		text: string;
		scores: Partial<PreferenceScores>;
	}>;
}

interface Analytics {
	totalParticipants: number;
	completedParticipants: number;
	averageScores: PreferenceScores;
	generationBreakdown: Record<string, number>;
	completionRate: number;
	activeNow: number;
}

class AppState {
	// Core session data
	session = $state<Session | null>(null);
	participants = $state<Participant[]>([]);
	
	// Current participant state (for quiz takers)
	currentParticipant = $state<Participant | null>(null);
	currentQuestionIndex = $state<number>(0);
	responses = $state<Record<number, any>>({});
	
	// Analytics data
	analytics = $state<Analytics | null>(null);
	
	// Loading states
	isLoading = $state<boolean>(false);
	isSaving = $state<boolean>(false);
	
	// Error state
	error = $state<string | null>(null);
	
	// Derived values
	activeParticipants = $derived(
		this.participants.filter(p => !p.completed)
	);
	
	completedParticipants = $derived(
		this.participants.filter(p => p.completed)
	);
	
	participantCount = $derived(this.participants.length);
	
	activeCount = $derived(this.activeParticipants.length);
	
	completionRate = $derived(() => {
		if (this.participantCount === 0) return 0;
		return Math.round((this.completedParticipants.length / this.participantCount) * 100);
	});
	
	isSessionActive = $derived(this.session?.isActive ?? false);
	
	sessionCode = $derived(this.session?.code ?? '');
	
	// Methods for state mutations
	setSession(session: Session | null) {
		this.session = session;
	}
	
	setParticipants(participants: Participant[]) {
		this.participants = participants;
	}
	
	addParticipant(participant: Participant) {
		this.participants = [...this.participants, participant];
	}
	
	updateParticipant(id: string, updates: Partial<Participant>) {
		this.participants = this.participants.map(p => 
			p.id === id ? { ...p, ...updates } : p
		);
	}
	
	removeParticipant(id: string) {
		this.participants = this.participants.filter(p => p.id !== id);
	}
	
	setCurrentParticipant(participant: Participant | null) {
		this.currentParticipant = participant;
		if (participant?.responses) {
			this.responses = participant.responses;
		}
	}
	
	setResponse(questionId: number, response: any) {
		this.responses[questionId] = response;
	}
	
	nextQuestion() {
		this.currentQuestionIndex++;
	}
	
	previousQuestion() {
		if (this.currentQuestionIndex > 0) {
			this.currentQuestionIndex--;
		}
	}
	
	resetQuiz() {
		this.currentQuestionIndex = 0;
		this.responses = {};
	}
	
	setAnalytics(analytics: Analytics) {
		this.analytics = analytics;
	}
	
	updateAnalytics(updates: Partial<Analytics>) {
		if (this.analytics) {
			this.analytics = { ...this.analytics, ...updates };
		}
	}
	
	setLoading(loading: boolean) {
		this.isLoading = loading;
	}
	
	setSaving(saving: boolean) {
		this.isSaving = saving;
	}
	
	setError(error: string | null) {
		this.error = error;
	}
	
	clearError() {
		this.error = null;
	}
	
	// Utility methods
	findParticipantById(id: string): Participant | undefined {
		return this.participants.find(p => p.id === id);
	}
	
	findParticipantByCookieId(cookieId: string): Participant | undefined {
		return this.participants.find(p => p.cookieId === cookieId);
	}
	
	calculateAverageScores(): PreferenceScores {
		const completed = this.completedParticipants;
		if (completed.length === 0) {
			return { collaboration: 0, formality: 0, tech: 0, wellness: 0 };
		}
		
		const totals = { collaboration: 0, formality: 0, tech: 0, wellness: 0 };
		let count = 0;
		
		for (const participant of completed) {
			if (participant.preferenceScores) {
				totals.collaboration += participant.preferenceScores.collaboration;
				totals.formality += participant.preferenceScores.formality;
				totals.tech += participant.preferenceScores.tech;
				totals.wellness += participant.preferenceScores.wellness;
				count++;
			}
		}
		
		if (count === 0) {
			return { collaboration: 0, formality: 0, tech: 0, wellness: 0 };
		}
		
		return {
			collaboration: Math.round(totals.collaboration / count),
			formality: Math.round(totals.formality / count),
			tech: Math.round(totals.tech / count),
			wellness: Math.round(totals.wellness / count)
		};
	}
	
	getGenerationBreakdown(): Record<string, number> {
		const breakdown: Record<string, number> = {};
		
		for (const participant of this.participants) {
			const generation = participant.generation || 'Unknown';
			breakdown[generation] = (breakdown[generation] || 0) + 1;
		}
		
		return breakdown;
	}
	
	// Reset methods for cleanup
	reset() {
		this.session = null;
		this.participants = [];
		this.currentParticipant = null;
		this.currentQuestionIndex = 0;
		this.responses = {};
		this.analytics = null;
		this.isLoading = false;
		this.isSaving = false;
		this.error = null;
	}
	
	resetSession() {
		this.session = null;
		this.participants = [];
		this.analytics = null;
	}
	
	resetParticipant() {
		this.currentParticipant = null;
		this.currentQuestionIndex = 0;
		this.responses = {};
	}
}

// Export singleton instance
export const appState = new AppState();

// Export type for use in components
export type { AppState, Analytics, QuizQuestion };