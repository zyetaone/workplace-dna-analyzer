/**
 * @fileoverview Vector Database Schema with Drizzle ORM for LibSQL/Turso
 *
 * @description
 * This schema implements a comprehensive vector database architecture that enables:
 * - Semantic search using OpenAI embeddings (1536 dimensions)
 * - Document storage with automatic chunking and vector indexing
 * - Knowledge base management for RAG (Retrieval Augmented Generation)
 * - AI conversation history with context tracking
 * - Search query caching for performance optimization
 *
 * @architecture
 * The schema follows a layered architecture:
 * 1. Core Tables: sessions, participants (enhanced with embeddings)
 * 2. Vector Tables: documents, knowledgeBase (dedicated vector storage)
 * 3. Support Tables: searchQueries, aiConversations (caching & history)
 *
 * @vectorSupport
 * LibSQL/Turso provides native vector support with:
 * - VECTOR(dimensions) data type
 * - vector_similarity() and vector_distance() functions
 * - Efficient vector indexing for similarity search
 * - Compatible with OpenAI's text-embedding-ada-002 model
 *
 * @usage
 * ```typescript
 * import { sessions, documents, knowledgeBase } from './vector-schema';
 * import { db } from '../db';
 *
 * // Store embedding
 * await db.update(sessions).set({
 *   embedding: openaiEmbedding,
 *   embeddingModel: 'text-embedding-ada-002'
 * });
 *
 * // Vector similarity search
 * const similar = await db.execute(sql`
 *   SELECT *, vector_similarity(embedding, ${queryEmbedding}) as score
 *   FROM documents
 *   WHERE score > 0.7
 *   ORDER BY score DESC
 * `);
 * ```
 *
 * @author Zyeta Development Team
 * @version 2.0.0
 * @since 2024-01-01
 */

import { sqliteTable, text, integer, real, index, primaryKey } from 'drizzle-orm/sqlite-core';
import { sql, relations } from 'drizzle-orm';
import { generateId } from '../../utils/id';
import type { PreferenceScores } from '../../types';

// ============================================================================
// CORE TABLES (Existing Enhanced)
// ============================================================================

/**
 * Sessions table - Core workspace assessment sessions
 *
 * @description
 * Stores session metadata with AI-powered enhancements. Each session can have
 * an embedding vector that represents its semantic meaning, enabling similarity
 * search and clustering of related sessions.
 *
 * @vectorFields
 * - `embedding`: 1536-dimensional vector from OpenAI text-embedding-ada-002
 * - `embeddingModel`: The model used to generate the embedding
 * - `aiInsights`: JSON object containing AI-generated insights
 *
 * @indexes
 * - `sessions_code_idx`: Fast lookup by session code
 * - `sessions_active_idx`: Filter active sessions efficiently
 *
 * @relations
 * - Has many: participants, documents, searchQueries, aiConversations
 *
 * @example
 * ```typescript
 * const session = await db.insert(sessions).values({
 *   code: 'ABC123',
 *   name: 'Q1 2024 Workplace Survey',
 *   embedding: await generateEmbedding(description)
 * });
 * ```
 */
export const sessions = sqliteTable(
	'sessions',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => generateId()),
		code: text('code').notNull().unique(),
		name: text('name').notNull(),
		description: text('description'),
		isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),

		// Vector embedding for session context
		embedding: text('embedding', { mode: 'json' }).$type<number[]>(),
		embeddingModel: text('embedding_model').default('text-embedding-ada-002'),

		// Metadata for AI insights
		aiInsights: text('ai_insights', { mode: 'json' }).$type<{
			summary?: string;
			keyThemes?: string[];
			recommendations?: string[];
			generatedAt?: string;
		}>(),

		createdAt: text('created_at')
			.notNull()
			.default(sql`CURRENT_TIMESTAMP`),
		endedAt: text('ended_at'),
		updatedAt: text('updated_at')
			.notNull()
			.default(sql`CURRENT_TIMESTAMP`)
	},
	(table) => ({
		codeIdx: index('sessions_code_idx').on(table.code),
		activeIdx: index('sessions_active_idx').on(table.isActive)
	})
);

/**
 * Participants table - Enhanced with response embeddings
 */
export const participants = sqliteTable(
	'participants',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => generateId()),
		sessionId: text('session_id')
			.notNull()
			.references(() => sessions.id, { onDelete: 'cascade' }),
		cookieId: text('cookie_id').unique(),
		name: text('name'),
		generation: text('generation'),

		// Original responses
		responses: text('responses', { mode: 'json' }).$type<Record<string, string>>().default({}),
		preferenceScores: text('preference_scores', { mode: 'json' }).$type<PreferenceScores>(),

		// Vector embedding of combined responses
		responseEmbedding: text('response_embedding', { mode: 'json' }).$type<number[]>(),

		completed: integer('completed', { mode: 'boolean' }).notNull().default(false),
		joinedAt: text('joined_at')
			.notNull()
			.default(sql`CURRENT_TIMESTAMP`),
		completedAt: text('completed_at')
	},
	(table) => ({
		sessionIdx: index('participants_session_idx').on(table.sessionId),
		cookieIdx: index('participants_cookie_idx').on(table.cookieId)
	})
);

// ============================================================================
// VECTOR STORAGE TABLES
// ============================================================================

/**
 * Document storage with embeddings
 * Stores uploaded markdown, JSON, and text files with vector search
 */
export const documents = sqliteTable(
	'documents',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => generateId()),
		sessionId: text('session_id').references(() => sessions.id, { onDelete: 'cascade' }),

		// Document metadata
		filename: text('filename').notNull(),
		mimeType: text('mime_type').notNull(),
		fileSize: integer('file_size').notNull(),

		// Content storage
		content: text('content').notNull(),
		contentType: text('content_type', { enum: ['markdown', 'json', 'text', 'csv'] }).notNull(),

		// Vector embedding
		embedding: text('embedding', { mode: 'json' }).$type<number[]>(),
		embeddingModel: text('embedding_model').default('text-embedding-ada-002'),

		// Chunking metadata
		parentId: text('parent_id').references(() => documents.id, { onDelete: 'cascade' }),
		chunkIndex: integer('chunk_index'),
		totalChunks: integer('total_chunks'),

		// Additional metadata
		metadata: text('metadata', { mode: 'json' }).$type<{
			title?: string;
			summary?: string;
			tags?: string[];
			language?: string;
			wordCount?: number;
			extractedEntities?: string[];
		}>(),

		uploadedBy: text('uploaded_by'),
		uploadedAt: text('uploaded_at')
			.notNull()
			.default(sql`CURRENT_TIMESTAMP`),
		processedAt: text('processed_at')
	},
	(table) => ({
		sessionIdx: index('documents_session_idx').on(table.sessionId),
		parentIdx: index('documents_parent_idx').on(table.parentId),
		filenameIdx: index('documents_filename_idx').on(table.filename)
	})
);

/**
 * Knowledge base for RAG (Retrieval Augmented Generation)
 * Pre-loaded knowledge about workplace preferences and generations
 */
export const knowledgeBase = sqliteTable(
	'knowledge_base',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => generateId()),

		// Categorization
		category: text('category', {
			enum: ['workplace', 'generation', 'preferences', 'trends', 'research']
		}).notNull(),
		subcategory: text('subcategory'),

		// Content
		title: text('title').notNull(),
		content: text('content').notNull(),
		summary: text('summary'),

		// Vector embedding
		embedding: text('embedding', { mode: 'json' }).$type<number[]>(),
		embeddingModel: text('embedding_model').default('text-embedding-ada-002'),

		// Metadata
		source: text('source'),
		sourceUrl: text('source_url'),
		author: text('author'),
		publishedDate: text('published_date'),

		// Relevance and quality
		relevanceScore: real('relevance_score').default(1.0),
		qualityScore: real('quality_score').default(1.0),
		usageCount: integer('usage_count').default(0),

		// Timestamps
		createdAt: text('created_at')
			.notNull()
			.default(sql`CURRENT_TIMESTAMP`),
		updatedAt: text('updated_at')
			.notNull()
			.default(sql`CURRENT_TIMESTAMP`)
	},
	(table) => ({
		categoryIdx: index('knowledge_category_idx').on(table.category),
		titleIdx: index('knowledge_title_idx').on(table.title)
	})
);

/**
 * Semantic search queries and results cache
 * Stores search history and caches results for performance
 */
export const searchQueries = sqliteTable(
	'search_queries',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => generateId()),
		sessionId: text('session_id').references(() => sessions.id, { onDelete: 'cascade' }),

		// Query details
		query: text('query').notNull(),
		queryType: text('query_type', {
			enum: ['semantic', 'keyword', 'hybrid', 'rag']
		}).notNull(),

		// Query embedding
		queryEmbedding: text('query_embedding', { mode: 'json' }).$type<number[]>(),

		// Results cache
		results: text('results', { mode: 'json' }).$type<{
			documents?: string[];
			sessions?: string[];
			insights?: string[];
			relevanceScores?: Record<string, number>;
		}>(),
		resultCount: integer('result_count').default(0),

		// Performance metrics
		executionTime: real('execution_time'), // in milliseconds
		cached: integer('cached', { mode: 'boolean' }).default(false),

		// User context
		userId: text('user_id'),
		userAgent: text('user_agent'),

		createdAt: text('created_at')
			.notNull()
			.default(sql`CURRENT_TIMESTAMP`)
	},
	(table) => ({
		sessionIdx: index('search_session_idx').on(table.sessionId),
		queryIdx: index('search_query_idx').on(table.query)
	})
);

/**
 * AI conversation history for contextual responses
 */
export const aiConversations = sqliteTable(
	'ai_conversations',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => generateId()),
		sessionId: text('session_id')
			.notNull()
			.references(() => sessions.id, { onDelete: 'cascade' }),

		// Conversation thread
		threadId: text('thread_id')
			.notNull()
			.$defaultFn(() => generateId()),
		parentId: text('parent_id').references(() => aiConversations.id),

		// Message content
		role: text('role', { enum: ['user', 'assistant', 'system'] }).notNull(),
		content: text('content').notNull(),

		// Context and embeddings
		contextUsed: text('context_used', { mode: 'json' }).$type<string[]>(),
		embedding: text('embedding', { mode: 'json' }).$type<number[]>(),

		// Model details
		model: text('model').default('gpt-4'),
		temperature: real('temperature'),
		maxTokens: integer('max_tokens'),

		// Response metadata
		completionTokens: integer('completion_tokens'),
		promptTokens: integer('prompt_tokens'),
		totalCost: real('total_cost'),

		createdAt: text('created_at')
			.notNull()
			.default(sql`CURRENT_TIMESTAMP`)
	},
	(table) => ({
		sessionIdx: index('ai_session_idx').on(table.sessionId),
		threadIdx: index('ai_thread_idx').on(table.threadId)
	})
);

// ============================================================================
// RELATIONS
// ============================================================================

export const sessionsRelations = relations(sessions, ({ many }) => ({
	participants: many(participants),
	documents: many(documents),
	searchQueries: many(searchQueries),
	aiConversations: many(aiConversations)
}));

export const participantsRelations = relations(participants, ({ one }) => ({
	session: one(sessions, {
		fields: [participants.sessionId],
		references: [sessions.id]
	})
}));

export const documentsRelations = relations(documents, ({ one, many }) => ({
	session: one(sessions, {
		fields: [documents.sessionId],
		references: [sessions.id]
	}),
	parent: one(documents, {
		fields: [documents.parentId],
		references: [documents.id]
	}),
	chunks: many(documents)
}));

export const searchQueriesRelations = relations(searchQueries, ({ one }) => ({
	session: one(sessions, {
		fields: [searchQueries.sessionId],
		references: [sessions.id]
	})
}));

export const aiConversationsRelations = relations(aiConversations, ({ one, many }) => ({
	session: one(sessions, {
		fields: [aiConversations.sessionId],
		references: [sessions.id]
	}),
	parent: one(aiConversations, {
		fields: [aiConversations.parentId],
		references: [aiConversations.id]
	}),
	replies: many(aiConversations)
}));

// ============================================================================
// TYPE EXPORTS
// ============================================================================

// Base types
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type Participant = typeof participants.$inferSelect;
export type NewParticipant = typeof participants.$inferInsert;

// Vector types
export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
export type KnowledgeItem = typeof knowledgeBase.$inferSelect;
export type NewKnowledgeItem = typeof knowledgeBase.$inferInsert;
export type SearchQuery = typeof searchQueries.$inferSelect;
export type NewSearchQuery = typeof searchQueries.$inferInsert;
export type AIConversation = typeof aiConversations.$inferSelect;
export type NewAIConversation = typeof aiConversations.$inferInsert;

// Extended types
export type SessionWithRelations = Session & {
	participants: Participant[];
	documents: Document[];
	aiConversations: AIConversation[];
};

export type DocumentWithChunks = Document & {
	chunks?: Document[];
};

export type SearchResult = {
	id: string;
	type: 'session' | 'document' | 'knowledge';
	content: string;
	relevanceScore: number;
	metadata?: Record<string, any>;
};
