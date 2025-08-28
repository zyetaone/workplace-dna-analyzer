/**
 * Scoring utilities for workplace preference quiz
 */

import type { PreferenceScores } from '$lib/types';

// Quiz questions with their preference mappings
const questionMappings = [
	{ question: 1, category: 'collaboration', weight: 1 },
	{ question: 2, category: 'formality', weight: 1 },
	{ question: 3, category: 'tech', weight: 1 },
	{ question: 4, category: 'wellness', weight: 1 },
	{ question: 5, category: 'collaboration', weight: 1 },
	{ question: 6, category: 'formality', weight: 1 },
	{ question: 7, category: 'tech', weight: 1 },
	{ question: 8, category: 'wellness', weight: 1 },
	{ question: 9, category: 'collaboration', weight: 0.5 },
	{ question: 10, category: 'formality', weight: 0.5 }
];

// Answer value mappings (A=1, B=2, C=3, D=4)
const answerValues: Record<string, number> = {
	A: 1, B: 2, C: 3, D: 4
};

/**
 * Calculate preference scores from quiz responses
 */
export function calculatePreferenceScores(
	responses: Array<{ questionNumber: number; answer: string }>
): PreferenceScores {
	const scores: PreferenceScores = {
		collaboration: 0,
		formality: 0,
		tech: 0,
		wellness: 0
	};
	
	const totals: Record<string, number> = {
		collaboration: 0,
		formality: 0,
		tech: 0,
		wellness: 0
	};
	
	const weights: Record<string, number> = {
		collaboration: 0,
		formality: 0,
		tech: 0,
		wellness: 0
	};
	
	// Calculate weighted sums
	for (const response of responses) {
		const mapping = questionMappings.find(m => m.question === response.questionNumber);
		if (!mapping) continue;
		
		const value = answerValues[response.answer.toUpperCase()] || 2.5; // Default to middle
		const weightedValue = value * mapping.weight;
		
		totals[mapping.category] += weightedValue;
		weights[mapping.category] += mapping.weight;
	}
	
	// Normalize to 1-10 scale
	for (const category of Object.keys(scores) as Array<keyof PreferenceScores>) {
		if (weights[category] > 0) {
			// Convert from 1-4 scale to 1-10 scale
			const average = totals[category] / weights[category];
			scores[category] = Math.round(((average - 1) / 3) * 9 + 1);
		} else {
			scores[category] = 5; // Default middle value
		}
	}
	
	return scores;
}

/**
 * Get workplace DNA profile from scores
 */
export function getWorkplaceDNA(scores: PreferenceScores): string {
	const profiles = [];
	
	if (scores.collaboration >= 7) profiles.push('Collaborative');
	else if (scores.collaboration <= 3) profiles.push('Independent');
	
	if (scores.formality >= 7) profiles.push('Structured');
	else if (scores.formality <= 3) profiles.push('Flexible');
	
	if (scores.tech >= 7) profiles.push('Tech-Forward');
	else if (scores.tech <= 3) profiles.push('Traditional');
	
	if (scores.wellness >= 7) profiles.push('Wellness-Focused');
	else if (scores.wellness <= 3) profiles.push('Performance-Driven');
	
	return profiles.length > 0 ? profiles.join(' & ') : 'Balanced';
}