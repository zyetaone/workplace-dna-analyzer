/**
 * Scoring Insights
 * Generate workplace DNA and generation-specific insights
 */

import type { Generation } from '$lib/server/data/questions';
import type { PreferenceScores } from './types';

/**
 * Get workplace DNA based on preference scores
 */
export function getWorkplaceDNA(scores: PreferenceScores): string {
	try {
		const { collaboration, formality, tech, wellness } = scores;

		// Validate input scores
		const scoreEntries = Object.entries(scores);
		const invalidScores = scoreEntries.filter(
			([, score]) => typeof score !== 'number' || score < 0 || score > 10 || isNaN(score)
		);

		if (invalidScores.length > 0) {
			console.error('Invalid scores detected:', invalidScores);
			return 'Analysis Unavailable';
		}

		let dna = '';

		// Collaboration style with more nuanced categories
		if (collaboration >= 8) {
			dna += 'Highly Collaborative ';
		} else if (collaboration >= 6) {
			dna += 'Collaborative ';
		} else if (collaboration >= 3) {
			dna += 'Balanced ';
		} else {
			dna += 'Independent ';
		}

		// Communication style
		if (formality >= 8) {
			dna += 'Highly Formal ';
		} else if (formality >= 6) {
			dna += 'Formal ';
		} else if (formality >= 3) {
			dna += 'Professional ';
		} else {
			dna += 'Casual ';
		}

		// Technology preference
		if (tech >= 8) {
			dna += 'Tech-Innovative ';
		} else if (tech >= 6) {
			dna += 'Tech-Savvy ';
		} else if (tech >= 3) {
			dna += 'Tech-Adaptable ';
		} else {
			dna += 'Traditional ';
		}

		// Wellness focus
		if (wellness >= 8) {
			dna += 'Wellness-Prioritized';
		} else if (wellness >= 6) {
			dna += 'Wellness-Focused';
		} else if (wellness >= 3) {
			dna += 'Balanced';
		} else {
			dna += 'Task-Focused';
		}

		return dna.trim();
	} catch (error) {
		console.error('Error generating workplace DNA:', error);
		return 'Analysis Unavailable';
	}
}

/**
 * Get generation-specific insights
 */
export function getGenerationInsights(generation: Generation, scores: PreferenceScores): string {
	try {
		// Validate generation parameter
		const validGenerations: Generation[] = ['Baby Boomers', 'Gen X', 'Millennials', 'Gen Z'];
		if (!validGenerations.includes(generation)) {
			console.error('Invalid generation:', generation);
			return 'Generation insights unavailable';
		}

		// Validate scores
		const scoreEntries = Object.entries(scores);
		const invalidScores = scoreEntries.filter(
			([, score]) => typeof score !== 'number' || score < 0 || score > 10 || isNaN(score)
		);

		if (invalidScores.length > 0) {
			console.error('Invalid scores for insights:', invalidScores);
			return 'Analysis unavailable due to invalid data';
		}

		const insights: Record<Generation, (scores: PreferenceScores) => string> = {
			'Baby Boomers': (scores) =>
				scores.formality > scores.collaboration
					? 'Values structured communication and professional protocols'
					: 'Appreciates team collaboration with clear leadership',
			'Gen X': (scores) =>
				scores.tech > 6
					? 'Embraces technology solutions and digital workflows'
					: 'Prefers practical, results-oriented approaches',
			Millennials: (scores) =>
				scores.collaboration > scores.formality
					? 'Thrives in collaborative, inclusive environments'
					: 'Balances innovation with professional standards',
			'Gen Z': (scores) =>
				scores.wellness > 6
					? 'Prioritizes work-life integration and mental wellness'
					: 'Values purpose-driven work and continuous learning'
		};

		return insights[generation](scores);
	} catch (error) {
		console.error('Error generating generation insights:', error);
		return 'Insights unavailable';
	}
}
