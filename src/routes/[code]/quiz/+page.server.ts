import type { PageServerLoad, Actions } from './$types';
import { fail, redirect, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { sessions, participants } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { questions } from '$lib/questions';

export const load: PageServerLoad = async ({ params, locals }) => {
	const { code } = params;
	
	if (!locals.participantId) {
		throw redirect(303, `/${code}`);
	}
	
	// Get session and participant
	const [session] = await db
		.select()
		.from(sessions)
		.where(eq(sessions.code, code))
		.limit(1);
	
	if (!session) {
		throw error(404, 'Session not found');
	}
	
	const [participant] = await db
		.select()
		.from(participants)
		.where(and(
			eq(participants.cookieId, locals.participantId),
			eq(participants.sessionId, session.id)
		))
		.limit(1);
	
	if (!participant) {
		throw redirect(303, `/${code}`);
	}
	
	if (participant.completed) {
		throw redirect(303, `/${code}/complete`);
	}
	
	return {
		code,
		session,
		participant,
		questions,
		responses: participant.responses || {}
	};
};

export const actions: Actions = {
	save: async ({ request, params, locals }) => {
		const { code } = params;
		const data = await request.formData();
		const questionIndex = Number(data.get('questionIndex'));
		const answer = data.get('answer')?.toString();
		
		if (!locals.participantId || answer === undefined) {
			return fail(400, { error: 'Invalid request' });
		}
		
		// Get participant
		const [participant] = await db
			.select()
			.from(participants)
			.where(eq(participants.cookieId, locals.participantId))
			.limit(1);
		
		if (!participant) {
			return fail(404, { error: 'Participant not found' });
		}
		
		// Update responses
		const responses = participant.responses || {};
		responses[`q${questionIndex}`] = answer;
		
		await db
			.update(participants)
			.set({ responses } as any)
			.where(eq(participants.id, participant.id));
		
		return { success: true };
	},
	
	complete: async ({ request, params, locals }) => {
		const { code } = params;
		
		if (!locals.participantId) {
			return fail(401, { error: 'Not authenticated' });
		}
		
		// Get participant
		const [participant] = await db
			.select()
			.from(participants)
			.where(eq(participants.cookieId, locals.participantId))
			.limit(1);
		
		if (!participant) {
			return fail(404, { error: 'Participant not found' });
		}
		
		const responses = participant.responses || {};
		
		// Calculate scores
		const scores = {
			collaboration: 0,
			formality: 0,
			tech: 0,
			wellness: 0
		};
		
		// Simple scoring
		questions.forEach((question, index) => {
			const answer = responses[`q${index}`];
			if (answer && question.options) {
				const option = question.options.find(o => o.id === answer);
				if (option?.values) {
					Object.entries(option.values).forEach(([metric, points]) => {
						if (typeof points === 'number') {
							scores[metric as keyof typeof scores] += points;
						}
					});
				}
			}
		});
		
		// Update participant
		await db
			.update(participants)
			.set({
				preferenceScores: scores,
				completed: true,
				completedAt: new Date()
			} as any)
			.where(eq(participants.id, participant.id));
		
		throw redirect(303, `/${code}/complete`);
	}
};
