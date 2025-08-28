import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';


export const load: PageServerLoad = async (event) => {
	const { code } = event.params;
	
	// Import database and schema directly for server-side access
	const { db } = await import('$lib/server/db');
	const { sessions, participants } = await import('$lib/server/db/schema');
	const { eq, desc } = await import('drizzle-orm');

	// Set up targeted invalidation dependency
	event.depends(`session:${code}`);

	try {
		// Get session by code directly from database
		const [session] = await db
			.select()
			.from(sessions)
			.where(eq(sessions.code, code))
			.limit(1);

		if (!session) {
			throw error(404, `Session not found: ${code}`);
		}

		// Get all participants for this session
		const sessionParticipants = await db
			.select()
			.from(participants)
			.where(eq(participants.sessionId, session.id))
			.orderBy(desc(participants.joinedAt));

		// Return the raw data. All analytics will be computed on the client.
		return {
			session,
			participants: sessionParticipants || [],
			analytics: null // Analytics computed client-side in admin.svelte.ts
		};

	} catch (err) {
		console.error('Error loading session analytics:', err);
		
		if (err instanceof Error && 'status' in err && typeof err.status === 'number') {
			throw error(err.status, (err as any).body?.message || 'Failed to load session data');
		}
		
		throw error(500, 'Failed to load session data');
	}
};
