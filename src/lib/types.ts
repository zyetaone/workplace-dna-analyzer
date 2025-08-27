/**
 * Centralized type definitions for the application
 */

// Import Drizzle types for internal use
import type { Session as _Session, Participant as _Participant, PreferenceScores as _PreferenceScores } from '$lib/server/db/schema';

// Import GenerationOption from questions.ts as the single source of truth
import type { GenerationOption } from '$lib/questions';

// Additional types

// Re-export GenerationOption as Generation for backwards compatibility
export type Generation = GenerationOption;

export interface GenerationPreferences {
	collaboration: number;
	formality: number;
	tech: number;
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

// Word cloud visualization
export interface WordCloudItem {
	text: string;
	size: number; // The size/value for the word cloud visualization
}

// Connection status for real-time features
export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'error';

// Analytics interfaces for dashboard and presenter views
export interface SessionAnalytics {
	activeCount: number;
	completedCount: number;
	totalCount: number;
	responseRate: number;
	generationDistribution: Record<Generation, number>;
	preferenceScores: _PreferenceScores;
	generationPreferences: GenerationPreferences;
	workplaceDNA: string;
	wordCloudData: WordCloudItem[];
	computedAt: Date;
	aiInsights?: string[];
}

export interface LiveAnalytics {
	activeCount: number;
	completedCount: number;
	totalCount: number;
	responseRate: number;
	generationDistribution: Record<Generation, number>;
	preferenceScores: _PreferenceScores;
	generationPreferences?: GenerationPreferences;
	workplaceDNA: string;
	wordCloudData: WordCloudItem[];
	aiInsights?: string[];
	lastUpdated: Date;
}

// Participant update event for real-time notifications
export interface ParticipantUpdate {
	type: 'join' | 'update' | 'complete' | 'leave';
	participant: _Participant;
	timestamp: Date;
}

// Workspace concept for AI generation
export interface WorkspaceConcept {
	name: string;
	description: string;
	features: string[];
}

// Re-export Drizzle types for external use
export type { 
	Session, 
	Participant,
	PreferenceScores 
} from '$lib/server/db/schema';