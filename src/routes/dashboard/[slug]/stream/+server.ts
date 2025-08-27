import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { sessions, participants } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { Generation } from '$lib/types';

// Helper to format SSE message
function formatSSE(event: string, data: any): string {
	const lines = [
		`event: ${event}`,
		`data: ${JSON.stringify(data)}`,
		'', // Empty line to end the event
		''  // Double newline for SSE spec
	];
	return lines.join('\n');
}

export const GET: RequestHandler = async ({ params, setHeaders }) => {
	const { slug } = params;
	
	if (!slug) {
		return json({ error: 'Session slug is required' }, { status: 400 });
	}
	
	// Verify session exists
	const session = await db.select()
		.from(sessions)
		.where(eq(sessions.slug, slug))
		.limit(1);
		
	if (session.length === 0) {
		return json({ error: 'Session not found' }, { status: 404 });
	}
	
	const sessionData = session[0];
	
	// Set headers for SSE
	setHeaders({
		'Content-Type': 'text/event-stream',
		'Cache-Control': 'no-cache',
		'Connection': 'keep-alive',
		'X-Accel-Buffering': 'no' // Disable Nginx buffering
	});
	
	// Create readable stream
	const stream = new ReadableStream({
		async start(controller) {
			const encoder = new TextEncoder();
			let lastState: { count: number; completed: number; lastParticipantId: string | null } = { 
				count: 0, 
				completed: 0,
				lastParticipantId: null
			};
			let isActive = true;
			
			// Query function to get current participant state
			async function getParticipantState() {
				try {
					const participantList = await db.select({
						id: participants.id,
						name: participants.name,
						generation: participants.generation,
						completed: participants.completed,
						completedAt: participants.completedAt,
						preferenceScores: participants.preferenceScores
					})
					.from(participants)
					.where(eq(participants.sessionId, sessionData.id));
					
					return {
						count: participantList.length,
						completed: participantList.filter(p => p.completed).length,
						participants: participantList.map(p => ({
							id: p.id,
							name: p.name,
							generation: p.generation,
							completed: p.completed,
							completedAt: p.completedAt,
							scores: p.preferenceScores
						}))
					};
				} catch (error) {
					console.error('Error querying participants:', error);
					return null;
				}
			}
			
			// Send initial connection event
			controller.enqueue(encoder.encode(formatSSE('connected', { 
				sessionId: sessionData.id,
				sessionSlug: slug,
				timestamp: new Date().toISOString()
			})));
			
			// Send initial state
			const initialState = await getParticipantState();
			if (initialState) {
				lastState = { 
					count: initialState.count, 
					completed: initialState.completed,
					lastParticipantId: initialState.participants[initialState.participants.length - 1]?.id || null
				};
				controller.enqueue(encoder.encode(formatSSE('update', initialState)));
			}
			
			// Polling interval optimized to 2 seconds
			const pollInterval = setInterval(async () => {
				if (!isActive) {
					clearInterval(pollInterval);
					return;
				}
				
				const currentState = await getParticipantState();
				if (!currentState) return;
				
				// Check if state has changed - send only delta
				const lastId = currentState.participants[currentState.participants.length - 1]?.id || null;
				if (currentState.count !== lastState.count || 
				    currentState.completed !== lastState.completed ||
				    lastId !== lastState.lastParticipantId) {
					
					// Send only the changed participants (delta)
					const delta = {
						count: currentState.count,
						completed: currentState.completed,
						participants: currentState.count > lastState.count 
							? currentState.participants.slice(-1) // Only new participant
							: currentState.participants // Full list if count decreased
					};
					
					lastState = { 
						count: currentState.count, 
						completed: currentState.completed,
						lastParticipantId: lastId
					};
					controller.enqueue(encoder.encode(formatSSE('update', delta)));
				}
			}, 2000); // Increased to 2 seconds
			
			// Heartbeat interval (30 seconds)
			const heartbeatInterval = setInterval(() => {
				if (!isActive) {
					clearInterval(heartbeatInterval);
					return;
				}
				
				controller.enqueue(encoder.encode(formatSSE('heartbeat', { 
					timestamp: new Date().toISOString(),
					sessionActive: true
				})));
			}, 30000);
			
			// Cleanup function
			const cleanup = () => {
				isActive = false;
				clearInterval(pollInterval);
				clearInterval(heartbeatInterval);
			};
			
			// Handle cancellation
			return cleanup;
		},
		
		cancel() {
			// Stream was cancelled (client disconnected)
			// SSE connection closed for session
		}
	});
	
	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			'Connection': 'keep-alive',
			'X-Accel-Buffering': 'no'
		}
	});
};

// Optional: POST endpoint to manually trigger updates (useful for testing)
export const POST: RequestHandler = async ({ params, request }) => {
	const { slug } = params;
	
	if (!slug) {
		return json({ error: 'Session slug is required' }, { status: 400 });
	}
	
	// This could be used to trigger immediate updates to all connected clients
	// For now, just return success as the polling will pick up changes
	return json({ 
		success: true, 
		message: 'Update notification received',
		slug 
	});
};