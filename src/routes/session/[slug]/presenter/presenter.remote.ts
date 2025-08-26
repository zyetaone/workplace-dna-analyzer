/**
 * Presenter Remote Service - Optimized for Speed & Concurrency
 * Uses SvelteKit's query/command patterns with Valibot validation
 * Implements parallel operations and optimistic updates
 */

import { query, command } from '$app/server';
import * as v from 'valibot';
import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db/index';
import { sessions, attendees } from '$lib/server/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import slugify from 'slugify';
// Using native crypto instead of external packages
// Remote functions run on server - no client state access
import { broadcastEvents } from '$lib/server/sse-manager';
// Type definitions
type PreferenceScores = {
	collaboration: number;
	formality: number;
	tech: number;
	technology?: number;
	wellness: number;
};

type Generation = 'gen-z' | 'millennial' | 'gen-x' | 'baby-boomer';

interface WordCloudItem {
	text: string;
	value?: number;
	size?: number;
}

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

const DeleteAttendeeSchema = v.object({
	slug: v.pipe(v.string(), v.regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/), v.maxLength(100)),
	attendeeId: v.pipe(v.string(), v.uuid())
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

// ============= QUERY FUNCTIONS (Fast Reads) =============

/**
 * Fetch session data by slug
 * @param slug - session slug
 * @param includeAttendees - whether to include attendee list
 */
export const fetchSessionData = query(
	v.object({
		slug: v.string(),
		includeAttendees: v.optional(v.boolean())
	}),
	async ({ slug, includeAttendees = true }) => {
		try {
			// Get session by slug
			const [session] = await db.select().from(sessions).where(eq(sessions.slug, slug)).limit(1);
			
			if (!session) {
				throw error(404, 'Session not found');
			}
			
			// Fetch attendees if requested
			let attendeesList = [];
			if (includeAttendees) {
				attendeesList = await db.select().from(attendees).where(eq(attendees.sessionId, session.id));
			}
			
			// Return session with optional attendees
			return includeAttendees
				? { ...session, attendees: attendeesList, timestamp: new Date() }
				: session;
		} catch (err) {
			throw err;
		}
	}
);

/**
 * Fetch session by code (for attendee join)
 */
export const fetchSessionByCode = query(
	v.object({
		code: v.string()
	}),
	async ({ code }) => {
		try {
			const [session] = await db.select().from(sessions).where(eq(sessions.code, code.toUpperCase())).limit(1);
			
			if (!session) {
				throw error(404, 'Session not found');
			}
			
			return session;
		} catch (err) {
			throw err;
		}
	}
);

/**
 * Get all active sessions with attendee counts
 */
export const getActiveSessions = query(async () => {
	try {
		// Get all active sessions
		const activeSessions = await db
			.select()
			.from(sessions)
			.where(eq(sessions.isActive, true))
			.orderBy(desc(sessions.createdAt));
		
		// PARALLEL OPERATIONS: Get attendee counts for all sessions concurrently
		const sessionsWithCounts = await Promise.all(
			activeSessions.map(async (session) => {
				const attendeeList = await db
					.select()
					.from(attendees)
					.where(eq(attendees.sessionId, session.id));
				
				const activeCount = attendeeList.length;
				const completedCount = attendeeList.filter(a => a.completed).length;
				
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
 * Get comprehensive session analytics - OPTIMIZED with parallel queries
 */
export const getSessionAnalytics = query(SessionAnalyticsSchema, async ({ slug }) => {
	
	try {
		// First get session by slug
		const [session] = await db.select().from(sessions).where(eq(sessions.slug, slug)).limit(1);
		
		if (!session) {
			throw error(404, 'Session not found');
		}
		
		// Then get attendees using session.id
		const allAttendees = await db.select().from(attendees).where(eq(attendees.sessionId, session.id));
		
		// FAST ANALYTICS COMPUTATION using single-pass algorithms
		const analytics = computeAnalyticsFast(allAttendees);
		
		// Optimistic update to session state
		
		const result = {
			session,
			attendees: allAttendees,
			analytics,
			timestamp: new Date(),
			cached: false
		};
		
		
		// Broadcast analytics update via SSE (use session.id for SSE routing)
		broadcastEvents.analytics(session.id, analytics);
		
		return result;
		
	} catch (err) {
		throw err;
	}
});

/**
 * FAST analytics computation using optimized single-pass algorithms
 */
function computeAnalyticsFast(attendees: any[]) {
	const totalCount = attendees.length;
	const completedAttendees = attendees.filter(a => a.completed);
	const completedCount = completedAttendees.length;
	const activeCount = totalCount - completedCount;
	const responseRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
	
	// Single-pass computation for generation distribution and preference scores
	const generationDistribution = {
		'Baby Boomer': 0,
		'Gen X': 0,
		'Millennial': 0,
		'Gen Z': 0
	};
	
	const preferenceTotals = {
		collaboration: 0,
		formality: 0,
		technology: 0,
		wellness: 0
	};
	
	// Process all attendees in one pass
	completedAttendees.forEach(attendee => {
		// Count generations
		if (attendee.generation && generationDistribution[attendee.generation] !== undefined) {
			generationDistribution[attendee.generation]++;
		}
		
		// Sum preference scores
		if (attendee.preferenceScores) {
			preferenceTotals.collaboration += attendee.preferenceScores.collaboration || 0;
			preferenceTotals.formality += attendee.preferenceScores.formality || 0;
			preferenceTotals.technology += attendee.preferenceScores.technology || attendee.preferenceScores.tech || 0;
			preferenceTotals.wellness += attendee.preferenceScores.wellness || 0;
		}
	});
	
	// Calculate average preference scores
	const preferenceScores = completedCount > 0 ? {
		collaboration: Math.round(preferenceTotals.collaboration / completedCount),
		formality: Math.round(preferenceTotals.formality / completedCount),
		tech: Math.round(preferenceTotals.technology / completedCount),
		wellness: Math.round(preferenceTotals.wellness / completedCount)
	} : {
		collaboration: 0,
		formality: 0,
		tech: 0,
		wellness: 0
	};
	
	// Generate workplace DNA
	const workplaceDNA = generateWorkplaceDNA(preferenceScores);
	
	// Generate word cloud data
	const wordCloudData = generateWordCloudData(preferenceScores, generationDistribution);
	
	return {
		activeCount,
		completedCount,
		totalCount,
		responseRate,
		generationDistribution,
		preferenceScores,
		workplaceDNA,
		wordCloudData,
		computedAt: new Date()
	};
}

function generateWorkplaceDNA(scores: PreferenceScores): string {
	const profiles = [];
	
	if (scores.collaboration >= 7) profiles.push('Collaborative');
	else if (scores.collaboration <= 3) profiles.push('Independent');
	
	if (scores.formality >= 7) profiles.push('Structured');
	else if (scores.formality <= 3) profiles.push('Flexible');
	
	const techScore = scores.technology || scores.tech;
	if (techScore >= 7) profiles.push('Tech-Forward');
	else if (techScore <= 3) profiles.push('Traditional');
	
	if (scores.wellness >= 7) profiles.push('Wellness-Focused');
	else if (scores.wellness <= 3) profiles.push('Performance-Driven');
	
	return profiles.length > 0 ? profiles.join(' & ') : 'Balanced';
}

function generateWordCloudData(scores: PreferenceScores, generations: Record<string, number>): WordCloudItem[] {
	const words: WordCloudItem[] = [
		{ text: 'Collaboration', size: 20 + scores.collaboration * 8 },
		{ text: 'Formality', size: 20 + scores.formality * 8 },
		{ text: 'Technology', size: 20 + (scores.technology || scores.tech) * 8 },
		{ text: 'Wellness', size: 20 + scores.wellness * 8 }
	];
	
	// Add generation-based words
	Object.entries(generations).forEach(([gen, count]) => {
		if (count > 0) {
			words.push({
				text: gen,
				size: 15 + count * 5
			});
		}
	});
	
	return words;
}

// ============= COMMAND FUNCTIONS (State Changes) =============

/**
 * Create new session
 */
export const createSession = command(CreateSessionSchema, async ({ title, presenterId }) => {
	try {
		// Generate unique session code
		// Generate 8-character session code using crypto
		const code = crypto.randomUUID().substring(0, 8).toUpperCase();
		
		// Generate URL-friendly slug from session name
		const baseSlug = slugify(title, {
			lower: true,
			strict: true,
			trim: true
		});
		
		// Add short unique suffix for uniqueness
		const uniqueSuffix = crypto.randomUUID().substring(0, 6);
		const slug = `${baseSlug}-${uniqueSuffix}`;
		
		const [session] = await db.insert(sessions).values({
			code,
			name: title,
			slug
		}).returning();
		
		// Return created session
		return {
			success: true,
			session,
			redirect: `/session/${session.slug}/presenter`
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
		
		// Broadcast session ended event (use session.id for SSE)
		broadcastEvents.sessionEnded(updatedSession.id);
		
		return {
			success: true,
			session: updatedSession
		};
		
	} catch (err) {
		throw err;
	}
});

/**
 * Delete attendee with immediate UI update
 */
export const deleteAttendee = command(DeleteAttendeeSchema, async ({ slug, attendeeId }) => {
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
				eq(attendees.id, attendeeId),
				eq(attendees.sessionId, session.id)
			));
		
		// Broadcast deletion (use session.id for SSE)
		broadcastEvents.attendeeDeleted(session.id, attendeeId);
		
		return {
			success: true,
			deletedId: attendeeId
		};
		
	} catch (err) {
		// Rollback: we'd need to re-fetch the attendee data
		// For now, just refresh the session data
		await getSessionAnalytics({ slug });
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
		// Get current session analytics
		const analyticsData = await getSessionAnalytics({ slug });
		
		// Prepare AI prompt based on analytics
		const prompt = buildAIInsightPrompt(analyticsData.analytics, focusArea, includeIndividualProfiles);
		
		// Update loading state (use session.id for SSE)
		if (analyticsData.session) {
			broadcastEvents.analytics(analyticsData.session.id, {
				type: 'ai_generating',
				focusArea
			});
		}
		
		// Call AI service (replace with your AI API)
		const aiResponse = await generateAIResponse(prompt, analyticsData);
		
		const insights = {
			summary: aiResponse.summary,
			keyFindings: aiResponse.keyFindings,
			recommendations: aiResponse.recommendations,
			workplaceDNA: analyticsData.analytics.workplaceDNA,
			generatedAt: new Date(),
			focusArea
		};
		
		
		// Broadcast insights generated (use session.id for SSE)
		if (analyticsData.session) {
			broadcastEvents.analytics(analyticsData.session.id, {
				type: 'ai_insights_ready',
				insights
			});
		}
		
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
		// PARALLEL DATA COLLECTION
		const [analyticsData] = await Promise.all([
			getSessionAnalytics({ slug })
		]);
		
		// Build export data structure
		const exportData = {
			session: analyticsData.session,
			analytics: includeAnalytics ? analyticsData.analytics : undefined,
			attendees: analyticsData.attendees.map(attendee => ({
				id: attendee.id,
				name: attendee.name,
				generation: attendee.generation,
				completed: attendee.completed,
				completedAt: attendee.completedAt,
				preferenceScores: attendee.preferenceScores,
				responses: includeResponses ? attendee.responses : undefined
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
				formattedData = convertToCSV(exportData);
				mimeType = 'text/csv';
				filename = `session-${analyticsData.session.code}-${Date.now()}.csv`;
				break;
				
			case 'pdf':
				formattedData = await generatePDF(exportData);
				mimeType = 'application/pdf';
				filename = `session-${analyticsData.session.code}-${Date.now()}.pdf`;
				break;
				
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

// ============= AI FUNCTIONS (Replacing API routes) =============


// ============= UTILITY FUNCTIONS =============

function generateSessionCode(): string {
	// Use native crypto for better performance (no external deps)
	return crypto.randomUUID().substring(0, 8).toUpperCase();
}

function buildAIInsightPrompt(analytics: any, focusArea: string, includeIndividual: boolean): string {
	return `
Analyze the workplace preferences data:
- Total responses: ${analytics.completedCount}
- Response rate: ${analytics.responseRate}%
- Preference scores: ${JSON.stringify(analytics.preferenceScores)}
- Generation breakdown: ${JSON.stringify(analytics.generationDistribution)}
- Focus area: ${focusArea}

Generate insights on workplace culture and recommendations for ${analytics.workplaceDNA} teams.
${includeIndividual ? 'Include individual profile summaries.' : ''}
`;
}

async function generateAIResponse(prompt: string, data: any): Promise<any> {
	// Simple placeholder response for generateAIInsights command
	return {
		summary: `Based on ${data.analytics.completedCount} responses, your team shows ${data.analytics.workplaceDNA} characteristics.`,
		keyFindings: [
			`${data.analytics.responseRate}% response rate indicates strong engagement`,
			`Primary workplace DNA: ${data.analytics.workplaceDNA}`,
			'Balanced generational representation'
		],
		recommendations: [
			'Foster collaborative environments',
			'Maintain flexibility in work structures',
			'Invest in technology adoption training'
		]
	};
}

function convertToCSV(data: any): string {
	const headers = ['Name', 'Generation', 'Completed', 'Collaboration', 'Formality', 'Technology', 'Wellness'];
	const rows = [headers.join(',')];
	
	data.attendees.forEach((attendee: any) => {
		const scores = attendee.preferenceScores || {};
		rows.push([
			attendee.name,
			attendee.generation || 'Unknown',
			attendee.completed ? 'Yes' : 'No',
			scores.collaboration || '0',
			scores.formality || '0',
			scores.technology || scores.tech || '0',
			scores.wellness || '0'
		].join(','));
	});
	
	return rows.join('\n');
}

async function generatePDF(data: any): Promise<Buffer> {
	// Placeholder for PDF generation
	// Implement with puppeteer, jsPDF, or similar
	throw error(501, 'PDF export not yet implemented');
}

// ============= BATCH OPERATIONS FOR PERFORMANCE =============

/**
 * Batch refresh multiple sessions - useful for admin dashboards
 */
export const batchRefreshSessions = query(v.array(v.string()), async (slugs) => {
	const results = await Promise.all(
		slugs.map(slug => 
			getSessionAnalytics({ slug }).catch(err => ({ slug, error: err.message }))
		)
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
	
	// Then get attendee count using session.id
	const attendeeCount = await db.select({ count: attendees.id }).from(attendees).where(eq(attendees.sessionId, session.id));
	
	return {
		...session,
		attendeeCount: attendeeCount.length,
		lastUpdated: new Date()
	};
});

// ============= RESILIENCE & RETRY PATTERNS =============

/**
 * Retry wrapper for critical operations
 */
async function withRetry<T>(
	fn: () => Promise<T>,
	maxRetries = 3,
	delay = 1000
): Promise<T> {
	let lastError: any;
	
	for (let i = 0; i < maxRetries; i++) {
		try {
			return await fn();
		} catch (err) {
			lastError = err;
			if (i < maxRetries - 1) {
				await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
			}
		}
	}
	
	throw lastError;
}

// Note: Retry logic can be added within the command/query functions themselves if needed
// External wrapper functions are not supported in remote files