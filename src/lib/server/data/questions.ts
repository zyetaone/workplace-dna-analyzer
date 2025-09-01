/**
 * Workplace Preference Quiz Data
 *
 * Well-organized, type-safe question definitions with proper separation of concerns.
 * Supports multiple question types, scoring systems, and demographic data.
 */

import type { QuizQuestionComponent } from '$lib/types';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Generation cohorts for demographic analysis
 */
export type Generation = 'Baby Boomers' | 'Gen X' | 'Millennials' | 'Gen Z';

/**
 * Generation option with metadata
 */
export interface GenerationOption {
	value: Generation;
	label: string;
	description: string;
}

/**
 * Question categories for workplace preferences
 */
export const QUESTION_CATEGORIES = {
	FORMALITY: 'formality',
	COLLABORATION: 'collaboration',
	TECH: 'tech',
	WELLNESS: 'wellness'
} as const;

export type QuestionCategory = (typeof QUESTION_CATEGORIES)[keyof typeof QUESTION_CATEGORIES];

/**
 * Scoring weights for different dimensions
 */
export interface ScoreWeights {
	formality: number;
	collaboration: number;
	tech: number;
	wellness: number;
}

// ============================================================================
// DEMOGRAPHIC DATA
// ============================================================================

/**
 * Generation options for participant selection
 */
export const generationOptions: GenerationOption[] = [
	{
		value: 'Baby Boomers',
		label: 'Baby Boomers (1946-1964)',
		description: 'Traditional workplace values, experience-focused'
	},
	{
		value: 'Gen X',
		label: 'Gen X (1965-1980)',
		description: 'Work-life balance, independence, adaptability'
	},
	{
		value: 'Millennials',
		label: 'Millennials (1981-1996)',
		description: 'Collaboration, purpose-driven, technology-savvy'
	},
	{
		value: 'Gen Z',
		label: 'Gen Z (1997-2012)',
		description: 'Innovation, flexibility, social consciousness'
	}
];

// ============================================================================
// QUESTION DEFINITIONS
// ============================================================================

/**
 * Individual workplace preference questions
 */
const workplaceQuestions: QuizQuestionComponent[] = [
	{
		id: 1,
		text: 'I prefer working in a structured environment with clear guidelines and procedures.',
		type: 'yesno',
		required: true,
		category: QUESTION_CATEGORIES.FORMALITY,
		options: [
			{ id: 'yes', value: 'yes', label: 'Yes', scores: { formality: 3, collaboration: -1 } },
			{ id: 'no', value: 'no', label: 'No', scores: { formality: -1, collaboration: 1 } }
		]
	},
	{
		id: 2,
		text: 'I enjoy brainstorming and collaborating with others on creative projects.',
		type: 'yesno',
		required: true,
		category: QUESTION_CATEGORIES.COLLABORATION,
		options: [
			{ id: 'yes', value: 'yes', label: 'Yes', scores: { collaboration: 3, tech: -1 } },
			{ id: 'no', value: 'no', label: 'No', scores: { collaboration: -1, tech: 1 } }
		]
	},
	{
		id: 3,
		text: 'I prefer using the latest technology and digital tools in my work.',
		type: 'yesno',
		required: true,
		category: QUESTION_CATEGORIES.TECH,
		options: [
			{ id: 'yes', value: 'yes', label: 'Yes', scores: { tech: 3, wellness: -1 } },
			{ id: 'no', value: 'no', label: 'No', scores: { tech: -1, wellness: 1 } }
		]
	},
	{
		id: 4,
		text: 'Work-life balance and wellness initiatives are important to me.',
		type: 'yesno',
		required: true,
		category: QUESTION_CATEGORIES.WELLNESS,
		options: [
			{ id: 'yes', value: 'yes', label: 'Yes', scores: { wellness: 3, formality: -1 } },
			{ id: 'no', value: 'no', label: 'No', scores: { wellness: -1, formality: 1 } }
		]
	},
	{
		id: 5,
		text: 'I thrive in a fast-paced, dynamic work environment.',
		type: 'yesno',
		required: true,
		category: QUESTION_CATEGORIES.FORMALITY,
		options: [
			{ id: 'yes', value: 'yes', label: 'Yes', scores: { formality: -2, collaboration: 2 } },
			{ id: 'no', value: 'no', label: 'No', scores: { formality: 2, collaboration: -2 } }
		]
	}
];

// ============================================================================
// EXPORTED DATA & UTILITIES
// ============================================================================

/**
 * Main questions array - use this for the quiz
 */
export const questions: QuizQuestionComponent[] = workplaceQuestions;

/**
 * Questions grouped by category for analytics and filtering
 */
export const questionsByCategory = {
	[QUESTION_CATEGORIES.FORMALITY]: questions.filter(
		(q) => q.category === QUESTION_CATEGORIES.FORMALITY
	),
	[QUESTION_CATEGORIES.COLLABORATION]: questions.filter(
		(q) => q.category === QUESTION_CATEGORIES.COLLABORATION
	),
	[QUESTION_CATEGORIES.TECH]: questions.filter((q) => q.category === QUESTION_CATEGORIES.TECH),
	[QUESTION_CATEGORIES.WELLNESS]: questions.filter(
		(q) => q.category === QUESTION_CATEGORIES.WELLNESS
	)
} as const;

/**
 * Question metadata for analytics
 */
export const questionMetadata = {
	totalQuestions: questions.length,
	categories: Object.keys(QUESTION_CATEGORIES),
	categoryCounts: Object.entries(questionsByCategory).reduce(
		(acc, [category, questions]) => {
			acc[category as QuestionCategory] = questions.length;
			return acc;
		},
		{} as Record<QuestionCategory, number>
	),
	requiredQuestions: questions.filter((q) => q.required).length
};

/**
 * Validation function for question data integrity
 */
export function validateQuestionData(): { isValid: boolean; errors: string[] } {
	const errors: string[] = [];

	// Check for duplicate IDs
	const ids = questions.map((q) => q.id);
	const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
	if (duplicateIds.length > 0) {
		errors.push(`Duplicate question IDs found: ${duplicateIds.join(', ')}`);
	}

	// Check for missing required fields
	questions.forEach((question) => {
		if (!question.text?.trim()) {
			errors.push(`Question ${question.id} is missing text`);
		}
		if (!question.type) {
			errors.push(`Question ${question.id} is missing type`);
		}
		if (!question.category) {
			errors.push(`Question ${question.id} is missing category`);
		}
		if (!question.options?.length) {
			errors.push(`Question ${question.id} has no options`);
		}
	});

	// Check scoring consistency
	questions.forEach((question) => {
		question.options?.forEach((option) => {
			if (option.scores && Object.keys(option.scores).length !== 4) {
				errors.push(`Question ${question.id} option "${option.label}" has incomplete scoring`);
			}
		});
	});

	return {
		isValid: errors.length === 0,
		errors
	};
}

// ============================================================================
// BACKWARD COMPATIBILITY
// ============================================================================

/**
 * Type alias for backward compatibility
 */
export type Question = QuizQuestionComponent;
