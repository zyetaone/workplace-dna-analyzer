/**
 * Presenter Data Remote Functions
 * Server-side operations for quiz presenter
 */

import * as v from 'valibot';
import { query, command } from '$app/server';
import { db } from '$lib/server/db';
import { sessions, participants } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { questions } from '$lib/questions';
import { calculatePreferenceScores } from '$lib/utils/scoring';
import { generateId } from '$lib/utils/id';
import { sessionCodeSchema, participantNameSchema, generationSchema } from '$lib/utils/validation';

// Get session information
export const getSessionInfo = query(
	v.object({ code: v.string() }),
	async ({ code }) => {
		const result = await db
			.select()
			.from(sessions)
			.where(eq(sessions.code, code))
			.limit(1);

		if (!result[0]) {
			throw new Error('Session not found');
		}

		return result[0];
	}
);

// Session operation (join/leave)
export const sessionOperation = command(
 	v.object({
 		code: v.string(),
 		operation: v.picklist(['join', 'leave']),
 		participantData: v.optional(v.object({
 			name: participantNameSchema,
 			generation: generationSchema
 		}))
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

 			await db.insert(participants).values(newParticipant as any);
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
			.where(and(
				eq(participants.id, participantId),
				eq(participants.sessionId, session.id)
			))
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

// Get completion results
export const getCompletionResultsRemote = query(
	v.object({ sessionCode: v.string() }),
	async ({ sessionCode }) => {
		const session = await getSessionInfo({ code: sessionCode });

		const participantsResult = await db
			.select()
			.from(participants)
			.where(eq(participants.sessionId, session.id));

		const completedCount = participantsResult.filter(p => p.completed).length;

		return {
			session,
			participants: participantsResult,
			totalCount: participantsResult.length,
			completedCount
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
 		await db.update(participants)
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

 		await db.update(participants)
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