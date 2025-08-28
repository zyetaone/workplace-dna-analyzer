/**
 * Participant tracking utilities
 */

import { dev } from '$app/environment';
import type { Cookies, RequestEvent } from '@sveltejs/kit';

// Participant cookie config
export const PARTICIPANT_CONFIG = {
	cookieName: 'participant_id',
	maxAge: 60 * 60 * 24 * 7, // 7 days
	httpOnly: true,
	secure: !dev,
	sameSite: 'lax' as const,
	path: '/'
};

/**
 * Get participant cookie value
 */
export function getParticipantCookie(event: RequestEvent): string | null {
	return event.cookies.get(PARTICIPANT_CONFIG.cookieName) || null;
}

/**
 * Get participant ID from cookies (alias for getParticipantCookie)
 */
export function getParticipantId(event: RequestEvent): string | null {
	return getParticipantCookie(event);
}

/**
 * Set participant cookie
 */
export function setParticipantCookie(cookies: Cookies, participantId: string): void {
	cookies.set(PARTICIPANT_CONFIG.cookieName, participantId, {
		httpOnly: PARTICIPANT_CONFIG.httpOnly,
		secure: PARTICIPANT_CONFIG.secure,
		sameSite: PARTICIPANT_CONFIG.sameSite,
		path: PARTICIPANT_CONFIG.path,
		maxAge: PARTICIPANT_CONFIG.maxAge
	});
}