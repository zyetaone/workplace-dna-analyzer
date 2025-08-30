/**
 * Quiz Schema Layer
 * Database schemas and types for quiz-related entities
 */

import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// ============================================================================
// QUIZ QUESTIONS SCHEMA
// ============================================================================

export const quizQuestions = sqliteTable('quiz_questions', {
	id: text('id').primaryKey(),
	question: text('question').notNull(),
	description: text('description'),
	category: text('category').notNull(), // 'communication', 'technology', etc.
	options: text('options', { mode: 'json' }).$type<QuizOption[]>().notNull(),
	createdAt: text('created_at')
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`),
	updatedAt: text('updated_at')
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`)
		.$onUpdate(() => sql`CURRENT_TIMESTAMP`)
});

export interface QuizOption {
	id: string;
	label: string;
	description?: string;
	scores: {
		collaboration?: number;
		formality?: number;
		tech?: number;
		wellness?: number;
	};
}

// ============================================================================
// QUIZ RESPONSES SCHEMA
// ============================================================================

export const quizResponses = sqliteTable('quiz_responses', {
	id: text('id').primaryKey(),
	participantId: text('participant_id').notNull(),
	questionId: text('question_id').notNull(),
	answerId: text('answer_id').notNull(),
	timestamp: text('timestamp')
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`)
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type QuizQuestion = typeof quizQuestions.$inferSelect;
export type NewQuizQuestion = typeof quizQuestions.$inferInsert;
export type QuizResponse = typeof quizResponses.$inferSelect;
export type NewQuizResponse = typeof quizResponses.$inferInsert;

// ============================================================================
// RELATIONS
// ============================================================================

export const quizRelations = {
	questions: quizQuestions,
	responses: quizResponses
};
