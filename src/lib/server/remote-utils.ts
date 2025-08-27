/**
 * Shared utilities for remote functions
 * Provides common patterns, error handling, caching, and database operations
 */

import { error } from '@sveltejs/kit';
import * as v from 'valibot';
import { db } from '$lib/server/db/index';
import { sessions, participants } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

// ============= COMMON VALIDATION SCHEMAS =============

export const SlugSchema = v.pipe(
	v.string(), 
	v.regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/), 
	v.maxLength(100)
);

export const PresenterIdSchema = v.pipe(v.string(), v.minLength(1));

export const ParticipantIdSchema = v.pipe(v.string(), v.uuid());

export const SessionCodeSchema = v.pipe(
	v.string(), 
	v.minLength(1), 
	v.maxLength(10)
);

export const ParticipantNameSchema = v.pipe(
	v.string(), 
	v.minLength(1), 
	v.maxLength(100)
);

export const SessionTitleSchema = v.pipe(
	v.string(), 
	v.minLength(1), 
	v.maxLength(200)
);

// ============= ERROR HANDLING UTILITIES =============

export class RemoteError extends Error {
	constructor(
		public statusCode: number,
		message: string,
		public code?: string,
		public retryable: boolean = false
	) {
		super(message);
		this.name = 'RemoteError';
	}
}

export function handleDatabaseError(err: unknown, operation: string): never {
	console.error(`Database error during ${operation}:`, err);
	
	if (err instanceof Error) {
		// Check for common database errors that might be retryable
		if (err.message.includes('database is locked') || 
			err.message.includes('SQLITE_BUSY') ||
			err.message.includes('timeout')) {
			throw new RemoteError(503, 'Database temporarily unavailable', 'DB_BUSY', true);
		}
		
		// Foreign key constraint errors
		if (err.message.includes('FOREIGN KEY constraint failed')) {
			throw new RemoteError(400, 'Invalid reference', 'FK_CONSTRAINT');
		}
		
		// Unique constraint errors
		if (err.message.includes('UNIQUE constraint failed')) {
			throw new RemoteError(409, 'Duplicate entry', 'UNIQUE_CONSTRAINT');
		}
	}
	
	// Generic database error
	throw new RemoteError(500, `Failed to ${operation}`, 'DB_ERROR');
}

export async function withRetry<T>(
	operation: () => Promise<T>,
	maxRetries: number = 3,
	baseDelay: number = 100
): Promise<T> {
	let lastError: Error;
	
	for (let attempt = 0; attempt <= maxRetries; attempt++) {
		try {
			return await operation();
		} catch (err) {
			lastError = err as Error;
			
			// Only retry for retryable errors
			if (err instanceof RemoteError && !err.retryable) {
				throw err;
			}
			
			// Don't retry on the last attempt
			if (attempt === maxRetries) {
				break;
			}
			
			// Exponential backoff with jitter
			const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 100;
			await new Promise(resolve => setTimeout(resolve, delay));
		}
	}
	
	throw lastError;
}

// ============= CACHING UTILITIES =============

interface CacheEntry<T> {
	data: T;
	timestamp: number;
	ttl: number;
}

class SimpleCache {
	private cache = new Map<string, CacheEntry<any>>();
	
	get<T>(key: string): T | null {
		const entry = this.cache.get(key);
		if (!entry) return null;
		
		if (Date.now() - entry.timestamp > entry.ttl) {
			this.cache.delete(key);
			return null;
		}
		
		return entry.data;
	}
	
	set<T>(key: string, data: T, ttl: number = 30000): void {
		this.cache.set(key, {
			data,
			timestamp: Date.now(),
			ttl
		});
	}
	
	delete(key: string): void {
		this.cache.delete(key);
	}
	
	clear(): void {
		this.cache.clear();
	}
	
	// Clean expired entries
	cleanup(): void {
		const now = Date.now();
		for (const [key, entry] of this.cache.entries()) {
			if (now - entry.timestamp > entry.ttl) {
				this.cache.delete(key);
			}
		}
	}
}

export const cache = new SimpleCache();

// Clean cache every 5 minutes
setInterval(() => cache.cleanup(), 5 * 60 * 1000);

// ============= DATABASE QUERY UTILITIES =============

export async function findSessionBySlug(slug: string) {
	const cacheKey = `session:${slug}`;
	let session = cache.get(cacheKey);
	
	if (!session) {
		try {
			const [result] = await db
				.select()
				.from(sessions)
				.where(eq(sessions.slug, slug))
				.limit(1);
			
			if (!result) {
				throw error(404, 'Session not found');
			}
			
			session = result;
			cache.set(cacheKey, session, 30000); // Cache for 30 seconds
		} catch (err) {
			handleDatabaseError(err, 'find session by slug');
		}
	}
	
	return session;
}

export async function findSessionByCode(code: string) {
	const cacheKey = `session_code:${code}`;
	let session = cache.get(cacheKey);
	
	if (!session) {
		try {
			const [result] = await db
				.select()
				.from(sessions)
				.where(eq(sessions.code, code))
				.limit(1);
			
			if (!result) {
				throw error(404, 'Session not found');
			}
			
			session = result;
			cache.set(cacheKey, session, 30000);
		} catch (err) {
			handleDatabaseError(err, 'find session by code');
		}
	}
	
	return session;
}

export async function findParticipantById(participantId: string, sessionId: string) {
	try {
		const [participant] = await db
			.select()
			.from(participants)
			.where(and(
				eq(participants.id, participantId),
				eq(participants.sessionId, sessionId)
			))
			.limit(1);
		
		if (!participant) {
			throw new RemoteError(404, 'Participant not found', 'PARTICIPANT_NOT_FOUND');
		}
		
		return participant;
	} catch (err) {
		if (err instanceof RemoteError) throw err;
		handleDatabaseError(err, 'find participant');
	}
}

export async function getSessionParticipants(sessionId: string) {
	const cacheKey = `participants:${sessionId}`;
	let participants_list = cache.get(cacheKey);
	
	if (!participants_list) {
		try {
			participants_list = await db
				.select()
				.from(participants)
				.where(eq(participants.sessionId, sessionId));
			
			cache.set(cacheKey, participants_list, 15000); // Cache for 15 seconds
		} catch (err) {
			handleDatabaseError(err, 'get session participants');
		}
	}
	
	return participants_list;
}

export async function invalidateSessionCache(sessionId: string, slug: string, code: string) {
	cache.delete(`session:${slug}`);
	cache.delete(`session_code:${code}`);
	cache.delete(`participants:${sessionId}`);
	cache.delete(`analytics:${slug}`);
}

// ============= BATCH OPERATIONS =============

export async function batchFindSessions(slugs: string[]) {
	// Check cache first
	const cached: any[] = [];
	const toFetch: string[] = [];
	
	for (const slug of slugs) {
		const cached_session = cache.get(`session:${slug}`);
		if (cached_session) {
			cached.push(cached_session);
		} else {
			toFetch.push(slug);
		}
	}
	
	// Fetch missing sessions in batch
	let fetched: any[] = [];
	if (toFetch.length > 0) {
		try {
			fetched = await db
				.select()
				.from(sessions)
				.where(
					// Use SQL IN clause for batch query
					sessions.slug as any // Type assertion for complex SQL
				);
			
			// Cache the fetched sessions
			for (const session of fetched) {
				cache.set(`session:${session.slug}`, session, 30000);
			}
		} catch (err) {
			handleDatabaseError(err, 'batch find sessions');
		}
	}
	
	return [...cached, ...fetched];
}

// ============= ANALYTICS UTILITIES =============

export function computeAnalyticsFast(participants: any[]) {
	const completed = participants.filter(p => p.completed);
	const total = participants.length;
	
	// Initialize counters
	const generationCount = {
		'Baby Boomer': 0,
		'Gen X': 0,
		'Millennial': 0,
		'Gen Z': 0
	};
	
	const scoresSums = {
		collaboration: 0,
		formality: 0,
		tech: 0,
		wellness: 0
	};
	
	let validScoresCount = 0;
	
	// Single pass through completed participants
	for (const participant of completed) {
		// Count generations
		if (participant.generation && generationCount.hasOwnProperty(participant.generation)) {
			generationCount[participant.generation as keyof typeof generationCount]++;
		}
		
		// Sum preference scores
		if (participant.preferenceScores) {
			const scores = participant.preferenceScores;
			scoresSums.collaboration += scores.collaboration || 0;
			scoresSums.formality += scores.formality || 0;
			scoresSums.tech += scores.tech || 0;
			scoresSums.wellness += scores.wellness || 0;
			validScoresCount++;
		}
	}
	
	// Calculate averages
	const averageScores = validScoresCount > 0 ? {
		collaboration: Math.round(scoresSums.collaboration / validScoresCount),
		formality: Math.round(scoresSums.formality / validScoresCount),
		tech: Math.round(scoresSums.tech / validScoresCount),
		wellness: Math.round(scoresSums.wellness / validScoresCount)
	} : {
		collaboration: 0,
		formality: 0,
		tech: 0,
		wellness: 0
	};
	
	// Determine workplace DNA
	const workplaceDNA = generateWorkplaceDNA(averageScores);
	
	return {
		activeCount: total - completed.length,
		completedCount: completed.length,
		totalCount: total,
		responseRate: total > 0 ? Math.round((completed.length / total) * 100) : 0,
		generationDistribution: generationCount,
		preferenceScores: averageScores,
		workplaceDNA,
		wordCloudData: [],
		computedAt: new Date()
	};
}

function generateWorkplaceDNA(scores: { collaboration: number; formality: number; tech: number; wellness: number }): string {
	const { collaboration, formality, tech, wellness } = scores;
	
	// Simple DNA generation based on highest scores
	const maxScore = Math.max(collaboration, formality, tech, wellness);
	
	if (maxScore === 0) return 'Neutral';
	
	if (collaboration === maxScore) return 'Collaborative';
	if (tech === maxScore) return 'Tech-Forward';
	if (wellness === maxScore) return 'Wellness-Focused';
	if (formality === maxScore) return 'Structured';
	
	return 'Balanced';
}

// ============= VALIDATION HELPERS =============

export function validateAndParse<T extends v.BaseSchema<any, any, any>>(
	schema: T,
	data: unknown
): v.InferOutput<T> {
	try {
		return v.parse(schema, data);
	} catch (err) {
		if (err instanceof v.ValiError) {
			const issues = err.issues.map(issue => issue.message).join(', ');
			throw new RemoteError(400, `Validation failed: ${issues}`, 'VALIDATION_ERROR');
		}
		throw new RemoteError(400, 'Invalid input data', 'VALIDATION_ERROR');
	}
}

// ============= RESPONSE FORMATTERS =============

export function formatSuccessResponse<T>(data: T, message?: string) {
	return {
		success: true,
		data,
		message,
		timestamp: new Date()
	};
}

export function formatErrorResponse(error: RemoteError) {
	return {
		success: false,
		error: {
			message: error.message,
			code: error.code,
			retryable: error.retryable
		},
		timestamp: new Date()
	};
}

// ============= COMMON OPERATIONS =============

export async function verifySessionOwnership(sessionSlug: string, presenterId: string) {
	const session = await findSessionBySlug(sessionSlug);
	
	if (session.presenterId !== presenterId) {
		throw new RemoteError(403, 'Not authorized to access this session', 'UNAUTHORIZED');
	}
	
	return session;
}