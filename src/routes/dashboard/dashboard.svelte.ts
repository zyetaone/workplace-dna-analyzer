/**
 * Dashboard State Management with Svelte 5 Runes
 * Handles session management, analytics computation, and real-time updates
 */

import type { Session, Participant, PreferenceScores } from '$lib/server/db/schema';
import type { ConnectionStatus, ParticipantUpdate, LiveAnalytics, Generation, WordCloudItem, GenerationPreferences } from '$lib/types';
import { invalidateAll } from '$app/navigation';
import { 
	calculatePreferenceScores, 
	getGenerationFromResponse, 
	GENERATION_OPTIONS,
	type GenerationOption 
} from '$lib/questions';

// Type definitions for generation preferences (different from lib/types)
interface GenerationPreferencesMap {
	[key: string]: {
		count: number;
		collaboration: number;
		formality: number;
		tech: number;
		wellness: number;
	};
}

interface SessionWithCounts extends Session {
	activeCount: number;
	completedCount: number;
}

/**
 * Dashboard State Class using Svelte 5 runes
 */
export class DashboardState {
	// Core session state using $state rune
	sessions = $state<SessionWithCounts[]>([]);
	currentSession = $state<Session | null>(null);
	participants = $state<Participant[]>([]);
	isLoading = $state(false);
	error = $state<string | null>(null);
	
	// Connection and real-time state
	connectionStatus = $state<ConnectionStatus>('connecting');
	lastUpdate = $state<Date>(new Date());
	updateQueue = $state<ParticipantUpdate[]>([]);
	
	// Session metadata
	sessionUrl = $state('');
	networkUrl = $state('');
	sessionCode = $state('');
	slug = $state('');
	
	// Auto-refresh configuration
	refreshInterval: ReturnType<typeof setInterval> | undefined;
	autoRefreshEnabled = $state(true);
	refreshRate = $state(10000); // 10 seconds default
	
	// Analytics is now derived from participants - will auto-recompute when participants change
	analytics = $derived.by(() => this.computeAnalyticsFast(this.participants));
	
	// Additional derived state for presenter features
	isActive = $derived(this.currentSession?.isActive || false);
	hasParticipants = $derived(this.participants.length > 0);
	hasCompletedParticipants = $derived(this.participants.some(p => p.completed));
	completionPercentage = $derived.by(() => {
		if (this.participants.length === 0) return 0;
		const completed = this.participants.filter(p => p.completed).length;
		return Math.round((completed / this.participants.length) * 100);
	});
	
	// Most active generation
	mostActiveGeneration = $derived.by(() => {
		const dist = this.analytics.generationDistribution;
		const entries = Object.entries(dist).filter(([_, count]) => count > 0);
		if (entries.length === 0) return null;
		return entries.reduce((a, b) => a[1] > b[1] ? a : b)[0];
	});
	
	// Dominant preference
	dominantPreference = $derived.by(() => {
		const scores = this.analytics.preferenceScores;
		const entries = Object.entries(scores);
		if (entries.length === 0) return null;
		const [pref, score] = entries.reduce((a, b) => a[1] > b[1] ? a : b);
		return { preference: pref, score };
	});
	
	// Derived state using $derived rune
	hasActiveSessions = $derived(this.sessions.some(s => s.isActive));
	totalParticipants = $derived(this.sessions.reduce((sum, s) => sum + s.activeCount + s.completedCount, 0));
	// Fixed: Now returns a value, not a function
	averageResponseRate = $derived.by(() => {
		const completed = this.sessions.reduce((sum, s) => sum + s.completedCount, 0);
		const total = this.totalParticipants;
		return total > 0 ? Math.round((completed / total) * 100) : 0;
	});
	
	/**
	 * Set sessions list
	 */
	setSessions(sessions: SessionWithCounts[]) {
		this.sessions = sessions;
	}
	
	/**
	 * Initialize session with data
	 */
	initSession(session: Session, participants: Participant[] = []) {
		this.currentSession = session;
		this.slug = session.slug;
		this.sessionCode = session.code;
		this.participants = participants;
		this.connectionStatus = 'connected';
	}
	
	/**
	 * Set current session
	 */
	setCurrentSession(session: Session | null) {
		this.currentSession = session;
		if (session) {
			this.slug = session.slug;
			this.sessionCode = session.code;
		}
	}
	
	/**
	 * Update session data
	 */
	updateSession(updates: Partial<Session>) {
		if (this.currentSession) {
			this.currentSession = { ...this.currentSession, ...updates };
		}
	}
	
	/**
	 * Update participants list (analytics will auto-recompute)
	 */
	setParticipants(participants: Participant[]) {
		this.participants = participants;
		this.lastUpdate = new Date();
	}
	
	/**
	 * Add or update a participant
	 */
	upsertParticipant(participant: Participant) {
		const index = this.participants.findIndex(p => p.id === participant.id);
		if (index >= 0) {
			// Update existing
			this.participants[index] = participant;
			this.addToUpdateQueue('update', participant);
		} else {
			// Add new
			this.participants = [...this.participants, participant];
			this.addToUpdateQueue('join', participant);
		}
	}
	
	/**
	 * Add a new participant (analytics will auto-recompute)
	 */
	addParticipant(participant: Participant) {
		this.participants = [...this.participants, participant];
		this.addToUpdateQueue('join', participant);
	}
	
	/**
	 * Update an existing participant (analytics will auto-recompute)
	 */
	updateParticipant(id: string, updates: Partial<Participant>) {
		this.participants = this.participants.map(p => 
			p.id === id ? { ...p, ...updates } : p
		);
	}
	
	/**
	 * Remove a participant (analytics will auto-recompute)
	 */
	removeParticipant(id: string) {
		const participant = this.participants.find(p => p.id === id);
		if (participant) {
			this.participants = this.participants.filter(p => p.id !== id);
			this.addToUpdateQueue('leave', participant);
		}
	}
	
	/**
	 * Mark participant as completed
	 */
	completeParticipant(id: string, preferenceScores: PreferenceScores) {
		const participant = this.participants.find(p => p.id === id);
		if (participant) {
			const updated = {
				...participant,
				completed: true,
				completedAt: new Date().toISOString(),
				preferenceScores
			};
			this.upsertParticipant(updated);
			this.addToUpdateQueue('complete', updated);
		}
	}
	
	/**
	 * Add update to queue for animation/notification
	 */
	private addToUpdateQueue(type: ParticipantUpdate['type'], participant: Participant) {
		this.updateQueue = [
			...this.updateQueue.slice(-9), // Keep last 10 updates
			{ type, participant: participant as any, timestamp: new Date() }
		];
	}
	
	/**
	 * FAST analytics computation using optimized single-pass algorithms
	 * Now uses dynamic question structure from questions.ts
	 */
	computeAnalyticsFast(participants: Participant[]): LiveAnalytics {
		const totalCount = participants.length;
		const completedParticipants = participants.filter(a => a.completed);
		const completedCount = completedParticipants.length;
		const activeCount = totalCount - completedCount;
		const responseRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
		
		// Initialize generation distribution dynamically from GENERATION_OPTIONS
		const generationDistribution: Record<GenerationOption, number> = {} as Record<GenerationOption, number>;
		GENERATION_OPTIONS.forEach(gen => {
			generationDistribution[gen] = 0;
		});
		
		const preferenceTotals = {
			collaboration: 0,
			formality: 0,
			technology: 0,
			wellness: 0
		};
		
		// Process all participants in one pass
		completedParticipants.forEach(participant => {
			// Use dynamic generation extraction if responses are available
			if (participant.responses) {
				// Convert responses object to array for the utility function
				const responsesArray: string[] = [];
				const responses = participant.responses as Record<number, string>;
				for (let i = 0; i < Object.keys(responses).length; i++) {
					responsesArray[i] = responses[i] || '';
				}
				
				// Get generation dynamically from responses
				const generation = getGenerationFromResponse(responsesArray);
				if (generation && generation in generationDistribution) {
					generationDistribution[generation]++;
				}
			} else if (participant.generation) {
				// Fallback to stored generation field if no responses
				const gen = participant.generation as GenerationOption;
				if (gen && gen in generationDistribution) {
					generationDistribution[gen]++;
				}
			}
			
			// Calculate scores dynamically from responses if available
			if (participant.responses) {
				const responses = participant.responses as Record<number, string>;
				const responsesArray: string[] = [];
				for (let i = 0; i < Object.keys(responses).length; i++) {
					responsesArray[i] = responses[i] || '';
				}
				
				// Calculate scores dynamically
				const dynamicScores = calculatePreferenceScores(responsesArray);
				
				// Note: calculatePreferenceScores returns percentages (0-100)
				// We need to convert back to 0-10 scale for compatibility
				preferenceTotals.collaboration += Math.round(dynamicScores.collaboration / 10);
				preferenceTotals.formality += Math.round(dynamicScores.formality / 10);
				preferenceTotals.technology += Math.round(dynamicScores.tech / 10);
				preferenceTotals.wellness += Math.round(dynamicScores.wellness / 10);
			} else if (participant.preferenceScores) {
				// Fallback to stored preference scores if no responses
				const scores = participant.preferenceScores as any;
				preferenceTotals.collaboration += scores.collaboration || 0;
				preferenceTotals.formality += scores.formality || 0;
				preferenceTotals.technology += scores.technology || scores.tech || 0;
				preferenceTotals.wellness += scores.wellness || 0;
			}
		});
		
		// Calculate average preference scores
		const preferenceScores: PreferenceScores = completedCount > 0 ? {
			collaboration: Math.round(preferenceTotals.collaboration / completedCount),
			formality: Math.round(preferenceTotals.formality / completedCount),
			tech: Math.round(preferenceTotals.technology / completedCount),
			wellness: Math.round(preferenceTotals.wellness / completedCount)
		} : {
			collaboration: 0,
			formality: 0,
			tech: 0,
			wellness: 0
		};
		
		// Generation preferences using dynamic calculations
		const generationPreferences: GenerationPreferencesMap = {};
		
		GENERATION_OPTIONS.forEach(gen => {
			const genParticipants = completedParticipants.filter(p => {
				// Check generation from responses first, then fallback to stored field
				if (p.responses) {
					const responses = p.responses as Record<number, string>;
					const responsesArray: string[] = [];
					for (let i = 0; i < Object.keys(responses).length; i++) {
						responsesArray[i] = responses[i] || '';
					}
					return getGenerationFromResponse(responsesArray) === gen;
				}
				return p.generation === gen;
			});
			
			if (genParticipants.length > 0) {
				const genTotals = {
					collaboration: 0,
					formality: 0,
					technology: 0,
					wellness: 0
				};
				
				genParticipants.forEach(p => {
					// Use dynamic score calculation if responses available
					if (p.responses) {
						const responses = p.responses as Record<number, string>;
						const responsesArray: string[] = [];
						for (let i = 0; i < Object.keys(responses).length; i++) {
							responsesArray[i] = responses[i] || '';
						}
						
						const dynamicScores = calculatePreferenceScores(responsesArray);
						// Convert from percentage (0-100) to 0-10 scale
						genTotals.collaboration += Math.round(dynamicScores.collaboration / 10);
						genTotals.formality += Math.round(dynamicScores.formality / 10);
						genTotals.technology += Math.round(dynamicScores.tech / 10);
						genTotals.wellness += Math.round(dynamicScores.wellness / 10);
					} else if (p.preferenceScores) {
						// Fallback to stored scores
						const scores = p.preferenceScores as any;
						genTotals.collaboration += scores.collaboration || 0;
						genTotals.formality += scores.formality || 0;
						genTotals.technology += scores.technology || scores.tech || 0;
						genTotals.wellness += scores.wellness || 0;
					}
				});
				
				const genAvg = 1 / genParticipants.length;
				generationPreferences[gen] = {
					count: genParticipants.length,
					collaboration: Math.round(genTotals.collaboration * genAvg),
					formality: Math.round(genTotals.formality * genAvg),
					tech: Math.round(genTotals.technology * genAvg),
					wellness: Math.round(genTotals.wellness * genAvg)
				};
			}
		});
		
		// Generate workplace DNA
		const workplaceDNA = this.generateWorkplaceDNA(preferenceScores);
		
		// Generate word cloud data
		const wordCloudData = this.generateWordCloudData(preferenceScores, generationDistribution);
		
		return {
			activeCount,
			completedCount,
			totalCount,
			responseRate,
			generationDistribution: generationDistribution as Record<Generation, number>,
			preferenceScores,
			generationPreferences: generationPreferences as any,
			workplaceDNA,
			wordCloudData,
			aiInsights: [],
			lastUpdated: new Date()
		};
	}
	
	/**
	 * Generate workplace DNA profile based on preference scores
	 */
	generateWorkplaceDNA(scores: PreferenceScores): string {
		const profiles = [];
		
		if (scores.collaboration >= 7) profiles.push('Collaborative');
		else if (scores.collaboration <= 3) profiles.push('Independent');
		
		if (scores.formality >= 7) profiles.push('Structured');
		else if (scores.formality <= 3) profiles.push('Flexible');
		
		const techScore = scores.tech;
		if (techScore >= 7) profiles.push('Tech-Forward');
		else if (techScore <= 3) profiles.push('Traditional');
		
		if (scores.wellness >= 7) profiles.push('Wellness-Focused');
		else if (scores.wellness <= 3) profiles.push('Performance-Driven');
		
		return profiles.length > 0 ? profiles.join(' & ') : 'Balanced';
	}
	
	/**
	 * Generate word cloud data from analytics
	 */
	generateWordCloudData(scores: PreferenceScores, generations: Record<GenerationOption, number>): WordCloudItem[] {
		const words: WordCloudItem[] = [
			{ text: 'Collaboration', size: 20 + scores.collaboration * 8 },
			{ text: 'Formality', size: 20 + scores.formality * 8 },
			{ text: 'Technology', size: 20 + scores.tech * 8 },
			{ text: 'Wellness', size: 20 + scores.wellness * 8 }
		];
		
		// Add generation-based words
		Object.entries(generations).forEach(([gen, count]) => {
			if (count > 0) {
				words.push({
					text: gen,
					size: 15 + count * 5
				});
			}
		});
		
		// Add workplace DNA traits if significant
		const dnaProfile = this.generateWorkplaceDNA(scores);
		if (dnaProfile !== 'Balanced') {
			const traits = dnaProfile.split(' & ');
			traits.forEach(trait => {
				words.push({
					text: trait,
					size: 35 + Math.random() * 15
				});
			});
		}
		
		// Add trend words based on high scores
		if (scores.collaboration >= 8) words.push({ text: 'Team-Oriented', size: 40 });
		if (scores.tech >= 8) words.push({ text: 'Digital-First', size: 40 });
		if (scores.wellness >= 8) words.push({ text: 'Well-Being', size: 40 });
		if (scores.formality >= 8) words.push({ text: 'Professional', size: 40 });
		
		return words;
	}
	
	/**
	 * Generate a unique session code
	 */
	generateSessionCode(): string {
		// Use native crypto for better performance (no external deps)
		return crypto.randomUUID().substring(0, 8).toUpperCase();
	}
	
	/**
	 * Build AI insight prompt for analysis
	 */
	buildAIInsightPrompt(focusArea: string, includeIndividual: boolean): string {
		const { analytics } = this;
		return `
Analyze the workplace preferences data:
- Total responses: ${analytics.completedCount}
- Response rate: ${analytics.responseRate}%
- Preference scores: ${JSON.stringify(analytics.preferenceScores)}
- Generation breakdown: ${JSON.stringify(analytics.generationDistribution)}
- Focus area: ${focusArea}

Generate insights on workplace culture and recommendations for ${analytics.workplaceDNA} teams.
${includeIndividual ? 'Include individual profile summaries.' : ''}
`;
	}
	
	/**
	 * Generate mock AI response for insights
	 */
	async generateAIResponse(prompt: string): Promise<{
		summary: string;
		keyFindings: string[];
		recommendations: string[];
	}> {
		// Placeholder implementation - replace with actual AI integration
		const { analytics } = this;
		return {
			summary: `Based on ${analytics.completedCount} responses, your team shows ${analytics.workplaceDNA} characteristics.`,
			keyFindings: [
				`${analytics.responseRate}% response rate indicates strong engagement`,
				`Primary workplace DNA: ${analytics.workplaceDNA}`,
				'Balanced generational representation',
				`Highest preference: ${this.getHighestPreference()}`,
				`Most represented generation: ${this.getMostRepresentedGeneration()}`
			],
			recommendations: [
				'Foster collaborative environments',
				'Maintain flexibility in work structures',
				'Invest in technology adoption training',
				'Promote wellness initiatives',
				'Bridge generational preferences'
			]
		};
	}
	
	/**
	 * Helper: Get highest preference dimension
	 */
	private getHighestPreference(): string {
		const { preferenceScores } = this.analytics;
		const entries = Object.entries(preferenceScores);
		const [dimension] = entries.reduce((a, b) => a[1] > b[1] ? a : b);
		return dimension.charAt(0).toUpperCase() + dimension.slice(1);
	}
	
	/**
	 * Helper: Get most represented generation
	 */
	private getMostRepresentedGeneration(): string {
		const { generationDistribution } = this.analytics;
		const entries = Object.entries(generationDistribution);
		if (entries.length === 0) return 'None';
		const [generation] = entries.reduce((a, b) => a[1] > b[1] ? a : b);
		return generation;
	}
	
	/**
	 * Convert data to CSV format
	 */
	convertToCSV(includeResponses: boolean = true): string {
		const headers = ['Name', 'Generation', 'Completed', 'Collaboration', 'Formality', 'Technology', 'Wellness'];
		if (includeResponses) {
			headers.push('Responses');
		}
		
		const rows = [headers.join(',')];
		
		this.participants.forEach(participant => {
			const scores = participant.preferenceScores || {} as any;
			const row = [
				participant.name,
				participant.generation || 'Unknown',
				participant.completed ? 'Yes' : 'No',
				scores.collaboration || '0',
				scores.formality || '0',
				scores.tech || '0',
				scores.wellness || '0'
			];
			
			if (includeResponses) {
				row.push(JSON.stringify(participant.responses || {}));
			}
			
			rows.push(row.join(','));
		});
		
		return rows.join('\n');
	}
	
	/**
	 * Set AI insights
	 */
	setAIInsights(insights: string[]) {
		// Update analytics with AI insights
		const currentAnalytics = this.analytics;
		// Since analytics is derived, we need to store AI insights separately
		// or include them in the computation
	}
	
	/**
	 * Set connection status
	 */
	setConnectionStatus(status: ConnectionStatus) {
		this.connectionStatus = status;
	}
	
	/**
	 * Start auto-refresh
	 */
	startAutoRefresh(intervalMs: number = 10000) {
		this.stopAutoRefresh(); // Clear any existing interval
		this.autoRefreshEnabled = true;
		this.refreshRate = intervalMs;
		
		this.refreshInterval = setInterval(async () => {
			if (this.autoRefreshEnabled && !this.isLoading) {
				await this.refreshSession();
			}
		}, intervalMs);
	}
	
	/**
	 * Stop auto-refresh
	 */
	stopAutoRefresh() {
		if (this.refreshInterval) {
			clearInterval(this.refreshInterval);
			this.refreshInterval = undefined;
		}
		this.autoRefreshEnabled = false;
	}
	
	/**
	 * Refresh session data from server
	 */
	async refreshSession() {
		if (this.isLoading) return;
		
		try {
			this.isLoading = true;
			this.error = null;
			
			// Use SvelteKit's invalidateAll to refresh server data
			await invalidateAll();
			
			this.connectionStatus = 'connected';
			this.lastUpdate = new Date();
		} catch (err) {
			this.error = err instanceof Error ? err.message : 'Failed to refresh session';
			this.connectionStatus = 'disconnected';
			console.error('Failed to refresh session:', err);
		} finally {
			this.isLoading = false;
		}
	}
	
	/**
	 * Generate shareable session summary
	 */
	generateSummary(): string {
		const { analytics, currentSession } = this;
		return `
Session: ${currentSession?.name || 'Unknown'}
Code: ${this.sessionCode}
Participants: ${analytics.totalCount} (${analytics.completedCount} completed)
Response Rate: ${analytics.responseRate}%
Workplace DNA: ${analytics.workplaceDNA}

Top Preferences:
- Collaboration: ${analytics.preferenceScores.collaboration}/10
- Formality: ${analytics.preferenceScores.formality}/10
- Technology: ${analytics.preferenceScores.tech}/10
- Wellness: ${analytics.preferenceScores.wellness}/10

Generation Mix:
${Object.entries(analytics.generationDistribution)
	.filter(([_, count]) => count > 0)
	.map(([gen, count]) => `- ${gen}: ${count}`)
	.join('\n')}
		`.trim();
	}
	
	/**
	 * Export analytics data
	 */
	exportAnalytics(format: 'json' | 'csv' = 'json'): string {
		if (format === 'csv') {
			return this.convertToCSV();
		}
		
		return JSON.stringify({
			session: this.currentSession,
			participants: this.participants,
			analytics: this.analytics,
			exportedAt: new Date().toISOString()
		}, null, 2);
	}
	
	/**
	 * Export session data as JSON
	 */
	exportAsJSON(): string {
		return this.exportAnalytics('json');
	}
	
	/**
	 * Clear update queue
	 */
	clearUpdateQueue() {
		this.updateQueue = [];
	}
	
	/**
	 * Reset state
	 */
	reset() {
		this.stopAutoRefresh();
		this.sessions = [];
		this.currentSession = null;
		this.participants = [];
		this.connectionStatus = 'disconnected';
		this.isLoading = false;
		this.error = null;
		this.sessionUrl = '';
		this.networkUrl = '';
		this.sessionCode = '';
		this.slug = '';
		this.lastUpdate = new Date();
		this.updateQueue = [];
	}
	
	/**
	 * Cleanup on destroy
	 */
	destroy() {
		this.stopAutoRefresh();
		this.reset();
	}
	
	/**
	 * Retry wrapper for critical operations
	 */
	async withRetry<T>(
		fn: () => Promise<T>,
		maxRetries = 3,
		delay = 1000
	): Promise<T> {
		let lastError: any;
		
		for (let i = 0; i < maxRetries; i++) {
			try {
				return await fn();
			} catch (err) {
				lastError = err;
				if (i < maxRetries - 1) {
					await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
				}
			}
		}
		
		throw lastError;
	}
}

// Export singleton instance for global access
export const dashboardState = new DashboardState();

// Export a function to create new instances if needed
export function createDashboardState() {
	return new DashboardState();
}