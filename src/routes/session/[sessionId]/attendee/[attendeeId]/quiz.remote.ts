import { query, command } from '$app/server';
import * as v from 'valibot';
import { db } from '$lib/server/db/index';
import { sessions, attendees } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { questions } from '$lib/data/questions';
import { _broadcastEvents as broadcastEvents } from '../../../../api/sessions/[id]/stream/+server';
import { error } from '@sveltejs/kit';

// Schema for validation
const AttendeeDataSchema = v.object({
	sessionId: v.string(),
	attendeeId: v.string()
});

const SaveResponseSchema = v.object({
	sessionId: v.string(),
	attendeeId: v.string(),
	questionIndex: v.number(),
	response: v.string(),
	generation: v.optional(v.string())
});

const CompleteQuizSchema = v.object({
	sessionId: v.string(),
	attendeeId: v.string(),
	scores: v.object({
		collaboration: v.number(),
		formality: v.number(),
		tech: v.number(),
		wellness: v.number()
	})
});

/**
 * Load attendee session data
 */
export const loadAttendeeData = query(AttendeeDataSchema, async ({ sessionId, attendeeId }) => {
	// Get session data
	const [session] = await db
		.select()
		.from(sessions)
		.where(eq(sessions.id, sessionId));
	
	if (!session) {
		error(404, 'Session not found');
	}
	
	// Get attendee data
	const [attendee] = await db
		.select()
		.from(attendees)
		.where(
			and(
				eq(attendees.id, attendeeId),
				eq(attendees.sessionId, sessionId)
			)
		);
	
	if (!attendee) {
		error(404, 'Attendee not found');
	}
	
	return {
		session,
		attendee,
		sessionCode: session.code,
		questions
	};
});

/**
 * Save a quiz response
 */
export const saveResponse = command(SaveResponseSchema, async ({ sessionId, attendeeId, questionIndex, response, generation }) => {
	try {
		// Get current attendee
		const [currentAttendee] = await db
			.select()
			.from(attendees)
			.where(
				and(
					eq(attendees.id, attendeeId),
					eq(attendees.sessionId, sessionId)
				)
			);
		
		if (!currentAttendee) {
			error(404, 'Attendee not found');
		}
		
		// Update responses
		const currentResponses = (currentAttendee.responses as any) || {};
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
					eq(attendees.sessionId, sessionId)
				)
			);
		
		// Broadcast via SSE
		broadcastEvents.responseReceived(sessionId, {
			attendeeId,
			questionIndex,
			response,
			timestamp: new Date()
		});
		
		return { success: true };
	} catch (err) {
		console.error('Failed to save response:', err);
		error(500, 'Failed to save response');
	}
});

/**
 * Complete the quiz with final scores
 */
export const completeQuiz = command(CompleteQuizSchema, async ({ sessionId, attendeeId, scores }) => {
	try {
		console.log('=== COMPLETING QUIZ ===');
		console.log('Session ID:', sessionId);
		console.log('Attendee ID:', attendeeId);
		console.log('Received scores:', JSON.stringify(scores));
		
		// Update attendee with completion status and scores
		const updateResult = await db
			.update(attendees)
			.set({ 
				completed: true,
				preferenceScores: scores,
				completedAt: new Date().toISOString()
			} as any)
			.where(
				and(
					eq(attendees.id, attendeeId),
					eq(attendees.sessionId, sessionId)
				)
			);
		
		console.log('Update result:', updateResult);
		
		// Verify the update worked
		const [updated] = await db
			.select()
			.from(attendees)
			.where(eq(attendees.id, attendeeId));
		
		console.log('Updated attendee record:', {
			id: updated?.id,
			name: updated?.name,
			completed: updated?.completed,
			preferenceScores: updated?.preferenceScores,
			completedAt: updated?.completedAt
		});
		
		// Broadcast via SSE
		broadcastEvents.attendeeCompleted(sessionId, attendeeId, scores);
		
		return { 
			success: true,
			redirect: `/session/${sessionId}/attendee/${attendeeId}/complete`
		};
	} catch (err) {
		console.error('Failed to complete quiz:', err);
		error(500, 'Failed to complete quiz');
	}
});

/**
 * Get real-time progress for an attendee
 */
export const getProgress = query(AttendeeDataSchema, async ({ sessionId, attendeeId }) => {
	const [attendee] = await db
		.select()
		.from(attendees)
		.where(
			and(
				eq(attendees.id, attendeeId),
				eq(attendees.sessionId, sessionId)
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
});