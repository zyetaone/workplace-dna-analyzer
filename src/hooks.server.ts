import type { Handle } from '@sveltejs/kit';
import { setParticipantCookie, getParticipantId } from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
	// Participant tracking for anonymous users
	const isParticipantRoute = event.url.pathname.match(/^\/[A-Z0-9]+-[0-9]{6}/);
	if (isParticipantRoute) {
		let participantId = getParticipantId(event);
		if (!participantId) {
			participantId = crypto.randomUUID();
			setParticipantCookie(event.cookies, participantId);
		}
		event.locals.participantId = participantId;
	}
	
	// Add security headers
	const response = await resolve(event);
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	
	return response;
};