import { query } from '$app/server';
import { db } from '$lib/server/db';
import { sessions, participants } from '$lib/server/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { error, redirect } from '@sveltejs/kit';

/**
 * Load function for admin session detail page - fetches session data and analytics on server
 */
export const load = query(async ({ params }) => {
	const { code } = params;

	try {
		// Get session with participant counts
		const [session] = await db
			.select({
				id: sessions.id,
				code: sessions.code,
				name: sessions.name,
				isActive: sessions.isActive,
				createdAt: sessions.createdAt,
				endedAt: sessions.endedAt,
				activeCount: sql<number>`(
					SELECT COUNT(*) FROM ${participants}
					WHERE ${participants.sessionId} = ${sessions.id}
					AND ${participants.completed} = false
				)`,
				completedCount: sql<number>`(
					SELECT COUNT(*) FROM ${participants}
					WHERE ${participants.sessionId} = ${sessions.id}
					AND ${participants.completed} = true
				)`
			})
			.from(sessions)
			.where(eq(sessions.code, code))
			.limit(1);

		if (!session) {
			throw error(404, 'Session not found');
		}

		// Get all participants for this session
		const participantsList = await db
			.select()
			.from(participants)
			.where(eq(participants.sessionId, session.id));

		// Calculate analytics
		const completedParticipants = participantsList.filter((p) => p.completed);
		const activeParticipants = participantsList.filter((p) => !p.completed);

		// Calculate average preference scores
		let averagePreferences = { collaboration: 0, formality: 0, tech: 0, wellness: 0 };
		if (completedParticipants.length > 0) {
			const totals = completedParticipants.reduce(
				(acc, p) => {
					if (p.preferenceScores) {
						acc.collaboration += p.preferenceScores.collaboration || 0;
						acc.formality += p.preferenceScores.formality || 0;
						acc.tech += p.preferenceScores.tech || 0;
						acc.wellness += p.preferenceScores.wellness || 0;
					}
					return acc;
				},
				{ collaboration: 0, formality: 0, tech: 0, wellness: 0 }
			);

			averagePreferences = {
				collaboration: Math.round(totals.collaboration / completedParticipants.length),
				formality: Math.round(totals.formality / completedParticipants.length),
				tech: Math.round(totals.tech / completedParticipants.length),
				wellness: Math.round(totals.wellness / completedParticipants.length)
			};
		}

		// Calculate generation distribution
		const generationDistribution = completedParticipants.reduce(
			(acc, p) => {
				if (p.generation) {
					acc[p.generation] = (acc[p.generation] || 0) + 1;
				}
				return acc;
			},
			{} as Record<string, number>
		);

		// Determine workplace DNA based on scores
		const getWorkplaceDNA = () => {
			const scores = averagePreferences;
			if (scores.collaboration >= 60 && scores.wellness >= 60)
				return 'Collaborative & Wellness-Focused';
			if (scores.tech >= 60 && scores.formality < 40) return 'Tech-Forward & Flexible';
			if (scores.formality >= 60 && scores.collaboration < 40) return 'Traditional & Structured';
			if (scores.wellness >= 60 && scores.tech >= 60) return 'Modern & Balanced';
			return 'Balanced Workplace';
		};

		return {
			session: {
				...session,
				endedAt: session.endedAt || undefined
			},
			participants: participantsList,
			analytics: {
				activeCount: activeParticipants.length,
				completedCount: completedParticipants.length,
				responseRate:
					participantsList.length > 0
						? Math.round((completedParticipants.length / participantsList.length) * 100)
						: 0,
				averagePreferences,
				generationDistribution,
				workplaceDNA: getWorkplaceDNA()
			}
		};
	} catch (err) {
		console.error('Failed to load session data:', err);
		if (err instanceof Error && 'status' in err) {
			throw err;
		}
		throw error(500, 'Failed to load session data');
	}
});
