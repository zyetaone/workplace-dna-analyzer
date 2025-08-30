/**
 * COMPREHENSIVE SOCKET.IO SERVER
 * Advanced real-time server with activity synchronization and performance optimization
 */

import { Server as SocketIOServer } from 'socket.io';
import type { Server as HTTPServer } from 'http';

export interface ConnectedParticipant {
	id: string;
	socketId: string;
	sessionId: string;
	isPresenter?: boolean;
	joinedAt: Date;
	lastActivity?: Date;
	connectionQuality?: 'good' | 'fair' | 'poor';
}

export interface ActivityState {
	sessionId: string;
	activityId: string;
	activityType: string;
	currentState: 'waiting' | 'active' | 'paused' | 'completed';
	currentQuestion?: number;
	timeRemaining?: number;
	participantCount: number;
	responses: Record<string, any>;
	startTime?: Date;
	endTime?: Date;
}

export interface SessionAnalytics {
	sessionId: string;
	participantCount: number;
	activeParticipants: number;
	totalResponses: number;
	averageResponseTime: number;
	connectionStats: {
		totalConnections: number;
		activeConnections: number;
		droppedConnections: number;
		averageConnectionTime: number;
	};
	activityStats: Record<string, ActivityState>;
}

export class SocketServer {
	private io: SocketIOServer;
	private participants = new Map<string, ConnectedParticipant>();
	private sessionParticipants = new Map<string, Set<string>>();
	private activityStates = new Map<string, ActivityState>();
	private sessionAnalytics = new Map<string, SessionAnalytics>();
	private messageQueue = new Map<string, Array<{ event: string; data: any; timestamp: number }>>();
	private heartbeatIntervals = new Map<string, NodeJS.Timeout>();
	private batchingTimers = new Map<string, NodeJS.Timeout>();

	// Performance optimization settings
	private readonly BATCH_DELAY = 100; // ms
	private readonly HEARTBEAT_INTERVAL = 30000; // ms
	private readonly MAX_BATCH_SIZE = 50;
	private readonly CONNECTION_TIMEOUT = 60000; // ms

	constructor(server: HTTPServer) {
		this.io = new SocketIOServer(server, {
			cors: {
				origin: '*',
				methods: ['GET', 'POST']
			},
			pingTimeout: 60000,
			pingInterval: 25000,
			transports: ['websocket', 'polling'],
			allowEIO3: true,
			maxHttpBufferSize: 1e8, // 100MB
			connectTimeout: 45000
		});

		this.setupEventHandlers();
		this.startPeriodicCleanup();
		console.log('🚀 Comprehensive Socket.IO server initialized');
	}

	private setupEventHandlers() {
		this.io.on('connection', (socket) => {
			console.log(`🔗 Client connected: ${socket.id}`);

			// Start heartbeat monitoring
			this.startHeartbeat(socket);

			socket.on('join_session', (data) => {
				this.handleJoinSession(socket, data);
			});

			socket.on('leave_session', (data) => {
				this.handleLeaveSession(socket, data);
			});

			socket.on('activity_response', (data) => {
				this.handleActivityResponse(socket, data);
			});

			socket.on('presenter_command', (data) => {
				this.handlePresenterCommand(socket, data);
			});

			socket.on('heartbeat', (data) => {
				this.handleHeartbeat(socket, data);
			});

			socket.on('activity_state_request', (data) => {
				this.handleActivityStateRequest(socket, data);
			});

			socket.on('batch_responses', (data) => {
				this.handleBatchResponses(socket, data);
			});

			socket.on('disconnect', () => {
				this.handleDisconnect(socket);
			});
		});
	}

	private startPeriodicCleanup() {
		// Clean up inactive connections every 5 minutes
		setInterval(
			() => {
				this.cleanupInactiveConnections();
			},
			5 * 60 * 1000
		);

		// Clean up old analytics every hour
		setInterval(
			() => {
				this.cleanupOldAnalytics();
			},
			60 * 60 * 1000
		);
	}

	private startHeartbeat(socket: any) {
		const interval = setInterval(() => {
			socket.emit('heartbeat_request', { timestamp: Date.now() });
		}, this.HEARTBEAT_INTERVAL);

		this.heartbeatIntervals.set(socket.id, interval);
	}

	private stopHeartbeat(socketId: string) {
		const interval = this.heartbeatIntervals.get(socketId);
		if (interval) {
			clearInterval(interval);
			this.heartbeatIntervals.delete(socketId);
		}
	}

	private handleJoinSession(socket: any, data: any) {
		const { sessionId, participantId } = data;

		if (!sessionId || !participantId) {
			socket.emit('error', { message: 'Session ID and Participant ID required' });
			return;
		}

		// Create participant record
		const participant: ConnectedParticipant = {
			id: participantId,
			socketId: socket.id,
			sessionId,
			joinedAt: new Date()
		};

		// Store participant
		this.participants.set(socket.id, participant);

		// Add to session
		if (!this.sessionParticipants.has(sessionId)) {
			this.sessionParticipants.set(sessionId, new Set());
		}
		this.sessionParticipants.get(sessionId)!.add(socket.id);

		// Join socket room
		socket.join(sessionId);

		// Notify others in session
		socket.to(sessionId).emit('participant_joined', {
			participantId,
			sessionId,
			timestamp: Date.now()
		});

		// Confirm join to client
		socket.emit('session_joined', {
			sessionId,
			participantId,
			timestamp: Date.now()
		});

		console.log(`👥 ${participantId} joined session ${sessionId}`);
	}

	private handleLeaveSession(socket: any, data: any) {
		const participant = this.participants.get(socket.id);
		if (!participant) return;

		this.removeParticipant(socket.id);

		// Notify others
		socket.to(participant.sessionId).emit('participant_left', {
			participantId: participant.id,
			sessionId: participant.sessionId,
			timestamp: Date.now()
		});

		console.log(`👋 ${participant.id} left session ${participant.sessionId}`);
	}

	private handleActivityResponse(socket: any, data: any) {
		const participant = this.participants.get(socket.id);
		if (!participant) return;

		const { response, activityId, activityType } = data;

		// Update activity state
		this.updateActivityState(participant.sessionId, [
			{
				participantId: participant.id,
				activityId: activityId || 'default',
				activityType: activityType || 'unknown',
				response,
				timestamp: Date.now()
			}
		]);

		// Broadcast response to session (excluding sender)
		socket.to(participant.sessionId).emit('response_received', {
			participantId: participant.id,
			sessionId: participant.sessionId,
			activityId: activityId || 'default',
			response,
			timestamp: Date.now()
		});

		// Send confirmation to sender
		socket.emit('response_confirmed', {
			activityId: activityId || 'default',
			timestamp: Date.now()
		});

		console.log(`📝 Response from ${participant.id} in ${participant.sessionId}`);
	}

	private handlePresenterCommand(socket: any, data: any) {
		const participant = this.participants.get(socket.id);
		if (!participant) return;

		const { command, data: commandData, activityId } = data;

		// Handle different presenter commands
		switch (command) {
			case 'start_activity':
				this.handleStartActivity(socket, participant, commandData);
				break;
			case 'pause_activity':
				this.handlePauseActivity(socket, participant, commandData);
				break;
			case 'resume_activity':
				this.handleResumeActivity(socket, participant, commandData);
				break;
			case 'end_activity':
				this.handleEndActivity(socket, participant, commandData);
				break;
			case 'next_question':
				this.handleNextQuestion(socket, participant, commandData);
				break;
			case 'show_results':
				this.handleShowResults(socket, participant, commandData);
				break;
			default:
				// Broadcast generic command to session
				socket.to(participant.sessionId).emit('presenter_command', {
					command,
					data: commandData,
					activityId,
					timestamp: Date.now()
				});
		}

		console.log(`🎭 Presenter command: ${command} in ${participant.sessionId}`);
	}

	private handleStartActivity(socket: any, participant: ConnectedParticipant, data: any) {
		const { activityId, activityType, config } = data;

		const activityState: ActivityState = {
			sessionId: participant.sessionId,
			activityId,
			activityType,
			currentState: 'active',
			participantCount: this.sessionParticipants.get(participant.sessionId)?.size || 0,
			responses: {},
			startTime: new Date(),
			currentQuestion: 0
		};

		this.activityStates.set(`${participant.sessionId}:${activityId}`, activityState);

		// Broadcast to all participants in session
		this.io.to(participant.sessionId).emit('activity_started', {
			activityId,
			activityType,
			config,
			state: activityState,
			timestamp: Date.now()
		});
	}

	private handlePauseActivity(socket: any, participant: ConnectedParticipant, data: any) {
		const { activityId } = data;
		const stateKey = `${participant.sessionId}:${activityId}`;
		const activityState = this.activityStates.get(stateKey);

		if (activityState) {
			activityState.currentState = 'paused';
			this.activityStates.set(stateKey, activityState);

			this.io.to(participant.sessionId).emit('activity_paused', {
				activityId,
				timestamp: Date.now()
			});
		}
	}

	private handleResumeActivity(socket: any, participant: ConnectedParticipant, data: any) {
		const { activityId } = data;
		const stateKey = `${participant.sessionId}:${activityId}`;
		const activityState = this.activityStates.get(stateKey);

		if (activityState) {
			activityState.currentState = 'active';
			this.activityStates.set(stateKey, activityState);

			this.io.to(participant.sessionId).emit('activity_resumed', {
				activityId,
				timestamp: Date.now()
			});
		}
	}

	private handleEndActivity(socket: any, participant: ConnectedParticipant, data: any) {
		const { activityId } = data;
		const stateKey = `${participant.sessionId}:${activityId}`;
		const activityState = this.activityStates.get(stateKey);

		if (activityState) {
			activityState.currentState = 'completed';
			activityState.endTime = new Date();
			this.activityStates.set(stateKey, activityState);

			this.io.to(participant.sessionId).emit('activity_ended', {
				activityId,
				finalState: activityState,
				timestamp: Date.now()
			});
		}
	}

	private handleNextQuestion(socket: any, participant: ConnectedParticipant, data: any) {
		const { activityId, questionIndex } = data;
		const stateKey = `${participant.sessionId}:${activityId}`;
		const activityState = this.activityStates.get(stateKey);

		if (activityState) {
			activityState.currentQuestion = questionIndex;
			activityState.responses = {}; // Clear responses for new question
			this.activityStates.set(stateKey, activityState);

			this.io.to(participant.sessionId).emit('question_changed', {
				activityId,
				questionIndex,
				timestamp: Date.now()
			});
		}
	}

	private handleShowResults(socket: any, participant: ConnectedParticipant, data: any) {
		const { activityId } = data;
		const stateKey = `${participant.sessionId}:${activityId}`;
		const activityState = this.activityStates.get(stateKey);

		if (activityState) {
			this.io.to(participant.sessionId).emit('results_display', {
				activityId,
				results: activityState.responses,
				timestamp: Date.now()
			});
		}
	}

	private handleDisconnect(socket: any) {
		const participant = this.participants.get(socket.id);
		if (participant) {
			this.removeParticipant(socket.id);

			// Stop heartbeat monitoring
			this.stopHeartbeat(socket.id);

			// Notify others
			socket.to(participant.sessionId).emit('participant_left', {
				participantId: participant.id,
				sessionId: participant.sessionId,
				timestamp: Date.now()
			});

			console.log(`🔌 ${participant.id} disconnected from ${participant.sessionId}`);
		}
	}

	private handleHeartbeat(socket: any, data: any) {
		const participant = this.participants.get(socket.id);
		if (participant) {
			participant.lastActivity = new Date();
			participant.connectionQuality = this.calculateConnectionQuality(socket, data);
		}
	}

	private handleActivityStateRequest(socket: any, data: any) {
		const { sessionId, activityId } = data;
		const activityState = this.activityStates.get(`${sessionId}:${activityId}`);

		if (activityState) {
			socket.emit('activity_state_update', activityState);
		}
	}

	private handleBatchResponses(socket: any, data: any) {
		const participant = this.participants.get(socket.id);
		if (!participant) return;

		const { responses } = data;

		// Process batch of responses
		const processedResponses = responses.map((response: any) => ({
			...response,
			participantId: participant.id,
			sessionId: participant.sessionId,
			timestamp: Date.now()
		}));

		// Update activity state
		this.updateActivityState(participant.sessionId, processedResponses);

		// Broadcast batch update
		socket.to(participant.sessionId).emit('batch_responses_received', {
			responses: processedResponses,
			timestamp: Date.now()
		});

		console.log(`📦 Batch of ${responses.length} responses from ${participant.id}`);
	}

	private calculateConnectionQuality(socket: any, heartbeatData: any): 'good' | 'fair' | 'poor' {
		const latency = Date.now() - heartbeatData.timestamp;
		if (latency < 100) return 'good';
		if (latency < 500) return 'fair';
		return 'poor';
	}

	private updateActivityState(sessionId: string, responses: any[]) {
		// Group responses by activity
		const activityResponses = new Map<string, any[]>();

		responses.forEach((response) => {
			const activityId = response.activityId || 'default';
			if (!activityResponses.has(activityId)) {
				activityResponses.set(activityId, []);
			}
			activityResponses.get(activityId)!.push(response);
		});

		// Update activity states
		activityResponses.forEach((responses, activityId) => {
			const stateKey = `${sessionId}:${activityId}`;
			const currentState = this.activityStates.get(stateKey) || {
				sessionId,
				activityId,
				activityType: 'unknown',
				currentState: 'active',
				participantCount: 0,
				responses: {}
			};

			// Update response counts
			responses.forEach((response) => {
				const participantId = response.participantId;
				if (!currentState.responses[participantId]) {
					currentState.responses[participantId] = [];
				}
				currentState.responses[participantId].push(response);
			});

			// Update participant count
			const sessionParticipants = this.sessionParticipants.get(sessionId);
			currentState.participantCount = sessionParticipants ? sessionParticipants.size : 0;

			this.activityStates.set(stateKey, currentState);

			// Broadcast state update
			this.io.to(sessionId).emit('activity_state_update', currentState);
		});
	}

	private cleanupInactiveConnections() {
		const now = Date.now();
		const timeoutMs = this.CONNECTION_TIMEOUT;

		for (const [socketId, participant] of this.participants.entries()) {
			if (participant.lastActivity && now - participant.lastActivity.getTime() > timeoutMs) {
				console.log(`🧹 Cleaning up inactive connection: ${participant.id}`);
				this.removeParticipant(socketId);
			}
		}
	}

	private cleanupOldAnalytics() {
		const oneHourAgo = Date.now() - 60 * 60 * 1000;

		for (const [sessionId, analytics] of this.sessionAnalytics.entries()) {
			// Remove analytics older than 1 hour
			if (analytics && typeof analytics === 'object' && 'lastUpdated' in analytics) {
				if ((analytics as any).lastUpdated < oneHourAgo) {
					this.sessionAnalytics.delete(sessionId);
				}
			}
		}
	}

	private removeParticipant(socketId: string) {
		const participant = this.participants.get(socketId);
		if (!participant) return;

		// Remove from session
		const sessionParticipants = this.sessionParticipants.get(participant.sessionId);
		if (sessionParticipants) {
			sessionParticipants.delete(socketId);
			if (sessionParticipants.size === 0) {
				this.sessionParticipants.delete(participant.sessionId);
			}
		}

		// Remove participant record
		this.participants.delete(socketId);
	}

	// Enhanced Public API for comprehensive real-time functionality
	broadcastToSession(sessionId: string, event: string, data: any) {
		this.io.to(sessionId).emit(event, data);
	}

	sendToParticipant(sessionId: string, participantId: string, event: string, data: any) {
		// Find participant's socket
		for (const [socketId, participant] of this.participants.entries()) {
			if (participant.sessionId === sessionId && participant.id === participantId) {
				this.io.to(socketId).emit(event, data);
				break;
			}
		}
	}

	sendToPresenter(sessionId: string, event: string, data: any) {
		// Find presenter's socket
		for (const [socketId, participant] of this.participants.entries()) {
			if (participant.sessionId === sessionId && participant.isPresenter) {
				this.io.to(socketId).emit(event, data);
				break;
			}
		}
	}

	broadcastToNonPresenter(sessionId: string, event: string, data: any) {
		// Send to all participants except presenter
		for (const [socketId, participant] of this.participants.entries()) {
			if (participant.sessionId === sessionId && !participant.isPresenter) {
				this.io.to(socketId).emit(event, data);
			}
		}
	}

	// Activity Management API
	startActivity(sessionId: string, activityId: string, activityType: string, config?: any) {
		const activityState: ActivityState = {
			sessionId,
			activityId,
			activityType,
			currentState: 'active',
			participantCount: this.sessionParticipants.get(sessionId)?.size || 0,
			responses: {},
			startTime: new Date(),
			currentQuestion: 0
		};

		this.activityStates.set(`${sessionId}:${activityId}`, activityState);

		this.broadcastToSession(sessionId, 'activity_started', {
			activityId,
			activityType,
			config,
			state: activityState,
			timestamp: Date.now()
		});

		return activityState;
	}

	updateActivityState(sessionId: string, activityId: string, updates: Partial<ActivityState>) {
		const stateKey = `${sessionId}:${activityId}`;
		const currentState = this.activityStates.get(stateKey);

		if (currentState) {
			const updatedState = { ...currentState, ...updates };
			this.activityStates.set(stateKey, updatedState);

			this.broadcastToSession(sessionId, 'activity_state_update', updatedState);
			return updatedState;
		}

		return null;
	}

	endActivity(sessionId: string, activityId: string) {
		const stateKey = `${sessionId}:${activityId}`;
		const activityState = this.activityStates.get(stateKey);

		if (activityState) {
			activityState.currentState = 'completed';
			activityState.endTime = new Date();
			this.activityStates.set(stateKey, activityState);

			this.broadcastToSession(sessionId, 'activity_ended', {
				activityId,
				finalState: activityState,
				timestamp: Date.now()
			});

			return activityState;
		}

		return null;
	}

	// Real-time Analytics API
	updateSessionAnalytics(sessionId: string) {
		const participants = this.getSessionParticipants(sessionId);
		const participantDetails = participants
			.map((id) => {
				for (const [socketId, participant] of this.participants.entries()) {
					if (participant.sessionId === sessionId && participant.id === id) {
						return participant;
					}
				}
				return null;
			})
			.filter((p) => p !== null);

		const analytics: SessionAnalytics = {
			sessionId,
			participantCount: participants.length,
			activeParticipants: participantDetails.filter((p) => p!.connectionQuality !== 'poor').length,
			totalResponses: 0,
			averageResponseTime: 0,
			connectionStats: {
				totalConnections: this.participants.size,
				activeConnections: Array.from(this.participants.values()).filter(
					(p) => p.connectionQuality !== 'poor'
				).length,
				droppedConnections: 0, // Would need to track this
				averageConnectionTime: 0 // Would need to calculate this
			},
			activityStats: {}
		};

		// Calculate activity stats
		for (const [stateKey, activityState] of this.activityStates.entries()) {
			if (stateKey.startsWith(`${sessionId}:`)) {
				const activityId = stateKey.split(':')[1];
				analytics.activityStats[activityId] = activityState;

				// Count responses
				const responseCount = Object.values(activityState.responses).reduce((count, responses) => {
					return count + (Array.isArray(responses) ? responses.length : 0);
				}, 0);
				analytics.totalResponses += responseCount;
			}
		}

		this.sessionAnalytics.set(sessionId, analytics);

		// Broadcast analytics update to presenter
		this.sendToPresenter(sessionId, 'analytics_update', analytics);

		return analytics;
	}

	// Connection Quality Management
	getConnectionQuality(sessionId: string): Record<string, 'good' | 'fair' | 'poor'> {
		const qualities: Record<string, 'good' | 'fair' | 'poor'> = {};

		for (const [socketId, participant] of this.participants.entries()) {
			if (participant.sessionId === sessionId) {
				qualities[participant.id] = participant.connectionQuality || 'poor';
			}
		}

		return qualities;
	}

	// Batch Operations for Performance
	sendBatchUpdate(sessionId: string, updates: Array<{ event: string; data: any }>) {
		const batchData = {
			updates,
			timestamp: Date.now(),
			batchId: crypto.randomUUID()
		};

		this.broadcastToSession(sessionId, 'batch_update', batchData);
	}

	// Session Management API
	getSessionInfo(sessionId: string) {
		const participants = this.getSessionParticipants(sessionId);
		const participantDetails = participants
			.map((id) => {
				for (const [socketId, participant] of this.participants.entries()) {
					if (participant.sessionId === sessionId && participant.id === id) {
						return {
							id: participant.id,
							isPresenter: participant.isPresenter,
							joinedAt: participant.joinedAt,
							connectionQuality: participant.connectionQuality,
							lastActivity: participant.lastActivity
						};
					}
				}
				return null;
			})
			.filter((p) => p !== null);

		const activities = Array.from(this.activityStates.entries())
			.filter(([key]) => key.startsWith(`${sessionId}:`))
			.map(([key, state]) => ({
				activityId: key.split(':')[1],
				state
			}));

		return {
			sessionId,
			participantCount: participants.length,
			participants: participantDetails,
			activeActivities: activities,
			analytics: this.sessionAnalytics.get(sessionId)
		};
	}

	// Enhanced Statistics API
	getEnhancedStats() {
		const baseStats = this.getStats();

		// Add connection quality stats
		const connectionQualities = Array.from(this.participants.values()).reduce(
			(acc, participant) => {
				const quality = participant.connectionQuality || 'poor';
				acc[quality] = (acc[quality] || 0) + 1;
				return acc;
			},
			{} as Record<string, number>
		);

		// Add activity stats
		const activityStats = {
			totalActivities: this.activityStates.size,
			activeActivities: Array.from(this.activityStates.values()).filter(
				(state) => state.currentState === 'active'
			).length,
			completedActivities: Array.from(this.activityStates.values()).filter(
				(state) => state.currentState === 'completed'
			).length
		};

		return {
			...baseStats,
			connectionQualities,
			activityStats,
			averageParticipantsPerSession:
				baseStats.activeSessions > 0
					? Math.round((baseStats.totalConnections / baseStats.activeSessions) * 100) / 100
					: 0
		};
	}

	// Cleanup API
	forceDisconnectParticipant(sessionId: string, participantId: string) {
		for (const [socketId, participant] of this.participants.entries()) {
			if (participant.sessionId === sessionId && participant.id === participantId) {
				this.io.to(socketId).emit('force_disconnect', {
					reason: 'Administrative action',
					timestamp: Date.now()
				});
				this.io.sockets.sockets.get(socketId)?.disconnect(true);
				break;
			}
		}
	}

	clearSessionData(sessionId: string) {
		// Remove all activity states for this session
		for (const [stateKey] of this.activityStates.entries()) {
			if (stateKey.startsWith(`${sessionId}:`)) {
				this.activityStates.delete(stateKey);
			}
		}

		// Remove analytics
		this.sessionAnalytics.delete(sessionId);

		// Disconnect all participants
		const sessionSockets = this.sessionParticipants.get(sessionId);
		if (sessionSockets) {
			for (const socketId of sessionSockets) {
				this.io.sockets.sockets.get(socketId)?.disconnect(true);
			}
		}

		console.log(`🧹 Cleared all data for session ${sessionId}`);
	}
}

// Export for use in hooks.server.ts
export let socketServer: SocketServer;
