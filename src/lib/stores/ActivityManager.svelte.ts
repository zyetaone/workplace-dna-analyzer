// **🎯 ACTIVITY MANAGER - Simple HTTP polling, no SSE**

import type { Activity, ActivityResponses } from '../server/db/schema';
import { getPlugin, type ActivityPlugin } from '../plugins';

export interface SessionState {
	sessionId: string;
	activities: Activity[];
	currentActivityId: string | null;
	participants: any[];
	lastUpdated: string;
}

export class ActivityManager {
	// Reactive state
	sessionState = $state<SessionState | null>(null);
	isLoading = $state(false);
	error = $state<string | null>(null);
	
	private pollingInterval: number | null = null;
	private pollingFrequency = 3000; // 3 seconds - keep it simple!
	
	constructor(private sessionId: string) {}
	
	// Initialize and start polling
	async initialize(): Promise<void> {
		await this.fetchSessionState();
		this.startPolling();
	}
	
	// Clean up
	destroy(): void {
		this.stopPolling();
	}
	
	// Fetch current session state
	async fetchSessionState(): Promise<void> {
		try {
			this.isLoading = true;
			this.error = null;
			
			const response = await fetch(`/api/sessions/${this.sessionId}/state`);
			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}
			
			const state: SessionState = await response.json();
			this.sessionState = state;
		} catch (err) {
			this.error = err instanceof Error ? err.message : 'Failed to fetch session state';
			console.error('Failed to fetch session state:', err);
		} finally {
			this.isLoading = false;
		}
	}
	
	// Switch to a different activity
	async switchActivity(activityId: string): Promise<boolean> {
		try {
			this.error = null;
			
			const response = await fetch(`/api/sessions/${this.sessionId}/activities/${activityId}/activate`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' }
			});
			
			if (!response.ok) {
				throw new Error(`Failed to switch activity: ${response.statusText}`);
			}
			
			// Immediately refresh state
			await this.fetchSessionState();
			return true;
		} catch (err) {
			this.error = err instanceof Error ? err.message : 'Failed to switch activity';
			console.error('Failed to switch activity:', err);
			return false;
		}
	}
	
	// Add a new activity to the session
	async addActivity(activity: Activity): Promise<boolean> {
		try {
			this.error = null;
			
			const response = await fetch(`/api/sessions/${this.sessionId}/activities`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(activity)
			});
			
			if (!response.ok) {
				throw new Error(`Failed to add activity: ${response.statusText}`);
			}
			
			// Immediately refresh state
			await this.fetchSessionState();
			return true;
		} catch (err) {
			this.error = err instanceof Error ? err.message : 'Failed to add activity';
			console.error('Failed to add activity:', err);
			return false;
		}
	}
	
	// Submit a participant response
	async submitResponse(activityId: string, response: any): Promise<boolean> {
		try {
			this.error = null;
			
			const submitResponse = await fetch(`/api/sessions/${this.sessionId}/activities/${activityId}/responses`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(response)
			});
			
			if (!submitResponse.ok) {
				throw new Error(`Failed to submit response: ${submitResponse.statusText}`);
			}
			
			return true;
		} catch (err) {
			this.error = err instanceof Error ? err.message : 'Failed to submit response';
			console.error('Failed to submit response:', err);
			return false;
		}
	}
	
	// Get current active activity
	getCurrentActivity(): Activity | null {
		if (!this.sessionState) return null;
		return this.sessionState.activities.find(a => a.id === this.sessionState!.currentActivityId) || null;
	}
	
	// Get plugin for current activity
	getCurrentPlugin(): ActivityPlugin | null {
		const activity = this.getCurrentActivity();
		if (!activity) return null;
		return getPlugin(activity.type) || null;
	}
	
	// Get all activities
	getActivities(): Activity[] {
		return this.sessionState?.activities || [];
	}
	
	// Get participant responses for an activity
	getActivityResponses(activityId: string): any[] {
		if (!this.sessionState) return [];
		
		return this.sessionState.participants
			.map(p => p.responses?.[activityId])
			.filter(Boolean);
	}
	
	// Start polling for updates
	private startPolling(): void {
		if (this.pollingInterval) return;
		
		this.pollingInterval = window.setInterval(() => {
			// Only poll if not currently loading
			if (!this.isLoading) {
				this.fetchSessionState();
			}
		}, this.pollingFrequency);
	}
	
	// Stop polling
	private stopPolling(): void {
		if (this.pollingInterval) {
			clearInterval(this.pollingInterval);
			this.pollingInterval = null;
		}
	}
	
	// Manually refresh (for user-triggered updates)
	async refresh(): Promise<void> {
		await this.fetchSessionState();
	}
	
	// Check if session has updates
	hasUpdates(): boolean {
		// Simple check - in real app, could compare timestamps
		return this.sessionState !== null && !this.isLoading && !this.error;
	}
}

// Global manager instances (simple singleton pattern)
const managers = new Map<string, ActivityManager>();

export function getActivityManager(sessionId: string): ActivityManager {
	if (!managers.has(sessionId)) {
		const manager = new ActivityManager(sessionId);
		managers.set(sessionId, manager);
		
		// Auto-cleanup after 30 minutes of inactivity
		setTimeout(() => {
			if (managers.has(sessionId)) {
				managers.get(sessionId)?.destroy();
				managers.delete(sessionId);
			}
		}, 30 * 60 * 1000);
	}
	
	return managers.get(sessionId)!;
}

// Cleanup function for page navigation
export function cleanupActivityManager(sessionId: string): void {
	const manager = managers.get(sessionId);
	if (manager) {
		manager.destroy();
		managers.delete(sessionId);
	}
}