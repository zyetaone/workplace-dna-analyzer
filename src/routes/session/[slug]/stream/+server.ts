/**
 * Minimal SSE endpoint - the ONLY API route we need
 * Everything else uses remote functions
 */

import type { RequestHandler } from './$types';
import { registerClient, unregisterClient } from '$lib/server/sse-manager';

export const GET: RequestHandler = async ({ params }) => {
	const slug = params.slug;
	
	// Create SSE stream
	let streamController: ReadableStreamDefaultController;
	
	const stream = new ReadableStream({
		start(controller) {
			streamController = controller;
			// Register this client with the SSE manager
			registerClient(slug, controller);
		},
		
		cancel() {
			// Unregister on disconnect
			if (streamController) {
				unregisterClient(slug, streamController);
			}
		}
	});
	
	// Return as SSE response
	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache, no-transform',
			'Connection': 'keep-alive',
			'X-Accel-Buffering': 'no'
		}
	});
};