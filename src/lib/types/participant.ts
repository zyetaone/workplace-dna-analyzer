/**
 * Participant Schema Layer
 * Database schemas and types for participant-related entities
 */

import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import type { PreferenceScores } from '$lib/types';

// ============================================================================
// PARTICIPANTS SCHEMA
// ============================================================================

export const participants = sqliteTable('participants', {
	id: text('id').primaryKey(),
	sessionId: text('session_id').notNull(),
	cookieId: text('cookie_id').unique(), // Cookie-based tracking for anonymous participants
	name: text('name'), // Name is optional until they join properly
	generation: text('generation'), // 'Baby Boomers', 'Gen X', 'Millennials', 'Gen Z'
	email: text('email'),
	department: text('department'),
	responses: text('responses', { mode: 'json' }).$type<Record<string, string>>().default({}), // questionId -> answerId
	preferenceScores: text('preference_scores', { mode: 'json' }).$type<PreferenceScores>(),
	completed: integer('completed', { mode: 'boolean' }).notNull().default(false),
	joinedAt: text('joined_at')
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`),
	completedAt: text('completed_at'),
	lastActivity: text('last_activity')
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`)
});

// ============================================================================
// PARTICIPANT ACTIVITIES SCHEMA
// ============================================================================

export const participantActivities = sqliteTable('participant_activities', {
	id: text('id').primaryKey(),
	participantId: text('participant_id')
		.notNull()
		.references(() => participants.id),
	activityType: text('activity_type').notNull(), // 'join', 'answer', 'complete', 'leave'
	questionId: text('question_id'), // For answer activities
	answerId: text('answer_id'), // For answer activities
	metadata: text('metadata', { mode: 'json' }).$type<Record<string, any>>(), // Additional activity data
	timestamp: text('timestamp')
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`)
});

// ============================================================================
// PARTICIPANT PREFERENCES SCHEMA
// ============================================================================

export const participantPreferences = sqliteTable('participant_preferences', {
	id: text('id').primaryKey(),
	participantId: text('participant_id')
		.notNull()
		.references(() => participants.id),
	preferenceKey: text('preference_key').notNull(),
	preferenceValue: text('preference_value').notNull(),
	confidence: integer('confidence'), // 0-100
	createdAt: text('created_at')
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`),
	updatedAt: text('updated_at')
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`)
		.$onUpdate(() => sql`CURRENT_TIMESTAMP`)
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type Participant = typeof participants.$inferSelect;
export type NewParticipant = typeof participants.$inferInsert;
export type ParticipantActivity = typeof participantActivities.$inferSelect;
export type NewParticipantActivity = typeof participantActivities.$inferInsert;
export type ParticipantPreference = typeof participantPreferences.$inferSelect;
export type NewParticipantPreference = typeof participantPreferences.$inferInsert;

// ============================================================================
// EXTENDED TYPES
// ============================================================================

export type ParticipantWithActivities = Participant & {
	activities: ParticipantActivity[];
	lastActivity: string;
};

export type ParticipantWithPreferences = Participant & {
	preferences: ParticipantPreference[];
};

// ============================================================================
// RELATIONS
// ============================================================================

export const participantRelations = {
	participants,
	activities: participantActivities,
	preferences: participantPreferences
};
