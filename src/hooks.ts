import type { Handle, HandleClientError, HandleServerError } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';

// Global error handlers for SSE and streaming (server-side only)
if (typeof process !== 'undefined') {
	process.on('unhandledRejection', (reason, promise) => {
		console.error('[Unhandled Rejection]:', reason);
	});
	
	process.on('uncaughtException', (error) => {
		console.error('[Uncaught Exception]:', error);
		// Ignore stream errors (SSE connections closing)
		if (error.message?.includes('write') || error.message?.includes('stream')) {
			return;
		}
		process.exit(1);
	});
}

// Performance monitoring hook (server-side)
const performanceHandler: Handle = async ({ event, resolve }) => {
	const start = Date.now();
	const response = await resolve(event);
	const duration = Date.now() - start;
	
	// Log slow requests (over 1 second)
	if (duration > 1000 && !event.url.pathname.includes('/stream')) {
		console.warn(`Slow request: ${event.url.pathname} took ${duration}ms`);
	}
	
	response.headers.set('X-Response-Time', `${duration}ms`);
	return response;
};

// Error handling hook (server-side)
const errorHandler: Handle = async ({ event, resolve }) => {
	try {
		return await resolve(event);
	} catch (error) {
		console.error(`Request error on ${event.url.pathname}:`, error);
		
		return new Response('Internal Server Error', {
			status: 500,
			headers: { 'Content-Type': 'text/plain' }
		});
	}
};

// Server-side handle - will be used on server side only
export const handle = sequence(errorHandler, performanceHandler);

// Client-side error handling - will be used on client side only
export const handleError: HandleClientError = ({ error, event }) => {
	// Log errors in development
	if (import.meta.env.DEV) {
		console.error('Client error:', error);
	}
	
	// Return user-friendly error with ID for tracking
	return {
		message: 'An unexpected error occurred',
		errorId: crypto.randomUUID()
	};
};

// Server-side error handling
export const handleServerError: HandleServerError = ({ error, event }) => {
	console.error('Server error:', error);
	
	return {
		message: 'A server error occurred',
		errorId: crypto.randomUUID()
	};
};