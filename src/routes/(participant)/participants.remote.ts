/**
 * Participant Management Remote Functions
 * Handles all participant-related database operations
 */

import { query, command } from '$app/server';
import { db } from '$lib/server/db';
import { sessions, participants } from '$lib/server/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import {
	getActiveSession,
	getParticipant,
	getOrCreateParticipant,
	validateSessionParticipant
} from '$lib/server/db/helpers';
import { RemoteResponse } from '$lib/server/response';
import { validateResponse } from '$lib/server/schemas/common';
import { questions } from '$lib/server/data/questions';
import { generateId } from '$lib/utils/id';
import { calculatePreferenceScores } from '$lib/utils/scoring';

import {
	GetQuizStateInput,
	SaveAnswerInput,
	CompleteQuizInput,
	GetCompletionResultsInput,
	RemoveParticipantInput,
	GetQuizStateOutput,
	SaveAnswerOutput,
	CompleteQuizOutput,
	GetCompletionResultsOutput,
	RemoveParticipantOutput
} from '$lib/server/schemas/participant';

/**
 * Get or create participant quiz state
 */
export const getQuizState = query(GetQuizStateInput, async ({ sessionCode, participantId }) => {
	const session = await getActiveSession(sessionCode);
	const participant = await getOrCreateParticipant(session.id, participantId);

	return validateResponse(GetQuizStateOutput, {
		participantId: participant.id,
		sessionId: session.id,
		sessionName: session.name,
		responses: participant.responses || {},
		completed: participant.completed,
		questions
	});
});

/**
 * Save participant's answer to a question
 */
export const saveAnswer = command(
	SaveAnswerInput,
	async ({ sessionCode, participantId, questionIndex, answer }) => {
		const { session, participant } = await validateSessionParticipant(sessionCode, participantId);

		if (participant.completed) {
			throw new Error('Quiz already completed');
		}

		// Update responses
		const responses = participant.responses || {};
		responses[questionIndex] = answer;

		await db
			.update(participants)
			.set({ responses } as any)
			.where(eq(participants.id, participantId));

		return RemoteResponse.success(
			{ saved: true },
			{ invalidate: [`quiz:${sessionCode}:${participantId}`, `session:${sessionCode}`] }
		);
	}
);

/**
 * Complete quiz and calculate scores
 */
export const completeQuiz = command(
	CompleteQuizInput,
	async ({ sessionCode, participantId, name, generation }) => {
		const { session, participant } = await validateSessionParticipant(sessionCode, participantId);

		if (participant.completed) {
			throw new Error('Quiz already completed');
		}

		// Calculate preference scores from response map
		const map = (participant.responses || {}) as Record<string, string>;
		const responseItems = Object.entries(map).map(([questionId, answerId]) => ({
			questionId,
			answerId
		}));
		const preferenceScores = calculatePreferenceScores(responseItems);

		// Update participant
		await db
			.update(participants)
			.set({
				name,
				generation,
				preferenceScores,
				completed: true,
				completedAt: new Date().toISOString()
			} as any)
			.where(eq(participants.id, participantId));

		return RemoteResponse.success(
			{ preferenceScores },
			{
				invalidate: [
					`quiz:${sessionCode}:${participantId}`,
					`session:${sessionCode}`,
					`admin:session:${sessionCode}`
				]
			}
		);
	}
);

/**
 * Get completion results for a participant
 */
export const getCompletionResults = query(
	GetCompletionResultsInput,
	async ({ sessionCode, participantId }) => {
		const session = await getActiveSession(sessionCode);
		const participant = await getParticipant(participantId, session.id);

		if (!participant || !participant.completed) {
			throw new Error('Quiz not completed');
		}

		// Get top participants for comparison
		const topParticipants = await db
			.select({
				name: participants.name,
				generation: participants.generation,
				preferenceScores: participants.preferenceScores
			})
			.from(participants)
			.where(and(eq(participants.sessionId, session.id), eq(participants.completed, true)))
			.orderBy(desc(participants.completedAt))
			.limit(10);

		return validateResponse(GetCompletionResultsOutput, {
			sessionName: session.name,
			participant: {
				name: participant.name,
				generation: participant.generation,
				preferenceScores: participant.preferenceScores
			},
			topParticipants
		});
	}
);

/**
 * Remove a participant from a session
 */
export const removeParticipant = command(RemoveParticipantInput, async ({ participantId }) => {
	await db.delete(participants).where(eq(participants.id, participantId));

	return RemoteResponse.success({ removed: true }, { invalidate: ['admin:sessions'] });
});
