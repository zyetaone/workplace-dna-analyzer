/**
 * Admin dashboard state management with reactive analytics
 */

import type { Session, Participant, PreferenceScores } from '$lib/types';
import { calculatePreferenceScores, getWorkplaceDNA } from '$lib/utils/scoring';

interface AdminState {
	session: Session | null;
	participants: Participant[];
	loading: boolean;
	error: string | null;
	aiInsights: string[];
}

interface Analytics {
	activeCount: number;
	completedCount: number;
	responseRate: number;
	preferenceScores: PreferenceScores;
	generationDistribution: Record<string, number>;
	wordCloudData: Array<{ text: string; size: number }>;
	workplaceDNA: string | null;
}

export class AdminDashboardState {
	// Reactive state
	private state = $state<AdminState>({
		session: null,
		participants: [],
		loading: false,
		error: null,
		aiInsights: []
	});

	// Direct state accessors
	readonly session = $derived(this.state.session);
	readonly participants = $derived(this.state.participants);
	readonly loading = $derived(this.state.loading);
	readonly error = $derived(this.state.error);
	readonly aiInsights = $derived(this.state.aiInsights);

	// Session derived values
	readonly sessionCode = $derived(this.state.session?.code || '');
	readonly isActive = $derived(this.state.session?.isActive || false);
	readonly sessionUrl = $derived.by(() => {
		if (!this.state.session || typeof window === 'undefined') return '';
		return `${window.location.origin}/${this.state.session.code}`;
	});

	// Computed analytics
	readonly analytics = $derived.by(() => this.computeAnalytics());

	/**
	 * Initialize state with data from server
	 */
	initialize(session: Session | null, participants: Participant[] = []) {
		this.state.session = session;
		this.state.participants = participants;
		this.state.error = null;
	}

	/**
	 * Update session data
	 */
	updateSession(updates: Partial<Session>) {
		if (this.state.session) {
			this.state.session = { ...this.state.session, ...updates };
		}
	}

	/**
	 * Update participants list
	 */
	setParticipants(participants: Participant[]) {
		this.state.participants = participants;
	}

	/**
	 * Remove a participant
	 */
	removeParticipant(id: string) {
		this.state.participants = this.state.participants.filter(p => p.id !== id);
	}

	/**
	 * Set AI insights
	 */
	setAIInsights(insights: string[]) {
		this.state.aiInsights = insights;
	}

	/**
	 * Set loading state
	 */
	setLoading(loading: boolean) {
		this.state.loading = loading;
	}

	/**
	 * Set error state
	 */
	setError(error: string | null) {
		this.state.error = error;
		if (error) this.state.loading = false;
	}

	/**
	 * Compute analytics from participants data
	 */
	private computeAnalytics(): Analytics {
		const { participants } = this.state;
		
		// Basic counts
		const activeCount = participants.length;
		const completedCount = participants.filter(p => p.completed).length;
		const responseRate = activeCount > 0 ? Math.round((completedCount / activeCount) * 100) : 0;
		
		// Calculate average preference scores
		const preferenceScores = this.calculateAverageScores();
		
		// Generation distribution
		const generationDistribution = this.calculateGenerationDistribution();
		
		// Word cloud data from responses
		const wordCloudData = this.generateWordCloudData();
		
		// Workplace DNA
		const workplaceDNA = completedCount > 0 ? getWorkplaceDNA(preferenceScores) : null;
		
		return {
			activeCount,
			completedCount,
			responseRate,
			preferenceScores,
			generationDistribution,
			wordCloudData,
			workplaceDNA
		};
	}

	/**
	 * Calculate average preference scores from all completed participants
	 */
	private calculateAverageScores(): PreferenceScores {
		const completed = this.state.participants.filter(p => p.completed);
		
		if (completed.length === 0) {
			return { collaboration: 0, formality: 0, tech: 0, wellness: 0 };
		}
		
		const totals = { collaboration: 0, formality: 0, tech: 0, wellness: 0 };
		
		for (const participant of completed) {
			// Parse responses from JSON string if needed
			const responses = typeof participant.responses === 'string' 
				? JSON.parse(participant.responses) 
				: participant.responses;
			
			if (Array.isArray(responses) && responses.length > 0) {
				const scores = calculatePreferenceScores(responses);
				totals.collaboration += scores.collaboration;
				totals.formality += scores.formality;
				totals.tech += scores.tech;
				totals.wellness += scores.wellness;
			}
		}
		
		// Calculate averages
		return {
			collaboration: Math.round(totals.collaboration / completed.length),
			formality: Math.round(totals.formality / completed.length),
			tech: Math.round(totals.tech / completed.length),
			wellness: Math.round(totals.wellness / completed.length)
		};
	}

	/**
	 * Calculate generation distribution
	 */
	private calculateGenerationDistribution(): Record<string, number> {
		const distribution: Record<string, number> = {};
		
		for (const participant of this.state.participants) {
			const gen = participant.generation || 'Unknown';
			distribution[gen] = (distribution[gen] || 0) + 1;
		}
		
		return distribution;
	}

	/**
	 * Generate word cloud data from participant responses
	 */
	private generateWordCloudData(): Array<{ text: string; size: number }> {
		const wordFreq: Record<string, number> = {};
		const completed = this.state.participants.filter(p => p.completed);
		
		// Concept keywords based on answers
		const conceptMap: Record<string, string[]> = {
			'collaboration': ['teamwork', 'collaboration', 'together', 'cooperative', 'shared'],
			'independence': ['autonomy', 'independent', 'solo', 'individual', 'freedom'],
			'structure': ['organized', 'structured', 'formal', 'process', 'systematic'],
			'flexibility': ['flexible', 'adaptive', 'agile', 'dynamic', 'casual'],
			'technology': ['digital', 'innovative', 'tech', 'modern', 'automated'],
			'traditional': ['classic', 'conventional', 'proven', 'established', 'standard'],
			'wellness': ['wellbeing', 'balance', 'health', 'mindful', 'sustainable'],
			'performance': ['results', 'achievement', 'productivity', 'excellence', 'growth']
		};
		
		// Analyze responses and build word frequency
		for (const participant of completed) {
			const responses = typeof participant.responses === 'string' 
				? JSON.parse(participant.responses) 
				: participant.responses;
			
			if (Array.isArray(responses)) {
				const scores = calculatePreferenceScores(responses);
				
				// Add concepts based on scores
				if (scores.collaboration >= 7) {
					conceptMap.collaboration.forEach(word => {
						wordFreq[word] = (wordFreq[word] || 0) + 1;
					});
				} else if (scores.collaboration <= 3) {
					conceptMap.independence.forEach(word => {
						wordFreq[word] = (wordFreq[word] || 0) + 1;
					});
				}
				
				if (scores.formality >= 7) {
					conceptMap.structure.forEach(word => {
						wordFreq[word] = (wordFreq[word] || 0) + 1;
					});
				} else if (scores.formality <= 3) {
					conceptMap.flexibility.forEach(word => {
						wordFreq[word] = (wordFreq[word] || 0) + 1;
					});
				}
				
				if (scores.tech >= 7) {
					conceptMap.technology.forEach(word => {
						wordFreq[word] = (wordFreq[word] || 0) + 1;
					});
				} else if (scores.tech <= 3) {
					conceptMap.traditional.forEach(word => {
						wordFreq[word] = (wordFreq[word] || 0) + 1;
					});
				}
				
				if (scores.wellness >= 7) {
					conceptMap.wellness.forEach(word => {
						wordFreq[word] = (wordFreq[word] || 0) + 1;
					});
				} else if (scores.wellness <= 3) {
					conceptMap.performance.forEach(word => {
						wordFreq[word] = (wordFreq[word] || 0) + 1;
					});
				}
			}
		}
		
		// Convert to word cloud format and normalize sizes
		const words = Object.entries(wordFreq).map(([text, count]) => ({
			text,
			size: 20 + (count * 15) // Base size + frequency scaling
		}));
		
		// Sort by size and limit to top 30 words
		return words.sort((a, b) => b.size - a.size).slice(0, 30);
	}

	/**
	 * Reset state
	 */
	reset() {
		this.state = {
			session: null,
			participants: [],
			loading: false,
			error: null,
			aiInsights: []
		};
	}
}

// Create and export singleton instance
export const adminState = new AdminDashboardState();