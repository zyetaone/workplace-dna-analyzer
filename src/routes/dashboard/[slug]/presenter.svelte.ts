/**
 * Presenter State Management with Svelte 5 Runes
 * Handles live session presentation state and real-time updates
 */

import type { Session, Participant } from '$lib/server/db/schema';
import type { ConnectionStatus } from '$lib/types';

/**
 * Presenter State Class - Live Session Management
 */
export class PresenterState {
	// Core state with $state runes
	private _session = $state<Session | null>(null);
	private _participants = $state<Participant[]>([]);
	private _isPolling = $state(false);
	private _pollInterval = $state<number | null>(null);
	private _connectionStatus = $state<ConnectionStatus>('disconnected');
	private _lastUpdate = $state(new Date());
	private _error = $state<string | null>(null);
	private _activeTab = $state('overview');
	private _isGeneratingInsights = $state(false);
	private _aiInsights = $state<string[]>([]);

	// Getters for read access
	get session() { return this._session; }
	get participants() { return this._participants; }
	get isPolling() { return this._isPolling; }
	get pollInterval() { return this._pollInterval; }
	get connectionStatus() { return this._connectionStatus; }
	get lastUpdate() { return this._lastUpdate; }
	get error() { return this._error; }
	get activeTab() { return this._activeTab; }
	get isGeneratingInsights() { return this._isGeneratingInsights; }
	get aiInsights() { return this._aiInsights; }

	// Derived values using $derived runes
	slug = $derived(this._session?.slug || '');
	sessionCode = $derived(this._session?.code || '');
	sessionUrl = $derived.by(() => {
		if (!this._session || typeof window === 'undefined') return '';
		return `${window.location.origin}/dashboard/${this._session.slug}/join`;
	});

	qrCodeData = $derived.by(() => {
		if (!this._session || typeof window === 'undefined') return '';
		return `${window.location.origin}/dashboard/${this._session.slug}/p/${this._session.id}/join`;
	});

	isActive = $derived(this._session?.isActive || false);
	hasParticipants = $derived(this._participants.length > 0);
	
	activeParticipants = $derived(
		this._participants.filter(p => !p.completed)
	);
	
	completedParticipants = $derived(
		this._participants.filter(p => p.completed)
	);
	
	activeCount = $derived(this.activeParticipants.length);
	completedCount = $derived(this.completedParticipants.length);
	totalCount = $derived(this._participants.length);
	
	responseRate = $derived(
		this.totalCount > 0 
			? Math.round((this.completedCount / this.totalCount) * 100) 
			: 0
	);

	canGenerateInsights = $derived(
		this.completedCount >= 3 && !this._isGeneratingInsights
	);

	statusMessage = $derived.by(() => {
		if (this._connectionStatus === 'disconnected') return 'Disconnected';
		if (this._connectionStatus === 'connecting') return 'Connecting...';
		if (this._connectionStatus === 'error') return 'Connection Error';
		if (this.isActive) return 'Session Active';
		return 'Session Paused';
	});

	statusColor = $derived.by(() => {
		if (this._connectionStatus === 'error') return 'text-red-500';
		if (this._connectionStatus === 'disconnected') return 'text-gray-500';
		if (this._connectionStatus === 'connecting') return 'text-yellow-500';
		if (this.isActive) return 'text-green-500';
		return 'text-orange-500';
	});

	// Mutation methods
	setSession(session: Session | null) {
		this._session = session;
		this._lastUpdate = new Date();
	}

	setParticipants(participants: Participant[]) {
		this._participants = participants;
		this._lastUpdate = new Date();
	}

	addParticipant(participant: Participant) {
		const exists = this._participants.some(p => p.id === participant.id);
		if (!exists) {
			this._participants.push(participant);
			this._lastUpdate = new Date();
		}
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

	setConnectionStatus(status: ConnectionStatus) {
		this._connectionStatus = status;
	}

	setError(error: string | null) {
		this._error = error;
	}

	setActiveTab(tab: string) {
		this._activeTab = tab;
	}

	setPolling(isPolling: boolean, interval: number | null = null) {
		this._isPolling = isPolling;
		this._pollInterval = interval;
	}

	toggleSessionActive() {
		if (this._session) {
			this._session.isActive = !this._session.isActive;
		}
	}

	setGeneratingInsights(generating: boolean) {
		this._isGeneratingInsights = generating;
	}

	setAIInsights(insights: string[]) {
		this._aiInsights = insights;
	}

	addAIInsight(insight: string) {
		if (!this._aiInsights.includes(insight)) {
			this._aiInsights.push(insight);
		}
	}

	// Initialize presenter session
	initialize(session: Session, participants: Participant[] = []) {
		this._session = session;
		this._participants = participants;
		this._connectionStatus = 'connected';
		this._lastUpdate = new Date();
		this._error = null;
	}

	// Process real-time update
	processUpdate(update: { type: string; payload: any }) {
		switch (update.type) {
			case 'participant_joined':
				this.addParticipant(update.payload);
				break;
			case 'participant_updated':
				this.updateParticipant(update.payload.id, update.payload);
				break;
			case 'participant_completed':
				this.updateParticipant(update.payload.id, { 
					completed: true, 
					...update.payload 
				});
				break;
			case 'participant_left':
				this.removeParticipant(update.payload.id);
				break;
			case 'session_updated':
				if (this._session) {
					Object.assign(this._session, update.payload);
				}
				break;
		}
		this._lastUpdate = new Date();
	}

	// Get participant by ID
	getParticipant(id: string): Participant | undefined {
		return this._participants.find(p => p.id === id);
	}

	// Check if participant exists
	hasParticipant(id: string): boolean {
		return this._participants.some(p => p.id === id);
	}

	// Get recent participants (last 5 joined)
	getRecentParticipants(limit: number = 5): Participant[] {
		return [...this._participants]
			.sort((a, b) => {
				const dateA = new Date(a.createdAt).getTime();
				const dateB = new Date(b.createdAt).getTime();
				return dateB - dateA;
			})
			.slice(0, limit);
	}

	// Get completion timeline data
	getCompletionTimeline() {
		const timeline: { time: string; count: number }[] = [];
		const completed = this.completedParticipants;
		
		if (completed.length === 0) return timeline;

		// Group by hour
		const hourGroups = new Map<string, number>();
		completed.forEach(p => {
			if (p.completedAt) {
				const hour = new Date(p.completedAt).toISOString().slice(0, 13);
				hourGroups.set(hour, (hourGroups.get(hour) || 0) + 1);
			}
		});

		// Convert to array
		hourGroups.forEach((count, time) => {
			timeline.push({ time, count });
		});

		return timeline.sort((a, b) => a.time.localeCompare(b.time));
	}

	// Reset state
	reset() {
		this._session = null;
		this._participants = [];
		this._connectionStatus = 'disconnected';
		this._isPolling = false;
		this._pollInterval = null;
		this._lastUpdate = new Date();
		this._error = null;
		this._activeTab = 'overview';
		this._isGeneratingInsights = false;
		this._aiInsights = [];
	}

	// Cleanup (for component unmount)
	cleanup() {
		if (this._pollInterval) {
			this._isPolling = false;
			this._pollInterval = null;
		}
		this._connectionStatus = 'disconnected';
	}
}

// Factory function for creating presenter state instances
export function createPresenterState(): PresenterState {
	return new PresenterState();
}

// Export types for convenience
export type { Session, Participant, ConnectionStatus };