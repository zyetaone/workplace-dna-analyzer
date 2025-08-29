/**
 * AI State Management - Svelte 5 Runes
 * Global AI state for workplace insights and recommendations
 */

import type { Session, Participant } from '../../lib/server/db/schema';
import { BaseSessionState } from './admin.svelte';
import { getStreamingInsights, generateSessionSummary } from './[code]/ai.remote';

export interface AIInsight {
	type: 'engagement' | 'completion' | 'timing' | 'workplace' | 'recommendation';
	title: string;
	content: string;
	confidence: number;
	recommendation?: string;
}

export interface WorkplaceAnalysisData {
	totalParticipants: number;
	completedParticipants: number;
	completionRate: number;
	averageScores: {
		collaboration: number;
		formality: number;
		tech: number;
		wellness: number;
	};
	generationBreakdown: Record<string, number>;
	sessionDuration: number;
}

export interface AISessionSummary {
	summary: string;
	keyMetrics: string[];
	recommendations: string[];
	generatedAt: string;
}

// Core reactive state
let aiInsights = $state<AIInsight[]>([]);
let sessionSummary = $state<AISessionSummary | null>(null);
let isLoadingInsights = $state(false);
let isLoadingSummary = $state(false);
let error = $state<string | null>(null);
let lastGenerated = $state<string | null>(null);

// Computed properties
const hasInsights = $derived(aiInsights.length > 0);
const hasSummary = $derived(sessionSummary !== null);
const isLoading = $derived(isLoadingInsights || isLoadingSummary);

// AI state methods
export function setInsights(insights: AIInsight[]) {
	aiInsights = [...insights];
}

export function setSessionSummary(summary: AISessionSummary | null) {
	sessionSummary = summary;
}

export function setLoadingInsights(loading: boolean) {
	isLoadingInsights = loading;
}

export function setLoadingSummary(loading: boolean) {
	isLoadingSummary = loading;
}

export function setError(err: string | null) {
	error = err;
}

export function setLastGenerated(timestamp: string) {
	lastGenerated = timestamp;
}

// Export reactive state getters
export function getInsights() {
	return aiInsights;
}
export function getSessionSummary() {
	return sessionSummary;
}
export function getIsLoadingInsights() {
	return isLoadingInsights;
}
export function getIsLoadingSummary() {
	return isLoadingSummary;
}
export function getError() {
	return error;
}
export function getLastGenerated() {
	return lastGenerated;
}
export function getHasInsights() {
	return hasInsights;
}
export function getHasSummary() {
	return hasSummary;
}
export function getIsLoading() {
	return isLoading;
}

/**
 * AI Session State - Extends Base Session State
 * Specialized for AI operations and insights generation
 */
export class AISessionState extends BaseSessionState {
	// AI-specific state
	insights = $state<AIInsight[]>([]);
	summary = $state<AISessionSummary | null>(null);
	lastGenerated = $state<string | null>(null);

	// AI-specific computed properties
	hasInsights = $derived(this.insights.length > 0);
	hasSummary = $derived(this.summary !== null);

	// AI Operations
	async generateInsights() {
		if (!this.session || this.completedParticipants.length === 0) {
			return { success: false, error: 'No completed participants to analyze' };
		}

		this.loading = true;
		this.error = null;

		try {
			const result = await getStreamingInsights({ code: this.session.code });

			if (result.insights) {
				// Cast the insights to proper types
				this.insights = result.insights.map((insight: any) => ({
					...insight,
					type: insight.type as AIInsight['type']
				}));
				this.lastGenerated = result.generatedAt;
				return { success: true, insights: this.insights };
			} else {
				throw new Error('No insights generated');
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to generate insights';
			this.error = errorMessage;
			return { success: false, error: errorMessage };
		} finally {
			this.loading = false;
		}
	}

	async generateSummary() {
		if (!this.session) {
			return { success: false, error: 'No session available' };
		}

		this.loading = true;
		this.error = null;

		try {
			const result = await generateSessionSummary({ code: this.session.code });

			this.summary = result;
			this.lastGenerated = result.generatedAt;
			return { success: true, summary: result };
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to generate summary';
			this.error = errorMessage;
			return { success: false, error: errorMessage };
		} finally {
			this.loading = false;
		}
	}

	// Refresh all AI content
	async refreshAll() {
		const results = await Promise.allSettled([this.generateInsights(), this.generateSummary()]);

		const insightsResult = results[0];
		const summaryResult = results[1];

		return {
			insights: insightsResult.status === 'fulfilled' ? insightsResult.value : null,
			summary: summaryResult.status === 'fulfilled' ? summaryResult.value : null
		};
	}

	// Clear AI state
	clear() {
		this.insights = [];
		this.summary = null;
		this.loading = false;
		this.error = null;
		this.lastGenerated = null;
	}

	// Get workplace analysis data for AI prompts
	getWorkplaceAnalysisData(): WorkplaceAnalysisData | null {
		const completedParticipants = this.participants.filter((p) => p.completed);

		if (completedParticipants.length === 0) {
			return null;
		}

		// Calculate average scores
		const totals = { collaboration: 0, formality: 0, tech: 0, wellness: 0 };
		let generationBreakdown: Record<string, number> = {};

		completedParticipants.forEach((p) => {
			if (p.preferenceScores) {
				const scores = p.preferenceScores as any;
				totals.collaboration += scores.collaboration || 0;
				totals.formality += scores.formality || 0;
				totals.tech += scores.tech || scores.technology || 0;
				totals.wellness += scores.wellness || 0;
			}

			const gen = p.generation || 'Unknown';
			generationBreakdown[gen] = (generationBreakdown[gen] || 0) + 1;
		});

		const averages = {
			collaboration: Math.round(totals.collaboration / completedParticipants.length),
			formality: Math.round(totals.formality / completedParticipants.length),
			tech: Math.round(totals.tech / completedParticipants.length),
			wellness: Math.round(totals.wellness / completedParticipants.length)
		};

		return {
			totalParticipants: this.participants.length,
			completedParticipants: completedParticipants.length,
			completionRate: Math.round((completedParticipants.length / this.participants.length) * 100),
			averageScores: averages,
			generationBreakdown,
			sessionDuration: this.session
				? new Date().getTime() - new Date(this.session.createdAt).getTime()
				: 0
		};
	}
}

// AI session store instances
const aiSessionStores = new Map<string, AISessionState>();

export function getAISessionStore(sessionCode: string): AISessionState {
	if (!aiSessionStores.has(sessionCode)) {
		aiSessionStores.set(sessionCode, new AISessionState());
	}
	return aiSessionStores.get(sessionCode)!;
}

export function clearAISessionStore(sessionCode: string) {
	const store = aiSessionStores.get(sessionCode);
	if (store) {
		store.clear();
		aiSessionStores.delete(sessionCode);
	}
}

// Global AI operations
export async function generateGlobalInsights(sessionCode: string) {
	const store = getAISessionStore(sessionCode);
	return await store.generateInsights();
}

export async function generateGlobalSummary(sessionCode: string) {
	const store = getAISessionStore(sessionCode);
	return await store.generateSummary();
}
