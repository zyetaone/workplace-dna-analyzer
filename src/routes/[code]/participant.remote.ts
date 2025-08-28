/**
 * Participant remote functions - Client-side wrappers for server operations
 */

import * as v from 'valibot';
import { query, command } from '$app/server';
import {
  getSession,
  joinSession,
  getQuizData,
  saveAnswer,
  completeQuiz,
  getCompletionResults
} from '$lib/server/session-operations';
import { sessionCodeSchema, participantNameSchema, generationSchema, questionIndexSchema } from '$lib/validation';

// Remote functions for client-side usage
export const getSessionInfo = query(
  v.object({ code: sessionCodeSchema }),
  async ({ code }) => {
    try {
      const session = await getSession({ code });
      return { session, error: null };
    } catch (error) {
      return { session: null, error: error instanceof Error ? error.message : 'Session not found' };
    }
  }
);

export const joinSessionRemote = command(
  v.object({
    sessionCode: sessionCodeSchema,
    name: participantNameSchema,
    generation: generationSchema,
    participantId: v.optional(v.string())
  }),
  async ({ sessionCode, name, generation, participantId }) => {
    return await joinSession({ sessionCode, name, generation, participantId });
  }
);

export const getQuizState = query(
  v.object({ sessionCode: sessionCodeSchema, participantId: v.string() }),
  async ({ sessionCode, participantId }) => {
    return await getQuizData({ sessionCode, participantId });
  }
);

export const saveQuizAnswer = command(
  v.object({
    participantId: v.string(),
    questionIndex: questionIndexSchema,
    answer: v.string()
  }),
  async ({ participantId, questionIndex, answer }) => {
    return await saveAnswer({ participantId, questionIndex, answer });
  }
);

export const completeQuizRemote = command(
  v.object({ sessionCode: sessionCodeSchema, participantId: v.string() }),
  async ({ sessionCode, participantId }) => {
    return await completeQuiz({ sessionCode, participantId });
  }
);

export const getCompletionResultsRemote = query(
  v.object({ sessionCode: sessionCodeSchema, participantId: v.string() }),
  async ({ sessionCode, participantId }) => {
    return await getCompletionResults({ sessionCode, participantId });
  }
);