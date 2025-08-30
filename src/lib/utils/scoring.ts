/**
 * Scoring utilities for workplace preference calculations
 */

import type { Generation, Question } from '$lib/questions';
import { questions } from '$lib/questions';
import * as v from 'valibot';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface PreferenceScores {
	collaboration: number;
	formality: number;
	tech: number;
	wellness: number;
}

export interface ResponseItem {
	questionId: string;
	answerId: string;
}

export interface ScoringRule {
	category: Question['category'];
	answerIds: string[];
	scoreType: keyof PreferenceScores;
	scoreValue: number;
}

export interface ValidationResult {
	success: boolean;
	data?: ResponseItem[];
	errors?: string[];
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const responseItemSchema = v.object({
	questionId: v.string(),
	answerId: v.string()
});

const responsesSchema = v.array(responseItemSchema);

// ============================================================================
// SCORING CONFIGURATION
// ============================================================================

/**
 * Configurable scoring rules that map question categories and answers to preference scores
 * This replaces hard-coded indices and makes the system maintainable
 */
const SCORING_RULES: ScoringRule[] = [
	// Communication style
	{
		category: 'communication',
		answerIds: ['team_chat', 'meetings'],
		scoreType: 'collaboration',
		scoreValue: 2
	},
	{
		category: 'communication',
		answerIds: ['email', 'documents'],
		scoreType: 'formality',
		scoreValue: 2
	},

	// Technology preference
	{
		category: 'technology',
		answerIds: ['latest_tech', 'custom_solutions'],
		scoreType: 'tech',
		scoreValue: 2
	},

	// Work environment
	{
		category: 'environment',
		answerIds: ['remote_work', 'hybrid_model'],
		scoreType: 'wellness',
		scoreValue: 1
	},

	// Meeting style
	{
		category: 'meetings',
		answerIds: ['structured_agenda'],
		scoreType: 'formality',
		scoreValue: 1
	},
	{
		category: 'meetings',
		answerIds: ['brainstorming', 'flexible_discussion'],
		scoreType: 'collaboration',
		scoreValue: 1
	},

	// Feedback preference
	{
		category: 'feedback',
		answerIds: ['regular_checkins', 'peer_reviews', 'real_time'],
		scoreType: 'collaboration',
		scoreValue: 1
	},
	{
		category: 'feedback',
		answerIds: ['regular_checkins', 'annual_reviews'],
		scoreType: 'formality',
		scoreValue: 1
	},

	// Learning style
	{
		category: 'learning',
		answerIds: ['hands_on', 'peer_learning'],
		scoreType: 'tech',
		scoreValue: 1
	},

	// Workspace setup
	{
		category: 'workspace',
		answerIds: ['ergonomic_setup', 'personalized_space'],
		scoreType: 'wellness',
		scoreValue: 2
	},

	// Decision making
	{
		category: 'decision-making',
		answerIds: ['consensus_building'],
		scoreType: 'collaboration',
		scoreValue: 2
	},

	// Work-life balance
	{
		category: 'work-life',
		answerIds: ['strict_boundaries', 'flexible_schedule', 'integrated_life'],
		scoreType: 'wellness',
		scoreValue: 2
	},

	// Recognition
	{
		category: 'recognition',
		answerIds: ['public_recognition', 'peer_appreciation'],
		scoreType: 'collaboration',
		scoreValue: 1
	}
];

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

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
				const answerExists = question.options.some((opt) => opt.id === response.answerId);
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

// ============================================================================
// SCORING FUNCTIONS
// ============================================================================

/**
 * Calculate preference scores based on quiz responses using configurable rules
 */
export function calculatePreferenceScores(responses: ResponseItem[]): PreferenceScores {
	// Validate responses first
	const validation = validateResponses(responses);
	if (!validation.success) {
		console.error('Scoring validation failed:', validation.errors);
		// Return zero scores if validation fails
		return {
			collaboration: 0,
			formality: 0,
			tech: 0,
			wellness: 0
		};
	}

	const validResponses = validation.data!;
	const scores: PreferenceScores = {
		collaboration: 0,
		formality: 0,
		tech: 0,
		wellness: 0
	};

	// Apply scoring rules based on question categories and answer IDs
	validResponses.forEach((response) => {
		const question = questions.find((q) => q.id === response.questionId);
		if (!question) return;

		// Find matching scoring rules
		const matchingRules = SCORING_RULES.filter(
			(rule) => rule.category === question.category && rule.answerIds.includes(response.answerId)
		);

		// Apply scores from matching rules
		matchingRules.forEach((rule) => {
			scores[rule.scoreType] += rule.scoreValue;
		});
	});

	// Normalize scores to 0-10 range with improved algorithm
	Object.keys(scores).forEach((key) => {
		const scoreKey = key as keyof PreferenceScores;
		const rawScore = scores[scoreKey];

		// Use sigmoid-like normalization for better distribution
		// Max possible score is around 15-20 depending on responses
		const normalizedScore = Math.round((rawScore / 15) * 10);
		scores[scoreKey] = Math.min(10, Math.max(0, normalizedScore));
	});

	return scores;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get workplace DNA based on preference scores with improved categorization
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
 * Get generation-specific insights with enhanced validation and error handling
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

// ============================================================================
// LEGACY COMPATIBILITY FUNCTIONS
// ============================================================================

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
		const convertedResponses: ResponseItem[] = responses
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
					questionId: question.id,
					answerId: matchingOption.id
				};
			})
			.filter((response): response is ResponseItem => response !== null);

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

// ============================================================================
// EXPORT LEGACY INTERFACE FOR BACKWARD COMPATIBILITY
// ============================================================================

export interface LegacyResponseItem {
	questionNumber: number;
	answer: string;
}
