/**
 * Quiz Server Actions - Integrated from example-quiz
 * Handles quiz responses and completion for participant sessions
 */

import { fail, redirect, type Actions, type RequestEvent } from '@sveltejs/kit';
import { questions } from '$lib/server/data/questions';
import { calculatePreferenceScores } from '$lib/utils/scoring/index';
import { db } from '$lib/server/db';
import { sessions, participants, participantProgress } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const actions: Actions = {
	// Save individual quiz response
	saveResponse: async ({ request, params, cookies }) => {
		try {
			const sessionCode = params.code;
			const formData = await request.formData();

			const questionId = formData.get('questionId') as string;
			const response = formData.get('response') as string;
			const participantId = cookies.get(`participant_${sessionCode}`) || 'anonymous';

			// Validate required fields
			if (!questionId || !response) {
				return fail(400, {
					error: 'Missing required fields',
					values: { questionId, response }
				});
			}

			// Parse response if it's JSON
			let parsedResponse;
			try {
				parsedResponse = JSON.parse(response);
			} catch {
				parsedResponse = response;
			}

			// Save to database if we have a real participant
			if (participantId !== 'anonymous') {
				try {
					// Get existing progress or create new
					const [existingProgress] = await db
						.select()
						.from(participantProgress)
						.where(eq(participantProgress.participantId, participantId))
						.limit(1);

					const responses = existingProgress?.responses || {};
					responses[questionId] = parsedResponse;

					if (existingProgress) {
						await db
							.update(participantProgress)
							.set({
								responses,
								completed: false
							})
							.where(eq(participantProgress.id, existingProgress.id));
					} else {
						await db.insert(participantProgress).values({
							participantId,
							activitySlug: 'workplace-preference',
							responses,
							completed: false
						});
					}
				} catch (dbError) {
					console.warn('Database save failed, continuing:', dbError);
				}
			}

			console.log('Quiz response saved:', {
				sessionCode,
				participantId,
				questionId,
				response: parsedResponse,
				timestamp: new Date().toISOString()
			});

			// Simulate API delay
			await new Promise((resolve) => setTimeout(resolve, 200));

			return {
				success: true,
				questionId,
				response: parsedResponse,
				timestamp: new Date().toISOString()
			};
		} catch (error) {
			console.error('Error saving quiz response:', error);
			return fail(500, {
				error: 'Failed to save response',
				details: error instanceof Error ? error.message : 'Unknown error'
			});
		}
	},

	// Complete quiz and save final results
	completeQuiz: async ({ request, params, cookies }) => {
		try {
			const sessionCode = params.code;
			const formData = await request.formData();

			const responses = formData.get('responses') as string;
			const participantId = cookies.get(`participant_${sessionCode}`) || 'anonymous';

			if (!responses) {
				return fail(400, {
					error: 'Missing responses for quiz completion'
				});
			}

			// Parse responses
			let parsedResponses;
			try {
				parsedResponses = JSON.parse(responses);
			} catch {
				return fail(400, {
					error: 'Invalid responses format'
				});
			}

			// Calculate results using our scoring system
			const responseMap: Record<string, string> = {};
			parsedResponses.forEach((r: any) => {
				if (r.questionId && r.value !== undefined) {
					responseMap[r.questionId] = r.value;
				}
			});

			// Convert to ResponseItem format for scoring
			const responseItems = Object.entries(responseMap).map(([questionId, answerId]) => ({
				questionId,
				answerId: answerId.toString()
			}));

			const scores = calculatePreferenceScores(responseItems);

			// Calculate completion stats
			const totalQuestions = parsedResponses.length;
			const answeredQuestions = parsedResponses.filter(
				(r: any) => r.value !== undefined && r.value !== ''
			).length;
			const completionRate = Math.round((answeredQuestions / totalQuestions) * 100);

			// Determine sentiment based on scores
			const avgScore =
				(scores.collaboration + scores.formality + scores.tech + scores.wellness) / 4;
			let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
			if (avgScore >= 7) sentiment = 'positive';
			else if (avgScore <= 4) sentiment = 'negative';

			// Save completion to database if we have a real participant
			if (participantId !== 'anonymous') {
				try {
					const [participant] = await db
						.select()
						.from(participants)
						.where(eq(participants.id, participantId))
						.limit(1);

					if (participant) {
						// Convert responseMap to the correct type for participants table
						const stringResponses: Record<string, string> = {};
						Object.entries(responseMap).forEach(([key, value]) => {
							stringResponses[key] = String(value);
						});

						await db
							.update(participants)
							.set({
								responses: stringResponses,
								preferenceScores: scores,
								completed: true
							})
							.where(eq(participants.id, participantId));

						// Update progress
						await db
							.update(participantProgress)
							.set({
								responses: responseMap,
								scores,
								completed: true,
								completedAt: new Date().toISOString()
							})
							.where(eq(participantProgress.participantId, participantId));
					}
				} catch (dbError) {
					console.warn('Database completion save failed, continuing:', dbError);
				}
			}

			const finalResult = {
				sessionCode,
				participantId,
				responses: parsedResponses,
				scores,
				totalQuestions,
				answeredQuestions,
				completionRate,
				averageScore: avgScore,
				sentiment,
				completedAt: new Date().toISOString(),
				insights: [
					completionRate >= 90 ? 'Excellent completion rate!' : 'Good participation',
					sentiment === 'positive'
						? 'Overall positive workplace preferences'
						: 'Areas for workplace improvement identified'
				]
			};

			console.log('Quiz completed:', finalResult);

			// Simulate API delay
			await new Promise((resolve) => setTimeout(resolve, 500));

			return {
				success: true,
				result: finalResult
			};
		} catch (error) {
			console.error('Error completing quiz:', error);
			return fail(500, {
				error: 'Failed to complete quiz',
				details: error instanceof Error ? error.message : 'Unknown error'
			});
		}
	}
};

// Load function for the quiz page
export async function load({ params, cookies }: RequestEvent) {
	const sessionCode = params.code;

	// Validate session code format
	if (!sessionCode || !/^[A-Z0-9]+-[0-9]{6}$/.test(sessionCode)) {
		throw redirect(302, '/');
	}

	// Check for participant
	const participantId = cookies.get(`participant_${sessionCode}`);
	if (!participantId) {
		throw redirect(302, `/${sessionCode}`);
	}

	// Verify session exists
	const [session] = await db.select().from(sessions).where(eq(sessions.code, sessionCode)).limit(1);

	if (!session) {
		throw redirect(302, '/');
	}

	// Get participant data
	const [participant] = await db
		.select()
		.from(participants)
		.where(eq(participants.id, participantId))
		.limit(1);

	// Get existing progress
	const [progress] = await db
		.select()
		.from(participantProgress)
		.where(eq(participantProgress.participantId, participantId))
		.limit(1);

	return {
		sessionCode,
		sessionName: session.name,
		participantId,
		participantName: participant?.name || 'Participant',
		questions,
		existingResponses: progress?.responses || participant?.responses || {},
		isCompleted: participant?.completed || false,
		scores: participant?.preferenceScores || null
	};
}
