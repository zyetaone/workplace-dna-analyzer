import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { sessions, participants } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { error, redirect, fail } from '@sveltejs/kit';
import { generateId } from '$lib/utils/id';

// Server-side load function - runs on every request
export const load: PageServerLoad = async ({ params, cookies }) => {
	const { code } = params;

	// Validate session code format
	if (!code || !/^[A-Z0-9]+-[0-9]{6}$/.test(code)) {
		throw error(404, 'Invalid session code');
	}

	// Get session from database
	const [session] = await db.select().from(sessions).where(eq(sessions.code, code)).limit(1);

	if (!session) {
		throw error(404, 'Session not found');
	}

	if (!session.isActive) {
		throw error(403, 'Session is no longer active');
	}

	// Check if participant already joined (via cookie)
	const participantId = cookies.get(`participant_${code}`);
	let participant = null;

	if (participantId) {
		[participant] = await db
			.select()
			.from(participants)
			.where(eq(participants.id, participantId))
			.limit(1);
	}

	// Return data to the page
	return {
		session: {
			code: session.code,
			name: session.name,
			isActive: session.isActive
		},
		participant,
		hasJoined: !!participant
	};
};

// Form actions - handle form submissions
export const actions: Actions = {
	// Handle join form submission
	join: async ({ request, params, cookies }) => {
		const { code } = params;
		const data = await request.formData();
		const name = data.get('name')?.toString();
		const generation = data.get('generation')?.toString();

		// Validate input
		if (!name || name.length < 2) {
			return fail(400, {
				error: 'Name must be at least 2 characters',
				values: { name, generation }
			});
		}

		if (!generation || !['Baby Boomer', 'Gen X', 'Millennial', 'Gen Z'].includes(generation)) {
			return fail(400, {
				error: 'Please select your generation',
				values: { name, generation }
			});
		}

		// Get session
		const [session] = await db.select().from(sessions).where(eq(sessions.code, code)).limit(1);

		if (!session || !session.isActive) {
			return fail(404, { error: 'Session not found or inactive' });
		}

		// Create participant
		const participantId = generateId();
		await db.insert(participants).values({
			id: participantId,
			sessionId: session.id,
			name,
			generation,
			joinedAt: new Date().toISOString()
		});

		// Set cookie for session persistence
		cookies.set(`participant_${code}`, participantId, {
			path: '/',
			maxAge: 60 * 60 * 24, // 1 day
			httpOnly: true,
			secure: true,
			sameSite: 'strict'
		});

		// Redirect to first activity (workplace quiz)
		throw redirect(303, `/${code}/activity/workplace-quiz`);
	}
};
