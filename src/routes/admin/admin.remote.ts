/**
 * Remote server functions for dashboard operations
 */

import * as v from 'valibot';
import { query, command } from '$app/server';
import { db } from '$lib/server/db';
import { sessions, participants } from '$lib/server/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { sessionCodeSchema, participantIdSchema, sessionNameSchema } from '$lib/validation';

/**
 * Get session summary (basic info without participants)
 */
export const getSessionSummary = query(
	v.object({ code: sessionCodeSchema }),
	async (params) => {
		const [session] = await db
			.select()
			.from(sessions)
			.where(eq(sessions.code, params.code))
			.limit(1);

		return session;
	}
);

/**
 * Get session analytics data
 */
export const getSessionAnalytics = query(
	v.object({ code: sessionCodeSchema }),
	async (params) => {
		const [session] = await db
			.select()
			.from(sessions)
			.where(eq(sessions.code, params.code))
			.limit(1);

		if (!session) {
			return { session: null, participants: [] };
		}

		const sessionParticipants = await db
			.select()
			.from(participants)
			.where(eq(participants.sessionId, session.id))
			.orderBy(desc(participants.joinedAt));

		return {
			session,
			participants: sessionParticipants
		};
	}
);

/**
 * Update session status
 */
export const updateSession = command(
	v.object({
		code: sessionCodeSchema,
		isActive: v.boolean()
	}),
	async (params) => {
		const [session] = await db
			.select()
			.from(sessions)
			.where(eq(sessions.code, params.code))
			.limit(1);

		if (!session) {
			throw new Error('Session not found');
		}

		await db
			.update(sessions)
			.set({ isActive: params.isActive } as any)
			.where(eq(sessions.id, session.id));

		return { success: true };
	}
);

/**
 * End a session
 */
export const endSession = command(
	v.object({ code: sessionCodeSchema }),
	async (params) => {
		const [session] = await db
			.select()
			.from(sessions)
			.where(eq(sessions.code, params.code))
			.limit(1);

		if (!session) {
			throw new Error('Session not found');
		}

		await db
			.update(sessions)
			.set({ 
				isActive: false,
				endedAt: new Date().toISOString()
			} as any)
			.where(eq(sessions.id, session.id));

		return { success: true, code: params.code };
	}
);

/**
 * Delete a participant
 */
export const deleteParticipant = command(
	v.object({
		code: sessionCodeSchema,
		participantId: participantIdSchema
	}),
	async (params) => {
		const [session] = await db
			.select()
			.from(sessions)
			.where(eq(sessions.code, params.code))
			.limit(1);

		if (!session) {
			throw new Error('Session not found');
		}

		await db
			.delete(participants)
			.where(and(
				eq(participants.id, params.participantId),
				eq(participants.sessionId, session.id)
			));

		return { success: true };
	}
);

/**
 * Generate AI insights (mock for now)
 */
export const generateAIInsights = query(
	v.object({ code: sessionCodeSchema }),
	async (params) => {
		const [session] = await db
			.select()
			.from(sessions)
			.where(eq(sessions.code, params.code))
			.limit(1);

		if (!session) {
			throw new Error('Session not found');
		}

		const sessionParticipants = await db
			.select()
			.from(participants)
			.where(eq(participants.sessionId, session.id));

		// Calculate some basic insights based on the data
		const completed = sessionParticipants.filter(p => p.completed);
		const insights: string[] = [];

		if (completed.length > 0) {
			// Calculate average scores
			const avgScores = {
				collaboration: 0,
				formality: 0,
				tech: 0,
				wellness: 0
			};

			for (const p of completed) {
				if (p.preferenceScores) {
					avgScores.collaboration += p.preferenceScores.collaboration;
					avgScores.formality += p.preferenceScores.formality;
					avgScores.tech += p.preferenceScores.tech;
					avgScores.wellness += p.preferenceScores.wellness;
				}
			}

			// Normalize averages
			Object.keys(avgScores).forEach(key => {
				avgScores[key as keyof typeof avgScores] = Math.round(avgScores[key as keyof typeof avgScores] / completed.length);
			});

			// Generate insights based on scores
			if (avgScores.collaboration >= 7) {
				insights.push("Your team shows a strong preference for collaborative work environments. Consider implementing more open spaces and team areas.");
			} else if (avgScores.collaboration <= 3) {
				insights.push("Your team values independent work. Focus on providing private workspaces and quiet zones.");
			}

			if (avgScores.tech >= 7) {
				insights.push("Your workforce is highly tech-savvy. Invest in cutting-edge digital tools and smart office technologies.");
			} else if (avgScores.tech <= 3) {
				insights.push("Your team prefers traditional work methods. Ensure a balanced approach when introducing new technologies.");
			}

			if (avgScores.wellness >= 7) {
				insights.push("Wellness is a top priority for your team. Consider adding wellness rooms, ergonomic furniture, and natural elements.");
			}

			if (avgScores.formality >= 7) {
				insights.push("Your team appreciates structure and formal processes. Maintain clear hierarchies and designated meeting spaces.");
			} else if (avgScores.formality <= 3) {
				insights.push("Your team thrives in flexible, casual environments. Consider hot-desking and informal meeting areas.");
			}

			// Add generation-specific insights
			const generations = sessionParticipants.map(p => p.generation || 'Unknown');
			const genCounts = generations.reduce((acc, gen) => {
				acc[gen] = (acc[gen] || 0) + 1;
				return acc;
			}, {} as Record<string, number>);

			const dominantGen = Object.entries(genCounts).reduce((a, b) => a[1] > b[1] ? a : b)[0];
			
			if (dominantGen === 'Gen Z') {
				insights.push("With a Gen Z majority, prioritize digital-first solutions and flexible work arrangements.");
			} else if (dominantGen === 'Millennial') {
				insights.push("Your Millennial-dominated workforce values work-life balance and collaborative technologies.");
			} else if (dominantGen === 'Gen X') {
				insights.push("Gen X employees appreciate autonomy and efficiency. Focus on results-oriented workspaces.");
			} else if (dominantGen === 'Baby Boomer') {
				insights.push("Baby Boomers in your team value traditional communication. Balance digital with face-to-face interactions.");
			}
		}

		// If no insights generated, provide default ones
		if (insights.length === 0) {
			insights.push(
				"Complete more responses to generate detailed insights.",
				"Workplace preferences are still being analyzed.",
				"Encourage more team members to participate for accurate insights."
			);
		}

		return { success: true, insights };
	}
);



/**
 * Get all sessions with participant counts
 */
export const getAllSessions = query(
	v.object({}),
	async () => {
		const { sql } = await import('drizzle-orm');

		// Get all sessions with participant counts
		const allSessions = await db
			.select({
				id: sessions.id,
				slug: sessions.slug,
				name: sessions.name,
				code: sessions.code,
				presenterId: sessions.presenterId,
				isActive: sessions.isActive,
				createdAt: sessions.createdAt,
				activeCount: sql<number>`
					COUNT(CASE WHEN ${participants.completed} = 0 THEN 1 END)
				`.as('activeCount'),
				completedCount: sql<number>`
					COUNT(CASE WHEN ${participants.completed} = 1 THEN 1 END)
				`.as('completedCount')
			})
			.from(sessions)
			.leftJoin(participants, eq(sessions.id, participants.sessionId))
			.groupBy(sessions.id)
			.orderBy(desc(sessions.createdAt));

		return allSessions;
	}
);

/**
 * Create a new session
 */
export const createSession = command(
	v.object({ name: sessionNameSchema }),
	async (params) => {
		// Generate session code
		const code = Math.random().toString(36).substring(2, 8).toUpperCase();

		await db.insert(sessions).values({
			slug: code,
			name: params.name,
			code,
			presenterId: 'default-admin'
		} as any);

		return {
			success: true,
			code,
			redirect: `/admin/${code}`
		};
	}
);

/**
 * Delete a session
 */
export const deleteSession = command(
	v.object({ code: sessionCodeSchema }),
	async (params) => {
		// Find session
		const [session] = await db
			.select()
			.from(sessions)
			.where(eq(sessions.code, params.code))
			.limit(1);

		if (!session) {
			return { success: false, error: 'Session not found' };
		}

		// Delete participants and session
		await db.delete(participants).where(eq(participants.sessionId, session.id));
		await db.delete(sessions).where(eq(sessions.id, session.id));

		return { success: true };
	}
);