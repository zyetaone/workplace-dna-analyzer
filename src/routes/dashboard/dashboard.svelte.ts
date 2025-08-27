/**
 * Dashboard State Management with Svelte 5 Runes - SIMPLIFIED
 * Direct state access without getter functions
 */

import type { Session, Participant, PreferenceScores } from '$lib/server/db/schema';
import type { ConnectionStatus, ParticipantUpdate, LiveAnalytics, Generation, WordCloudItem } from '$lib/types';

export interface SessionWithCounts extends Session {
	activeCount: number;
	completedCount: number;
}

// Single unified state object - directly mutable
export const state = $state({
	// Core data
	sessions: [] as SessionWithCounts[],
	participants: [] as Participant[],
	currentSession: null as Session | null,
	
	// UI state
	isLoading: false,
	error: null as string | null,
	connectionStatus: 'connecting' as ConnectionStatus,
	
	// Session info
	sessionUrl: '',
	sessionCode: '',
	slug: '',
	
	// Updates
	lastUpdate: new Date(),
	updateQueue: [] as ParticipantUpdate[]
});

// Direct derived values - no functions needed
export const analytics = $derived.by(() => {
	const participants = state.participants;
	const totalCount = participants.length;
	const completedParticipants = participants.filter(p => p.completed);
	const completedCount = completedParticipants.length;
	const activeCount = totalCount - completedCount;
	const responseRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

	// Single-pass computation for all metrics
	const generationDistribution: Record<Generation, number> = {
		'Baby Boomer': 0,
		'Gen X': 0,
		'Millennial': 0,
		'Gen Z': 0
	};

	let collaborationTotal = 0;
	let formalityTotal = 0;
	let techTotal = 0;
	let wellnessTotal = 0;

	// Process all participants in ONE pass
	completedParticipants.forEach(p => {
		// Count generation
		const gen = p.generation as Generation;
		if (gen && gen in generationDistribution) {
			generationDistribution[gen]++;
		}

		// Sum scores
		if (p.preferenceScores) {
			const scores = p.preferenceScores as any;
			collaborationTotal += scores.collaboration || 0;
			formalityTotal += scores.formality || 0;
			techTotal += scores.tech || scores.technology || 0;
			wellnessTotal += scores.wellness || 0;
		}
	});

	// Calculate averages
	const divisor = completedCount || 1;
	const preferenceScores: PreferenceScores = {
		collaboration: Math.round(collaborationTotal / divisor),
		formality: Math.round(formalityTotal / divisor),
		tech: Math.round(techTotal / divisor),
		wellness: Math.round(wellnessTotal / divisor)
	};

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
		workplaceDNA,
		wordCloudData,
		lastUpdated: state.lastUpdate
	} as LiveAnalytics;
});

// Simple derived values
export const completionPercentage = $derived(
	state.participants.length > 0 
		? Math.round((state.participants.filter(p => p.completed).length / state.participants.length) * 100)
		: 0
);

export const hasParticipants = $derived(state.participants.length > 0);
export const isActive = $derived(state.currentSession?.isActive || false);

// Direct state mutation functions - no wrappers needed
export function setLoading(loading: boolean) {
	state.isLoading = loading;
}

export function setError(error: string | null) {
	state.error = error;
}

export function setConnectionStatus(status: ConnectionStatus) {
	state.connectionStatus = status;
}

export function setSessions(sessions: SessionWithCounts[]) {
	state.sessions = sessions;
}

export function setParticipants(participants: Participant[]) {
	state.participants = participants;
	state.lastUpdate = new Date();
}

export function initSession(session: Session, participants: Participant[] = []) {
	state.currentSession = session;
	state.slug = session.slug;
	state.sessionCode = session.code;
	state.participants = participants;
	state.connectionStatus = 'connected';
	state.sessionUrl = `${window.location.origin}/dashboard/${session.slug}/join`;
}

export function setCurrentSession(session: Session | null) {
	state.currentSession = session;
	if (session) {
		state.slug = session.slug;
		state.sessionCode = session.code;
	}
}

export function updateCurrentSession(updates: Partial<Session>) {
	if (state.currentSession) {
		Object.assign(state.currentSession, updates);
	}
}

export function addParticipant(participant: Participant) {
	state.participants.push(participant);
	addToUpdateQueue('join', participant);
}

export function updateParticipant(id: string, updates: Partial<Participant>) {
	const index = state.participants.findIndex(p => p.id === id);
	if (index !== -1) {
		Object.assign(state.participants[index], updates);
	}
}

export function removeParticipant(id: string) {
	const index = state.participants.findIndex(p => p.id === id);
	if (index !== -1) {
		const participant = state.participants[index];
		state.participants.splice(index, 1);
		addToUpdateQueue('leave', participant);
	}
}

export function upsertParticipant(participant: Participant) {
	const index = state.participants.findIndex(p => p.id === participant.id);
	if (index >= 0) {
		state.participants[index] = participant;
		addToUpdateQueue('update', participant);
	} else {
		state.participants.push(participant);
		addToUpdateQueue('join', participant);
	}
}

function addToUpdateQueue(type: ParticipantUpdate['type'], participant: Participant) {
	state.updateQueue.push({ type, participant: participant as any, timestamp: new Date() });
	if (state.updateQueue.length > 10) {
		state.updateQueue.shift();
	}
}

// Helper functions
function generateWorkplaceDNA(scores: PreferenceScores): string {
	const profiles = [];
	if (scores.collaboration >= 7) profiles.push('Collaborative');
	else if (scores.collaboration <= 3) profiles.push('Independent');
	if (scores.formality >= 7) profiles.push('Structured');
	else if (scores.formality <= 3) profiles.push('Flexible');
	if (scores.tech >= 7) profiles.push('Tech-Forward');
	else if (scores.tech <= 3) profiles.push('Traditional');
	if (scores.wellness >= 7) profiles.push('Wellness-Focused');
	else if (scores.wellness <= 3) profiles.push('Performance-Driven');
	return profiles.length > 0 ? profiles.join(' & ') : 'Balanced';
}

function generateWordCloudData(scores: PreferenceScores, generations: Record<Generation, number>): WordCloudItem[] {
	const words: WordCloudItem[] = [
		{ text: 'Collaboration', size: 20 + scores.collaboration * 8 },
		{ text: 'Formality', size: 20 + scores.formality * 8 },
		{ text: 'Technology', size: 20 + scores.tech * 8 },
		{ text: 'Wellness', size: 20 + scores.wellness * 8 }
	];

	// Add generation words
	Object.entries(generations).forEach(([gen, count]) => {
		if (count > 0) {
			words.push({ text: gen, size: 15 + count * 5 });
		}
	});

	// Add DNA traits
	const dnaProfile = generateWorkplaceDNA(scores);
	if (dnaProfile !== 'Balanced') {
		dnaProfile.split(' & ').forEach(trait => {
			words.push({ text: trait, size: 35 + Math.random() * 15 });
		});
	}

	return words;
}

export function resetState() {
	state.sessions = [];
	state.currentSession = null;
	state.participants = [];
	state.connectionStatus = 'disconnected';
	state.isLoading = false;
	state.error = null;
	state.sessionUrl = '';
	state.sessionCode = '';
	state.slug = '';
	state.lastUpdate = new Date();
	state.updateQueue = [];
}