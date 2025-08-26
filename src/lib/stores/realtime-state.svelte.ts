/**
 * Realtime Store for Optimistic Updates and SSE Coordination
 * Handles real-time events and coordinates with session store
 */

import { SvelteSet } from 'svelte/reactivity';
import { sessionStore } from './session-state.svelte';
import { analyticsStore } from './analytics-state.svelte';
import { refreshSessionData } from '../../routes/session.remote';

interface PendingUpdate {
	sessionId: string;
	attendeeId: string;
	timestamp: number;
	type: 'response' | 'join' | 'complete';
	data: any;
}

class RealtimeStore {
	// Connection state
	connectionStatus = $state<'connecting' | 'connected' | 'disconnected'>('connecting');
	reconnectAttempts = $state(0);
	lastEventTime = $state<Date>(new Date());
	
	// Pending updates for reconciliation
	pendingUpdates = new SvelteSet<string>();
	updateQueue = $state<PendingUpdate[]>([]);
	
	// Throttling for batch updates
	private updateTimer: ReturnType<typeof setTimeout> | null = null;
	private readonly UPDATE_DELAY = 500; // ms
	
	// Statistics
	eventsReceived = $state(0);
	optimisticUpdates = $state(0);
	reconciliations = $state(0);
	
	/**
	 * Handle SSE connection established
	 */
	handleConnected() {
		console.log('🔗 Realtime: SSE connected');
		this.connectionStatus = 'connected';
		this.reconnectAttempts = 0;
		
		// Reconcile any pending updates
		this.reconcilePending();
	}
	
	/**
	 * Handle SSE disconnection
	 */
	handleDisconnected() {
		console.log('❌ Realtime: SSE disconnected');
		this.connectionStatus = 'disconnected';
		this.reconnectAttempts++;
	}
	
	/**
	 * Handle attendee joined event
	 */
	handleAttendeeJoined(event: CustomEvent) {
		const { sessionId, ...attendeeData } = event.detail;
		
		this.eventsReceived++;
		this.lastEventTime = new Date();
		analyticsStore.recordActivity();
		
		// Check if this is our own update (skip if so)
		const updateKey = `${sessionId}-${attendeeData.id}`;
		if (this.pendingUpdates.has(updateKey)) {
			// Our update confirmed, remove from pending
			this.pendingUpdates.delete(updateKey);
			return;
		}
		
		// Add attendee to store
		sessionStore.addAttendee(sessionId, attendeeData);
	}
	
	/**
	 * Handle response received event
	 */
	handleResponseReceived(event: CustomEvent) {
		const { sessionId, attendeeId, questionIndex, response } = event.detail;
		
		this.eventsReceived++;
		this.lastEventTime = new Date();
		analyticsStore.recordActivity();
		
		// Check if this is our own update
		const updateKey = `${sessionId}-${attendeeId}-${questionIndex}`;
		if (this.pendingUpdates.has(updateKey)) {
			// Our update confirmed
			this.pendingUpdates.delete(updateKey);
			return;
		}
		
		// Update store with response
		sessionStore.updateAttendeeResponse(sessionId, attendeeId, questionIndex, response);
	}
	
	/**
	 * Handle attendee completed event
	 */
	handleAttendeeCompleted(event: CustomEvent) {
		const { sessionId, attendeeId, scores } = event.detail;
		
		this.eventsReceived++;
		this.lastEventTime = new Date();
		analyticsStore.recordActivity();
		
		// Check if this is our own update
		const updateKey = `${sessionId}-${attendeeId}-complete`;
		if (this.pendingUpdates.has(updateKey)) {
			// Our update confirmed
			this.pendingUpdates.delete(updateKey);
			return;
		}
		
		// Mark attendee as completed
		sessionStore.completeAttendee(sessionId, attendeeId, scores);
	}
	
	/**
	 * Handle analytics update event
	 */
	handleAnalyticsUpdate(event: CustomEvent) {
		const { sessionId } = event.detail;
		
		this.eventsReceived++;
		this.lastEventTime = new Date();
		analyticsStore.recordActivity();
		
		// Schedule throttled refresh
		this.scheduleRefresh(sessionId);
	}
	
	/**
	 * Queue an optimistic update
	 */
	queueOptimisticUpdate(update: PendingUpdate) {
		this.optimisticUpdates++;
		
		// Add to pending set for deduplication
		const key = `${update.sessionId}-${update.attendeeId}${
			update.type === 'response' ? `-${update.data.questionIndex}` : 
			update.type === 'complete' ? '-complete' : ''
		}`;
		this.pendingUpdates.add(key);
		
		// Add to queue
		this.updateQueue = [...this.updateQueue, update];
		
		// Apply optimistic update immediately
		switch (update.type) {
			case 'response':
				sessionStore.updateAttendeeResponse(
					update.sessionId, 
					update.attendeeId, 
					update.data.questionIndex, 
					update.data.response
				);
				break;
			case 'complete':
				sessionStore.completeAttendee(
					update.sessionId,
					update.attendeeId,
					update.data.scores
				);
				break;
			case 'join':
				sessionStore.addAttendee(update.sessionId, update.data);
				break;
		}
	}
	
	/**
	 * Reconcile pending updates with server
	 */
	async reconcilePending() {
		if (this.pendingUpdates.size === 0) return;
		
		this.reconciliations++;
		
		// Get all unique session IDs
		const sessionIds = new Set<string>();
		this.updateQueue.forEach(update => sessionIds.add(update.sessionId));
		
		// Refresh each session
		for (const sessionId of sessionIds) {
			try {
				await sessionStore.refreshSession(sessionId);
			} catch (error) {
				console.error('Failed to reconcile session:', sessionId, error);
			}
		}
		
		// Clear reconciled updates older than 5 seconds
		const cutoff = Date.now() - 5000;
		this.updateQueue = this.updateQueue.filter(u => u.timestamp > cutoff);
		
		// Clear pending set for old updates
		const remainingKeys = new Set<string>();
		this.updateQueue.forEach(update => {
			const key = `${update.sessionId}-${update.attendeeId}${
				update.type === 'response' ? `-${update.data.questionIndex}` : 
				update.type === 'complete' ? '-complete' : ''
			}`;
			remainingKeys.add(key);
		});
		
		// Update pending set
		this.pendingUpdates = new SvelteSet(remainingKeys);
	}
	
	/**
	 * Schedule a throttled refresh
	 */
	private scheduleRefresh(sessionId: string) {
		if (this.updateTimer) {
			clearTimeout(this.updateTimer);
		}
		
		this.updateTimer = setTimeout(() => {
			sessionStore.refreshSession(sessionId);
			this.updateTimer = null;
		}, this.UPDATE_DELAY);
	}
	
	/**
	 * Create event handler attachment for components
	 */
	createEventHandler() {
		return (node: HTMLElement) => {
			const handlers = {
				'realtime:connected': () => this.handleConnected(),
				'realtime:disconnected': () => this.handleDisconnected(),
				'realtime:attendee_joined': (e: Event) => this.handleAttendeeJoined(e as CustomEvent),
				'realtime:response_received': (e: Event) => this.handleResponseReceived(e as CustomEvent),
				'realtime:attendee_completed': (e: Event) => this.handleAttendeeCompleted(e as CustomEvent),
				'realtime:analytics': (e: Event) => this.handleAnalyticsUpdate(e as CustomEvent)
			};
			
			// Add all event listeners
			Object.entries(handlers).forEach(([event, handler]) => {
				node.addEventListener(event, handler);
			});
			
			// Cleanup function
			return () => {
				Object.entries(handlers).forEach(([event, handler]) => {
					node.removeEventListener(event, handler);
				});
			};
		};
	}
	
	/**
	 * Get connection health status
	 */
	get connectionHealth() {
		const now = Date.now();
		const lastEvent = this.lastEventTime.getTime();
		const timeSinceEvent = now - lastEvent;
		
		if (this.connectionStatus !== 'connected') return 'disconnected';
		if (timeSinceEvent < 5000) return 'excellent';
		if (timeSinceEvent < 30000) return 'good';
		if (timeSinceEvent < 60000) return 'fair';
		return 'poor';
	}
	
	/**
	 * Get statistics
	 */
	get stats() {
		return {
			eventsReceived: this.eventsReceived,
			optimisticUpdates: this.optimisticUpdates,
			reconciliations: this.reconciliations,
			pendingCount: this.pendingUpdates.size,
			queueLength: this.updateQueue.length,
			connectionHealth: this.connectionHealth
		};
	}
	
	/**
	 * Reset store
	 */
	reset() {
		this.connectionStatus = 'connecting';
		this.reconnectAttempts = 0;
		this.eventsReceived = 0;
		this.optimisticUpdates = 0;
		this.reconciliations = 0;
		this.pendingUpdates.clear();
		this.updateQueue = [];
		this.lastEventTime = new Date();
		
		if (this.updateTimer) {
			clearTimeout(this.updateTimer);
			this.updateTimer = null;
		}
	}
}

// Export singleton instance
export const realtimeStore = new RealtimeStore();