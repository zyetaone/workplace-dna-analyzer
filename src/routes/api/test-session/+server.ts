import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { sessions, attendees } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export async function GET({ url }) {
	const sessionId = url.searchParams.get('id') || '8ff9174e-3c53-4fb5-a7dd-8c45d4bbaa3c';
	
	try {
		// Get session
		const [session] = await db
			.select()
			.from(sessions)
			.where(eq(sessions.id, sessionId));
		
		if (!session) {
			return json({ error: 'Session not found' }, { status: 404 });
		}
		
		// Get attendees
		const sessionAttendees = await db
			.select()
			.from(attendees)
			.where(eq(attendees.sessionId, sessionId));
		
		// Calculate stats
		const completed = sessionAttendees.filter(a => a.completed);
		const active = sessionAttendees.filter(a => !a.completed);
		
		// Calculate average scores
		const scores = completed.reduce((acc, attendee) => {
			const pref = attendee.preferenceScores as any;
			if (pref) {
				acc.collaboration += pref.collaboration || 0;
				acc.formality += pref.formality || 0;
				acc.technology += pref.tech || pref.technology || 0;
				acc.wellness += pref.wellness || 0;
			}
			return acc;
		}, { collaboration: 0, formality: 0, technology: 0, wellness: 0 });
		
		if (completed.length > 0) {
			scores.collaboration = Math.round(scores.collaboration / completed.length);
			scores.formality = Math.round(scores.formality / completed.length);
			scores.technology = Math.round(scores.technology / completed.length);
			scores.wellness = Math.round(scores.wellness / completed.length);
		}
		
		return json({
			session: {
				id: session.id,
				code: session.code,
				name: session.name
			},
			stats: {
				total: sessionAttendees.length,
				active: active.length,
				completed: completed.length,
				responseRate: sessionAttendees.length > 0 
					? Math.round((completed.length / sessionAttendees.length) * 100)
					: 0
			},
			averageScores: scores,
			attendees: sessionAttendees.map(a => ({
				id: a.id,
				name: a.name,
				completed: a.completed,
				generation: a.generation,
				scores: a.preferenceScores
			}))
		});
		
	} catch (error) {
		console.error('Test endpoint error:', error);
		return json({ error: 'Failed to fetch data' }, { status: 500 });
	}
}