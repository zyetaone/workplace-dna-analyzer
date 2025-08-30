/**
 * UNIFIED BASE STATE MANAGEMENT SYSTEM
 * Optimized state management with race condition prevention and resource cleanup
 *
 * This module provides a comprehensive state management foundation with advanced features
 * for handling concurrent updates, resource cleanup, and optimistic UI patterns.
 *
 * @example
 * ```typescript
 * // Basic usage
 * class MyStateManager extends BaseStateManager {
 *   async loadData() {
 *     this.setLoading(true);
 *     try {
 *       const data = await fetchData();
 *       this.updateSession(data.session);
 *       this.updateParticipants(data.participants);
 *     } catch (error) {
 *       this.setError('Failed to load data');
 *     } finally {
 *       this.setLoading(false);
 *     }
 *   }
 * }
 *
 * // Using optimistic updates
 * await manager.optimisticUpdate(
 *   () => manager.addParticipant(newParticipant),
 *   () => manager.removeParticipant(newParticipant.id),
 *   () => api.createParticipant(newParticipant)
 * );
 * ```
 */

import type { Session, Participant } from '$lib/server/db/schema';

/**
 * Represents a queued update operation with retry and priority management
 *
 * Used internally by the state manager to handle concurrent operations safely
 * and prevent race conditions in state updates.
 *
 * @interface UpdateQueueItem
 * @property {string} id - Unique identifier for the queued operation
 * @property {() => Promise<any>} operation - The async operation to execute
 * @property {number} retries - Number of retry attempts made
 * @property {Date} timestamp - When the operation was queued
 * @property {'high' | 'normal' | 'low'} priority - Execution priority level
 */
export interface UpdateQueueItem {
	id: string;
	operation: () => Promise<any>;
	retries: number;
	timestamp: Date;
	priority: 'high' | 'normal' | 'low';
}

/**
 * Tracks resources that need cleanup when the state manager is destroyed
 *
 * Ensures proper cleanup of timers, event listeners, and other resources to prevent
 * memory leaks and unwanted side effects.
 *
 * @interface CleanupResource
 * @property {string} id - Unique identifier for the resource
 * @property {'timeout' | 'interval' | 'eventListener' | 'subscription'} type - Resource type
 * @property {any} resource - The actual resource object (timer ID, event listener, etc.)
 * @property {() => void} cleanup - Function to clean up the resource
 */
export interface CleanupResource {
	id: string;
	type: 'timeout' | 'interval' | 'eventListener' | 'subscription';
	resource: any;
	cleanup: () => void;
}

/**
 * Base State Manager with Race Condition Prevention
 *
 * Provides unified state management patterns with advanced safety features including:
 * - Race condition prevention through operation queuing
 * - Automatic resource cleanup
 * - Optimistic updates with rollback capability
 * - State versioning for cache invalidation
 * - Batch operations for performance
 *
 * @abstract
 * @class BaseStateManager
 *
 * @example
 * ```typescript
 * class QuizStateManager extends BaseStateManager {
 *   async initialize(sessionId: string) {
 *     await this.queueUpdate(async () => {
 *       const session = await api.getSession(sessionId);
 *       this.updateSession(session);
 *     });
 *   }
 *
 *   destroy() {
 *     // Custom cleanup logic
 *     this.customCleanup();
 *     super.destroy(); // Always call super
 *   }
 * }
 * ```
 */
export abstract class BaseStateManager {
	// Core state properties
	session = $state<Session | null>(null);
	participants = $state<Participant[]>([]);
	isLoading = $state(false);
	error = $state<string | null>(null);

	// Advanced state management
	private updateQueue = $state<UpdateQueueItem[]>([]);
	private isProcessingQueue = $state(false);
	private cleanupResources = $state<CleanupResource[]>([]);
	private stateVersion = $state(0);
	protected isDestroyed = $state(false);

	// Computed properties with memoization
	hasSession = $derived(this.session !== null);
	hasParticipants = $derived(this.participants.length > 0);
	activeParticipants = $derived(this.participants.filter((p) => !p.completed));
	completedParticipants = $derived(this.participants.filter((p) => p.completed));
	totalParticipants = $derived(this.participants.length);

	completionRate = $derived.by(() => {
		if (this.totalParticipants === 0) return 0;
		return Math.round((this.completedParticipants.length / this.totalParticipants) * 100);
	});

	/**
	 * Gets the current state version for cache invalidation and optimistic updates
	 *
	 * The version number increments on every successful state change, allowing
	 * components to detect when state has been modified.
	 *
	 * @returns {number} Current state version number
	 *
	 * @example
	 * ```typescript
	 * const currentVersion = manager.getStateVersion();
	 * // Use version for cache keys or comparison
	 * ```
	 */
	getStateVersion() {
		return this.stateVersion;
	}

	/**
	 * Queues an async operation with priority-based execution and automatic retry
	 *
	 * Prevents race conditions by ensuring operations execute sequentially based on priority.
	 * Failed operations are automatically retried with exponential backoff.
	 *
	 * @param {() => Promise<any>} operation - The async operation to queue
	 * @param {string} [id] - Unique identifier (auto-generated if not provided)
	 * @param {'high' | 'normal' | 'low'} [priority='normal'] - Execution priority
	 * @returns {Promise<void>} Resolves when operation completes or fails permanently
	 *
	 * @example
	 * ```typescript
	 * await manager.queueUpdate(async () => {
	 *   const result = await api.updateParticipant(participantId, data);
	 *   manager.updateParticipant(participantId, result);
	 * }, 'update-participant', 'high');
	 * ```
	 */
	async queueUpdate(
		operation: () => Promise<any>,
		id: string = crypto.randomUUID(),
		priority: 'high' | 'normal' | 'low' = 'normal'
	) {
		if (this.isDestroyed) return;

		const queueItem: UpdateQueueItem = {
			id,
			operation,
			retries: 0,
			timestamp: new Date(),
			priority
		};

		// Insert based on priority
		const insertIndex = this.updateQueue.findIndex((item) => {
			if (priority === 'high') return true;
			if (priority === 'normal' && item.priority === 'low') return true;
			return false;
		});

		if (insertIndex === -1) {
			this.updateQueue.push(queueItem);
		} else {
			this.updateQueue.splice(insertIndex, 0, queueItem);
		}

		if (!this.isProcessingQueue) {
			await this.processQueue();
		}
	}

	private async processQueue() {
		if (this.updateQueue.length === 0 || this.isDestroyed) {
			this.isProcessingQueue = false;
			return;
		}

		this.isProcessingQueue = true;

		const item = this.updateQueue.shift();
		if (!item) {
			this.isProcessingQueue = false;
			return;
		}

		try {
			await item.operation();
			this.stateVersion++; // Increment version on successful update
		} catch (err) {
			console.error('Queue operation failed:', err);

			// Enhanced retry logic with exponential backoff
			if (item.retries < 3) {
				item.retries++;
				const delay = Math.min(500 * Math.pow(2, item.retries), 5000);

				setTimeout(() => {
					if (!this.isDestroyed) {
						this.updateQueue.unshift(item);
					}
				}, delay);
			} else {
				this.setError('Failed to sync data. Please refresh the page.');
			}
		}

		// Process next item
		if (this.updateQueue.length > 0 && !this.isDestroyed) {
			await this.processQueue();
		} else {
			this.isProcessingQueue = false;
		}
	}

	/**
	 * Performs an optimistic update with automatic rollback on failure
	 *
	 * Updates the UI immediately for better perceived performance, then syncs with the server.
	 * If the server operation fails, the UI is automatically rolled back to its previous state.
	 *
	 * @template T - The return type of the server operation
	 * @param {() => void} updateFn - Function to apply the optimistic update to local state
	 * @param {() => void} rollbackFn - Function to revert the optimistic update on failure
	 * @param {() => Promise<T>} serverOperation - The server operation to perform
	 * @returns {Promise<T>} Result of the server operation
	 *
	 * @example
	 * ```typescript
	 * await manager.optimisticUpdate(
	 *   () => manager.addParticipant(optimisticParticipant),
	 *   () => manager.removeParticipant(optimisticParticipant.id),
	 *   () => api.createParticipant(participantData)
	 * );
	 * ```
	 */
	async optimisticUpdate<T>(
		updateFn: () => void,
		rollbackFn: () => void,
		serverOperation: () => Promise<T>
	): Promise<T> {
		const originalVersion = this.stateVersion;

		// Apply optimistic update
		updateFn();
		this.stateVersion++;

		try {
			const result = await serverOperation();
			return result;
		} catch (error) {
			// Rollback on failure
			rollbackFn();
			this.stateVersion = originalVersion;
			throw error;
		}
	}

	// Resource management for cleanup
	protected registerCleanupResource(resource: CleanupResource) {
		this.cleanupResources.push(resource);
	}

	protected unregisterCleanupResource(id: string) {
		const index = this.cleanupResources.findIndex((r) => r.id === id);
		if (index !== -1) {
			this.cleanupResources.splice(index, 1);
		}
	}

	// Safe timeout management
	protected setSafeTimeout(callback: () => void, delay: number): string {
		const id = crypto.randomUUID();
		const timeoutId = setTimeout(() => {
			callback();
			this.unregisterCleanupResource(id);
		}, delay);

		this.registerCleanupResource({
			id,
			type: 'timeout',
			resource: timeoutId,
			cleanup: () => clearTimeout(timeoutId)
		});

		return id;
	}

	protected clearSafeTimeout(id: string) {
		const resource = this.cleanupResources.find((r) => r.id === id);
		if (resource && resource.type === 'timeout') {
			resource.cleanup();
			this.unregisterCleanupResource(id);
		}
	}

	// Safe interval management
	protected setSafeInterval(callback: () => void, delay: number): string {
		const id = crypto.randomUUID();
		const intervalId = setInterval(callback, delay);

		this.registerCleanupResource({
			id,
			type: 'interval',
			resource: intervalId,
			cleanup: () => clearInterval(intervalId)
		});

		return id;
	}

	protected clearSafeInterval(id: string) {
		const resource = this.cleanupResources.find((r) => r.id === id);
		if (resource && resource.type === 'interval') {
			resource.cleanup();
			this.unregisterCleanupResource(id);
		}
	}

	// State management methods
	updateSession(session: Session | null) {
		this.session = session;
	}

	updateParticipants(participants: Participant[]) {
		this.participants = [...participants];
	}

	addParticipant(participant: Participant) {
		this.participants = [...this.participants, participant];
	}

	updateParticipant(id: string, updates: Partial<Participant>) {
		this.participants = this.participants.map((p) => (p.id === id ? { ...p, ...updates } : p));
	}

	removeParticipant(id: string) {
		this.participants = this.participants.filter((p) => p.id !== id);
	}

	setLoading(loading: boolean) {
		this.isLoading = loading;
	}

	setError(error: string | null) {
		this.error = error;
	}

	// Batch operations for performance
	batchUpdate(updates: Array<() => void>) {
		const originalVersion = this.stateVersion;

		// Apply all updates
		updates.forEach((update) => update());

		// Single version increment for batch
		this.stateVersion = originalVersion + 1;
	}

	// State validation
	validateState(): boolean {
		// Basic validation - can be extended by subclasses
		if (this.session && this.participants.length > 0) {
			const sessionParticipants = this.participants.filter((p) => p.sessionId === this.session!.id);
			return sessionParticipants.length === this.participants.length;
		}
		return true;
	}

	/**
	 * Performs comprehensive cleanup of all resources and state
	 *
	 * This method should be called when the state manager is no longer needed to prevent
	 * memory leaks and ensure proper cleanup of timers, event listeners, and other resources.
	 * After calling destroy(), the state manager should not be used again.
	 *
	 * @returns {void}
	 *
	 * @example
	 * ```typescript
	 * // In a Svelte component's onDestroy lifecycle
	 * import { onDestroy } from 'svelte';
	 *
	 * onDestroy(() => {
	 *   stateManager.destroy();
	 * });
	 * ```
	 */
	destroy() {
		if (this.isDestroyed) return;

		this.isDestroyed = true;

		// Clear all cleanup resources
		this.cleanupResources.forEach((resource) => {
			try {
				resource.cleanup();
			} catch (err) {
				console.warn('Error cleaning up resource:', resource.id, err);
			}
		});
		this.cleanupResources = [];

		// Clear update queue
		this.updateQueue = [];
		this.isProcessingQueue = false;

		// Reset state
		this.session = null;
		this.participants = [];
		this.isLoading = false;
		this.error = null;
		this.stateVersion = 0;

		// Call subclass cleanup if implemented
		if (typeof (this as any).onDestroy === 'function') {
			(this as any).onDestroy();
		}
	}

	// State serialization for debugging/persistence
	serializeState() {
		return {
			session: this.session,
			participants: this.participants,
			isLoading: this.isLoading,
			error: this.error,
			stateVersion: this.stateVersion,
			queueLength: this.updateQueue.length,
			resourceCount: this.cleanupResources.length
		};
	}

	// State hydration
	hydrateState(state: any) {
		if (state.session) this.session = state.session;
		if (state.participants) this.participants = state.participants;
		if (typeof state.isLoading === 'boolean') this.isLoading = state.isLoading;
		if (state.error !== undefined) this.error = state.error;
		if (state.stateVersion) this.stateVersion = state.stateVersion;
	}
}

/**
 * Enhanced Session State Manager with SSE Support
 * Extends BaseStateManager with real-time synchronization
 */
export abstract class RealtimeStateManager extends BaseStateManager {
	private eventSource = $state<EventSource | null>(null);
	private connectionStatus = $state<'disconnected' | 'connecting' | 'connected'>('disconnected');
	private reconnectAttempts = $state(0);
	private reconnectTimeoutId: string | null = null;
	private maxReconnectAttempts = 5;

	// SSE connection management
	getConnectionStatus() {
		return this.connectionStatus;
	}

	protected async connectSSE(url: string, sessionCode: string) {
		if (this.eventSource || this.isDestroyed) return;

		this.connectionStatus = 'connecting';

		try {
			this.eventSource = new EventSource(url);

			this.eventSource.onopen = () => {
				this.connectionStatus = 'connected';
				this.reconnectAttempts = 0;
				console.log('SSE connected for session:', sessionCode);
			};

			this.eventSource.onmessage = (event) => {
				try {
					const message = JSON.parse(event.data);
					this.handleRealtimeMessage(message);
				} catch (err) {
					console.error('Failed to parse SSE message:', err);
				}
			};

			this.eventSource.onerror = () => {
				this.connectionStatus = 'disconnected';
				this.handleSSEError(sessionCode);
			};
		} catch (err) {
			this.connectionStatus = 'disconnected';
			console.error('SSE connection error:', err);
			this.handleSSEError(sessionCode);
		}
	}

	protected disconnectSSE() {
		if (this.eventSource) {
			this.eventSource.close();
			this.eventSource = null;
		}
		this.connectionStatus = 'disconnected';
	}

	private handleSSEError(sessionCode: string) {
		if (this.reconnectAttempts < this.maxReconnectAttempts && !this.isDestroyed) {
			const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
			this.reconnectAttempts++;

			console.log(`Reconnecting SSE in ${delay}ms (attempt ${this.reconnectAttempts})`);

			this.reconnectTimeoutId = this.setSafeTimeout(() => {
				this.reconnectTimeoutId = null;
				// Reconnection logic should be implemented by subclasses
				this.attemptReconnect(sessionCode);
			}, delay);
		} else {
			this.setError('Lost connection to server. Please refresh the page.');
		}
	}

	// Abstract methods for subclasses to implement
	protected abstract handleRealtimeMessage(message: any): void;
	protected abstract attemptReconnect(sessionCode: string): Promise<void>;

	// Enhanced destroy with SSE cleanup
	destroy() {
		this.disconnectSSE();

		if (this.reconnectTimeoutId) {
			this.clearSafeTimeout(this.reconnectTimeoutId);
			this.reconnectTimeoutId = null;
		}

		super.destroy();
	}
}

/**
 * Singleton State Manager Registry
 * Manages state instances with automatic cleanup
 */
export class StateManagerRegistry {
	private static instance: StateManagerRegistry;
	private stateManagers = new Map<string, BaseStateManager>();

	static getInstance(): StateManagerRegistry {
		if (!StateManagerRegistry.instance) {
			StateManagerRegistry.instance = new StateManagerRegistry();
		}
		return StateManagerRegistry.instance;
	}

	register<T extends BaseStateManager>(key: string, manager: T): T {
		// Clean up existing manager if it exists
		this.unregister(key);

		this.stateManagers.set(key, manager);
		return manager;
	}

	get<T extends BaseStateManager>(key: string): T | null {
		return (this.stateManagers.get(key) as T) || null;
	}

	unregister(key: string) {
		const manager = this.stateManagers.get(key);
		if (manager) {
			manager.destroy();
			this.stateManagers.delete(key);
		}
	}

	clear() {
		this.stateManagers.forEach((manager) => manager.destroy());
		this.stateManagers.clear();
	}

	getAll(): BaseStateManager[] {
		return Array.from(this.stateManagers.values());
	}

	getStats() {
		return {
			totalManagers: this.stateManagers.size,
			managersByType: Array.from(this.stateManagers.entries()).reduce(
				(acc, [, manager]) => {
					const type = manager.constructor.name;
					acc[type] = (acc[type] || 0) + 1;
					return acc;
				},
				{} as Record<string, number>
			)
		};
	}
}

// Global registry instance
export const stateRegistry = StateManagerRegistry.getInstance();
