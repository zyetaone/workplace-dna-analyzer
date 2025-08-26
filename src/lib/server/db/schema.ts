import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { createId } from '@paralleldrive/cuid2';
import { sql } from 'drizzle-orm';

// Sessions table
export const sessions = sqliteTable('sessions', {
	id: text('id').primaryKey().$defaultFn(() => createId()),
	code: text('code').notNull().unique(),
	name: text('name').notNull(),
	isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
	createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
	endedAt: text('ended_at')
});

// Attendees table  
export const attendees = sqliteTable('attendees', {
	id: text('id').primaryKey().$defaultFn(() => createId()),
	sessionId: text('session_id').notNull().references(() => sessions.id),
	name: text('name').notNull(),
	generation: text('generation'),
	responses: text('responses', { mode: 'json' }).$type<Record<number, any>>().default({}),
	preferenceScores: text('preference_scores', { mode: 'json' }).$type<{
		collaboration: number;
		formality: number;
		technology: number;
		wellness: number;
	}>(),
	completed: integer('completed', { mode: 'boolean' }).notNull().default(false),
	joinedAt: text('joined_at').notNull().default(sql`CURRENT_TIMESTAMP`),
	completedAt: text('completed_at')
});
