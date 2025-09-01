/**
 * App Remote Functions (consolidated)
 *
 * Centralized queries/commands used across the app:
 * - Sessions (create, list, toggle, delete, info)
 * - Maintenance (seed, cleanup)
 * - Templates (list, get, create, update, delete, apply, seed)
 */

import { query, command } from '$app/server';
import { db } from '$lib/server/db';
import { sessions, participants, activities, participantProgress } from '$lib/server/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { generateId } from '$lib/utils/id';
import { RemoteResponse } from '$lib/server/response';
import { validateResponse } from '$lib/server/schemas/common';
import { questions } from '$lib/server/data/questions';
import { calculatePreferenceScores } from '$lib/utils/scoring/index';
import {
	getActiveSession,
	getParticipant,
	getOrCreateParticipant,
	validateSessionParticipant
} from '$lib/server/db/helpers';
import {
	GetSessionInfoInput,
	GetSessionInfoOutput,
	CreateSessionInput,
	CreateSessionOutput,
	DeleteSessionInput,
	DeleteSessionOutput,
	ToggleSessionStatusInput,
	ToggleSessionStatusOutput,
	GetAllSessionsInput,
	GetAllSessionsOutput
} from '$lib/server/schemas/session';

// ----------------------------------------------------------------------------
// Sessions
// ----------------------------------------------------------------------------

export const getSessionInfo = query('unchecked', async ({ code }: { code: string }) => {
	const [session] = await db.select().from(sessions).where(eq(sessions.code, code)).limit(1);
	if (!session) throw new Error('Session not found');
	return validateResponse(GetSessionInfoOutput, {
		session: { ...session, endedAt: session.endedAt || undefined }
	});
});

export const getAllSessions = query('unchecked', async () => {
	const rows = await db
		.select({
			id: sessions.id,
			code: sessions.code,
			name: sessions.name,
			createdAt: sessions.createdAt,
			endedAt: sessions.endedAt,
			isActive: sessions.isActive,
			participantCount: sql<number>`(SELECT COUNT(*) FROM ${participants} WHERE ${participants.sessionId} = ${sessions.id})`,
			activityCount: sql<number>`1` // Phase 1: Always 1 activity (workplace-quiz)
		})
		.from(sessions)
		.orderBy(desc(sessions.createdAt))
		.limit(50);

	return validateResponse(GetAllSessionsOutput, {
		sessions: rows.map((s) => ({ ...s, endedAt: s.endedAt || undefined }))
	});
});

export const createSession = command('unchecked', async ({ name }: { name: string }) => {
	// simple code generator
	const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
	const numbers = '0123456789';
	const gen = () =>
		Array.from({ length: 3 }, () => letters[Math.floor(Math.random() * letters.length)]).join('') +
		'-' +
		Array.from({ length: 6 }, () => numbers[Math.floor(Math.random() * numbers.length)]).join('');

	let code = gen();
	for (let i = 0; i < 5; i++) {
		const exists = await db.select().from(sessions).where(eq(sessions.code, code)).limit(1);
		if (exists.length === 0) break;
		code = gen();
	}

	const session = {
		id: generateId(),
		code,
		name,
		createdAt: new Date().toISOString(),
		isActive: true as const
	};

	await db.insert(sessions).values(session);

	return RemoteResponse.success(
		{ success: true, data: session, redirect: `/admin/${session.code}` },
		{ invalidate: ['admin:sessions'] }
	);
});

export const deleteSession = command('unchecked', async ({ code }: { code: string }) => {
	const [session] = await db.select().from(sessions).where(eq(sessions.code, code)).limit(1);
	if (!session) return RemoteResponse.error('Session not found');
	await db.delete(participants).where(eq(participants.sessionId, session.id));
	await db.delete(sessions).where(eq(sessions.id, session.id));
	return RemoteResponse.success({ deleted: true }, { invalidate: ['admin:sessions'] });
});

export const toggleSessionStatus = command('unchecked', async ({ code }: { code: string }) => {
	const [session] = await db.select().from(sessions).where(eq(sessions.code, code)).limit(1);
	if (!session) throw new Error('Session not found');
	const newStatus = !session.isActive;
	const updates: any = {
		isActive: newStatus,
		endedAt: newStatus ? null : new Date().toISOString()
	};
	await db.update(sessions).set(updates).where(eq(sessions.id, session.id));
	return RemoteResponse.success(
		{ success: true, isActive: newStatus },
		{ invalidate: ['admin:sessions', `session:${code}`] }
	);
});

// ----------------------------------------------------------------------------
// Maintenance
// ----------------------------------------------------------------------------

export const seedDatabase = command('unchecked', async () => {
	try {
		const sampleSessions = [
			{ id: generateId(), code: 'DEMO01', name: 'Workplace Transformation Workshop' },
			{ id: generateId(), code: 'DEMO02', name: 'Future of Work Summit' },
			{ id: generateId(), code: 'DEMO03', name: 'Team Culture Assessment' }
		];
		for (const s of sampleSessions) await db.insert(sessions).values(s).onConflictDoNothing();
		return RemoteResponse.success({
			success: true,
			message: 'Database seeded with sample sessions'
		});
	} catch (e) {
		console.error('seedDatabase error:', e);
		throw new Error('Failed to seed database');
	}
});

export const cleanupDatabase = command(
	'unchecked',
	async ({ daysOld = 30 }: { daysOld?: number }) => {
		try {
			const cutoff = new Date();
			cutoff.setDate(cutoff.getDate() - daysOld);
			const cutoffStr = cutoff.toISOString();
			const deletedParticipants = await db
				.delete(participants)
				.where(
					sql`${participants.sessionId} IN (SELECT ${sessions.id} FROM ${sessions} WHERE ${sessions.createdAt} < ${cutoffStr} AND ${sessions.isActive} = false)`
				)
				.returning({ id: participants.id });
			const deletedSessions = await db
				.delete(sessions)
				.where(sql`${sessions.createdAt} < ${cutoffStr} AND ${sessions.isActive} = false`)
				.returning({ id: sessions.id });

			return RemoteResponse.success({
				message: `Cleaned up ${deletedSessions.length} sessions and ${deletedParticipants.length} participants`
			});
		} catch (e) {
			console.error('cleanupDatabase error:', e);
			throw new Error('Failed to clean up database');
		}
	}
);

// ----------------------------------------------------------------------------
// Templates
// ----------------------------------------------------------------------------

export const getTemplates = query('unchecked', async () => {
	const templates = await db
		.select()
		.from(activityTemplates)
		.where(eq(activityTemplates.isActive, true))
		.orderBy(desc(activityTemplates.createdAt));
	return { templates } as any;
});

export const getTemplate = query('unchecked', async ({ slug }: { slug: string }) => {
	const [template] = await db
		.select()
		.from(activityTemplates)
		.where(and(eq(activityTemplates.slug, slug), eq(activityTemplates.isActive, true)))
		.limit(1);
	if (!template) throw new Error('Template not found');
	return { template } as any;
});

export const getTemplatesByCategory = query(
	'unchecked',
	async ({ category }: { category: string }) => {
		const templates = await db
			.select()
			.from(activityTemplates)
			.where(and(eq(activityTemplates.category, category), eq(activityTemplates.isActive, true)))
			.orderBy(desc(activityTemplates.createdAt));
		return { templates } as any;
	}
);

export const createTemplate = command('unchecked', async ({ template }: { template: any }) => {
	const [existing] = await db
		.select()
		.from(activityTemplates)
		.where(eq(activityTemplates.slug, template.slug))
		.limit(1);
	if (existing) return RemoteResponse.error('Template with this slug already exists');
	const newTemplate = {
		id: generateId(),
		...template,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	} as any;
	await db.insert(activityTemplates).values(newTemplate);
	return RemoteResponse.success({ template: newTemplate }, { invalidate: ['templates'] });
});

export const updateTemplate = command(
	'unchecked',
	async ({ id, updates }: { id: string; updates: any }) => {
		const [existing] = await db
			.select()
			.from(activityTemplates)
			.where(eq(activityTemplates.id, id))
			.limit(1);
		if (!existing) return RemoteResponse.error('Template not found');
		const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() } as any;
		await db.update(activityTemplates).set(updated).where(eq(activityTemplates.id, id));
		return RemoteResponse.success({ template: updated }, { invalidate: ['templates'] });
	}
);

export const deleteTemplate = command('unchecked', async ({ id }: { id: string }) => {
	const [template] = await db
		.select()
		.from(activityTemplates)
		.where(eq(activityTemplates.id, id))
		.limit(1);
	if (!template) return RemoteResponse.error('Template not found');
	if ((template as any).isDefault) return RemoteResponse.error('Cannot delete default templates');
	await db.delete(activityTemplates).where(eq(activityTemplates.id, id));
	return RemoteResponse.success({ deleted: true }, { invalidate: ['templates'] });
});

export const applyTemplate = command(
	'unchecked',
	async ({ templateSlug, sessionCode }: { templateSlug: string; sessionCode: string }) => {
		const [template] = await db
			.select()
			.from(activityTemplates)
			.where(and(eq(activityTemplates.slug, templateSlug), eq(activityTemplates.isActive, true)))
			.limit(1);
		if (!template) return RemoteResponse.error('Template not found');

		const [session] = await db
			.select()
			.from(sessions)
			.where(eq(sessions.code, sessionCode))
			.limit(1);
		if (!session) return RemoteResponse.error('Session not found');

		const existing = await db
			.select()
			.from(sessionActivities)
			.where(eq(sessionActivities.sessionId, session.id));
		const maxOrder = existing.length ? Math.max(...existing.map((sa: any) => sa.order)) : 0;

		const toAdd = (template.activities as any[]).flatMap((ta: any) => {
			return db
				.select()
				.from(activities)
				.where(and(eq(activities.slug, ta.activitySlug), eq(activities.isActive, true)))
				.limit(1)
				.then(([activity]) =>
					activity
						? {
								id: generateId(),
								sessionId: session.id,
								activityId: activity.id,
								isActive: !!ta.isActive,
								order: maxOrder + ta.order,
								configOverride: ta.configOverride || {},
								createdAt: new Date().toISOString()
							}
						: null
				);
		});

		const resolved = (await Promise.all(toAdd)).filter(Boolean) as any[];
		if (resolved.length === 0) return RemoteResponse.error('No valid activities found in template');
		await db.insert(sessionActivities).values(resolved);
		return RemoteResponse.success(
			{ sessionCode, activitiesAdded: resolved.length },
			{ invalidate: [`session:${sessionCode}`, 'admin:sessions'] }
		);
	}
);

export const seedTemplates = command('unchecked', async () => {
	// Templates not supported in Phase 1 (simplified schema)
	return RemoteResponse.success({
		message: 'Templates not supported in Phase 1',
		count: 0
	});
});

// -----------------------------------------------------------------------------
// Quiz/Participant Operations
// -----------------------------------------------------------------------------

export const getQuizState = query(
	'unchecked',
	async ({ sessionCode, participantId }: { sessionCode: string; participantId: string }) => {
		const session = await getActiveSession(sessionCode);
		const participant = await getOrCreateParticipant(session.id, participantId);

		return {
			participantId: participant.id,
			sessionId: session.id,
			sessionName: session.name,
			responses: participant.responses || {},
			completed: participant.completed,
			questions
		};
	}
);

export const saveAnswer = command(
	'unchecked',
	async ({
		participantId,
		questionIndex,
		answer
	}: {
		participantId: string;
		questionIndex: number;
		answer: string;
	}) => {
		const participant = await getParticipant(participantId);
		if (!participant) throw new Error('Participant not found');

		const responses = { ...participant.responses, [questionIndex]: answer };
		await db.update(participants).set({ responses }).where(eq(participants.id, participantId));

		return RemoteResponse.success(
			{ success: true },
			{ invalidate: [`participant:${participant.sessionId}:${participantId}`] }
		);
	}
);

export const completeQuiz = command(
	'unchecked',
	async ({ sessionCode, participantId }: { sessionCode: string; participantId: string }) => {
		const session = await getActiveSession(sessionCode);
		const participant = await getOrCreateParticipant(session.id, participantId);

		// Calculate preference scores
		const scores = calculatePreferenceScores(participant.responses || {});

		await db
			.update(participants)
			.set({
				completed: true,
				completedAt: new Date().toISOString(),
				preferenceScores: scores
			})
			.where(eq(participants.id, participantId));

		return RemoteResponse.success(
			{
				success: true,
				redirect: `/${sessionCode}/complete`
			},
			{ invalidate: [`participant:${session.id}:${participantId}`, `session:${sessionCode}`] }
		);
	}
);

export const getCompletionResults = query(
	'unchecked',
	async ({ sessionCode }: { sessionCode: string }) => {
		const session = await getActiveSession(sessionCode);
		const participantsList = await db
			.select()
			.from(participants)
			.where(eq(participants.sessionId, session.id));

		const completedParticipants = participantsList.filter((p) => p.completed);
		const totalParticipants = participantsList.length;
		const completionRate =
			totalParticipants > 0 ? (completedParticipants.length / totalParticipants) * 100 : 0;

		return {
			session,
			participants: participantsList,
			totalCount: totalParticipants,
			completedCount: completedParticipants.length,
			completionRate: Math.round(completionRate)
		};
	}
);

export const removeParticipant = command(
	'unchecked',
	async ({ sessionCode, participantId }: { sessionCode: string; participantId: string }) => {
		const session = await getActiveSession(sessionCode);
		const participant = await getParticipant(participantId);

		if (!participant || participant.sessionId !== session.id) {
			throw new Error('Participant not found');
		}

		await db.delete(participants).where(eq(participants.id, participantId));

		return RemoteResponse.success({ deleted: true }, { invalidate: [`session:${sessionCode}`] });
	}
);
