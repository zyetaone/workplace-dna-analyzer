/**
 * AI Remote Functions for Session Analytics
 * Server-side AI operations for insights and recommendations using OpenAI
 */

import * as v from 'valibot';
import { query } from '$app/server';
import { validateInput } from '$lib/server/schema-adapter';
import { db } from '$lib/server/db';
import { sessions, participants } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import OpenAI from 'openai';
import { analyzeWorkplaceData } from '$lib/utils/analysis';
import type { Generation } from '$lib/questions';
import { OPENAI_API_KEY } from '$env/static/private';

// Initialize OpenAI client with error handling
let openai: OpenAI | null = null;

try {
	// Use SvelteKit environment variable import
	const apiKey = OPENAI_API_KEY;
	if (!apiKey || apiKey.trim() === '') {
		console.warn('⚠️ OPENAI_API_KEY not found. AI features will be disabled.');
	} else {
		openai = new OpenAI({ apiKey });
		console.log('✅ OpenAI client initialized successfully');
	}
} catch (error) {
	console.error('❌ Failed to initialize OpenAI client:', error);
}

// Get workplace analysis data for AI prompts - OPTIMIZED
async function getWorkplaceAnalysisData(sessionCode: string) {
	// Use consolidated data fetching to eliminate redundant queries
	const { getSessionAnalysis } = await import('../../data.remote');
	const sessionData = await getSessionAnalysis({ code: sessionCode });

	const { session, participants: participantsResult } = sessionData;

	const completedParticipants = participantsResult.filter((p) => p.completed);

	if (completedParticipants.length === 0) {
		throw new Error('No completed participants to analyze');
	}

	// Calculate average scores
	const totals = { collaboration: 0, formality: 0, tech: 0, wellness: 0 };
	let generationBreakdown: Record<string, number> = {};

	completedParticipants.forEach((p) => {
		if (p.preferenceScores) {
			const scores = p.preferenceScores as any;
			totals.collaboration += scores.collaboration || 0;
			totals.formality += scores.formality || 0;
			totals.tech += scores.tech || scores.technology || 0;
			totals.wellness += scores.wellness || 0;
		}

		const gen = p.generation || 'Unknown';
		generationBreakdown[gen] = (generationBreakdown[gen] || 0) + 1;
	});

	const averages = {
		collaboration: Math.round(totals.collaboration / completedParticipants.length),
		formality: Math.round(totals.formality / completedParticipants.length),
		tech: Math.round(totals.tech / completedParticipants.length),
		wellness: Math.round(totals.wellness / completedParticipants.length)
	};

	return {
		session,
		totalParticipants: participantsResult.length,
		completedParticipants: completedParticipants.length,
		completionRate: Math.round((completedParticipants.length / participantsResult.length) * 100),
		averageScores: averages,
		generationBreakdown,
		sessionDuration: new Date().getTime() - new Date(session.createdAt).getTime()
	};
}

// Generate AI insights using OpenAI chat completions API
export const getStreamingInsights = query('unchecked', async (input) => {
	const {
		code,
		_systemPrompt,
		_userMessage
	}: {
		code: string;
		_systemPrompt?: string;
		_userMessage?: string;
	} = validateInput(
		v.object({
			code: v.string(),
			_service: v.optional(v.string()),
			_systemPrompt: v.optional(v.string()),
			_userMessage: v.optional(v.string())
		}),
		input
	);

	// AI insights generation for session

	try {
		// Check if OpenAI client is available
		if (!openai) {
			console.warn('⚠️ OpenAI client not available, returning mock insights');
			return {
				insights: [
					{
						type: 'engagement',
						title: 'AI Service Unavailable',
						content:
							'OpenAI API key not configured. Please add OPENAI_API_KEY to your environment variables.',
						confidence: 0.5,
						recommendation: 'Configure your OpenAI API key to enable AI-powered insights.'
					}
				],
				generatedAt: new Date().toISOString(),
				sessionCode: code,
				error: 'OpenAI API key not configured'
			};
		}

		// Get comprehensive workplace analysis data
		const sessionResult = await db.select().from(sessions).where(eq(sessions.code, code)).limit(1);

		if (!sessionResult[0]) {
			throw new Error('Session not found');
		}

		const session = sessionResult[0];
		const participantsResult = await db
			.select()
			.from(participants)
			.where(eq(participants.sessionId, session.id));

		// Convert to analysis format
		const participantsForAnalysis = participantsResult.map((p) => ({
			id: p.id,
			name: p.name || 'Anonymous',
			generation: (p.generation || 'Millennials') as Generation,
			responses: p.responses || {},
			preferenceScores: p.preferenceScores || {
				collaboration: 5,
				formality: 5,
				tech: 5,
				wellness: 5
			},
			completed: p.completed
		}));

		const analysisData = analyzeWorkplaceData(participantsForAnalysis);
		console.log('📊 Comprehensive analysis completed:', {
			totalParticipants: analysisData.totalParticipants,
			completedParticipants: analysisData.completedParticipants,
			completionRate: analysisData.completionRate,
			generations: analysisData.generationBreakdown.length,
			concepts: analysisData.concepts.length
		});

		// Create AI prompt - use custom prompt if provided, otherwise use analysis data
		let prompt: string;

		if (_systemPrompt && _userMessage) {
			// Custom AI assistant mode for ZyetaI
			prompt = `${_systemPrompt}

User Query: ${_userMessage}

Please provide a helpful, detailed response based on ZYETA's expertise in workplace optimization. Focus on practical, actionable advice that aligns with workplace preferences and needs. Consider the session data and participant insights when relevant.`;
		} else {
			// Default analysis mode
			prompt = `Analyze this workplace preference assessment data and provide 3 key insights in valid JSON format:

Session Data:
- Total Participants: ${analysisData.totalParticipants}
- Completed Assessments: ${analysisData.completedParticipants}
- Completion Rate: ${analysisData.completionRate}%
- Dominant Generation: ${analysisData.dominantGeneration}

Average Workplace Preferences (0-100 scale):
- Collaboration: ${analysisData.averageScores.collaboration}
- Formality: ${analysisData.averageScores.formality}
- Technology Adoption: ${analysisData.averageScores.tech}
- Wellness Focus: ${analysisData.averageScores.wellness}

Generation Breakdown:
${analysisData.generationBreakdown
	.map((gen) => `- ${gen.generation}: ${gen.count} participants (${gen.percentage}%)`)
	.join('\n')}

Please provide exactly 3 insights in this JSON format:
[
  {
    "type": "engagement|completion|timing|workplace|recommendation",
    "title": "Brief title (max 50 chars)",
    "content": "Detailed analysis (max 200 chars)",
    "confidence": 0.85,
    "recommendation": "Actionable recommendation (max 150 chars)"
  }
]

Focus on data-driven insights about workplace culture, team dynamics, and actionable recommendations.`;
		}

		// Call OpenAI API using chat completions
		const response = await openai.chat.completions.create({
			model: 'gpt-4',
			messages: [
				{
					role: 'system',
					content:
						'You are a workplace psychology expert analyzing team preference data. Always respond with valid JSON only, no additional text or formatting.'
				},
				{
					role: 'user',
					content: prompt
				}
			],
			max_tokens: 1200,
			temperature: 0.7
		});

		// Extract insights from the response
		let insights = [];

		if (response.choices[0]?.message?.content) {
			try {
				const content = response.choices[0].message.content.trim();
				const parsed = JSON.parse(content);
				insights = parsed.insights || [];
			} catch (parseError) {
				console.warn('Failed to parse AI response:', parseError);
				// Fallback to basic insights
				insights = [
					{
						type: 'engagement',
						title: 'Data Analysis Complete',
						content: `Successfully analyzed ${analysisData.completedParticipants} participant responses.`,
						confidence: 0.9,
						recommendation:
							'Review the detailed insights above for team optimization opportunities.'
					}
				];
			}
		} else {
			// Fallback if no content
			insights = [
				{
					type: 'engagement',
					title: 'Analysis Complete',
					content: `Processed ${analysisData.completedParticipants} workplace preference assessments.`,
					confidence: 0.85,
					recommendation: 'Use these insights to optimize team collaboration and workplace culture.'
				}
			];
		}

		return {
			insights,
			generatedAt: new Date().toISOString(),
			sessionCode: code
		};
	} catch (error) {
		console.error('AI Insights Error:', error);

		// Graceful fallback with basic insights
		return {
			insights: [
				{
					type: 'engagement',
					title: 'Analysis Temporarily Unavailable',
					content: 'AI insights are currently unavailable. Basic analytics are still functioning.',
					confidence: 0.5,
					recommendation:
						'Please try again in a few moments or check your OpenAI API configuration.'
				}
			],
			generatedAt: new Date().toISOString(),
			sessionCode: code,
			error: error instanceof Error ? error.message : 'Unknown error'
		};
	}
});

// Generate session summary using OpenAI
export const generateSessionSummary = query('unchecked', async (input) => {
	const { code } = validateInput(v.object({ code: v.string() }), input);

	try {
		// Check if OpenAI client is available
		if (!openai) {
			console.warn('OpenAI client not available, returning mock summary');
			return {
				summary: 'AI-powered session summary unavailable. OpenAI API key not configured.',
				keyMetrics: [
					'AI service not configured',
					'Please add OPENAI_API_KEY to environment',
					'Basic analytics still available'
				],
				recommendations: [
					'Configure OpenAI API key for AI insights',
					'Check .env file for OPENAI_API_KEY',
					'Contact administrator for API key setup'
				],
				generatedAt: new Date().toISOString(),
				error: 'OpenAI API key not configured'
			};
		}

		// Get comprehensive workplace analysis data
		const sessionResult = await db.select().from(sessions).where(eq(sessions.code, code)).limit(1);

		if (!sessionResult[0]) {
			throw new Error('Session not found');
		}

		const session = sessionResult[0];
		const participantsResult = await db
			.select()
			.from(participants)
			.where(eq(participants.sessionId, session.id));

		// Convert to analysis format
		const participantsForAnalysis = participantsResult.map((p) => ({
			id: p.id,
			name: p.name || 'Anonymous',
			generation: (p.generation || 'Millennials') as Generation,
			responses: p.responses || {},
			preferenceScores: p.preferenceScores || {
				collaboration: 5,
				formality: 5,
				tech: 5,
				wellness: 5
			},
			completed: p.completed
		}));

		const analysisData = analyzeWorkplaceData(participantsForAnalysis);

		// Create AI prompt for summary
		const prompt = `Create a comprehensive session summary for this workplace preference assessment. Return valid JSON only:

Session Overview:
- Session: Workplace Preference Assessment
- Total Participants: ${analysisData.totalParticipants}
- Completed Assessments: ${analysisData.completedParticipants}
- Completion Rate: ${analysisData.completionRate}%
- Dominant Generation: ${analysisData.dominantGeneration}

Workplace Preferences (Average Scores):
- Collaboration: ${analysisData.averageScores.collaboration}/100
- Formality: ${analysisData.averageScores.formality}/100
- Technology: ${analysisData.averageScores.tech}/100
- Wellness: ${analysisData.averageScores.wellness}/100

Demographics:
${Object.entries(analysisData.generationBreakdown)
	.map(([gen, count]) => `- ${gen}: ${count} participants`)
	.join('\n')}

Return exactly this JSON structure:
{
  "summary": "2-3 sentence executive summary of key findings",
  "keyMetrics": ["3-5 bullet points of important metrics"],
  "recommendations": ["3-5 actionable recommendations for team management"]
}

Focus on workplace culture insights, team dynamics, and practical applications.`;

		// Call OpenAI API
		const response = await openai.chat.completions.create({
			model: 'gpt-4',
			messages: [
				{
					role: 'system',
					content:
						'You are a workplace consultant creating executive summaries for team assessments. Always respond with valid JSON only, no additional text.'
				},
				{
					role: 'user',
					content: prompt
				}
			],
			max_tokens: 1000,
			temperature: 0.6
		});

		// Extract summary from response
		let summary: string | undefined;
		let keyMetrics: any[] | undefined;
		let recommendations: string[] | undefined;

		if (response.choices[0]?.message?.content) {
			try {
				const content = response.choices[0].message.content.trim();
				const parsed = JSON.parse(content);
				summary = parsed.summary;
				keyMetrics = parsed.keyMetrics;
				recommendations = parsed.recommendations;
			} catch (parseError) {
				console.warn('Failed to parse AI summary response:', parseError);
			}
		}

		// Fallback if parsing failed
		if (!summary) {
			summary = `Workplace preference assessment completed with ${analysisData.completionRate}% participation rate. Key findings show team preferences for collaboration (${analysisData.averageScores.collaboration}/100) and technology adoption (${analysisData.averageScores.tech}/100).`;
			keyMetrics = [
				`${analysisData.completionRate}% assessment completion rate`,
				`Average collaboration score: ${analysisData.averageScores.collaboration}/100`,
				`Average technology adoption: ${analysisData.averageScores.tech}/100`,
				`${analysisData.completedParticipants} participants analyzed`,
				`Dominant generation: ${analysisData.dominantGeneration}`
			];
			recommendations = [
				'Leverage high collaboration preferences for team-building initiatives',
				'Consider technology upgrades based on adoption scores',
				'Address wellness preferences in workplace policies',
				'Monitor formality preferences for communication guidelines',
				'Schedule follow-up sessions to track preference changes'
			];
		}

		return {
			summary,
			keyMetrics,
			recommendations,
			generatedAt: new Date().toISOString()
		};
	} catch (error) {
		console.error('AI Summary Error:', error);

		// Graceful fallback
		return {
			summary: 'Session summary temporarily unavailable due to AI service issues.',
			keyMetrics: ['Basic analytics still available', 'Check OpenAI API configuration'],
			recommendations: ['Verify API key configuration', 'Try again in a few moments'],
			generatedAt: new Date().toISOString(),
			error: error instanceof Error ? error.message : 'Unknown error'
		};
	}
});
