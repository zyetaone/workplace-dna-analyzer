/**
 * OPTIMIZED QUIZ STATE MANAGEMENT
 * Extends unified base state manager with quiz-specific functionality
 */

import type { Participant, PreferenceScores } from '$lib/server/db/schema';
import { RealtimeStateManager, stateRegistry } from './BaseStateManager.svelte';

// SSE Event Types
export type SSEEventType =
	| 'participant_joined'
	| 'answer_submitted'
	| 'quiz_completed'
	| 'participant_left'
	| 'session_ended';

export interface SSEMessage {
	type: SSEEventType;
	sessionCode: string;
	participant?: Participant;
	questionIndex?: number;
	answer?: string;
	scores?: PreferenceScores;
	timestamp: Date;
}

/**
 * Optimized Quiz Session State Manager
 * Extends RealtimeStateManager with quiz-specific functionality
 */
export class QuizSessionState extends RealtimeStateManager {
	// Server-computed analytics (lazy-loaded)
	analytics = $state<any>(null);
	insights = $state<any[]>([]);

	// Lightweight computed properties (client-side)
	get averageScore() {
		if (this.analytics?.averageScores) {
			// Use server-computed analytics if available
			const scores = this.analytics.averageScores;
			return Math.round(
				(scores.collaboration + scores.formality + scores.tech + scores.wellness) / 4
			);
		}

		// Fallback to client-side computation if needed
		const completed = this.completedParticipants;
		if (completed.length === 0) return 0;

		const totalScores = completed.reduce((sum, p) => {
			if (!p.preferenceScores) return sum;
			const scores = p.preferenceScores;
			return sum + scores.collaboration + scores.formality + scores.tech + scores.wellness;
		}, 0);

		return Math.round(totalScores / (completed.length * 4));
	}

	// Lazy-loaded detailed analytics
	get detailedAnalytics() {
		return this.analytics;
	}

	// Optimized insights access
	get sessionInsights() {
		return this.insights;
	}

	// Implement abstract methods from RealtimeStateManager
	protected handleRealtimeMessage(message: SSEMessage) {
		switch (message.type) {
			case 'participant_joined':
				if (message.participant) {
					this.addParticipant(message.participant);
				}
				break;

			case 'answer_submitted':
				if (message.participant) {
					this.updateParticipant(message.participant.id, message.participant);
				}
				break;

			case 'quiz_completed':
				if (message.participant) {
					this.updateParticipant(message.participant.id, {
						...message.participant,
						completed: true,
						completedAt: new Date().toISOString(),
						preferenceScores: message.scores
					});
				}
				break;

			case 'participant_left':
				if (message.participant) {
					this.removeParticipant(message.participant.id);
				}
				break;

			case 'session_ended':
				if (this.session) {
					this.updateSession({ ...this.session, isActive: false });
				}
				break;
		}
	}

	protected async attemptReconnect(sessionCode: string): Promise<void> {
		// Use the protected connectSSE method from parent class
		const sseUrl = `/api/sse/${sessionCode}`;
		await (this as any).connectSSE(sseUrl, sessionCode);
	}

	// Enhanced session initialization with better error handling
	async initSession(sessionCode: string) {
		this.setLoading(true);
		this.setError(null);

		try {
			// Connect to SSE stream first
			await this.attemptReconnect(sessionCode);

			// Load initial session data
			const response = await fetch(`/api/session/${sessionCode}`);
			if (!response.ok) throw new Error('Failed to load session');

			const data = await response.json();
			this.updateSession(data.session);

			// Initialize participants
			if (data.participants) {
				this.updateParticipants(data.participants);
			}

			// Load server-computed analytics if participants exist
			if (data.participants && data.participants.some((p: any) => p.completed)) {
				await this.loadAnalytics(sessionCode);
			}
		} catch (err) {
			this.setError(err instanceof Error ? err.message : 'Failed to initialize session');
			console.error('Session init error:', err);
		} finally {
			this.setLoading(false);
		}
	}

	// Load server-computed analytics
	async loadAnalytics(sessionCode: string) {
		try {
			const { getSessionAnalytics } = await import('../../routes/data.remote');
			const analyticsData = await getSessionAnalytics({ code: sessionCode });

			this.analytics = analyticsData.analytics;
			this.insights = analyticsData.insights || [];
		} catch (err) {
			console.warn('Failed to load server analytics, using client-side computation:', err);
			// Analytics will remain null, client-side computation will be used as fallback
		}
	}

	// Enhanced cleanup
	destroy() {
		// Call parent destroy first
		super.destroy();
	}
}

// Optimized singleton instance management
const sessionStates = new Map<string, QuizSessionState>();

/**
 * Get or create a quiz session state instance
 */
export function getQuizSessionState(sessionCode: string): QuizSessionState {
	if (!sessionStates.has(sessionCode)) {
		const state = new QuizSessionState();
		sessionStates.set(sessionCode, state);
		// Register with global registry for better cleanup
		stateRegistry.register(`quiz-${sessionCode}`, state);
		state.initSession(sessionCode);
	}

	return sessionStates.get(sessionCode)!;
}

/**
 * Clear a session state instance
 */
export function clearQuizSessionState(sessionCode: string) {
	const state = sessionStates.get(sessionCode);
	if (state) {
		state.destroy();
		sessionStates.delete(sessionCode);
		stateRegistry.unregister(`quiz-${sessionCode}`);
	}
}

/**
 * Clear all session states
 */
export function clearAllQuizSessionStates() {
	sessionStates.forEach((state, sessionCode) => {
		state.destroy();
		stateRegistry.unregister(`quiz-${sessionCode}`);
	});
	sessionStates.clear();
}
