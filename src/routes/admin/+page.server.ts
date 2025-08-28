import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { sessions, participants } from '$lib/server/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { redirect, fail } from '@sveltejs/kit';
import { nanoid } from 'nanoid';

// Load all sessions for the presenter
export const load: PageServerLoad = async ({ depends, locals }) => {
	depends('dashboard:sessions');
	

	
	// Get all sessions with participant counts
	const allSessions = await db
		.select({
			id: sessions.id,
			slug: sessions.slug,
			name: sessions.name,
			code: sessions.code,
			presenterId: sessions.presenterId,
			isActive: sessions.isActive,
			createdAt: sessions.createdAt,
			activeCount: sql<number>`
				COUNT(CASE WHEN ${participants.completed} = 0 THEN 1 END)
			`.as('activeCount'),
			completedCount: sql<number>`
				COUNT(CASE WHEN ${participants.completed} = 1 THEN 1 END)
			`.as('completedCount')
		})
		.from(sessions)
		.leftJoin(participants, eq(sessions.id, participants.sessionId))
		
		.groupBy(sessions.id)
		.orderBy(desc(sessions.createdAt));
	
	return {
		sessions: allSessions
	};
};

// Form actions for session management
export const actions: Actions = {
	// Create a new session
	createSession: async ({ request, locals }) => {
	
		
		const formData = await request.formData();
		const title = formData.get('title')?.toString();
		
		if (!title || title.trim().length < 2) {
			return fail(400, { error: 'Please enter a session name' });
		}
		
		const sessionId = nanoid();
		const code = Math.random().toString(36).substring(2, 8).toUpperCase();
		
		await db.insert(sessions).values({
			slug: code, // Use code as slug for simplicity
			name: title.trim(),
			code,
			presenterId: 'default-admin'
		} as any);
		
		// Redirect to the session management page
		throw redirect(302, `/admin/${code}`);
	},
	
	// Delete a session
	deleteSession: async ({ request, locals }) => {
	
		
		const formData = await request.formData();
		const code = formData.get('code')?.toString();
		
		if (!code) {
			return fail(400, { error: 'Invalid session' });
		}
		
		// Find session and verify ownership
		const [session] = await db
			.select()
			.from(sessions)
			.where(eq(sessions.code, code))
			.limit(1);
		
		if (!session) {
			return fail(404, { error: 'Session not found' });
		}
		

		
		// Delete participants and session
		await db.delete(participants).where(eq(participants.sessionId, session.id));
		await db.delete(sessions).where(eq(sessions.id, session.id));
		
		return { success: true };
	}
};