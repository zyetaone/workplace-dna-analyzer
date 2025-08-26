import type { PageLoad } from './$types';
import { refreshSessionData } from '../../../session.remote';

export const load: PageLoad = async ({ params }) => {
	try {
		const sessionData = await refreshSessionData(params.sessionId);
		if (!sessionData) {
			return {
				session: null,
				sessionCode: null,
				error: 'Session not found'
			};
		}
		return {
			session: sessionData,
			sessionCode: sessionData.code
		};
	} catch (error) {
		console.error('Failed to load session:', error);
		return {
			session: null,
			sessionCode: null,
			error: 'Session not found'
		};
	}
};