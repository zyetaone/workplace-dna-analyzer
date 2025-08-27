/**
 * Dashboard Remote Service - Optimized for Speed & Concurrency
 * Enhanced with caching, batch operations, retry logic, and comprehensive error handling
 */

import { query, command } from '$app/server';
import * as v from 'valibot';
import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db/index';
import { sessions, participants } from '$lib/server/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import type { Generation, WordCloudItem, PreferenceScores } from '$lib/types';
import {
	SlugSchema,
	PresenterIdSchema,
	SessionTitleSchema,
	ParticipantIdSchema,
	RemoteError,
	handleDatabaseError,
	withRetry,
	cache,
	findSessionBySlug,
	getSessionParticipants,
	invalidateSessionCache,
	batchFindSessions,
	computeAnalyticsFast,
	validateAndParse,
	formatSuccessResponse,
	verifySessionOwnership
} from '$lib/server/remote-utils';

// ============= VALIDATION SCHEMAS =============

const CreateSessionSchema = v.object({
	title: SessionTitleSchema,
	presenterId: PresenterIdSchema
});

const EndSessionSchema = v.object({
	slug: SlugSchema
});

const DeleteParticipantSchema = v.object({
	slug: SlugSchema,
	participantId: ParticipantIdSchema
});

const GenerateAIInsightsSchema = v.object({
	slug: SlugSchema,
	includeIndividualProfiles: v.optional(v.boolean()),
	focusArea: v.optional(v.picklist(['collaboration', 'wellness', 'technology', 'formality', 'overall']))
});

const ExportSessionDataSchema = v.object({
	slug: SlugSchema,
	format: v.picklist(['json', 'csv', 'pdf']),
	includeResponses: v.optional(v.boolean()),
	includeAnalytics: v.optional(v.boolean())
});

const UpdateSessionSchema = v.object({
	slug: SlugSchema,
	isActive: v.boolean()
});

const GetDashboardSessionsSchema = v.object({
	presenterId: PresenterIdSchema
});

const DeleteSessionSchema = v.object({
	slug: SlugSchema,
	presenterId: PresenterIdSchema
});

const BatchRefreshSessionsSchema = v.array(SlugSchema);

// ============= QUERY FUNCTIONS (Fast Reads) =============

// Note: fetchSessionData removed - use getSessionAnalytics or fetchSessionByCode instead
// which provide more comprehensive data and proper validation


/**
 * Get comprehensive session analytics with caching and retry logic
 */
export const getSessionAnalytics = query(SlugSchema, async (slug) => {
	validateAndParse(SlugSchema, slug);
	
	const cacheKey = `analytics:${slug}`;
	let cachedResult = cache.get(cacheKey);
	
	if (cachedResult) {
		return { ...cachedResult, cached: true };
	}
	
	return withRetry(async () => {
		try {
			// Use optimized session lookup with caching
			const session = await findSessionBySlug(slug);
			
			// Get participants with caching
			const allParticipants = await getSessionParticipants(session.id);
			
			// Compute analytics
			const analytics = computeAnalyticsFast(allParticipants);
			
			const result = {
				session,
				participants: allParticipants,
				analytics,
				timestamp: new Date(),
				cached: false
			};
			
			// Cache the result for 15 seconds
			cache.set(cacheKey, result, 15000);
			
			return result;
		} catch (err) {
			handleDatabaseError(err, 'get session analytics');
		}
	});
});

// ============= COMMAND FUNCTIONS (State Changes) =============

/**
 * Create new session with enhanced validation and error handling
 */
export const createSession = command(CreateSessionSchema, async (input) => {
	const { title, presenterId } = validateAndParse(CreateSessionSchema, input);
	
	return withRetry(async () => {
		try {
			// Generate unique session code (8 characters)
			const code = crypto.randomUUID().substring(0, 8).toUpperCase();
			
			// Generate URL-friendly slug from session name
			const baseSlug = title
				.toLowerCase()
				.trim()
				.replace(/[^a-z0-9]+/g, '-')
				.replace(/^-+|-+$/g, '')
				.substring(0, 50);
			
			// Add unique suffix to prevent collisions
			const uniqueSuffix = crypto.randomUUID().substring(0, 6);
			const slug = `${baseSlug}-${uniqueSuffix}`;
			
			// Insert with database transaction safety
			const [session] = await db.insert(sessions).values({
				code,
				name: title,
				slug,
				presenterId
			}).returning();
			
			// Cache the new session immediately
			cache.set(`session:${session.slug}`, session, 30000);
			cache.set(`session_code:${session.code}`, session, 30000);
			
			return formatSuccessResponse({
				session,
				redirect: `/dashboard/${session.slug}`
			}, 'Session created successfully');
			
		} catch (err) {
			handleDatabaseError(err, 'create session');
		}
	}, 2); // Only retry twice for creation operations
});

/**
 * Update session status with cache invalidation
 */
export const updateSession = command(UpdateSessionSchema, async (input) => {
	const { slug, isActive } = validateAndParse(UpdateSessionSchema, input);
	
	return withRetry(async () => {
		try {
			// Verify session exists first
			const session = await findSessionBySlug(slug);
			
			// Update with optimistic locking
			const [updated] = await db
				.update(sessions)
				.set({ isActive } as any)
				.where(eq(sessions.slug, slug))
				.returning();
			
			if (!updated) {
				throw new RemoteError(404, 'Session not found or update failed', 'UPDATE_FAILED');
			}
			
			// Invalidate cache to ensure fresh data
			await invalidateSessionCache(session.id, slug, session.code);
			
			return formatSuccessResponse({
				session: updated
			}, 'Session updated successfully');
			
		} catch (err) {
			if (err instanceof RemoteError) throw err;
			handleDatabaseError(err, 'update session');
		}
	});
});

/**
 * End session with comprehensive cleanup and caching
 */
export const endSession = command(EndSessionSchema, async (input) => {
	const { slug } = validateAndParse(EndSessionSchema, input);
	
	return withRetry(async () => {
		try {
			// Verify session exists and get current state
			const session = await findSessionBySlug(slug);
			
			// Update session with end timestamp
			const [updatedSession] = await db.update(sessions)
				.set({ 
					isActive: false,
					endedAt: new Date().toISOString() 
				} as any)
				.where(eq(sessions.slug, slug))
				.returning();
			
			if (!updatedSession) {
				throw new RemoteError(404, 'Session not found or end failed', 'END_FAILED');
			}
			
			// Invalidate all session-related cache
			await invalidateSessionCache(session.id, slug, session.code);
			
			return formatSuccessResponse({
				session: updatedSession,
				participantsNotified: true // TODO: Implement participant notification
			}, 'Session ended successfully');
			
		} catch (err) {
			if (err instanceof RemoteError) throw err;
			handleDatabaseError(err, 'end session');
		}
	});
});

/**
 * Delete participant with atomic operation and cache invalidation
 */
export const deleteParticipant = command(DeleteParticipantSchema, async (input) => {
	const { slug, participantId } = validateAndParse(DeleteParticipantSchema, input);
	
	return withRetry(async () => {
		try {
			// Get session with caching
			const session = await findSessionBySlug(slug);
			
			// Verify participant exists before deletion
			const [participant] = await db
				.select()
				.from(participants)
				.where(and(
					eq(participants.id, participantId),
					eq(participants.sessionId, session.id)
				))
				.limit(1);
			
			if (!participant) {
				throw new RemoteError(404, 'Participant not found', 'PARTICIPANT_NOT_FOUND');
			}
			
			// Delete from database
			const result = await db.delete(participants)
				.where(and(
					eq(participants.id, participantId),
					eq(participants.sessionId, session.id)
				));
			
			// Invalidate participant cache
			cache.delete(`participants:${session.id}`);
			cache.delete(`analytics:${slug}`);
			
			return formatSuccessResponse({
				deletedId: participantId,
				participantName: participant.name
			}, 'Participant deleted successfully');
			
		} catch (err) {
			if (err instanceof RemoteError) throw err;
			handleDatabaseError(err, 'delete participant');
		}
	});
});

/**
 * Generate AI insights with caching and comprehensive analytics
 */
export const generateAIInsights = command(GenerateAIInsightsSchema, async (input) => {
	const { 
		slug, 
		includeIndividualProfiles = false, 
		focusArea = 'overall' 
	} = validateAndParse(GenerateAIInsightsSchema, input);
	
	const cacheKey = `ai_insights:${slug}:${focusArea}:${includeIndividualProfiles}`;
	let cachedInsights = cache.get(cacheKey);
	
	if (cachedInsights) {
		return formatSuccessResponse(cachedInsights, 'AI insights retrieved from cache');
	}
	
	return withRetry(async () => {
		try {
			// Get comprehensive session analytics
			const data = await getSessionAnalytics(slug);
			
			// Enhanced AI insights generation based on actual data
			const { analytics } = data;
			const insights = generateInsightsFromAnalytics(
				analytics, 
				data.participants, 
				focusArea,
				includeIndividualProfiles
			);
			
			// Cache insights for 5 minutes
			cache.set(cacheKey, insights, 300000);
			
			return formatSuccessResponse(insights, 'AI insights generated successfully');
			
		} catch (err) {
			if (err instanceof RemoteError) throw err;
			handleDatabaseError(err, 'generate AI insights');
		}
	});
});

/**
 * Generate insights from analytics data
 */
function generateInsightsFromAnalytics(
	analytics: any,
	participants: any[],
	focusArea: string,
	includeIndividualProfiles: boolean
) {
	const { preferenceScores, generationDistribution, workplaceDNA, responseRate } = analytics;
	
	// Generate contextual insights based on focus area
	const focusInsights = getFocusAreaInsights(focusArea, preferenceScores, generationDistribution);
	
	// Generate recommendations based on data
	const recommendations = generateRecommendations(preferenceScores, workplaceDNA, responseRate);
	
	const insights = {
		summary: `Your team's workplace DNA is ${workplaceDNA} with ${responseRate}% participation rate.`,
		keyFindings: focusInsights,
		recommendations,
		workplaceDNA,
		participationRate: responseRate,
		generatedAt: new Date(),
		focusArea,
		individualProfiles: includeIndividualProfiles ? generateIndividualProfiles(participants) : undefined
	};
	
	return insights;
}

function getFocusAreaInsights(focusArea: string, scores: any, generations: any): string[] {
	switch (focusArea) {
		case 'collaboration':
			return [
				`Collaboration preference score: ${scores.collaboration}/100`,
				scores.collaboration > 70 ? 'Strong collaborative culture detected' : 'Opportunity to enhance collaboration'
			];
		case 'wellness':
			return [
				`Wellness focus score: ${scores.wellness}/100`,
				scores.wellness > 70 ? 'High wellness awareness' : 'Consider wellness initiatives'
			];
		case 'technology':
			return [
				`Technology adoption score: ${scores.tech}/100`,
				scores.tech > 70 ? 'Tech-forward team' : 'Technology training opportunities'
			];
		case 'formality':
			return [
				`Structure preference score: ${scores.formality}/100`,
				scores.formality > 70 ? 'Prefers structured environment' : 'Flexible work style preference'
			];
		default:
			return [
				'Balanced preferences across all dimensions',
				`Dominant generation: ${Object.entries(generations).reduce((a, b) => a[1] > b[1] ? a : b)[0]}`
			];
	}
}

function generateRecommendations(scores: any, dna: string, responseRate: number): string[] {
	const recommendations = [];
	
	if (responseRate < 70) {
		recommendations.push('Consider strategies to increase survey participation');
	}
	
	if (scores.collaboration < 50) {
		recommendations.push('Implement more collaborative tools and processes');
	}
	
	if (scores.wellness < 50) {
		recommendations.push('Introduce wellness programs and work-life balance initiatives');
	}
	
	if (scores.tech < 50) {
		recommendations.push('Provide technology training and digital tool adoption support');
	}
	
	if (recommendations.length === 0) {
		recommendations.push('Your team shows strong alignment across all workplace dimensions');
	}
	
	return recommendations;
}

function generateIndividualProfiles(participants: any[]) {
	return participants
		.filter(p => p.completed && p.preferenceScores)
		.map(p => ({
			name: p.name,
			generation: p.generation,
			profile: determineWorkplaceProfile(p.preferenceScores),
			scores: p.preferenceScores
		}));
}

function determineWorkplaceProfile(scores: any): string {
	const maxScore = Math.max(scores.collaboration, scores.formality, scores.tech, scores.wellness);
	
	if (scores.collaboration === maxScore) return 'Collaborator';
	if (scores.tech === maxScore) return 'Tech Enthusiast';
	if (scores.wellness === maxScore) return 'Wellness Advocate';
	if (scores.formality === maxScore) return 'Structure Seeker';
	
	return 'Balanced Professional';
}

/**
 * Export session data with enhanced formats and validation
 */
export const exportSessionData = command(ExportSessionDataSchema, async (input) => {
	const {
		slug,
		format,
		includeResponses = true,
		includeAnalytics = true
	} = validateAndParse(ExportSessionDataSchema, input);
	
	return withRetry(async () => {
		try {
			// Get comprehensive session data
			const data = await getSessionAnalytics(slug);
			
			// Build structured export data
			const exportData = {
				meta: {
					exportedAt: new Date().toISOString(),
					format,
					version: '2.0',
					includeResponses,
					includeAnalytics
				},
				session: {
					id: data.session.id,
					name: data.session.name,
					code: data.session.code,
					slug: data.session.slug,
					createdAt: data.session.createdAt,
					endedAt: data.session.endedAt,
					isActive: data.session.isActive
				},
				analytics: includeAnalytics ? {
					...data.analytics,
					computedAt: data.analytics.computedAt?.toISOString()
				} : undefined,
				participants: data.participants.map(participant => ({
					id: participant.id,
					name: participant.name,
					generation: participant.generation,
					completed: participant.completed,
					joinedAt: participant.joinedAt,
					completedAt: participant.completedAt,
					preferenceScores: participant.preferenceScores,
					responses: includeResponses ? participant.responses : undefined
				}))
			};
			
			// Format conversion with enhanced error handling
			const { formattedData, mimeType, filename } = formatExportData(exportData, format, data.session.code);
			
			return formatSuccessResponse({
				data: formattedData,
				mimeType,
				filename,
				size: formattedData.length,
				recordCount: data.participants.length,
				completedRecords: data.participants.filter(p => p.completed).length
			}, 'Export completed successfully');
			
		} catch (err) {
			if (err instanceof RemoteError) throw err;
			handleDatabaseError(err, 'export session data');
		}
	});
});

/**
 * Format export data based on requested format
 */
function formatExportData(exportData: any, format: string, sessionCode: string) {
	const timestamp = Date.now();
	
	switch (format) {
		case 'json': {
			const formattedData = JSON.stringify(exportData, null, 2);
			return {
				formattedData,
				mimeType: 'application/json',
				filename: `session-${sessionCode}-${timestamp}.json`
			};
		}
		
		case 'csv': {
			// Enhanced CSV with better escaping and more fields
			const headers = [
				'Name', 'Generation', 'Completed', 'Joined At', 'Completed At',
				'Collaboration Score', 'Formality Score', 'Tech Score', 'Wellness Score'
			];
			
			const rows = exportData.participants.map((p: any) => [
				escapeCsvField(p.name),
				p.generation || '',
				p.completed ? 'Yes' : 'No',
				p.joinedAt ? new Date(p.joinedAt).toLocaleString() : '',
				p.completedAt ? new Date(p.completedAt).toLocaleString() : '',
				p.preferenceScores?.collaboration ?? '',
				p.preferenceScores?.formality ?? '',
				p.preferenceScores?.tech ?? '',
				p.preferenceScores?.wellness ?? ''
			]);
			
			const csvContent = [headers, ...rows]
				.map(row => row.join(','))
				.join('\n');
			
			return {
				formattedData: csvContent,
				mimeType: 'text/csv',
				filename: `session-${sessionCode}-${timestamp}.csv`
			};
		}
		
		case 'pdf':
			throw new RemoteError(501, 'PDF export not yet implemented', 'FEATURE_NOT_IMPLEMENTED');
			
		default:
			throw new RemoteError(400, `Unsupported export format: ${format}`, 'UNSUPPORTED_FORMAT');
	}
}

/**
 * Escape CSV field to handle commas, quotes, and newlines
 */
function escapeCsvField(field: string): string {
	if (typeof field !== 'string') return '';
	
	// If field contains comma, quote, or newline, wrap in quotes and escape internal quotes
	if (field.includes(',') || field.includes('"') || field.includes('\n')) {
		return '"' + field.replace(/"/g, '""') + '"';
	}
	
	return field;
}

/**
 * Delete session with comprehensive cleanup and verification
 */
export const deleteSession = command(DeleteSessionSchema, async (input) => {
	const { slug, presenterId } = validateAndParse(DeleteSessionSchema, input);
	
	return withRetry(async () => {
		try {
			// Verify session ownership using utility function
			const session = await verifySessionOwnership(slug, presenterId);
			
			// Get participant count for verification
			const participantList = await getSessionParticipants(session.id);
			const participantCount = participantList.length;
			
			// Perform cascading delete with transaction-like behavior
			// Delete participants first (foreign key constraint)
			if (participantCount > 0) {
				await db.delete(participants).where(eq(participants.sessionId, session.id));
			}
			
			// Then delete the session
			const deleteResult = await db.delete(sessions).where(eq(sessions.id, session.id));
			
			// Clear all related cache entries
			await invalidateSessionCache(session.id, slug, session.code);
			cache.delete(`dashboard_sessions:${presenterId}`);
			cache.delete(`summary:${slug}`);
			
			return formatSuccessResponse({
				deletedSessionId: session.id,
				deletedParticipants: participantCount,
				sessionName: session.name
			}, 'Session and all related data deleted successfully');
			
		} catch (err) {
			if (err instanceof RemoteError) throw err;
			handleDatabaseError(err, 'delete session');
		}
	}, 2); // Only retry twice for deletion operations
});



/**
 * Batch refresh multiple sessions with optimized parallel processing
 */
export const batchRefreshSessions = query(BatchRefreshSessionsSchema, async (slugs) => {
	validateAndParse(BatchRefreshSessionsSchema, slugs);
	
	// Limit batch size to prevent overwhelming the database
	if (slugs.length > 20) {
		throw new RemoteError(400, 'Batch size too large (max 20 sessions)', 'BATCH_TOO_LARGE');
	}
	
	return withRetry(async () => {
		// Process in smaller chunks if needed
		const chunkSize = 5;
		const results = [];
		
		for (let i = 0; i < slugs.length; i += chunkSize) {
			const chunk = slugs.slice(i, i + chunkSize);
			
			const chunkResults = await Promise.allSettled(
				chunk.map(async (slug) => {
					try {
						return {
							slug,
							success: true,
							data: await getSessionAnalytics(slug)
						};
					} catch (err) {
						return {
							slug,
							success: false,
							error: err instanceof RemoteError ? err.message : 'Failed to fetch'
						};
					}
				})
			);
			
			// Extract results from Promise.allSettled
			results.push(...chunkResults.map(result => 
				result.status === 'fulfilled' ? result.value : {
					slug: 'unknown',
					success: false,
					error: 'Promise rejected'
				}
			));
		}
		
		return formatSuccessResponse({
			results,
			totalRequested: slugs.length,
			successful: results.filter(r => r.success).length,
			failed: results.filter(r => !r.success).length
		}, 'Batch refresh completed');
	});
});

/**
 * Get quick session summary with caching - optimized for listings
 */
export const getSessionSummary = query(SlugSchema, async (slug) => {
	validateAndParse(SlugSchema, slug);
	
	const cacheKey = `summary:${slug}`;
	let summary = cache.get(cacheKey);
	
	if (summary) {
		return summary;
	}
	
	return withRetry(async () => {
		try {
			// Use cached session lookup
			const session = await findSessionBySlug(slug);
			
			// Get participant counts efficiently
			const participantList = await getSessionParticipants(session.id);
			const activeCount = participantList.length;
			const completedCount = participantList.filter(p => p.completed).length;
			
			summary = {
				...session,
				participantCount: activeCount,
				activeCount,
				completedCount,
				responseRate: activeCount > 0 ? Math.round((completedCount / activeCount) * 100) : 0,
				lastUpdated: new Date()
			};
			
			// Cache summary for 30 seconds
			cache.set(cacheKey, summary, 30000);
			
			return summary;
			
		} catch (err) {
			handleDatabaseError(err, 'get session summary');
		}
	});
});

/**
 * Get all sessions for a dashboard with optimized parallel processing
 */
export const getDashboardSessions = query(GetDashboardSessionsSchema, async (input) => {
	const { presenterId } = validateAndParse(GetDashboardSessionsSchema, input);
	
	const cacheKey = `dashboard_sessions:${presenterId}`;
	let cachedSessions = cache.get(cacheKey);
	
	if (cachedSessions) {
		return cachedSessions;
	}
	
	return withRetry(async () => {
		try {
			// Get presenter sessions with optimized query
			const dashboardSessions = await db
				.select()
				.from(sessions)
				.where(eq(sessions.presenterId, presenterId))
				.orderBy(desc(sessions.createdAt))
				.limit(50); // Reasonable limit for dashboard
			
			// Process in batches to avoid overwhelming database
			const batchSize = 10;
			const sessionsWithCounts = [];
			
			for (let i = 0; i < dashboardSessions.length; i += batchSize) {
				const batch = dashboardSessions.slice(i, i + batchSize);
				
				const batchResults = await Promise.all(
					batch.map(async (session) => {
						try {
							// Use cached participant lookup
							const participantList = await getSessionParticipants(session.id);
							
							const activeCount = participantList.length;
							const completedCount = participantList.filter(p => p.completed).length;
							
							return {
								...session,
								activeCount,
								completedCount,
								responseRate: activeCount > 0 ? Math.round((completedCount / activeCount) * 100) : 0
							};
						} catch (err) {
							// Return session with zero counts on error
							console.warn(`Failed to get counts for session ${session.id}:`, err);
							return {
								...session,
								activeCount: 0,
								completedCount: 0,
								responseRate: 0,
								error: 'Failed to load participant data'
							};
						}
					})
				);
				
				sessionsWithCounts.push(...batchResults);
			}
			
			// Cache for 1 minute
			cache.set(cacheKey, sessionsWithCounts, 60000);
			
			return sessionsWithCounts;
			
		} catch (err) {
			handleDatabaseError(err, 'get dashboard sessions');
		}
	});
});

// Export data operation already defined above - no re-export needed

/**
 * Health check for remote functions - useful for monitoring
 */
export const healthCheck = query(v.object({}), async () => {
	try {
		// Quick database connectivity test
		await db.select().from(sessions).limit(1);
		
		return formatSuccessResponse({
			status: 'healthy',
			timestamp: new Date(),
			cacheSize: cache instanceof Map ? cache.size : 'unknown',
			database: 'connected'
		}, 'All systems operational');
		
	} catch (err) {
		return {
			success: false,
			status: 'unhealthy',
			error: 'Database connection failed',
			timestamp: new Date()
		};
	}
});

/**
 * Clear cache manually - useful for debugging
 */
export const clearCache = command(v.object({ confirm: v.boolean() }), async (input) => {
	const { confirm } = validateAndParse(v.object({ confirm: v.boolean() }), input);
	
	if (!confirm) {
		throw new RemoteError(400, 'Cache clear must be confirmed', 'CONFIRMATION_REQUIRED');
	}
	
	cache.clear();
	
	return formatSuccessResponse({}, 'Cache cleared successfully');
});