/**
 * Real-time state management for live session updates
 * Uses remote functions with reactive polling instead of SSE
 */

import { getSessionAnalytics } from '../dashboard.remote';
import type { Participant, Session } from '$lib/server/db/schema';

interface RealtimeState {
	isPolling: boolean;
	pollInterval: number;
	lastUpdate: Date | null;
	error: string | null;
}

/**
 * Minimal real-time session class that only handles polling and raw data
 * All analytics computation happens in dashboard.svelte.ts
 */
class RealtimeSession {
	// Core state
	private _state = $state<RealtimeState>({
		isPolling: false,
		pollInterval: 2000, // 2 seconds default
		lastUpdate: null,
		error: null
	});
	
	// Session data (raw from server)
	private _session = $state<Session | null>(null);
	private _participants = $state<Participant[]>([]);
	
	private pollTimer: ReturnType<typeof setInterval> | null = null;
	private currentSlug: string | null = null;
	
	// Getters for reactive state
	get isPolling() { return this._state.isPolling; }
	get lastUpdate() { return this._state.lastUpdate; }
	get error() { return this._state.error; }
	get session() { return this._session; }
	get participants() { return this._participants; }
	
	// Start polling for real-time updates
	async startPolling(slug: string, interval: number = 2000) {
		// Stop any existing polling
		this.stopPolling();
		
		this.currentSlug = slug;
		this._state.pollInterval = interval;
		this._state.isPolling = true;
		this._state.error = null;
		
		// Initial fetch
		await this.fetchUpdate();
		
		// Set up polling interval
		this.pollTimer = setInterval(async () => {
			if (this._state.isPolling) {
				await this.fetchUpdate();
			}
		}, interval);
	}
	
	// Stop polling
	stopPolling() {
		this._state.isPolling = false;
		if (this.pollTimer) {
			clearInterval(this.pollTimer);
			this.pollTimer = null;
		}
	}
	
	// Fetch latest data using remote function
	private async fetchUpdate() {
		if (!this.currentSlug) return;
		
		try {
			const data = await getSessionAnalytics({ slug: this.currentSlug });
			
			// Update raw data only - dashboard state will compute analytics
			this._session = data.session;
			this._participants = data.participants;
			
			this._state.lastUpdate = new Date();
			this._state.error = null;
			
			// Log update for debugging
			console.log(`[Realtime] Updated: ${data.participants.length} participants`);
		} catch (err) {
			console.error('[Realtime] Fetch error:', err);
			this._state.error = err instanceof Error ? err.message : 'Failed to fetch updates';
		}
	}
	
	// Manual refresh
	async refresh() {
		await this.fetchUpdate();
	}
	
	// Update poll interval
	setPollInterval(interval: number) {
		this._state.pollInterval = interval;
		if (this._state.isPolling && this.currentSlug) {
			this.startPolling(this.currentSlug, interval);
		}
	}
	
	// Clean up on destroy
	destroy() {
		this.stopPolling();
	}
}

// Export singleton instance for the current session
export const realtimeSession = new RealtimeSession();