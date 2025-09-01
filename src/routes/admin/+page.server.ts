import { query } from '$app/server';
import { db } from '$lib/server/db';
import { sessions, participants } from '$lib/server/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { error } from '@sveltejs/kit';

/**
 * Load function for admin dashboard - fetches sessions list on server
 */
export const load = query(async () => {
	try {
		// Get all sessions with participant counts
		const sessionsList = await db
			.select({
				id: sessions.id,
				code: sessions.code,
				name: sessions.name,
				createdAt: sessions.createdAt,
				endedAt: sessions.endedAt,
				isActive: sessions.isActive,
				activeCount: sql<number>`(
					SELECT COUNT(*) FROM ${participants}
					WHERE ${participants.sessionId} = ${sessions.id}
					AND ${participants.completed} = false
				)`,
				completedCount: sql<number>`(
					SELECT COUNT(*) FROM ${participants}
					WHERE ${participants.sessionId} = ${sessions.id}
					AND ${participants.completed} = true
				)`,
				activityCount: sql<number>`1` // Phase 1: Always 1 activity
			})
			.from(sessions)
			.orderBy(desc(sessions.createdAt))
			.limit(50);

		// Calculate overall stats
		const totalSessions = sessionsList.length;
		const activeSessions = sessionsList.filter((s) => s.isActive).length;
		const totalParticipants = sessionsList.reduce(
			(sum, s) => sum + (s.activeCount + s.completedCount),
			0
		);
		const completedSurveys = sessionsList.reduce((sum, s) => sum + s.completedCount, 0);

		return {
			sessions: sessionsList.map((s) => ({
				...s,
				endedAt: s.endedAt || undefined
			})),
			stats: {
				total: totalSessions,
				active: activeSessions,
				totalParticipants,
				completedSurveys
			}
		};
	} catch (err) {
		console.error('Failed to load admin dashboard data:', err);
		throw error(500, 'Failed to load dashboard data');
	}
});
