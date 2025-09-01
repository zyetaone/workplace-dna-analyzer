/**
 * Scoring Module
 * Main exports for the scoring system
 */

// Core types
export type {
	PreferenceScores,
	ResponseItem,
	ScoringRule,
	ValidationResult,
	ScoringResult,
	LegacyResponseItem
} from './types';

// Core functions
export { calculatePreferenceScores, calculateEnhancedPreferenceScores } from './calculator';

// Validation functions
export { validateResponses, validateScoringResponses } from './validation';

// Insights functions
export { getWorkplaceDNA, getGenerationInsights } from './insights';

// Legacy compatibility (deprecated)
export { calculatePreferenceScoresLegacy } from './legacy';
