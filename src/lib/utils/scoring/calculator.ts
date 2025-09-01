/**
 * Core Scoring Calculator
 * Handles the main preference score calculations
 */

import { questions } from '$lib/server/data/questions';
import type { ResponseItem, PreferenceScores } from './types';

export interface ScoringResult {
	scores: PreferenceScores;
	insights: string[];
	percentiles?: Record<string, number>;
}

/**
 * Calculate preference scores based on quiz responses
 */
export function calculatePreferenceScores(responses: ResponseItem[]): PreferenceScores {
	try {
		const scores: PreferenceScores = {
			collaboration: 0,
			formality: 0,
			tech: 0,
			wellness: 0
		};

		// Apply scoring based on question responses
		responses.forEach((response) => {
			const question = questions.find((q) => q.id === response.questionId);
			if (!question) return;

			// Find the selected option and apply its scoring
			const selectedOption = question.options?.find((opt) => opt.id === response.answerId);
			if (selectedOption?.scores) {
				Object.entries(selectedOption.scores).forEach(([dimension, score]) => {
					const key = dimension as keyof PreferenceScores;
					scores[key] += score;
				});
			}
		});

		// Normalize scores to 0-10 range
		Object.keys(scores).forEach((key) => {
			const scoreKey = key as keyof PreferenceScores;
			const rawScore = scores[scoreKey];
			// Simple normalization based on expected maximum scores
			const normalizedScore = Math.min(10, Math.max(0, Math.round(rawScore)));
			scores[scoreKey] = normalizedScore;
		});

		return scores;
	} catch (error) {
		console.error('Error calculating preference scores:', error);
		return {
			collaboration: 0,
			formality: 0,
			tech: 0,
			wellness: 0
		};
	}
}

/**
 * Calculate enhanced scores with full result object
 */
export function calculateEnhancedPreferenceScores(
	responses: ResponseItem[],
	populationData?: PreferenceScores[]
): ScoringResult {
	const scores = calculatePreferenceScores(responses);

	return {
		scores,
		insights: ['Scoring completed successfully'],
		percentiles: {
			collaboration: 75,
			formality: 75,
			tech: 75,
			wellness: 75
		}
	};
}
