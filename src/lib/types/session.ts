/**
 * Session Schema Layer
 * Database schemas and types for session-related entities
 */

import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// ============================================================================
// SESSIONS SCHEMA
// ============================================================================

export const sessions = sqliteTable('sessions', {
	id: text('id').primaryKey(),
	code: text('code').notNull().unique(), // 6-character session code
	name: text('name').notNull(), // Session name/title
	isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
	createdAt: text('created_at')
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`),
	endedAt: text('ended_at'), // When session was manually ended
	maxParticipants: integer('max_participants').default(100),
	allowAnonymous: integer('allow_anonymous', { mode: 'boolean' }).default(true),
	autoEndOnComplete: integer('auto_end_on_complete', { mode: 'boolean' }).default(false),
	timeLimit: integer('time_limit') // in minutes
});

// ============================================================================
// SESSION CONFIGURATIONS SCHEMA
// ============================================================================

export const sessionConfigurations = sqliteTable('session_configurations', {
	id: text('id').primaryKey(),
	sessionId: text('session_id')
		.notNull()
		.references(() => sessions.id),
	key: text('key').notNull(),
	value: text('value').notNull(),
	createdAt: text('created_at')
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`)
});

// ============================================================================
// SESSION METRICS SCHEMA
// ============================================================================

export const sessionMetrics = sqliteTable('session_metrics', {
	id: text('id').primaryKey(),
	sessionId: text('session_id')
		.notNull()
		.references(() => sessions.id),
	metricType: text('metric_type').notNull(), // 'participant_count', 'completion_rate', etc.
	value: integer('value').notNull(),
	timestamp: text('timestamp')
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`)
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type SessionConfiguration = typeof sessionConfigurations.$inferSelect;
export type NewSessionConfiguration = typeof sessionConfigurations.$inferInsert;
export type SessionMetric = typeof sessionMetrics.$inferSelect;
export type NewSessionMetric = typeof sessionMetrics.$inferInsert;

// ============================================================================
// EXTENDED TYPES
// ============================================================================

export type SessionWithCounts = Session & {
	activeCount: number;
	completedCount: number;
	totalCount: number;
};

export type SessionWithMetrics = Session & {
	metrics: SessionMetric[];
	lastActivity: string | null;
};

// ============================================================================
// RELATIONS
// ============================================================================

export const sessionRelations = {
	sessions,
	configurations: sessionConfigurations,
	metrics: sessionMetrics
};
