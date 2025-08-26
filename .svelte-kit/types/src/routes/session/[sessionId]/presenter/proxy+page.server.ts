// @ts-nocheck
import { getSession } from '../../../session.remote';
import type { PageServerLoad } from './$types';

export const load = async ({ params }: Parameters<PageServerLoad>[0]) => {
	const { sessionId } = params;
	
	try {
		// Load session data on the server
		const sessionData = await getSession(sessionId);
		
		console.log('[Page Server Load] Session loaded:', {
			sessionId,
			attendeeCount: sessionData.attendees?.length || 0,
			completed: sessionData.attendees?.filter((a: any) => a.completed).length || 0
		});
		
		return {
			sessionId,
			initialSession: sessionData,
			initialAttendees: sessionData.attendees || []
		};
	} catch (error) {
		console.error('[Page Server Load] Failed to load session:', error);
		return {
			sessionId,
			initialSession: null,
			initialAttendees: []
		};
	}
};