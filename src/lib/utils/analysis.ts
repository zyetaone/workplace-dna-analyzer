/**
 * Comprehensive Workplace Analysis System
 * Analyzes quiz responses to generate insights, charts, and AI concepts
 */

import type { Generation } from '$lib/questions';
import { questions } from '$lib/questions';
import { getWorkplaceDNA } from './scoring';

export interface ParticipantData {
	id: string;
	name: string;
	generation: Generation;
	responses: Record<string, string>;
	preferenceScores: {
		collaboration: number;
		formality: number;
		tech: number;
		wellness: number;
	};
	completed: boolean;
}

export interface GenerationAnalysis {
	generation: Generation;
	count: number;
	percentage: number;
	averageScores: {
		collaboration: number;
		formality: number;
		tech: number;
		wellness: number;
	};
	preferences: Record<string, Record<string, number>>; // category -> option -> count
}

export interface WorkplaceConcept {
	text: string;
	size: number;
	category: string;
	confidence: number;
}

export interface ComprehensiveAnalysis {
	// Basic stats
	totalParticipants: number;
	completedParticipants: number;
	completionRate: number;

	// Generation analysis
	generationBreakdown: GenerationAnalysis[];
	dominantGeneration: Generation;

	// Overall preferences
	averageScores: {
		collaboration: number;
		formality: number;
		tech: number;
		wellness: number;
	};

	// Category preferences
	categoryPreferences: Record<string, Record<string, number>>;

	// Workplace DNA
	workplaceDNA: string;

	// AI-generated concepts
	concepts: WorkplaceConcept[];

	// Chart data
	generationChartData: Array<{
		label: string;
		value: number;
		color: string;
	}>;

	preferenceChartData: Array<{
		category: string;
		generations: Record<Generation, number>;
	}>;
}

/**
 * Analyze all participant responses comprehensively
 */
export function analyzeWorkplaceData(participants: ParticipantData[]): ComprehensiveAnalysis {
	const completedParticipants = participants.filter((p) => p.completed);

	if (completedParticipants.length === 0) {
		return getEmptyAnalysis();
	}

	// 1. Generation breakdown
	const generationBreakdown = analyzeGenerations(completedParticipants);

	// 2. Category preferences
	const categoryPreferences = analyzeCategoryPreferences(completedParticipants);

	// 3. Overall scores
	const averageScores = calculateAverageScores(completedParticipants);

	// 4. Workplace DNA
	const workplaceDNA = getWorkplaceDNA(averageScores);

	// 5. AI concepts (placeholder - will be enhanced with AI)
	const concepts = generateConcepts(averageScores, categoryPreferences, generationBreakdown);

	// 6. Chart data
	const generationChartData = generationBreakdown.map((gen) => ({
		label: gen.generation,
		value: gen.percentage,
		color: getGenerationColor(gen.generation)
	}));

	const preferenceChartData = Object.entries(categoryPreferences).map(([category]) => ({
		category: formatCategoryName(category),
		generations: {} as Record<Generation, number>
	}));

	return {
		totalParticipants: participants.length,
		completedParticipants: completedParticipants.length,
		completionRate: Math.round((completedParticipants.length / participants.length) * 100),

		generationBreakdown,
		dominantGeneration: generationBreakdown.reduce((prev, current) =>
			current.count > prev.count ? current : prev
		).generation,

		averageScores,
		categoryPreferences,
		workplaceDNA,
		concepts,

		generationChartData,
		preferenceChartData
	};
}

/**
 * Analyze generation distribution and preferences
 */
function analyzeGenerations(participants: ParticipantData[]): GenerationAnalysis[] {
	const generations: Record<Generation, ParticipantData[]> = {
		'Baby Boomers': [],
		'Gen X': [],
		Millennials: [],
		'Gen Z': []
	};

	// Group participants by generation
	participants.forEach((participant) => {
		if (generations[participant.generation]) {
			generations[participant.generation].push(participant);
		}
	});

	// Analyze each generation
	return Object.entries(generations)
		.filter(([_, participants]) => participants.length > 0)
		.map(([generation, genParticipants]) => {
			const averageScores = calculateAverageScores(genParticipants);
			const preferences = analyzeCategoryPreferences(genParticipants);

			return {
				generation: generation as Generation,
				count: genParticipants.length,
				percentage: Math.round((genParticipants.length / participants.length) * 100),
				averageScores,
				preferences
			};
		});
}

/**
 * Analyze preferences by category
 */
function analyzeCategoryPreferences(
	participants: ParticipantData[]
): Record<string, Record<string, number>> {
	const categoryStats: Record<string, Record<string, number>> = {};

	// Initialize category stats
	questions.forEach((question) => {
		categoryStats[question.category] = {};
		question.options.forEach((option) => {
			categoryStats[question.category][option.id] = 0;
		});
	});

	// Count responses
	participants.forEach((participant) => {
		Object.entries(participant.responses).forEach(([questionId, answerId]) => {
			const question = questions.find((q) => q.id === questionId);
			if (question && categoryStats[question.category][answerId] !== undefined) {
				categoryStats[question.category][answerId]++;
			}
		});
	});

	return categoryStats;
}

/**
 * Calculate average preference scores
 */
function calculateAverageScores(participants: ParticipantData[]): {
	collaboration: number;
	formality: number;
	tech: number;
	wellness: number;
} {
	if (participants.length === 0) {
		return { collaboration: 0, formality: 0, tech: 0, wellness: 0 };
	}

	const totals = { collaboration: 0, formality: 0, tech: 0, wellness: 0 };

	participants.forEach((participant) => {
		if (participant.preferenceScores) {
			totals.collaboration += participant.preferenceScores.collaboration;
			totals.formality += participant.preferenceScores.formality;
			totals.tech += participant.preferenceScores.tech;
			totals.wellness += participant.preferenceScores.wellness;
		}
	});

	return {
		collaboration: Math.round(totals.collaboration / participants.length),
		formality: Math.round(totals.formality / participants.length),
		tech: Math.round(totals.tech / participants.length),
		wellness: Math.round(totals.wellness / participants.length)
	};
}

/**
 * Generate AI-powered workplace concepts
 */
function generateConcepts(
	averageScores: any,
	categoryPreferences: Record<string, Record<string, number>>,
	generationBreakdown: GenerationAnalysis[]
): WorkplaceConcept[] {
	const concepts: WorkplaceConcept[] = [];

	// Base concepts from scores
	if (averageScores.collaboration > 7) {
		concepts.push({
			text: 'Collaborative Hub',
			size: 8,
			category: 'collaboration',
			confidence: 0.9
		});
	}

	if (averageScores.tech > 7) {
		concepts.push({
			text: 'Smart Workspace',
			size: 7,
			category: 'technology',
			confidence: 0.85
		});
	}

	if (averageScores.wellness > 7) {
		concepts.push({
			text: 'Wellness Oasis',
			size: 6,
			category: 'wellness',
			confidence: 0.8
		});
	}

	// Generation-specific concepts
	const genZ = generationBreakdown.find((g) => g.generation === 'Gen Z');
	if (genZ && genZ.percentage > 20) {
		concepts.push({
			text: 'Innovation Lab',
			size: 5,
			category: 'innovation',
			confidence: 0.75
		});
	}

	const millennials = generationBreakdown.find((g) => g.generation === 'Millennials');
	if (millennials && millennials.percentage > 30) {
		concepts.push({
			text: 'Creative Commons',
			size: 6,
			category: 'creativity',
			confidence: 0.8
		});
	}

	// Category-based concepts
	const techPrefs = categoryPreferences.technology || {};
	const maxTech = Object.entries(techPrefs).reduce((a, b) =>
		techPrefs[a[0]] > techPrefs[b[0]] ? a : b
	);
	if (maxTech[1] > 0) {
		concepts.push({
			text: 'Tech-Forward Environment',
			size: 4,
			category: 'technology',
			confidence: 0.7
		});
	}

	return concepts;
}

/**
 * Get generation color for charts
 */
function getGenerationColor(generation: Generation): string {
	const colors: Record<Generation, string> = {
		'Baby Boomers': '#3B82F6', // Blue
		'Gen X': '#10B981', // Green
		Millennials: '#F59E0B', // Yellow
		'Gen Z': '#EF4444' // Red
	};
	return colors[generation];
}

/**
 * Format category name for display
 */
function formatCategoryName(category: string): string {
	const names: Record<string, string> = {
		communication: 'Communication',
		technology: 'Technology',
		environment: 'Environment',
		meetings: 'Meetings',
		feedback: 'Feedback',
		learning: 'Learning',
		workspace: 'Workspace',
		'decision-making': 'Decision Making',
		'work-life': 'Work-Life Balance',
		recognition: 'Recognition'
	};
	return names[category] || category;
}

/**
 * Get empty analysis for when no data is available
 */
function getEmptyAnalysis(): ComprehensiveAnalysis {
	return {
		totalParticipants: 0,
		completedParticipants: 0,
		completionRate: 0,
		generationBreakdown: [],
		dominantGeneration: 'Millennials',
		averageScores: { collaboration: 0, formality: 0, tech: 0, wellness: 0 },
		categoryPreferences: {},
		workplaceDNA: 'Unknown',
		concepts: [],
		generationChartData: [],
		preferenceChartData: []
	};
}

/**
 * Generate AI-powered concept word cloud (to be called from AI service)
 */
export async function generateConceptWordCloud(
	analysis: ComprehensiveAnalysis
): Promise<WorkplaceConcept[]> {
	// This will be enhanced with AI to generate more sophisticated concepts
	// For now, return the basic concepts
	return analysis.concepts;
}
