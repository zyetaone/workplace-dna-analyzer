/**
 * Scoring Types
 * Type definitions for the scoring system
 */

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
	category: string;
	answerIds: string[];
	scoreType: keyof PreferenceScores;
	scoreValue: number;
}

export interface ValidationResult {
	success: boolean;
	data?: ResponseItem[];
	errors?: string[];
}

export interface ScoringResult {
	scores: PreferenceScores;
	insights: string[];
	percentiles?: Record<string, number>;
}

export interface LegacyResponseItem {
	questionNumber: number;
	answer: string;
}
