/**
 * Server-Sent Events endpoint for real-time updates
 * Replaces Socket.io WebSocket connections
 */

import type { RequestHandler } from './$types';
import { realtime } from '$lib/server/realtime/manager';

// Broadcast event helpers for other routes to use (must use underscore prefix)
export const _broadcastEvents = {
	attendeeJoined: (sessionId: string, attendee: any) => {
		realtime.broadcast(sessionId, 'attendee_joined', attendee);
	},
	
	responseReceived: (sessionId: string, data: any) => {
		realtime.broadcast(sessionId, 'response_received', data);
	},
	
	attendeeCompleted: (sessionId: string, attendeeId: string, scores: any) => {
		realtime.broadcast(sessionId, 'attendee_completed', {
			attendeeId,
			scores,
			timestamp: new Date()
		});
	},
	
	analytics: (sessionId: string, analytics: any) => {
		realtime.broadcast(sessionId, 'analytics', analytics);
	},
	
	attendeeDeleted: (sessionId: string, attendeeId: string) => {
		realtime.broadcast(sessionId, 'attendee_deleted', {
			attendeeId,
			timestamp: new Date()
		});
	}
};

export const GET: RequestHandler = async ({ params, request }) => {
  const sessionCode = params.id;
  
  console.log(`[SSE] Client connecting to session: ${sessionCode}`);
  
  // Create a TransformStream for SSE
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const encoder = new TextEncoder();
  
  // Add client to realtime manager
  realtime.addClient(sessionCode, writer);
  
  // Send initial connection event
  try {
    await writer.write(
      encoder.encode(`event: connected\ndata: ${JSON.stringify({ 
        sessionCode, 
        timestamp: new Date().toISOString() 
      })}\nid: ${Date.now()}\n\n`)
    );
  } catch (error) {
    console.warn('[SSE] Failed to send initial connection event:', error);
    writer.close();
    return new Response('Connection failed', { status: 500 });
  }
  
  // Heartbeat to keep connection alive
  const heartbeatInterval = setInterval(async () => {
    try {
      // SSE comment for keep-alive
      await writer.write(encoder.encode(`:heartbeat ${Date.now()}\n\n`));
    } catch (error) {
      // Connection closed, clean up
      clearInterval(heartbeatInterval);
      try {
        realtime.removeClient(sessionCode, writer);
        await writer.close();
      } catch (closeError) {
        // Ignore close errors
      }
    }
  }, 30000); // Every 30 seconds
  
  // Handle client disconnect
  request.signal.addEventListener('abort', async () => {
    console.log(`[SSE] Client disconnecting from session: ${sessionCode}`);
    clearInterval(heartbeatInterval);
    try {
      realtime.removeClient(sessionCode, writer);
      await writer.close();
    } catch (error) {
      // Ignore errors during cleanup
    }
  });
  
  // Return SSE response with proper headers
  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable Nginx buffering
      'Access-Control-Allow-Origin': '*', // Adjust for production
    }
  });
};