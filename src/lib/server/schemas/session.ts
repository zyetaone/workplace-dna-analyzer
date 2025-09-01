import * as v from 'valibot';
import {
	participantNameSchema,
	generationSchema,
	sessionCodeSchema,
	questionIndexSchema
} from '$lib/utils/validation';

// Session operations
export const GetSessionInfoInput = v.object({ code: v.string() });
export type GetSessionInfoInput = v.InferOutput<typeof GetSessionInfoInput>;

export const CreateSessionInput = v.object({
	name: v.string(),
	template: v.optional(v.string()),
	activities: v.optional(v.array(v.string()))
});
export type CreateSessionInput = v.InferOutput<typeof CreateSessionInput>;

export const DeleteSessionInput = v.object({ code: v.string() });
export type DeleteSessionInput = v.InferOutput<typeof DeleteSessionInput>;

export const ToggleSessionStatusInput = v.object({ code: v.string() });
export type ToggleSessionStatusInput = v.InferOutput<typeof ToggleSessionStatusInput>;

// Participant operations
export const SessionOperationInput = v.object({
	code: v.string(),
	operation: v.picklist(['join', 'leave']),
	participantData: v.optional(
		v.object({
			name: participantNameSchema,
			generation: v.optional(generationSchema)
		})
	)
});
export type SessionOperationInput = v.InferOutput<typeof SessionOperationInput>;

export const GetQuizStateInput = v.object({
	sessionCode: v.string(),
	participantId: v.string()
});
export type GetQuizStateInput = v.InferOutput<typeof GetQuizStateInput>;

export const SaveAnswerInput = v.object({
	participantId: v.string(),
	questionIndex: questionIndexSchema,
	answer: v.string()
});
export type SaveAnswerInput = v.InferOutput<typeof SaveAnswerInput>;

export const CompleteQuizInput = v.object({
	sessionCode: v.string(),
	participantId: v.string()
});
export type CompleteQuizInput = v.InferOutput<typeof CompleteQuizInput>;

export const GetAllSessionsInput = v.object({});
export type GetAllSessionsInput = v.InferOutput<typeof GetAllSessionsInput>;

export const GetSessionDataInput = v.object({ code: v.string() });
export type GetSessionDataInput = v.InferOutput<typeof GetSessionDataInput>;

export const GetCompletionResultsInput = v.object({ sessionCode: v.string() });
export type GetCompletionResultsInput = v.InferOutput<typeof GetCompletionResultsInput>;

export const DeleteParticipantInput = v.object({
	sessionCode: v.string(),
	participantId: v.string()
});
export type DeleteParticipantInput = v.InferOutput<typeof DeleteParticipantInput>;

// -------------------------
// Output schemas
// -------------------------

export const SessionRecord = v.object({
	id: v.string(),
	code: v.string(),
	name: v.string(),
	isActive: v.boolean(),
	createdAt: v.string(),
	endedAt: v.optional(v.string())
});

export const ParticipantRecord = v.object({
	id: v.string(),
	sessionId: v.string(),
	cookieId: v.optional(v.string()),
	name: v.optional(v.string()),
	generation: v.optional(v.string()),
	responses: v.optional(v.record(v.string(), v.string())),
	preferenceScores: v.optional(v.record(v.string(), v.number())),
	completed: v.boolean(),
	joinedAt: v.string(),
	completedAt: v.optional(v.string())
});

export const SuccessInvalidate = v.object({
	success: v.literal(true),
	invalidate: v.array(v.string())
});

export const GetSessionInfoOutput = SessionRecord;

export const CreateSessionOutput = v.object({
	success: v.literal(true),
	data: SessionRecord,
	redirect: v.string(),
	invalidate: v.array(v.string())
});

export const DeleteSessionOutput = SuccessInvalidate;
export const ToggleSessionStatusOutput = SuccessInvalidate;

export const SessionOperationJoinOutput = v.object({
	success: v.literal(true),
	participant: ParticipantRecord,
	invalidate: v.array(v.string())
});

export const GetQuizStateOutput = v.object({
	session: SessionRecord,
	participant: ParticipantRecord,
	questions: v.array(v.unknown()),
	responses: v.record(v.string(), v.string())
});

export const SaveAnswerOutput = SuccessInvalidate;

export const CompleteQuizOutput = v.object({
	success: v.literal(true),
	redirect: v.string(),
	invalidate: v.array(v.string())
});

export const SessionWithCounts = v.object({
	id: v.string(),
	code: v.string(),
	name: v.string(),
	isActive: v.boolean(),
	createdAt: v.string(),
	endedAt: v.optional(v.string()),
	activeCount: v.number(),
	completedCount: v.number(),
	activityCount: v.optional(v.number())
});

export type SessionWithCounts = v.InferOutput<typeof SessionWithCounts>;

export const GetAllSessionsOutput = v.array(SessionWithCounts);

export const GetSessionDataOutput = v.object({
	session: SessionRecord,
	participants: v.array(ParticipantRecord),
	totalCount: v.number(),
	completedCount: v.number()
});

export const GetCompletionResultsOutput = GetSessionDataOutput;
export const DeleteParticipantOutput = SuccessInvalidate;
