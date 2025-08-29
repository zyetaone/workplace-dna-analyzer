/**
 * Admin Dashboard Session Store - Modern Svelte 5 Runes
 * Handles session management, analytics computation, and real-time updates
 */

import type { Session, Participant, PreferenceScores } from '../../lib/server/db/schema';
import type { ConnectionStatus, ParticipantUpdate, LiveAnalytics, Generation, WordCloudItem, GenerationPreferences } from '../../lib/types';
import { getAllSessionsRemote, createSessionRemote, deleteSessionRemote } from './data.remote';

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

export interface SessionWithCounts extends Session {
	activeCount: number;
	completedCount: number;
}

// Re-export types for convenience
export type { Session, Participant, PreferenceScores, Generation };

// Core session state using Svelte 5 runes
let sessions = $state<SessionWithCounts[]>([]);
let currentSession = $state<Session | null>(null);
let participants = $state<Participant[]>([]);
let isLoading = $state(false);
let error = $state<string | null>(null);

// Connection and real-time state
let connectionStatus = $state<ConnectionStatus>('connecting');
let lastUpdate = $state<Date>(new Date());
let updateQueue = $state<ParticipantUpdate[]>([]);

// Session metadata
let sessionCode = $state('');
let sessionUrl = $state('');
let networkUrl = $state('');

// Alias for admin sessions (same as sessions for now)
const adminSessions = sessions;

// Analytics computed from current participants using $derived
const analytics = $derived(() => computeAnalyticsFast(participants));

// Additional computed state for presenter features using $derived
const isActive = $derived(() => currentSession?.isActive || false);
const hasParticipants = $derived(() => participants.length > 0);
const hasCompletedParticipants = $derived(() => participants.some(p => p.completed));
const completionPercentage = $derived(() => {
    if (participants.length === 0) return 0;
    const completed = participants.filter(p => p.completed).length;
    return Math.round((completed / participants.length) * 100);
});

// Most active generation using $derived
const mostActiveGeneration = $derived(() => {
    const dist = analytics().generationDistribution;
    const entries = Object.entries(dist).filter(([_, count]) => count > 0);
    if (entries.length === 0) return null;
    return entries.reduce((a, b) => a[1] > b[1] ? a : b)[0];
});

// Dominant preference using $derived
const dominantPreference = $derived(() => {
    const scores = analytics().preferenceScores;
    const entries = Object.entries(scores) as [string, number][];
    if (entries.length === 0) return null;
    const [pref, score] = entries.reduce((a, b) => a[1] > b[1] ? a : b);
    return { preference: pref, score };
});

const insights = $derived(() => {
    const analyticsData = analytics();
    if (!analyticsData || !analyticsData.preferenceScores) return null;

    const scores = analyticsData.preferenceScores;
    const topPreference = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
    const generation = Object.entries(analyticsData.generationDistribution).sort((a, b) => b[1] - a[1])[0];

    return {
      topPreference: {
        trait: topPreference[0],
        score: topPreference[1],
        label: getPreferenceLabel(topPreference[0])
      },
      generation: generation ? generation[0] : null,
      recommendations: generateRecommendations(scores),
      officeAnalysis: generateOfficeAnalysis(scores, analyticsData.generationDistribution),
      layoutSuggestions: generateLayoutSuggestions(scores)
    };
});

const avgTime = $derived(() => {
    if (!participants || participants.length === 0) return "N/A";
    const completed = participants.filter(p => p.completed && p.completedAt && p.joinedAt);
    if (completed.length === 0) return "N/A";

    const times = completed.map(p => {
      const start = new Date(p.joinedAt).getTime();
      const end = new Date(p.completedAt!).getTime();
      return end - start;
    });

    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const minutes = Math.floor(avg / 60000);
    const seconds = Math.floor((avg % 60000) / 1000);

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
});


// Computed state for sessions using $derived
const hasActiveSessions = $derived(() => sessions.some(s => s.isActive));
const totalParticipants = $derived(() =>
    sessions.reduce((sum, s) => sum + s.activeCount + s.completedCount, 0)
);
const averageResponseRate = $derived(() => {
    const completed = sessions.reduce((sum, s) => sum + s.completedCount, 0);
    const total = totalParticipants();
    return total > 0 ? Math.round((completed / total) * 100) : 0;
});

// Admin-level computed state
const adminStatsDerived = $derived({
    total: adminSessions.length,
    active: adminSessions.filter(s => s.isActive).length,
    totalParticipants: adminSessions.reduce((sum, s) => sum + (s.activeCount + s.completedCount), 0),
    completedSurveys: adminSessions.reduce((sum, s) => sum + s.completedCount, 0)
});

// Export function to get current admin stats
export function getAdminStats() {
    return adminStatsDerived;
}

/**
 * Set sessions list
 */
export function setSessions(newSessions: SessionWithCounts[]) {
    sessions = [...newSessions];
}

/**
 * Initialize session with data
 */
export function initSession(session: Session, newParticipants: Participant[] = []) {
    currentSession = session;
    sessionCode = session.code;
    participants = [...newParticipants];
    connectionStatus = 'connected';
}

/**
 * Set current session
 */
export function setCurrentSession(session: Session | null) {
    currentSession = session;
    if (session) {
        sessionCode = session.code;
    }
}

/**
 * Update session data
 */
export function updateCurrentSession(updates: Partial<Session>) {
    if (currentSession) {
        currentSession = { ...currentSession, ...updates };
    }
}

/**
 * Update participants list (analytics will auto-recompute)
 */
export function setParticipants(newParticipants: Participant[]) {
    participants = [...newParticipants];
    lastUpdate = new Date();
}

/**
 * Add or update a participant
 */
export function upsertParticipant(participant: Participant) {
    const index = participants.findIndex(p => p.id === participant.id);
    if (index >= 0) {
        // Update existing
        participants[index] = participant;
        participants = [...participants]; // Trigger reactivity
        addToUpdateQueue('update', participant);
    } else {
        // Add new
        participants = [...participants, participant];
        addToUpdateQueue('join', participant);
    }
}

/**
 * Add a new participant (analytics will auto-recompute)
 */
export function addParticipant(participant: Participant) {
    participants = [...participants, participant];
    addToUpdateQueue('join', participant);
}

/**
 * Update an existing participant (analytics will auto-recompute)
 */
export function updateParticipant(id: string, updates: Partial<Participant>) {
    const index = participants.findIndex(p => p.id === id);
    if (index >= 0) {
        participants[index] = { ...participants[index], ...updates };
        participants = [...participants]; // Trigger reactivity
    }
}

/**
 * Remove a participant (analytics will auto-recompute)
 */
export function removeParticipant(id: string) {
    const index = participants.findIndex(p => p.id === id);
    if (index >= 0) {
        const participant = participants[index];
        participants.splice(index, 1);
        participants = [...participants]; // Trigger reactivity
        addToUpdateQueue('leave', participant);
    }
}

/**
 * Mark participant as completed
 */
export function completeParticipant(id: string, preferenceScores: PreferenceScores) {
    const participant = participants.find(p => p.id === id);
    if (participant) {
        const updated = {
            ...participant,
            completed: true,
            completedAt: new Date().toISOString(),
            preferenceScores
        };
        upsertParticipant(updated);
        addToUpdateQueue('complete', updated);
    }
}

/**
 * Add update to queue for animation/notification
 */
function addToUpdateQueue(type: ParticipantUpdate['type'], participant: Participant) {
    const newQueue = [
        ...updateQueue.slice(-9), // Keep last 10 updates
        { type, participant: participant as any, timestamp: new Date() }
    ];
    updateQueue = newQueue;
}

/**
 * FAST analytics computation using optimized single-pass algorithms
 */
export function computeAnalyticsFast(participants: Participant[]): LiveAnalytics {
    const totalCount = participants.length;
    const completedParticipants = participants.filter(a => a.completed);
    const completedCount = completedParticipants.length;
    const activeCount = totalCount - completedCount;
    const responseRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    // Single-pass computation for generation distribution and preference scores
    const generationDistribution: Record<Generation, number> = {
        'Baby Boomers': 0,
        'Gen X': 0,
        'Millennials': 0,
        'Gen Z': 0
    };

    const preferenceTotals = {
        collaboration: 0,
        formality: 0,
        technology: 0,
        wellness: 0
    };

    // Process all participants in one pass
    completedParticipants.forEach(participant => {
        // Count generations
        const gen = participant.generation as Generation;
        if (gen && generationDistribution[gen] !== undefined) {
            generationDistribution[gen]++;
        }

        // Sum preference scores
        if (participant.preferenceScores) {
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

    // Generation preferences
    const generationPreferences: GenerationPreferencesMap = {};
    const generations: Generation[] = ['Baby Boomers', 'Gen X', 'Millennials', 'Gen Z'];

    generations.forEach(gen => {
        const genParticipants = completedParticipants.filter(p => p.generation === gen);
        if (genParticipants.length > 0) {
            const genTotals = {
                collaboration: 0,
                formality: 0,
                technology: 0,
                wellness: 0
            };

            genParticipants.forEach(p => {
                if (p.preferenceScores) {
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
    const workplaceDNA = generateWorkplaceDNA(preferenceScores);

    // Generate word cloud data
    const wordCloudData = generateWordCloudData(preferenceScores, generationDistribution);

    return {
        activeCount,
        completedCount,
        totalCount,
        responseRate,
        generationDistribution,
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
export function generateWorkplaceDNA(scores: PreferenceScores): string {
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
export function generateWordCloudData(scores: PreferenceScores, generations: Record<Generation, number>): WordCloudItem[] {
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
    const dnaProfile = generateWorkplaceDNA(scores);
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

export function resetState() {
    sessions = [];
    currentSession = null;
    participants = [];
    connectionStatus = 'disconnected';
    isLoading = false;
    error = null;
    sessionUrl = '';
    networkUrl = '';
    sessionCode = '';
    lastUpdate = new Date();
    updateQueue = [];
}

// Export functions to access derived state (Svelte 5 pattern)
export function getAnalytics() {
    return analytics;
}

export function getIsActive() {
    return isActive;
}

export function getHasParticipants() {
    return hasParticipants;
}

export function getHasCompletedParticipants() {
    return hasCompletedParticipants;
}

export function getCompletionPercentage() {
    return completionPercentage;
}

export function getMostActiveGeneration() {
    return mostActiveGeneration;
}

export function getDominantPreference() {
    return dominantPreference;
}

export function getHasActiveSessions() {
    return hasActiveSessions;
}

export function getTotalParticipants() {
    return totalParticipants;
}

export function getAverageResponseRate() {
    return averageResponseRate;
}

function getPreferenceLabel(trait: string): string {
    const labels: Record<string, string> = {
      collaboration: 'Team Collaboration',
      formality: 'Structured Environment',
      tech: 'Digital Innovation',
      wellness: 'Work-Life Balance'
    };
    return labels[trait] || trait;
}

function generateRecommendations(scores: PreferenceScores) {
    const recommendations = [];

    if (scores.tech > 70) {
      recommendations.push({
        icon: '💻',
        text: 'Invest in cutting-edge digital tools and training programs',
        priority: 'high'
      });
    }

    if (scores.collaboration > 70) {
      recommendations.push({
        icon: '🤝',
        text: 'Create more collaborative workspaces and team-building activities',
        priority: 'high'
      });
    }

    if (scores.wellness > 70) {
      recommendations.push({
        icon: '🌱',
        text: 'Focus on work-life balance with flexible schedules and wellness programs',
        priority: 'high'
      });
    }

    if (scores.formality < 40) {
      recommendations.push({
        icon: '🎯',
        text: 'Consider more flexible policies and casual work environment',
        priority: 'medium'
      });
    }

    return recommendations.slice(0, 3); // Top 3 recommendations
}

function generateOfficeAnalysis(scores: PreferenceScores, generations: Record<Generation, number>) {
    const dominantTraits = Object.entries(scores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([trait, score]) => ({ trait, score }));

    const genBreakdown = Object.entries(generations)
      .map(([gen, count]) => `${count} ${gen}`)
      .join(', ');

    return {
      culture: dominantTraits[0]?.trait || 'Balanced',
      description: `This team shows strong ${dominantTraits[0]?.trait.toLowerCase()} tendencies with ${dominantTraits[0]?.score}% preference. The ${genBreakdown} demographic suggests a ${dominantTraits[0]?.trait.toLowerCase()}-oriented workplace culture.`,
      recommendations: [
        `Create ${dominantTraits[0]?.trait.toLowerCase()}-focused spaces`,
        `Implement ${dominantTraits[1]?.trait.toLowerCase()} initiatives`,
        `Design for ${genBreakdown} preferences`
      ]
    };
}

function generateLayoutSuggestions(scores: PreferenceScores) {
    const suggestions = [];

    if (scores.collaboration > 70) {
      suggestions.push({
        type: 'Open Layout',
        description: 'Large collaborative spaces with movable furniture',
        zones: ['Team areas', 'Whiteboard walls', 'Flexible seating']
      });
    }

    if (scores.tech > 70) {
      suggestions.push({
        type: 'Tech-Forward',
        description: 'Modern workstations with advanced technology integration',
        zones: ['Charging stations', 'Video conferencing pods', 'Smart lighting']
      });
    }

    if (scores.wellness > 70) {
      suggestions.push({
        type: 'Wellness-Centric',
        description: 'Spaces designed for physical and mental wellbeing',
        zones: ['Quiet zones', 'Standing desks', 'Natural lighting areas']
      });
    }

    return suggestions;
}


// Admin-level functions
export class AdminDashboardState {
    // Reactive state
    sessions = $state<SessionWithCounts[]>([]);
    isLoading = $state(false);
    error = $state('');

    // Computed properties
    stats = $derived({
        total: this.sessions.length,
        active: this.sessions.filter(s => s.isActive).length,
        totalParticipants: this.sessions.reduce((sum, s) => sum + (s.activeCount + s.completedCount), 0),
        completedSurveys: this.sessions.reduce((sum, s) => sum + s.completedCount, 0)
    });

    // Private error handler
    private handleError = (err: unknown, fallback: string) =>
        err instanceof Error ? err.message : fallback;

	/**
	 * Create new session (no manual refresh needed with reactive queries)
	 */
	createSession = async (name: string) => {
		try {
			return await createSessionRemote({ name: name.trim() });
		} catch (err) {
			return { success: false, error: this.handleError(err, 'Failed to create session') };
		}
	};

	/**
	 * Delete session (no manual refresh needed with reactive queries)
	 */
	deleteSession = async (code: string) => {
		try {
			return await deleteSessionRemote({ code });
		} catch (err) {
			return { success: false, error: this.handleError(err, 'Failed to delete session') };
		}
	};
}

// Export singleton instance
export const adminState = new AdminDashboardState();

// Main function to get a session store instance
export function getSessionStore(sessionCodeParam: string) {
    // Initialize with the session code
    sessionCode = sessionCodeParam;

    return {
        // State
        get session() { return currentSession; },
        get participants() { return participants; },
        get isLoading() { return isLoading; },
        get error() { return error; },
        get connectionStatus() { return connectionStatus; },
        get lastUpdate() { return lastUpdate; },

        // Computed state
        get analytics() { return analytics; },
        get insights() { return insights; },
        get isActive() { return isActive; },
        get hasParticipants() { return hasParticipants; },
        get hasCompletedParticipants() { return hasCompletedParticipants; },
        get completionPercentage() { return completionPercentage; },
        get mostActiveGeneration() { return mostActiveGeneration; },
        get dominantPreference() { return dominantPreference; },
        get avgTime() { return avgTime; },

        // Actions
        setLoading: (loading: boolean) => { isLoading = loading; },
        setError: (err: string | null) => { error = err; },
        updateSession: (session: Session) => { currentSession = session; },
        updateParticipants: (newParticipants: Participant[]) => { participants = [...newParticipants]; },
        optimisticEndSession: () => {
            if (currentSession) {
                currentSession = { ...currentSession, isActive: false };
            }
        },
        rollbackEndSession: () => {
            if (currentSession) {
                currentSession = { ...currentSession, isActive: true };
            }
        },
        optimisticRemoveParticipant: (id: string) => {
            participants = participants.filter(p => p.id !== id);
        },
        rollbackRemoveParticipant: (originalParticipants: Participant[]) => {
            participants = [...originalParticipants];
        }
    };
}