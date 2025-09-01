/**
 * Simple Analytics Utilities
 * Clean and focused utility functions
 */

export interface AnalyticsData {
	totalParticipants: number;
	completionRate: number;
	averageEngagement: number;
	insights: Array<{
		type: 'success' | 'warning' | 'info';
		title: string;
		description: string;
		metric?: string;
	}>;
}

/**
 * Generate basic analytics summary
 */
export function generateAnalyticsSummary(data: AnalyticsData) {
	return {
		totalParticipants: data.totalParticipants,
		completionRate: data.completionRate,
		averageEngagement: data.averageEngagement,
		keyMetrics: {
			activeParticipants: Math.floor(data.totalParticipants * 0.8),
			completedParticipants: Math.floor((data.totalParticipants * data.completionRate) / 100)
		}
	};
}

/**
 * Calculate simple engagement score
 */
export function calculateEngagementScore(metrics: {
	timeSpent: number;
	questionsAnswered: number;
	totalQuestions: number;
}): number {
	const completionScore = (metrics.questionsAnswered / metrics.totalQuestions) * 100;
	return Math.round(completionScore);
}

/**
 * Generate basic insights from analytics data
 */
export function generateInsights(data: AnalyticsData) {
	const insights = [];

	if (data.completionRate > 80) {
		insights.push({
			type: 'success' as const,
			title: 'High Completion Rate',
			description: `${data.completionRate}% of participants completed the session`,
			metric: `${data.completionRate}% completion`
		});
	}

	if (data.averageEngagement > 70) {
		insights.push({
			type: 'success' as const,
			title: 'Strong Engagement',
			description: `Average engagement score of ${data.averageEngagement}%`,
			metric: `${data.averageEngagement}% engagement`
		});
	}

	return insights;
}
