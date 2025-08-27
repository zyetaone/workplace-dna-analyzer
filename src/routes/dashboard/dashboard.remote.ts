/**
 * Dashboard Remote Service - Optimized for Speed & Concurrency
 * Uses SvelteKit's query/command patterns with Valibot validation
 * Implements parallel operations and optimistic updates
 */

import { query, command } from '$app/server';
import * as v from 'valibot';
import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db/index';
import { sessions, attendees } from '$lib/server/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { computeAnalyticsFast, generateWorkplaceDNA, generateWordCloudData } from './dashboard.svelte';
import type { Generation, WordCloudItem, PreferenceScores } from '$lib/types';

// Using centralized types from $lib/types

// ============= VALIDATION SCHEMAS =============

const SessionAnalyticsSchema = v.object({
	slug: v.pipe(v.string(), v.regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/), v.maxLength(100))
});

const CreateSessionSchema = v.object({
	title: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
	presenterId: v.pipe(v.string(), v.minLength(1))
});

const EndSessionSchema = v.object({
	slug: v.pipe(v.string(), v.regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/), v.maxLength(100))
});

const DeleteParticipantSchema = v.object({
	slug: v.pipe(v.string(), v.regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/), v.maxLength(100)),
	participantId: v.pipe(v.string(), v.uuid())
});

const GenerateAIInsightsSchema = v.object({
	slug: v.pipe(v.string(), v.regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/), v.maxLength(100)),
	includeIndividualProfiles: v.optional(v.boolean()),
	focusArea: v.optional(v.picklist(['collaboration', 'wellness', 'technology', 'formality', 'overall']))
});

const ExportSessionDataSchema = v.object({
	slug: v.pipe(v.string(), v.regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/), v.maxLength(100)),
	format: v.picklist(['json', 'csv', 'pdf']),
	includeResponses: v.optional(v.boolean()),
	includeAnalytics: v.optional(v.boolean())
});

const UpdateSessionSchema = v.object({
	slug: v.pipe(v.string(), v.regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/), v.maxLength(100)),
	isActive: v.boolean()
});

const GetDashboardSessionsSchema = v.object({
	presenterId: v.pipe(v.string(), v.minLength(1))
});

const DeleteSessionSchema = v.object({
	slug: v.pipe(v.string(), v.regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/), v.maxLength(100)),
	presenterId: v.pipe(v.string(), v.minLength(1))
});

// ============= QUERY FUNCTIONS (Fast Reads) =============

// Note: fetchSessionData removed - use getSessionAnalytics or fetchSessionByCode instead
// which provide more comprehensive data and proper validation


/**
 * Get comprehensive session analytics - OPTIMIZED with parallel queries
 */
export const getSessionAnalytics = query(v.string(), async (slug) => {
	try {
		// First get session by slug
		const [session] = await db.select().from(sessions).where(eq(sessions.slug, slug)).limit(1);
		
		if (!session) {
			throw error(404, 'Session not found');
		}
		
		// Then get participants using session.id
		const allParticipants = await db.select().from(attendees).where(eq(attendees.sessionId, session.id));
		
		// Use the analytics computation function
		const analytics = computeAnalyticsFast(allParticipants);
		
		return {
			session,
			participants: allParticipants,
			analytics,
			timestamp: new Date(),
			cached: false
		};
	} catch (err) {
		throw err;
	}
});

// ============= COMMAND FUNCTIONS (State Changes) =============

/**
 * Create new session
 */
export const createSession = command(CreateSessionSchema, async ({ title, presenterId }) => {
	try {
		// Generate unique session code
		// Generate 8-character session code using crypto
		const code = crypto.randomUUID().substring(0, 8).toUpperCase();
		
		// Generate URL-friendly slug from session name (native implementation)
		const baseSlug = title
			.toLowerCase()
			.trim()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '')
			.substring(0, 50);
		
		// Add short unique suffix for uniqueness
		const uniqueSuffix = crypto.randomUUID().substring(0, 6);
		const slug = `${baseSlug}-${uniqueSuffix}`;
		
		const [session] = await db.insert(sessions).values({
			code,
			name: title,
			slug,
			presenterId
		}).returning();
		
		// Return created session
		return {
			success: true,
			session,
			redirect: `/dashboard/${session.slug}`
		};
		
	} catch (err) {
		throw err;
	}
});

/**
 * Update session status
 */
export const updateSession = command(UpdateSessionSchema, async ({ slug, isActive }) => {
	try {
		const [updated] = await db
			.update(sessions)
			.set({ isActive } as any)
			.where(eq(sessions.slug, slug))
			.returning();
		
		if (!updated) {
			throw error(404, 'Session not found');
		}
		
		// Update local state
		
		return { success: true, session: updated };
	} catch (err) {
		throw err;
	}
});

/**
 * End session with cleanup
 */
export const endSession = command(EndSessionSchema, async ({ slug }) => {
	
	try {
		// Update database
		const [updatedSession] = await db.update(sessions)
			.set({ 
				isActive: false,
				endedAt: new Date().toISOString() 
			} as any)
			.where(eq(sessions.slug, slug))
			.returning();
		
		if (!updatedSession) {
			throw error(404, 'Session not found');
		}
		
		
		return {
			success: true,
			session: updatedSession
		};
		
	} catch (err) {
		throw err;
	}
});

/**
 * Delete participant with immediate UI update
 */
export const deleteParticipant = command(DeleteParticipantSchema, async ({ slug, participantId }) => {
	// Optimistic update - remove from UI immediately
	
	try {
		// First get session by slug to get its ID
		const [session] = await db.select().from(sessions).where(eq(sessions.slug, slug)).limit(1);
		if (!session) {
			throw error(404, 'Session not found');
		}
		
		// Delete from database
		const result = await db.delete(attendees)
			.where(and(
				eq(attendees.id, participantId),
				eq(attendees.sessionId, session.id)
			));
		
		
		return {
			success: true,
			deletedId: participantId
		};
		
	} catch (err) {
		// Rollback: we'd need to re-fetch the participant data
		// For now, just throw the error
		throw err;
	}
});

/**
 * Generate AI insights with streaming support
 */
export const generateAIInsights = command(GenerateAIInsightsSchema, async ({ 
	slug, 
	includeIndividualProfiles = false, 
	focusArea = 'overall' 
}) => {
	
	try {
		// Get session analytics
		const analyticsData = await getSessionAnalytics(slug);
		
		// Generate AI insights placeholder
		// TODO: Implement AI insight generation
		const aiResponse = {
			summary: 'AI insights would be generated here',
			keyFindings: ['Finding 1', 'Finding 2'],
			recommendations: ['Recommendation 1', 'Recommendation 2']
		};
		
		const insights = {
			summary: aiResponse.summary,
			keyFindings: aiResponse.keyFindings,
			recommendations: aiResponse.recommendations,
			workplaceDNA: analyticsData.analytics.workplaceDNA,
			generatedAt: new Date(),
			focusArea
		};
		
		return {
			success: true,
			insights
		};
		
	} catch (err) {
		throw err;
	}
});

/**
 * Export session data in multiple formats
 */
export const exportSessionData = command(ExportSessionDataSchema, async ({
	slug,
	format,
	includeResponses = true,
	includeAnalytics = true
}) => {
	
	try {
		// Get session analytics
		const analyticsData = await getSessionAnalytics(slug);
		
		// Build export data structure
		const exportData = {
			session: analyticsData.session,
			analytics: includeAnalytics ? analyticsData.analytics : undefined,
			participants: analyticsData.participants.map(participant => ({
				id: participant.id,
				name: participant.name,
				sessionId: participant.sessionId,
				generation: participant.generation,
				completed: participant.completed,
				joinedAt: participant.joinedAt,
				completedAt: participant.completedAt,
				preferenceScores: participant.preferenceScores,
				responses: includeResponses ? participant.responses : undefined
			})),
			exportedAt: new Date(),
			format
		};
		
		// Format conversion based on requested format
		let formattedData: string | Buffer;
		let mimeType: string;
		let filename: string;
		
		switch (format) {
			case 'json':
				formattedData = JSON.stringify(exportData, null, 2);
				mimeType = 'application/json';
				filename = `session-${analyticsData.session.code}-${Date.now()}.json`;
				break;
				
			case 'csv':
				// Convert to CSV format
				const headers = ['Name', 'Generation', 'Completed', 'Collaboration', 'Formality', 'Tech', 'Wellness'];
				const rows = exportData.participants.map(p => [
					p.name,
					p.generation || '',
					p.completed ? 'Yes' : 'No',
					p.preferenceScores?.collaboration || '',
					p.preferenceScores?.formality || '',
					p.preferenceScores?.tech || '',
					p.preferenceScores?.wellness || ''
				]);
				const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
				formattedData = csvContent;
				mimeType = 'text/csv';
				filename = `session-${analyticsData.session.code}-${Date.now()}.csv`;
				break;
				
			case 'pdf':
				throw error(501, 'PDF export not yet implemented');
				
			default:
				throw error(400, 'Unsupported export format');
		}
		
		
		return {
			success: true,
			data: formattedData,
			mimeType,
			filename,
			size: formattedData.length
		};
		
	} catch (err) {
		throw err;
	}
});

/**
 * Delete session with all related data
 */
export const deleteSession = command(DeleteSessionSchema, async ({ slug, presenterId }) => {
	try {
		// First get session by slug
		const [session] = await db.select().from(sessions).where(eq(sessions.slug, slug)).limit(1);
		
		if (!session) {
			throw error(404, 'Session not found');
		}
		
		// Verify presenter owns the session
		if (session.presenterId !== presenterId) {
			throw error(403, 'Not authorized to delete this session');
		}
		
		// Delete participants first (foreign key constraint)
		await db.delete(attendees).where(eq(attendees.sessionId, session.id));
		
		// Then delete the session
		await db.delete(sessions).where(eq(sessions.id, session.id));
		
		
		return {
			success: true,
			deletedSessionId: session.id
		};
		
	} catch (err) {
		throw err;
	}
});



/**
 * Batch refresh multiple sessions - useful for admin dashboards
 */
export const batchRefreshSessions = query(v.array(v.string()), async (slugs) => {
	// Fetch all sessions in parallel
	const results = await Promise.all(
		slugs.map(async (slug) => {
			try {
				return await getSessionAnalytics(slug);
			} catch (err) {
				return { slug, error: 'Failed to fetch' };
			}
		})
	);
	
	return results;
});

/**
 * Get quick session summary without full analytics - for listings
 */
export const getSessionSummary = query(v.string(), async (slug) => {
	// First get session by slug
	const [session] = await db.select().from(sessions).where(eq(sessions.slug, slug)).limit(1);
	
	if (!session) {
		throw error(404, 'Session not found');
	}
	
	// Then get participant count using session.id
	const participantCount = await db.select({ count: attendees.id }).from(attendees).where(eq(attendees.sessionId, session.id));
	
	return {
		...session,
		participantCount: participantCount.length,
		lastUpdated: new Date()
	};
});

/**
 * Get all sessions for a dashboard
 */
export const getDashboardSessions = query(GetDashboardSessionsSchema, async ({ presenterId }) => {
	try {
		const dashboardSessions = await db
			.select()
			.from(sessions)
			.where(eq(sessions.presenterId, presenterId))
			.orderBy(desc(sessions.createdAt));
		
		// PARALLEL OPERATIONS: Get participant counts for all sessions concurrently
		const sessionsWithCounts = await Promise.all(
			dashboardSessions.map(async (session) => {
				const participantList = await db
					.select()
					.from(attendees)
					.where(eq(attendees.sessionId, session.id));
				
				const activeCount = participantList.length;
				const completedCount = participantList.filter(a => a.completed).length;
				
				return {
					...session,
					activeCount,
					completedCount
				};
			})
		);
		
		return sessionsWithCounts;
	} catch (err) {
		throw err;
	}
});

/**
 * Get all sessions for a specific presenter
 * Returns all sessions with attendee counts and response rates
 * @param presenterId - The presenter's ID (currently returns all sessions as we don't have presenterId in schema)
 */

