/**
 * Admin Data Remote Functions
 * Server-side operations for admin dashboard
 */

import * as v from 'valibot';
import { query, command } from '$app/server';
import { db } from '$lib/server/db';
import { sessions, participants } from '$lib/server/db/schema';
import { eq, desc, sql, and } from 'drizzle-orm';
import { generateSessionCode } from '$lib/utils/id';

// Get all sessions with participant counts
export const getAllSessionsRemote = query(
	v.object({}),
	async () => {
		// First get all sessions
		const allSessions = await db
			.select()
			.from(sessions)
			.orderBy(desc(sessions.createdAt));

		// Then get participant counts for each session
		const sessionsWithCounts = await Promise.all(
			allSessions.map(async (session) => {
				// Get total participants for this session
				const totalParticipants = await db.$count(participants, eq(participants.sessionId, session.id));

				// Get completed participants for this session
				const completedParticipants = await db
					.select({ count: sql<number>`COUNT(*)` })
					.from(participants)
					.where(and(
						eq(participants.sessionId, session.id),
						eq(participants.completed, true)
					));

				const completedCount = completedParticipants[0]?.count || 0;

				return {
					...session,
					activeCount: totalParticipants - completedCount,
					completedCount
				};
			})
		);

		return sessionsWithCounts;
	}
);

// Create new session
export const createSessionRemote = command(
 	v.object({ name: v.string() }),
 	async ({ name }) => {
 		const code = generateSessionCode(name);

 		const result = await db.insert(sessions).values({
 			code,
 			name: name.trim()
 		}).returning();

  		return {
  			success: true,
  			data: result[0],
  			redirect: `/admin/${code}`,
  			invalidate: ['admin:sessions']
  		};
 	}
 );

// Delete session
export const deleteSessionRemote = command(
	v.object({ code: v.string() }),
	async ({ code }) => {
		const result = await db
			.delete(sessions)
			.where(eq(sessions.code, code));

		if (result.rowsAffected === 0) {
			throw new Error('Session not found');
		}

		return {
			success: true,
			invalidate: ['admin:sessions']
		};
	}
);

// Get session data with full details
export const getSessionData = query(
	v.object({ code: v.string() }),
	async ({ code }) => {
		// Get session
		const sessionResult = await db
			.select()
			.from(sessions)
			.where(eq(sessions.code, code))
			.limit(1);

		if (!sessionResult[0]) {
			throw new Error('Session not found');
		}

		const session = sessionResult[0];

		// Get participants
		const participantsResult = await db
			.select()
			.from(participants)
			.where(eq(participants.sessionId, session.id))
			.orderBy(desc(participants.joinedAt));

		const completedCount = participantsResult.filter(p => p.completed).length;

		return {
			session,
			participants: participantsResult,
			totalCount: participantsResult.length,
			completedCount
		};
	}
);

// Toggle session active status
export const toggleSessionStatus = command(
 	v.object({ code: v.string() }),
 	async ({ code }) => {
 		const sessionResult = await db
 			.select()
 			.from(sessions)
 			.where(eq(sessions.code, code))
 			.limit(1);

 		if (!sessionResult[0]) {
 			throw new Error('Session not found');
 		}

 		const newStatus = !sessionResult[0].isActive;

		await db
			.update(sessions)
			.set({ isActive: newStatus })
			.where(eq(sessions.code, code));

 		return { success: true };
 	}
 );

// Delete participant
export const deleteParticipant = command(
	v.object({
		sessionCode: v.string(),
		participantId: v.string()
	}),
	async ({ sessionCode, participantId }) => {
		// First get session to verify it exists
		const sessionResult = await db
			.select()
			.from(sessions)
			.where(eq(sessions.code, sessionCode))
			.limit(1);

		if (!sessionResult[0]) {
			throw new Error('Session not found');
		}

		// Delete participant
		const result = await db
			.delete(participants)
			.where(eq(participants.id, participantId));

		if (result.rowsAffected === 0) {
			throw new Error('Participant not found');
		}

		return { success: true };
	}
);

// End session
export const endSession = command(
 	v.object({ code: v.string() }),
 	async ({ code }) => {
 		await db
 			.update(sessions)
			.set({
				isActive: false,
				endedAt: sql`CURRENT_TIMESTAMP`
			})
 			.where(eq(sessions.code, code));

 		return { success: true };
 	}
 );