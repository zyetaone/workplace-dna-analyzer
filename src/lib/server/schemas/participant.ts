import * as v from 'valibot';

// Inputs
export const GetQuizStateInput = v.object({
	sessionCode: v.string(),
	participantId: v.optional(v.string())
});
export type GetQuizStateInput = v.InferOutput<typeof GetQuizStateInput>;

export const SaveAnswerInput = v.object({
	sessionCode: v.string(),
	participantId: v.string(),
	questionIndex: v.number(),
	answer: v.string()
});
export type SaveAnswerInput = v.InferOutput<typeof SaveAnswerInput>;

export const CompleteQuizInput = v.object({
	sessionCode: v.string(),
	participantId: v.string(),
	name: v.optional(v.string()),
	generation: v.optional(v.string())
});
export type CompleteQuizInput = v.InferOutput<typeof CompleteQuizInput>;

export const GetCompletionResultsInput = v.object({
	sessionCode: v.string(),
	participantId: v.string()
});
export type GetCompletionResultsInput = v.InferOutput<typeof GetCompletionResultsInput>;

export const RemoveParticipantInput = v.object({
	participantId: v.string()
});
export type RemoveParticipantInput = v.InferOutput<typeof RemoveParticipantInput>;

// Outputs
export const GetQuizStateOutput = v.object({
	participantId: v.string(),
	sessionId: v.string(),
	sessionName: v.string(),
	responses: v.record(v.string(), v.any()),
	completed: v.boolean(),
	questions: v.array(v.unknown())
});

export const SaveAnswerOutput = v.object({
	success: v.literal(true),
	invalidate: v.array(v.string())
});

export const CompleteQuizOutput = v.object({
	success: v.literal(true),
	preferenceScores: v.record(v.string(), v.number()),
	invalidate: v.array(v.string())
});

export const GetCompletionResultsOutput = v.object({
	sessionName: v.string(),
	participant: v.object({
		name: v.optional(v.string()),
		generation: v.optional(v.string()),
		preferenceScores: v.record(v.string(), v.number())
	}),
	topParticipants: v.array(
		v.object({
			name: v.optional(v.string()),
			generation: v.optional(v.string()),
			preferenceScores: v.optional(v.record(v.string(), v.number()))
		})
	)
});

export const RemoveParticipantOutput = v.object({
	success: v.literal(true),
	invalidate: v.array(v.string())
});

// Type exports
export type GetQuizStateOutput = v.InferOutput<typeof GetQuizStateOutput>;
export type SaveAnswerOutput = v.InferOutput<typeof SaveAnswerOutput>;
export type CompleteQuizOutput = v.InferOutput<typeof CompleteQuizOutput>;
export type GetCompletionResultsOutput = v.InferOutput<typeof GetCompletionResultsOutput>;
export type RemoveParticipantOutput = v.InferOutput<typeof RemoveParticipantOutput>;
