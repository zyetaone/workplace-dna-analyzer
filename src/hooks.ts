import type { Handle, HandleServerError, HandleClientError } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';

// Global error handlers (server-side only)
if (typeof process !== 'undefined') {
	process.on('unhandledRejection', (reason, promise) => {
		if (import.meta.env.DEV) {
			console.error('[Unhandled Rejection]:', reason);
		}
	});
	
	process.on('uncaughtException', (error) => {
		if (import.meta.env.DEV) {
			console.error('[Uncaught Exception]:', error);
		}
		process.exit(1);
	});
}

// Performance monitoring handler
const performanceHandler: Handle = async ({ event, resolve }) => {
	const start = Date.now();
	const response = await resolve(event);
	const duration = Date.now() - start;
	
	// Log slow requests (over 1 second)
	if (duration > 1000) {
		if (import.meta.env.DEV) {
			console.warn(`Slow request: ${event.url.pathname} took ${duration}ms`);
		}
	}
	
	response.headers.set('X-Response-Time', `${duration}ms`);
	return response;
};

// Error handling handler
const errorHandler: Handle = async ({ event, resolve }) => {
	try {
		return await resolve(event);
	} catch (error) {
		if (import.meta.env.DEV) {
			console.error(`Request error on ${event.url.pathname}:`, error);
		}
		
		// Re-throw redirects
		if (error instanceof Response && error.status >= 300 && error.status < 400) {
			throw error;
		}
		
		return new Response('Internal Server Error', {
			status: 500,
			headers: { 'Content-Type': 'text/plain' }
		});
	}
};

// Server-side handle - combines all handlers in sequence
export const handle = sequence(errorHandler, performanceHandler);

// Client-side error handling
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
	if (import.meta.env.DEV) {
		console.error('Server error:', error);
	}
	
	return {
		message: 'A server error occurred',
		errorId: crypto.randomUUID()
	};
};