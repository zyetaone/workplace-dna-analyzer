/**
 * Repository Layer for Vector Database
 * Implements data access patterns with Drizzle ORM
 */

import { and, eq, sql, desc, asc, like, inArray, between, isNull, isNotNull } from 'drizzle-orm';
import { db } from '../db';
import {
	sessions,
	participants,
	documents,
	knowledgeBase,
	searchQueries,
	aiConversations,
	type Session,
	type Document,
	type KnowledgeItem,
	type SearchQuery,
	type AIConversation,
	type NewDocument,
	type NewKnowledgeItem,
	type NewSearchQuery,
	type NewAIConversation
} from '../db/vector-schema';
import {
	DocumentModel,
	EmbeddingModel,
	SearchQueryModel,
	KnowledgeModel
} from '../models/vector-models';
import { generateId } from '../../utils/id';

// ============================================================================
// BASE REPOSITORY INTERFACE
// ============================================================================

interface Repository<T, CreateDTO, UpdateDTO> {
	findById(id: string): Promise<T | null>;
	findAll(limit?: number): Promise<T[]>;
	create(data: CreateDTO): Promise<T>;
	update(id: string, data: UpdateDTO): Promise<T | null>;
	delete(id: string): Promise<boolean>;
}

// ============================================================================
// EMBEDDING REPOSITORY
// ============================================================================

export class EmbeddingRepository {
	/**
	 * Store embedding for a session
	 */
	async storeSessionEmbedding(sessionId: string, embedding: EmbeddingModel): Promise<Session> {
		const [updated] = await db
			.update(sessions)
			.set({
				embedding: embedding.vector,
				embeddingModel: embedding.model,
				updatedAt: new Date().toISOString()
			})
			.where(eq(sessions.id, sessionId))
			.returning();

		return updated;
	}

	/**
	 * Store embedding for participant responses
	 */
	async storeParticipantEmbedding(participantId: string, embedding: EmbeddingModel) {
		const [updated] = await db
			.update(participants)
			.set({
				responseEmbedding: embedding.vector
			})
			.where(eq(participants.id, participantId))
			.returning();

		return updated;
	}

	/**
	 * Find similar sessions using vector similarity
	 */
	async findSimilarSessions(
		embedding: number[],
		limit: number = 5,
		threshold: number = 0.7
	): Promise<Array<Session & { similarity: number }>> {
		// Using raw SQL for vector operations
		const query = sql`
      SELECT 
        s.*,
        (1 - (
          SELECT SUM((je1.value - je2.value) * (je1.value - je2.value))
          FROM json_each(s.embedding) je1
          JOIN json_each(${JSON.stringify(embedding)}) je2 
          ON je1.key = je2.key
        ) / (
          SELECT SQRT(SUM(je1.value * je1.value)) * SQRT(SUM(je2.value * je2.value))
          FROM json_each(s.embedding) je1, json_each(${JSON.stringify(embedding)}) je2
        )) as similarity
      FROM ${sessions} s
      WHERE s.embedding IS NOT NULL
      HAVING similarity > ${threshold}
      ORDER BY similarity DESC
      LIMIT ${limit}
    `;

		const results = await db.execute(query);
		return results.rows as Array<Session & { similarity: number }>;
	}

	/**
	 * Find similar documents
	 */
	async findSimilarDocuments(
		embedding: number[],
		sessionId?: string,
		limit: number = 10
	): Promise<Array<Document & { similarity: number }>> {
		let baseQuery = sql`
      SELECT 
        d.*,
        (1 - (
          SELECT SUM((je1.value - je2.value) * (je1.value - je2.value))
          FROM json_each(d.embedding) je1
          JOIN json_each(${JSON.stringify(embedding)}) je2 
          ON je1.key = je2.key
        ) / 2) as similarity
      FROM ${documents} d
      WHERE d.embedding IS NOT NULL
    `;

		if (sessionId) {
			baseQuery = sql`${baseQuery} AND d.session_id = ${sessionId}`;
		}

		const query = sql`
      ${baseQuery}
      ORDER BY similarity DESC
      LIMIT ${limit}
    `;

		const results = await db.execute(query);
		return results.rows as Array<Document & { similarity: number }>;
	}
}

// ============================================================================
// DOCUMENT REPOSITORY
// ============================================================================

export class DocumentRepository implements Repository<Document, NewDocument, Partial<NewDocument>> {
	async findById(id: string): Promise<Document | null> {
		const result = await db.query.documents.findFirst({
			where: eq(documents.id, id)
		});
		return result || null;
	}

	async findAll(limit: number = 100): Promise<Document[]> {
		return db.query.documents.findMany({
			limit,
			orderBy: desc(documents.uploadedAt)
		});
	}

	async create(data: NewDocument): Promise<Document> {
		const [created] = await db
			.insert(documents)
			.values({
				...data,
				id: data.id || generateId()
			})
			.returning();

		return created;
	}

	async update(id: string, data: Partial<NewDocument>): Promise<Document | null> {
		const [updated] = await db.update(documents).set(data).where(eq(documents.id, id)).returning();

		return updated || null;
	}

	async delete(id: string): Promise<boolean> {
		const result = await db.delete(documents).where(eq(documents.id, id)).returning();

		return result.length > 0;
	}

	/**
	 * Find documents by session
	 */
	async findBySession(sessionId: string): Promise<Document[]> {
		return db.query.documents.findMany({
			where: eq(documents.sessionId, sessionId),
			orderBy: desc(documents.uploadedAt)
		});
	}

	/**
	 * Find document chunks
	 */
	async findChunks(parentId: string): Promise<Document[]> {
		return db.query.documents.findMany({
			where: eq(documents.parentId, parentId),
			orderBy: asc(documents.chunkIndex)
		});
	}

	/**
	 * Store document with chunks
	 */
	async storeWithChunks(
		document: DocumentModel,
		embedding: EmbeddingModel,
		chunkEmbeddings?: EmbeddingModel[]
	): Promise<Document> {
		// Store main document
		const mainDoc = await this.create({
			id: generateId(),
			sessionId: document.sessionId,
			filename: document.filename,
			content: document.content,
			contentType: document.contentType,
			mimeType: `text/${document.contentType}`,
			fileSize: document.content.length,
			embedding: embedding.vector,
			embeddingModel: embedding.model,
			metadata: document.extractMetadata(),
			uploadedAt: new Date().toISOString()
		});

		// Store chunks if provided
		if (chunkEmbeddings && chunkEmbeddings.length > 0) {
			const chunks = document.chunk();

			for (let i = 0; i < chunks.length && i < chunkEmbeddings.length; i++) {
				await this.create({
					id: generateId(),
					sessionId: document.sessionId,
					filename: chunks[i].id,
					content: chunks[i].content,
					contentType: document.contentType,
					mimeType: `text/${document.contentType}`,
					fileSize: chunks[i].content.length,
					embedding: chunkEmbeddings[i].vector,
					embeddingModel: chunkEmbeddings[i].model,
					parentId: mainDoc.id,
					chunkIndex: chunks[i].index,
					totalChunks: chunks.length,
					uploadedAt: new Date().toISOString()
				});
			}
		}

		return mainDoc;
	}

	/**
	 * Search documents by content
	 */
	async searchByContent(query: string, sessionId?: string): Promise<Document[]> {
		const conditions = [like(documents.content, `%${query}%`)];

		if (sessionId) {
			conditions.push(eq(documents.sessionId, sessionId));
		}

		return db.query.documents.findMany({
			where: and(...conditions),
			limit: 20
		});
	}
}

// ============================================================================
// KNOWLEDGE BASE REPOSITORY
// ============================================================================

export class KnowledgeRepository
	implements Repository<KnowledgeItem, NewKnowledgeItem, Partial<NewKnowledgeItem>>
{
	async findById(id: string): Promise<KnowledgeItem | null> {
		const result = await db.query.knowledgeBase.findFirst({
			where: eq(knowledgeBase.id, id)
		});
		return result || null;
	}

	async findAll(limit: number = 100): Promise<KnowledgeItem[]> {
		return db.query.knowledgeBase.findMany({
			limit,
			orderBy: [desc(knowledgeBase.relevanceScore), desc(knowledgeBase.createdAt)]
		});
	}

	async create(data: NewKnowledgeItem): Promise<KnowledgeItem> {
		const [created] = await db
			.insert(knowledgeBase)
			.values({
				...data,
				id: data.id || generateId()
			})
			.returning();

		return created;
	}

	async update(id: string, data: Partial<NewKnowledgeItem>): Promise<KnowledgeItem | null> {
		const [updated] = await db
			.update(knowledgeBase)
			.set({
				...data,
				updatedAt: new Date().toISOString()
			})
			.where(eq(knowledgeBase.id, id))
			.returning();

		return updated || null;
	}

	async delete(id: string): Promise<boolean> {
		const result = await db.delete(knowledgeBase).where(eq(knowledgeBase.id, id)).returning();

		return result.length > 0;
	}

	/**
	 * Find by category
	 */
	async findByCategory(
		category: 'workplace' | 'generation' | 'preferences' | 'trends' | 'research'
	): Promise<KnowledgeItem[]> {
		return db.query.knowledgeBase.findMany({
			where: eq(knowledgeBase.category, category),
			orderBy: desc(knowledgeBase.relevanceScore)
		});
	}

	/**
	 * Search knowledge base
	 */
	async search(query: string): Promise<KnowledgeItem[]> {
		return db.query.knowledgeBase.findMany({
			where: or(
				like(knowledgeBase.title, `%${query}%`),
				like(knowledgeBase.content, `%${query}%`),
				like(knowledgeBase.summary, `%${query}%`)
			),
			orderBy: desc(knowledgeBase.relevanceScore),
			limit: 20
		});
	}

	/**
	 * Increment usage count
	 */
	async incrementUsage(id: string): Promise<void> {
		await db
			.update(knowledgeBase)
			.set({
				usageCount: sql`${knowledgeBase.usageCount} + 1`,
				updatedAt: new Date().toISOString()
			})
			.where(eq(knowledgeBase.id, id));
	}

	/**
	 * Get trending knowledge items
	 */
	async getTrending(limit: number = 10): Promise<KnowledgeItem[]> {
		return db.query.knowledgeBase.findMany({
			orderBy: desc(knowledgeBase.usageCount),
			limit
		});
	}
}

// ============================================================================
// SEARCH QUERY REPOSITORY
// ============================================================================

export class SearchRepository {
	/**
	 * Log a search query
	 */
	async logQuery(
		query: SearchQueryModel,
		results: any[],
		executionTime: number,
		embedding?: number[]
	): Promise<SearchQuery> {
		const [logged] = await db
			.insert(searchQueries)
			.values({
				id: generateId(),
				sessionId: query.filters?.sessionId,
				query: query.query,
				queryType: query.type,
				queryEmbedding: embedding,
				results: {
					resultCount: results.length,
					topResults: results.slice(0, 5).map((r) => r.id)
				},
				resultCount: results.length,
				executionTime,
				cached: false,
				createdAt: new Date().toISOString()
			})
			.returning();

		return logged;
	}

	/**
	 * Get cached results
	 */
	async getCachedResults(
		query: string,
		type: 'semantic' | 'keyword' | 'hybrid' | 'rag',
		maxAge: number = 3600000 // 1 hour
	): Promise<SearchQuery | null> {
		const cutoff = new Date(Date.now() - maxAge).toISOString();

		const cached = await db.query.searchQueries.findFirst({
			where: and(
				eq(searchQueries.query, query),
				eq(searchQueries.queryType, type),
				sql`${searchQueries.createdAt} > ${cutoff}`
			),
			orderBy: desc(searchQueries.createdAt)
		});

		return cached || null;
	}

	/**
	 * Get popular searches
	 */
	async getPopularSearches(
		sessionId?: string,
		limit: number = 10
	): Promise<Array<{ query: string; count: number }>> {
		const conditions = sessionId ? [eq(searchQueries.sessionId, sessionId)] : [];

		const result = await db.execute(sql`
      SELECT 
        query,
        COUNT(*) as count
      FROM ${searchQueries}
      ${conditions.length > 0 ? sql`WHERE ${and(...conditions)}` : sql``}
      GROUP BY query
      ORDER BY count DESC
      LIMIT ${limit}
    `);

		return result.rows as Array<{ query: string; count: number }>;
	}
}

// ============================================================================
// AI CONVERSATION REPOSITORY
// ============================================================================

export class ConversationRepository {
	/**
	 * Create a new conversation message
	 */
	async createMessage(data: NewAIConversation): Promise<AIConversation> {
		const [created] = await db
			.insert(aiConversations)
			.values({
				...data,
				id: data.id || generateId(),
				createdAt: new Date().toISOString()
			})
			.returning();

		return created;
	}

	/**
	 * Get conversation thread
	 */
	async getThread(threadId: string): Promise<AIConversation[]> {
		return db.query.aiConversations.findMany({
			where: eq(aiConversations.threadId, threadId),
			orderBy: asc(aiConversations.createdAt)
		});
	}

	/**
	 * Get session conversations
	 */
	async getSessionConversations(sessionId: string): Promise<AIConversation[]> {
		return db.query.aiConversations.findMany({
			where: eq(aiConversations.sessionId, sessionId),
			orderBy: desc(aiConversations.createdAt)
		});
	}

	/**
	 * Get conversation statistics
	 */
	async getStatistics(sessionId?: string): Promise<{
		totalMessages: number;
		totalTokens: number;
		totalCost: number;
		averageResponseTime: number;
	}> {
		const conditions = sessionId ? [eq(aiConversations.sessionId, sessionId)] : [];

		const stats = await db.execute(sql`
      SELECT 
        COUNT(*) as total_messages,
        SUM(COALESCE(completion_tokens, 0) + COALESCE(prompt_tokens, 0)) as total_tokens,
        SUM(COALESCE(total_cost, 0)) as total_cost,
        AVG(
          CASE 
            WHEN role = 'assistant' AND parent_id IS NOT NULL THEN
              julianday(created_at) - (
                SELECT julianday(created_at) 
                FROM ${aiConversations} parent 
                WHERE parent.id = ${aiConversations}.parent_id
              )
            ELSE NULL
          END
        ) * 86400 as avg_response_time
      FROM ${aiConversations}
      ${conditions.length > 0 ? sql`WHERE ${and(...conditions)}` : sql``}
    `);

		const result = stats.rows[0] as any;

		return {
			totalMessages: result.total_messages || 0,
			totalTokens: result.total_tokens || 0,
			totalCost: result.total_cost || 0,
			averageResponseTime: result.avg_response_time || 0
		};
	}
}

// ============================================================================
// UNIT OF WORK PATTERN
// ============================================================================

/**
 * Unit of Work for coordinating multiple repositories
 */
export class VectorDatabaseUnitOfWork {
	public readonly embeddings = new EmbeddingRepository();
	public readonly documents = new DocumentRepository();
	public readonly knowledge = new KnowledgeRepository();
	public readonly search = new SearchRepository();
	public readonly conversations = new ConversationRepository();

	/**
	 * Execute a transaction
	 */
	async transaction<T>(callback: (uow: VectorDatabaseUnitOfWork) => Promise<T>): Promise<T> {
		// Note: SQLite doesn't support nested transactions
		// For production, consider using savepoints
		return db.transaction(async () => {
			return callback(this);
		});
	}

	/**
	 * Bulk operations
	 */
	async bulkInsertDocuments(documents: NewDocument[]): Promise<Document[]> {
		return db
			.insert(documents)
			.values(
				documents.map((d) => ({
					...d,
					id: d.id || generateId()
				}))
			)
			.returning();
	}

	async bulkInsertKnowledge(items: NewKnowledgeItem[]): Promise<KnowledgeItem[]> {
		return db
			.insert(knowledgeBase)
			.values(
				items.map((item) => ({
					...item,
					id: item.id || generateId()
				}))
			)
			.returning();
	}
}

// ============================================================================
// EXPORT SINGLETON INSTANCE
// ============================================================================

export const vectorDB = new VectorDatabaseUnitOfWork();
