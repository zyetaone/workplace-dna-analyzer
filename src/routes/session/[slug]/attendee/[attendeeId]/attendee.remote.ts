import { error } from '@sveltejs/kit';
import { query, command } from '$app/server';
import * as v from 'valibot';
import { db } from '$lib/server/db/index';
import { sessions, attendees } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
// Remote functions run on server - no client state access
import type { RequestEvent } from '@sveltejs/kit';
import { broadcastEvents } from '$lib/server/sse-manager';
import { and } from 'drizzle-orm';
import { questions } from '$lib/questions';

// Validation schemas
const JoinSessionSchema = v.object({
	sessionCode: v.pipe(v.string(), v.minLength(1), v.maxLength(10)),
	name: v.pipe(v.string(), v.minLength(1), v.maxLength(100))
});

const SaveResponseSchema = v.object({
	sessionSlug: v.string(),
	attendeeId: v.string(),
	questionIndex: v.number(),
	response: v.string(),
	generation: v.optional(v.string())
});

const CompleteQuizSchema = v.object({
	sessionSlug: v.string(),
	attendeeId: v.string(),
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

interface AttendeeData {
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
 * Join a session as an attendee
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
		
		// Broadcast attendee joined event via SSE
		broadcastEvents.attendeeJoined(session.id, {
			id: attendee.id,
			name: attendee.name,
			timestamp: new Date()
		});
		
		return { 
			success: true, 
			attendee,
			sessionSlug: session.slug,
			redirect: `/session/${session.slug}/attendee/${attendee.id}`
		};
	} catch (err) {
		throw err;
	}
});

/**
 * Save a quiz response
 */
export const saveResponse = command(SaveResponseSchema, async ({ sessionSlug, attendeeId, questionIndex, response, generation }) => {
	try {
		// Get session by slug first
		const [session] = await db
			.select()
			.from(sessions)
			.where(eq(sessions.slug, sessionSlug));
		
		if (!session) {
			throw error(404, 'Session not found');
		}
		
		// Get current attendee
		const [currentAttendee] = await db
			.select()
			.from(attendees)
			.where(
				and(
					eq(attendees.id, attendeeId),
					eq(attendees.sessionId, session.id)
				)
			);
		
		if (!currentAttendee) {
			throw error(404, 'Attendee not found');
		}
		
		// Update responses, ensuring it's a valid object
		const currentResponses = typeof currentAttendee.responses === 'object' && currentAttendee.responses !== null 
			? currentAttendee.responses as Record<string, any> 
			: {};
		currentResponses[questionIndex] = response;
		
		// Prepare update data
		const updateData: any = { 
			responses: currentResponses 
		};
		
		// If this is the generation question (index 0), update generation
		if (generation && questionIndex === 0) {
			const generationMap: Record<string, string> = {
				'baby_boomer': 'Baby Boomer',
				'gen_x': 'Gen X',
				'millennial': 'Millennial',
				'gen_z': 'Gen Z'
			};
			updateData.generation = generationMap[generation] || generation;
		}

		
		// Update attendee
		await db
			.update(attendees)
			.set(updateData)
			.where(
				and(
					eq(attendees.id, attendeeId),
					eq(attendees.sessionId, session.id)
				)
			);
		
		// Broadcast via SSE
		broadcastEvents.responseReceived(session.id, {
			attendeeId,
			questionIndex,
			response,
			timestamp: new Date()
		});
		
		return { success: true };
	} catch (err) {
		console.error('Failed to save response:', err);
		throw error(500, 'Failed to save response');
	}
});

/**
 * Complete the quiz with final scores
 */
export const completeQuiz = command(CompleteQuizSchema, async ({ sessionSlug, attendeeId, scores }) => {
	try {
		// Get session by slug first
		const [session] = await db
			.select()
			.from(sessions)
			.where(eq(sessions.slug, sessionSlug));
		
		if (!session) {
			throw error(404, 'Session not found');
		}
		
		// Update attendee with completion status and scores
		await db
			.update(attendees)
			.set({ 
				completed: true,
				preferenceScores: scores,
				completedAt: new Date().toISOString()
			} as any)
			.where(
				and(
					eq(attendees.id, attendeeId),
					eq(attendees.sessionId, session.id)
				)
			);
		
		// Broadcast via SSE
		broadcastEvents.attendeeCompleted(session.id, attendeeId, scores);
		
		return { 
			success: true,
			redirect: `/session/${session.slug}/attendee/${attendeeId}/complete`
		};
	} catch (err) {
		console.error('Failed to complete quiz:', err);
		throw error(500, 'Failed to complete quiz');
	}
});

// Queries (reads)
/**
 * Load attendee session data with quiz questions
 */
export const loadAttendeeData = query(v.object({
	sessionSlug: v.string(),
	attendeeId: v.string()
}), async ({ sessionSlug, attendeeId }) => {
	try {
		// Get session by slug
		const [session] = await db
			.select()
			.from(sessions)
			.where(eq(sessions.slug, sessionSlug));
		
		if (!session) {
			throw error(404, 'Session not found');
		}
		
		// Get attendee data
		const [attendee] = await db
			.select()
			.from(attendees)
			.where(
				and(
					eq(attendees.id, attendeeId),
					eq(attendees.sessionId, session.id)
				)
			);
		
		if (!attendee) {
			throw error(404, 'Attendee not found');
		}
		
		return {
			session,
			attendee,
			sessionCode: session.code,
			questions
		};
	} catch (err) {
		throw err;
	}
});

/**
 * Get real-time progress for an attendee
 */
export const getProgress = query(v.object({
	sessionSlug: v.string(),
	attendeeId: v.string()
}), async ({ sessionSlug, attendeeId }) => {
	try {
		// Get session by slug
		const [session] = await db
			.select()
			.from(sessions)
			.where(eq(sessions.slug, sessionSlug));
		
		if (!session) {
			throw error(404, 'Session not found');
		}
		
		const [attendee] = await db
			.select()
			.from(attendees)
			.where(
				and(
					eq(attendees.id, attendeeId),
					eq(attendees.sessionId, session.id)
				)
			);
		
		if (!attendee) {
			return { 
				completed: false, 
				responses: {}, 
				progress: 0 
			};
		}
		
		const responses = (attendee.responses as any) || {};
		const answeredCount = Object.keys(responses).length;
		const progress = (answeredCount / questions.length) * 100;
		
		return {
			completed: attendee.completed,
			responses,
			progress,
			scores: attendee.preferenceScores
		};
	} catch (err) {
		throw err;
	}
});

