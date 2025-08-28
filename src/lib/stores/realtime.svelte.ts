/**
 * Real-time State Management Store
 * Handles SSE (Server-Sent Events) and WebSocket connections for live updates
 */

import type { Session, Participant } from '$lib/server/db/schema';
import { appState } from './app.svelte';
import { uiState } from './ui.svelte';

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';
export type MessageType = 
	| 'participant_joined'
	| 'participant_updated' 
	| 'participant_completed'
	| 'participant_left'
	| 'session_updated'
	| 'session_ended'
	| 'analytics_update'
	| 'ping';

interface RealtimeMessage {
	type: MessageType;
	sessionId?: string;
	participant?: Participant;
	session?: Session;
	analytics?: any;
	timestamp: number;
}

interface RealtimeConfig {
	url?: string;
	reconnectDelay?: number;
	maxReconnectAttempts?: number;
	heartbeatInterval?: number;
	enableSSE?: boolean;
	enableWebSocket?: boolean;
}

class RealtimeState {
	// Connection state
	connectionState = $state<ConnectionState>('disconnected');
	connectionError = $state<string | null>(null);
	reconnectAttempts = $state<number>(0);
	lastMessageTime = $state<Date | null>(null);
	
	// Active connections
	private eventSource: EventSource | null = null;
	private webSocket: WebSocket | null = null;
	private heartbeatTimer: number | null = null;
	private reconnectTimer: number | null = null;
	
	// Configuration
	private config: Required<RealtimeConfig> = {
		url: '',
		reconnectDelay: 3000,
		maxReconnectAttempts: 5,
		heartbeatInterval: 30000,
		enableSSE: true,
		enableWebSocket: false
	};
	
	// Message queue for offline support
	private messageQueue: RealtimeMessage[] = [];
	
	// Subscription callbacks
	private listeners = new Map<string, Set<(message: RealtimeMessage) => void>>();
	
	// Derived values
	isConnected = $derived(this.connectionState === 'connected');
	isConnecting = $derived(this.connectionState === 'connecting');
	hasError = $derived(this.connectionState === 'error');
	canReconnect = $derived(
		this.reconnectAttempts < this.config.maxReconnectAttempts
	);
	
	// Initialize realtime connection
	init(sessionCode: string, config?: Partial<RealtimeConfig>) {
		// Update configuration
		this.config = { ...this.config, ...config };
		
		// Set URL based on session
		const baseUrl = typeof window !== 'undefined' 
			? window.location.origin 
			: 'http://localhost:5173';
		
		this.config.url = `${baseUrl}/api/realtime/${sessionCode}`;
		
		// Start appropriate connection type
		if (this.config.enableSSE) {
			this.connectSSE();
		} else if (this.config.enableWebSocket) {
			this.connectWebSocket();
		}
	}
	
	// Connect via Server-Sent Events (SSE)
	private connectSSE() {
		if (this.eventSource) {
			this.disconnect();
		}
		
		this.connectionState = 'connecting';
		this.connectionError = null;
		
		try {
			this.eventSource = new EventSource(this.config.url);
			
			// Handle connection open
			this.eventSource.onopen = () => {
				this.connectionState = 'connected';
				this.reconnectAttempts = 0;
				this.startHeartbeat();
				uiState.showSuccess('Connected to live updates');
				
				// Process queued messages
				this.processMessageQueue();
			};
			
			// Handle messages
			this.eventSource.onmessage = (event) => {
				try {
					const message: RealtimeMessage = JSON.parse(event.data);
					this.handleMessage(message);
				} catch (error) {
					console.error('Failed to parse SSE message:', error);
				}
			};
			
			// Handle specific event types
			this.eventSource.addEventListener('participant_joined', (event: MessageEvent) => {
				this.handleMessage(JSON.parse(event.data));
			});
			
			this.eventSource.addEventListener('participant_updated', (event: MessageEvent) => {
				this.handleMessage(JSON.parse(event.data));
			});
			
			this.eventSource.addEventListener('participant_completed', (event: MessageEvent) => {
				this.handleMessage(JSON.parse(event.data));
			});
			
			this.eventSource.addEventListener('session_updated', (event: MessageEvent) => {
				this.handleMessage(JSON.parse(event.data));
			});
			
			this.eventSource.addEventListener('analytics_update', (event: MessageEvent) => {
				this.handleMessage(JSON.parse(event.data));
			});
			
			// Handle errors
			this.eventSource.onerror = (error) => {
				console.error('SSE error:', error);
				this.connectionState = 'error';
				this.connectionError = 'Connection lost';
				this.stopHeartbeat();
				
				// Attempt reconnection
				if (this.canReconnect) {
					this.scheduleReconnect();
				} else {
					uiState.showError('Unable to connect to live updates. Please refresh the page.');
				}
			};
			
		} catch (error) {
			this.connectionState = 'error';
			this.connectionError = error instanceof Error ? error.message : 'Connection failed';
			this.scheduleReconnect();
		}
	}
	
	// Connect via WebSocket
	private connectWebSocket() {
		if (this.webSocket) {
			this.disconnect();
		}
		
		this.connectionState = 'connecting';
		this.connectionError = null;
		
		try {
			const wsUrl = this.config.url.replace(/^http/, 'ws');
			this.webSocket = new WebSocket(wsUrl);
			
			// Handle connection open
			this.webSocket.onopen = () => {
				this.connectionState = 'connected';
				this.reconnectAttempts = 0;
				this.startHeartbeat();
				uiState.showSuccess('Connected to live updates');
				
				// Process queued messages
				this.processMessageQueue();
			};
			
			// Handle messages
			this.webSocket.onmessage = (event) => {
				try {
					const message: RealtimeMessage = JSON.parse(event.data);
					this.handleMessage(message);
				} catch (error) {
					console.error('Failed to parse WebSocket message:', error);
				}
			};
			
			// Handle connection close
			this.webSocket.onclose = (event) => {
				this.connectionState = 'disconnected';
				this.stopHeartbeat();
				
				if (!event.wasClean) {
					this.connectionError = `Connection closed: ${event.reason || 'Unknown reason'}`;
					
					if (this.canReconnect) {
						this.scheduleReconnect();
					}
				}
			};
			
			// Handle errors
			this.webSocket.onerror = (error) => {
				console.error('WebSocket error:', error);
				this.connectionState = 'error';
				this.connectionError = 'WebSocket connection failed';
				this.stopHeartbeat();
				
				if (this.canReconnect) {
					this.scheduleReconnect();
				} else {
					uiState.showError('Unable to connect to live updates. Please refresh the page.');
				}
			};
			
		} catch (error) {
			this.connectionState = 'error';
			this.connectionError = error instanceof Error ? error.message : 'Connection failed';
			this.scheduleReconnect();
		}
	}
	
	// Handle incoming messages
	private handleMessage(message: RealtimeMessage) {
		this.lastMessageTime = new Date();
		
		// Update app state based on message type
		switch (message.type) {
			case 'participant_joined':
				if (message.participant) {
					appState.addParticipant(message.participant);
					uiState.addNotification({
						title: 'New Participant',
						message: `${message.participant.name || 'Someone'} joined the session`
					});
				}
				break;
				
			case 'participant_updated':
				if (message.participant) {
					appState.updateParticipant(message.participant.id, message.participant);
				}
				break;
				
			case 'participant_completed':
				if (message.participant) {
					appState.updateParticipant(message.participant.id, {
						completed: true,
						completedAt: new Date().toISOString(),
						preferenceScores: message.participant.preferenceScores
					});
					uiState.addNotification({
						title: 'Quiz Completed',
						message: `${message.participant.name || 'A participant'} completed the quiz`
					});
				}
				break;
				
			case 'participant_left':
				if (message.participant) {
					appState.removeParticipant(message.participant.id);
				}
				break;
				
			case 'session_updated':
				if (message.session) {
					appState.setSession(message.session);
				}
				break;
				
			case 'session_ended':
				appState.setSession({ ...appState.session!, isActive: false, endedAt: new Date().toISOString() });
				uiState.showWarning('Session has ended');
				this.disconnect();
				break;
				
			case 'analytics_update':
				if (message.analytics) {
					appState.setAnalytics(message.analytics);
				}
				break;
				
			case 'ping':
				// Heartbeat message, no action needed
				break;
		}
		
		// Notify listeners
		this.notifyListeners(message);
	}
	
	// Send message (WebSocket only)
	send(message: Partial<RealtimeMessage>) {
		const fullMessage: RealtimeMessage = {
			type: message.type || 'ping',
			timestamp: Date.now(),
			...message
		};
		
		if (this.webSocket && this.webSocket.readyState === WebSocket.OPEN) {
			this.webSocket.send(JSON.stringify(fullMessage));
		} else if (!this.isConnected) {
			// Queue message for later
			this.messageQueue.push(fullMessage);
		}
	}
	
	// Subscribe to messages
	subscribe(id: string, callback: (message: RealtimeMessage) => void) {
		if (!this.listeners.has(id)) {
			this.listeners.set(id, new Set());
		}
		this.listeners.get(id)!.add(callback);
		
		// Return unsubscribe function
		return () => {
			const callbacks = this.listeners.get(id);
			if (callbacks) {
				callbacks.delete(callback);
				if (callbacks.size === 0) {
					this.listeners.delete(id);
				}
			}
		};
	}
	
	// Notify all listeners
	private notifyListeners(message: RealtimeMessage) {
		for (const callbacks of this.listeners.values()) {
			for (const callback of callbacks) {
				try {
					callback(message);
				} catch (error) {
					console.error('Listener callback error:', error);
				}
			}
		}
	}
	
	// Process queued messages
	private processMessageQueue() {
		while (this.messageQueue.length > 0 && this.isConnected) {
			const message = this.messageQueue.shift();
			if (message && this.webSocket) {
				this.send(message);
			}
		}
	}
	
	// Heartbeat management
	private startHeartbeat() {
		this.stopHeartbeat();
		
		this.heartbeatTimer = window.setInterval(() => {
			if (this.isConnected) {
				this.send({ type: 'ping' });
				
				// Check for stale connection
				if (this.lastMessageTime) {
					const timeSinceLastMessage = Date.now() - this.lastMessageTime.getTime();
					if (timeSinceLastMessage > this.config.heartbeatInterval * 2) {
						console.warn('Connection appears stale, reconnecting...');
						this.reconnect();
					}
				}
			}
		}, this.config.heartbeatInterval);
	}
	
	private stopHeartbeat() {
		if (this.heartbeatTimer) {
			clearInterval(this.heartbeatTimer);
			this.heartbeatTimer = null;
		}
	}
	
	// Reconnection logic
	private scheduleReconnect() {
		if (this.reconnectTimer) {
			clearTimeout(this.reconnectTimer);
		}
		
		this.reconnectAttempts++;
		const delay = Math.min(
			this.config.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
			30000 // Max 30 seconds
		);
		
		uiState.showInfo(`Reconnecting in ${delay / 1000} seconds...`);
		
		this.reconnectTimer = window.setTimeout(() => {
			this.reconnect();
		}, delay);
	}
	
	reconnect() {
		this.disconnect();
		
		if (this.config.enableSSE) {
			this.connectSSE();
		} else if (this.config.enableWebSocket) {
			this.connectWebSocket();
		}
	}
	
	// Disconnect and cleanup
	disconnect() {
		// Close connections
		if (this.eventSource) {
			this.eventSource.close();
			this.eventSource = null;
		}
		
		if (this.webSocket) {
			this.webSocket.close();
			this.webSocket = null;
		}
		
		// Clear timers
		this.stopHeartbeat();
		
		if (this.reconnectTimer) {
			clearTimeout(this.reconnectTimer);
			this.reconnectTimer = null;
		}
		
		// Update state
		this.connectionState = 'disconnected';
		this.connectionError = null;
		this.lastMessageTime = null;
	}
	
	// Reset state
	reset() {
		this.disconnect();
		this.messageQueue = [];
		this.listeners.clear();
		this.reconnectAttempts = 0;
		this.connectionState = 'disconnected';
		this.connectionError = null;
		this.lastMessageTime = null;
	}
}

// Export singleton instance
export const realtimeState = new RealtimeState();

// Auto-cleanup on page unload
if (typeof window !== 'undefined') {
	window.addEventListener('beforeunload', () => {
		realtimeState.disconnect();
	});
	
	// Handle visibility change (pause/resume when tab is hidden)
	document.addEventListener('visibilitychange', () => {
		if (document.hidden && realtimeState.isConnected) {
			// Optional: disconnect when tab is hidden to save resources
			// realtimeState.disconnect();
		} else if (!document.hidden && !realtimeState.isConnected) {
			// Optional: reconnect when tab becomes visible
			// realtimeState.reconnect();
		}
	});
}

// Export types for use in components
export type { RealtimeState, RealtimeMessage, RealtimeConfig };