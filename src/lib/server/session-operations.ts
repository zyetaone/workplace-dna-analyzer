/**
 * Simplified Session Operations - Consolidated remote functions
 */

import * as v from 'valibot';
import { query, command } from '$app/server';
import { db } from '$lib/server/db';
import { sessions, participants } from '$lib/server/db/schema';
import { eq, desc, and, sql } from 'drizzle-orm';
import { questions } from '$lib/questions';
import { calculatePreferenceScores } from '$lib/utils/scoring';
import { generateId, generateSessionCode } from '$lib/utils/id';
import { sessionCodeSchema, participantNameSchema, generationSchema, questionIndexSchema } from '$lib/validation';

// Core session operations
export const createSession = command(
  v.object({ name: v.string() }),
  async ({ name }) => {
    let code: string;
    let attempts = 0;
    const maxAttempts = 10;

    // Generate unique code with retry logic
    do {
      code = generateSessionCode();
      const [existing] = await db.select().from(sessions).where(eq(sessions.code, code)).limit(1);
      if (!existing) break;
      attempts++;
    } while (attempts < maxAttempts);

    if (attempts >= maxAttempts) {
      throw new Error('Failed to generate unique session code');
    }
    await db.insert(sessions).values({ name, code } as any);
    return { success: true, code, redirect: `/admin/${code}` };
  }
);

export const getSession = query(
  v.object({ code: sessionCodeSchema }),
  async ({ code }) => {
    // Additional validation for better error messages
    if (!code || code.length !== 6 || !/^[A-Z0-9]{6}$/.test(code)) {
      throw new Error('Invalid session code format. Session codes must be exactly 6 uppercase letters and/or numbers.');
    }

    const [session] = await db.select().from(sessions).where(eq(sessions.code, code)).limit(1);
    if (!session) {
      throw new Error(`Session with code "${code}" not found. Please check the code and try again.`);
    }
    return session;
  }
);

export const getSessionWithParticipants = query(
  v.object({ code: sessionCodeSchema }),
  async ({ code }) => {
    const session = await getSession({ code });
    const sessionParticipants = await db
      .select()
      .from(participants)
      .where(eq(participants.sessionId, session.id))
      .orderBy(desc(participants.joinedAt));

    return { session, participants: sessionParticipants };
  }
);

// Participant operations
export const joinSession = command(
  v.object({
    sessionCode: sessionCodeSchema,
    name: participantNameSchema,
    generation: generationSchema,
    participantId: v.optional(v.string())
  }),
  async ({ sessionCode, name, generation, participantId }) => {
    const session = await getSession({ code: sessionCode });

    // Handle rejoining existing participant
    if (participantId) {
      const [existing] = await db
        .select()
        .from(participants)
        .where(and(eq(participants.id, participantId), eq(participants.sessionId, session.id)))
        .limit(1);

      if (existing) {
        if (existing.name !== name || existing.generation !== generation) {
          await db.update(participants)
            .set({ name, generation } as any)
            .where(eq(participants.id, participantId));
        }
        return {
          success: true,
          participantId: existing.id,
          redirect: existing.completed ? `/${sessionCode}/complete` : `/${sessionCode}/quiz`
        };
      }
    }

    // Create new participant
    const newId = participantId || generateId();
    const [newParticipant] = await db.insert(participants).values({
      id: newId,
      sessionId: session.id,
      name,
      generation
    } as any).returning();

    return {
      success: true,
      participantId: newParticipant.id,
      redirect: `/${sessionCode}/quiz`
    };
  }
);

export const getQuizData = query(
  v.object({ sessionCode: sessionCodeSchema, participantId: v.string() }),
  async ({ sessionCode, participantId }) => {
    const session = await getSession({ code: sessionCode });
    const [participant] = await db
      .select()
      .from(participants)
      .where(and(eq(participants.id, participantId), eq(participants.sessionId, session.id)))
      .limit(1);

    if (!participant) throw new Error('Participant not found');
    if (participant.completed) return { redirect: `/${sessionCode}/complete` };

    return {
      session,
      participant,
      questions,
      responses: participant.responses || {}
    };
  }
);

export const saveAnswer = command(
  v.object({
    participantId: v.string(),
    questionIndex: questionIndexSchema,
    answer: v.string()
  }),
  async ({ participantId, questionIndex, answer }) => {
    const [participant] = await db.select().from(participants).where(eq(participants.id, participantId)).limit(1);
    if (!participant) throw new Error('Participant not found');

    const responses = { ...participant.responses, [`q${questionIndex}`]: answer };
    await db.update(participants).set({ responses } as any).where(eq(participants.id, participantId));

    return { success: true };
  }
);

export const completeQuiz = command(
  v.object({ sessionCode: sessionCodeSchema, participantId: v.string() }),
  async ({ sessionCode, participantId }) => {
    const session = await getSession({ code: sessionCode });
    const [participant] = await db
      .select()
      .from(participants)
      .where(and(eq(participants.id, participantId), eq(participants.sessionId, session.id)))
      .limit(1);

    if (!participant) throw new Error('Participant not found');
    if (participant.completed) return { success: true, redirect: `/${sessionCode}/complete` };

    const responses = participant.responses || {};
    const responseArray = Object.entries(responses).map(([key, answer]) => ({
      questionNumber: parseInt(key.substring(1)),
      answer: answer as string
    }));

    const scores = calculatePreferenceScores(responseArray);

    await db.update(participants)
      .set({
        preferenceScores: scores,
        completed: true,
        completedAt: new Date().toISOString()
      } as any)
      .where(eq(participants.id, participantId));

    return { success: true, redirect: `/${sessionCode}/complete` };
  }
);

// Admin operations
export const updateSessionStatus = command(
  v.object({
    code: sessionCodeSchema,
    isActive: v.optional(v.boolean()),
    endSession: v.optional(v.boolean())
  }),
  async ({ code, isActive, endSession }) => {
    const session = await getSession({ code });
    const updates: any = {};

    if (endSession) {
      updates.isActive = false;
      updates.endedAt = new Date().toISOString();
    } else if (isActive !== undefined) {
      updates.isActive = isActive;
    }

    await db.update(sessions).set(updates).where(eq(sessions.id, session.id));
    return { success: true, code };
  }
);

export const removeParticipant = command(
  v.object({
    code: sessionCodeSchema,
    participantId: v.string()
  }),
  async ({ code, participantId }) => {
    const session = await getSession({ code });
    await db
      .delete(participants)
      .where(and(eq(participants.id, participantId), eq(participants.sessionId, session.id)));
    return { success: true };
  }
);

export const getAllSessions = query(
  v.object({}),
  async () => {
    return await db
      .select({
        id: sessions.id,
        name: sessions.name,
        code: sessions.code,
        isActive: sessions.isActive,
        createdAt: sessions.createdAt,
        endedAt: sessions.endedAt,
        activeCount: sql<number>`COUNT(CASE WHEN ${participants.completed} = 0 THEN 1 END)`.as('activeCount'),
        completedCount: sql<number>`COUNT(CASE WHEN ${participants.completed} = 1 THEN 1 END)`.as('completedCount')
      })
      .from(sessions)
      .leftJoin(participants, eq(sessions.id, participants.sessionId))
      .groupBy(sessions.id)
      .orderBy(desc(sessions.createdAt));
  }
);

export const deleteSession = command(
  v.object({ code: sessionCodeSchema }),
  async ({ code }) => {
    const session = await getSession({ code });
    await db.delete(participants).where(eq(participants.sessionId, session.id));
    await db.delete(sessions).where(eq(sessions.id, session.id));
    return { success: true };
  }
);

// Additional participant operations
export const getCompletionResults = query(
  v.object({ sessionCode: sessionCodeSchema, participantId: v.string() }),
  async ({ sessionCode, participantId }) => {
    const session = await getSession({ code: sessionCode });
    const [participant] = await db
      .select()
      .from(participants)
      .where(and(eq(participants.id, participantId), eq(participants.sessionId, session.id)))
      .limit(1);

    if (!participant) throw new Error('Participant not found');
    if (!participant.completed) return { redirect: `/${sessionCode}/quiz` };

    const scores = participant.preferenceScores || {
      collaboration: 0, formality: 0, tech: 0, wellness: 0
    };

    return { session, participant, scores };
  }
);