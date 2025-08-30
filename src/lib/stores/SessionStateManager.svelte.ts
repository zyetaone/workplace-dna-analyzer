/**
 * ENHANCED SESSION STATE MANAGER
 * Optimized state management for complex multi-activity sessions
 * Uses modern Svelte 5 runes with performance optimizations
 */

import type { Session, Participant } from '$lib/server/db/schema';
import type { ActivityConfig, SessionActivity, ActivityState } from '$lib/types/activities';
import { RealtimeStateManager } from './BaseStateManager.svelte';
import { activityManager } from '$lib/activities/ActivityManager.svelte';
import { wsManager } from '$lib/realtime/WebSocketManager.svelte';

// Enhanced session statistics
export interface SessionStats {
	totalParticipants: number;
	activeParticipants: number;
	completedParticipants: number;
	completionRate: number;
	averageEngagement: number;
	currentActivity: {
		id: string | null;
		name: string | null;
		participantCount: number;
		responseRate: number;
	};
	activities: {
		total: number;
		completed: number;
		active: number;
		progress: number;
	};
}

// Performance metrics
export interface PerformanceMetrics {
	renderTime: number;
	stateUpdates: number;
	wsMessages: number;
	lastUpdate: Date;
	memoryUsage?: number;
}

/**
 * Enhanced Session State Manager
 * Optimized for complex multi-activity sessions with real-time collaboration
 */
export class SessionStateManager extends RealtimeStateManager {
	// Enhanced reactive state
	sessionActivities = $state<Map<string, SessionActivity>>(new Map());
	currentActivityId = $state<string | null>(null);
	sessionStats = $state<SessionStats>({
		totalParticipants: 0,
		activeParticipants: 0,
		completedParticipants: 0,
		completionRate: 0,
		averageEngagement: 0,
		currentActivity: {
			id: null,
			name: null,
			participantCount: 0,
			responseRate: 0
		},
		activities: {
			total: 0,
			completed: 0,
			active: 0,
			progress: 0
		}
	});

	// Performance tracking
	private performanceMetrics = $state<PerformanceMetrics>({
		renderTime: 0,
		stateUpdates: 0,
		wsMessages: 0,
		lastUpdate: new Date()
	});

	// Memoization cache for expensive computations
	private computationCache = $state<Map<string, { value: any; timestamp: number }>>(new Map());
	private cacheTimeout = 5000; // 5 seconds

	// Advanced computed properties with memoization
	get currentActivity() {
		return this.currentActivityId ? this.sessionActivities.get(this.currentActivityId) : null;
	}

	get sortedActivities() {
		return this.memoizeComputation('sortedActivities', () => {
			return Array.from(this.sessionActivities.values()).sort((a, b) => a.order - b.order);
		});
	}

	get activityProgress() {
		return this.memoizeComputation('activityProgress', () => {
			const activities = this.sortedActivities;
			if (activities.length === 0) return 0;

			const completedCount = activities.filter((a) => a.state.status === 'completed').length;
			return Math.round((completedCount / activities.length) * 100);
		});
	}

	get participantEngagement() {
		return this.memoizeComputation('participantEngagement', () => {
			if (this.participants.length === 0) return 0;

			const engagedParticipants = this.participants.filter((p) => {
				// Participant is considered engaged if they've responded to current activity
				const currentTime = Date.now();
				const joinTime = new Date(p.joinedAt).getTime();
				const timeSinceJoin = currentTime - joinTime;

				// Recently joined or has recent activity
				return timeSinceJoin < 300000 || p.completed; // 5 minutes
			});

			return Math.round((engagedParticipants.length / this.participants.length) * 100);
		});
	}

	// Enhanced initialization for multi-activity sessions
	async initSession(sessionCode: string, activities?: ActivityConfig[]): Promise<void> {
		const startTime = performance.now();

		try {
			this.setLoading(true);
			this.setError(null);

			// Connect to WebSocket for real-time updates
			await this.connectWebSocket(sessionCode);

			// Load session data
			await this.loadSessionData(sessionCode);

			// Initialize activities if provided
			if (activities && activities.length > 0) {
				await this.initializeActivities(activities, sessionCode);
			}

			// Set up real-time sync
			this.setupRealTimeSync();

			// Update performance metrics
			this.performanceMetrics.renderTime = performance.now() - startTime;
			console.log(`Session ${sessionCode} initialized in ${this.performanceMetrics.renderTime}ms`);
		} catch (err) {
			this.setError(err instanceof Error ? err.message : 'Failed to initialize session');
			console.error('Session initialization failed:', err);
		} finally {
			this.setLoading(false);
		}
	}

	private async connectWebSocket(sessionCode: string): Promise<void> {
		await wsManager.connect(sessionCode);

		// Set up WebSocket event handlers
		wsManager.on('participant_joined', (message) => {
			if (message.data?.participant) {
				this.handleParticipantJoined(message.data.participant);
			}
		});

		wsManager.on('activity_response', (message) => {
			if (message.data) {
				this.handleActivityResponse(message.data);
			}
		});

		wsManager.on('session_update', (message) => {
			if (message.data) {
				this.handleSessionUpdate(message.data);
			}
		});
	}

	private async loadSessionData(sessionCode: string): Promise<void> {
		// Load session and participants from your existing API
		const response = await fetch(`/api/session/${sessionCode}`);
		if (!response.ok) throw new Error('Failed to load session');

		const data = await response.json();
		this.updateSession(data.session);

		if (data.participants) {
			this.updateParticipants(data.participants);
		}
	}

	private async initializeActivities(
		activities: ActivityConfig[],
		sessionCode: string
	): Promise<void> {
		const activityIds = await activityManager.createSequence(activities, sessionCode);

		// Convert to SessionActivity objects and store
		activityIds.forEach((id, index) => {
			const activity = activityManager.sessionActivities.find((a) => a.id === id);
			if (activity) {
				this.sessionActivities.set(id, activity);
			}
		});

		// Set first activity as current
		if (activityIds.length > 0) {
			this.currentActivityId = activityIds[0];
		}
	}

	private setupRealTimeSync(): void {
		// Sync session statistics every 10 seconds
		this.setSafeInterval(() => {
			this.updateSessionStatistics();
		}, 10000);

		// Clean up computation cache every 30 seconds
		this.setSafeInterval(() => {
			this.cleanupCache();
		}, 30000);
	}

	// Activity management
	async startActivity(activityId: string): Promise<void> {
		const activity = this.sessionActivities.get(activityId);
		if (!activity) throw new Error(`Activity ${activityId} not found`);

		try {
			// Pause current activity if different
			if (this.currentActivityId && this.currentActivityId !== activityId) {
				await activityManager.pauseActivity(this.currentActivityId);
			}

			// Start the new activity
			await activityManager.startActivity(activityId);
			this.currentActivityId = activityId;

			// Broadcast to all participants
			wsManager.send('activity_started', {
				activityId,
				activity: activity.config,
				timestamp: Date.now()
			});

			// Update statistics
			this.updateSessionStatistics();
			this.performanceMetrics.stateUpdates++;
		} catch (error) {
			console.error('Failed to start activity:', error);
			throw error;
		}
	}

	async completeActivity(activityId: string): Promise<void> {
		const activity = this.sessionActivities.get(activityId);
		if (!activity) return;

		await activityManager.completeActivity(activityId);

		// Update local state
		activity.state.status = 'completed';
		activity.state.completedAt = new Date();

		// Clear computation cache to force recalculation
		this.invalidateCache(['activityProgress', 'sessionStats']);

		// Broadcast completion
		wsManager.send('activity_completed', {
			activityId,
			results: activity.state.results,
			timestamp: Date.now()
		});

		this.updateSessionStatistics();
	}

	// Participant management with batch updates
	handleParticipantJoined(participant: Participant): void {
		this.batchUpdate([
			() => this.addParticipant(participant),
			() => this.updateSessionStatistics()
		]);
	}

	handleActivityResponse(responseData: any): void {
		const { activityId, participantId, response } = responseData;

		// Update participant response
		this.updateParticipant(participantId, {
			responses: {
				...this.participants.find((p) => p.id === participantId)?.responses,
				[activityId]: response
			}
		});

		// Update activity participation count
		const activity = this.sessionActivities.get(activityId);
		if (activity) {
			activity.state.participantCount = (activity.state.participantCount || 0) + 1;
		}

		this.updateSessionStatistics();
		this.performanceMetrics.wsMessages++;
	}

	handleSessionUpdate(updateData: any): void {
		if (updateData.participants) {
			this.updateParticipants(updateData.participants);
		}

		if (updateData.sessionStats) {
			Object.assign(this.sessionStats, updateData.sessionStats);
		}

		this.performanceMetrics.lastUpdate = new Date();
	}

	// Optimized statistics computation
	private updateSessionStatistics(): void {
		const stats = this.sessionStats;
		const currentActivity = this.currentActivity;

		// Basic participant statistics
		stats.totalParticipants = this.participants.length;
		stats.activeParticipants = this.activeParticipants.length;
		stats.completedParticipants = this.completedParticipants.length;
		stats.completionRate = this.completionRate;
		stats.averageEngagement = this.participantEngagement;

		// Current activity statistics
		stats.currentActivity = {
			id: this.currentActivityId,
			name: currentActivity?.config.name || null,
			participantCount: currentActivity?.state.participantCount || 0,
			responseRate: this.calculateActivityResponseRate(this.currentActivityId)
		};

		// Activity progress statistics
		const activities = this.sortedActivities;
		stats.activities = {
			total: activities.length,
			completed: activities.filter((a) => a.state.status === 'completed').length,
			active: activities.filter((a) => a.state.status === 'active').length,
			progress: this.activityProgress
		};
	}

	private calculateActivityResponseRate(activityId: string | null): number {
		if (!activityId || this.participants.length === 0) return 0;

		const respondedCount = this.participants.filter(
			(p) => p.responses && p.responses[activityId]
		).length;

		return Math.round((respondedCount / this.participants.length) * 100);
	}

	// Performance optimization utilities
	private memoizeComputation<T>(key: string, computation: () => T): T {
		const cached = this.computationCache.get(key);
		const now = Date.now();

		if (cached && now - cached.timestamp < this.cacheTimeout) {
			return cached.value;
		}

		const value = computation();
		this.computationCache.set(key, { value, timestamp: now });
		return value;
	}

	private invalidateCache(keys: string[]): void {
		keys.forEach((key) => this.computationCache.delete(key));
	}

	private cleanupCache(): void {
		const now = Date.now();
		for (const [key, cached] of this.computationCache) {
			if (now - cached.timestamp > this.cacheTimeout) {
				this.computationCache.delete(key);
			}
		}
	}

	// Navigation helpers
	async navigateToNextActivity(): Promise<string | null> {
		const activities = this.sortedActivities;
		const currentIndex = activities.findIndex((a) => a.id === this.currentActivityId);

		if (currentIndex < activities.length - 1) {
			const nextActivity = activities[currentIndex + 1];
			await this.startActivity(nextActivity.id);
			return nextActivity.id;
		}

		return null;
	}

	async navigateToPreviousActivity(): Promise<string | null> {
		const activities = this.sortedActivities;
		const currentIndex = activities.findIndex((a) => a.id === this.currentActivityId);

		if (currentIndex > 0) {
			const prevActivity = activities[currentIndex - 1];
			await this.startActivity(prevActivity.id);
			return prevActivity.id;
		}

		return null;
	}

	// Performance monitoring
	getPerformanceMetrics(): PerformanceMetrics {
		return {
			...this.performanceMetrics,
			memoryUsage:
				typeof performance.memory !== 'undefined' ? performance.memory.usedJSHeapSize : undefined
		};
	}

	// Enhanced cleanup
	destroy(): void {
		// Clean up WebSocket connection
		wsManager.disconnect();

		// Clear caches
		this.computationCache.clear();

		// Clean up activities
		this.sessionActivities.clear();

		// Call parent cleanup
		super.destroy();

		console.log('Enhanced session state manager destroyed');
	}

	// Abstract method implementation
	protected handleRealtimeMessage(message: any): void {
		// Handle SSE fallback messages
		switch (message.type) {
			case 'participant_joined':
				if (message.participant) {
					this.handleParticipantJoined(message.participant);
				}
				break;
			case 'activity_response':
				if (message.data) {
					this.handleActivityResponse(message.data);
				}
				break;
			case 'session_update':
				if (message.data) {
					this.handleSessionUpdate(message.data);
				}
				break;
		}
	}

	protected async attemptReconnect(sessionCode: string): Promise<void> {
		try {
			await wsManager.connect(sessionCode);
		} catch (error) {
			// Fall back to SSE if WebSocket fails
			const sseUrl = `/api/sse/${sessionCode}`;
			await (this as any).connectSSE(sseUrl, sessionCode);
		}
	}
}

// Session state factory with configuration
export function createSessionState(
	config: {
		enablePerformanceMonitoring?: boolean;
		cacheTimeout?: number;
		maxCacheSize?: number;
	} = {}
): SessionStateManager {
	const manager = new SessionStateManager();

	// Apply configuration
	if (config.cacheTimeout) {
		(manager as any).cacheTimeout = config.cacheTimeout;
	}

	return manager;
}
