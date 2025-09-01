import { query } from '$app/server';
import { db } from '$lib/server/db';
import { sessions, participants, participantProgress, activities } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { error } from '@sveltejs/kit';

/**
 * Load function for participant activities page - loads available activities and progress on server
 */
export const load = query(async ({ params, cookies }) => {
	const { code } = params;

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

		// For Phase 1: Get the single workplace-quiz activity
		const [activity] = await db
			.select()
			.from(activities)
			.where(and(eq(activities.slug, 'workplace-preference'), eq(activities.isActive, true)))
			.limit(1);

		if (!activity) {
			throw error(500, 'Activity configuration not found');
		}

		// Get participant progress for this activity
		const [progress] = await db
			.select()
			.from(participantProgress)
			.where(
				and(
					eq(participantProgress.participantId, participantId),
					eq(participantProgress.activitySlug, 'workplace-preference')
				)
			)
			.limit(1);

		// Format activity data for the component
		const formattedActivity = {
			slug: activity.slug,
			name: activity.name,
			description: activity.config?.description || 'Discover your ideal workplace style',
			icon: '🏢',
			estimatedTime: activity.config?.estimatedTime || 5,
			questions: (activity.config?.questions as any[])?.length || 10,
			color: 'from-purple-500 to-blue-600',
			type: activity.type,
			category: 'workplace'
		};

		return {
			sessionCode: code,
			participantName: participant.name || 'Participant',
			participantId: participant.id,
			activities: [formattedActivity],
			activityProgress: progress
				? new Map([
						[
							activity.slug,
							{
								participantActivity: {
									isCompleted: progress.completed,
									progress: progress.completed ? 100 : 0
								}
							}
						]
					])
				: new Map()
		};
	} catch (err) {
		console.error('Failed to load activities:', err);
		if (err instanceof Error && 'status' in err) {
			throw err;
		}
		throw error(500, 'Failed to load activities');
	}
});
