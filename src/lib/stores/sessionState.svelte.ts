/**
 * Unified Session State Store using Svelte 5 patterns
 * Single source of truth for all session-related state
 */

import { SvelteMap, SvelteSet } from 'svelte/reactivity';
import { untrack } from 'svelte';
import { sse } from './sse.svelte';

// Types
export interface Session {
	id: string;
	code: string;
	name: string;
	isActive: boolean;
	createdAt: Date | string;
	updatedAt: Date | string;
	endedAt: Date | string | null;
}

export interface Attendee {
	id: string;
	sessionId: string;
	name: string;
	generation: string | null;
	responses: Record<string, any>;
	preferenceScores: {
		collaboration: number;
		formality: number;
		tech: number;
		wellness: number;
	} | null;
	completed: boolean;
	completedAt: Date | string | null;
}

export interface Analytics {
	responseRate: number;
	activeCount: number;
	completedCount: number;
	totalCount: number;
	generationDistribution: Record<string, number>;
	preferenceScores: PreferenceScores;
	generationPreferences: Record<string, any>;
	workplaceDNA: string | null;
	wordCloudData: Array<{ text: string; size: number }>;
}

export interface PreferenceScores {
	collaboration: number;
	formality: number;
	tech: number;
	wellness: number;
}

/**
 * Unified Session State Store using Svelte 5 patterns
 * Single source of truth for all session-related state
 */
class SessionState {
	// Core reactive state using Svelte 5 runes
	private sessions = $state<SvelteMap<string, Session>>(new SvelteMap());
	private attendees = $state<SvelteMap<string, Attendee>>(new SvelteMap());
	private currentSessionId = $state<string | null>(null);
	private loading = $state<SvelteSet<string>>(new SvelteSet());
	private errors = $state<SvelteMap<string, Error>>(new SvelteMap());
	private _connectionStatus = $state<'connecting' | 'connected' | 'disconnected'>('disconnected');
	
	constructor() {
		// Constructor is empty - state is reactive through runes
		// SSE event handling should be done in components using this store
	}
	
	// No memoization - direct reactive updates via SSE
	
	// === Getters for reactive state ===
	
	get isLoading() {
		return this.loading.size > 0;
	}
	
	get isConnected() {
		return this.connectionStatus === 'connected';
	}
	
	get connectionStatus() {
		return this._connectionStatus;
	}
	
	// === Current Session Derived Values ===
	
	currentSession = $derived.by(() => {
		if (!this.currentSessionId) return null;
		return this.sessions.get(this.currentSessionId) || null;
	});
	
	currentAttendees = $derived.by(() => {
		if (!this.currentSessionId) return [];
		return Array.from(this.attendees.values())
			.filter(a => a.sessionId === this.currentSessionId);
	});
	
	activeAttendees = $derived(
		this.currentAttendees.filter(a => !a.completed)
	);
	
	completedAttendees = $derived(
		this.currentAttendees.filter(a => a.completed)
	);
	
	activeCount = $derived(this.activeAttendees.length);
	completedCount = $derived(this.completedAttendees.length);
	totalCount = $derived(this.currentAttendees.length);
	
	responseRate = $derived.by(() => {
		return this.totalCount > 0 
			? Math.round((this.completedCount / this.totalCount) * 100)
			: 0;
	});
	
	// === Removed redundant analytics - use getAnalytics() method instead ===
	
	// Removed - use getAnalytics() method for generation distribution
	
	// Removed - use getAnalytics() method for preference scores
	
	// Removed - use getAnalytics() method for generation preferences
	
	// Removed - use getAnalytics() method for workplace DNA
	
	// Removed - use getAnalytics() method for word cloud data
	
	// === Actions ===
	
	setCurrentSession(sessionId: string | null) {
		this.currentSessionId = sessionId;
	}
	
	setConnectionStatus(status: 'connecting' | 'connected' | 'disconnected') {
		this._connectionStatus = status;
	}
	
	// === SSE Event Handling ===
	// Call this from components that watch SSE events
	
	handleSSEEvent(event: any) {
		if (!event) return;
		
		console.log('[SessionState] Processing SSE event:', event.type);
		
		switch (event.type) {
			case 'connected':
				this.setConnectionStatus('connected');
				break;
				
			case 'attendee_joined':
				if (event.data) {
					this.upsertAttendee(event.data);
				}
				break;
				
			case 'response_received':
				if (event.data?.attendeeId) {
					const attendee = this.attendees.get(event.data.attendeeId);
					if (attendee) {
						this.updateAttendee(event.data.attendeeId, {
							responses: { 
								...attendee.responses, 
								[event.data.questionIndex]: event.data.response 
							}
						});
					}
				}
				break;
				
			case 'attendee_completed':
				if (event.data?.attendeeId) {
					this.updateAttendee(event.data.attendeeId, {
						completed: true,
						completedAt: new Date(),
						preferenceScores: event.data.scores
					} as Partial<Attendee>);
				}
				break;
				
			case 'attendee_deleted':
				if (event.data?.attendeeId) {
					this.removeAttendee(event.data.attendeeId);
				}
				break;
				
			case 'session_ended':
				if (this.currentSession) {
					this.upsertSession({
						...this.currentSession,
						isActive: false,
						endedAt: new Date().toISOString()
					});
				}
				break;
		}
	}
	
	updateConnectionFromSSE(isConnected: boolean, isConnecting: boolean) {
		if (isConnected) {
			this.setConnectionStatus('connected');
		} else if (isConnecting) {
			this.setConnectionStatus('connecting');
		} else {
			this.setConnectionStatus('disconnected');
		}
	}
	
	// === Session Management ===
	
	upsertSession(session: Session) {
		this.sessions.set(session.id, session);
	}
	
	removeSession(sessionId: string) {
		this.sessions.delete(sessionId);
		if (this.currentSessionId === sessionId) {
			this.currentSessionId = null;
		}
	}
	
	// Attendee Management
	
	upsertAttendee(attendee: Attendee) {
		this.attendees.set(attendee.id, attendee);
	}
	
	updateAttendee(attendeeId: string, updates: Partial<Attendee>) {
		const attendee = this.attendees.get(attendeeId);
		if (attendee) {
			this.attendees.set(attendeeId, { ...attendee, ...updates });
		}
	}
	
	removeAttendee(attendeeId: string) {
		this.attendees.delete(attendeeId);
	}
	
	// Batch Operations
	
	batchUpsertAttendees(attendeeList: Attendee[]) {
		// Use untrack for performance when updating multiple items
		untrack(() => {
			attendeeList.forEach(attendee => {
				this.attendees.set(attendee.id, attendee);
			});
		});
	}
	
	// Loading State
	
	setLoading(key: string, isLoading: boolean) {
		if (isLoading) {
			this.loading.add(key);
		} else {
			this.loading.delete(key);
		}
	}
	
	// Error State
	
	setError(key: string, error: Error) {
		this.errors.set(key, error);
	}
	
	clearError(key: string) {
		this.errors.delete(key);
	}
	
	clearAllErrors() {
		this.errors.clear();
	}
	
	// SSE event handlers are now in the constructor's $effect
	
	
	// === Optimized Analytics Method ===
	
	getAnalytics(sessionId?: string): Analytics {
		
		// Compute analytics only when needed
		const attendeesList = this.currentAttendees;
		const completed = attendeesList.filter(a => a.completed);
		const totalCount = attendeesList.length;
		const completedCount = completed.length;
		
		// Generation distribution
		const genDist: Record<string, number> = {
			'Baby Boomer': 0,
			'Gen X': 0,
			'Millennial': 0,
			'Gen Z': 0
		};
		
		attendeesList.forEach(a => {
			if (a.generation && genDist[a.generation] !== undefined) {
				genDist[a.generation]++;
			}
		});
		
		// Aggregate preference scores
		let prefScores: PreferenceScores = {
			collaboration: 0,
			formality: 0,
			tech: 0,
			wellness: 0
		};
		
		if (completedCount > 0) {
			const totals = { collaboration: 0, formality: 0, tech: 0, wellness: 0 };
			
			completed.forEach(a => {
				if (a.preferenceScores) {
					totals.collaboration += a.preferenceScores.collaboration || 0;
					totals.formality += a.preferenceScores.formality || 0;
					totals.tech += a.preferenceScores.tech || 0;
					totals.wellness += a.preferenceScores.wellness || 0;
				}
			});
			
			const avg = 1 / completedCount;
			prefScores = {
				collaboration: Math.round(totals.collaboration * avg),
				formality: Math.round(totals.formality * avg),
				tech: Math.round(totals.tech * avg),
				wellness: Math.round(totals.wellness * avg)
			};
		}
		
		// Generation preferences
		const genPrefs: Record<string, any> = {};
		['Baby Boomer', 'Gen X', 'Millennial', 'Gen Z'].forEach(gen => {
			const genAttendees = completed.filter(a => a.generation === gen);
			if (genAttendees.length > 0) {
				const genTotals = { collaboration: 0, formality: 0, tech: 0, wellness: 0 };
				
				genAttendees.forEach(a => {
					if (a.preferenceScores) {
						genTotals.collaboration += a.preferenceScores.collaboration || 0;
						genTotals.formality += a.preferenceScores.formality || 0;
						genTotals.tech += a.preferenceScores.tech || 0;
						genTotals.wellness += a.preferenceScores.wellness || 0;
					}
				});
				
				const genAvg = 1 / genAttendees.length;
				genPrefs[gen] = {
					count: genAttendees.length,
					collaboration: Math.round(genTotals.collaboration * genAvg),
					formality: Math.round(genTotals.formality * genAvg),
					tech: Math.round(genTotals.tech * genAvg),
					wellness: Math.round(genTotals.wellness * genAvg)
				};
			}
		});
		
		// Workplace DNA
		let workplaceDNA: string | null = null;
		if (completedCount > 0) {
			const profiles = [];
			if (prefScores.collaboration >= 7) profiles.push('Collaborative');
			else if (prefScores.collaboration <= 3) profiles.push('Independent');
			if (prefScores.formality >= 7) profiles.push('Structured');
			else if (prefScores.formality <= 3) profiles.push('Flexible');
			if (prefScores.tech >= 7) profiles.push('Tech-Forward');
			else if (prefScores.tech <= 3) profiles.push('Traditional');
			if (prefScores.wellness >= 7) profiles.push('Wellness-Focused');
			else if (prefScores.wellness <= 3) profiles.push('Performance-Driven');
			workplaceDNA = profiles.length > 0 ? profiles.join(' & ') : 'Balanced';
		}
		
		// Word cloud data
		const wordCloudData: Array<{ text: string; size: number }> = [];
		if (completedCount > 0) {
			wordCloudData.push(
				{ text: 'Collaboration', size: 20 + prefScores.collaboration * 8 },
				{ text: 'Formality', size: 20 + prefScores.formality * 8 },
				{ text: 'Technology', size: 20 + prefScores.tech * 8 },
				{ text: 'Wellness', size: 20 + prefScores.wellness * 8 }
			);
			
			Object.entries(genPrefs).forEach(([gen, prefs]) => {
				if (prefs.count > 0) {
					wordCloudData.push({ text: gen, size: 15 + prefs.count * 5 });
				}
			});
		}
		
		const analytics: Analytics = {
			responseRate: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
			activeCount: totalCount - completedCount,
			completedCount,
			totalCount,
			generationDistribution: genDist,
			preferenceScores: prefScores,
			generationPreferences: genPrefs,
			workplaceDNA,
			wordCloudData
		};
		
		return analytics;
	}
	
	// === Cleanup ===
	
	reset() {
		this.sessions.clear();
		this.attendees.clear();
		this.currentSessionId = null;
		this.loading.clear();
		this.errors.clear();
		this._connectionStatus = 'disconnected';
	}
	
	// === Legacy compatibility methods (to be removed) ===
	
	async loadSession(sessionSlug: string): Promise<void> {
		// Import fetchSessionData dynamically to avoid circular dependencies
		const { fetchSessionData } = await import('../../routes/session/[slug]/presenter/presenter.remote');
		
		this.setLoading(sessionSlug, true);
		try {
			const data = await fetchSessionData({ slug: sessionSlug });
			if (data) {
				// Extract session and attendees if present
				const sessionData: any = 'attendees' in data 
					? { ...data, attendees: undefined, timestamp: undefined }
					: data;
				
				// Add updatedAt if missing for type compatibility
				const session = {
					...sessionData,
					updatedAt: sessionData.updatedAt || sessionData.createdAt || new Date()
				};
				
				this.upsertSession(session);
				this.setCurrentSession(session.id);
				
				if ('attendees' in data && data.attendees) {
					this.batchUpsertAttendees(data.attendees);
				}
			}
		} finally {
			this.setLoading(sessionSlug, false);
		}
	}
	
	// === Singleton Instance ===
	
	private static instance: SessionState;
	
	static getInstance(): SessionState {
		if (!SessionState.instance) {
			SessionState.instance = new SessionState();
		}
		return SessionState.instance;
	}
}

// Export singleton instance
export const sessionState = SessionState.getInstance();

// Export convenience functions for common operations
export function useSessionState() {
	return sessionState;
}

// Development helpers
if (import.meta.env.DEV) {
	// Add development-only debugging
	(globalThis as any).__sessionState = sessionState;
}