/**
 * Remote server functions for dashboard operations
 */

import * as v from 'valibot';
import { query, command } from '$app/server';
import { db } from '$lib/server/db';
import { sessions, participants, type NewSession, type NewParticipant } from '$lib/server/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import type { RequestEvent } from '@sveltejs/kit';
import { generateId } from '$lib/utils/id';

// Validation schemas
const SessionCodeSchema = v.pipe(
	v.string(),
	v.regex(/^[A-Z0-9]{6}$/, 'Invalid session code format')
);

const SessionSlugSchema = v.pipe(
	v.string(),
	v.minLength(1, 'Session slug is required')
);

const ParticipantIdSchema = v.pipe(
	v.string(),
	v.uuid('Invalid participant ID')
);

const ParticipantNameSchema = v.pipe(
	v.string(),
	v.minLength(1, 'Name is required'),
	v.maxLength(100, 'Name is too long')
);

/**
 * Get session summary (basic info without participants)
 */
export const getSessionSummary = query(
	v.object({ slug: SessionSlugSchema }),
	async (params) => {
	
	// Get session by code (slug is actually the code)
	const [session] = await db
		.select()
		.from(sessions)
		.where(eq(sessions.code, params.slug))
		.limit(1);

	return { session };
	}
);

/**
 * Get session analytics data
 */
export const getSessionAnalytics = query(
	v.object({ 
		code: SessionCodeSchema,
		slug: v.optional(v.string())
	}),
	async (params) => {	// Get session by code
	const [session] = await db
		.select()
		.from(sessions)
		.where(eq(sessions.code, params.code))
		.limit(1);

	if (!session) {
		return { session: null, participants: [] };
	}

	// Get all participants for this session
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
const UpdateSessionSchema = v.object({
	slug: SessionSlugSchema,
	isActive: v.boolean()
});

export const updateSession = command(
	UpdateSessionSchema,
	async (params) => {
	
	// Find session by slug
	const [session] = await db
		.select()
		.from(sessions)
		.where(eq(sessions.slug, params.slug))
		.limit(1);

	if (!session) {
		throw new Error('Session not found');
	}

	// Update session status
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
	v.object({ slug: SessionSlugSchema }),
	async (params) => {
	
	const [session] = await db
		.select()
		.from(sessions)
		.where(eq(sessions.slug, params.slug))
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

	return { success: true, slug: params.slug };
	}
);

/**
 * Delete a participant
 */
const DeleteParticipantSchema = v.object({
	slug: SessionSlugSchema,
	participantId: ParticipantIdSchema
});

export const deleteParticipant = command(
	DeleteParticipantSchema,
	async (params) => {
	
	// Verify session exists
	const [session] = await db
		.select()
		.from(sessions)
		.where(eq(sessions.slug, params.slug))
		.limit(1);

	if (!session) {
		throw new Error('Session not found');
	}

	// Delete participant
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
	v.object({ slug: SessionSlugSchema }),
	async (params) => {
	
	// Get session and participants
	const [session] = await db
		.select()
		.from(sessions)
		.where(eq(sessions.slug, params.slug))
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
 * Join a session as a participant
 */
const JoinSessionSchema = v.object({
	sessionCode: SessionCodeSchema,
	name: ParticipantNameSchema,
	participantId: v.optional(ParticipantIdSchema)
});

export const joinSession = command(
	JoinSessionSchema,
	async (params) => {
	
	// Find session by code
	const [session] = await db
		.select()
		.from(sessions)
		.where(eq(sessions.code, params.sessionCode))
		.limit(1);
	
	if (!session) {
		return { success: false, error: 'Session not found' };
	}
	
	if (!session.isActive) {
		return { success: false, error: 'Session is not active' };
	}
	
	// Check if participant already exists
	if (params.participantId) {
		const [existing] = await db
			.select()
			.from(participants)
			.where(
				and(
					eq(participants.id, params.participantId),
					eq(participants.sessionId, session.id)
				)
			)
			.limit(1);
		
		if (existing) {
			// Update name if changed
			if (existing.name !== params.name) {
				await db
					.update(participants)
					.set({ name: params.name } as any)
					.where(eq(participants.id, params.participantId));
			}
			return { 
				success: true, 
				participantId: existing.id,
				redirect: `/${params.sessionCode}/quiz`
			};
		}
	}
	
	// Create new participant
	const newParticipantId = params.participantId || generateId();
	const [newParticipant] = await db.insert(participants).values({
		sessionId: session.id,
		name: params.name
	} as any).returning({ id: participants.id });
	
	return { 
		success: true, 
		participantId: newParticipant.id,
		redirect: `/${params.sessionCode}/quiz`
	};
	}
);