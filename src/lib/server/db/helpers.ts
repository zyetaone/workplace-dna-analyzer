/**
 * Database Query Helpers
 * Reusable database operations to reduce code duplication
 */

import { and, eq, sql, desc } from 'drizzle-orm';
import { db } from './index';
import { sessions, participants, activities, participantProgress } from './schema';
import { NotFoundError, ValidationError, InactiveError } from '$lib/errors';

// ============================================================================
// SESSION HELPERS
// ============================================================================

/**
 * Get an active session by code
 * Throws if session doesn't exist or is inactive
 */
export async function getActiveSession(code: string) {
	const [session] = await db.select().from(sessions).where(eq(sessions.code, code)).limit(1);

	if (!session) {
		throw new NotFoundError('Session');
	}

	if (!session.isActive) {
		throw new InactiveError('Session');
	}

	return session;
}

/**
 * Get session with participant counts
 */
export async function getSessionWithCounts(code: string) {
	const [session] = await db
		.select({
			id: sessions.id,
			code: sessions.code,
			name: sessions.name,
			isActive: sessions.isActive,
			createdAt: sessions.createdAt,
			endedAt: sessions.endedAt,
			activeCount: sql<number>`(
				SELECT COUNT(*) FROM ${participants} 
				WHERE ${participants.sessionId} = ${sessions.id} 
				AND ${participants.completed} = false
			)`,
			completedCount: sql<number>`(
				SELECT COUNT(*) FROM ${participants} 
				WHERE ${participants.sessionId} = ${sessions.id} 
				AND ${participants.completed} = true
			)`
		})
		.from(sessions)
		.where(eq(sessions.code, code))
		.limit(1);

	if (!session) {
		throw new NotFoundError('Session');
	}

	return session;
}

/**
 * Get or throw session by ID
 */
export async function getSessionById(sessionId: string) {
	const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);

	if (!session) {
		throw new NotFoundError('Session');
	}

	return session;
}

// ============================================================================
// PARTICIPANT HELPERS
// ============================================================================

/**
 * Get a participant by ID and session
 */
export async function getParticipant(participantId: string, sessionId: string) {
	const [participant] = await db
		.select()
		.from(participants)
		.where(and(eq(participants.id, participantId), eq(participants.sessionId, sessionId)))
		.limit(1);

	if (!participant) {
		throw new NotFoundError('Participant');
	}

	return participant;
}

/**
 * Get participant and validate not completed
 */
export async function getActiveParticipant(participantId: string, sessionId: string) {
	const participant = await getParticipant(participantId, sessionId);

	if (participant.completed) {
		throw new ValidationError('Quiz already completed');
	}

	return participant;
}

/**
 * Create or get participant
 */
export async function getOrCreateParticipant(sessionId: string, participantId?: string) {
	if (participantId) {
		const [existing] = await db
			.select()
			.from(participants)
			.where(and(eq(participants.id, participantId), eq(participants.sessionId, sessionId)))
			.limit(1);

		if (existing) {
			return existing;
		}
	}

	// Create new participant
	const { generateId } = await import('$lib/utils/id');
	const newParticipant = {
		id: generateId(),
		sessionId,
		responses: {},
		completed: false
	};

	const [created] = await db.insert(participants).values(newParticipant).returning();

	return created;
}

/**
 * Get session participants with optional filters
 */
export async function getSessionParticipants(
	sessionId: string,
	options?: {
		completed?: boolean;
		limit?: number;
		orderBy?: 'joinedAt' | 'completedAt';
	}
) {
	let whereExpr: any = eq(participants.sessionId, sessionId);
	if (options?.completed !== undefined) {
		whereExpr = and(whereExpr, eq(participants.completed, options.completed));
	}

	let builder: any = db
		.select()
		.from(participants)
		.where(whereExpr)
		.orderBy(
			options?.orderBy === 'completedAt'
				? desc(participants.completedAt)
				: desc(participants.joinedAt)
		);

	if (options?.limit) {
		builder = builder.limit(options.limit);
	}

	return await builder;
}

// ============================================================================
// ACTIVITY HELPERS
// ============================================================================

/**
 * Get activity by slug
 */
export async function getActivityBySlug(slug: string) {
	const [activity] = await db
		.select()
		.from(activities)
		.where(and(eq(activities.slug, slug), eq(activities.isActive, true)))
		.limit(1);

	if (!activity) {
		throw new NotFoundError('Activity');
	}

	return activity;
}

/**
 * Get session activity link
 */
export async function getSessionActivity(sessionId: string, activityId: string) {
	const [sessionActivity] = await db
		.select()
		.from(sessionActivities)
		.where(
			and(eq(sessionActivities.sessionId, sessionId), eq(sessionActivities.activityId, activityId))
		)
		.limit(1);

	if (!sessionActivity) {
		throw new NotFoundError('Activity not configured for this session');
	}

	return sessionActivity;
}

/**
 * Get or create participant activity progress
 */
export async function getOrCreateParticipantActivity(
	participantId: string,
	activityId: string,
	sessionActivityId: string
) {
	const [existing] = await db
		.select()
		.from(participantActivities)
		.where(
			and(
				eq(participantActivities.participantId, participantId),
				eq(participantActivities.activityId, activityId),
				eq(participantActivities.sessionActivityId, sessionActivityId)
			)
		)
		.limit(1);

	if (existing) {
		return existing;
	}

	// Create new participant activity
	const { generateId } = await import('$lib/utils/id');
	const newRecord = {
		id: generateId(),
		participantId,
		activityId,
		sessionActivityId,
		responses: {},
		startedAt: new Date().toISOString(),
		isCompleted: false,
		progress: 0
	};

	await db.insert(participantActivities).values(newRecord);
	return newRecord as typeof participantActivities.$inferSelect;
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate session and participant together
 */
export async function validateSessionParticipant(sessionCode: string, participantId: string) {
	const session = await getActiveSession(sessionCode);
	const participant = await getParticipant(participantId, session.id);

	return { session, participant };
}

/**
 * Validate session, participant, and activity
 */
export async function validateActivityAccess(
	sessionCode: string,
	participantId: string,
	activitySlug: string
) {
	const session = await getActiveSession(sessionCode);
	const participant = await getParticipant(participantId, session.id);
	const activity = await getActivityBySlug(activitySlug);
	const sessionActivity = await getSessionActivity(session.id, activity.id);

	return {
		session,
		participant,
		activity,
		sessionActivity
	};
}

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

/**
 * Delete session and all related data
 */
export async function deleteSessionCascade(sessionCode: string) {
	const session = await getActiveSession(sessionCode);

	// Delete in order due to foreign key constraints
	await db
		.delete(participantActivities)
		.where(
			eq(
				participantActivities.participantId,
				sql`(SELECT id FROM ${participants} WHERE ${participants.sessionId} = ${session.id})`
			)
		);
	await db.delete(participants).where(eq(participants.sessionId, session.id));
	await db.delete(sessionActivities).where(eq(sessionActivities.sessionId, session.id));
	await db.delete(sessions).where(eq(sessions.id, session.id));

	return session;
}

/**
 * Update participant responses and calculate progress
 */
export async function updateParticipantResponses(
	participantId: string,
	sessionId: string,
	questionIndex: string | number,
	answer: any
) {
	const participant = await getActiveParticipant(participantId, sessionId);

	const responses = participant.responses || {};
	responses[questionIndex] = answer;

	await db
		.update(participants)
		.set({ responses } as any)
		.where(eq(participants.id, participantId));

	return responses;
}
