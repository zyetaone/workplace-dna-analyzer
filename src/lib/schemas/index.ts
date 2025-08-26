/**
 * Centralized Valibot schemas for validation
 * These schemas match and validate our Drizzle database types
 */

import * as v from 'valibot';

// ============= Core Data Schemas =============

// Preference scores schema matching Drizzle's preferenceScores JSON field
export const PreferenceScoresSchema = v.object({
	collaboration: v.pipe(v.number(), v.minValue(0), v.maxValue(10)),
	formality: v.pipe(v.number(), v.minValue(0), v.maxValue(10)),
	technology: v.optional(v.pipe(v.number(), v.minValue(0), v.maxValue(10))),
	tech: v.optional(v.pipe(v.number(), v.minValue(0), v.maxValue(10))),
	wellness: v.pipe(v.number(), v.minValue(0), v.maxValue(10))
});

// Generation type schema
export const GenerationSchema = v.picklist(['Baby Boomer', 'Gen X', 'Millennial', 'Gen Z']);

// Session schemas
export const CreateSessionSchema = v.object({
	title: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
	presenterId: v.pipe(v.string(), v.minLength(1))
});

export const UpdateSessionSchema = v.object({
	sessionId: v.pipe(v.string(), v.uuid()),
	isActive: v.boolean()
});

// Attendee schemas
export const JoinSessionSchema = v.object({
	sessionCode: v.pipe(v.string(), v.minLength(1), v.maxLength(10)),
	name: v.pipe(v.string(), v.minLength(1), v.maxLength(100))
});

export const SaveResponseSchema = v.object({
	sessionId: v.string(),
	attendeeId: v.string(),
	questionIndex: v.pipe(v.number(), v.minValue(0)),
	response: v.string(),
	generation: v.optional(GenerationSchema)
});

export const CompleteQuizSchema = v.object({
	sessionId: v.string(),
	attendeeId: v.string(),
	scores: PreferenceScoresSchema
});

// Analytics schemas
export const GenerationDistributionSchema = v.object({
	'Baby Boomer': v.number(),
	'Gen X': v.number(),
	'Millennial': v.number(),
	'Gen Z': v.number()
});

export const WordCloudItemSchema = v.object({
	text: v.string(),
	size: v.pipe(v.number(), v.minValue(10), v.maxValue(100))
});

export const WorkspaceConceptSchema = v.object({
	name: v.pipe(v.string(), v.minLength(1), v.maxLength(100)),
	description: v.pipe(v.string(), v.minLength(1), v.maxLength(500)),
	score: v.pipe(v.number(), v.minValue(0), v.maxValue(10)),
	tags: v.array(v.string()),
	color: v.pipe(v.string(), v.regex(/^#[0-9a-fA-F]{6}$/))
});

// Question schemas for quiz
export const QuestionOptionSchema = v.object({
	id: v.string(),
	text: v.string(),
	values: v.optional(v.object({
		collaboration: v.number(),
		formality: v.number(),
		tech: v.number(),
		wellness: v.number()
	}))
});

export const QuestionSchema = v.object({
	id: v.string(),
	title: v.string(),
	options: v.array(QuestionOptionSchema)
});

// ============= API Request/Response Schemas =============

export const SessionAnalyticsRequestSchema = v.object({
	sessionId: v.string()
});

export const SessionAnalyticsResponseSchema = v.object({
	session: v.any(), // We'll use the Drizzle type directly
	attendees: v.array(v.any()), // We'll use the Drizzle type directly
	analytics: v.object({
		activeCount: v.number(),
		completedCount: v.number(),
		responseRate: v.number(),
		generationDistribution: GenerationDistributionSchema,
		preferenceScores: PreferenceScoresSchema,
		workplaceDNA: v.string(),
		wordCloudData: v.array(WordCloudItemSchema)
	})
});

// AI Chat schemas
export const ChatRequestSchema = v.object({
	message: v.pipe(v.string(), v.minLength(1), v.maxLength(1000)),
	systemPrompt: v.string(),
	mode: v.picklist(['workspace', 'brainstorm', 'render']),
	sessionId: v.string()
});

export const ChatResponseSchema = v.object({
	response: v.string(),
	concept: v.optional(v.string())
});

// ============= Type Exports =============

// Export inferred TypeScript types from Valibot schemas
export type PreferenceScores = v.InferInput<typeof PreferenceScoresSchema>;
export type Generation = v.InferInput<typeof GenerationSchema>;
export type CreateSessionInput = v.InferInput<typeof CreateSessionSchema>;
export type JoinSessionInput = v.InferInput<typeof JoinSessionSchema>;
export type SaveResponseInput = v.InferInput<typeof SaveResponseSchema>;
export type CompleteQuizInput = v.InferInput<typeof CompleteQuizSchema>;
export type Question = v.InferInput<typeof QuestionSchema>;
export type QuestionOption = v.InferInput<typeof QuestionOptionSchema>;
export type WordCloudItem = v.InferInput<typeof WordCloudItemSchema>;
export type WorkspaceConcept = v.InferInput<typeof WorkspaceConceptSchema>;