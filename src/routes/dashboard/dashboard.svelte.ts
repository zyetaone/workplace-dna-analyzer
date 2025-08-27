/**
 * Dashboard State Management with Svelte 5 Runes
 * Handles session management, analytics computation, and real-time updates
 */

import type { Session, Participant, PreferenceScores } from '$lib/server/db/schema';
import type { ConnectionStatus, ParticipantUpdate, LiveAnalytics, Generation, WordCloudItem, GenerationPreferences } from '$lib/types';

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

// Mutable state arrays using $state
const sessionsArray = $state<SessionWithCounts[]>([]);
const participantsArray = $state<Participant[]>([]);
const updateQueueArray = $state<ParticipantUpdate[]>([]);

// Mutable state object for primitives
const mutableState = $state({
	currentSession: null as Session | null,
	isLoading: false,
	error: null as string | null,
	connectionStatus: 'connecting' as ConnectionStatus,
	lastUpdate: new Date(),
	sessionUrl: '',
	networkUrl: '',
	sessionCode: '',
	slug: ''
});

// Export getter functions for read-only access
export const sessions = () => sessionsArray;
export const participants = () => participantsArray;
export const updateQueue = () => updateQueueArray;
export const currentSession = () => mutableState.currentSession;
export const isLoading = () => mutableState.isLoading;
export const error = () => mutableState.error;
export const connectionStatus = () => mutableState.connectionStatus;
export const lastUpdate = () => mutableState.lastUpdate;
export const sessionUrl = () => mutableState.sessionUrl;
export const networkUrl = () => mutableState.networkUrl;
export const sessionCode = () => mutableState.sessionCode;
export const slug = () => mutableState.slug;

// Analytics getter function
export const analytics = () => computeAnalyticsFast(participantsArray);

// Additional getter functions for presenter features
export const isActive = () => mutableState.currentSession?.isActive || false;
export const hasParticipants = () => participantsArray.length > 0;
export const hasCompletedParticipants = () => participantsArray.some(p => p.completed);

export const completionPercentage = () => {
	if (participantsArray.length === 0) return 0;
	const completed = participantsArray.filter(p => p.completed).length;
	return Math.round((completed / participantsArray.length) * 100);
};

// Most active generation
export const mostActiveGeneration = () => {
	const dist = analytics().generationDistribution;
	const entries = Object.entries(dist).filter(([_, count]) => count > 0);
	if (entries.length === 0) return null;
	return entries.reduce((a, b) => a[1] > b[1] ? a : b)[0];
};

// Dominant preference
export const dominantPreference = () => {
	const scores = analytics().preferenceScores;
	const entries = Object.entries(scores);
	if (entries.length === 0) return null;
	const [pref, score] = entries.reduce((a, b) => a[1] > b[1] ? a : b);
	return { preference: pref, score };
};

// Derived state getter functions
export const hasActiveSessions = () => sessionsArray.some(s => s.isActive);
export const totalParticipants = () => sessionsArray.reduce((sum, s) => sum + s.activeCount + s.completedCount, 0);

export const averageResponseRate = () => {
	const completed = sessionsArray.reduce((sum, s) => sum + s.completedCount, 0);
	const total = totalParticipants();
	return total > 0 ? Math.round((completed / total) * 100) : 0;
};

/**
 * Set loading state
 */
export function setLoading(loading: boolean) {
	mutableState.isLoading = loading;
}

/**
 * Set error state
 */
export function setError(errorMsg: string | null) {
	mutableState.error = errorMsg;
}

/**
 * Set connection status
 */
export function setConnectionStatus(status: ConnectionStatus) {
	mutableState.connectionStatus = status;
}

/**
 * Set session URL
 */
export function setSessionUrl(url: string) {
	mutableState.sessionUrl = url;
}

/**
 * Set network URL
 */
export function setNetworkUrl(url: string) {
	mutableState.networkUrl = url;
}

/**
 * Set sessions list - use array mutation
 */
export function setSessions(newSessions: SessionWithCounts[]) {
	sessionsArray.splice(0, sessionsArray.length, ...newSessions);
}

/**
 * Initialize session with data
 */
export function initSession(session: Session, newParticipants: Participant[] = []) {
	mutableState.currentSession = session;
	mutableState.slug = session.slug;
	mutableState.sessionCode = session.code;
	participantsArray.splice(0, participantsArray.length, ...newParticipants);
	mutableState.connectionStatus = 'connected';
}

/**
 * Set current session
 */
export function setCurrentSession(session: Session | null) {
	mutableState.currentSession = session;
	if (session) {
		mutableState.slug = session.slug;
		mutableState.sessionCode = session.code;
	}
}

/**
 * Update session data
 */
export function updateCurrentSession(updates: Partial<Session>) {
	if (mutableState.currentSession) {
		mutableState.currentSession = { ...mutableState.currentSession, ...updates };
	}
}

/**
 * Update participants list (analytics will auto-recompute)
 */
export function setParticipants(newParticipants: Participant[]) {
	participantsArray.splice(0, participantsArray.length, ...newParticipants);
	mutableState.lastUpdate = new Date();
}


/**
 * Add or update a participant
 */
export function upsertParticipant(participant: Participant) {
	const index = participantsArray.findIndex(p => p.id === participant.id);
	if (index >= 0) {
		// Update existing using splice
		participantsArray.splice(index, 1, participant);
		addToUpdateQueue('update', participant);
	} else {
		// Add new
		participantsArray.push(participant);
		addToUpdateQueue('join', participant);
	}
}

/**
 * Add a new participant (analytics will auto-recompute)
 */
export function addParticipant(participant: Participant) {
	participantsArray.push(participant);
	addToUpdateQueue('join', participant);
}

/**
 * Update an existing participant (analytics will auto-recompute)
 */
export function updateParticipant(id: string, updates: Partial<Participant>) {
	const index = participantsArray.findIndex(p => p.id === id);
	if (index !== -1) {
		const updated = { ...participantsArray[index], ...updates };
		participantsArray.splice(index, 1, updated);
	}
}

/**
 * Remove a participant (analytics will auto-recompute)
 */
export function removeParticipant(id: string) {
	const index = participantsArray.findIndex(p => p.id === id);
	if (index !== -1) {
		const participant = participantsArray[index];
		participantsArray.splice(index, 1);
		addToUpdateQueue('leave', participant);
	}
}

/**
 * Mark participant as completed
 */
export function completeParticipant(id: string, preferenceScores: PreferenceScores) {
	const participant = participantsArray.find(p => p.id === id);
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
	updateQueueArray.push({ type, participant: participant as any, timestamp: new Date() });
	if (updateQueueArray.length > 10) {
		updateQueueArray.shift();
	}
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
        'Baby Boomer': 0,
        'Gen X': 0,
        'Millennial': 0,
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
    const generations: Generation[] = ['Baby Boomer', 'Gen X', 'Millennial', 'Gen Z'];

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
	sessionsArray.splice(0, sessionsArray.length);
	mutableState.currentSession = null;
	participantsArray.splice(0, participantsArray.length);
	mutableState.connectionStatus = 'disconnected';
	mutableState.isLoading = false;
	mutableState.error = null;
	mutableState.sessionUrl = '';
	mutableState.networkUrl = '';
	mutableState.sessionCode = '';
	mutableState.slug = '';
	mutableState.lastUpdate = new Date();
	updateQueueArray.splice(0, updateQueueArray.length);
}
