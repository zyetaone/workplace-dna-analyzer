import * as v from 'valibot';

// Simple assistant ask schema
export const AskAssistantInput = v.object({
	prompt: v.string('Prompt is required'),
	sessionId: v.optional(v.string()),
	context: v.optional(v.record(v.string(), v.any()))
});
