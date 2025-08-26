import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Use native crypto for ID generation
const generateId = () => crypto.randomUUID();

// Generate URL-friendly slug from name
const generateSlug = (name: string) => {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/(^-|-$)/g, '')
		.substring(0, 50); // Limit length
};

// Sessions table
export const sessions = sqliteTable('sessions', {
id: text('id').primaryKey().$defaultFn(() => generateId()),
	code: text('code').notNull().unique(),
	name: text('name').notNull(),
	slug: text('slug').notNull().unique(), // Now required and unique
	isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
	createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
	endedAt: text('ended_at')
});

// Attendees table  
export const attendees = sqliteTable('attendees', {
id: text('id').primaryKey().$defaultFn(() => generateId()),
	sessionId: text('session_id').notNull().references(() => sessions.id),
	name: text('name').notNull(),
	generation: text('generation'),
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
export type Attendee = typeof attendees.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type NewAttendee = typeof attendees.$inferInsert;

// Preference scores type
export interface PreferenceScores {
	collaboration: number;
	formality: number;
	tech: number;
	wellness: number;
}

// Utility functions
export { generateSlug };
