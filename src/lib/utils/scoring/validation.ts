/**
 * Scoring Validation
 * Validation functions for scoring data integrity
 */

import * as v from 'valibot';
import { questions } from '$lib/server/data/questions';
import type { ResponseItem, ValidationResult } from './types';

const responseItemSchema = v.object({
	questionId: v.string(),
	answerId: v.string()
});

const responsesSchema = v.array(responseItemSchema);

/**
 * Validates quiz responses against the expected format and question structure
 */
export function validateResponses(responses: unknown): ValidationResult {
	try {
		const result = v.safeParse(responsesSchema, responses);

		if (!result.success) {
			const errors = result.issues.map((issue) => `Invalid response format: ${issue.message}`);
			return { success: false, errors };
		}

		const validatedResponses = result.output;

		// Additional validation: check if question IDs exist
		const errors: string[] = [];
		const questionIds = new Set(questions.map((q) => q.id));

		validatedResponses.forEach((response, index) => {
			if (!questionIds.has(response.questionId)) {
				errors.push(`Question ${index}: Invalid question ID '${response.questionId}'`);
			}

			// Check if answer ID exists for the question
			const question = questions.find((q) => q.id === response.questionId);
			if (question) {
				const answerExists = question.options?.some((opt) => opt.id === response.answerId);
				if (!answerExists) {
					errors.push(
						`Question ${index}: Invalid answer ID '${response.answerId}' for question '${response.questionId}'`
					);
				}
			}
		});

		if (errors.length > 0) {
			return { success: false, errors };
		}

		return { success: true, data: validatedResponses };
	} catch (error) {
		return {
			success: false,
			errors: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`]
		};
	}
}

/**
 * Validates scoring responses using unified system
 */
export function validateScoringResponses(responses: ResponseItem[]): {
	valid: boolean;
	errors: string[];
} {
	const validation = validateResponses(responses);
	return {
		valid: validation.success,
		errors: validation.errors || []
	};
}
