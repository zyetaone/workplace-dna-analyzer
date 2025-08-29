import type { Session, Participant, PreferenceScores } from '$lib/server/db/schema';
import type { GenerationOption } from '$lib/questions';
import { questions } from '$lib/questions';
import { getWorkplaceDNA } from '$lib/utils/scoring';
import {
	getSessionInfo,
	getQuizState,
	getCompletionResultsRemote,
	saveAnswer,
	completeQuiz,
	sessionOperation
} from './data.remote';

export class PresenterState {
	// Core state
	session = $state<Session | null>(null);
	participant = $state<Participant | null>(null);
	loading = $state(false);
	error = $state<string | null>(null);

	// Quiz state
	participantName = $state('');
	responses = $state<Record<string, string>>({});
	currentQuestionIndex = $state(0);

	// Completion results
	completionResults = $state<{
		session: Session;
		participant: Participant;
		scores: PreferenceScores;
	} | null>(null);

	// Computed properties
	currentQuestion = $derived(questions[this.currentQuestionIndex] || null);
	currentAnswer = $derived(this.responses[this.currentQuestion?.id || ''] || '');
	isLastQuestion = $derived(this.currentQuestionIndex === questions.length - 1);
	progressPercent = $derived(Math.round((Object.keys(this.responses).length / questions.length) * 100));

	completionData = $derived.by(() => {
		if (!this.completionResults) return null;
		return {
			scores: this.completionResults.scores,
			workplaceDNA: getWorkplaceDNA(this.completionResults.scores),
			participant: this.completionResults.participant,
			session: this.completionResults.session
		};
	});

	// Core methods
	loadSession = async (code: string) => {
		this.loading = true;
		this.error = null;
		try {
			const session = await getSessionInfo({ code });
			this.session = session;
		} catch (error) {
			this.error = error instanceof Error ? error.message : 'Failed to load session';
		} finally {
			this.loading = false;
		}
	};

	joinSession = async (name: string, generation: GenerationOption) => {
		if (!this.session) {
			return { success: false, error: 'No session loaded' };
		}
		this.loading = true;
		try {
			const result = await sessionOperation({
				code: this.session.code,
				operation: 'join',
				participantData: { name, generation: generation as any }
			});
			if (result.success && result.participant) {
				this.participant = result.participant as Participant;
				return { ...result, redirect: `/${this.session.code}/quiz` };
			}
			return result;
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to join session';
			return { success: false, error: errorMessage };
		} finally {
			this.loading = false;
		}
	};

	loadQuizState = async (code: string, participantId: string) => {
		this.loading = true;
		this.error = null;
		try {
			const result = await getQuizState({ sessionCode: code, participantId });
			if (result.session && result.participant) {
				this.session = result.session;
				this.participant = result.participant;
				this.responses = result.responses || {};
				this.currentQuestionIndex = Math.min(Object.keys(this.responses).length, questions.length - 1);
			}
			return result;
		} catch (error) {
			this.error = error instanceof Error ? error.message : 'Failed to load quiz';
		} finally {
			this.loading = false;
		}
	};

	submitAnswer = async (answer: string) => {
		if (!this.participant || !this.currentQuestion) {
			return { success: false, error: 'Invalid state' };
		}
		this.loading = true;
		try {
			const result = await saveAnswer({
				participantId: this.participant.id,
				questionIndex: this.currentQuestionIndex,
				answer: answer
			});
			if (result.success) {
				this.responses[this.currentQuestion.id] = answer;
			}
			return result;
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to submit answer';
			return { success: false, error: errorMessage };
		} finally {
			this.loading = false;
		}
	};

	completeQuiz = async () => {
		if (!this.session || !this.participant) {
			return { success: false, error: 'Invalid state' };
		}
		this.loading = true;
		try {
			const result = await completeQuiz({
				sessionCode: this.session.code,
				participantId: this.participant.id
			});
			return result;
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to complete quiz';
			return { success: false, error: errorMessage };
		} finally {
			this.loading = false;
		}
	};

	nextQuestion = () => {
		if (this.currentQuestionIndex < questions.length - 1) {
			this.currentQuestionIndex++;
		}
	};

	loadCompletionResults = async (code?: string) => {
		if (!code && !this.session?.code) return;
		this.loading = true;
		try {
			const result = await getCompletionResultsRemote({
				sessionCode: code || this.session!.code
			});
			if (result.session && result.participants) {
				this.session = result.session;
				// Find the current participant's results
				const currentParticipant = result.participants.find(p => p.id === this.participant?.id);
				if (currentParticipant) {
					this.participant = currentParticipant;
				}
			}
		} catch (error) {
			this.error = error instanceof Error ? error.message : 'Failed to load results';
		} finally {
			this.loading = false;
		}
	};
}

const presenterInstances = new Map<string, PresenterState>();

export function getPresenterState(sessionCode: string): PresenterState {
	if (!presenterInstances.has(sessionCode)) {
		presenterInstances.set(sessionCode, new PresenterState());
	}
	return presenterInstances.get(sessionCode)!;
}