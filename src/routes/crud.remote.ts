/**
 * Smart CRUD System with Tagged Template Literals
 *
 * Features:
 * - Natural language-like queries
 * - Automatic state tracking
 * - Conditional operations
 * - Type-safe with auto-completion
 * - Reusable across components
 */

import { query, command } from '$app/server';
import { db } from '$lib/server/db';
import { sessions, participants, activities, participantProgress } from '$lib/server/db/schema';
import { eq, and, or, sql } from 'drizzle-orm';
import { RemoteResponse } from '$lib/server/response';
import { generateId } from '$lib/utils/id';

// ============================================================================
// Smart Template Literal Parser
// ============================================================================

type ParsedQuery = {
	operation: 'create' | 'read' | 'update' | 'delete' | 'upsert';
	entity: string;
	conditions: Map<string, any>;
	data: Record<string, any>;
	options: {
		ifNotExists?: boolean;
		returning?: boolean;
		cascade?: boolean;
	};
};

function parseTemplate(strings: TemplateStringsArray, values: any[]): ParsedQuery {
	const query = strings
		.reduce((acc, str, i) => acc + str + (i < values.length ? `{{${i}}}` : ''), '')
		.toLowerCase();

	// Parse operation
	const operation = query.match(/^(create|read|update|delete|upsert)/)?.[1] as any;

	// Parse entity
	const entity = query.match(/(?:create|read|update|delete|upsert)\s+(\w+)/)?.[1];

	// Parse conditions
	const conditions = new Map();
	if (query.includes('where')) {
		const whereMatch = query.match(/where\s+(\w+)\s*=\s*{{(\d+)}}/);
		if (whereMatch) {
			conditions.set(whereMatch[1], values[parseInt(whereMatch[2])]);
		}
	}

	// Parse options
	const options = {
		ifNotExists: query.includes('if not exists') || query.includes('unless exists'),
		returning: query.includes('returning'),
		cascade: query.includes('cascade')
	};

	// Extract data object (usually the first object value)
	const data = values.find((v) => typeof v === 'object' && !Array.isArray(v)) || {};

	return { operation, entity, conditions, data, options };
}

// ============================================================================
// Core CRUD Operations with Smart Logic
// ============================================================================

/**
 * CREATE - Smart creation with existence checking
 * @example
 * await c`create participant if not exists ${{
 *   id: cookieId,
 *   sessionId,
 *   name: 'Anonymous'
 * }}`;
 *
 * await c`create session ${{ code: 'ABC-123456', name: 'Team Meeting' }}`;
 */
export const c = command(async (strings: TemplateStringsArray, ...values: any[]) => {
	const { entity, data, options } = parseTemplate(strings, values);

	// Map entity to table
	const tables: Record<string, any> = {
		session: sessions,
		participant: participants,
		activity: activities,
		progress: participantProgress
	};

	const table = tables[entity];
	if (!table) throw new Error(`Unknown entity: ${entity}`);

	// Handle "if not exists" logic
	if (options.ifNotExists && data.id) {
		const existing = await db.select().from(table).where(eq(table.id, data.id)).limit(1);

		if (existing.length > 0) {
			return RemoteResponse.success({
				created: false,
				existing: true,
				data: existing[0]
			});
		}
	}

	// Add ID if not provided
	if (!data.id) {
		data.id = generateId();
	}

	// Create the record
	const result = await db.insert(table).values(data).returning();

	return RemoteResponse.success({
		created: true,
		data: result[0]
	});
});

/**
 * READ - Smart queries with conditions
 * @example
 * const session = await r`read session where code = ${code}`;
 * const participants = await r`read participants where sessionId = ${sessionId}`;
 * const active = await r`read participants where completed = ${false}`;
 */
export const r = query(async (strings: TemplateStringsArray, ...values: any[]) => {
	const { entity, conditions } = parseTemplate(strings, values);

	const tables: Record<string, any> = {
		session: sessions,
		sessions: sessions, // Allow plural
		participant: participants,
		participants: participants,
		activity: activities,
		activities: activities,
		progress: participantProgress
	};

	const table = tables[entity];
	if (!table) throw new Error(`Unknown entity: ${entity}`);

	let query = db.select().from(table);

	// Apply conditions
	conditions.forEach((value, field) => {
		query = query.where(eq(table[field], value));
	});

	const results = await query;

	// Return single item for singular entities, array for plural
	if (entity.endsWith('s')) {
		return results;
	}
	return results[0] || null;
});

/**
 * UPDATE - Smart updates with validation
 * @example
 * await u`update participant where id = ${id} set ${{
 *   completed: true,
 *   completedAt: new Date().toISOString()
 * }}`;
 *
 * await u`update session where code = ${code} toggle isActive`;
 */
export const u = command(async (strings: TemplateStringsArray, ...values: any[]) => {
	const query = strings.join('').toLowerCase();
	const { entity, conditions, data } = parseTemplate(strings, values);

	const tables: Record<string, any> = {
		session: sessions,
		participant: participants,
		activity: activities,
		progress: participantProgress
	};

	const table = tables[entity];
	if (!table) throw new Error(`Unknown entity: ${entity}`);

	// Handle toggle operations
	if (query.includes('toggle')) {
		const field = query.match(/toggle\s+(\w+)/)?.[1];
		if (field) {
			// Get current value
			const [current] = await db
				.select()
				.from(table)
				.where(
					Array.from(conditions.entries()).reduce(
						(acc, [field, value]) => and(acc, eq(table[field], value)),
						undefined as any
					)
				)
				.limit(1);

			if (current) {
				data[field] = !current[field];
			}
		}
	}

	// Build WHERE clause
	const whereClause = Array.from(conditions.entries()).reduce(
		(acc, [field, value]) => and(acc, eq(table[field], value)),
		undefined as any
	);

	const result = await db.update(table).set(data).where(whereClause).returning();

	return RemoteResponse.success({
		updated: result.length > 0,
		data: result[0]
	});
});

/**
 * DELETE - Smart deletion with cascade support
 * @example
 * await d`delete participant where id = ${id}`;
 * await d`delete session where code = ${code} cascade`;
 */
export const d = command(async (strings: TemplateStringsArray, ...values: any[]) => {
	const { entity, conditions, options } = parseTemplate(strings, values);

	const tables: Record<string, any> = {
		session: sessions,
		participant: participants,
		activity: activities,
		progress: participantProgress
	};

	const table = tables[entity];
	if (!table) throw new Error(`Unknown entity: ${entity}`);

	// Build WHERE clause
	const whereClause = Array.from(conditions.entries()).reduce(
		(acc, [field, value]) => and(acc, eq(table[field], value)),
		undefined as any
	);

	// Handle cascade deletion for sessions
	if (entity === 'session' && options.cascade) {
		const [session] = await db.select().from(sessions).where(whereClause).limit(1);
		if (session) {
			// Delete all participants first
			await db.delete(participants).where(eq(participants.sessionId, session.id));
			// Delete progress records
			await db
				.delete(participantProgress)
				.where(
					sql`participant_id IN (SELECT id FROM ${participants} WHERE session_id = ${session.id})`
				);
		}
	}

	// Delete the main record
	await db.delete(table).where(whereClause);

	return RemoteResponse.success({ deleted: true });
});

// ============================================================================
// Advanced Operations
// ============================================================================

/**
 * UPSERT - Create or update based on existence
 * @example
 * await upsert`participant where id = ${id} data ${{
 *   name,
 *   generation,
 *   responses
 * }}`;
 */
export const upsert = command(async (strings: TemplateStringsArray, ...values: any[]) => {
	const { entity, conditions, data } = parseTemplate(strings, values);

	// Check if exists
	const existing = await r(strings, ...values);

	if (existing) {
		// Update
		return await u`update ${entity} where id = ${existing.id} set ${data}`;
	} else {
		// Create
		return await c`create ${entity} ${data}`;
	}
});

// ============================================================================
// API Call Organizers
// ============================================================================

/**
 * Organized API endpoints by domain
 */
export const api = {
	// Session operations
	session: {
		create: (name: string) => c`create session ${{ name, code: generateSessionCode() }}`,

		get: (code: string) => r`read session where code = ${code}`,

		toggle: (code: string) => u`update session where code = ${code} toggle isActive`,

		delete: (code: string) => d`delete session where code = ${code} cascade`,

		getParticipants: (sessionId: string) => r`read participants where sessionId = ${sessionId}`
	},

	// Participant operations
	participant: {
		join: (sessionId: string, name: string, generation: string) =>
			c`create participant if not exists ${{
				sessionId,
				name,
				generation,
				joinedAt: new Date().toISOString()
			}}`,

		updateProgress: (id: string, responses: any) =>
			u`update participant where id = ${id} set ${{ responses }}`,

		complete: (id: string, scores: any) =>
			u`update participant where id = ${id} set ${{
				completed: true,
				completedAt: new Date().toISOString(),
				preferenceScores: scores
			}}`,

		remove: (id: string) => d`delete participant where id = ${id}`
	},

	// Activity tracking
	activity: {
		start: (participantId: string, activitySlug: string) =>
			c`create progress ${{
				participantId,
				activitySlug,
				startedAt: new Date().toISOString()
			}}`,

		update: (participantId: string, activitySlug: string, responses: any) =>
			u`update progress where participantId = ${participantId} and activitySlug = ${activitySlug} set ${{
				responses,
				updatedAt: new Date().toISOString()
			}}`,

		complete: (participantId: string, activitySlug: string, scores: any) =>
			u`update progress where participantId = ${participantId} and activitySlug = ${activitySlug} set ${{
				completed: true,
				completedAt: new Date().toISOString(),
				scores
			}}`
	}
};

// ============================================================================
// Helper Functions
// ============================================================================

function generateSessionCode(): string {
	const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
	const numbers = '0123456789';

	const letterPart = Array.from(
		{ length: 3 },
		() => letters[Math.floor(Math.random() * letters.length)]
	).join('');

	const numberPart = Array.from(
		{ length: 6 },
		() => numbers[Math.floor(Math.random() * numbers.length)]
	).join('');

	return `${letterPart}-${numberPart}`;
}

// ============================================================================
// Export for Component Usage
// ============================================================================

export default {
	// Core CRUD
	c,
	r,
	u,
	d,
	upsert,

	// Organized API
	api,

	// For custom queries
	query: r,
	command: c
};
