/**
 * Dashboard State Management with Svelte 5 Runes
 * Modern reactive patterns with $state and $derived
 */

import type { Session, Participant, PreferenceScores } from '$lib/server/db/schema';
import type { ConnectionStatus, ParticipantUpdate, Generation, WordCloudItem } from '$lib/types';

export interface SessionWithCounts extends Session {
	activeCount: number;
	completedCount: number;
}

export interface DashboardAnalytics {
	activeCount: number;
	completedCount: number;
	totalCount: number;
	responseRate: number;
	generationDistribution: Record<Generation, number>;
	preferenceScores: PreferenceScores;
	workplaceDNA: string;
	wordCloudData: WordCloudItem[];
	lastUpdated: Date;
	generationPreferences?: undefined;
	aiInsights: string[];
}

/**
 * Dashboard State Class - Modern Svelte 5 Architecture
 */
export class DashboardState {
	// Core state with $state runes
	private _sessions = $state<SessionWithCounts[]>([]);
	private _currentSession = $state<Session | null>(null);
	private _sessionCode = $state('');
	private _sessionUrl = $state('');
	private _slug = $state('');
	private _participants = $state<Participant[]>([]);
	private _isLoading = $state(false);
	private _error = $state<string | null>(null);
	private _connectionStatus = $state<ConnectionStatus>('disconnected');
	private _lastUpdate = $state(new Date());
	private _updateQueue = $state<ParticipantUpdate[]>([]);

	// Getters for read access
	get sessions() { return this._sessions; }
	get currentSession() { return this._currentSession; }
	get sessionCode() { return this._sessionCode; }
	get sessionUrl() { return this._sessionUrl; }
	get slug() { return this._slug; }
	get participants() { return this._participants; }
	get isLoading() { return this._isLoading; }
	get error() { return this._error; }
	get connectionStatus() { return this._connectionStatus; }
	get lastUpdate() { return this._lastUpdate; }
	get updateQueue() { return this._updateQueue; }

	// Derived values using $derived runes
	completed = $derived(this._participants.filter(p => p.completed));
	totalCount = $derived(this._participants.length);
	activeCount = $derived(this.totalCount - this.completed.length);
	responseRate = $derived(
		this.totalCount > 0 
			? Math.round((this.completed.length / this.totalCount) * 100) 
			: 0
	);

	preferenceScores = $derived.by(() => {
		const completed = this.completed;
		if (completed.length === 0) {
			return { collaboration: 0, formality: 0, tech: 0, wellness: 0 };
		}

		let collab = 0, formal = 0, tech = 0, well = 0;
		completed.forEach(p => {
			if (p.preferenceScores) {
				const scores = p.preferenceScores as any;
				collab += scores.collaboration || 0;
				formal += scores.formality || 0;
				tech += scores.tech || scores.technology || 0;
				well += scores.wellness || 0;
			}
		});

		const divisor = completed.length;
		return {
			collaboration: Math.round(collab / divisor),
			formality: Math.round(formal / divisor),
			tech: Math.round(tech / divisor),
			wellness: Math.round(well / divisor)
		};
	});

	generationDistribution = $derived.by(() => {
		const distribution: Record<Generation, number> = {
			'Baby Boomer': 0,
			'Gen X': 0,
			'Millennial': 0,
			'Gen Z': 0
		};

		this.completed.forEach(p => {
			const gen = p.generation as Generation;
			if (gen && gen in distribution) {
				distribution[gen]++;
			}
		});

		return distribution;
	});

	workplaceDNA = $derived.by(() => {
		const scores = this.preferenceScores;
		const profiles = [];
		
		if (scores.collaboration >= 7) profiles.push('Collaborative');
		else if (scores.collaboration <= 3) profiles.push('Independent');
		
		if (scores.formality >= 7) profiles.push('Structured');
		else if (scores.formality <= 3) profiles.push('Flexible');
		
		if (scores.tech >= 7) profiles.push('Tech-Forward');
		else if (scores.tech <= 3) profiles.push('Traditional');
		
		if (scores.wellness >= 7) profiles.push('Wellness-Focused');
		else if (scores.wellness <= 3) profiles.push('Performance-Driven');
		
		return profiles.length > 0 ? profiles.join(' & ') : 'Balanced';
	});

	wordCloudData = $derived.by(() => {
		const scores = this.preferenceScores;
		return [
			{ text: 'Collaboration', size: 20 + scores.collaboration * 8 },
			{ text: 'Formality', size: 20 + scores.formality * 8 },
			{ text: 'Technology', size: 20 + scores.tech * 8 },
			{ text: 'Wellness', size: 20 + scores.wellness * 8 }
		];
	});

	analytics = $derived<DashboardAnalytics>({
		activeCount: this.activeCount,
		completedCount: this.completed.length,
		totalCount: this.totalCount,
		responseRate: this.responseRate,
		generationDistribution: this.generationDistribution,
		preferenceScores: this.preferenceScores,
		workplaceDNA: this.workplaceDNA,
		wordCloudData: this.wordCloudData,
		lastUpdated: this._lastUpdate,
		generationPreferences: undefined,
		aiInsights: []
	});

	hasParticipants = $derived(this._participants.length > 0);
	isActive = $derived(this._currentSession?.isActive || false);
	completionPercentage = $derived(this.responseRate);

	// Mutation methods
	setSessions(sessions: SessionWithCounts[]) {
		this._sessions = sessions;
	}

	setParticipants(participants: Participant[]) {
		this._participants = participants;
		this._lastUpdate = new Date();
	}

	setCurrentSession(session: Session | null) {
		this._currentSession = session;
		if (session) {
			this._slug = session.slug;
			this._sessionCode = session.code;
			this._sessionUrl = typeof window !== 'undefined' 
				? `${window.location.origin}/dashboard/${session.slug}/join`
				: '';
		}
	}

	updateCurrentSession(updates: Partial<Session>) {
		if (this._currentSession) {
			Object.assign(this._currentSession, updates);
		}
	}

	initSession(session: Session, participants: Participant[] = []) {
		this.setCurrentSession(session);
		this.setParticipants(participants);
		this._connectionStatus = 'connected';
	}

	setLoading(loading: boolean) {
		this._isLoading = loading;
	}

	setError(error: string | null) {
		this._error = error;
	}

	setConnectionStatus(status: ConnectionStatus) {
		this._connectionStatus = status;
	}

	addParticipant(participant: Participant) {
		this._participants.push(participant);
		this._lastUpdate = new Date();
	}

	updateParticipant(id: string, updates: Partial<Participant>) {
		const index = this._participants.findIndex(p => p.id === id);
		if (index !== -1) {
			Object.assign(this._participants[index], updates);
			this._lastUpdate = new Date();
		}
	}

	removeParticipant(id: string) {
		const index = this._participants.findIndex(p => p.id === id);
		if (index !== -1) {
			this._participants.splice(index, 1);
			this._lastUpdate = new Date();
		}
	}

	upsertParticipant(participant: Participant) {
		const index = this._participants.findIndex(p => p.id === participant.id);
		if (index >= 0) {
			this._participants[index] = participant;
		} else {
			this._participants.push(participant);
		}
		this._lastUpdate = new Date();
	}

	resetState() {
		this._sessions = [];
		this._currentSession = null;
		this._participants = [];
		this._connectionStatus = 'disconnected';
		this._isLoading = false;
		this._error = null;
		this._sessionUrl = '';
		this._sessionCode = '';
		this._slug = '';
		this._lastUpdate = new Date();
		this._updateQueue = [];
	}
}

// Create singleton instance
export const dashboardState = new DashboardState();

// Export compatibility layer for existing code
export const state = dashboardState

// Export convenience functions for backward compatibility
export const setSessions = (sessions: SessionWithCounts[]) => dashboardState.setSessions(sessions);
export const setParticipants = (participants: Participant[]) => dashboardState.setParticipants(participants);
export const setCurrentSession = (session: Session | null) => dashboardState.setCurrentSession(session);
export const updateCurrentSession = (updates: Partial<Session>) => dashboardState.updateCurrentSession(updates);
export const initSession = (session: Session, participants: Participant[] = []) => dashboardState.initSession(session, participants);
export const setLoading = (loading: boolean) => dashboardState.setLoading(loading);
export const setError = (error: string | null) => dashboardState.setError(error);
export const setConnectionStatus = (status: ConnectionStatus) => dashboardState.setConnectionStatus(status);
export const addParticipant = (participant: Participant) => dashboardState.addParticipant(participant);
export const updateParticipant = (id: string, updates: Partial<Participant>) => dashboardState.updateParticipant(id, updates);
export const removeParticipant = (id: string) => dashboardState.removeParticipant(id);
export const upsertParticipant = (participant: Participant) => dashboardState.upsertParticipant(participant);
export const resetState = () => dashboardState.resetState();

// Export derived getters for compatibility
export const getAnalytics = () => dashboardState.analytics;
export const getCompletionPercentage = () => dashboardState.completionPercentage;
export const hasParticipants = () => dashboardState.hasParticipants;
export const isActive = () => dashboardState.isActive;