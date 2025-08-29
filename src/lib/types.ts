/**
 * Centralized type definitions for the application
 */

// Basic types without external dependencies
export type Generation = 'Baby Boomers' | 'Gen X' | 'Millennials' | 'Gen Z';

// Basic session and participant types
export interface Session {
	id: string;
	code: string;
	name: string;
	isActive: boolean;
	createdAt: string;
	endedAt?: string;
}

export interface Participant {
	id: string;
	sessionId: string;
	name?: string;
	generation?: Generation;
	responses?: Record<number, any>;
	preferenceScores?: PreferenceScores;
	completed: boolean;
	joinedAt: string;
	completedAt?: string;
}

export interface PreferenceScores {
	collaboration: number;
	formality: number;
	tech: number;
	wellness: number;
}

// Connection and real-time types
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface ParticipantUpdate {
	type: 'join' | 'leave' | 'update' | 'complete';
	participant: Participant;
	timestamp: Date;
}

// Analytics and visualization types
export interface LiveAnalytics {
	activeCount: number;
	completedCount: number;
	totalCount: number;
	responseRate: number;
	generationDistribution: Record<Generation, number>;
	preferenceScores: PreferenceScores;
	generationPreferences: GenerationPreferences;
	workplaceDNA: string;
	wordCloudData: WordCloudItem[];
	aiInsights: string[];
	lastUpdated: Date;
}

export interface WordCloudItem {
	text: string;
	size: number;
}

export interface GenerationPreferences {
	[key: string]: {
		count: number;
		collaboration: number;
		formality: number;
		tech: number;
		wellness: number;
	};
}

// UI and component types
export interface SessionStats {
	totalParticipants: number;
	completedParticipants: number;
	activeParticipants: number;
	completionRate: number;
	generationBreakdown: Record<Generation, number>;
	averageScores: PreferenceScores;
	workplaceDNA: PreferenceScores;
}

// Error handling types
export interface AppError {
	message: string;
	code?: string;
	timestamp: Date;
}

// API response types
export interface ApiResponse<T> {
	success: boolean;
	data?: T;
	error?: string;
	message?: string;
}