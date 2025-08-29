/**
 * Consolidated Data Remote Functions
 * Single source of truth for all database operations
 * Located in routes as required by SvelteKit
 */

import * as v from 'valibot';
import { query, command } from '$app/server';
import { db } from '$lib/server/db';
import { sessions, participants } from '$lib/server/db/schema';
import { eq, desc, sql, and } from 'drizzle-orm';
import { questions } from '$lib/questions';
import { calculatePreferenceScores } from '$lib/utils/scoring';
import { generateId, generateSessionCode } from '$lib/utils/id';
import { participantNameSchema, generationSchema } from '$lib/utils/validation';

// ============================================================================
// SESSION OPERATIONS
// ============================================================================

// Get session information (used by participants)
export const getSessionInfo = query(v.object({ code: v.string() }), async ({ code }) => {
	const result = await db.select().from(sessions).where(eq(sessions.code, code)).limit(1);

	if (!result[0]) {
		throw new Error('Session not found');
	}

	return result[0];
});

// Create new session (admin operation)
export const createSession = command(v.object({ name: v.string() }), async ({ name }) => {
	const code = generateSessionCode(name);

	const result = await db
		.insert(sessions)
		.values({
			code,
			name: name.trim()
		})
		.returning();

	return {
		success: true,
		data: result[0],
		redirect: `/admin/${code}`,
		invalidate: ['admin:sessions']
	};
});

// Delete session (admin operation)
export const deleteSession = command(v.object({ code: v.string() }), async ({ code }) => {
	const result = await db.delete(sessions).where(eq(sessions.code, code));

	if (result.rowsAffected === 0) {
		throw new Error('Session not found');
	}

	return {
		success: true,
		invalidate: ['admin:sessions']
	};
});

// Toggle session active status (admin operation)
export const toggleSessionStatus = command(v.object({ code: v.string() }), async ({ code }) => {
	const sessionResult = await db.select().from(sessions).where(eq(sessions.code, code)).limit(1);

	if (!sessionResult[0]) {
		throw new Error('Session not found');
	}

	const newStatus = !sessionResult[0].isActive;

	await db
		.update(sessions)
		.set({ isActive: newStatus } as any)
		.where(eq(sessions.code, code));

	return {
		success: true,
		invalidate: [`admin:sessions`, `session:${code}`]
	};
});

// ============================================================================
// PARTICIPANT OPERATIONS
// ============================================================================

// Session operation (join/leave) - participant operation
export const sessionOperation = command(
	v.object({
		code: v.string(),
		operation: v.picklist(['join', 'leave']),
		participantData: v.optional(
			v.object({
				name: participantNameSchema,
				generation: v.optional(generationSchema)
			})
		)
	}),
	async ({ code, operation, participantData }) => {
		const session = await getSessionInfo({ code });
		if (!session) {
			throw new Error('Session not found');
		}

		if (operation === 'join' && participantData) {
			// Create new participant
			const participantId = generateId();
			const newParticipant = {
				id: participantId,
				sessionId: session.id,
				name: participantData.name,
				generation: participantData.generation,
				completed: false,
				joinedAt: new Date().toISOString()
			};

			await db.insert(participants).values(newParticipant);
			return {
				success: true,
				participant: newParticipant,
				invalidate: [`quiz:state:${session.id}`, 'admin:analytics', 'admin:sessions']
			};
		}

		throw new Error('Invalid operation');
	}
);

// Get quiz state for participant
export const getQuizState = query(
	v.object({
		sessionCode: v.string(),
		participantId: v.string()
	}),
	async ({ sessionCode, participantId }) => {
		const session = await getSessionInfo({ code: sessionCode });

		const participantResult = await db
			.select()
			.from(participants)
			.where(and(eq(participants.id, participantId), eq(participants.sessionId, session.id)))
			.limit(1);

		if (!participantResult[0]) {
			throw new Error('Participant not found');
		}

		return {
			session,
			participant: participantResult[0],
			questions,
			responses: participantResult[0].responses || {}
		};
	}
);

// Save answer for participant
export const saveAnswer = command(
	v.object({
		participantId: v.string(),
		questionIndex: v.number(),
		answer: v.string()
	}),
	async ({ participantId, questionIndex, answer }) => {
		const [participant] = await db
			.select()
			.from(participants)
			.where(eq(participants.id, participantId))
			.limit(1);

		if (!participant) {
			throw new Error('Participant not found');
		}

		const responses = { ...participant.responses, [`q${questionIndex}`]: answer };
		await db
			.update(participants)
			.set({ responses } as any)
			.where(eq(participants.id, participantId));

		return {
			success: true,
			invalidate: [`quiz:state:${participant.sessionId}`, 'admin:analytics']
		};
	}
);

// Complete quiz for participant
export const completeQuiz = command(
	v.object({
		sessionCode: v.string(),
		participantId: v.string()
	}),
	async ({ sessionCode, participantId }) => {
		const session = await getSessionInfo({ code: sessionCode });
		const [participant] = await db
			.select()
			.from(participants)
			.where(and(eq(participants.id, participantId), eq(participants.sessionId, session.id)))
			.limit(1);

		if (!participant) {
			throw new Error('Participant not found');
		}

		if (participant.completed) {
			return { success: true, redirect: `/${sessionCode}/complete` };
		}

		const responses = participant.responses || {};
		const responseArray = Object.entries(responses).map(([key, answer]) => ({
			questionNumber: parseInt(key.substring(1)),
			answer: answer as string
		}));

		const scores = calculatePreferenceScores(responseArray);

		await db
			.update(participants)
			.set({
				preferenceScores: scores,
				completed: true,
				completedAt: new Date().toISOString()
			} as any)
			.where(eq(participants.id, participantId));

		return {
			success: true,
			redirect: `/${sessionCode}/complete`,
			invalidate: [`quiz:state:${session.id}`, 'admin:analytics', 'admin:sessions']
		};
	}
);

// ============================================================================
// ADMIN OPERATIONS
// ============================================================================

// Get all sessions with participant counts (admin dashboard)
export const getAllSessions = query(v.object({}), async () => {
	// First get all sessions
	const allSessions = await db.select().from(sessions).orderBy(desc(sessions.createdAt));

	// Then get participant counts for each session
	const sessionsWithCounts = await Promise.all(
		allSessions.map(async (session) => {
			// Get total participants for this session
			const totalParticipants = await db.$count(
				participants,
				eq(participants.sessionId, session.id)
			);

			// Get completed participants for this session
			const completedParticipants = await db
				.select({ count: sql<number>`COUNT(*)` })
				.from(participants)
				.where(and(eq(participants.sessionId, session.id), eq(participants.completed, true)));

			const completedCount = completedParticipants[0]?.count || 0;

			return {
				...session,
				activeCount: totalParticipants - completedCount,
				completedCount
			};
		})
	);

	return sessionsWithCounts;
});

// Get session data with full details (admin session view)
export const getSessionData = query(v.object({ code: v.string() }), async ({ code }) => {
	// Get session
	const sessionResult = await db.select().from(sessions).where(eq(sessions.code, code)).limit(1);

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

	const completedCount = participantsResult.filter((p) => p.completed).length;

	return {
		session,
		participants: participantsResult,
		totalCount: participantsResult.length,
		completedCount
	};
});

// Get completion results (used by both admin and participants)
export const getCompletionResults = query(
	v.object({ sessionCode: v.string() }),
	async ({ sessionCode }) => {
		const session = await getSessionInfo({ code: sessionCode });

		const participantsResult = await db
			.select()
			.from(participants)
			.where(eq(participants.sessionId, session.id));

		const completedCount = participantsResult.filter((p) => p.completed).length;

		return {
			session,
			participants: participantsResult,
			totalCount: participantsResult.length,
			completedCount
		};
	}
);

// Delete participant (admin operation)
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
		const result = await db.delete(participants).where(eq(participants.id, participantId));

		if (result.rowsAffected === 0) {
			throw new Error('Participant not found');
		}

		return {
			success: true,
			invalidate: [`admin:session:${sessionCode}`, 'admin:analytics']
		};
	}
);

// ============================================================================
// AI OPERATIONS - Kept in separate ai.remote.ts file
// ============================================================================

// ============================================================================
// LEGACY EXPORTS (for backward compatibility)
// ============================================================================

// Re-export with legacy names for existing imports
export const getAllSessionsRemote = getAllSessions;
export const createSessionRemote = createSession;
export const deleteSessionRemote = deleteSession;
export const toggleSessionStatusRemote = toggleSessionStatus;
export const getSessionInfoRemote = getSessionInfo;
export const sessionOperationRemote = sessionOperation;
export const getQuizStateRemote = getQuizState;
export const saveAnswerRemote = saveAnswer;
export const completeQuizRemote = completeQuiz;
export const getSessionDataRemote = getSessionData;
export const getCompletionResultsRemote = getCompletionResults;
