import { query, command } from '$app/server';
import * as v from 'valibot';
import { db } from '$lib/server/db/index';
import { sessions, attendees } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { _broadcastEvents as broadcastEvents } from './api/sessions/[id]/stream/+server';
import { error } from '@sveltejs/kit';

// ============= SESSION MANAGEMENT =============

/**
 * Create a new session
 */
const CreateSessionSchema = v.object({
	title: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
	presenterId: v.pipe(v.string(), v.minLength(1))
});

export const createSession = command(CreateSessionSchema, async ({ title, presenterId }) => {
	const code = nanoid(8).toUpperCase();
	
	const [session] = await db.insert(sessions).values({
		code,
		name: title
	}).returning();
	
	return { 
		success: true, 
		session,
		redirect: `/session/${session.id}/presenter`
	};
});

/**
 * Get session by ID - can be called directly from components
 */
export const getSession = query(v.string(), async (sessionId) => {
	const [session] = await db
		.select()
		.from(sessions)
		.where(eq(sessions.id, sessionId));
	
	if (!session) {
		error(404, 'Session not found');
	}
	
	// Get all attendees for this session
	const sessionAttendees = await db
		.select()
		.from(attendees)
		.where(eq(attendees.sessionId, sessionId));
	
	return { 
		...session,
		attendees: sessionAttendees
	};
});

/**
 * Get session by code - for join page
 */
export const getSessionByCode = query(v.string(), async (code) => {
	const [session] = await db
		.select()
		.from(sessions)
		.where(eq(sessions.code, code.toUpperCase()));
	
	if (!session) {
		error(404, 'Session not found');
	}
	
	return session;
});

/**
 * Get all active sessions for join page
 */
export const getActiveSessions = query(async () => {
	// Get all active sessions
	const activeSessions = await db
		.select()
		.from(sessions)
		.where(eq(sessions.isActive, true))
		.orderBy(desc(sessions.createdAt));
	
	// Get attendee counts for each session
	const sessionsWithCounts = await Promise.all(
		activeSessions.map(async (session) => {
			const attendeeList = await db
				.select()
				.from(attendees)
				.where(eq(attendees.sessionId, session.id));
			
			const activeCount = attendeeList.length;
			const completedCount = attendeeList.filter(a => a.completed).length;
			
			return {
				...session,
				activeCount,
				completedCount
			};
		})
	);
	
	return sessionsWithCounts;
});

/**
 * Update session status
 */
const UpdateSessionSchema = v.object({
	sessionId: v.pipe(v.string(), v.uuid()),
	isActive: v.boolean()
});

export const updateSession = command(UpdateSessionSchema, async ({ sessionId, isActive }) => {
	const [updated] = await db
		.update(sessions)
		.set({ isActive } as any)
		.where(eq(sessions.id, sessionId))
		.returning();
	
	if (!updated) {
		error(404, 'Session not found');
	}
	
	return { success: true, session: updated };
});

// ============= ATTENDEE MANAGEMENT =============

/**
 * Join a session as an attendee
 */
const JoinSessionSchema = v.object({
	sessionCode: v.pipe(v.string(), v.minLength(1), v.maxLength(10)),
	name: v.pipe(v.string(), v.minLength(1), v.maxLength(100))
});

export const joinSession = command(JoinSessionSchema, async ({ sessionCode, name }) => {
	// Find session by code
	const [session] = await db
		.select()
		.from(sessions)
		.where(eq(sessions.code, sessionCode));
	
	if (!session) {
		error(404, 'Session not found');
	}
	
	const [attendee] = await db.insert(attendees).values({
		sessionId: session.id,
		name
	}).returning();
	
	// Broadcast attendee joined event via SSE
	broadcastEvents.attendeeJoined(session.id, {
		id: attendee.id,
		name: attendee.name,
		timestamp: new Date()
	});
	
	return { 
		success: true, 
		attendee,
		sessionId: session.id,
		redirect: `/session/${session.id}/attendee/${attendee.id}`
	};
});

/**
 * Refresh session data - for real-time updates
 * This can be called from client-side reactive code
 */
export const refreshSessionData = query(v.string(), async (sessionId) => {
	console.log('=== REFRESHING SESSION DATA ===');
	console.log('Session ID:', sessionId);
	
	const [session] = await db
		.select()
		.from(sessions)
		.where(eq(sessions.id, sessionId));
	
	if (!session) {
		console.log('Session not found');
		return null;
	}
	
	// Get all attendees with their latest data
	const sessionAttendees = await db
		.select()
		.from(attendees)
		.where(eq(attendees.sessionId, sessionId));
	
	console.log('Found attendees:', sessionAttendees.length);
	sessionAttendees.forEach(att => {
		console.log(`Attendee: ${att.name}, Completed: ${att.completed}, Scores:`, att.preferenceScores);
	});
	
	return {
		...session,
		attendees: sessionAttendees,
		timestamp: new Date() // For cache busting
	};
});