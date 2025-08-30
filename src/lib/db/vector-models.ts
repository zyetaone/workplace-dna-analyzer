/**
 * Business Model Layer for Vector Database
 * Implements domain logic, validation, and business rules
 */

import { z } from 'zod';
import type {
	Session,
	Document,
	KnowledgeItem,
	SearchQuery,
	AIConversation
} from '../db/vector-schema';

// ============================================================================
// DOMAIN MODELS WITH VALIDATION
// ============================================================================

/**
 * Embedding Model - Represents a vector embedding with metadata
 */
export class EmbeddingModel {
	constructor(
		public readonly vector: number[],
		public readonly text: string,
		public readonly model: string = 'text-embedding-ada-002',
		public readonly dimensions: number = 1536
	) {
		this.validate();
	}

	private validate() {
		if (this.vector.length !== this.dimensions) {
			throw new Error(
				`Invalid embedding dimensions: expected ${this.dimensions}, got ${this.vector.length}`
			);
		}
		if (!this.text || this.text.trim().length === 0) {
			throw new Error('Embedding text cannot be empty');
		}
	}

	/**
	 * Calculate cosine similarity between two embeddings
	 */
	similarity(other: EmbeddingModel): number {
		let dotProduct = 0;
		let normA = 0;
		let normB = 0;

		for (let i = 0; i < this.dimensions; i++) {
			dotProduct += this.vector[i] * other.vector[i];
			normA += this.vector[i] * this.vector[i];
			normB += other.vector[i] * other.vector[i];
		}

		return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
	}

	/**
	 * Calculate euclidean distance
	 */
	distance(other: EmbeddingModel): number {
		let sum = 0;
		for (let i = 0; i < this.dimensions; i++) {
			const diff = this.vector[i] - other.vector[i];
			sum += diff * diff;
		}
		return Math.sqrt(sum);
	}

	toJSON() {
		return {
			vector: this.vector,
			text: this.text,
			model: this.model,
			dimensions: this.dimensions
		};
	}
}

/**
 * Document Model - Represents an uploaded document with content
 */
export class DocumentModel {
	private static readonly MAX_CHUNK_SIZE = 1500;
	private static readonly CHUNK_OVERLAP = 200;

	constructor(
		public readonly filename: string,
		public readonly content: string,
		public readonly contentType: 'markdown' | 'json' | 'text' | 'csv',
		public readonly sessionId?: string,
		public readonly metadata?: Record<string, any>
	) {
		this.validate();
	}

	private validate() {
		const schema = z.object({
			filename: z.string().min(1).max(255),
			content: z.string().min(1).max(1000000), // 1MB limit
			contentType: z.enum(['markdown', 'json', 'text', 'csv']),
			sessionId: z.string().optional(),
			metadata: z.record(z.any()).optional()
		});

		schema.parse({
			filename: this.filename,
			content: this.content,
			contentType: this.contentType,
			sessionId: this.sessionId,
			metadata: this.metadata
		});
	}

	/**
	 * Split document into chunks for embedding
	 */
	chunk(): DocumentChunk[] {
		const chunks: DocumentChunk[] = [];
		const sentences = this.content.match(/[^.!?]+[.!?]+/g) || [this.content];

		let currentChunk = '';
		let chunkIndex = 0;

		for (const sentence of sentences) {
			if (currentChunk.length + sentence.length > DocumentModel.MAX_CHUNK_SIZE) {
				if (currentChunk) {
					chunks.push(
						new DocumentChunk(currentChunk.trim(), chunkIndex, this.filename, this.sessionId)
					);

					// Add overlap
					const overlap = currentChunk.slice(-DocumentModel.CHUNK_OVERLAP);
					currentChunk = overlap + sentence;
					chunkIndex++;
				} else {
					currentChunk = sentence;
				}
			} else {
				currentChunk += ' ' + sentence;
			}
		}

		if (currentChunk) {
			chunks.push(
				new DocumentChunk(currentChunk.trim(), chunkIndex, this.filename, this.sessionId)
			);
		}

		return chunks;
	}

	/**
	 * Extract metadata from content
	 */
	extractMetadata(): Record<string, any> {
		const metadata: Record<string, any> = {
			wordCount: this.content.split(/\s+/).length,
			characterCount: this.content.length,
			lineCount: this.content.split('\n').length,
			...this.metadata
		};

		// Extract title from markdown
		if (this.contentType === 'markdown') {
			const titleMatch = this.content.match(/^#\s+(.+)$/m);
			if (titleMatch) {
				metadata.title = titleMatch[1];
			}

			// Extract headers
			const headers = this.content.match(/^#{1,6}\s+.+$/gm);
			if (headers) {
				metadata.headers = headers.map((h) => h.replace(/^#+\s+/, ''));
			}
		}

		// Parse JSON metadata
		if (this.contentType === 'json') {
			try {
				const parsed = JSON.parse(this.content);
				metadata.jsonKeys = Object.keys(parsed);
				metadata.jsonType = Array.isArray(parsed) ? 'array' : 'object';
			} catch {
				metadata.jsonValid = false;
			}
		}

		return metadata;
	}
}

/**
 * Document Chunk for large documents
 */
export class DocumentChunk {
	constructor(
		public readonly content: string,
		public readonly index: number,
		public readonly sourceFilename: string,
		public readonly sessionId?: string
	) {}

	get id(): string {
		return `${this.sourceFilename}_chunk_${this.index}`;
	}
}

/**
 * Knowledge Base Entry Model
 */
export class KnowledgeModel {
	constructor(
		public readonly title: string,
		public readonly content: string,
		public readonly category: 'workplace' | 'generation' | 'preferences' | 'trends' | 'research',
		public readonly metadata?: {
			source?: string;
			author?: string;
			tags?: string[];
			relevanceScore?: number;
		}
	) {
		this.validate();
	}

	private validate() {
		const schema = z.object({
			title: z.string().min(1).max(200),
			content: z.string().min(10).max(50000),
			category: z.enum(['workplace', 'generation', 'preferences', 'trends', 'research']),
			metadata: z
				.object({
					source: z.string().optional(),
					author: z.string().optional(),
					tags: z.array(z.string()).optional(),
					relevanceScore: z.number().min(0).max(1).optional()
				})
				.optional()
		});

		schema.parse({
			title: this.title,
			content: this.content,
			category: this.category,
			metadata: this.metadata
		});
	}

	/**
	 * Calculate relevance score for a query
	 */
	calculateRelevance(query: string): number {
		const queryLower = query.toLowerCase();
		const titleLower = this.title.toLowerCase();
		const contentLower = this.content.toLowerCase();

		let score = 0;

		// Title match (highest weight)
		if (titleLower.includes(queryLower)) {
			score += 0.5;
		}

		// Content match
		const contentMatches = (contentLower.match(new RegExp(queryLower, 'g')) || []).length;
		score += Math.min(contentMatches * 0.1, 0.3);

		// Tag match
		if (this.metadata?.tags) {
			const tagMatch = this.metadata.tags.some((tag) => tag.toLowerCase().includes(queryLower));
			if (tagMatch) score += 0.2;
		}

		return Math.min(score, 1);
	}
}

/**
 * Search Query Model with validation
 */
export class SearchQueryModel {
	constructor(
		public readonly query: string,
		public readonly type: 'semantic' | 'keyword' | 'hybrid' | 'rag',
		public readonly filters?: {
			sessionId?: string;
			category?: string;
			dateRange?: { start: Date; end: Date };
			limit?: number;
		}
	) {
		this.validate();
	}

	private validate() {
		const schema = z.object({
			query: z.string().min(1).max(500),
			type: z.enum(['semantic', 'keyword', 'hybrid', 'rag']),
			filters: z
				.object({
					sessionId: z.string().optional(),
					category: z.string().optional(),
					dateRange: z
						.object({
							start: z.date(),
							end: z.date()
						})
						.optional(),
					limit: z.number().min(1).max(100).optional()
				})
				.optional()
		});

		schema.parse({
			query: this.query,
			type: this.type,
			filters: this.filters
		});
	}

	/**
	 * Preprocess query for better search results
	 */
	preprocess(): string {
		let processed = this.query.toLowerCase();

		// Remove common stop words
		const stopWords = ['the', 'is', 'at', 'which', 'on', 'a', 'an'];
		stopWords.forEach((word) => {
			processed = processed.replace(new RegExp(`\\b${word}\\b`, 'g'), '');
		});

		// Normalize whitespace
		processed = processed.replace(/\s+/g, ' ').trim();

		return processed;
	}
}

/**
 * AI Conversation Model for chat history
 */
export class ConversationModel {
	private messages: AIMessage[] = [];

	constructor(
		public readonly sessionId: string,
		public readonly threadId: string = crypto.randomUUID()
	) {}

	/**
	 * Add a message to the conversation
	 */
	addMessage(role: 'user' | 'assistant' | 'system', content: string, metadata?: any) {
		const message = new AIMessage(role, content, metadata);
		this.messages.push(message);
		return message;
	}

	/**
	 * Get conversation context for AI
	 */
	getContext(maxMessages: number = 10): string {
		const recentMessages = this.messages.slice(-maxMessages);
		return recentMessages.map((msg) => `${msg.role}: ${msg.content}`).join('\n\n');
	}

	/**
	 * Calculate total token usage
	 */
	calculateTokenUsage(): number {
		return this.messages.reduce((total, msg) => {
			// Rough estimation: 1 token ≈ 4 characters
			return total + Math.ceil(msg.content.length / 4);
		}, 0);
	}

	/**
	 * Export conversation as markdown
	 */
	toMarkdown(): string {
		let markdown = `# Conversation ${this.threadId}\n\n`;
		markdown += `Session: ${this.sessionId}\n\n`;

		for (const msg of this.messages) {
			markdown += `## ${msg.role.toUpperCase()}\n`;
			markdown += `${msg.content}\n\n`;
			if (msg.metadata) {
				markdown += `*Metadata: ${JSON.stringify(msg.metadata)}*\n\n`;
			}
		}

		return markdown;
	}
}

/**
 * Individual AI Message
 */
export class AIMessage {
	public readonly timestamp: Date;

	constructor(
		public readonly role: 'user' | 'assistant' | 'system',
		public readonly content: string,
		public readonly metadata?: {
			model?: string;
			temperature?: number;
			tokens?: number;
			cost?: number;
			contextUsed?: string[];
		}
	) {
		this.timestamp = new Date();
		this.validate();
	}

	private validate() {
		if (!this.content || this.content.trim().length === 0) {
			throw new Error('Message content cannot be empty');
		}
		if (this.content.length > 32000) {
			throw new Error('Message content exceeds maximum length');
		}
	}
}

// ============================================================================
// AGGREGATE MODELS
// ============================================================================

/**
 * Session Analytics Model - Aggregates session data with AI insights
 */
export class SessionAnalyticsModel {
	constructor(
		public readonly session: Session,
		public readonly participants: any[],
		public readonly documents: Document[],
		public readonly insights?: string[]
	) {}

	/**
	 * Generate analytics summary
	 */
	generateSummary(): {
		totalParticipants: number;
		completionRate: number;
		averageScore: number;
		documentCount: number;
		generationBreakdown: Record<string, number>;
	} {
		const completed = this.participants.filter((p) => p.completed);

		const generationBreakdown = this.participants.reduce(
			(acc, p) => {
				if (p.generation) {
					acc[p.generation] = (acc[p.generation] || 0) + 1;
				}
				return acc;
			},
			{} as Record<string, number>
		);

		return {
			totalParticipants: this.participants.length,
			completionRate:
				this.participants.length > 0 ? (completed.length / this.participants.length) * 100 : 0,
			averageScore:
				completed.length > 0
					? completed.reduce((sum, p) => {
							const scores = p.preferenceScores || {};
							const avg =
								Object.values(scores).reduce((a: number, b: any) => a + b, 0) /
								Object.values(scores).length;
							return sum + avg;
						}, 0) / completed.length
					: 0,
			documentCount: this.documents.length,
			generationBreakdown
		};
	}

	/**
	 * Generate insights prompt for AI
	 */
	generateInsightsPrompt(): string {
		const summary = this.generateSummary();

		return `
Analyze this workplace preference session:
- Session: ${this.session.name}
- Participants: ${summary.totalParticipants}
- Completion Rate: ${summary.completionRate.toFixed(1)}%
- Average Score: ${summary.averageScore.toFixed(2)}
- Generation Breakdown: ${JSON.stringify(summary.generationBreakdown)}

Provide 3-5 key insights about workplace preferences and team dynamics.
    `.trim();
	}
}

// ============================================================================
// EXPORT ALL MODELS
// ============================================================================

export {
	EmbeddingModel,
	DocumentModel,
	DocumentChunk,
	KnowledgeModel,
	SearchQueryModel,
	ConversationModel,
	AIMessage,
	SessionAnalyticsModel
};
