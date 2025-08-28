/**
 * Participant tracking utilities for cookie-based anonymous participants
 */

import type { RequestEvent } from '@sveltejs/kit';
import { db } from './db';
import { sessions, participants } from './db/schema';
import { eq, and } from 'drizzle-orm';
import { getParticipantCookie, setParticipantCookie } from './auth';

/**
 * Get or create anonymous participant for a session
 * This is called when someone visits a /[code] route
 */
export async function getOrCreateAnonymousParticipant(
	event: RequestEvent,
	sessionCode: string
): Promise<{ participantId: string; isNew: boolean }> {
	// Get existing participant cookie
	const existingCookieId = getParticipantCookie(event);
	
	// Find the session first
	const [session] = await db
		.select()
		.from(sessions)
		.where(eq(sessions.code, sessionCode))
		.limit(1);
		
	if (!session) {
		throw new Error('Session not found');
	}
	
	// If they have a cookie, try to find existing participant
	if (existingCookieId) {
		const [existingParticipant] = await db
			.select()
			.from(participants)
			.where(
				and(
					eq(participants.cookieId, existingCookieId),
					eq(participants.sessionId, session.id)
				)
			)
			.limit(1);
			
		if (existingParticipant) {
			return { participantId: existingParticipant.id, isNew: false };
		}
	}
	
	// Generate new cookie ID and create participant
	const newCookieId = crypto.randomUUID();
	
	const [newParticipant] = await db
		.insert(participants)
		.values({
			sessionId: session.id,
			cookieId: newCookieId
		} as any)
		.returning();
	
	// Set the cookie for future requests
	setParticipantCookie(event.cookies, newCookieId);
	
	return { participantId: newParticipant.id, isNew: true };
}

/**
 * Get participant by cookie for the current session
 */
export async function getParticipantByCookie(
	event: RequestEvent,
	sessionCode: string
): Promise<{ id: string; name: string | null; completed: boolean } | null> {
	const cookieId = getParticipantCookie(event);
	
	if (!cookieId) {
		return null;
	}
	
	// Find session and participant
	const [session] = await db
		.select()
		.from(sessions)
		.where(eq(sessions.code, sessionCode))
		.limit(1);
		
	if (!session) {
		return null;
	}
	
	const [participant] = await db
		.select({
			id: participants.id,
			name: participants.name,
			completed: participants.completed
		})
		.from(participants)
		.where(
			and(
				eq(participants.cookieId, cookieId),
				eq(participants.sessionId, session.id)
			)
		)
		.limit(1);
		
	return participant || null;
}