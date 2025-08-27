/**
 * Dashboard Remote Functions
 * Server-side operations for dashboard-related actions
 */

import { query, command } from '$app/server';
import * as v from 'valibot';
import { db } from '$lib/server/db';
import { sessions, participants } from '$lib/server/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { error } from '@sveltejs/kit';

// Helper functions
function generateSessionCode(): string {
	return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function generateSlug(title: string): string {
	return title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now();
}

// Get session analytics - returns only raw data
export const getSessionAnalytics = query(
	v.object({ slug: v.string() }),
	async ({ slug }) => {
	const [session] = await db
		.select()
		.from(sessions)
		.where(eq(sessions.slug, slug))
		.limit(1);
	
	if (!session) {
		throw error(404, 'Session not found');
	}
	
	const allParticipants = await db
		.select()
		.from(participants)
		.where(eq(participants.sessionId, session.id));
	
	// Return only raw data - let state handle computations
	return {
		session,
		participants: allParticipants
	};
});

// Get dashboard sessions for a presenter
export const getDashboardSessions = query(
	v.object({ presenterId: v.string() }),
	async ({ presenterId }) => {
	
	const allSessions = await db
		.select()
		.from(sessions)
		.where(eq(sessions.presenterId, presenterId))
		.orderBy(desc(sessions.createdAt));
	
	// Get participant counts for each session
	const sessionsWithCounts = await Promise.all(
		allSessions.map(async (session) => {
			const participantList = await db
				.select()
				.from(participants)
				.where(eq(participants.sessionId, session.id));
			
			const activeCount = participantList.filter(p => !p.completed).length;
			const completedCount = participantList.filter(p => p.completed).length;
			
			return {
				...session,
				activeCount,
				completedCount
			};
		})
	);
	
	return sessionsWithCounts;
});

// Create new session
export const createSession = command(
	v.object({
		title: v.string(),
		presenterId: v.string()
	}),
	async ({ title, presenterId }) => {
	const code = generateSessionCode();
	const slug = generateSlug(title);
	
	const [session] = await db.insert(sessions).values({
		code,
		name: title,
		slug,
		presenterId
	}).returning();
	
	return {
		success: true,
		data: {
			session,
			redirect: `/dashboard/${session.slug}`
		},
		message: 'Session created successfully',
		timestamp: new Date()
	};
});

// Update session status
export const updateSession = command(
	v.object({
		slug: v.string(),
		isActive: v.boolean()
	}),
	async ({ slug, isActive }) => {
	
	const [updated] = await db
		.update(sessions)
		.set({ isActive } as any)
		.where(eq(sessions.slug, slug))
		.returning();
	
	if (!updated) {
		throw error(404, 'Session not found');
	}
	
	return { success: true, session: updated };
});

// End session
export const endSession = command(
	v.object({ slug: v.string() }),
	async ({ slug }) => {
	
	const [session] = await db
		.select()
		.from(sessions)
		.where(eq(sessions.slug, slug))
		.limit(1);
	
	if (!session) {
		throw error(404, 'Session not found');
	}
	
	const [updated] = await db
		.update(sessions)
		.set({ isActive: false, endedAt: new Date().toISOString() } as any)
		.where(eq(sessions.id, session.id))
		.returning();
		
	return { success: true, session: updated };
});

// Delete participant
export const deleteParticipant = command(
	v.object({
		slug: v.string(),
		participantId: v.string()
	}),
	async ({ slug, participantId }) => {
	
	const [session] = await db
		.select()
		.from(sessions)
		.where(eq(sessions.slug, slug))
		.limit(1);
		
	if (!session) {
		throw error(404, 'Session not found');
	}
	
	await db
		.delete(participants)
		.where(and(
			eq(participants.id, participantId),
			eq(participants.sessionId, session.id)
		));
		
	return { success: true };
});

// Delete session
export const deleteSession = command(
	v.object({
		slug: v.string(),
		presenterId: v.string()
	}),
	async ({ slug, presenterId }) => {
	
	// Verify ownership
	const [session] = await db
		.select()
		.from(sessions)
		.where(and(
			eq(sessions.slug, slug),
			eq(sessions.presenterId, presenterId)
		))
		.limit(1);
		
	if (!session) {
		throw error(404, 'Session not found or unauthorized');
	}
	
	// Delete participants first
	await db.delete(participants).where(eq(participants.sessionId, session.id));
	
	// Delete session
	await db.delete(sessions).where(eq(sessions.id, session.id));
	
	return { success: true };
});

// Get session summary
export const getSessionSummary = query(
	v.object({ slug: v.string() }),
	async ({ slug }) => {
	const [session] = await db
		.select()
		.from(sessions)
		.where(eq(sessions.slug, slug))
		.limit(1);
		
	if (!session) {
		throw error(404, 'Session not found');
	}
	
	const allParticipants = await db
		.select()
		.from(participants)
		.where(eq(participants.sessionId, session.id));
		
	return { session, participants: allParticipants };
});

// Join session
export const joinSessionRemote = command(
	v.object({
		sessionCode: v.string(),
		name: v.string()
	}),
	async ({ sessionCode, name }) => {
		
	const [session] = await db
		.select()
		.from(sessions)
		.where(eq(sessions.code, sessionCode))
		.limit(1);
		
	if (!session) {
		throw error(404, 'Invalid session code');
	}
	
	if (!session.isActive) {
		throw error(400, 'Session is not active');
	}
	
	const [participant] = await db
		.insert(participants)
		.values({
			sessionId: session.id,
			name
		})
		.returning();
		
	return {
		success: true,
		data: {
			participant,
			sessionSlug: session.slug,
			redirect: `/dashboard/${session.slug}/p/${participant.id}/quiz`
		}
	};
});

// Generate AI insights
export const generateAIInsights = query(
	v.object({ slug: v.string() }),
	async ({ slug }) => {
	
	// For now, return mock insights
	// This would integrate with an AI service in production
	return {
		insights: [
			"Your team shows strong collaborative tendencies with high technology adoption",
			"Consider implementing more flexible work arrangements based on wellness scores",
			"Generation diversity suggests varied communication preferences",
			"Focus on bridging formal and informal work styles for better integration"
		]
	};
});

