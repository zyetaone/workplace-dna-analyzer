/**
 * Remote server functions for participant operations
 */

import * as v from 'valibot';
import { query, command } from '$app/server';
import { db } from '$lib/server/db';
import { sessions, participants, type NewParticipant } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { questions } from '$lib/questions';
import { calculatePreferenceScores } from '$lib/utils/scoring';
import { generateId } from '$lib/utils/id';
import { sessionCodeSchema, participantNameSchema, generationSchema, questionIndexSchema } from '$lib/validation';

/**
 * Get session information for joining
 */
export const getSessionInfo = query(
	v.object({ code: sessionCodeSchema }),
	async (params) => {
		const [session] = await db
			.select()
			.from(sessions)
			.where(eq(sessions.code, params.code))
			.limit(1);

		if (!session) {
			return { session: null, error: 'Session not found' };
		}

		if (!session.isActive) {
			return { session: null, error: 'Session is not active' };
		}

		return { session, error: null };
	}
);

/**
 * Join a session as a participant
 */
export const joinSession = command(
	v.object({
		sessionCode: sessionCodeSchema,
		name: participantNameSchema,
		generation: generationSchema,
		participantId: v.optional(v.string())
	}),
	async (params) => {
		const [session] = await db
			.select()
			.from(sessions)
			.where(eq(sessions.code, params.sessionCode))
			.limit(1);

		if (!session) {
			return { success: false, error: 'Session not found' };
		}

		if (!session.isActive) {
			return { success: false, error: 'Session is not active' };
		}

		if (params.participantId) {
			const [existing] = await db
				.select()
				.from(participants)
				.where(
					and(
						eq(participants.id, params.participantId),
						eq(participants.sessionId, session.id)
					)
				)
				.limit(1);

			if (existing) {
				if (existing.name !== params.name) {
					await db
						.update(participants)
						.set({ name: params.name } as any)
						.where(eq(participants.id, params.participantId));
				}
				return {
					success: true,
					participantId: existing.id,
					redirect: `/${params.sessionCode}/quiz`
				};
			}
		}

		const newParticipantId = params.participantId || generateId();
		const [newParticipant] = await db.insert(participants).values({
			id: newParticipantId,
			sessionId: session.id,
			name: params.name,
			generation: params.generation
		} as any).returning({ id: participants.id });

		return {
			success: true,
			participantId: newParticipant.id,
			redirect: `/${params.sessionCode}/quiz`
		};
	}
);

/**
 * Get quiz state for a participant
 */
export const getQuizState = query(
	v.object({
		sessionCode: sessionCodeSchema,
		participantId: v.string()
	}),
	async (params) => {
		const [session] = await db
			.select()
			.from(sessions)
			.where(eq(sessions.code, params.sessionCode))
			.limit(1);

		if (!session) {
			return { error: 'Session not found' };
		}

		const [participant] = await db
			.select()
			.from(participants)
			.where(
				and(
					eq(participants.id, params.participantId),
					eq(participants.sessionId, session.id)
				)
			)
			.limit(1);

		if (!participant) {
			return { error: 'Participant not found' };
		}

		if (participant.completed) {
			return { redirect: `/${params.sessionCode}/complete` };
		}

		return {
			session,
			participant,
			questions,
			responses: participant.responses || {}
		};
	}
);

/**
 * Save a quiz answer
 */
export const saveQuizAnswer = command(
	v.object({
		participantId: v.string(),
		questionIndex: questionIndexSchema,
		answer: v.string()
	}),
	async (params) => {
		const [participant] = await db
			.select()
			.from(participants)
			.where(eq(participants.id, params.participantId))
			.limit(1);

		if (!participant) {
			return { success: false, error: 'Participant not found' };
		}

		const responses = participant.responses || {};
		responses[`q${params.questionIndex}`] = params.answer;

		await db
			.update(participants)
			.set({ responses } as any)
			.where(eq(participants.id, params.participantId));

		return { success: true };
	}
);

/**
 * Complete the quiz and calculate scores
 */
export const completeQuiz = command(
	v.object({
		sessionCode: sessionCodeSchema,
		participantId: v.string()
	}),
	async (params) => {
		const [participant] = await db
			.select()
			.from(participants)
			.where(eq(participants.id, params.participantId))
			.limit(1);

		if (!participant) {
			return { success: false, error: 'Participant not found' };
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
				completedAt: new Date()
			} as any)
			.where(eq(participants.id, params.participantId));

		return {
			success: true,
			redirect: `/${params.sessionCode}/complete`
		};
	}
);

/**
 * Get completion results
 */
export const getCompletionResults = query(
	v.object({
		sessionCode: sessionCodeSchema,
		participantId: v.string()
	}),
	async (params) => {
		const [session] = await db
			.select()
			.from(sessions)
			.where(eq(sessions.code, params.sessionCode))
			.limit(1);

		if (!session) {
			return { error: 'Session not found' };
		}

		const [participant] = await db
			.select()
			.from(participants)
			.where(
				and(
					eq(participants.id, params.participantId),
					eq(participants.sessionId, session.id)
				)
			)
			.limit(1);

		if (!participant) {
			return { error: 'Participant not found' };
		}

		if (!participant.completed) {
			return { redirect: `/${params.sessionCode}/quiz` };
		}

		return {
			session,
			participant,
			scores: participant.preferenceScores || {
				collaboration: 0,
				formality: 0,
				tech: 0,
				wellness: 0
			}
		};
	}
);