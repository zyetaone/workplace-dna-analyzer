/**
 * Legacy Scoring Compatibility
 * Deprecated functions for backward compatibility
 */

import { questions } from '$lib/server/data/questions';
import { calculatePreferenceScores } from './calculator';
import type { PreferenceScores, LegacyResponseItem } from './types';

/**
 * @deprecated Use calculatePreferenceScores with ResponseItem[] instead
 * Legacy function for backward compatibility with questionNumber-based responses
 */
export function calculatePreferenceScoresLegacy(
	responses: Array<{ questionNumber: number; answer: string }>
): PreferenceScores {
	console.warn(
		'calculatePreferenceScoresLegacy is deprecated. Use calculatePreferenceScores with question IDs instead.'
	);

	try {
		// Convert legacy format to new format
		const convertedResponses = responses
			.map((response) => {
				const question = questions[response.questionNumber];
				if (!question) {
					console.error(`Invalid question number: ${response.questionNumber}`);
					return null;
				}

				// Find matching option based on answer text (best effort)
				const matchingOption = question.options.find(
					(option) =>
						response.answer.toLowerCase().includes(option.label.toLowerCase()) ||
						response.answer.toLowerCase().includes(option.id.toLowerCase())
				);

				if (!matchingOption) {
					console.warn(
						`Could not match answer for question ${response.questionNumber}: ${response.answer}`
					);
					return null;
				}

				return {
					questionId: question.id.toString(),
					answerId: matchingOption.id
				};
			})
			.filter((response): response is NonNullable<typeof response> => response !== null);

		return calculatePreferenceScores(convertedResponses);
	} catch (error) {
		console.error('Error in legacy scoring calculation:', error);
		return {
			collaboration: 0,
			formality: 0,
			tech: 0,
			wellness: 0
		};
	}
}
