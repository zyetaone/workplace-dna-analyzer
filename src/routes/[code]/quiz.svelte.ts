import type { Session, Participant } from '$lib/server/db/schema';
import type { GenerationOption } from '$lib/questions';
import { questions } from '$lib/questions';
import { getWorkplaceDNA } from '$lib/utils/scoring';
import {
	getSessionInfo,
	getQuizState as getQuizStateRemote,
	getCompletionResultsRemote,
	saveAnswer,
	completeQuiz,
	sessionOperation
} from '../data.remote';

export class QuizState {
	// Core reactive state
	session = $state<Session | null>(null);
	participant = $state<Participant | null>(null);
	loading = $state(false);
	error = $state<string | null>(null);
	participantName = $state('');
	responses = $state<Record<string, string>>({});
	currentQuestionIndex = $state(0);

	// Computed properties
	readonly questions = questions;
	readonly totalQuestions = questions.length;
	currentQuestion = $derived(questions[this.currentQuestionIndex] || null);
	currentAnswer = $derived(this.responses[this.currentQuestion?.id || ''] || '');
	isLastQuestion = $derived(this.currentQuestionIndex === questions.length - 1);
	progressPercent = $derived(
		Math.round((Object.keys(this.responses).length / questions.length) * 100)
	);

	completionData = $derived.by(() => {
		if (!this.participant?.preferenceScores) return null;
		return {
			scores: this.participant.preferenceScores,
			workplaceDNA: getWorkplaceDNA(this.participant.preferenceScores),
			participant: this.participant,
			session: this.session!
		};
	});

	// Core methods
	loadSession = async (code: string) => {
		this.loading = true;
		this.error = null;
		try {
			this.session = await getSessionInfo({ code });
		} catch (error) {
			this.error = error instanceof Error ? error.message : 'Failed to load session';
		} finally {
			this.loading = false;
		}
	};

	joinSession = async (name: string, generation: GenerationOption) => {
		if (!this.session)
			return { success: false, error: 'No session loaded', participant: null, redirect: null };

		this.loading = true;
		try {
			const generationValue =
				typeof generation === 'object' && generation !== null && 'id' in generation
					? generation.id
					: generation;

			const result = await sessionOperation({
				code: this.session.code,
				operation: 'join',
				participantData: { name, generation: generationValue as any }
			});

			if (result.success && result.participant) {
				this.participant = result.participant as Participant;
				return { ...result, redirect: `/${this.session.code}/quiz` };
			}
			return { ...result, redirect: null };
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Failed to join session',
				participant: null,
				redirect: null
			};
		} finally {
			this.loading = false;
		}
	};

	loadQuizState = async (code: string, participantId: string) => {
		this.loading = true;
		this.error = null;
		try {
			const result = await getQuizStateRemote({ sessionCode: code, participantId });
			if (result.session && result.participant) {
				this.session = result.session;
				this.participant = result.participant;
				this.responses = result.responses || {};
				this.currentQuestionIndex = Math.min(
					Object.keys(this.responses).length,
					questions.length - 1
				);
				return result;
			} else {
				// Participant not found, clear localStorage and throw error
				localStorage.removeItem(`participant_${code}`);
				throw new Error('Participant not found. Please join the session again.');
			}
		} catch (error) {
			this.error = error instanceof Error ? error.message : 'Failed to load quiz';
			// Clear invalid participant data
			localStorage.removeItem(`participant_${code}`);
			throw error;
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

				// Send activity update for admin dashboard
				if (typeof window !== 'undefined' && window.parent) {
					window.dispatchEvent(
						new CustomEvent('quizActivity', {
							detail: {
								type: 'answer',
								participantId: this.participant.id,
								participantName: this.participant.name,
								questionIndex: this.currentQuestionIndex,
								sessionCode: this.session?.code
							}
						})
					);
				}
			}
			return result;
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Failed to submit answer'
			};
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
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Failed to complete quiz'
			};
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
		const sessionCode = code || this.session?.code;
		if (!sessionCode) return;

		this.loading = true;
		try {
			const result = await getCompletionResultsRemote({ sessionCode });
			if (result.session && result.participants) {
				this.session = result.session;
				const currentParticipant = result.participants.find((p) => p.id === this.participant?.id);
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

	cleanup = () => {
		this.session = null;
		this.participant = null;
		this.loading = false;
		this.error = null;
		this.participantName = '';
		this.responses = {};
		this.currentQuestionIndex = 0;
	};
}

// Simple instance management
const quizInstances = new Map<string, QuizState>();

export function getQuizState(sessionCode: string): QuizState {
	if (!quizInstances.has(sessionCode)) {
		quizInstances.set(sessionCode, new QuizState());
	}
	return quizInstances.get(sessionCode)!;
}

export function cleanupQuizState(sessionCode: string) {
	const instance = quizInstances.get(sessionCode);
	if (instance) {
		instance.cleanup();
		quizInstances.delete(sessionCode);
	}
}
