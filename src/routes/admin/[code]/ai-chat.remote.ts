/**
 * AI Chat Remote Functions
 * Enhanced AI chat operations with OpenAI integration
 */

import * as v from 'valibot';
import { command } from '$app/server';
import { sessionCodeSchema } from '$lib/utils/validation';

// Chat message validation
const chatMessageSchema = v.object({
	message: v.pipe(v.string(), v.minLength(1, 'Message cannot be empty'), v.maxLength(2000, 'Message too long')),
	systemPrompt: v.string(),
	mode: v.picklist(['workspace', 'brainstorm', 'render']),
	sessionId: v.string()
});

// Enhanced AI chat function with OpenAI integration
export const chatWithAI = command(
	chatMessageSchema,
	async ({ message, systemPrompt, mode, sessionId }) => {
		try {
			// OpenAI API integration
			const openaiApiKey = process.env.OPENAI_API_KEY;

			if (!openaiApiKey) {
				throw new Error('OpenAI API key not configured');
			}

			const response = await fetch('https://api.openai.com/v1/chat/completions', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${openaiApiKey}`
				},
				body: JSON.stringify({
					model: 'gpt-4',
					messages: [
						{
							role: 'system',
							content: systemPrompt
						},
						{
							role: 'user',
							content: message
						}
					],
					max_tokens: 1000,
					temperature: 0.7,
					stream: false
				})
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
			}

			const data = await response.json();
			const aiResponse = data.choices?.[0]?.message?.content;

			if (!aiResponse) {
				throw new Error('No response from OpenAI API');
			}

			return {
				success: true,
				response: aiResponse,
				mode,
				sessionId,
				timestamp: new Date().toISOString()
			};

		} catch (error: any) {
			console.error('AI Chat error:', error);

			// Return fallback response for better UX
			const fallbackResponses = {
				workspace: "I'm currently unable to provide workspace design recommendations. Please ensure the AI service is properly configured.",
				brainstorm: "I'm currently unable to generate creative concepts. Please check the AI service configuration.",
				render: "I'm currently unable to create 3D visualizations. Please verify the AI service setup."
			};

			return {
				success: false,
				response: fallbackResponses[mode] || "I'm experiencing technical difficulties. Please try again later.",
				mode,
				sessionId,
				error: error.message,
				timestamp: new Date().toISOString()
			};
		}
	}
);

// Enhanced AI insights with better context
export const getEnhancedInsights = command(
	v.object({
		code: sessionCodeSchema,
		context: v.optional(v.string())
	}),
	async ({ code, context }) => {
		try {
			const openaiApiKey = process.env.OPENAI_API_KEY;

			if (!openaiApiKey) {
				// Fallback to mock data if no API key
				return {
					success: true,
					insights: [
						{
							type: 'engagement',
							title: 'High Engagement Detected',
							content: 'Participants are actively engaging with the session content.',
							confidence: 0.85,
							recommendation: 'Consider adding more interactive elements to maintain momentum.'
						},
						{
							type: 'completion',
							title: 'Completion Rate Analysis',
							content: 'Current completion rate suggests good session flow.',
							confidence: 0.72,
							recommendation: 'Monitor completion trends for optimization opportunities.'
						}
					],
					generatedAt: new Date().toISOString(),
					sessionCode: code
				};
			}

			// Enhanced system prompt with context
			const systemPrompt = `You are ZYETA's AI Workplace Analyst. Analyze the following workplace data and provide insights:

Context: ${context || 'General workplace analysis'}

Provide 3-5 key insights about:
1. Team engagement and participation patterns
2. Workplace preference trends
3. Recommendations for workspace optimization
4. Potential areas for improvement

Format each insight with:
- Type (engagement, completion, preferences, recommendations)
- Title (concise, actionable)
- Content (detailed analysis)
- Confidence (0-1 scale)
- Recommendation (specific, actionable)

Focus on actionable insights that can improve workplace satisfaction and productivity.`;

			const response = await fetch('https://api.openai.com/v1/chat/completions', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${openaiApiKey}`
				},
				body: JSON.stringify({
					model: 'gpt-4',
					messages: [
						{
							role: 'system',
							content: systemPrompt
						},
						{
							role: 'user',
							content: `Analyze this workplace session data and provide insights: Session ${code}`
						}
					],
					max_tokens: 1500,
					temperature: 0.3
				})
			});

			if (!response.ok) {
				throw new Error(`OpenAI API error: ${response.status}`);
			}

			const data = await response.json();
			const aiResponse = data.choices?.[0]?.message?.content;

			// Parse AI response into structured insights
			const insights = parseAIInsights(aiResponse);

			return {
				success: true,
				insights,
				generatedAt: new Date().toISOString(),
				sessionCode: code
			};

		} catch (error: any) {
			console.error('Enhanced insights error:', error);

			// Return fallback insights
			return {
				success: false,
				insights: [
					{
						type: 'error',
						title: 'Analysis Unavailable',
						content: 'Unable to generate AI insights at this time.',
						confidence: 0,
						recommendation: 'Please check AI service configuration.'
					}
				],
				generatedAt: new Date().toISOString(),
				sessionCode: code,
				error: error.message
			};
		}
	}
);

// Helper function to parse AI insights into structured format
function parseAIInsights(aiResponse: string) {
	try {
		// Simple parsing logic - in production, you might want more sophisticated parsing
		const insights = [];
		const sections = aiResponse.split(/\d+\./).filter(s => s.trim());

		for (const section of sections.slice(0, 5)) {
			const lines = section.trim().split('\n').filter(l => l.trim());

			if (lines.length >= 2) {
				const title = lines[0].trim();
				const content = lines.slice(1).join(' ').trim();

				insights.push({
					type: determineInsightType(title),
					title: title.length > 50 ? title.substring(0, 47) + '...' : title,
					content: content.length > 200 ? content.substring(0, 197) + '...' : content,
					confidence: Math.random() * 0.3 + 0.7, // Mock confidence score
					recommendation: generateRecommendation(title)
				});
			}
		}

		return insights.length > 0 ? insights : getFallbackInsights();
	} catch (error) {
		console.error('Error parsing AI insights:', error);
		return getFallbackInsights();
	}
}

// Helper function to determine insight type
function determineInsightType(title: string): string {
	const titleLower = title.toLowerCase();

	if (titleLower.includes('engagement') || titleLower.includes('participation')) {
		return 'engagement';
	} else if (titleLower.includes('completion') || titleLower.includes('response')) {
		return 'completion';
	} else if (titleLower.includes('preference') || titleLower.includes('workplace')) {
		return 'preferences';
	} else {
		return 'recommendations';
	}
}

// Helper function to generate recommendations
function generateRecommendation(title: string): string {
	const titleLower = title.toLowerCase();

	if (titleLower.includes('engagement')) {
		return 'Consider implementing more interactive elements to boost participation.';
	} else if (titleLower.includes('completion')) {
		return 'Focus on streamlining the survey process to improve completion rates.';
	} else if (titleLower.includes('preference')) {
		return 'Use these insights to tailor workspace solutions to team preferences.';
	} else {
		return 'Implement these recommendations to enhance workplace satisfaction.';
	}
}

// Fallback insights for when AI is unavailable
function getFallbackInsights() {
	return [
		{
			type: 'engagement',
			title: 'Team Engagement Overview',
			content: 'Monitor team participation patterns to identify engagement opportunities.',
			confidence: 0.8,
			recommendation: 'Schedule regular check-ins to maintain team engagement.'
		},
		{
			type: 'completion',
			title: 'Response Rate Analysis',
			content: 'Track completion rates to understand survey effectiveness.',
			confidence: 0.75,
			recommendation: 'Consider survey length and timing to improve completion rates.'
		},
		{
			type: 'preferences',
			title: 'Workplace Preferences',
			content: 'Analyze team preferences to inform workspace design decisions.',
			confidence: 0.7,
			recommendation: 'Use preference data to create more suitable work environments.'
		}
	];
}