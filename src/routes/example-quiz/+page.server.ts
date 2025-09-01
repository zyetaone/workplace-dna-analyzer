/**
 * Server actions for the example quiz
 * Demonstrates SvelteKit form actions with the Quiz component
 */

import type { Actions } from './$types';
import { fail } from '@sveltejs/kit';

export const actions: Actions = {
	// Save individual quiz response
	saveResponse: async ({ request, url }) => {
		try {
			const formData = await request.formData();

			const questionId = formData.get('questionId') as string;
			const response = formData.get('response') as string;
			const participantId = formData.get('participantId') as string;
			const sessionId = formData.get('sessionId') as string;

			// Validate required fields
			if (!questionId || !response || !participantId || !sessionId) {
				return fail(400, {
					error: 'Missing required fields',
					values: { questionId, response, participantId, sessionId }
				});
			}

			// Parse response if it's JSON
			let parsedResponse;
			try {
				parsedResponse = JSON.parse(response);
			} catch {
				parsedResponse = response;
			}

			// Here you would typically save to database
			console.log('Saving quiz response:', {
				questionId,
				response: parsedResponse,
				participantId,
				sessionId,
				timestamp: new Date().toISOString()
			});

			// Simulate API delay
			await new Promise((resolve) => setTimeout(resolve, 200));

			// Return success
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
	completeQuiz: async ({ request }) => {
		try {
			const formData = await request.formData();

			const sessionId = formData.get('sessionId') as string;
			const participantId = formData.get('participantId') as string;
			const responses = formData.get('responses') as string;

			if (!sessionId || !participantId || !responses) {
				return fail(400, {
					error: 'Missing required fields for quiz completion'
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

			// Calculate results (simplified)
			const totalQuestions = parsedResponses.length;
			const answeredQuestions = parsedResponses.filter((r: any) => r.value).length;
			const completionRate = Math.round((answeredQuestions / totalQuestions) * 100);

			// Calculate score (simplified)
			let totalScore = 0;
			parsedResponses.forEach((response: any) => {
				if (typeof response.value === 'number') {
					totalScore += response.value;
				} else if (response.value === 'great' || response.value === 'good') {
					totalScore += 4;
				} else if (response.value === 'okay') {
					totalScore += 3;
				} else {
					totalScore += 1;
				}
			});

			const averageScore = Math.round(totalScore / totalQuestions);

			// Determine sentiment
			let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
			if (averageScore >= 4) sentiment = 'positive';
			else if (averageScore <= 2) sentiment = 'negative';

			// Here you would save final results to database
			const finalResult = {
				sessionId,
				participantId,
				responses: parsedResponses,
				totalQuestions,
				answeredQuestions,
				completionRate,
				averageScore,
				sentiment,
				completedAt: new Date().toISOString(),
				insights: [
					completionRate >= 90 ? 'Excellent completion rate!' : 'Good participation',
					sentiment === 'positive'
						? 'Overall positive feedback'
						: 'Areas for improvement identified'
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

// Load function for the page
export async function load({ url }) {
	// You could load quiz configuration from database here
	return {
		quizTitle: 'Example Quiz',
		sessionId: url.searchParams.get('session') || 'example-session',
		participantId: 'example-participant'
	};
}
