import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { sessions, participants } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export const load: PageServerLoad = async ({ params, locals }) => {
	const { code } = params;
	
	// Get session
	const [session] = await db
		.select()
		.from(sessions)
		.where(eq(sessions.code, code))
		.limit(1);
	
	if (!session) {
		return { error: 'Session not found' };
	}
	
	if (!session.isActive) {
		return { error: 'Session is not active' };
	}
	
	// Check if already joined
	if (locals.participantId) {
		const [existing] = await db
			.select()
			.from(participants)
			.where(and(
				eq(participants.cookieId, locals.participantId),
				eq(participants.sessionId, session.id)
			))
			.limit(1);
		
		if (existing) {
			throw redirect(303, `/${code}/quiz`);
		}
	}
	
	return { session };
};

export const actions: Actions = {
	default: async ({ request, params, locals }) => {
		const { code } = params;
		const data = await request.formData();
		const name = data.get('name')?.toString();
		const generation = data.get('generation')?.toString() || 'Gen Z';
		
		if (!name || name.trim().length < 2) {
			return fail(400, { error: 'Please enter your name' });
		}
		
		// Get session
		const [session] = await db
			.select()
			.from(sessions)
			.where(eq(sessions.code, code))
			.limit(1);
		
		if (!session) {
			return fail(404, { error: 'Session not found' });
		}
		
		if (!session.isActive) {
			return fail(400, { error: 'Session is not active' });
		}
		
		// Create participant
		await db.insert(participants).values({
			sessionId: session.id,
			cookieId: locals.participantId || nanoid(),
			name: name.trim(),
			generation
		} as any);
		
		throw redirect(303, `/${code}/quiz`);
	}
};
