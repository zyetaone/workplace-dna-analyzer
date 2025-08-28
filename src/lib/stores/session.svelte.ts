import type { Session, Participant } from '$lib/types';

interface SessionState {
	session: Session | null;
	participants: Participant[];
	loading: boolean;
	error: string | null;
}

class SessionStore {
	// Reactive state using Svelte 5 runes
	private state = $state<SessionState>({
		session: null,
		participants: [],
		loading: false,
		error: null
	});

	// Computed values using $derived
	readonly sessionData = $derived(this.state.session);
	readonly participants = $derived(this.state.participants);
	readonly loading = $derived(this.state.loading);
	readonly error = $derived(this.state.error);

	// Analytics derived from state
	readonly analytics = $derived(() => {
		const { participants } = this.state;
		const total = participants.length;
		const completed = participants.filter(p => p.completed).length;
		const inProgress = participants.filter(p => !p.completed).length;
		
		return {
			totalParticipants: total,
			completedCount: completed,
			inProgressCount: inProgress,
			completionRate: total > 0 ? (completed / total) * 100 : 0,
			avgScore: this.calculateAvgScore()
		};
	});

	// Session stats
	readonly isActive = $derived(
		this.state.session?.isActive === true
	);
	
	readonly sessionCode = $derived(
		this.state.session?.code || ''
	);

	readonly qrCodeUrl = $derived(() => {
		if (!this.state.session) return '';
		const baseUrl = window.location.origin;
		return `${baseUrl}/join/${this.state.session.code}`;
	});

	// Methods for updating state
	setSession(session: Session | null) {
		this.state.session = session;
		this.state.error = null;
	}

	setParticipants(participants: Participant[]) {
		this.state.participants = participants;
	}

	addParticipant(participant: Participant) {
		this.state.participants = [...this.state.participants, participant];
	}

	updateParticipant(id: string, updates: Partial<Participant>) {
		this.state.participants = this.state.participants.map(p =>
			p.id === id ? { ...p, ...updates } : p
		);
	}

	removeParticipant(id: string) {
		this.state.participants = this.state.participants.filter(p => p.id !== id);
	}

	setLoading(loading: boolean) {
		this.state.loading = loading;
	}

	setError(error: string | null) {
		this.state.error = error;
		this.state.loading = false;
	}

	reset() {
		this.state = {
			session: null,
			participants: [],
			loading: false,
			error: null
		};
	}

	// Helper method for average score calculation
	private calculateAvgScore(): number {
		const completed = this.state.participants.filter(p => p.completed);
		if (completed.length === 0) return 0;
		
		// Calculate average based on preference scores
		const totalScores = completed.reduce((sum, p) => {
			if (p.preferenceScores) {
				const scores = p.preferenceScores;
				const avg = (scores.collaboration + scores.formality + scores.tech + scores.wellness) / 4;
				return sum + avg;
			}
			return sum;
		}, 0);
		return Math.round(totalScores / completed.length);
	}
}

// Export singleton instance
export const sessionStore = new SessionStore();