/**
 * Shared Quiz State Management with Real-time Synchronization
 * Central state for both participant quiz-taking and admin monitoring
 */

import type { Session, Participant, PreferenceScores } from '$lib/server/db/schema';

// SSE Event Types
export type SSEEventType =
	| 'participant_joined'
	| 'answer_submitted'
	| 'quiz_completed'
	| 'participant_left'
	| 'session_ended';

export interface SSEMessage {
	type: SSEEventType;
	sessionCode: string;
	participant?: Participant;
	questionIndex?: number;
	answer?: string;
	scores?: PreferenceScores;
	timestamp: Date;
}

// Update Queue for preventing race conditions
interface UpdateQueueItem {
	id: string;
	operation: () => Promise<any>;
	retries: number;
	timestamp: Date;
}

/**
 * Quiz Session State Manager
 * Handles real-time synchronization between participants and admin
 */
export class QuizSessionState {
	// Core session state
	private session = $state<Session | null>(null);
	private participants = $state<Map<string, Participant>>(new Map());
	private isLoading = $state(false);
	private error = $state<string | null>(null);

	// SSE connection management
	private eventSource = $state<EventSource | null>(null);
	private connectionStatus = $state<'disconnected' | 'connecting' | 'connected'>('disconnected');
	private reconnectAttempts = $state(0);
	private reconnectTimeout: number | null = null;

	// Update queue for race condition prevention
	private updateQueue = $state<UpdateQueueItem[]>([]);
	private isProcessingQueue = $state(false);

	// Computed properties
	get activeParticipants() {
		return Array.from(this.participants.values()).filter((p) => !p.completed);
	}

	get completedParticipants() {
		return Array.from(this.participants.values()).filter((p) => p.completed);
	}

	get totalParticipants() {
		return this.participants.size;
	}

	get completionRate() {
		if (this.totalParticipants === 0) return 0;
		return Math.round((this.completedParticipants.length / this.totalParticipants) * 100);
	}

	get averageScore() {
		const completed = this.completedParticipants;
		if (completed.length === 0) return 0;

		const totalScores = completed.reduce((sum, p) => {
			if (!p.preferenceScores) return sum;
			const scores = p.preferenceScores;
			return sum + scores.collaboration + scores.formality + scores.tech + scores.wellness;
		}, 0);

		return Math.round(totalScores / (completed.length * 4));
	}

	// Initialize session state
	async initSession(sessionCode: string) {
		this.isLoading = true;
		this.error = null;

		try {
			// Connect to SSE stream
			await this.connectSSE(sessionCode);

			// Load initial session data
			const response = await fetch(`/api/session/${sessionCode}`);
			if (!response.ok) throw new Error('Failed to load session');

			const data = await response.json();
			this.session = data.session;

			// Initialize participants map
			if (data.participants) {
				this.participants.clear();
				data.participants.forEach((p: Participant) => {
					this.participants.set(p.id, p);
				});
			}
		} catch (err) {
			this.error = err instanceof Error ? err.message : 'Failed to initialize session';
			console.error('Session init error:', err);
		} finally {
			this.isLoading = false;
		}
	}

	// Connect to Server-Sent Events stream
	private async connectSSE(sessionCode: string) {
		if (this.eventSource) {
			this.eventSource.close();
		}

		this.connectionStatus = 'connecting';

		try {
			this.eventSource = new EventSource(`/api/sse/${sessionCode}`);

			this.eventSource.onopen = () => {
				this.connectionStatus = 'connected';
				this.reconnectAttempts = 0;
				console.log('SSE connected for session:', sessionCode);
			};

			this.eventSource.onmessage = (event) => {
				try {
					const message: SSEMessage = JSON.parse(event.data);
					this.handleSSEMessage(message);
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

	// Handle SSE messages
	private handleSSEMessage(message: SSEMessage) {
		switch (message.type) {
			case 'participant_joined':
				if (message.participant) {
					this.addParticipant(message.participant);
				}
				break;

			case 'answer_submitted':
				if (message.participant) {
					this.updateParticipant(message.participant.id, message.participant);
				}
				break;

			case 'quiz_completed':
				if (message.participant) {
					this.updateParticipant(message.participant.id, {
						...message.participant,
						completed: true,
						completedAt: new Date().toISOString(),
						preferenceScores: message.scores
					});
				}
				break;

			case 'participant_left':
				if (message.participant) {
					this.removeParticipant(message.participant.id);
				}
				break;

			case 'session_ended':
				if (this.session) {
					this.session = { ...this.session, isActive: false };
				}
				break;
		}
	}

	// Handle SSE connection errors with exponential backoff
	private handleSSEError(sessionCode: string) {
		if (this.reconnectAttempts < 5) {
			const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
			this.reconnectAttempts++;

			console.log(`Reconnecting SSE in ${delay}ms (attempt ${this.reconnectAttempts})`);

			this.reconnectTimeout = window.setTimeout(() => {
				this.connectSSE(sessionCode);
			}, delay);
		} else {
			this.error = 'Lost connection to server. Please refresh the page.';
		}
	}

	// Participant management with optimistic updates
	addParticipant(participant: Participant) {
		this.participants.set(participant.id, participant);
		// Trigger reactivity
		this.participants = new Map(this.participants);
	}

	updateParticipant(id: string, updates: Partial<Participant>) {
		const existing = this.participants.get(id);
		if (existing) {
			this.participants.set(id, { ...existing, ...updates });
			// Trigger reactivity
			this.participants = new Map(this.participants);
		}
	}

	removeParticipant(id: string) {
		this.participants.delete(id);
		// Trigger reactivity
		this.participants = new Map(this.participants);
	}

	// Queue management for preventing race conditions
	async queueUpdate(operation: () => Promise<any>, id: string = crypto.randomUUID()) {
		const queueItem: UpdateQueueItem = {
			id,
			operation,
			retries: 0,
			timestamp: new Date()
		};

		this.updateQueue.push(queueItem);

		if (!this.isProcessingQueue) {
			await this.processQueue();
		}
	}

	private async processQueue() {
		if (this.updateQueue.length === 0) {
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
		} catch (err) {
			console.error('Queue operation failed:', err);

			// Retry logic with exponential backoff
			if (item.retries < 3) {
				item.retries++;
				const delay = Math.min(500 * Math.pow(2, item.retries), 5000);

				setTimeout(() => {
					this.updateQueue.unshift(item);
				}, delay);
			} else {
				this.error = 'Failed to sync data. Please refresh the page.';
			}
		}

		// Process next item
		if (this.updateQueue.length > 0) {
			await this.processQueue();
		} else {
			this.isProcessingQueue = false;
		}
	}

	// Cleanup on unmount
	destroy() {
		if (this.eventSource) {
			this.eventSource.close();
			this.eventSource = null;
		}

		if (this.reconnectTimeout) {
			clearTimeout(this.reconnectTimeout);
			this.reconnectTimeout = null;
		}

		this.participants.clear();
		this.updateQueue = [];
		this.connectionStatus = 'disconnected';
	}

	// Export getters for accessing state
	getSession() {
		return this.session;
	}
	getParticipants() {
		return Array.from(this.participants.values());
	}
	getParticipant(id: string) {
		return this.participants.get(id);
	}
	getConnectionStatus() {
		return this.connectionStatus;
	}
	getError() {
		return this.error;
	}
	getIsLoading() {
		return this.isLoading;
	}
}

// Singleton instance management
const sessionStates = new Map<string, QuizSessionState>();

/**
 * Get or create a quiz session state instance
 */
export function getQuizSessionState(sessionCode: string): QuizSessionState {
	if (!sessionStates.has(sessionCode)) {
		const state = new QuizSessionState();
		sessionStates.set(sessionCode, state);
		state.initSession(sessionCode);
	}

	return sessionStates.get(sessionCode)!;
}

/**
 * Clear a session state instance
 */
export function clearQuizSessionState(sessionCode: string) {
	const state = sessionStates.get(sessionCode);
	if (state) {
		state.destroy();
		sessionStates.delete(sessionCode);
	}
}

/**
 * Clear all session states
 */
export function clearAllQuizSessionStates() {
	sessionStates.forEach((state) => state.destroy());
	sessionStates.clear();
}
