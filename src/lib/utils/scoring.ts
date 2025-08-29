/**
 * Scoring utilities for workplace preference calculations
 */

import type { Generation } from '$lib/questions';

export interface PreferenceScores {
	collaboration: number;
	formality: number;
	tech: number;
	wellness: number;
}

export interface ResponseItem {
	questionNumber: number;
	answer: string;
}

/**
 * Calculate preference scores based on quiz responses
 */
export function calculatePreferenceScores(responses: ResponseItem[]): PreferenceScores {
	const scores: PreferenceScores = {
		collaboration: 0,
		formality: 0,
		tech: 0,
		wellness: 0
	};

	// Simple scoring logic - in a real app this would be more sophisticated
	responses.forEach(response => {
		const { questionNumber, answer } = response;

		// Map answers to preference scores
		switch (questionNumber) {
			case 0: // Communication style
				if (answer.includes('team') || answer.includes('collaborative')) {
					scores.collaboration += 2;
				}
				if (answer.includes('formal') || answer.includes('professional')) {
					scores.formality += 2;
				}
				break;
			case 1: // Technology preference
				if (answer.includes('latest') || answer.includes('innovative')) {
					scores.tech += 2;
				}
				break;
			case 2: // Work environment
				if (answer.includes('flexible') || answer.includes('remote')) {
					scores.wellness += 1;
				}
				break;
			case 3: // Meeting style
				if (answer.includes('structured') || answer.includes('agenda')) {
					scores.formality += 1;
				}
				if (answer.includes('brainstorming') || answer.includes('discussion')) {
					scores.collaboration += 1;
				}
				break;
			case 4: // Feedback preference
				if (answer.includes('constructive') || answer.includes('regular')) {
					scores.collaboration += 1;
					scores.formality += 1;
				}
				break;
			case 5: // Learning style
				if (answer.includes('hands-on') || answer.includes('practical')) {
					scores.tech += 1;
				}
				break;
			case 6: // Workspace setup
				if (answer.includes('ergonomic') || answer.includes('comfortable')) {
					scores.wellness += 2;
				}
				break;
			case 7: // Decision making
				if (answer.includes('consensus') || answer.includes('team')) {
					scores.collaboration += 2;
				}
				break;
			case 8: // Work-life balance
				if (answer.includes('important') || answer.includes('prioritize')) {
					scores.wellness += 2;
				}
				break;
			case 9: // Recognition
				if (answer.includes('public') || answer.includes('team')) {
					scores.collaboration += 1;
				}
				break;
		}
	});

	// Normalize scores to 0-10 range
	Object.keys(scores).forEach(key => {
		const scoreKey = key as keyof PreferenceScores;
		scores[scoreKey] = Math.min(10, Math.max(0, scores[scoreKey]));
	});

	return scores;
}

/**
 * Get workplace DNA based on preference scores
 */
export function getWorkplaceDNA(scores: PreferenceScores): string {
	const { collaboration, formality, tech, wellness } = scores;

	let dna = '';

	// Collaboration style
	if (collaboration >= 7) {
		dna += 'Collaborative ';
	} else if (collaboration >= 4) {
		dna += 'Balanced ';
	} else {
		dna += 'Independent ';
	}

	// Communication style
	if (formality >= 7) {
		dna += 'Formal ';
	} else if (formality >= 4) {
		dna += 'Professional ';
	} else {
		dna += 'Casual ';
	}

	// Technology preference
	if (tech >= 7) {
		dna += 'Tech-Savvy ';
	} else if (tech >= 4) {
		dna += 'Tech-Adaptable ';
	} else {
		dna += 'Traditional ';
	}

	// Wellness focus
	if (wellness >= 7) {
		dna += 'Wellness-Focused';
	} else if (wellness >= 4) {
		dna += 'Balanced';
	} else {
		dna += 'Task-Focused';
	}

	return dna;
}

/**
 * Get generation-specific insights
 */
export function getGenerationInsights(generation: Generation, scores: PreferenceScores): string {
	const insights: Record<Generation, string> = {
		'Baby Boomers': scores.formality > scores.collaboration
			? 'Values structured communication and professional protocols'
			: 'Appreciates team collaboration with clear leadership',
		'Gen X': scores.tech > 6
			? 'Embraces technology solutions and digital workflows'
			: 'Prefers practical, results-oriented approaches',
		'Millennials': scores.collaboration > scores.formality
			? 'Thrives in collaborative, inclusive environments'
			: 'Balances innovation with professional standards',
		'Gen Z': scores.wellness > 6
			? 'Prioritizes work-life integration and mental wellness'
			: 'Values purpose-driven work and continuous learning'
	};

	return insights[generation];
}