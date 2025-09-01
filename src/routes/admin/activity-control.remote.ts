/**
 * Real-time Activity Control Remote Functions
 *
 * Handles real-time activity enable/disable operations with broadcasting
 */

import { command } from '$app/server';
import { db } from '$lib/server/db';
import { sessions, activities, participantProgress, participants } from '$lib/server/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { RemoteResponse } from '$lib/server/response';
import { generateId } from '$lib/utils/id';
import {
	checkActivityCompletion,
	autoProgressActivity,
	updateActivityThreshold,
	toggleAutoProgression,
	getProgressionHistory,
	initializeDefaultTriggers
} from '$lib/server/services/completion-trigger.service';
import { broadcastActivityUpdate } from '$lib/server/utils/sse-utils';

/**
 * Enable/disable activity for a session with real-time broadcasting
 */
export const toggleActivityRealtime = command(
	'unchecked',
	async ({ sessionCode, activitySlug, isActive, adminTriggered = false }) => {
		// Get session and activity
		const [session] = await db
			.select()
			.from(sessions)
			.where(eq(sessions.code, sessionCode))
			.limit(1);

		if (!session) {
			return RemoteResponse.error('Session not found');
		}

		const [activity] = await db
			.select()
			.from(activities)
			.where(eq(activities.slug, activitySlug))
			.limit(1);

		if (!activity) {
			return RemoteResponse.error('Activity not found');
		}

		// In Phase 1, activities are always active and can't be toggled
		// This function is kept for compatibility but doesn't do much

		// Get updated activity stats for broadcasting
		const [stats] = await db
			.select({
				completed: sql<number>`COUNT(CASE WHEN ${participantProgress.completed} = true THEN 1 END)`,
				total: sql<number>`COUNT(*)`
			})
			.from(participantProgress)
			.innerJoin(participants, eq(participantProgress.participantId, participants.id))
			.where(
				and(
					eq(participants.sessionId, session.id),
					eq(participantProgress.activitySlug, activitySlug)
				)
			);

		const activityData = {
			activitySlug,
			activityName: activity.name,
			isActive,
			adminTriggered,
			completedCount: stats.completed || 0,
			totalCount: stats.total || 0,
			completionRate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0
		};

		// Broadcast the change
		broadcastActivityUpdate(sessionCode, activityData);

		return RemoteResponse.success(
			{
				success: true,
				activity: activityData
			},
			{
				invalidate: [
					`admin:session:${sessionCode}`,
					`session:${sessionCode}`,
					`activities:${sessionCode}`
				]
			}
		);
	}
);

/**
 * Check activity completion and trigger auto-progression if threshold met
 */
export const checkActivityCompletionTrigger = command(
	'unchecked',
	async ({ sessionCode, completedActivitySlug }) => {
		try {
			// Use the new completion trigger service
			const result = await checkActivityCompletion(sessionCode, completedActivitySlug);

			if (result.shouldProgress && result.nextActivitySlug) {
				// Auto-enable next activity
				const progressResult = await autoProgressActivity(
					sessionCode,
					completedActivitySlug,
					false
				);

				if (progressResult.success) {
					return RemoteResponse.success({
						success: true,
						autoEnabled: result.nextActivitySlug,
						completionRate: result.completionRate,
						threshold: result.threshold,
						message: result.reason
					});
				} else {
					return RemoteResponse.error(progressResult.error || 'Failed to auto-progress activity');
				}
			}

			return RemoteResponse.success({
				success: true,
				completionRate: result.completionRate,
				threshold: result.threshold,
				message: result.reason
			});
		} catch (error) {
			console.error('Error in checkActivityCompletionTrigger:', error);
			return RemoteResponse.error('Failed to check activity completion');
		}
	}
);

/**
 * Get real-time activity status for admin dashboard
 */
export const getRealtimeActivityStatus = command('unchecked', async ({ sessionCode }) => {
	// Get session
	const [session] = await db.select().from(sessions).where(eq(sessions.code, sessionCode)).limit(1);

	if (!session) {
		return RemoteResponse.error('Session not found');
	}

	// Get all activities (Phase 1: only workplace-quiz)
	const activitiesData = await db.select().from(activities).where(eq(activities.isActive, true));

	// Get stats for each activity
	const activitiesWithStats = await Promise.all(
		activitiesData.map(async (activity) => {
			const [stats] = await db
				.select({
					completed: sql<number>`COUNT(CASE WHEN ${participantProgress.completed} = true THEN 1 END)`,
					total: sql<number>`COUNT(*)`,
					inProgress: sql<number>`COUNT(CASE WHEN ${participantProgress.completed} = false AND ${participantProgress.createdAt} IS NOT NULL THEN 1 END)`
				})
				.from(participantProgress)
				.innerJoin(participants, eq(participantProgress.participantId, participants.id))
				.where(
					and(
						eq(participants.sessionId, session.id),
						eq(participantProgress.activitySlug, activity.slug)
					)
				);

			return {
				slug: activity.slug,
				name: activity.name,
				type: activity.type,
				isActive: true, // All activities are active in Phase 1
				order: 0, // No ordering in Phase 1
				completedCount: stats.completed || 0,
				totalCount: stats.total || 0,
				inProgressCount: stats.inProgress || 0,
				completionRate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
				completionThreshold: 80, // Default threshold
				autoProgressionEnabled: true, // Always enabled in Phase 1
				adminOverride: false
			};
		})
	);

	return RemoteResponse.success({
		success: true,
		sessionCode,
		activities: activitiesWithStats
	});
});

/**
 * Update completion threshold for a session activity
 */
export const updateCompletionThreshold = command(
	'unchecked',
	async ({ sessionCode, activitySlug, threshold }) => {
		try {
			// Get session and activity
			const [session] = await db
				.select()
				.from(sessions)
				.where(eq(sessions.code, sessionCode))
				.limit(1);

			if (!session) {
				return RemoteResponse.error('Session not found');
			}

			const [activity] = await db
				.select()
				.from(activities)
				.where(eq(activities.slug, activitySlug))
				.limit(1);

			if (!activity) {
				return RemoteResponse.error('Activity not found');
			}

			const result = await updateActivityThreshold(session.id, activity.id, threshold, true);

			if (result.success) {
				return RemoteResponse.success(
					{
						success: true,
						message: `Threshold updated to ${threshold}%`
					},
					{
						invalidate: [
							`admin:session:${sessionCode}`,
							`session:${sessionCode}`,
							`activities:${sessionCode}`
						]
					}
				);
			} else {
				return RemoteResponse.error(result.error || 'Failed to update threshold');
			}
		} catch (error) {
			console.error('Error updating completion threshold:', error);
			return RemoteResponse.error('Failed to update completion threshold');
		}
	}
);

/**
 * Toggle auto-progression for a session activity
 */
export const toggleActivityAutoProgression = command(
	'unchecked',
	async ({ sessionCode, activitySlug, enabled }) => {
		try {
			// Get session and activity
			const [session] = await db
				.select()
				.from(sessions)
				.where(eq(sessions.code, sessionCode))
				.limit(1);

			if (!session) {
				return RemoteResponse.error('Session not found');
			}

			const [activity] = await db
				.select()
				.from(activities)
				.where(eq(activities.slug, activitySlug))
				.limit(1);

			if (!activity) {
				return RemoteResponse.error('Activity not found');
			}

			const result = await toggleAutoProgression(session.id, activity.id, enabled);

			if (result.success) {
				return RemoteResponse.success(
					{
						success: true,
						message: `Auto-progression ${enabled ? 'enabled' : 'disabled'}`
					},
					{
						invalidate: [
							`admin:session:${sessionCode}`,
							`session:${sessionCode}`,
							`activities:${sessionCode}`
						]
					}
				);
			} else {
				return RemoteResponse.error(result.error || 'Failed to toggle auto-progression');
			}
		} catch (error) {
			console.error('Error toggling auto-progression:', error);
			return RemoteResponse.error('Failed to toggle auto-progression');
		}
	}
);

/**
 * Manually trigger activity progression (admin override)
 */
export const manualActivityProgression = command(
	'unchecked',
	async ({ sessionCode, fromActivitySlug }) => {
		try {
			const result = await autoProgressActivity(sessionCode, fromActivitySlug, true);

			if (result.success) {
				return RemoteResponse.success(
					{
						success: true,
						nextActivitySlug: result.nextActivitySlug,
						message: 'Activity progression triggered manually'
					},
					{
						invalidate: [
							`admin:session:${sessionCode}`,
							`session:${sessionCode}`,
							`activities:${sessionCode}`
						]
					}
				);
			} else {
				return RemoteResponse.error(result.error || 'Failed to trigger activity progression');
			}
		} catch (error) {
			console.error('Error in manual activity progression:', error);
			return RemoteResponse.error('Failed to trigger activity progression');
		}
	}
);

/**
 * Get activity progression history
 */
export const getActivityProgressionHistory = command('unchecked', async ({ sessionCode }) => {
	try {
		// Get session
		const [session] = await db
			.select()
			.from(sessions)
			.where(eq(sessions.code, sessionCode))
			.limit(1);

		if (!session) {
			return RemoteResponse.error('Session not found');
		}

		const history = await getProgressionHistory(session.id);

		return RemoteResponse.success({
			success: true,
			history
		});
	} catch (error) {
		console.error('Error getting progression history:', error);
		return RemoteResponse.error('Failed to get progression history');
	}
});

/**
 * Initialize default completion triggers
 */
export const initializeCompletionTriggers = command('unchecked', async () => {
	try {
		await initializeDefaultTriggers();
		return RemoteResponse.success({
			success: true,
			message: 'Default completion triggers initialized'
		});
	} catch (error) {
		console.error('Error initializing completion triggers:', error);
		return RemoteResponse.error('Failed to initialize completion triggers');
	}
});
