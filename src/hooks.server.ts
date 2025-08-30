import type { Handle } from '@sveltejs/kit';

// Temporarily disabled auth for build compatibility
// TODO: Re-enable authentication
const handleAuth: Handle = async ({ event, resolve }) => {
	// Stub auth - no authentication for now
	event.locals.user = null;
	event.locals.session = null;
	return resolve(event);
};

export const handle: Handle = handleAuth;
