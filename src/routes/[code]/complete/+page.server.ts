import type { PageServerLoad } from './$types';
import { error, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { sessions, participants } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params, locals }) => {
	const { code } = params;
	
	if (!locals.participantId) {
		throw redirect(303, `/${code}`);
	}
	
	// Get session
	const [session] = await db
		.select()
		.from(sessions)
		.where(eq(sessions.code, code))
		.limit(1);
	
	if (!session) {
		throw error(404, 'Session not found');
	}
	
	// Get participant
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
	
	if (!participant.completed) {
		throw redirect(303, `/${code}/quiz`);
	}
	
	return {
		code,
		session,
		participant,
		scores: participant.preferenceScores || {
			collaboration: 0,
			formality: 0,
			tech: 0,
			wellness: 0
		}
	};
};