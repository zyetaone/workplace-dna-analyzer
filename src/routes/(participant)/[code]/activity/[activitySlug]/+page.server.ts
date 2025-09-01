import { query } from '$app/server';
import { db } from '$lib/server/db';
import { sessions, participants, participantProgress, activities } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { error, fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import { questions } from '$lib/server/data/questions';

/**
 * Load function for participant activity page - loads activity data and checks availability on server
 */
export const load = query(async ({ params, cookies }) => {
	const { code, activitySlug } = params;

	try {
		// Validate session code format
		if (!code || !/^[A-Z0-9]+-[0-9]{6}$/.test(code)) {
			throw error(400, 'Invalid session code format');
		}

		// Get session
		const [session] = await db.select().from(sessions).where(eq(sessions.code, code)).limit(1);

		if (!session) {
			throw error(404, 'Session not found');
		}

		if (!session.isActive) {
			throw error(410, 'This session is no longer active');
		}

		// Check for participant
		const participantId = cookies.get(`participant_${code}`);
		if (!participantId) {
			throw error(403, 'Participant not found. Please join the session first.');
		}

		// Get participant
		const [participant] = await db
			.select()
			.from(participants)
			.where(eq(participants.id, participantId))
			.limit(1);

		if (!participant) {
			throw error(403, 'Participant not found. Please join the session first.');
		}

		// For Phase 1: Only support workplace-preference activity
		if (activitySlug !== 'workplace-preference') {
			throw error(404, 'Activity not found');
		}

		// Get activity
		const [activity] = await db
			.select()
			.from(activities)
			.where(and(eq(activities.slug, activitySlug), eq(activities.isActive, true)))
			.limit(1);

		if (!activity) {
			throw error(404, 'Activity not found or inactive');
		}

		// Get participant progress
		const [progress] = await db
			.select()
			.from(participantProgress)
			.where(
				and(
					eq(participantProgress.participantId, participantId),
					eq(participantProgress.activitySlug, activitySlug)
				)
			)
			.limit(1);

		return {
			sessionCode: code,
			activitySlug,
			participantId: participant.id,
			participantName: participant.name || 'Participant',
			activity: {
				...activity,
				config: activity.config
			},
			questions, // Add questions for the new Quiz component
			progress: progress || null,
			isActivityAvailable: true
		};
	} catch (err) {
		console.error('Failed to load activity:', err);
		if (err instanceof Error && 'status' in err) {
			throw err;
		}
		throw error(500, 'Failed to load activity');
	}
});

/**
 * Form actions for handling quiz responses
 */
export const actions: Actions = {
	/**
	 * Save individual quiz response
	 */
	saveResponse: async ({ request, params, cookies }) => {
		const { code, activitySlug } = params;

		try {
			const formData = await request.formData();
			const questionId = formData.get('questionId')?.toString();
			const response = formData.get('response')?.toString();
			const participantId = cookies.get(`participant_${code}`);

			// Validation
			if (!questionId || !response) {
				return fail(400, { error: 'Missing required fields' });
			}

			if (!participantId) {
				return fail(403, { error: 'Participant not found' });
			}

			// Verify session is active
			const [session] = await db.select().from(sessions).where(eq(sessions.code, code)).limit(1);
			if (!session?.isActive) {
				return fail(410, { error: 'Session is no longer active' });
			}

			// Parse and store response (simplified for now)
			console.log('Saving response:', {
				participantId,
				questionId,
				response: JSON.parse(response)
			});

			// TODO: Save to database when schema is ready
			// For now, return success
			return {
				success: true,
				questionId,
				timestamp: new Date().toISOString()
			};
		} catch (error) {
			console.error('Error saving response:', error);
			return fail(500, { error: 'Failed to save response' });
		}
	},

	/**
	 * Complete quiz and calculate results
	 */
	completeQuiz: async ({ request, params, cookies }) => {
		const { code, activitySlug } = params;

		try {
			const formData = await request.formData();
			const responses = formData.get('responses')?.toString();
			const participantId = cookies.get(`participant_${code}`);

			if (!responses || !participantId) {
				return fail(400, { error: 'Missing required data' });
			}

			// Verify session is active
			const [session] = await db.select().from(sessions).where(eq(sessions.code, code)).limit(1);
			if (!session?.isActive) {
				return fail(410, { error: 'Session is no longer active' });
			}

			// Parse responses and calculate results (simplified)
			const parsedResponses = JSON.parse(responses);
			console.log('Quiz completed:', { participantId, activitySlug, responses: parsedResponses });

			// Simple scoring for workplace preference assessment
			const mockResult = {
				overallScore: Math.floor(Math.random() * 100) + 1,
				sentiment: Math.random() > 0.5 ? 'positive' : 'neutral',
				responses: parsedResponses,
				insights: [
					'You show strong preferences for collaborative work environments',
					'Technology integration is important to your workflow',
					'You value clear communication and feedback'
				]
			};

			// TODO: Save completion to database when schema is ready

			return {
				success: true,
				result: mockResult,
				completedAt: new Date().toISOString()
			};
		} catch (error) {
			console.error('Error completing quiz:', error);
			return fail(500, { error: 'Failed to complete quiz' });
		}
	}
};
