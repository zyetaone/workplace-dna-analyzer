/**
 * Advanced Async Remote Functions with Streaming
 * Based on svelte-async-remote-functions-example patterns
 *
 * Features:
 * - Async generators for streaming data
 * - Real-time updates without SSE overhead
 * - Progressive data loading
 * - Automatic cleanup
 */

import { query, command } from '$app/server';
import { db } from '$lib/server/db';
import { sessions, participants, participantProgress } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';

// ============================================================================
// Streaming Remote Functions (Async Generators)
// ============================================================================

/**
 * Stream participant updates in real-time
 * Client can consume this as an async iterator
 */
export const streamParticipants = query(async function* (sessionCode: string) {
	// Get session first
	const [session] = await db.select().from(sessions).where(eq(sessions.code, sessionCode)).limit(1);

	if (!session) {
		throw new Error('Session not found');
	}

	// Keep track of last update
	let lastCheck = new Date();

	// Stream updates every second
	while (true) {
		// Get participants updated since last check
		const participants = await db
			.select()
			.from(participants)
			.where(eq(participants.sessionId, session.id))
			.orderBy(desc(participants.joinedAt));

		// Yield current state
		yield {
			participants,
			timestamp: new Date(),
			total: participants.length,
			completed: participants.filter((p) => p.completed).length
		};

		// Wait before next update
		await new Promise((resolve) => setTimeout(resolve, 1000));

		// Update last check time
		lastCheck = new Date();

		// Optional: Break after certain conditions
		if (!session.isActive) {
			break;
		}
	}
});

/**
 * Progressive data loading with async generator
 * Loads data in chunks for better perceived performance
 */
export const loadSessionDataProgressive = query(async function* (code: string) {
	// Yield session info immediately
	const [session] = await db.select().from(sessions).where(eq(sessions.code, code)).limit(1);

	yield { type: 'session', data: session };

	// Then yield participants
	const participants = await db
		.select()
		.from(participants)
		.where(eq(participants.sessionId, session.id));

	yield { type: 'participants', data: participants };

	// Then calculate and yield analytics
	const analytics = {
		total: participants.length,
		completed: participants.filter((p) => p.completed).length,
		averageScore: calculateAverageScore(participants),
		generationBreakdown: getGenerationBreakdown(participants)
	};

	yield { type: 'analytics', data: analytics };

	// Finally yield detailed insights
	const insights = await generateInsights(participants);
	yield { type: 'insights', data: insights };
});

// ============================================================================
// Tagged Template Literals with Async Iteration
// ============================================================================

/**
 * Stream query results with template literal syntax
 * @example
 * for await (const batch of stream`select participants where session = ${code} batch 10`) {
 *   console.log('Got batch:', batch);
 * }
 */
export const stream = query(async function* (strings: TemplateStringsArray, ...values: any[]) {
	const queryStr = strings.join('');
	const batchMatch = queryStr.match(/batch (\d+)/);
	const batchSize = batchMatch ? parseInt(batchMatch[1]) : 10;

	// Parse entity and conditions
	const [, entity, conditionStr] = queryStr.match(/select (\w+) where (.+?)(?:\s+batch|$)/) || [];

	// Get table reference
	const tables: Record<string, any> = {
		participants,
		sessions,
		progress: participantProgress
	};

	const table = tables[entity];
	if (!table) throw new Error(`Unknown entity: ${entity}`);

	// Stream results in batches
	let offset = 0;
	let hasMore = true;

	while (hasMore) {
		const batch = await db.select().from(table).limit(batchSize).offset(offset);

		if (batch.length === 0) {
			hasMore = false;
		} else {
			yield batch;
			offset += batchSize;
		}

		// Small delay to prevent overwhelming
		await new Promise((resolve) => setTimeout(resolve, 100));
	}
});

// ============================================================================
// Real-time Collaboration Functions
// ============================================================================

/**
 * Watch for changes and auto-sync
 * Implements optimistic updates with conflict resolution
 */
export const watchAndSync = query(async function* (
	entity: string,
	id: string,
	localVersion: number = 0
) {
	const tables: Record<string, any> = {
		participant: participants,
		session: sessions,
		progress: participantProgress
	};

	const table = tables[entity];
	let currentVersion = localVersion;

	while (true) {
		// Get latest from database
		const [latest] = await db.select().from(table).where(eq(table.id, id)).limit(1);

		// Check for changes
		if (latest && latest.version > currentVersion) {
			yield {
				type: 'update',
				data: latest,
				version: latest.version,
				conflict: latest.version > currentVersion + 1
			};
			currentVersion = latest.version;
		}

		// Wait before next check
		await new Promise((resolve) => setTimeout(resolve, 500));
	}
});

/**
 * Optimistic update with conflict resolution
 */
export const optimisticUpdate = command(
	async (entity: string, id: string, updates: any, expectedVersion: number) => {
		const tables: Record<string, any> = {
			participant: participants,
			session: sessions,
			progress: participantProgress
		};

		const table = tables[entity];

		// Check current version
		const [current] = await db.select().from(table).where(eq(table.id, id)).limit(1);

		if (!current) {
			throw new Error('Entity not found');
		}

		// Conflict detection
		if (current.version !== expectedVersion) {
			return {
				success: false,
				conflict: true,
				current: current,
				message: 'Version conflict - entity was modified'
			};
		}

		// Apply update with version increment
		const result = await db
			.update(table)
			.set({
				...updates,
				version: expectedVersion + 1,
				updatedAt: new Date().toISOString()
			})
			.where(eq(table.id, id))
			.returning();

		return {
			success: true,
			data: result[0],
			version: expectedVersion + 1
		};
	}
);

// ============================================================================
// Cursor-based Pagination with Async Iteration
// ============================================================================

/**
 * Paginated results with cursor
 */
export const paginate = query(async function* (
	entity: string,
	pageSize: number = 20,
	initialCursor?: string
) {
	const tables: Record<string, any> = {
		participants,
		sessions,
		progress: participantProgress
	};

	const table = tables[entity];
	let cursor = initialCursor;
	let hasMore = true;

	while (hasMore) {
		let query = db
			.select()
			.from(table)
			.limit(pageSize + 1);

		if (cursor) {
			query = query.where(eq(table.id, cursor));
		}

		const results = await query;

		// Check if there are more results
		hasMore = results.length > pageSize;
		const items = hasMore ? results.slice(0, -1) : results;

		if (items.length > 0) {
			yield {
				items,
				cursor: items[items.length - 1].id,
				hasMore
			};

			cursor = items[items.length - 1].id;
		} else {
			hasMore = false;
		}
	}
});

// ============================================================================
// Helper Functions
// ============================================================================

function calculateAverageScore(participants: any[]): number {
	const completed = participants.filter((p) => p.completed && p.preferenceScores);
	if (completed.length === 0) return 0;

	const total = completed.reduce((sum, p) => {
		const scores = p.preferenceScores;
		return sum + (scores.collaboration + scores.formality + scores.tech + scores.wellness) / 4;
	}, 0);

	return Math.round(total / completed.length);
}

function getGenerationBreakdown(participants: any[]): Record<string, number> {
	return participants.reduce(
		(acc, p) => {
			if (p.generation) {
				acc[p.generation] = (acc[p.generation] || 0) + 1;
			}
			return acc;
		},
		{} as Record<string, number>
	);
}

async function generateInsights(participants: any[]): Promise<string[]> {
	// Simulate AI insights generation
	await new Promise((resolve) => setTimeout(resolve, 100));

	const insights = [];
	const completed = participants.filter((p) => p.completed);

	if (completed.length > 0) {
		insights.push(`${completed.length} participants have completed the assessment`);

		const avgScores = calculateAverageScore(participants);
		if (avgScores > 70) {
			insights.push('High engagement scores indicate strong workplace satisfaction');
		}
	}

	return insights;
}

// ============================================================================
// Export for Component Usage
// ============================================================================

export default {
	// Streaming functions
	streamParticipants,
	loadSessionDataProgressive,
	stream,

	// Real-time collaboration
	watchAndSync,
	optimisticUpdate,

	// Pagination
	paginate
};
