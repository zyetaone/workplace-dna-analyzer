/**
 * Centralized type definitions for the application
 * Uses both Drizzle ORM types and Valibot schema types
 */

// Re-export Drizzle types from stores
export type { Session, Attendee } from '$lib/stores';

// Re-export Valibot inferred types from schemas
export type {
	PreferenceScores,
	Generation,
	Question,
	QuestionOption,
	WordCloudItem,
	WorkspaceConcept,
	CreateSessionInput,
	JoinSessionInput,
	SaveResponseInput,
	CompleteQuizInput
} from '$lib/schemas';

// Additional types not covered by schemas

export interface GenerationPreferences {
	collaboration: number;
	formality: number;
	technology: number;
	wellness: number;
	count: number;
}

export interface DesignTheme {
	primary: string;
	secondary: string;
	accent: string;
	materials: string[];
	lighting: string;
	furniture: string[];
}

// Type alias for generation distribution
export type GenerationDistribution = {
	'Baby Boomer': number;
	'Gen X': number;
	'Millennial': number;
	'Gen Z': number;
};