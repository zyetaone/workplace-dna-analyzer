/**
 * UNIFIED STATE MANAGEMENT - Clean Svelte 5 Runes
 * Consolidated base state management for admin and AI functionality
 */

import type { Session, Participant } from '../../lib/server/db/schema';

/**
 * Base State Management Class
 * Provides common state management patterns for session-based components
 */
export abstract class BaseSessionState {
	session = $state<Session | null>(null);
	participants = $state<Participant[]>([]);
	loading = $state(false);
	error = $state<string | null>(null);

	// Common computed properties
	hasSession = $derived(this.session !== null);
	hasParticipants = $derived(this.participants.length > 0);
	activeParticipants = $derived(this.participants.filter((p) => !p.completed));
	completedParticipants = $derived(this.participants.filter((p) => p.completed));
	completionRate = $derived.by(() => {
		if (this.participants.length === 0) return 0;
		return Math.round((this.completedParticipants.length / this.participants.length) * 100);
	});

	// Common methods
	updateSession(session: Session) {
		this.session = session;
	}

	updateParticipants(participants: Participant[]) {
		this.participants = participants;
	}

	setLoading(loading: boolean) {
		this.loading = loading;
	}

	setError(error: string | null) {
		this.error = error;
	}

	// Optimistic updates
	optimisticUpdateParticipant(participantId: string, updates: Partial<Participant>) {
		this.participants = this.participants.map((p) =>
			p.id === participantId ? { ...p, ...updates } : p
		);
	}

	optimisticRemoveParticipant(participantId: string) {
		this.participants = this.participants.filter((p) => p.id !== participantId);
	}

	// Cleanup
	cleanup() {
		this.session = null;
		this.participants = [];
		this.loading = false;
		this.error = null;
	}
}

export interface SessionWithCounts extends Session {
	activeCount: number;
	completedCount: number;
}

// Core reactive state
let sessions = $state<SessionWithCounts[]>([]);
let currentSession = $state<Session | null>(null);
let participants = $state<Participant[]>([]);
let isLoading = $state(false);
let error = $state<string | null>(null);

// Simple computed properties
const hasActiveSessions = $derived(sessions.some((s) => s.isActive));
const totalParticipants = $derived(
	sessions.reduce((sum, s) => sum + s.activeCount + s.completedCount, 0)
);
const completionRate = $derived.by(() => {
	const completed = sessions.reduce((sum, s) => sum + s.completedCount, 0);
	const total = totalParticipants;
	return total > 0 ? Math.round((completed / total) * 100) : 0;
});

// Admin stats
const adminStats = $derived({
	totalSessions: sessions.length,
	activeSessions: sessions.filter((s) => s.isActive).length,
	totalParticipants: totalParticipants,
	completionRate: completionRate
});

// Simple functions
export function setSessions(newSessions: SessionWithCounts[]) {
	sessions = [...newSessions];
}

export function setCurrentSession(session: Session | null) {
	currentSession = session;
}

export function setParticipants(newParticipants: Participant[]) {
	participants = [...newParticipants];
}

export function setLoading(loading: boolean) {
	isLoading = loading;
}

export function setError(err: string | null) {
	error = err;
}

// Export reactive state getters
export function getSessions() {
	return sessions;
}
export function getCurrentSession() {
	return currentSession;
}
export function getParticipants() {
	return participants;
}
export function getIsLoading() {
	return isLoading;
}
export function getError() {
	return error;
}
export function getHasActiveSessions() {
	return hasActiveSessions;
}
export function getTotalParticipants() {
	return totalParticipants;
}
export function getCompletionRate() {
	return completionRate;
}
export function getAdminStats() {
	return adminStats;
}

/**
 * Session Analytics State - Extends Base Session State
 * Specialized for admin dashboard analytics and session management
 */
export class SessionAnalyticsState extends BaseSessionState {
	// Additional computed analytics specific to admin dashboard
	activeCount = $derived(this.activeParticipants.length);
	completedCount = $derived(this.completedParticipants.length);
	hasCompletedParticipants = $derived(this.completedCount > 0);
	completionRate = $derived.by(() => {
		const total = this.participants.length;
		return total > 0 ? Math.round((this.completedCount / total) * 100) : 0;
	});

	// Analytics method for components
	analytics() {
		return {
			activeCount: this.activeCount,
			completedCount: this.completedCount,
			completionRate: this.completionRate,
			responseRate: this.completionRate, // Same as completion rate
			totalCount: this.participants.length,
			totalParticipants: this.participants.length,
			generationDistribution: this.getGenerationDistribution(),
			preferenceScores: this.getAverageScores(),
			wordCloudData: []
		};
	}

	// Insights placeholder - simplified
	insights = $state<any>(null);

	// Specialized methods for admin dashboard
	optimisticEndSession() {
		if (this.session) {
			this.session = { ...this.session, isActive: false };
		}
	}

	rollbackEndSession() {
		if (this.session) {
			this.session = { ...this.session, isActive: true };
		}
	}

	rollbackRemoveParticipant(originalParticipants: Participant[]) {
		this.participants = [...originalParticipants];
	}

	getGenerationDistribution() {
		const distribution: Record<string, number> = {};
		this.participants.forEach((p) => {
			const gen = p.generation || 'Unknown';
			distribution[gen] = (distribution[gen] || 0) + 1;
		});
		return distribution;
	}

	getAverageScores() {
		const completedParticipants = this.participants.filter(
			(p) => p.completed && p.preferenceScores
		);
		if (completedParticipants.length === 0) {
			return { collaboration: 0, formality: 0, tech: 0, wellness: 0 };
		}

		const totals = { collaboration: 0, formality: 0, tech: 0, wellness: 0 };
		completedParticipants.forEach((p) => {
			if (p.preferenceScores) {
				const scores = p.preferenceScores as any;
				totals.collaboration += scores.collaboration || 0;
				totals.formality += scores.formality || 0;
				totals.tech += scores.tech || scores.technology || 0;
				totals.wellness += scores.wellness || 0;
			}
		});

		return {
			collaboration: Math.round(totals.collaboration / completedParticipants.length),
			formality: Math.round(totals.formality / completedParticipants.length),
			tech: Math.round(totals.tech / completedParticipants.length),
			wellness: Math.round(totals.wellness / completedParticipants.length)
		};
	}

	cleanup() {
		this.session = null;
		this.participants = [];
		this.loading = false;
		this.error = null;
	}
}

// Session store instances
const sessionStores = new Map<string, SessionAnalyticsState>();

export function getSessionStore(sessionCode: string): SessionAnalyticsState {
	if (!sessionStores.has(sessionCode)) {
		sessionStores.set(sessionCode, new SessionAnalyticsState());
	}
	return sessionStores.get(sessionCode)!;
}

export function clearSessionStore(sessionCode: string) {
	const store = sessionStores.get(sessionCode);
	if (store) {
		store.cleanup();
		sessionStores.delete(sessionCode);
	}
}
