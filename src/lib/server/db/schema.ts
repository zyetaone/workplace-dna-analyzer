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

// Users table for authentication
export const users = sqliteTable('users', {
	id: text('id').primaryKey().$defaultFn(() => generateId()),
	username: text('username').notNull().unique(),
	passwordHash: text('password_hash').notNull(),
	role: text('role', { enum: ['presenter', 'admin'] }).notNull().default('presenter'),
	createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
	lastLoginAt: text('last_login_at')
});

// User sessions table for authentication
export const userSessions = sqliteTable('user_sessions', {
	id: text('id').primaryKey().$defaultFn(() => generateId()),
	userId: text('user_id').notNull().references(() => users.id),
	sessionId: text('session_id').notNull().unique(),
	createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
	expiresAt: text('expires_at').notNull(),
	userAgent: text('user_agent'),
	ipAddress: text('ip_address')
});

// Quiz sessions table
export const sessions = sqliteTable('sessions', {
id: text('id').primaryKey().$defaultFn(() => generateId()),
	code: text('code').notNull().unique(),
	name: text('name').notNull(),
	presenterId: text('presenter_id').notNull(),
	slug: text('slug').notNull().unique(), // Now required and unique
	isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
	createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
	endedAt: text('ended_at')
});

// Participants table
export const participants = sqliteTable('participants', {
id: text('id').primaryKey().$defaultFn(() => generateId()),
	sessionId: text('session_id').notNull().references(() => sessions.id),
	cookieId: text('cookie_id').unique(), // Cookie-based tracking for anonymous participants
	name: text('name'), // Name is optional until they join properly
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
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UserSession = typeof userSessions.$inferSelect;
export type NewUserSession = typeof userSessions.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

// Participant types
export type Participant = typeof participants.$inferSelect;
export type NewParticipant = typeof participants.$inferInsert;

// Preference scores type
export interface PreferenceScores {
	collaboration: number;
	formality: number;
	tech: number;
	wellness: number;
}

// Utility functions
export { generateSlug };

