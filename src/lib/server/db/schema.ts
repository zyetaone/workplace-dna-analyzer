import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Use simplified ID generation utility
import { generateId } from '../../utils/id';

// Quiz sessions table - simplified without auth
export const sessions = sqliteTable('sessions', {
	id: text('id').primaryKey().$defaultFn(() => generateId()),
	code: text('code').notNull().unique(), // 6-character session code
	name: text('name').notNull(), // Session name/title
	isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
	createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
	endedAt: text('ended_at') // When session was manually ended
});

// Participants table - cookie-based tracking
export const participants = sqliteTable('participants', {
	id: text('id').primaryKey().$defaultFn(() => generateId()),
	sessionId: text('session_id').notNull().references(() => sessions.id),
	cookieId: text('cookie_id').unique(), // Cookie-based tracking for anonymous participants
	name: text('name'), // Name is optional until they join properly
	generation: text('generation'), // Baby Boomer, Gen X, Millennial, Gen Z
	responses: text('responses', { mode: 'json' }).$type<Record<number, any>>().default({}),
	preferenceScores: text('preference_scores', { mode: 'json' }).$type<{
		collaboration: number;
		formality: number;
		tech: number;
		wellness: number;
	}>(),
	completed: integer('completed', { mode: 'boolean' }).notNull().default(false),
	joinedAt: text('joined_at').notNull().default(sql`CURRENT_TIMESTAMP`),
	completedAt: text('completed_at')
});

// Type exports for use in application
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type Participant = typeof participants.$inferSelect;
export type NewParticipant = typeof participants.$inferInsert;

// Extended session type with participant counts (used in admin dashboard)
export type SessionWithCounts = Session & {
	activeCount: number;
	completedCount: number;
};

// Preference scores type
export interface PreferenceScores {
	collaboration: number;
	formality: number;
	tech: number;
	wellness: number;
}