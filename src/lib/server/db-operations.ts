/**
 * Simplified Database Operations - Combined queries for efficiency
 */

import { db } from '$lib/server/db';
import { sessions, participants } from '$lib/server/db/schema';
import { eq, desc, and, sql } from 'drizzle-orm';

// Combined session and participant data query
export async function getSessionWithAnalytics(code: string) {
  const [session] = await db.select().from(sessions).where(eq(sessions.code, code)).limit(1);
  if (!session) return null;

  // Single query to get participants with computed stats
  const sessionParticipants = await db
    .select()
    .from(participants)
    .where(eq(participants.sessionId, session.id))
    .orderBy(desc(participants.joinedAt));

  // Compute analytics in memory (simpler than complex SQL)
  const completed = sessionParticipants.filter(p => p.completed);
  const active = sessionParticipants.filter(p => !p.completed);

  const analytics = {
    totalParticipants: sessionParticipants.length,
    completedCount: completed.length,
    activeCount: active.length,
    completionRate: sessionParticipants.length > 0
      ? Math.round((completed.length / sessionParticipants.length) * 100)
      : 0,
    generationBreakdown: sessionParticipants.reduce((acc, p) => {
      const gen = p.generation || 'Unknown';
      acc[gen] = (acc[gen] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    averageScores: completed.length > 0 ? {
      collaboration: Math.round(completed.reduce((sum, p) => sum + (p.preferenceScores?.collaboration || 0), 0) / completed.length),
      formality: Math.round(completed.reduce((sum, p) => sum + (p.preferenceScores?.formality || 0), 0) / completed.length),
      tech: Math.round(completed.reduce((sum, p) => sum + (p.preferenceScores?.tech || 0), 0) / completed.length),
      wellness: Math.round(completed.reduce((sum, p) => sum + (p.preferenceScores?.wellness || 0), 0) / completed.length)
    } : { collaboration: 0, formality: 0, tech: 0, wellness: 0 }
  };

  return {
    session,
    participants: sessionParticipants,
    analytics
  };
}

// Combined session list with participant counts
export async function getAllSessionsWithCounts() {
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

// Batch participant operations
export async function batchUpdateParticipants(sessionId: string, updates: Array<{
  id: string;
  responses?: Record<string, any>;
  preferenceScores?: Record<string, number>;
  completed?: boolean;
  completedAt?: string;
}>) {
  const promises = updates.map(update =>
    db.update(participants)
      .set(update as any)
      .where(and(eq(participants.id, update.id), eq(participants.sessionId, sessionId)))
  );

  await Promise.all(promises);
}

// Simplified participant lookup with session validation
export async function getValidatedParticipant(sessionCode: string, participantId: string) {
  const [session] = await db.select().from(sessions).where(eq(sessions.code, sessionCode)).limit(1);
  if (!session) return null;

  const [participant] = await db
    .select()
    .from(participants)
    .where(and(eq(participants.id, participantId), eq(participants.sessionId, session.id)))
    .limit(1);

  return participant ? { session, participant } : null;
}