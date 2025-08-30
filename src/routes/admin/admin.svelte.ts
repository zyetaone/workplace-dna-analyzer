/**
 * Simplified Admin Dashboard State - Clean Svelte 5 Runes
 */

import type { Session, Participant } from '../../lib/server/db/schema';

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
 * Session store for individual session state management
 */
export class SessionAnalyticsState {
	session = $state<Session | null>(null);
	participants = $state<Participant[]>([]);
	loading = $state(false);
	error = $state<string | null>(null);

	// Computed analytics
	activeCount = $derived(this.participants.filter((p) => !p.completed).length);
	completedCount = $derived(this.participants.filter((p) => p.completed).length);
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

	// Methods
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

	optimisticEndSession() {
		if (this.session) {
			this.session = { ...this.session, isActive: false };
		}
	}

	optimisticDeleteParticipant(participantId: string) {
		this.participants = this.participants.filter((p) => p.id !== participantId);
	}

	optimisticRemoveParticipant(participantId: string) {
		// Alias for delete
		this.optimisticDeleteParticipant(participantId);
	}

	rollbackRemoveParticipant(originalParticipants: Participant[]) {
		this.participants = originalParticipants;
	}

	rollbackEndSession() {
		if (this.session) {
			this.session = { ...this.session, isActive: true };
		}
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
