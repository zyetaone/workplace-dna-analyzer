import { error } from '@sveltejs/kit';
import { query, command } from '$app/server';
import * as v from 'valibot';
import { db } from '$lib/server/db/index';
import { sessions, attendees } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
// Remote functions run on server - no client state access
import type { RequestEvent } from '@sveltejs/kit';
import { and } from 'drizzle-orm';
import { questions, isGenerationQuestion, GENERATION_QUESTION_INDEX } from '$lib/questions';

// Validation schemas
const JoinSessionSchema = v.object({
	sessionCode: v.pipe(v.string(), v.minLength(1), v.maxLength(10)),
	name: v.pipe(v.string(), v.minLength(1), v.maxLength(100))
});

const SaveResponseSchema = v.object({
	sessionSlug: v.string(),
	participantId: v.string(),
	questionIndex: v.number(),
	response: v.string(),
	generation: v.optional(v.string())
});

const CompleteQuizSchema = v.object({
	sessionSlug: v.string(),
	participantId: v.string(),
	scores: v.object({
		collaboration: v.number(),
		formality: v.number(),
		tech: v.number(),
		wellness: v.number()
	})
});

// Types (not exported to avoid remote function validation issues)
type JoinSessionInput = v.InferInput<typeof JoinSessionSchema>;
type SaveResponseInput = v.InferInput<typeof SaveResponseSchema>;
type CompleteQuizInput = v.InferInput<typeof CompleteQuizSchema>;

interface ParticipantData {
	id: string;
	sessionId: string;
	name: string;
	joinedAt: Date;
	completedAt?: Date;
	responses: Map<string, any>;
	progress: number;
}

// Commands (mutations)
/**
 * Join a session as a participant
 */
export const joinSession = command(JoinSessionSchema, async ({ sessionCode, name }) => {
	try {
		// Find session by code
		const [session] = await db
			.select()
			.from(sessions)
			.where(eq(sessions.code, sessionCode));
		
		if (!session) {
			throw error(404, 'Session not found');
		}
		
		const [attendee] = await db.insert(attendees).values({
			sessionId: session.id,
			name
		}).returning();
		
		
		return { 
			success: true, 
			participant: attendee,
			sessionSlug: session.slug,
			redirect: `/dashboard/${session.slug}/p/${attendee.id}/quiz`
		};
	} catch (err) {
		throw err;
	}
});

/**
 * Save a quiz response
 */
export const saveResponse = command(SaveResponseSchema, async ({ sessionSlug, participantId, questionIndex, response, generation }) => {
	try {
		// Get session by slug first
		const [session] = await db
			.select()
			.from(sessions)
			.where(eq(sessions.slug, sessionSlug));
		
		if (!session) {
			throw error(404, 'Session not found');
		}
		
		// Get current participant
		const [currentParticipant] = await db
			.select()
			.from(attendees)
			.where(
				and(
					eq(attendees.id, participantId),
					eq(attendees.sessionId, session.id)
				)
			);
		
		if (!currentParticipant) {
			throw error(404, 'Participant not found');
		}
		
		// Update responses, ensuring it's a valid object
		const currentResponses = typeof currentParticipant.responses === 'object' && currentParticipant.responses !== null 
			? currentParticipant.responses as Record<string, any> 
			: {};
		currentResponses[questionIndex] = response;
		
		// Prepare update data
		const updateData: any = { 
			responses: currentResponses 
		};
		
		// If this is the generation question, update generation directly
		if (generation && isGenerationQuestion(questionIndex)) {
			updateData.generation = generation;
		}

		
		// Update participant
		await db
			.update(attendees)
			.set(updateData)
			.where(
				and(
					eq(attendees.id, participantId),
					eq(attendees.sessionId, session.id)
				)
			);
		
		// Note: Real-time updates handled by client-side polling
		// Server-side event system can't directly update client state
		
		return { success: true };
	} catch (err) {
		if (import.meta.env.DEV) {
		console.error('Failed to save response:', err);
	}
		throw error(500, 'Failed to save response');
	}
});

/**
 * Complete the quiz with final scores
 */
export const completeQuiz = command(CompleteQuizSchema, async ({ sessionSlug, participantId, scores }) => {
	try {
		// Get session by slug first
		const [session] = await db
			.select()
			.from(sessions)
			.where(eq(sessions.slug, sessionSlug));
		
		if (!session) {
			throw error(404, 'Session not found');
		}
		
		// Update participant with completion status and scores
		await db
			.update(attendees)
			.set({ 
				completed: true,
				preferenceScores: scores,
				completedAt: new Date().toISOString()
			} as any)
			.where(
				and(
					eq(attendees.id, participantId),
					eq(attendees.sessionId, session.id)
				)
			);
		
		// Note: Real-time updates handled by client-side polling
		
		return { 
			success: true,
			redirect: `/dashboard/${session.slug}/p/${participantId}/quiz/complete`
		};
	} catch (err) {
		if (import.meta.env.DEV) {
		console.error('Failed to complete quiz:', err);
	}
		throw error(500, 'Failed to complete quiz');
	}
});

// Queries (reads)
/**
 * Load participant session data with quiz questions
 */
export const loadParticipantData = query(v.object({
	sessionSlug: v.string(),
	participantId: v.string()
}), async ({ sessionSlug, participantId }) => {
	try {
		// Get session by slug
		const [session] = await db
			.select()
			.from(sessions)
			.where(eq(sessions.slug, sessionSlug));
		
		if (!session) {
			throw error(404, 'Session not found');
		}
		
		// Get participant data
		const [participant] = await db
			.select()
			.from(attendees)
			.where(
				and(
					eq(attendees.id, participantId),
					eq(attendees.sessionId, session.id)
				)
			);
		
		if (!participant) {
			throw error(404, 'Participant not found');
		}
		
		return {
			session,
			participant,
			sessionCode: session.code,
			questions
		};
	} catch (err) {
		throw err;
	}
});

/**
 * Get real-time progress for a participant
 */
export const getProgress = query(v.object({
	sessionSlug: v.string(),
	participantId: v.string()
}), async ({ sessionSlug, participantId }) => {
	try {
		// Get session by slug
		const [session] = await db
			.select()
			.from(sessions)
			.where(eq(sessions.slug, sessionSlug));
		
		if (!session) {
			throw error(404, 'Session not found');
		}
		
		const [participant] = await db
			.select()
			.from(attendees)
			.where(
				and(
					eq(attendees.id, participantId),
					eq(attendees.sessionId, session.id)
				)
			);
		
		if (!participant) {
			return { 
				completed: false, 
				responses: {}, 
				progress: 0 
			};
		}
		
		const responses = (participant.responses as any) || {};
		const answeredCount = Object.keys(responses).length;
		const progress = (answeredCount / questions.length) * 100;
		
		return {
			completed: participant.completed,
			responses,
			progress,
			scores: participant.preferenceScores
		};
	} catch (err) {
		throw err;
	}
});

