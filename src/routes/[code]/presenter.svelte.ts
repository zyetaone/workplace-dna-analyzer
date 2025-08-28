import type { Session, Participant, PreferenceScores } from '$lib/server/db/schema';
import type { GenerationOption } from '$lib/questions';
import { questions } from '$lib/questions';
import { getWorkplaceDNA } from '$lib/utils/scoring';
import {
	getSessionInfo,
	joinSessionRemote,
	getQuizState,
	saveQuizAnswer,
	completeQuizRemote,
	getCompletionResultsRemote
} from './participant.remote';

export class PresenterState {
	session = $state<Session | null>(null);
	participant = $state<Participant | null>(null);
	loading = $state(false);
	isJoining = $state(false);
	error = $state<string | null>(null);
	joinError = $state<string | null>(null);
	participantName = $state('');
	selectedGeneration = $state<GenerationOption>('Gen Z');
	responses = $state<Record<string, string>>({});
	currentQuestionIndex = $state(0);
	completionResults = $state<{
		session: Session;
		participant: Participant;
		scores: PreferenceScores;
	} | null>(null);
	
	currentQuestion = $derived(questions[this.currentQuestionIndex] || null);
	currentAnswer = $derived(this.responses[`q${this.currentQuestionIndex}`] || '');
	quizProgress = $derived.by(() => {
		const answered = Object.keys(this.responses).length;
		return {
			totalQuestions: questions.length,
			answeredCount: answered,
			currentQuestion: this.currentQuestionIndex,
			progressPercent: Math.round((answered / questions.length) * 100),
			isLastQuestion: this.currentQuestionIndex === questions.length - 1,
			isComplete: answered === questions.length
		};
	});
	completionData = $derived.by(() => {
		if (!this.completionResults) return null;
		return {
			scores: this.completionResults.scores,
			workplaceDNA: getWorkplaceDNA(this.completionResults.scores),
			participant: this.completionResults.participant,
			session: this.completionResults.session
		};
	});
	
	loadSession = async (code: string) => {
		this.loading = true;
		this.error = null;
		try {
			const result = await getSessionInfo({ code });
			if (result.session) {
				this.session = result.session;
			} else {
				this.error = result.error || 'Session not found';
			}
		} catch (error) {
			this.error = error instanceof Error ? error.message : 'Failed to load session';
		} finally {
			this.loading = false;
		}
	}
	
	joinSession = async (name: string, generation: GenerationOption, participantId?: string) => {
		if (!this.session) {
			this.joinError = 'No session loaded';
			return { success: false, error: 'No session loaded' };
		}
		this.isJoining = true;
		this.joinError = null;
		try {
			const result = await joinSessionRemote({
				sessionCode: this.session.code,
				name,
				generation,
				participantId
			});
			if (result.participantId) {
				this.participant = {
					id: result.participantId,
					name,
					generation,
					completed: false
				} as Participant;
			}
			return result;
		} catch (error) {
			this.joinError = error instanceof Error ? error.message : 'Failed to join session';
			return { success: false, error: this.joinError };
		} finally {
			this.isJoining = false;
		}
	}
	
	loadQuizState = async (code: string, participantId: string) => {
		this.loading = true;
		this.error = null;
		try {
			const result = await getQuizState({ sessionCode: code, participantId });
			if (result.redirect) {
				// Handle redirect (e.g., to complete page)
				return result;
			}
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
	}
	
	submitAnswer = async (answer: string) => {
		if (!this.participant) return { success: false };
		this.loading = true;
		this.error = null;
		try {
			const result = await saveQuizAnswer({
				participantId: this.participant.id,
				questionIndex: this.currentQuestionIndex,
				answer
			});
			this.responses[`q${this.currentQuestionIndex}`] = answer;
			return result;
		} catch (error) {
			this.error = error instanceof Error ? error.message : 'Failed to save answer';
			return { success: false, error: this.error };
		} finally {
			this.loading = false;
		}
	}
	
	nextQuestion = () => {
		if (this.currentQuestionIndex < questions.length - 1) {
			this.currentQuestionIndex++;
		}
	}
	
	completeQuiz = async () => {
		if (!this.session || !this.participant) return { success: false };
		this.loading = true;
		try {
			const result = await completeQuizRemote({
				sessionCode: this.session.code,
				participantId: this.participant.id
			});
			if (result.success) {
				this.participant = { ...this.participant, completed: true };
			}
			return result;
		} catch (error) {
			return { success: false, error: error instanceof Error ? error.message : 'Failed to complete quiz' };
		} finally {
			this.loading = false;
		}
	}
	
	loadCompletionResults = async (code?: string, participantId?: string) => {
		if (!code && !this.session?.code) return;
		if (!participantId && !this.participant?.id) return;
		this.loading = true;
		try {
			const result = await getCompletionResultsRemote({
				sessionCode: code || this.session!.code,
				participantId: participantId || this.participant!.id
			});
			if (result.redirect) {
				// Handle redirect (e.g., back to quiz)
				return result;
			}
			if (result.session && result.participant && result.scores) {
				this.completionResults = {
					session: result.session,
					participant: result.participant,
					scores: result.scores
				};
				this.session = result.session;
				this.participant = result.participant;
			}
		} catch (error) {
			this.error = error instanceof Error ? error.message : 'Failed to load results';
		} finally {
			this.loading = false;
		}
	}
}

const presenterInstances = new Map<string, PresenterState>();

export function getPresenterState(sessionCode: string): PresenterState {
	if (!presenterInstances.has(sessionCode)) {
		presenterInstances.set(sessionCode, new PresenterState());
	}
	return presenterInstances.get(sessionCode)!;
}