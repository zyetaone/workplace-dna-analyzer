import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { sessions, attendees } from '$lib/server/db/schema';
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
			let lastState: { count: number; completed: number } = { count: 0, completed: 0 };
			let isActive = true;
			
			// Query function to get current participant state
			async function getParticipantState() {
				try {
					const participants = await db.select({
						id: attendees.id,
						name: attendees.name,
						generation: attendees.generation,
						completed: attendees.completed,
						completedAt: attendees.completedAt,
						preferenceScores: attendees.preferenceScores
					})
					.from(attendees)
					.where(eq(attendees.sessionId, sessionData.id));
					
					return {
						count: participants.length,
						completed: participants.filter(p => p.completed).length,
						participants: participants.map(p => ({
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
				lastState = { count: initialState.count, completed: initialState.completed };
				controller.enqueue(encoder.encode(formatSSE('update', initialState)));
			}
			
			// Polling interval (500ms)
			const pollInterval = setInterval(async () => {
				if (!isActive) {
					clearInterval(pollInterval);
					return;
				}
				
				const currentState = await getParticipantState();
				if (!currentState) return;
				
				// Check if state has changed
				if (currentState.count !== lastState.count || 
				    currentState.completed !== lastState.completed) {
					lastState = { count: currentState.count, completed: currentState.completed };
					controller.enqueue(encoder.encode(formatSSE('update', currentState)));
				}
			}, 500);
			
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
			console.log(`SSE connection closed for session ${slug}`);
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