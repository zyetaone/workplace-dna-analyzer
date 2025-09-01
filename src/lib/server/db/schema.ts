import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Use simplified ID generation utility
import { generateId } from '../../utils/id';

// Quiz sessions table - simplified without auth
export const sessions = sqliteTable('sessions', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => generateId()),
	code: text('code').notNull().unique(), // 6-character session code
	name: text('name').notNull(), // Session name/title
	isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
	createdAt: text('created_at')
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`),
	endedAt: text('ended_at') // When session was manually ended
});

// Participants table - cookie-based tracking
export const participants = sqliteTable('participants', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => generateId()),
	sessionId: text('session_id')
		.notNull()
		.references(() => sessions.id),
	cookieId: text('cookie_id').unique(), // Cookie-based tracking for anonymous participants
	name: text('name'), // Name is optional until they join properly
	generation: text('generation'), // Baby Boomer, Gen X, Millennial, Gen Z
	responses: text('responses', { mode: 'json' }).$type<Record<string, string>>().default({}),
	preferenceScores: text('preference_scores', { mode: 'json' }).$type<{
		collaboration: number;
		formality: number;
		tech: number;
		wellness: number;
	}>(),
	completed: integer('completed', { mode: 'boolean' }).notNull().default(false),
	joinedAt: text('joined_at')
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`),
	completedAt: text('completed_at')
});

// PHASE 2: AI content tables (for embeddings / RAG) - commented for Phase 1
// export const aiDocuments = sqliteTable('ai_documents', {
// 	id: text('id')
// 		.primaryKey()
// 		.$defaultFn(() => generateId()),
// 	sessionId: text('session_id').references(() => sessions.id, { onDelete: 'cascade' }),
// 	filename: text('filename'),
// 	mimeType: text('mime_type'),
// 	fileSize: integer('file_size'),
// 	content: text('content'),
// 	contentType: text('content_type'),
// 	embedding: text('embedding', { mode: 'json' }).$type<number[]>(),
// 	embeddingModel: text('embedding_model').default('text-embedding-3-small'),
// 	metadata: text('metadata', { mode: 'json' }).$type<Record<string, unknown>>(),
// 	uploadedAt: text('uploaded_at')
// 		.notNull()
// 		.default(sql`CURRENT_TIMESTAMP`)
// });

// export const aiKnowledge = sqliteTable('ai_knowledge', {
// 	id: text('id')
// 		.primaryKey()
// 		.$defaultFn(() => generateId()),
// 	category: text('category'),
// 	subcategory: text('subcategory'),
// 	title: text('title'),
// 	content: text('content'),
// 	summary: text('summary'),
// 	embedding: text('embedding', { mode: 'json' }).$type<number[]>(),
// 	embeddingModel: text('embedding_model').default('text-embedding-3-small'),
// 	source: text('source'),
// 	sourceUrl: text('source_url'),
// 	createdAt: text('created_at')
// 		.notNull()
// 		.default(sql`CURRENT_TIMESTAMP`),
// 	updatedAt: text('updated_at')
// 		.notNull()
// 		.default(sql`CURRENT_TIMESTAMP`)
// });

// export type AiDocument = typeof aiDocuments.$inferSelect;
// export type AiKnowledge = typeof aiKnowledge.$inferSelect;

// PHASE 1 SIMPLIFIED: Activities table - basic activity definitions
// For MVP, we mainly need workplace-quiz. This table allows future expansion.
export const activities = sqliteTable('activities', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => generateId()),
	slug: text('slug').notNull().unique(), // 'workplace-quiz' for Phase 1
	name: text('name').notNull(), // 'Workplace Preference Quiz'
	type: text('type').notNull(), // 'quiz'
	config: text('config', { mode: 'json' }).$type<Record<string, any>>().default({}), // Simplified config
	isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
	createdAt: text('created_at')
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`)
});

// PHASE 2: Session Activities - removed for Phase 1 simplification
// In Phase 1, all sessions use the default workplace-quiz activity
// Uncomment when multiple activity types are needed

// export const sessionActivities = sqliteTable('session_activities', {
// 	id: text('id').primaryKey().$defaultFn(() => generateId()),
// 	sessionId: text('session_id').notNull().references(() => sessions.id),
// 	activityId: text('activity_id').notNull().references(() => activities.id),
// 	isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
// 	order: integer('order').notNull().default(0),
// 	createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`)
// });

// PHASE 2: Activity progression features - removed for Phase 1
// These tables add unnecessary complexity for MVP
// Will add back when auto-progression between activities is needed

// PHASE 1 SIMPLIFIED: Participant Progress - tracks activity completion
// Simplified from participantActivities - no complex foreign keys
export const participantProgress = sqliteTable('participant_progress', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => generateId()),
	participantId: text('participant_id')
		.notNull()
		.references(() => participants.id, { onDelete: 'cascade' }),
	activitySlug: text('activity_slug').notNull(), // Simple slug reference instead of FK
	responses: text('responses', { mode: 'json' }).$type<Record<string, any>>().default({}),
	scores: text('scores', { mode: 'json' }).$type<Record<string, number>>(),
	completed: integer('completed', { mode: 'boolean' }).notNull().default(false),
	completedAt: text('completed_at'),
	createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`)
});

// PHASE 2: Activity Templates - removed for Phase 1
// Templates add unnecessary complexity when we only have 1 activity type
// Will add back when we have 5+ different activity types

// export const activityTemplates = sqliteTable('activity_templates', {
// 	id: text('id').primaryKey().$defaultFn(() => generateId()),
// 	slug: text('slug').notNull().unique(),
// 	name: text('name').notNull(),
// 	description: text('description').notNull(),
// 	activities: text('activities', { mode: 'json' }).$type<any[]>().notNull(),
// 	isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
// 	createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`)
// });

// PHASE 2: Advanced Analytics - commented for Phase 1 to reduce complexity
// Uncomment these tables when scaling beyond 1000 users or when detailed analytics are needed

// export const analyticsEvents = sqliteTable('analytics_events', {
// 	id: text('id')
// 		.primaryKey()
// 		.$defaultFn(() => generateId()),
// 	sessionId: text('session_id')
// 		.notNull()
// 		.references(() => sessions.id, { onDelete: 'cascade' }),
// 	participantId: text('participant_id')
// 		.references(() => participants.id, { onDelete: 'cascade' }),
// 	activityId: text('activity_id')
// 		.references(() => activities.id, { onDelete: 'cascade' }),
// 	eventType: text('event_type').notNull(),
// 	eventData: text('event_data', { mode: 'json' }).$type<Record<string, any>>(),
// 	timestamp: text('timestamp')
// 		.notNull()
// 		.default(sql`CURRENT_TIMESTAMP`),
// 	userAgent: text('user_agent'),
// 	ipAddress: text('ip_address')
// });

// export const activityMetrics = sqliteTable('activity_metrics', {
// 	id: text('id')
// 		.primaryKey()
// 		.$defaultFn(() => generateId()),
// 	activityId: text('activity_id')
// 		.notNull()
// 		.references(() => activities.id, { onDelete: 'cascade' }),
// 	sessionId: text('session_id')
// 		.notNull()
// 		.references(() => sessions.id, { onDelete: 'cascade' }),
// 	metricType: text('metric_type').notNull(),
// 	metricValue: integer('metric_value').notNull(),
// 	calculatedAt: text('calculated_at')
// 		.notNull()
// 		.default(sql`CURRENT_TIMESTAMP`),
// 	timeRange: text('time_range'),
// 	metadata: text('metadata', { mode: 'json' }).$type<Record<string, any>>()
// });

// export const sessionAnalyticsSnapshots = sqliteTable('session_analytics_snapshots', {
// 	id: text('id')
// 		.primaryKey()
// 		.$defaultFn(() => generateId()),
// 	sessionId: text('session_id')
// 		.notNull()
// 		.references(() => sessions.id, { onDelete: 'cascade' }),
// 	snapshotType: text('snapshot_type').notNull(),
// 	snapshotData: text('snapshot_data', { mode: 'json' }).$type<Record<string, any>>().notNull(),
// 	createdAt: text('created_at')
// 		.notNull()
// 		.default(sql`CURRENT_TIMESTAMP`)
// });

// export const participantActivityProgress = sqliteTable('participant_activity_progress', {
// 	id: text('id')
// 		.primaryKey()
// 		.$defaultFn(() => generateId()),
// 	participantActivityId: text('participant_activity_id')
// 		.notNull()
// 		.references(() => participantActivities.id, { onDelete: 'cascade' }),
// 	questionId: text('question_id').notNull(),
// 	startedAt: text('started_at'),
// 	completedAt: text('completed_at'),
// 	timeSpentSeconds: integer('time_spent_seconds'),
// 	attempts: integer('attempts').notNull().default(1),
// 	responseQuality: integer('response_quality'),
// 	engagementScore: integer('engagement_score')
// });

// export const activityTemplateAnalytics = sqliteTable('activity_template_analytics', {
// 	id: text('id')
// 		.primaryKey()
// 		.$defaultFn(() => generateId()),
// 	templateId: text('template_id')
// 		.notNull()
// 		.references(() => activityTemplates.id, { onDelete: 'cascade' }),
// 	sessionId: text('session_id')
// 		.notNull()
// 		.references(() => sessions.id, { onDelete: 'cascade' }),
// 	usageCount: integer('usage_count').notNull().default(1),
// 	avgCompletionRate: integer('avg_completion_rate'),
// 	avgEngagementScore: integer('avg_engagement_score'),
// 	lastUsed: text('last_used')
// 		.notNull()
// 		.default(sql`CURRENT_TIMESTAMP`)
// });

// PHASE 1 SIMPLIFIED: Type exports for core tables only
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type Participant = typeof participants.$inferSelect;
export type NewParticipant = typeof participants.$inferInsert;
export type Activity = typeof activities.$inferSelect;
export type NewActivity = typeof activities.$inferInsert;
export type ParticipantProgress = typeof participantProgress.$inferSelect;
export type NewParticipantProgress = typeof participantProgress.$inferInsert;

// PHASE 2: Additional types - commented for simplicity
// export type SessionActivity = typeof sessionActivities.$inferSelect;
// export type NewSessionActivity = typeof sessionActivities.$inferInsert;
// export type ActivityTemplate = typeof activityTemplates.$inferSelect;
// export type NewActivityTemplate = typeof activityTemplates.$inferInsert;

// PHASE 2: Analytics types - commented for Phase 1
// export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
// export type NewAnalyticsEvent = typeof analyticsEvents.$inferInsert;
// export type ActivityMetric = typeof activityMetrics.$inferSelect;
// export type NewActivityMetric = typeof activityMetrics.$inferInsert;
// export type SessionAnalyticsSnapshot = typeof sessionAnalyticsSnapshots.$inferSelect;
// export type NewSessionAnalyticsSnapshot = typeof sessionAnalyticsSnapshots.$inferInsert;
// export type ParticipantActivityProgress = typeof participantActivityProgress.$inferSelect;
// export type NewParticipantActivityProgress = typeof participantActivityProgress.$inferInsert;
// export type ActivityTemplateAnalytic = typeof activityTemplateAnalytics.$inferSelect;
// export type NewActivityTemplateAnalytic = typeof activityTemplateAnalytics.$inferInsert;

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
