import * as v from 'valibot';

// Inputs
export const GetSessionDataInput = v.object({ sessionCode: v.string() });
export type GetSessionDataInput = v.InferOutput<typeof GetSessionDataInput>;

export const GenerateInsightsInput = v.object({ sessionId: v.string() });
export type GenerateInsightsInput = v.InferOutput<typeof GenerateInsightsInput>;

export const GenerateRecommendationsInput = v.object({
	sessionId: v.string(),
	focusArea: v.optional(v.string())
});
export type GenerateRecommendationsInput = v.InferOutput<typeof GenerateRecommendationsInput>;

// Basic records
export const SessionRecord = v.object({
	id: v.string(),
	code: v.string(),
	name: v.string(),
	isActive: v.boolean(),
	createdAt: v.string(),
	endedAt: v.optional(v.string()),
	activeCount: v.number(),
	completedCount: v.number()
});

export const ParticipantRecord = v.object({
	id: v.string(),
	sessionId: v.string(),
	name: v.optional(v.string()),
	generation: v.optional(v.string()),
	responses: v.optional(v.record(v.string(), v.any())),
	preferenceScores: v.optional(v.record(v.string(), v.number())),
	completed: v.boolean(),
	joinedAt: v.optional(v.string()),
	completedAt: v.optional(v.string())
});

// Outputs
export const GetSessionDataOutput = v.object({
	session: SessionRecord,
	participants: v.array(ParticipantRecord),
	analytics: v.object({
		activeCount: v.number(),
		completedCount: v.number(),
		responseRate: v.number(),
		averagePreferences: v.object({
			collaboration: v.number(),
			formality: v.number(),
			tech: v.number(),
			wellness: v.number()
		}),
		generationDistribution: v.record(v.string(), v.number()),
		workplaceDNA: v.string()
	})
});

export const GenerateInsightsOutput = v.object({
	success: v.boolean(),
	insights: v.string(),
	invalidate: v.optional(v.array(v.string()))
});

export const GenerateRecommendationsOutput = v.object({
	success: v.boolean(),
	recommendations: v.string(),
	invalidate: v.optional(v.array(v.string()))
});

// Type exports
export type GetSessionDataOutput = v.InferOutput<typeof GetSessionDataOutput>;
export type GenerateInsightsOutput = v.InferOutput<typeof GenerateInsightsOutput>;
export type GenerateRecommendationsOutput = v.InferOutput<typeof GenerateRecommendationsOutput>;
