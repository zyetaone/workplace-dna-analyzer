/**
 * Unified Session State Store using Svelte 5 patterns
 * Single source of truth for all session-related state
 */

import { SvelteMap, SvelteSet } from 'svelte/reactivity';
import { untrack } from 'svelte';

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
		technology: number;
		wellness: number;
	} | null;
	completed: boolean;
	completedAt: Date | string | null;
}

interface CacheEntry<T> {
	value: T;
	timestamp: number;
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
	private connectionStatus = $state<'connecting' | 'connected' | 'disconnected'>('disconnected');
	
	// Memoization cache with TTL
	private cache = new Map<string, CacheEntry<any>>();
	private readonly CACHE_TTL = 1000; // 1 second TTL for computed values
	
	// === Getters for reactive state ===
	
	get isLoading() {
		return this.loading.size > 0;
	}
	
	get isConnected() {
		return this.connectionStatus === 'connected';
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
	
	// === Analytics with Memoization ===
	
	generationDistribution = $derived.by(() => {
		const key = `genDist-${this.currentSessionId}`;
		const cached = this.getFromCache<Record<string, number>>(key);
		if (cached) return cached;
		
		const dist: Record<string, number> = {
			'Baby Boomer': 0,
			'Gen X': 0,
			'Millennial': 0,
			'Gen Z': 0
		};
		
		// Use untrack to prevent unnecessary reactivity
		untrack(() => {
			this.currentAttendees.forEach(attendee => {
				if (attendee.generation && dist[attendee.generation] !== undefined) {
					dist[attendee.generation]++;
				}
			});
		});
		
		return this.setCache(key, dist);
	});
	
	preferenceScores = $derived.by(() => {
		const key = `prefScores-${this.currentSessionId}`;
		const cached = this.getFromCache<Record<string, number>>(key);
		if (cached) return cached;
		
		if (this.completedCount === 0) {
			return this.setCache(key, {
				collaboration: 0,
				formality: 0,
				technology: 0,
				wellness: 0
			});
		}
		
		const totals = { collaboration: 0, formality: 0, technology: 0, wellness: 0 };
		
		untrack(() => {
			this.completedAttendees.forEach(attendee => {
				if (attendee.preferenceScores) {
					totals.collaboration += attendee.preferenceScores.collaboration || 0;
					totals.formality += attendee.preferenceScores.formality || 0;
					totals.technology += attendee.preferenceScores.technology || 0;
					totals.wellness += attendee.preferenceScores.wellness || 0;
				}
			});
		});
		
		const multiplier = 1 / this.completedCount;
		
		return this.setCache(key, {
			collaboration: Math.round(totals.collaboration * multiplier),
			formality: Math.round(totals.formality * multiplier),
			technology: Math.round(totals.technology * multiplier),
			wellness: Math.round(totals.wellness * multiplier)
		});
	});
	
	generationPreferences = $derived.by(() => {
		const key = `genPrefs-${this.currentSessionId}`;
		const cached = this.getFromCache<Record<string, any>>(key);
		if (cached) return cached;
		
		const prefs: Record<string, any> = {};
		
		['Baby Boomer', 'Gen X', 'Millennial', 'Gen Z'].forEach(generation => {
			const genAttendees = this.completedAttendees.filter(a => a.generation === generation);
			
			if (genAttendees.length > 0) {
				const totals = { collaboration: 0, formality: 0, technology: 0, wellness: 0 };
				
				genAttendees.forEach(attendee => {
					if (attendee.preferenceScores) {
						totals.collaboration += attendee.preferenceScores.collaboration || 0;
						totals.formality += attendee.preferenceScores.formality || 0;
						totals.technology += attendee.preferenceScores.technology || 0;
						totals.wellness += attendee.preferenceScores.wellness || 0;
					}
				});
				
				const multiplier = 1 / genAttendees.length;
				
				prefs[generation] = {
					count: genAttendees.length,
					collaboration: Math.round(totals.collaboration * multiplier),
					formality: Math.round(totals.formality * multiplier),
					technology: Math.round(totals.technology * multiplier),
					wellness: Math.round(totals.wellness * multiplier)
				};
			}
		});
		
		return this.setCache(key, prefs);
	});
	
	workplaceDNA = $derived.by(() => {
		const scores = this.preferenceScores;
		if (!scores || Object.values(scores).every(v => v === 0)) {
			return null;
		}
		
		const profiles = [];
		
		if (scores.collaboration >= 7) profiles.push('Collaborative');
		else if (scores.collaboration <= 3) profiles.push('Independent');
		
		if (scores.formality >= 7) profiles.push('Structured');
		else if (scores.formality <= 3) profiles.push('Flexible');
		
		if (scores.technology >= 7) profiles.push('Tech-Forward');
		else if (scores.technology <= 3) profiles.push('Traditional');
		
		if (scores.wellness >= 7) profiles.push('Wellness-Focused');
		else if (scores.wellness <= 3) profiles.push('Performance-Driven');
		
		return profiles.length > 0 ? profiles.join(' & ') : 'Balanced';
	});
	
	wordCloudData = $derived.by(() => {
		const key = `wordCloud-${this.currentSessionId}`;
		const cached = this.getFromCache<Array<{ text: string; size: number }>>(key);
		if (cached) return cached;
		
		const scores = this.preferenceScores;
		if (!scores || Object.values(scores).every(v => v === 0)) {
			return this.setCache(key, []);
		}
		
		const words = [
			{ text: 'Collaboration', size: 20 + scores.collaboration * 8 },
			{ text: 'Formality', size: 20 + scores.formality * 8 },
			{ text: 'Technology', size: 20 + scores.technology * 8 },
			{ text: 'Wellness', size: 20 + scores.wellness * 8 }
		];
		
		// Add generation-specific words
		Object.entries(this.generationPreferences).forEach(([gen, prefs]) => {
			if (prefs.count > 0) {
				words.push({
					text: gen,
					size: 15 + prefs.count * 5
				});
			}
		});
		
		return this.setCache(key, words);
	});
	
	// === Actions ===
	
	setCurrentSession(sessionId: string | null) {
		this.currentSessionId = sessionId;
		this.clearCache(); // Clear cache when session changes
	}
	
	setConnectionStatus(status: 'connecting' | 'connected' | 'disconnected') {
		this.connectionStatus = status;
	}
	
	// Session Management
	
	upsertSession(session: Session) {
		this.sessions.set(session.id, session);
		this.clearCache();
	}
	
	removeSession(sessionId: string) {
		this.sessions.delete(sessionId);
		if (this.currentSessionId === sessionId) {
			this.currentSessionId = null;
		}
		this.clearCache();
	}
	
	// Attendee Management
	
	upsertAttendee(attendee: Attendee) {
		this.attendees.set(attendee.id, attendee);
		this.clearCache();
	}
	
	updateAttendee(attendeeId: string, updates: Partial<Attendee>) {
		const attendee = this.attendees.get(attendeeId);
		if (attendee) {
			this.attendees.set(attendeeId, { ...attendee, ...updates });
			this.clearCache();
		}
	}
	
	removeAttendee(attendeeId: string) {
		this.attendees.delete(attendeeId);
		this.clearCache();
	}
	
	// Batch Operations
	
	batchUpsertAttendees(attendeeList: Attendee[]) {
		// Use untrack for performance when updating multiple items
		untrack(() => {
			attendeeList.forEach(attendee => {
				this.attendees.set(attendee.id, attendee);
			});
		});
		this.clearCache();
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
	
	// Real-time Event Handlers
	
	handleRealtimeEvent(type: string, payload: any) {
		switch (type) {
			case 'attendee_joined':
				if (payload.attendee) {
					this.upsertAttendee(payload.attendee);
				}
				break;
				
			case 'response_received':
				if (payload.attendeeId && payload.response) {
					const attendee = this.attendees.get(payload.attendeeId);
					if (attendee) {
						this.updateAttendee(payload.attendeeId, {
							responses: { ...attendee.responses, ...payload.response }
						});
					}
				}
				break;
				
			case 'attendee_completed':
				if (payload.attendeeId) {
					this.updateAttendee(payload.attendeeId, {
						completed: true,
						completedAt: new Date(),
						preferenceScores: payload.scores
					} as Partial<Attendee>);
				}
				break;
				
			case 'attendee_left':
				if (payload.attendeeId) {
					this.removeAttendee(payload.attendeeId);
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
	
	// === Cache Management ===
	
	private getFromCache<T>(key: string): T | null {
		const entry = this.cache.get(key);
		if (entry && Date.now() - entry.timestamp < this.CACHE_TTL) {
			return entry.value;
		}
		return null;
	}
	
	private setCache<T>(key: string, value: T): T {
		this.cache.set(key, { value, timestamp: Date.now() });
		return value;
	}
	
	private clearCache(pattern?: string) {
		if (pattern) {
			// Clear cache entries matching pattern
			for (const key of this.cache.keys()) {
				if (key.includes(pattern)) {
					this.cache.delete(key);
				}
			}
		} else {
			// Clear all cache
			this.cache.clear();
		}
	}
	
	// === Cleanup ===
	
	reset() {
		this.sessions.clear();
		this.attendees.clear();
		this.currentSessionId = null;
		this.loading.clear();
		this.errors.clear();
		this.connectionStatus = 'disconnected';
		this.cache.clear();
	}
	
	// === Legacy compatibility methods (to be removed) ===
	
	async loadSession(sessionId: string): Promise<void> {
			// Delegate to setLoading for consistency
		this.setLoading(sessionId, true);
		// Implementation will be in remote functions
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