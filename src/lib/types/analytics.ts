/**
 * Analytics Schema Layer
 * Database schemas and types for analytics and reporting entities
 */

import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import type { PreferenceScores } from '$lib/types';

// ============================================================================
// ANALYTICS CACHE SCHEMA
// ============================================================================

export const analyticsCache = sqliteTable('analytics_cache', {
	id: text('id').primaryKey(),
	sessionId: text('session_id').notNull(),
	cacheKey: text('cache_key').notNull(), // 'summary', 'generation_breakdown', etc.
	data: text('data', { mode: 'json' }).notNull(),
	createdAt: text('created_at')
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`),
	expiresAt: text('expires_at') // When cache should be invalidated
});

// ============================================================================
// ANALYTICS INSIGHTS SCHEMA
// ============================================================================

export const analyticsInsights = sqliteTable('analytics_insights', {
	id: text('id').primaryKey(),
	sessionId: text('session_id').notNull(),
	insightType: text('insight_type').notNull(), // 'engagement', 'technology', 'workforce', etc.
	title: text('title').notNull(),
	content: text('content').notNull(),
	confidence: real('confidence').notNull(), // 0.0 to 1.0
	recommendation: text('recommendation').notNull(),
	metadata: text('metadata', { mode: 'json' }).$type<Record<string, any>>(),
	createdAt: text('created_at')
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`)
});

// ============================================================================
// ANALYTICS METRICS SCHEMA
// ============================================================================

export const analyticsMetrics = sqliteTable('analytics_metrics', {
	id: text('id').primaryKey(),
	sessionId: text('session_id').notNull(),
	metricType: text('metric_type').notNull(), // 'completion_rate', 'average_score', etc.
	category: text('category'), // 'collaboration', 'formality', 'tech', 'wellness'
	value: real('value').notNull(),
	metadata: text('metadata', { mode: 'json' }).$type<Record<string, any>>(),
	timestamp: text('timestamp')
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`)
});

// ============================================================================
// GENERATION ANALYTICS SCHEMA
// ============================================================================

export const generationAnalytics = sqliteTable('generation_analytics', {
	id: text('id').primaryKey(),
	sessionId: text('session_id').notNull(),
	generation: text('generation').notNull(), // 'Baby Boomers', 'Gen X', etc.
	participantCount: integer('participant_count').notNull(),
	completionRate: real('completion_rate').notNull(),
	averageScores: text('average_scores', { mode: 'json' }).$type<PreferenceScores>().notNull(),
	insights: text('insights', { mode: 'json' }).$type<string[]>().default([]),
	createdAt: text('created_at')
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`),
	updatedAt: text('updated_at')
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`)
		.$onUpdate(() => sql`CURRENT_TIMESTAMP`)
});

// ============================================================================
// ANALYTICS REPORTS SCHEMA
// ============================================================================

export const analyticsReports = sqliteTable('analytics_reports', {
	id: text('id').primaryKey(),
	sessionId: text('session_id').notNull(),
	reportType: text('report_type').notNull(), // 'summary', 'detailed', 'comparison'
	title: text('title').notNull(),
	data: text('data', { mode: 'json' }).notNull(),
	generatedAt: text('generated_at')
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`),
	expiresAt: text('expires_at')
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type AnalyticsCache = typeof analyticsCache.$inferSelect;
export type NewAnalyticsCache = typeof analyticsCache.$inferInsert;
export type AnalyticsInsight = typeof analyticsInsights.$inferSelect;
export type NewAnalyticsInsight = typeof analyticsInsights.$inferInsert;
export type AnalyticsMetric = typeof analyticsMetrics.$inferSelect;
export type NewAnalyticsMetric = typeof analyticsMetrics.$inferInsert;
export type GenerationAnalytic = typeof generationAnalytics.$inferSelect;
export type NewGenerationAnalytic = typeof generationAnalytics.$inferInsert;
export type AnalyticsReport = typeof analyticsReports.$inferSelect;
export type NewAnalyticsReport = typeof analyticsReports.$inferInsert;

// ============================================================================
// EXTENDED TYPES
// ============================================================================

export type AnalyticsDataWithInsights = {
	cache: AnalyticsCache[];
	insights: AnalyticsInsight[];
	metrics: AnalyticsMetric[];
	generationAnalytics: GenerationAnalytic[];
	reports: AnalyticsReport[];
};

// ============================================================================
// RELATIONS
// ============================================================================

export const analyticsRelations = {
	cache: analyticsCache,
	insights: analyticsInsights,
	metrics: analyticsMetrics,
	generationAnalytics,
	reports: analyticsReports
};
