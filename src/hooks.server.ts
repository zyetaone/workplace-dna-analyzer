import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';

// Global error handlers for unhandled rejections
if (typeof process !== 'undefined') {
	process.on('unhandledRejection', (reason, promise) => {
		console.error('[Unhandled Rejection] at:', promise, 'reason:', reason);
		// Don't exit the process, just log the error
	});
	
	process.on('uncaughtException', (error) => {
		console.error('[Uncaught Exception]:', error);
		// Don't exit for SSE-related errors
		if (error.message?.includes('write') || error.message?.includes('stream')) {
			console.log('[Server] Ignoring stream error, continuing...');
			return;
		}
		// For other critical errors, exit
		process.exit(1);
	});
}

// Session validation hook
const sessionHandler: Handle = async ({ event, resolve }) => {
	// Check if this is a session-specific route
	const sessionMatch = event.url.pathname.match(/^\/session\/([^\/]+)/);
	
	if (sessionMatch) {
		const sessionId = sessionMatch[1];
		
		// Store session ID in locals for easy access
		event.locals.sessionId = sessionId;
		
		// For presenter routes, check if session exists and is active
		if (event.url.pathname.includes('/presenter')) {
			// Session validation happens in the page load functions
			// This is just for setting up the context
			event.locals.isPresenter = true;
		}
		
		// For attendee routes, check if attendee exists
		const attendeeMatch = event.url.pathname.match(/\/attendee\/([^\/]+)/);
		if (attendeeMatch) {
			const attendeeId = attendeeMatch[1];
			event.locals.attendeeId = attendeeId;
			event.locals.isAttendee = true;
		}
	}
	
	return resolve(event);
};

// Request timing hook for performance monitoring
const timingHandler: Handle = async ({ event, resolve }) => {
	const start = Date.now();
	
	const response = await resolve(event);
	
	const duration = Date.now() - start;
	
	// Log slow requests (over 1 second)
	if (duration > 1000) {
		console.warn(`Slow request: ${event.url.pathname} took ${duration}ms`);
	}
	
	// Add performance header
	response.headers.set('X-Response-Time', `${duration}ms`);
	
	return response;
};

// CORS handler for API routes
const corsHandler: Handle = async ({ event, resolve }) => {
	// Only apply to API routes
	if (event.url.pathname.startsWith('/api/')) {
		// Handle preflight requests
		if (event.request.method === 'OPTIONS') {
			return new Response(null, {
				headers: {
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
					'Access-Control-Allow-Headers': 'Content-Type, Authorization',
					'Access-Control-Max-Age': '86400'
				}
			});
		}
	}
	
	const response = await resolve(event);
	
	// Add CORS headers to API responses
	if (event.url.pathname.startsWith('/api/')) {
		response.headers.set('Access-Control-Allow-Origin', '*');
		response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
		response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
	}
	
	return response;
};

// Error handling hook
const errorHandler: Handle = async ({ event, resolve }) => {
	try {
		return await resolve(event);
	} catch (error) {
		console.error('Request error:', error);
		
		// Log error details
		console.error({
			url: event.url.pathname,
			method: event.request.method,
			error: error instanceof Error ? error.message : 'Unknown error'
		});
		
		// Return a generic error response
		return new Response('Internal Server Error', {
			status: 500,
			headers: {
				'Content-Type': 'text/plain'
			}
		});
	}
};

// Combine all hooks using sequence
export const handle = sequence(
	errorHandler,
	sessionHandler,
	timingHandler,
	corsHandler
);