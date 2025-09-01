import * as v from 'valibot';

export const ActivitySlug = v.pipe(
	v.string(),
	v.minLength(1, 'Activity slug is required'),
	v.maxLength(100, 'Activity slug too long')
);

export const ActivityType = v.picklist(
	['quiz', 'survey', 'assessment', 'poll'],
	'Invalid activity type'
);

export const ResponseData = v.record(v.string(), v.any());
export const ScoreData = v.record(v.string(), v.number());

export const LoadActivityInput = v.object({
	slug: ActivitySlug,
	sessionCode: v.optional(v.string())
});
export type LoadActivityInput = v.InferOutput<typeof LoadActivityInput>;

export const GetAvailableActivitiesInput = v.object({});

export const GetSessionActivitiesInput = v.object({
	sessionCode: v.string()
});
export type GetSessionActivitiesInput = v.InferOutput<typeof GetSessionActivitiesInput>;

export const GetActivityProgressInput = v.object({
	participantId: v.string(),
	activitySlug: ActivitySlug,
	sessionCode: v.string()
});
export type GetActivityProgressInput = v.InferOutput<typeof GetActivityProgressInput>;

export const SaveActivityResponseInput = v.object({
	participantId: v.string(),
	activitySlug: ActivitySlug,
	sessionCode: v.string(),
	questionId: v.string(),
	response: v.any(),
	metadata: v.optional(v.record(v.string(), v.any()))
});
export type SaveActivityResponseInput = v.InferOutput<typeof SaveActivityResponseInput>;

export const CalculateActivityScoreInput = v.object({
	participantId: v.string(),
	activitySlug: ActivitySlug,
	sessionCode: v.string(),
	forceRecalculate: v.optional(v.boolean())
});
export type CalculateActivityScoreInput = v.InferOutput<typeof CalculateActivityScoreInput>;

export const CreateActivityInput = v.object({
	slug: ActivitySlug,
	name: v.string(),
	type: ActivityType,
	config: v.optional(ResponseData),
	version: v.optional(v.string())
});
export type CreateActivityInput = v.InferOutput<typeof CreateActivityInput>;

export const AddActivityToSessionInput = v.object({
	sessionCode: v.string(),
	activitySlug: ActivitySlug,
	order: v.optional(v.number()),
	configOverride: v.optional(ResponseData)
});
export type AddActivityToSessionInput = v.InferOutput<typeof AddActivityToSessionInput>;

export const GetActivityAnalyticsInput = v.object({
	sessionCode: v.string(),
	activitySlug: v.optional(ActivitySlug)
});
export type GetActivityAnalyticsInput = v.InferOutput<typeof GetActivityAnalyticsInput>;

export const ToggleSessionActivityInput = v.object({
	sessionCode: v.string(),
	activitySlug: ActivitySlug,
	isActive: v.boolean()
});
export type ToggleSessionActivityInput = v.InferOutput<typeof ToggleSessionActivityInput>;

export const ReorderSessionActivityInput = v.object({
	sessionCode: v.string(),
	activitySlug: ActivitySlug,
	newOrder: v.number()
});
export type ReorderSessionActivityInput = v.InferOutput<typeof ReorderSessionActivityInput>;

export const RemoveSessionActivityInput = v.object({
	sessionCode: v.string(),
	activitySlug: ActivitySlug
});
export type RemoveSessionActivityInput = v.InferOutput<typeof RemoveSessionActivityInput>;

// -------------------------
// Output schemas
// -------------------------

export const ActivityRecord = v.object({
	id: v.string(),
	slug: v.string(),
	name: v.string(),
	type: v.string(),
	config: v.optional(v.record(v.string(), v.unknown())),
	version: v.optional(v.string()),
	isActive: v.boolean(),
	createdAt: v.optional(v.string()),
	updatedAt: v.optional(v.string())
});

export const LoadActivityOutput = v.object({
	activity: ActivityRecord,
	sessionActivity: v.optional(v.unknown()),
	hasSessionOverride: v.boolean()
});

export const GetAvailableActivitiesOutput = v.array(ActivityRecord);

export const GetSessionActivitiesOutput = v.object({
	session: v.object({
		id: v.string(),
		code: v.string(),
		name: v.string(),
		isActive: v.boolean(),
		createdAt: v.string(),
		endedAt: v.optional(v.string())
	}),
	activities: v.array(v.object({ sessionActivity: v.unknown(), activity: ActivityRecord }))
});

export const GetActivityProgressOutput = v.object({
	activity: ActivityRecord,
	sessionActivity: v.unknown(),
	participantActivity: v.unknown(),
	session: v.object({
		id: v.string(),
		code: v.string(),
		name: v.string(),
		isActive: v.boolean(),
		createdAt: v.string(),
		endedAt: v.optional(v.string())
	}),
	progress: v.number()
});

export const SaveActivityResponseOutput = v.object({
	success: v.literal(true),
	progress: v.number(),
	isComplete: v.boolean(),
	invalidate: v.array(v.string())
});

export const CalculateActivityScoreOutput = v.object({
	success: v.literal(true),
	scores: v.record(v.string(), v.number()),
	completedAt: v.string(),
	alreadyCompleted: v.optional(v.boolean()),
	invalidate: v.array(v.string())
});

export const CreateActivityOutput = v.object({
	success: v.literal(true),
	activity: ActivityRecord,
	invalidate: v.array(v.string())
});

export const AddActivityToSessionOutput = v.object({
	success: v.literal(true),
	sessionActivity: v.unknown(),
	invalidate: v.array(v.string())
});

export const GetActivityAnalyticsOutput = v.object({
	session: v.object({
		id: v.string(),
		code: v.string(),
		name: v.string(),
		isActive: v.boolean(),
		createdAt: v.string(),
		endedAt: v.optional(v.string())
	}),
	activities: v.array(v.unknown())
});
