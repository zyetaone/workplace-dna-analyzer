/**
 * Admin Dashboard Remote Functions
 * Handles admin-specific operations and analytics
 */

import { query, command } from '$app/server';
import { db } from '$lib/server/db';
import { sessions, participants } from '$lib/server/db/schema';
import { eq, and, sql } from 'drizzle-orm';
// Removed validateResponse - returning data directly
import { OPENAI_API_KEY } from '$env/static/private';
import OpenAI from 'openai';
import { getActiveSession } from '$lib/server/db/helpers';
import { RemoteResponse } from '$lib/server/response';
import {
	GetSessionDataInput,
	GenerateInsightsInput,
	GenerateRecommendationsInput,
	GetSessionDataOutput,
	GenerateInsightsOutput,
	GenerateRecommendationsOutput
} from '$lib/server/schemas/admin';
import { AskAssistantInput } from '$lib/server/schemas/assistant';

/**
 * Get comprehensive session data for admin dashboard
 */
export const getSessionData = query(GetSessionDataInput, async ({ sessionCode }) => {
	// Get session
	const baseSession = await getActiveSession(sessionCode);

	// Get session with counts
	const [session] = await db
		.select({
			id: sessions.id,
			code: sessions.code,
			name: sessions.name,
			isActive: sessions.isActive,
			createdAt: sessions.createdAt,
			endedAt: sessions.endedAt,
			activeCount: sql<number>`(
				SELECT COUNT(*) FROM ${participants} 
				WHERE ${participants.sessionId} = ${sessions.id} 
				AND ${participants.completed} = false
			)`,
			completedCount: sql<number>`(
				SELECT COUNT(*) FROM ${participants} 
				WHERE ${participants.sessionId} = ${sessions.id} 
				AND ${participants.completed} = true
			)`
		})
		.from(sessions)
		.where(eq(sessions.id, baseSession.id))
		.limit(1);

	// Get all participants
	const participantsList = await db
		.select()
		.from(participants)
		.where(eq(participants.sessionId, session.id));

	// Calculate analytics
	const completedParticipants = participantsList.filter((p) => p.completed);
	const activeParticipants = participantsList.filter((p) => !p.completed);

	// Calculate average preference scores
	let averagePreferences = { collaboration: 0, formality: 0, tech: 0, wellness: 0 };
	if (completedParticipants.length > 0) {
		const totals = completedParticipants.reduce(
			(acc, p) => {
				if (p.preferenceScores) {
					acc.collaboration += p.preferenceScores.collaboration || 0;
					acc.formality += p.preferenceScores.formality || 0;
					acc.tech += p.preferenceScores.tech || 0;
					acc.wellness += p.preferenceScores.wellness || 0;
				}
				return acc;
			},
			{ collaboration: 0, formality: 0, tech: 0, wellness: 0 }
		);

		averagePreferences = {
			collaboration: Math.round(totals.collaboration / completedParticipants.length),
			formality: Math.round(totals.formality / completedParticipants.length),
			tech: Math.round(totals.tech / completedParticipants.length),
			wellness: Math.round(totals.wellness / completedParticipants.length)
		};
	}

	// Calculate generation distribution
	const generationDistribution = completedParticipants.reduce(
		(acc, p) => {
			if (p.generation) {
				acc[p.generation] = (acc[p.generation] || 0) + 1;
			}
			return acc;
		},
		{} as Record<string, number>
	);

	// Determine workplace DNA based on scores
	const getWorkplaceDNA = () => {
		const scores = averagePreferences;
		if (scores.collaboration >= 60 && scores.wellness >= 60)
			return 'Collaborative & Wellness-Focused';
		if (scores.tech >= 60 && scores.formality < 40) return 'Tech-Forward & Flexible';
		if (scores.formality >= 60 && scores.collaboration < 40) return 'Traditional & Structured';
		if (scores.wellness >= 60 && scores.tech >= 60) return 'Modern & Balanced';
		return 'Balanced Workplace';
	};

	return RemoteResponse.success({
		session,
		participants: participantsList,
		analytics: {
			activeCount: activeParticipants.length,
			completedCount: completedParticipants.length,
			responseRate:
				participantsList.length > 0
					? Math.round((completedParticipants.length / participantsList.length) * 100)
					: 0,
			averagePreferences,
			generationDistribution,
			workplaceDNA: getWorkplaceDNA()
		}
	});
});

/**
 * Generate AI-powered insights for a session
 */
export const generateInsights = command(
	'unchecked',
	async ({ sessionId }: { sessionId: string }) => {
		if (!OPENAI_API_KEY) {
			return RemoteResponse.success({
				success: true,
				insights: 'AI insights require OpenAI API key configuration.'
			});
		}

		try {
			// Get session and participants
			const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);

			if (!session) {
				throw new Error('Session not found');
			}

			const completedParticipants = await db
				.select()
				.from(participants)
				.where(and(eq(participants.sessionId, sessionId), eq(participants.completed, true)));

			if (completedParticipants.length === 0) {
				return RemoteResponse.success({
					success: true,
					insights:
						'No completed responses yet. Insights will be available once participants complete the quiz.'
				});
			}

			// Calculate aggregated data
			const generationBreakdown = completedParticipants.reduce(
				(acc, p) => {
					if (p.generation) {
						acc[p.generation] = (acc[p.generation] || 0) + 1;
					}
					return acc;
				},
				{} as Record<string, number>
			);

			const avgScores = completedParticipants.reduce(
				(acc, p) => {
					if (p.preferenceScores) {
						acc.collaboration += p.preferenceScores.collaboration || 0;
						acc.formality += p.preferenceScores.formality || 0;
						acc.tech += p.preferenceScores.tech || 0;
						acc.wellness += p.preferenceScores.wellness || 0;
					}
					acc.count++;
					return acc;
				},
				{ collaboration: 0, formality: 0, tech: 0, wellness: 0, count: 0 }
			);

			const averages = {
				collaboration: Math.round(avgScores.collaboration / avgScores.count),
				formality: Math.round(avgScores.formality / avgScores.count),
				tech: Math.round(avgScores.tech / avgScores.count),
				wellness: Math.round(avgScores.wellness / avgScores.count)
			};

			// Generate insights using OpenAI
			const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

			const prompt = `Analyze this workplace preference data and provide 3-4 key insights:

Session: ${session.name}
Total Responses: ${completedParticipants.length}

Generation Breakdown:
${Object.entries(generationBreakdown)
	.map(([gen, count]) => `- ${gen}: ${count}`)
	.join('\n')}

Average Preference Scores (0-100):
- Collaboration: ${averages.collaboration}%
- Formality: ${averages.formality}%
- Technology: ${averages.tech}%
- Wellness: ${averages.wellness}%

Provide actionable insights about:
1. The dominant workplace culture preferences
2. Generational differences if notable
3. Areas of strong consensus or divergence
4. Recommendations for workplace design

Keep insights concise and practical.`;

			const completion = await openai.chat.completions.create({
				model: 'gpt-4-turbo-preview',
				messages: [
					{
						role: 'system',
						content:
							'You are a workplace culture analyst providing insights based on preference survey data.'
					},
					{
						role: 'user',
						content: prompt
					}
				],
				temperature: 0.7,
				max_tokens: 500
			});

			const insights =
				completion.choices[0]?.message?.content || 'Unable to generate insights at this time.';

			return RemoteResponse.success(
				{ insights },
				{ invalidate: [`admin:session:${session.code}`] }
			);
		} catch (error) {
			console.error('Error generating insights:', error);
			return RemoteResponse.success({
				success: true,
				insights: 'AI insights temporarily unavailable. Please try again later.'
			});
		}
	}
);

/**
 * Generate AI-powered recommendations for workplace improvements
 */
export const generateRecommendations = command(
	'unchecked',
	async ({ sessionId, focusArea }: { sessionId: string; focusArea?: string }) => {
		if (!OPENAI_API_KEY) {
			return RemoteResponse.success({
				success: true,
				recommendations: 'AI recommendations require OpenAI API key configuration.'
			});
		}

		try {
			// Get session data
			const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);

			if (!session) {
				throw new Error('Session not found');
			}

			const completedParticipants = await db
				.select()
				.from(participants)
				.where(and(eq(participants.sessionId, sessionId), eq(participants.completed, true)));

			if (completedParticipants.length === 0) {
				return RemoteResponse.success({
					success: true,
					recommendations: 'No data available yet for recommendations.'
				});
			}

			// Calculate average scores
			const avgScores = completedParticipants.reduce(
				(acc, p) => {
					if (p.preferenceScores) {
						acc.collaboration += p.preferenceScores.collaboration || 0;
						acc.formality += p.preferenceScores.formality || 0;
						acc.tech += p.preferenceScores.tech || 0;
						acc.wellness += p.preferenceScores.wellness || 0;
					}
					acc.count++;
					return acc;
				},
				{ collaboration: 0, formality: 0, tech: 0, wellness: 0, count: 0 }
			);

			const averages = {
				collaboration: Math.round(avgScores.collaboration / avgScores.count),
				formality: Math.round(avgScores.formality / avgScores.count),
				tech: Math.round(avgScores.tech / avgScores.count),
				wellness: Math.round(avgScores.wellness / avgScores.count)
			};

			// Generate recommendations using OpenAI
			const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

			const prompt = `Based on these workplace preference scores, provide specific recommendations for ${focusArea || 'overall workplace improvements'}:

Average Preference Scores (0-100):
- Collaboration: ${averages.collaboration}%
- Formality: ${averages.formality}%
- Technology: ${averages.tech}%
- Wellness: ${averages.wellness}%

Provide 4-5 specific, actionable recommendations that:
1. Build on the strong preferences (scores above 60)
2. Address the weak areas (scores below 40)
3. Are practical and implementable
4. Consider cost-effectiveness

Format as a bulleted list with brief explanations.`;

			const completion = await openai.chat.completions.create({
				model: 'gpt-4-turbo-preview',
				messages: [
					{
						role: 'system',
						content:
							'You are a workplace transformation consultant providing practical recommendations.'
					},
					{
						role: 'user',
						content: prompt
					}
				],
				temperature: 0.7,
				max_tokens: 600
			});

			const recommendations =
				completion.choices[0]?.message?.content ||
				'Unable to generate recommendations at this time.';

			return RemoteResponse.success(
				{
					success: true,
					recommendations
				},
				{ invalidate: [`admin:session:${session.code}`] }
			);
		} catch (error) {
			console.error('Error generating recommendations:', error);
			return RemoteResponse.success({
				success: true,
				recommendations: 'AI recommendations temporarily unavailable. Please try again later.'
			});
		}
	}
);

/**
 * Ask Assistant (non-streaming) via OpenAI
 * Uses optional sessionId to add minimal context.
 */
export const askAssistant = command(
	'unchecked',
	async ({
		sessionId,
		prompt,
		context = {}
	}: {
		sessionId?: string;
		prompt: string;
		context?: any;
	}) => {
		if (!OPENAI_API_KEY) {
			return RemoteResponse.success({
				success: true,
				answer: 'Assistant requires OpenAI API key configuration.'
			});
		}

		try {
			// Build context if sessionId provided (lightweight)
			let sessionName = '';
			let participantCount = 0;
			if (sessionId) {
				const [session] = await db
					.select()
					.from(sessions)
					.where(eq(sessions.id, sessionId))
					.limit(1);
				if (session) {
					sessionName = session.name;
					const [{ count }] = await db
						.select({ count: sql<number>`COUNT(*)` })
						.from(participants)
						.where(eq(participants.sessionId, session.id));
					participantCount = Number(count || 0);
				}
			}

			const sys = `You are an assistant for a workplace insights platform. Be concise and practical.`;
			const ctxLines = [
				sessionName ? `Session: ${sessionName}` : '',
				participantCount ? `Participants: ${participantCount}` : ''
			]
				.filter(Boolean)
				.join('\n');
			const extra = Object.keys(context || {}).length
				? `\nContext JSON: ${JSON.stringify(context).slice(0, 1500)}`
				: '';

			const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
			const completion = await openai.chat.completions.create({
				model: 'gpt-4o-mini',
				messages: [
					{ role: 'system', content: sys },
					{ role: 'user', content: `${ctxLines}\n\nQuestion: ${prompt}${extra}` }
				],
				temperature: 0.7,
				max_tokens: 500
			});

			const answer = completion.choices[0]?.message?.content || 'No answer available.';
			return RemoteResponse.success({ success: true, answer });
		} catch (error) {
			console.error('askAssistant error:', error);
			return RemoteResponse.success({
				success: false,
				answer: 'Assistant temporarily unavailable.'
			});
		}
	}
);
